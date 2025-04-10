import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

import type { PageOptionsDto } from './page-option.dto';

export class PageMetaDto {
    @ApiProperty()
    readonly total: number;

    @ApiProperty()
    readonly perPage: number;

    @ApiProperty()
    readonly currentPage: number;

    @ApiProperty()
    readonly lastPage: number;

    @ApiProperty()
    readonly hasPreviousPage: boolean;

    @ApiProperty()
    readonly hasNextPage: boolean;

    constructor(itemCount: number, pageOptionsDto: PageOptionsDto) {
        this.total = +itemCount;
        this.perPage = Math.ceil(this.total / pageOptionsDto.limit);
        this.currentPage = pageOptionsDto.page;
        this.hasPreviousPage = pageOptionsDto.page > 1;
        this.hasNextPage = pageOptionsDto.page < this.perPage;
    }
}

export class PaginationDto {
    @ApiPropertyOptional({ default: 10 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    limit?: number;

    @ApiPropertyOptional({ default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    page?: number;
}
