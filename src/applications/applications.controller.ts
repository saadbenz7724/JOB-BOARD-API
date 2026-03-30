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
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { QueryApplicationDto } from './dto/query-application.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User, UserRole } from '../users/user.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('applications')
export class ApplicationsController {
  constructor(private applicationsService: ApplicationsService) {}


  @Post()
  @Roles(UserRole.CANDIDATE)
  apply(
    @CurrentUser() user: User,
    @Body() dto: CreateApplicationDto,
  ) {
    return this.applicationsService.apply(user.id, dto);
  }

  @Get('my-applications')
  @Roles(UserRole.CANDIDATE)
  getMyApplications(
    @CurrentUser() user: User,
    @Query() query: QueryApplicationDto,
  ) {
    return this.applicationsService.getMyApplications(user.id, query);
  }

  @Delete(':id/withdraw')
  @Roles(UserRole.CANDIDATE)
  withdraw(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.applicationsService.withdraw(id, user.id);
  }


  @Get('job/:jobId')
  @Roles(UserRole.RECRUITER)
  getJobApplications(
    @CurrentUser() user: User,
    @Param('jobId', ParseIntPipe) jobId: number,
    @Query() query: QueryApplicationDto,
  ) {
    return this.applicationsService.getJobApplications(
      jobId,
      user.id,
      query,
    );
  }

  @Patch(':id/status')
  @Roles(UserRole.RECRUITER)
  updateStatus(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.applicationsService.updateStatus(id, user.id, dto);
  }


  @Get(':id')
  findOne(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.applicationsService.findOne(id, user.id);
  }
}