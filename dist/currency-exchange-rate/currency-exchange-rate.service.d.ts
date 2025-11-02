import { PrismaService } from '../prisma/prisma.service';
import { CreateCurrencyExchangeRateDto } from './dto/create-currency-exchange-rate.dto';
import { UpdateCurrencyExchangeRateDto } from './dto/update-currency-exchange-rate.dto';
export declare class CurrencyExchangeRateService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createCurrencyExchangeRateDto: CreateCurrencyExchangeRateDto, userId: number): Promise<{
        branch: {
            name: string;
            type: import(".prisma/client").$Enums.BranchType;
            phoneNumber: string | null;
            id: number;
            address: string | null;
            cashBalance: number;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.BranchStatus;
        } | null;
        user: {
            id: number;
            firstName: string | null;
            lastName: string | null;
        } | null;
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        branchId: number | null;
        isActive: boolean;
        fromCurrency: string;
        toCurrency: string;
        rate: number;
        createdBy: number | null;
    }>;
    findAll(branchId?: number): Promise<({
        branch: {
            name: string;
            type: import(".prisma/client").$Enums.BranchType;
            phoneNumber: string | null;
            id: number;
            address: string | null;
            cashBalance: number;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.BranchStatus;
        } | null;
        user: {
            id: number;
            firstName: string | null;
            lastName: string | null;
        } | null;
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        branchId: number | null;
        isActive: boolean;
        fromCurrency: string;
        toCurrency: string;
        rate: number;
        createdBy: number | null;
    })[]>;
    findOne(id: number): Promise<({
        branch: {
            name: string;
            type: import(".prisma/client").$Enums.BranchType;
            phoneNumber: string | null;
            id: number;
            address: string | null;
            cashBalance: number;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.BranchStatus;
        } | null;
        user: {
            id: number;
            firstName: string | null;
            lastName: string | null;
        } | null;
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        branchId: number | null;
        isActive: boolean;
        fromCurrency: string;
        toCurrency: string;
        rate: number;
        createdBy: number | null;
    }) | null>;
    getActiveRate(fromCurrency: string, toCurrency: string, branchId?: number): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        branchId: number | null;
        isActive: boolean;
        fromCurrency: string;
        toCurrency: string;
        rate: number;
        createdBy: number | null;
    } | null>;
    findByCurrencies(fromCurrency: string, toCurrency: string, branchId?: number): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        branchId: number | null;
        isActive: boolean;
        fromCurrency: string;
        toCurrency: string;
        rate: number;
        createdBy: number | null;
    } | null>;
    update(id: number, updateCurrencyExchangeRateDto: UpdateCurrencyExchangeRateDto): Promise<{
        branch: {
            name: string;
            type: import(".prisma/client").$Enums.BranchType;
            phoneNumber: string | null;
            id: number;
            address: string | null;
            cashBalance: number;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.BranchStatus;
        } | null;
        user: {
            id: number;
            firstName: string | null;
            lastName: string | null;
        } | null;
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        branchId: number | null;
        isActive: boolean;
        fromCurrency: string;
        toCurrency: string;
        rate: number;
        createdBy: number | null;
    }>;
    remove(id: number): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        branchId: number | null;
        isActive: boolean;
        fromCurrency: string;
        toCurrency: string;
        rate: number;
        createdBy: number | null;
    }>;
    getCurrentRate(fromCurrency: string, toCurrency: string, branchId?: number): Promise<number>;
    convertCurrency(amount: number, fromCurrency: string, toCurrency: string, branchId?: number): Promise<number>;
}
