import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { PrismaService } from 'src/prisma/prisma.service';
export declare class AuthService {
    private userService;
    private jwtService;
    private prisma;
    constructor(userService: UserService, jwtService: JwtService, prisma: PrismaService);
    login(username: string, password: string): Promise<{
        message: string;
        access_token: string;
        user: {
            id: number;
            username: string;
            role: import(".prisma/client").$Enums.UserRole;
            branchId: number | null;
        };
    }>;
}
