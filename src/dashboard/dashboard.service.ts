import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job, JobStatus } from '../jobs/job.entity';
import { Application, ApplicationStatus } from '../applications/application.entity';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
    @InjectRepository(Application)
    private applicationRepository: Repository<Application>,
    private redisService: RedisService,
  ) {}

  async getRecruiterDashboard(recruiterId: number) {
    const cacheKey = `dashboard:recruiter:${recruiterId}`;
    const CACHE_TTL = 300;

    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      console.log(`Cache HIT for recruiter ${recruiterId}`);
      return {
        ...(cached as object),
        fromCache: true,
      };
    }

    console.log(`Cache MISS for recruiter ${recruiterId}`);

    const [
      jobStats,
      applicationStats,
      recentJobs,
      topJobs,
      pipelineOverview,
    ] = await Promise.all([
      this.getJobStats(recruiterId),
      this.getApplicationStats(recruiterId),
      this.getRecentJobs(recruiterId),
      this.getTopJobs(recruiterId),
      this.getPipelineOverview(recruiterId),
    ]);

    const dashboard = {
      jobStats,
      applicationStats,
      recentJobs,
      topJobs,
      pipelineOverview,
      generatedAt: new Date().toISOString(),
      fromCache: false,
    };

    await this.redisService.set(cacheKey, dashboard, CACHE_TTL);

    return dashboard;
  }

  async getCandidateDashboard(candidateId: number) {
    const cacheKey = `dashboard:candidate:${candidateId}`;
    const CACHE_TTL = 180;

    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      console.log(`Cache HIT for candidate ${candidateId}`);
      return {
        ...(cached as object),
        fromCache: true,
      };
    }

    console.log(`Cache MISS for candidate ${candidateId}`);

    const [applicationSummary, recentApplications, statusBreakdown] =
      await Promise.all([
        this.getCandidateApplicationSummary(candidateId),
        this.getCandidateRecentApplications(candidateId),
        this.getCandidateStatusBreakdown(candidateId),
      ]);

    const dashboard = {
      applicationSummary,
      recentApplications,
      statusBreakdown,
      generatedAt: new Date().toISOString(),
      fromCache: false,
    };

    await this.redisService.set(cacheKey, dashboard, CACHE_TTL);

    return dashboard;
  }

  async invalidateRecruiterCache(recruiterId: number): Promise<void> {
    await this.redisService.del(`dashboard:recruiter:${recruiterId}`);
    console.log(`🗑️  Recruiter cache cleared for ${recruiterId}`);
  }

  async invalidateCandidateCache(candidateId: number): Promise<void> {
    await this.redisService.del(`dashboard:candidate:${candidateId}`);
    console.log(`🗑️  Candidate cache cleared for ${candidateId}`);
  }

  private async getJobStats(recruiterId: number) {
    const result = await this.jobRepository
      .createQueryBuilder('job')
      .select('job.status', 'status')
      .addSelect('COUNT(job.id)', 'count')
      .where('job.recruiter_id = :recruiterId', { recruiterId })
      .groupBy('job.status')
      .getRawMany();

    const stats = { total: 0, active: 0, closed: 0, draft: 0 };

    result.forEach((row) => {
      stats[row.status] = parseInt(row.count);
      stats.total += parseInt(row.count);
    });

    return stats;
  }

  private async getApplicationStats(recruiterId: number) {
    const result = await this.applicationRepository
      .createQueryBuilder('application')
      .leftJoin('application.job', 'job')
      .select('application.status', 'status')
      .addSelect('COUNT(application.id)', 'count')
      .where('job.recruiter_id = :recruiterId', { recruiterId })
      .groupBy('application.status')
      .getRawMany();

    const stats = {
      total: 0,
      applied: 0,
      shortlisted: 0,
      interview: 0,
      offered: 0,
      rejected: 0,
    };

    result.forEach((row) => {
      stats[row.status] = parseInt(row.count);
      stats.total += parseInt(row.count);
    });

    return stats;
  }

  private async getRecentJobs(recruiterId: number) {
    return this.jobRepository.find({
      where: { recruiterId },
      order: { createdAt: 'DESC' },
      take: 5,
      select: [
        'id',
        'title',
        'company',
        'location',
        'status',
        'totalApplications',
        'createdAt',
      ],
    });
  }

  private async getTopJobs(recruiterId: number) {
    return this.jobRepository
      .createQueryBuilder('job')
      .where('job.recruiter_id = :recruiterId', { recruiterId })
      .orderBy('job.total_applications', 'DESC')
      .take(5)
      .select([
        'job.id',
        'job.title',
        'job.company',
        'job.status',
        'job.totalApplications',
      ])
      .getMany();
  }

  private async getPipelineOverview(recruiterId: number) {
    const result = await this.applicationRepository
      .createQueryBuilder('application')
      .leftJoin('application.job', 'job')
      .select('job.id', 'jobId')
      .addSelect('job.title', 'jobTitle')
      .addSelect('COUNT(application.id)', 'total')
      .addSelect(
        `SUM(CASE WHEN application.status = 'shortlisted' THEN 1 ELSE 0 END)`,
        'shortlisted',
      )
      .addSelect(
        `SUM(CASE WHEN application.status = 'interview' THEN 1 ELSE 0 END)`,
        'interview',
      )
      .addSelect(
        `SUM(CASE WHEN application.status = 'offered' THEN 1 ELSE 0 END)`,
        'offered',
      )
      .where('job.recruiter_id = :recruiterId', { recruiterId })
      .groupBy('job.id')
      .orderBy('total', 'DESC')
      .take(5)
      .getRawMany();

    return result.map((row) => ({
      jobId: row.jobId,
      jobTitle: row.jobTitle,
      total: parseInt(row.total),
      shortlisted: parseInt(row.shortlisted),
      interview: parseInt(row.interview),
      offered: parseInt(row.offered),
    }));
  }

  private async getCandidateApplicationSummary(candidateId: number) {
    const result = await this.applicationRepository
      .createQueryBuilder('application')
      .select('COUNT(application.id)', 'total')
      .addSelect(
        `SUM(CASE WHEN application.status = 'shortlisted' THEN 1 ELSE 0 END)`,
        'shortlisted',
      )
      .addSelect(
        `SUM(CASE WHEN application.status = 'interview' THEN 1 ELSE 0 END)`,
        'interview',
      )
      .addSelect(
        `SUM(CASE WHEN application.status = 'offered' THEN 1 ELSE 0 END)`,
        'offered',
      )
      .addSelect(
        `SUM(CASE WHEN application.status = 'rejected' THEN 1 ELSE 0 END)`,
        'rejected',
      )
      .where('application.candidate_id = :candidateId', { candidateId })
      .getRawOne();

    return {
      total: parseInt(result?.total || '0'),
      shortlisted: parseInt(result?.shortlisted || '0'),
      interview: parseInt(result?.interview || '0'),
      offered: parseInt(result?.offered || '0'),
      rejected: parseInt(result?.rejected || '0'),
    };
  }

  private async getCandidateRecentApplications(candidateId: number) {
    return this.applicationRepository
      .createQueryBuilder('application')
      .leftJoinAndSelect('application.job', 'job')
      .where('application.candidateId = :candidateId', { candidateId })
      .orderBy('application.appliedAt', 'DESC')
      .take(5)
      .select([
        'application.id',
        'application.status',
        'application.appliedAt',
        'application.statusUpdatedAt',
        'job.id',
        'job.title',
        'job.company',
        'job.location',
      ])
      .getMany();
  }

  private async getCandidateStatusBreakdown(candidateId: number) {
    const result = await this.applicationRepository
      .createQueryBuilder('application')
      .select('application.status', 'status')
      .addSelect('COUNT(application.id)', 'count')
      .where('application.candidate_id = :candidateId', { candidateId })
      .groupBy('application.status')
      .getRawMany();

    return result.map((row) => ({
      status: row.status,
      count: parseInt(row.count),
    }));
  }
}