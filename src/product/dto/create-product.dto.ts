import { IsString, IsNumber, IsOptional, IsEnum, Min } from 'class-validator';
import { ProductStatus } from '@prisma/client';

export enum ProductSizeType {
  NONE = 'NONE',
  AREA_SQM = 'AREA_SQM',
  CLOTHING_ALPHA = 'CLOTHING_ALPHA',
  CLOTHING_NUMERIC = 'CLOTHING_NUMERIC',
  FREE_TEXT = 'FREE_TEXT',
}

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  barcode?: string;

  @IsString()
  @IsOptional()
  model?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  marketPrice?: number;

  @IsNumber()
  categoryId: number;

  @IsNumber()
  branchId: number;

  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  bonusPercentage?: number;

  @IsEnum(ProductSizeType)
  @IsOptional()
  sizeType?: ProductSizeType;

  @IsString()
  @IsOptional()
  sizeLabel?: string;

  @IsNumber()
  @IsOptional()
  sizeNumber?: number;

  @IsNumber()
  @IsOptional()
  areaSqm?: number;
}