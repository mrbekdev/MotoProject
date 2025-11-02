import { PaymentType } from '@prisma/client';
export declare class CreateReceiptDto {
    id: string;
    customerId?: number;
    cashier: string;
    date: string;
    items: object;
    total: number;
    creditTotal?: number;
    amountPaid: number;
    remainingBalance: number;
    returnCode: string;
    branchId?: number;
    deliveryMethod: string;
    paymentMethod: PaymentType;
}
