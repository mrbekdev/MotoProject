export declare class CreateCreditRepaymentDto {
    transactionId: number;
    scheduleId?: number;
    amount: number;
    channel: string;
    month?: string;
    monthNumber?: number;
    paidAt: string;
    paidByUserId?: number;
    branchId?: number;
}
