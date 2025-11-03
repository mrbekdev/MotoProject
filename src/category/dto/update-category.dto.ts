import { IsString, IsOptional, MaxLength, IsInt, IsPositive, IsEnum } from 'class-validator';
import { CategoryTypeDto } from './create-category.dto';

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  branchId?: number;

  @IsOptional()
  @IsEnum(CategoryTypeDto)
  type?: CategoryTypeDto;
}