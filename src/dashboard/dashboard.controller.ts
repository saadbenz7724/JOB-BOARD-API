import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User, UserRole } from '../users/user.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('recruiter')
  @Roles(UserRole.RECRUITER)
  getRecruiterDashboard(@CurrentUser() user: User) {
    return this.dashboardService.getRecruiterDashboard(user.id);
  }

  @Get('candidate')
  @Roles(UserRole.CANDIDATE)
  getCandidateDashboard(@CurrentUser() user: User) {
    return this.dashboardService.getCandidateDashboard(user.id);
  }
}