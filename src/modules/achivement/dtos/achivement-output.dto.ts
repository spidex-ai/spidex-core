import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import { IsString } from "class-validator";

export class AchievementOutput {
    @ApiProperty()
    @Expose()
    @IsString()
    id: string;

    @ApiProperty()
    @Expose()
    @IsString()
    name: string;

    @ApiProperty()
    @Expose()
    @IsString()
    icon: string;

    @ApiProperty()
    @Expose()
    @IsString()
    description: string;

    @ApiProperty()
    @Expose()
    @IsString()
    points: string;
}

export class NextAchievementOutput extends AchievementOutput {
    @ApiProperty()
    @Expose()
    @IsString()
    pointsToNextAchievement: string;
}
