import { HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import * as fs from 'fs';

// Define the file interface to match Multer's file structure
export interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer?: Buffer; // Optional for memory storage
  path?: string; // Optional for disk storage
  filename?: string; // Optional for disk storage
  destination?: string; // Optional for disk storage
  isSvg?: boolean; // Custom property for SVG files
}

// Allowed image and video file extensions
const ALLOWED_EXTENSIONS = /\.(jpg|jpeg|png|heic|jfif|gif|bmp|mp4|avi|mov|wmv|mkv)$/i;
const SVG_EXTENSION = /\.svg$/i;

// Maximum file sizes
const MAX_SVG_SIZE = 1024 * 1024; // 1MB for SVG files
const MAX_REGULAR_FILE_SIZE = 512 * 1024 * 1024; // 512MB for other files

// Helper function to get file buffer (handles both memory and disk storage)
export async function getFileBuffer(file: MulterFile): Promise<Buffer> {
  if (file.buffer) {
    return file.buffer;
  }
  if (file.path) {
    return fs.readFileSync(file.path);
  }
  throw new Error('File has no buffer or path property');
}

export const mediaFileFilter = (
  _: Request,
  file: MulterFile,
  callback: (error: Error | null, acceptFile: boolean) => void,
) => {
  if (!file) {
    throw new HttpException({ key: 'FILE_NOT_EMPTY', message: 'File cannot be empty!' }, HttpStatus.BAD_REQUEST);
  }

  console.log({ file });
  const fileName = file.originalname?.toLowerCase() || '';

  // Check if it's an SVG file
  if (SVG_EXTENSION.test(fileName)) {
    // SVG files require special handling
    if (file.size > MAX_SVG_SIZE) {
      return callback(
        new HttpException(
          {
            message: 'SVG file too large! Maximum size is 1MB.',
          },
          HttpStatus.BAD_REQUEST,
        ),
        false,
      );
    }

    // For SVG files, we'll do basic validation here and detailed validation in the service
    // Basic validation: check if buffer exists or if we can read the file
    try {
      return callback(null, true);
    } catch {
      return callback(
        new HttpException(
          {
            message: 'Error reading SVG file!',
          },
          HttpStatus.BAD_REQUEST,
        ),
        false,
      );
    }
  }

  // Check other allowed file types
  if (!ALLOWED_EXTENSIONS.test(fileName)) {
    return callback(
      new HttpException(
        {
          message:
            'File type not allowed! Supported formats: JPG, JPEG, PNG, HEIC, JFIF, GIF, BMP, MP4, AVI, MOV, WMV, MKV, SVG',
        },
        HttpStatus.BAD_REQUEST,
      ),
      false,
    );
  }

  // Check file size for non-SVG files
  if (file.size > MAX_REGULAR_FILE_SIZE) {
    return callback(
      new HttpException(
        {
          message: 'File too large! Maximum size is 512MB.',
        },
        HttpStatus.BAD_REQUEST,
      ),
      false,
    );
  }

  callback(null, true);
};

export const fetchBuffer = async (url: string) => {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  return Buffer.from(response.data);
};
