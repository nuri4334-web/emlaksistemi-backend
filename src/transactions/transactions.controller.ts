import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateStageDto } from './dto/update-stage.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { UserRole } from '../users/schemas/user.schema';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('transactions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @Roles(UserRole.AGENT, UserRole.MARKETER) 
  async createTransaction(@Body() createTransactionDto: CreateTransactionDto) {
    return await this.transactionsService.createTransaction(createTransactionDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.AGENT, UserRole.MARKETER) 
  async getAllTransactions(@Req() req: any) {
    return await this.transactionsService.getAllTransactions(req.user);
  }

  @Patch(':id/stage')
  @Roles(UserRole.AGENT)
  async updateTransactionStage(@Param('id') id: string, @Body() updateStageDto: UpdateStageDto) {
    return await this.transactionsService.updateTransactionStage(id, updateStageDto);
  }

  @Patch(':id/revert')
  @Roles(UserRole.AGENT)
  async revertStage(@Param('id') id: string) {
    return await this.transactionsService.revertStage(id);
  }

  // EN: Route to edit transaction details, restricted to Agent/Marketer.
  // TR: Satış detaylarını düzenleme rotası, sadece Danışman ve Pazarlamacılar.
  @Patch(':id')
  @Roles(UserRole.AGENT, UserRole.MARKETER)
  async updateTransaction(@Param('id') id: string, @Body() updateData: UpdateTransactionDto) {
    return await this.transactionsService.updateTransaction(id, updateData);
  }

  // EN: Route to delete a transaction.
  // TR: İşlem silme rotası.
  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.AGENT, UserRole.MARKETER)
  async deleteTransaction(@Param('id') id: string) {
    return await this.transactionsService.deleteTransaction(id);
  }
}