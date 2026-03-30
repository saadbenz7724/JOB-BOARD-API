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
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { QueryJobDto } from './dto/query-job.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User, UserRole } from '../users/user.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('jobs')
export class JobsController {
  constructor(private jobsService: JobsService) {}

  @Post()
  @Roles(UserRole.RECRUITER)
  create(
    @CurrentUser() user: User,
    @Body() dto: CreateJobDto,
  ) {
    return this.jobsService.create(user.id, dto);
  }

  @Get('my-jobs')
  @Roles(UserRole.RECRUITER)
  getMyJobs(
    @CurrentUser() user: User,
    @Query() query: QueryJobDto,
  ) {
    return this.jobsService.findMyJobs(user.id, query);
  }

  @Patch(':id')
  @Roles(UserRole.RECRUITER)
  update(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateJobDto,
  ) {
    return this.jobsService.update(id, user.id, dto);
  }

  @Patch(':id/close')
  @Roles(UserRole.RECRUITER)
  closeJob(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.jobsService.closeJob(id, user.id);
  }

  @Delete(':id')
  @Roles(UserRole.RECRUITER)
  remove(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.jobsService.remove(id, user.id);
  }

  @Get()
  findAll(@Query() query: QueryJobDto) {
    return this.jobsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.jobsService.findOne(id);
  }
}