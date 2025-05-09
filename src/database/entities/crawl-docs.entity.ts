import { BaseExcludeDeletedAtEntity } from "@database/common/base.entity";
import { Column, Entity } from "typeorm";

@Entity('crawl_docs')
export class CrawlDocsEntity extends BaseExcludeDeletedAtEntity {
    @Column({ type: 'varchar', name: 'name', nullable: true, default: null })
    name: string

    @Column({ type: 'varchar', name: 'category', nullable: true, default: null })
    category: string

    @Column({ type: 'varchar', name: 'url' })
    url: string

    @Column({ type: 'varchar', name: 'status', default: 'pending' })
    status: string
}