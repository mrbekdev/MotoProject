import { TransactionStatus, PaymentType, TransactionType } from '@prisma/client';
export declare class CustomerDto {
    fullName?: string;
    phone?: string;
    email?: string;
    address?: string;
    passportSeries?: string;
    jshshir?: string;
}
export declare class TransactionItemDto {
    productId: number;
    productName?: string;
    quantity: number;
    price: number;
    sellingPrice?: number;
    originalPrice?: number;
    creditMonth?: number;
    creditPercent?: number;
    monthlyPayment?: number;
    total?: number;
}
export declare class CreateTransactionDto {
    userId?: number;
    soldByUserId?: number;
    fromBranchId: number;
    toBranchId?: number;
    type: TransactionType;
    transactionType?: string;
    status?: TransactionStatus;
    total: number;
    finalTotal: number;
    downPayment?: number;
    amountPaid?: number;
    remainingBalance?: number;
    paymentType?: PaymentType;
    upfrontPaymentType?: 'CASH' | 'CARD' | 'TERMINAL';
    termUnit?: 'MONTHS' | 'DAYS';
    deliveryType?: string;
    deliveryAddress?: string;
    customer?: CustomerDto;
    items: TransactionItemDto[];
}
