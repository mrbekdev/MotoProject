import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

interface AuthenticatedSocket extends Socket {
  userId?: number;
  role?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
@Injectable()
export class DeliveryTasksGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('DeliveryTasksGateway');

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = (client.handshake.auth as any)?.token || client.handshake.headers.authorization?.replace('Bearer ', '');
      if (!token) throw new UnauthorizedException('Token not provided');

      const payload: any = this.jwtService.verify(token);
      if (!payload?.sub || !payload?.role) throw new UnauthorizedException('Invalid token');
      client.userId = Number(payload.sub);
      client.role = String(payload.role);

      // Join auditors room so we can target emits
      if (client.role === 'AUDITOR' || client.role === 'ADMIN' || client.role === 'MANAGER') {
        client.join('delivery-auditors');
      }

      this.logger.log(`Client connected: ${client.id} user=${client.userId} role=${client.role}`);
      client.emit('deliverySocketConnected', { ok: true });
    } catch (e) {
      this.logger.warn(`Connection refused: ${e?.message || e}`);
      client.emit('error', { message: e?.message || 'Unauthorized' });
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Broadcast helpers
  emitTaskCreated(task: any) {
    this.server.emit('deliveryTaskCreated', task);
  }

  emitTaskUpdated(task: any) {
    this.server.emit('deliveryTaskUpdated', task);
  }

  emitTasksChanged() {
    this.server.emit('deliveryTasksChanged');
  }
}
