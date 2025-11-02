import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
export declare class CategoryService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createCategoryDto: CreateCategoryDto): Promise<{
        name: string;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        branchId: number | null;
    }>;
    findOne(id: number): Promise<({
        products: {
            name: string;
            id: number;
            createdAt: Date | null;
            updatedAt: Date | null;
            status: import(".prisma/client").$Enums.ProductStatus;
            branchId: number;
            barcode: string | null;
            model: string | null;
            price: number;
            quantity: number;
            marketPrice: number | null;
            categoryId: number;
            bonusPercentage: number | null;
            sizeType: import(".prisma/client").$Enums.ProductSizeType;
            sizeLabel: string | null;
            sizeNumber: number | null;
            areaSqm: number | null;
            defectiveQuantity: number;
            returnedQuantity: number;
            exchangedQuantity: number;
            initialQuantity: number;
            isDeleted: boolean;
            deletedAt: Date | null;
        }[];
    } & {
        name: string;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        branchId: number | null;
    }) | null>;
    findAll(skip: number, take: number): Promise<({
        products: {
            name: string;
            id: number;
            createdAt: Date | null;
            updatedAt: Date | null;
            status: import(".prisma/client").$Enums.ProductStatus;
            branchId: number;
            barcode: string | null;
            model: string | null;
            price: number;
            quantity: number;
            marketPrice: number | null;
            categoryId: number;
            bonusPercentage: number | null;
            sizeType: import(".prisma/client").$Enums.ProductSizeType;
            sizeLabel: string | null;
            sizeNumber: number | null;
            areaSqm: number | null;
            defectiveQuantity: number;
            returnedQuantity: number;
            exchangedQuantity: number;
            initialQuantity: number;
            isDeleted: boolean;
            deletedAt: Date | null;
        }[];
    } & {
        name: string;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        branchId: number | null;
    })[]>;
    update(id: number, updateCategoryDto: UpdateCategoryDto): Promise<{
        name: string;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        branchId: number | null;
    }>;
    remove(id: number): Promise<{
        name: string;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        branchId: number | null;
    }>;
}
