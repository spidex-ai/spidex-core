import { ApiProperty } from "@nestjs/swagger";
import { PaginationDto } from "@shared/dtos/page-meta.dto";
import { Expose } from "class-transformer";


export class UserPointHistoryParamsDto extends PaginationDto {

}


export class UserPointHistoryOutputDto {
    @Expose()
    @ApiProperty()
    id: number;

    @Expose()
    @ApiProperty()
    amount: string;

    @Expose()
    @ApiProperty()
    createdAt: Date;

    @Expose()
    @ApiProperty()
    questName: string
}
