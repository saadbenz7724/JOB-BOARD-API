import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Application, ApplicationStatus } from './application.entity';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { QueryApplicationDto } from './dto/query-application.dto';
import { JobsService } from '../jobs/jobs.service';
import { JobStatus } from '../jobs/job.entity';
import { forwardRef, Inject } from '@nestjs/common';
import { DashboardService } from '../dashboard/dashboard.service';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(Application)
    private applicationRepository: Repository<Application>,
    private jobsService: JobsService,
    @Inject(forwardRef(() => DashboardService))
    private dashboardService: DashboardService,
  ) {}

  async apply(
    candidateId: number,
    dto: CreateApplicationDto,
  ): Promise<Application> {
    const job = await this.jobsService.findOne(dto.jobId);
    if (job.status !== JobStatus.ACTIVE) {
      throw new BadRequestException(
        'This job is no longer accepting applications',
      );
    }

    if (job.lastDate && new Date() > new Date(job.lastDate)) {
      throw new BadRequestException(
        'Application deadline for this job has passed',
      );
    }

    const existing = await this.applicationRepository.findOne({
      where: { candidateId, jobId: dto.jobId },
    });
    if (existing) {
      throw new ConflictException('You have already applied to this job');
    }

    const application = this.applicationRepository.create({
      candidateId,
      jobId: dto.jobId,
      coverLetter: dto.coverLetter,
      status: ApplicationStatus.APPLIED,
    });

    const saved = await this.applicationRepository.save(application);

    await this.jobsService.incrementApplicationCount(dto.jobId);
    await this.dashboardService.invalidateRecruiterCache(job.recruiterId);
    await this.dashboardService.invalidateCandidateCache(candidateId);

    return saved;
  }

  async getMyApplications(
    candidateId: number,
    query: QueryApplicationDto,
  ) {
    const { status, page = 1, limit = 10 } = query;

    const qb = this.applicationRepository
      .createQueryBuilder('application')
      .leftJoin('application.job', 'job')
      .leftJoin('job.recruiter', 'recruiter')
      .where('application.candidateId = :candidateId', { candidateId })
      .select([
        'application',
        'job.id',
        'job.title',
        'job.company',
        'job.location',
        'job.jobType',
        'job.salaryMin',
        'job.salaryMax',
        'job.status',
        'recruiter.id',
        'recruiter.fullName',
      ]);

    if (status) {
      qb.andWhere('application.status = :status', { status });
    }

    qb.orderBy('application.appliedAt', 'DESC');

    const skip = (page - 1) * limit;
    qb.skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    };
  }

  async getJobApplications(
    jobId: number,
    recruiterId: number,
    query: QueryApplicationDto,
  ) {
    const job = await this.jobsService.findOne(jobId);
    if (job.recruiterId !== recruiterId) {
      throw new ForbiddenException(
        'You can only view applications for your own jobs',
      );
    }

    const { status, page = 1, limit = 10 } = query;

    const qb = this.applicationRepository
      .createQueryBuilder('application')
      .leftJoin('application.candidate', 'candidate')
      .where('application.jobId = :jobId', { jobId })
      .select([
        'application',
        'candidate.id',
        'candidate.fullName',
        'candidate.email',
        'candidate.skills',
        'candidate.experience',
        'candidate.location',
      ]);

    if (status) {
      qb.andWhere('application.status = :status', { status });
    }

    qb.orderBy('application.appliedAt', 'DESC');

    const skip = (page - 1) * limit;
    qb.skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();

    const pipelineCount = await this.applicationRepository
      .createQueryBuilder('application')
      .select('application.status', 'status')
      .addSelect('COUNT(application.id)', 'count')
      .where('application.jobId = :jobId', { jobId })
      .groupBy('application.status')
      .getRawMany();

    const pipeline = {
      applied: 0,
      shortlisted: 0,
      interview: 0,
      offered: 0,
      rejected: 0,
    };

    pipelineCount.forEach((row) => {
      pipeline[row.status] = parseInt(row.count);
    });

    return {
      job: {
        id: job.id,
        title: job.title,
        company: job.company,
        totalApplications: job.totalApplications,
      },
      pipeline,
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    };
  }

  async updateStatus(
    applicationId: number,
    recruiterId: number,
    dto: UpdateStatusDto,
  ): Promise<Application> {
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId },
      relations: ['job'],
    });

    if (!application) {
      throw new NotFoundException(`Application #${applicationId} not found`);
    }

    if (application.job.recruiterId !== recruiterId) {
      throw new ForbiddenException(
        'You can only update applications for your own jobs',
      );
    }

    this.validatePipelineTransition(
      application.status,
      dto.status,
    );

    application.status = dto.status;
    application.statusUpdatedAt = new Date();
    if (dto.recruiterNote) {
      application.recruiterNote = dto.recruiterNote;
    }

    await this.dashboardService.invalidateRecruiterCache(recruiterId);
    await this.dashboardService.invalidateCandidateCache(application.candidateId);

    return this.applicationRepository.save(application);
  }

  async withdraw(
    applicationId: number,
    candidateId: number,
  ): Promise<{ message: string }> {
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundException(`Application #${applicationId} not found`);
    }

    if (application.candidateId !== candidateId) {
      throw new ForbiddenException('You can only withdraw your own applications');
    }

    if (
      application.status === ApplicationStatus.OFFERED ||
      application.status === ApplicationStatus.REJECTED
    ) {
      throw new BadRequestException(
        `Cannot withdraw application with status: ${application.status}`,
      );
    }

    const jobId = application.jobId;
    await this.applicationRepository.remove(application);

    await this.jobsService.decrementApplicationCount(jobId);
    const job = await this.jobsService.findOne(jobId);
    await this.dashboardService.invalidateRecruiterCache(job.recruiterId);
    await this.dashboardService.invalidateCandidateCache(candidateId);

    return { message: 'Application withdrawn successfully' };
  }

  async findOne(
    applicationId: number,
    userId: number,
  ): Promise<Application> {
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId },
      relations: ['job', 'candidate', 'job.recruiter'],
    });

    if (!application) {
      throw new NotFoundException(`Application #${applicationId} not found`);
    }

    if (
      application.candidateId !== userId &&
      application.job.recruiterId !== userId
    ) {
      throw new ForbiddenException('Access denied');
    }

    return application;
  }

  private validatePipelineTransition(
    current: ApplicationStatus,
    next: ApplicationStatus,
  ): void {
    const allowedTransitions: Record<ApplicationStatus, ApplicationStatus[]> = {
      [ApplicationStatus.APPLIED]: [
        ApplicationStatus.SHORTLISTED,
        ApplicationStatus.REJECTED,
      ],
      [ApplicationStatus.SHORTLISTED]: [
        ApplicationStatus.INTERVIEW,
        ApplicationStatus.REJECTED,
      ],
      [ApplicationStatus.INTERVIEW]: [
        ApplicationStatus.OFFERED,
        ApplicationStatus.REJECTED,
      ],
      [ApplicationStatus.OFFERED]: [
        ApplicationStatus.REJECTED,
      ],
      [ApplicationStatus.REJECTED]: [],
    };

    if (!allowedTransitions[current].includes(next)) {
      throw new BadRequestException(
        `Invalid pipeline transition: ${current} → ${next}. Allowed: ${allowedTransitions[current].join(', ') || 'none'}`,
      );
    }
  }
}