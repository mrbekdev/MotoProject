import { IsString, IsOptional, MaxLength, IsInt, IsPositive, IsEnum } from 'class-validator';

export enum CategoryTypeDto {
  PIECE = 'PIECE',
  AREA_SQM = 'AREA_SQM',
}

export class CreateCategoryDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsInt()
  @IsPositive()
  branchId: number;

  @IsOptional()
  @IsEnum(CategoryTypeDto)
  type?: CategoryTypeDto;
}