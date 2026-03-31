import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User, UserRole } from '../users/user.entity';

@ApiTags('Dashboard')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('recruiter')
  @Roles(UserRole.RECRUITER)
  @ApiOperation({ summary: 'Get recruiter dashboard — Redis cached 5 min' })
  @ApiResponse({ status: 200, description: 'Recruiter stats with job and application overview' })
  @ApiResponse({ status: 403, description: 'Only recruiters can access this' })
  getRecruiterDashboard(@CurrentUser() user: User) {
    return this.dashboardService.getRecruiterDashboard(user.id);
  }

  @Get('candidate')
  @Roles(UserRole.CANDIDATE)
  @ApiOperation({ summary: 'Get candidate dashboard — Redis cached 3 min' })
  @ApiResponse({ status: 200, description: 'Candidate stats with application summary' })
  @ApiResponse({ status: 403, description: 'Only candidates can access this' })
  getCandidateDashboard(@CurrentUser() user: User) {
    return this.dashboardService.getCandidateDashboard(user.id);
  }
}