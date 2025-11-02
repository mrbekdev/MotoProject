export declare class CreateDailyRepaymentDto {
    transactionId: number;
    amount: number;
    channel: string;
    paidAt: string;
    paidByUserId?: number;
    branchId?: number;
}
