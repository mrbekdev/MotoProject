import { TransactionStatus, PaymentType } from '@prisma/client';
export declare class UpdateTransactionDto {
    userId?: number;
    branchId?: number;
    toBranchId?: number;
    status?: TransactionStatus;
    transactionType?: string;
    total?: number;
    finalTotal?: number;
    paymentType?: PaymentType;
    deliveryMethod?: string;
    amountPaid?: number;
    remainingBalance?: number;
    receiptId?: string;
    description?: string;
    creditRepaymentAmount?: number;
    lastRepaymentDate?: string;
}
