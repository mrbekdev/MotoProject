import { WorkScheduleService } from './work-schedule.service';
import { CreateWorkScheduleDto } from './dto/create-work-schedule.dto';
import { UpdateWorkScheduleDto } from './dto/update-work-schedule.dto';
export declare class WorkScheduleController {
    private readonly workScheduleService;
    constructor(workScheduleService: WorkScheduleService);
    create(createWorkScheduleDto: CreateWorkScheduleDto): Promise<any>;
    findAll(): Promise<any>;
    findDefault(): Promise<any>;
    updateDefault(updateWorkScheduleDto: UpdateWorkScheduleDto): Promise<any>;
    findOne(id: string): Promise<any>;
    update(id: string, updateWorkScheduleDto: UpdateWorkScheduleDto): Promise<any>;
    remove(id: string): Promise<any>;
}
