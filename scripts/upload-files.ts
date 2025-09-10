#!/usr/bin/env ts-node

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { MediasService } from '../src/modules/medias/medias.service';
import * as fs from 'fs';
import * as path from 'path';
import { initializeTransactionalContext } from 'typeorm-transactional';

initializeTransactionalContext();

/**
 * Interface for upload result
 */
interface UploadResult {
  filename: string;
  url?: string;
  error?: string;
  status: 'success' | 'error' | 'skipped';
}

/**
 * Script to upload files from the data folder using the MediasService
 */
async function uploadFiles(folderPath: string = 'data', filePattern?: string) {
  console.log('🚀 Starting File Upload Script...');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  const mediasService = app.get(MediasService);

  try {
    // Resolve the folder path
    const dataFolderPath = path.resolve(process.cwd(), folderPath);
    
    // Check if folder exists
    if (!fs.existsSync(dataFolderPath)) {
      throw new Error(`Folder not found: ${dataFolderPath}`);
    }

    console.log(`📁 Scanning folder: ${dataFolderPath}`);

    // Read all files in the folder
    const allFiles = fs.readdirSync(dataFolderPath);
    
    // Filter files by pattern if provided
    let filesToUpload = allFiles.filter(file => {
      const filePath = path.join(dataFolderPath, file);
      const stats = fs.statSync(filePath);
      return stats.isFile();
    });

    if (filePattern) {
      const regex = new RegExp(filePattern, 'i');
      filesToUpload = filesToUpload.filter(file => regex.test(file));
      console.log(`🔍 Filtering files with pattern: ${filePattern}`);
    }

    if (filesToUpload.length === 0) {
      console.log('⚠️  No files found to upload');
      await app.close();
      return;
    }

    console.log(`📋 Found ${filesToUpload.length} files to upload:`);
    filesToUpload.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file}`);
    });

    // Upload files
    const results: UploadResult[] = [];
    
    for (let i = 0; i < filesToUpload.length; i++) {
      const filename = filesToUpload[i];
      const filePath = path.join(dataFolderPath, filename);
      
      console.log(`\n📤 Uploading (${i + 1}/${filesToUpload.length}): ${filename}`);
      
      try {
        // Check if file is an image
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.bmp', '.webp'];
        const fileExtension = path.extname(filename).toLowerCase();
        
        if (!allowedExtensions.includes(fileExtension)) {
          console.log(`⏭️  Skipping non-image file: ${filename}`);
          results.push({
            filename,
            status: 'skipped',
            error: 'Not an image file'
          });
          continue;
        }

        // Upload using the uploadImageByCmd method
        const urls = await mediasService.uploadImageByCmd([filePath]);
        const url = urls[0];
        
        console.log(`✅ Uploaded successfully: ${filename}`);
        console.log(`   📍 URL: ${url}`);
        
        results.push({
          filename,
          url,
          status: 'success'
        });
        
      } catch (error) {
        console.log(`❌ Failed to upload: ${filename}`);
        console.log(`   Error: ${error.message}`);
        
        results.push({
          filename,
          status: 'error',
          error: error.message
        });
      }
    }

    // Display summary
    displaySummary(results);
    
    // Generate CSV report
    await generateReport(results, dataFolderPath);

  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  } finally {
    await app.close();
  }
}

/**
 * Display upload summary
 */
function displaySummary(results: UploadResult[]) {
  const successful = results.filter(r => r.status === 'success');
  const failed = results.filter(r => r.status === 'error');
  const skipped = results.filter(r => r.status === 'skipped');

  console.log('\n' + '='.repeat(60));
  console.log('📊 UPLOAD SUMMARY');
  console.log('='.repeat(60));
  console.log(`📁 Total Files Processed: ${results.length}`);
  console.log(`✅ Successfully Uploaded: ${successful.length}`);
  console.log(`❌ Failed Uploads: ${failed.length}`);
  console.log(`⏭️  Skipped Files: ${skipped.length}`);
  
  if (successful.length > 0) {
    console.log('\n🎉 Successfully Uploaded Files:');
    successful.forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.filename} → ${result.url}`);
    });
  }
  
  if (failed.length > 0) {
    console.log('\n⚠️  Failed Uploads:');
    failed.forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.filename} - ${result.error}`);
    });
  }
  
  if (skipped.length > 0) {
    console.log('\n📝 Skipped Files:');
    skipped.forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.filename} - ${result.error}`);
    });
  }
  
  console.log('='.repeat(60));
  console.log('✅ Upload script completed!');
}

/**
 * Generate CSV report of upload results
 */
async function generateReport(results: UploadResult[], dataFolderPath: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const reportPath = path.join(dataFolderPath, `upload-report-${timestamp}.csv`);
  
  const csvHeaders = ['Filename', 'Status', 'URL', 'Error'];
  const csvData = results.map(result => [
    result.filename,
    result.status,
    result.url || '',
    result.error || ''
  ]);
  
  const csvContent = [
    csvHeaders.join(','),
    ...csvData.map(row => 
      row.map(field => 
        typeof field === 'string' && field.includes(',') 
          ? `"${field}"` 
          : field
      ).join(',')
    )
  ].join('\n');
  
  fs.writeFileSync(reportPath, csvContent, 'utf8');
  console.log(`📄 Report saved: ${reportPath}`);
}

/**
 * Main execution function
 */
async function main() {
  const args = process.argv.slice(2);
  
  // Parse command line arguments
  let folderPath = 'data';
  let filePattern: string | undefined;
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--folder' || arg === '-f') {
      folderPath = args[i + 1];
      i++; // Skip next argument
    } else if (arg === '--pattern' || arg === '-p') {
      filePattern = args[i + 1];
      i++; // Skip next argument
    } else if (arg === '--help' || arg === '-h') {
      displayHelp();
      process.exit(0);
    }
  }
  
  await uploadFiles(folderPath, filePattern);
}

/**
 * Display help information
 */
function displayHelp() {
  console.log(`
🚀 File Upload Script

Usage:
  yarn script:upload-files [options]

Options:
  -f, --folder <path>     Folder path to upload from (default: "data")
  -p, --pattern <regex>   File pattern filter (regex)
  -h, --help             Show this help message

Examples:
  yarn script:upload-files                           # Upload all images from data folder
  yarn script:upload-files --folder assets          # Upload from assets folder
  yarn script:upload-files --pattern "banner.*"     # Upload files matching "banner.*"
  yarn script:upload-files -f data -p "\\.(png|jpg)$" # Upload PNG/JPG files from data folder

Supported file types:
  .jpg, .jpeg, .png, .gif, .svg, .bmp, .webp
  `);
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
}