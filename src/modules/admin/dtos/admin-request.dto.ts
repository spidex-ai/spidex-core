import { ApiProperty } from "@nestjs/swagger";
import { StringFieldOption } from "@shared/decorators/field.decorator";
import { PaginationDto } from "@shared/dtos/page-meta.dto";
import { IsArray, IsBoolean, IsNotEmpty, IsString } from "class-validator";

export class AdminRequestDto {}

export class AdminLoginDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty({
        description: 'The username of the admin',
        example: 'admin',
    })
    username: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({
        description: 'The password of the admin',
        example: 'password',
    })
    password: string;
}

export class CrawlDocsDto {
    @IsNotEmpty()
    @ApiProperty({
        description: 'The url of the docs',
        example: ['https://docs.spidex.io', 'https://docs.spidex.io/en/latest/'],
    })
    urls: string[];

    @IsString()
    @IsNotEmpty()
    @ApiProperty({
        description: 'The name of the docs',
        example: 'docs',
    })
    name: string;

    @IsBoolean()
    @IsNotEmpty()
    @ApiProperty({
        description: 'The is crawl sub path of the docs',
        example: false,
    })
    isCrawlSubPath: boolean;
}
        
export class GetCrawlDocsDto  extends PaginationDto {
    @StringFieldOption({
        description: 'The keyword of the docs',
        example: 'docs',
    })
    keyword: string;
}