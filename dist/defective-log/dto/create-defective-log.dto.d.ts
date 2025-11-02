export declare class CreateDefectiveLogDto {
    productId: number;
    quantity: number;
    description: string;
    userId?: number;
    branchId?: number;
    actionType?: string;
    isFromSale?: boolean;
    transactionId?: number;
    customerId?: number;
    cashAdjustmentDirection?: 'PLUS' | 'MINUS';
    cashAmount?: number;
    exchangeWithProductId?: number;
    replacementQuantity?: number;
    replacementUnitPrice?: number;
    replacementTransactionId?: number;
}
