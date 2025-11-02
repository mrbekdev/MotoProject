import { ProductStatus } from '@prisma/client';
export declare enum ProductSizeType {
    NONE = "NONE",
    AREA_SQM = "AREA_SQM",
    CLOTHING_ALPHA = "CLOTHING_ALPHA",
    CLOTHING_NUMERIC = "CLOTHING_NUMERIC",
    FREE_TEXT = "FREE_TEXT"
}
export declare class CreateProductDto {
    name: string;
    barcode?: string;
    model?: string;
    price: number;
    quantity: number;
    marketPrice?: number;
    categoryId: number;
    branchId: number;
    status?: ProductStatus;
    description?: string;
    bonusPercentage?: number;
    sizeType?: ProductSizeType;
    sizeLabel?: string;
    sizeNumber?: number;
    areaSqm?: number;
}
