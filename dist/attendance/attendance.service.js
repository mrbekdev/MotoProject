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
exports.AttendanceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
function startOfDayUTC(date) {
    const d = date ? new Date(date) : new Date();
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}
let AttendanceService = class AttendanceService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async checkIn(params) {
        const { branchId, deviceId, similarity, payload } = params;
        let userId = params.userId;
        if (!userId && params.faceTemplateId) {
            const face = await this.prisma.faceTemplate.findUnique({ where: { id: params.faceTemplateId } });
            if (!face)
                throw new common_1.NotFoundException('Face template not found');
            userId = face.userId;
        }
        if (!userId)
            throw new common_1.BadRequestException('userId or faceTemplateId is required');
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const today = startOfDayUTC(params.when);
        const day = await this.prisma.attendanceDay.upsert({
            where: { userId_date: { userId, date: today } },
            create: { userId, branchId: branchId ?? user.branchId ?? null, date: today, checkInAt: new Date(), deviceId },
            update: { checkInAt: { set: new Date() }, branchId: branchId ?? user.branchId ?? null, deviceId },
        });
        await this.prisma.attendanceEvent.create({
            data: {
                userId,
                branchId: branchId ?? user.branchId ?? null,
                dayId: day.id,
                eventType: 'CHECK_IN',
                deviceId,
                similarity: similarity ?? null,
                payload: payload ?? undefined,
            },
        });
        return day;
    }
    async checkOut(params) {
        const { branchId, deviceId, similarity, payload } = params;
        let userId = params.userId;
        if (!userId && params.faceTemplateId) {
            const face = await this.prisma.faceTemplate.findUnique({ where: { id: params.faceTemplateId } });
            if (!face)
                throw new common_1.NotFoundException('Face template not found');
            userId = face.userId;
        }
        if (!userId)
            throw new common_1.BadRequestException('userId or faceTemplateId is required');
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const today = startOfDayUTC(params.when);
        let day = await this.prisma.attendanceDay.findUnique({ where: { userId_date: { userId, date: today } } });
        if (!day) {
            day = await this.prisma.attendanceDay.create({
                data: { userId, branchId: branchId ?? user.branchId ?? null, date: today, checkOutAt: new Date(), deviceId },
            });
        }
        else {
            const checkInAt = day.checkInAt ? new Date(day.checkInAt) : undefined;
            const checkOutAt = new Date();
            const totalMinutes = checkInAt ? Math.max(0, Math.round((+checkOutAt - +checkInAt) / 60000)) : day.totalMinutes ?? 0;
            day = await this.prisma.attendanceDay.update({
                where: { id: day.id },
                data: { checkOutAt, totalMinutes, branchId: branchId ?? user.branchId ?? null, deviceId },
            });
        }
        await this.prisma.attendanceEvent.create({
            data: {
                userId,
                branchId: branchId ?? user.branchId ?? null,
                dayId: day.id,
                eventType: 'CHECK_OUT',
                deviceId,
                similarity: similarity ?? null,
                payload: payload ?? undefined,
            },
        });
        return day;
    }
    async createManual(dayData) {
        const date = startOfDayUTC(new Date(dayData.date));
        return this.prisma.attendanceDay.create({
            data: {
                userId: dayData.userId,
                branchId: dayData.branchId ?? null,
                date,
                checkInAt: dayData.checkInAt ?? null,
                checkOutAt: dayData.checkOutAt ?? null,
                totalMinutes: dayData.checkInAt && dayData.checkOutAt ? Math.max(0, Math.round((+new Date(dayData.checkOutAt) - +new Date(dayData.checkInAt)) / 60000)) : 0,
                notes: dayData.notes ?? null,
                deviceId: dayData.deviceId ?? null,
                status: dayData.status ?? 'PRESENT',
            },
        });
    }
    async findAll(query) {
        const page = Math.max(1, parseInt(query.page) || 1);
        const limit = Math.max(1, Math.min(200, parseInt(query.limit) || 30));
        const skip = (page - 1) * limit;
        const where = {};
        if (query.userId)
            where.userId = parseInt(query.userId);
        if (query.branchId)
            where.branchId = parseInt(query.branchId);
        if (query.startDate || query.endDate) {
            where.date = {};
            if (query.startDate)
                where.date.gte = startOfDayUTC(new Date(query.startDate));
            if (query.endDate)
                where.date.lte = startOfDayUTC(new Date(query.endDate));
        }
        const [items, total] = await Promise.all([
            this.prisma.attendanceDay.findMany({
                where,
                include: { user: true, branch: true, events: true },
                orderBy: { date: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.attendanceDay.count({ where }),
        ]);
        return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
    }
    async findOne(id) {
        const day = await this.prisma.attendanceDay.findUnique({ where: { id }, include: { user: true, branch: true, events: true } });
        if (!day)
            throw new common_1.NotFoundException('Attendance not found');
        return day;
    }
    async update(id, data) {
        const updated = await this.prisma.attendanceDay.update({ where: { id }, data });
        return updated;
    }
    async remove(id) {
        await this.prisma.attendanceEvent.deleteMany({ where: { dayId: id } });
        return this.prisma.attendanceDay.delete({ where: { id } });
    }
    async registerFace(body) {
        const { userId, deviceId, template, vector, imageUrl } = (body || {});
        if (!userId)
            throw new common_1.BadRequestException('userId is required');
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        let b64 = null;
        let finalImageUrl = imageUrl ?? null;
        if (typeof template === 'string' && template.length > 0) {
            if (template.startsWith('data:')) {
                const parts = template.split(',');
                b64 = parts.length > 1 ? parts[1] : '';
                finalImageUrl = template;
            }
            else {
                b64 = template;
                finalImageUrl = finalImageUrl ?? `data:image/jpeg;base64,${b64}`;
            }
        }
        const created = await this.prisma.faceTemplate.create({
            data: {
                userId,
                deviceId: deviceId ?? null,
                template: b64,
                vector: vector ?? undefined,
                imageUrl: finalImageUrl,
            },
        });
        return created;
    }
    async listFaces(query) {
        const page = Math.max(1, parseInt(query.page) || 1);
        const limit = Math.max(1, Math.min(200, parseInt(query.limit) || 30));
        const skip = (page - 1) * limit;
        const where = {};
        if (query.userId)
            where.userId = parseInt(query.userId);
        if (query.deviceId)
            where.deviceId = String(query.deviceId);
        const [itemsRaw, total] = await Promise.all([
            this.prisma.faceTemplate.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
            this.prisma.faceTemplate.count({ where }),
        ]);
        const items = itemsRaw.map((it) => {
            if (!it?.imageUrl && it?.template) {
                return { ...it, imageUrl: `data:image/jpeg;base64,${it.template}` };
            }
            return it;
        });
        return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
    }
    async deleteFace(id) {
        return this.prisma.faceTemplate.delete({ where: { id } });
    }
};
exports.AttendanceService = AttendanceService;
exports.AttendanceService = AttendanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AttendanceService);
//# sourceMappingURL=attendance.service.js.map