"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkScheduleService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let WorkScheduleService = class WorkScheduleService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async onModuleInit() {
        try {
            await this.ensureDefaultExists();
        }
        catch (e) {
        }
    }
    async create(createWorkScheduleDto) {
        if (createWorkScheduleDto.isDefault) {
            await this.prisma.workSchedule.updateMany({
                where: { isDefault: true },
                data: { isDefault: false },
            });
        }
        return this.prisma.workSchedule.create({
            data: createWorkScheduleDto,
        });
    }
    async findAll() {
        return this.prisma.workSchedule.findMany({
            orderBy: [
                { isDefault: 'desc' },
                { createdAt: 'desc' },
            ],
        });
    }
    async findDefault() {
        const defaultSchedule = await this.prisma.workSchedule.findFirst({
            where: { isDefault: true },
        });
        if (!defaultSchedule) {
            return this.create({
                workStartTime: '09:00',
                workEndTime: '18:00',
                isDefault: true,
                description: 'Default work schedule',
            });
        }
        return defaultSchedule;
    }
    async findOne(id) {
        const workSchedule = await this.prisma.workSchedule.findUnique({
            where: { id },
        });
        if (!workSchedule) {
            throw new common_1.NotFoundException('Work schedule not found');
        }
        return workSchedule;
    }
    async update(id, updateWorkScheduleDto) {
        const workSchedule = await this.prisma.workSchedule.findUnique({
            where: { id },
        });
        if (!workSchedule) {
            throw new common_1.NotFoundException('Work schedule not found');
        }
        if (updateWorkScheduleDto.isDefault) {
            await this.prisma.workSchedule.updateMany({
                where: {
                    isDefault: true,
                    id: { not: id }
                },
                data: { isDefault: false },
            });
        }
        return this.prisma.workSchedule.update({
            where: { id },
            data: updateWorkScheduleDto,
        });
    }
    async updateDefault(updateWorkScheduleDto) {
        const defaultSchedule = await this.findDefault();
        return this.update(defaultSchedule.id, {
            ...updateWorkScheduleDto,
            isDefault: true,
        });
    }
    async remove(id) {
        const workSchedule = await this.prisma.workSchedule.findUnique({
            where: { id },
        });
        if (!workSchedule) {
            throw new common_1.NotFoundException('Work schedule not found');
        }
        if (workSchedule.isDefault) {
            const totalSchedules = await this.prisma.workSchedule.count();
            if (totalSchedules === 1) {
                throw new common_1.NotFoundException('Cannot delete the only work schedule');
            }
        }
        return this.prisma.workSchedule.delete({
            where: { id },
        });
    }
    async ensureDefaultExists() {
        const defaultSchedule = await this.prisma.workSchedule.findFirst({
            where: { isDefault: true },
        });
        if (!defaultSchedule) {
            return this.create({
                workStartTime: '09:00',
                workEndTime: '18:00',
                isDefault: true,
                description: 'Default work schedule',
            });
        }
        return defaultSchedule;
    }
};
exports.WorkScheduleService = WorkScheduleService;
exports.WorkScheduleService = WorkScheduleService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WorkScheduleService);
//# sourceMappingURL=work-schedule.service.js.map