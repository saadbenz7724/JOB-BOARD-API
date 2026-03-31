import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { QueryApplicationDto } from './dto/query-application.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User, UserRole } from '../users/user.entity';

@ApiTags('Applications')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('applications')
export class ApplicationsController {
  constructor(private applicationsService: ApplicationsService) {}


  @Post()
  @Roles(UserRole.CANDIDATE)
  @ApiOperation({ summary: 'Apply to a job — Candidate only' })
  @ApiResponse({ status: 201, description: 'Application submitted' })
  @ApiResponse({ status: 409, description: 'Already applied to this job' })
  @ApiResponse({ status: 400, description: 'Job is closed or deadline passed' })
  apply(@CurrentUser() user: User, @Body() dto: CreateApplicationDto) {
    return this.applicationsService.apply(user.id, dto);
  }

  @Get('my-applications')
  @Roles(UserRole.CANDIDATE)
  @ApiOperation({ summary: 'Get my applications — Candidate only' })
  @ApiResponse({ status: 200, description: 'Candidate application list' })
  getMyApplications(
    @CurrentUser() user: User,
    @Query() query: QueryApplicationDto,
  ) {
    return this.applicationsService.getMyApplications(user.id, query);
  }

  @Delete(':id/withdraw')
  @Roles(UserRole.CANDIDATE)
  @ApiOperation({ summary: 'Withdraw an application — Candidate only' })
  @ApiResponse({ status: 200, description: 'Application withdrawn' })
  @ApiResponse({ status: 400, description: 'Cannot withdraw at this stage' })
  withdraw(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.applicationsService.withdraw(id, user.id);
  }

  @Get('job/:jobId')
  @Roles(UserRole.RECRUITER)
  @ApiOperation({ summary: 'Get all applications for a job with pipeline count — Recruiter only' })
  @ApiResponse({ status: 200, description: 'Job applications with pipeline overview' })
  getJobApplications(
    @CurrentUser() user: User,
    @Param('jobId', ParseIntPipe) jobId: number,
    @Query() query: QueryApplicationDto,
  ) {
    return this.applicationsService.getJobApplications(jobId, user.id, query);
  }

  @Patch(':id/status')
  @Roles(UserRole.RECRUITER)
  @ApiOperation({ summary: 'Update application status — Recruiter only' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  @ApiResponse({ status: 400, description: 'Invalid pipeline transition' })
  updateStatus(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.applicationsService.updateStatus(id, user.id, dto);
  }


  @Get(':id')
  @ApiOperation({ summary: 'Get single application — both roles' })
  @ApiResponse({ status: 200, description: 'Application details' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  findOne(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.applicationsService.findOne(id, user.id);
  }
}