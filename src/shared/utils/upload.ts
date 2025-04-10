import { HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';

export const mediaFileFilter = (_: Request, file: any, callback) => {
  if (!file) {
    throw new HttpException({ key: 'FILE_NOT_EMPTY', message: 'Image Not Empty!' }, HttpStatus.BAD_REQUEST);
  }

  if (!file.originalname?.toLowerCase()?.match(/\.(jpg|jpeg|png|heic|jfif|svg|gif|bmp|mp4|avi|mov|wmv|mkv)$/)) {
    return callback(new HttpException({ message: 'Image invalid!' }, HttpStatus.BAD_REQUEST), false);
  }
  callback(null, true);
};

export const fetchBuffer = async (url: string) => {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  return Buffer.from(response.data);
};
