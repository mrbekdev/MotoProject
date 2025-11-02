export declare enum BranchType {
    SKLAD = "SKLAD",
    SAVDO_MARKAZ = "SAVDO_MARKAZ"
}
export declare class CreateBranchDto {
    name: string;
    location: string;
    type?: BranchType;
    phoneNumber?: string;
}
