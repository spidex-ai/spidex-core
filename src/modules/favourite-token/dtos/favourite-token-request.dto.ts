import { IsNotEmpty, IsString, IsArray } from 'class-validator';

export class CheckFavouriteDto {
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  tokenIds: string[];
}
