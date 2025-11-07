import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { IntStoreService } from './int-store.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('int-store')
export class IntStoreController {
  constructor(private readonly service: IntStoreService) {}

  @Post()
  create(@Body() body: { value: number }) {
    return this.service.create(Number(body?.value));
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(Number(id));
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: { value: number }) {
    return this.service.update(Number(id), Number(body?.value));
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id));
  }
}
