import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { CommissionsService } from './commissions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

@Controller('commissions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommissionsController {
  constructor(private readonly commissionsService: CommissionsService) {}

  // Dashboard: Tüm tamamlanmış komisyon kayıtları
  @Get()
  @Roles(UserRole.ADMIN, UserRole.AGENT, UserRole.MARKETER)
  getAllCommissions(@Req() req: any) {
    return this.commissionsService.getAllCommissions(req.user);
  }
}