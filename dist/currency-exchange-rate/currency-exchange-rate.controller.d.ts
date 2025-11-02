import { CurrencyExchangeRateService } from './currency-exchange-rate.service';
import { CreateCurrencyExchangeRateDto } from './dto/create-currency-exchange-rate.dto';
import { UpdateCurrencyExchangeRateDto } from './dto/update-currency-exchange-rate.dto';
export declare class CurrencyExchangeRateController {
    private readonly currencyExchangeRateService;
    constructor(currencyExchangeRateService: CurrencyExchangeRateService);
    create(createCurrencyExchangeRateDto: CreateCurrencyExchangeRateDto, req: any): Promise<{
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
    findAll(branchId?: string): Promise<({
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
    getCurrentRate(fromCurrency: string, toCurrency: string, branchId?: string): Promise<number>;
    convertCurrency(amount: string, fromCurrency: string, toCurrency: string, branchId?: string): Promise<number>;
    findOne(id: string): Promise<({
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
    update(id: string, updateCurrencyExchangeRateDto: UpdateCurrencyExchangeRateDto): Promise<{
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
    remove(id: string): Promise<{
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
}
