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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const user_service_1 = require("../user/user.service");
const bcrypt = require("bcrypt");
const prisma_service_1 = require("../prisma/prisma.service");
let AuthService = class AuthService {
    userService;
    jwtService;
    prisma;
    constructor(userService, jwtService, prisma) {
        this.userService = userService;
        this.jwtService = jwtService;
        this.prisma = prisma;
    }
    async login(username, password) {
        const user = await this.prisma.user.findUnique({ where: { username } });
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (user.role === 'MARKETING') {
            const now = new Date();
            const minutesUtc = now.getUTCHours() * 60 + now.getUTCMinutes();
            const minutesTashkent = (minutesUtc + 5 * 60) % (24 * 60);
            const defaultSchedule = await this.prisma.workSchedule.findFirst({ where: { isDefault: true } });
            let startTime = null;
            let endTime = null;
            if (defaultSchedule?.workStartTime && defaultSchedule?.workEndTime) {
                const [sH, sM] = String(defaultSchedule.workStartTime).split(':').map((n) => parseInt(n, 10) || 0);
                const [eH, eM] = String(defaultSchedule.workEndTime).split(':').map((n) => parseInt(n, 10) || 0);
                startTime = sH * 60 + sM;
                endTime = eH * 60 + eM;
            }
            else if (user.workStartTime && user.workEndTime) {
                const [sH, sM] = String(user.workStartTime).split(':').map((n) => parseInt(n, 10) || 0);
                const [eH, eM] = String(user.workEndTime).split(':').map((n) => parseInt(n, 10) || 0);
                startTime = sH * 60 + sM;
                endTime = eH * 60 + eM;
            }
            if (startTime !== null && endTime !== null) {
                let isWithin = false;
                if (startTime <= endTime) {
                    isWithin = minutesTashkent >= startTime && minutesTashkent <= endTime;
                }
                else {
                    isWithin = minutesTashkent >= startTime || minutesTashkent <= endTime;
                }
                if (!isWithin) {
                    throw new common_1.UnauthorizedException('Ish vaqti tugagan');
                }
            }
        }
        if (!user.password) {
            throw new common_1.UnauthorizedException('User does not have a password set');
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const payload = { username: user.username, sub: user.id, role: user.role };
        const token = this.jwtService.sign(payload);
        return {
            message: 'Login successful',
            access_token: token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                branchId: user.branchId,
            },
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [user_service_1.UserService,
        jwt_1.JwtService,
        prisma_service_1.PrismaService])
], AuthService);
//# sourceMappingURL=auth.service.js.map