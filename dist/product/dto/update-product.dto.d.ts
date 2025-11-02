import { ProductStatus } from '@prisma/client';
export declare enum ProductSizeType {
    NONE = "NONE",
    AREA_SQM = "AREA_SQM",
    CLOTHING_ALPHA = "CLOTHING_ALPHA",
    CLOTHING_NUMERIC = "CLOTHING_NUMERIC",
    FREE_TEXT = "FREE_TEXT"
}
export declare class UpdateProductDto {
    name?: string;
    barcode?: string;
    description?: string;
    categoryId?: number;
    branchId?: number;
    status?: ProductStatus;
    price?: number;
    marketPrice?: number;
    model?: string;
    quantity?: number;
    bonusPercentage?: number;
    sizeType?: ProductSizeType;
    sizeLabel?: string;
    sizeNumber?: number;
    areaSqm?: number;
}
