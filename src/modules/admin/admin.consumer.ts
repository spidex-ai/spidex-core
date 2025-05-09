import { CRAWL_DOCS_QUEUE_NAME } from '@constants/queue.constant';
import { CrawlDocsEntity } from '@database/entities/crawl-docs.entity';
import { WorkerHost } from '@nestjs/bullmq';
import { Processor } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import FirecrawlApp, { FirecrawlDocument } from '@mendable/firecrawl-js';
import { openai } from '@ai-sdk/openai';
import { embed, generateText } from 'ai';
import { KnowledgeInput } from './types';
import { addKnowledge } from 'external/db/services';
import { CrawlDocsRepository } from '@database/repositories/crawl-docs.repository';

@Injectable()
@Processor(CRAWL_DOCS_QUEUE_NAME)
export class AdminConsumer extends WorkerHost {
  private readonly firecrawl: FirecrawlApp;
  private readonly logger = new Logger(AdminConsumer.name);
  constructor(private readonly crawlDocsRepository: CrawlDocsRepository) {
    super();
    this.firecrawl = new FirecrawlApp({
      apiKey: process.env.FIRECRAWL_API_KEY,
    });
  }

  async process(job: Job<CrawlDocsEntity>): Promise<void> {
    this.logger.log(`[CRAWL_DOCS_QUEUE] Processing crawl docs: ${job.data.url}`);
    const { id, url, name } = job.data;
    try {
      const crawlResponse = await this.firecrawl.asyncCrawlUrl(url, {
        limit: 500,
        maxDepth: 10,
        includePaths: [],
        excludePaths: [],
      });
      console.log('🚀 ~ AdminConsumer ~ process ~ crawlResponse:', crawlResponse);

      if (!crawlResponse.success) {
        this.logger.error(crawlResponse.error);
        return null;
      }

      let status = 'scraping';
      let docs: FirecrawlDocument<undefined>[] = [];
      do {
        console.log('🚀 ~ AdminConsumer ~ process ~ status:', status);
        const statusResponse: any = await this.firecrawl.checkCrawlStatus(crawlResponse.id);

        console.log(
          '🚀 ~ POST ~ statusResponse:',
          statusResponse.success,
          statusResponse.total,
          statusResponse.completed,
          statusResponse.creditsUsed,
        );
        if (!statusResponse.success) {
          this.logger.error(statusResponse.error);
          return null;
        }

        status = statusResponse.status;
        if (statusResponse.status === 'completed') {
          docs = statusResponse.data;
        }
        await new Promise(resolve => setTimeout(resolve, 10000));
      } while (status === 'scraping');

      if (docs.length === 0) {
        this.logger.error('No documents found');
        return null;
      }
      const knowledge = await Promise.all(
        docs.map(async doc => {
          if (!doc.markdown) {
            return;
          }
          const { text: summary } = await generateText({
            model: openai('gpt-4o-mini'),
            prompt: `Summarize the following documentation page in 1 sentence: ${doc.markdown}. This will be used to search for relevant knowledge. Do not include any other information.`,
          });
          const { embedding: summaryEmbedding } = await embed({
            model: openai.embedding('text-embedding-3-small'),
            value: summary,
          });
          const knowledgeInputs: KnowledgeInput[] = [
            {
              baseUrl: url,
              name,
              url: doc.metadata?.url,
              title: doc.metadata?.title,
              description: doc.metadata?.description,
              favicon: doc.metadata?.favicon,
              markdown: doc.markdown,
              summary,
              summaryEmbedding,
            },
          ];
          for await (const knowledgeInput of knowledgeInputs) {
            await addKnowledge(knowledgeInput);
          }
          return true;
        }),
      );

      await this.crawlDocsRepository.update(id, {
        status: 'completed',
      });

      return null;
    } catch (error) {
      this.logger.error(error);
      await this.crawlDocsRepository.update(id, {
        status: 'failed',
      });
      return null;
    }
  }
}
