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
  ApiQuery,
} from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { QueryJobDto } from './dto/query-job.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User, UserRole } from '../users/user.entity';

@ApiTags('Jobs')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('jobs')
export class JobsController {
  constructor(private jobsService: JobsService) {}

  @Post()
  @Roles(UserRole.RECRUITER)
  @ApiOperation({ summary: 'Create a new job posting — Recruiter only' })
  @ApiResponse({ status: 201, description: 'Job created successfully' })
  @ApiResponse({ status: 403, description: 'Only recruiters can post jobs' })
  create(@CurrentUser() user: User, @Body() dto: CreateJobDto) {
    return this.jobsService.create(user.id, dto);
  }

  @Get('my-jobs')
  @Roles(UserRole.RECRUITER)
  @ApiOperation({ summary: 'Get all jobs posted by current recruiter' })
  @ApiResponse({ status: 200, description: 'Recruiter job list' })
  getMyJobs(
    @CurrentUser() user: User,
    @Query() query: QueryJobDto,
  ) {
    return this.jobsService.findMyJobs(user.id, query);
  }

  @Patch(':id')
  @Roles(UserRole.RECRUITER)
  @ApiOperation({ summary: 'Update a job posting — owner recruiter only' })
  @ApiResponse({ status: 200, description: 'Job updated' })
  @ApiResponse({ status: 403, description: 'You can only update your own jobs' })
  update(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateJobDto,
  ) {
    return this.jobsService.update(id, user.id, dto);
  }

  @Patch(':id/close')
  @Roles(UserRole.RECRUITER)
  @ApiOperation({ summary: 'Close a job posting' })
  @ApiResponse({ status: 200, description: 'Job closed' })
  closeJob(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.jobsService.closeJob(id, user.id);
  }

  @Delete(':id')
  @Roles(UserRole.RECRUITER)
  @ApiOperation({ summary: 'Delete a job posting' })
  @ApiResponse({ status: 200, description: 'Job deleted' })
  remove(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.jobsService.remove(id, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all active jobs with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Paginated job list' })
  @ApiQuery({ name: 'search', required: false, example: 'backend developer' })
  @ApiQuery({ name: 'location', required: false, example: 'Delhi' })
  @ApiQuery({ name: 'jobType', required: false, enum: ['full_time', 'part_time', 'internship', 'contract', 'remote'] })
  @ApiQuery({ name: 'experienceLevel', required: false, enum: ['fresher', 'junior', 'mid', 'senior'] })
  @ApiQuery({ name: 'salaryMin', required: false, type: Number })
  @ApiQuery({ name: 'salaryMax', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(@Query() query: QueryJobDto) {
    return this.jobsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single job by ID' })
  @ApiResponse({ status: 200, description: 'Job details' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.jobsService.findOne(id);
  }
}