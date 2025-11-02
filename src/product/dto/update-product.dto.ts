
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { ProductStatus } from '@prisma/client';

export enum ProductSizeType {
  NONE = 'NONE',
  AREA_SQM = 'AREA_SQM',
  CLOTHING_ALPHA = 'CLOTHING_ALPHA',
  CLOTHING_NUMERIC = 'CLOTHING_NUMERIC',
  FREE_TEXT = 'FREE_TEXT',
}

export class UpdateProductDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  barcode?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  categoryId?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  branchId?: number;

  @ApiProperty({ enum: ProductStatus, required: false })
  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  price?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  marketPrice?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  model?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  quantity?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  bonusPercentage?: number;

  @ApiProperty({ required: false, enum: ProductSizeType })
  @IsEnum(ProductSizeType)
  @IsOptional()
  sizeType?: ProductSizeType;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  sizeLabel?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  sizeNumber?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  areaSqm?: number;
}
