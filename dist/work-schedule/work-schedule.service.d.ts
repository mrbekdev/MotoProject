import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkScheduleDto } from './dto/create-work-schedule.dto';
import { UpdateWorkScheduleDto } from './dto/update-work-schedule.dto';
export declare class WorkScheduleService implements OnModuleInit {
    private prisma;
    constructor(prisma: PrismaService);
    onModuleInit(): Promise<void>;
    create(createWorkScheduleDto: CreateWorkScheduleDto): Promise<any>;
    findAll(): Promise<any>;
    findDefault(): Promise<any>;
    findOne(id: number): Promise<any>;
    update(id: number, updateWorkScheduleDto: UpdateWorkScheduleDto): Promise<any>;
    updateDefault(updateWorkScheduleDto: UpdateWorkScheduleDto): Promise<any>;
    remove(id: number): Promise<any>;
    ensureDefaultExists(): Promise<any>;
}
