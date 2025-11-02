export declare enum BranchType {
    SKLAD = "SKLAD",
    SAVDO_MARKAZ = "SAVDO_MARKAZ"
}
export declare class UpdateBranchDto {
    name?: string;
    location?: string;
    type?: BranchType;
    phoneNumber?: string;
}
