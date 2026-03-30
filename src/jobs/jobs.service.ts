import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job, JobStatus } from './job.entity';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { QueryJobDto } from './dto/query-job.dto';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
  ) {}

  async create(recruiterId: number, dto: CreateJobDto): Promise<Job> {
    const jobData = {
      ...dto,
      recruiterId,
      status: JobStatus.ACTIVE,
      lastDate: dto.lastDate ? new Date(dto.lastDate) : undefined,
    };

    const job = this.jobRepository.create(jobData);
    return await this.jobRepository.save(job);
  }

  async findAll(query: QueryJobDto) {
    const {
      search,
      jobType,
      experienceLevel,
      location,
      skills,
      salaryMin,
      salaryMax,
      page = 1,
      limit = 10,
    } = query;

    const qb = this.jobRepository
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.recruiter', 'recruiter')
      .where('job.status = :status', { status: JobStatus.ACTIVE })
      .select([
        'job',
        'recruiter.id',
        'recruiter.fullName',
        'recruiter.email',
      ]);

    if (search) {
      qb.andWhere(
        '(job.title LIKE :search OR job.description LIKE :search OR job.company LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (jobType) {
      qb.andWhere('job.job_type = :jobType', { jobType });
    }

    if (experienceLevel) {
      qb.andWhere('job.experience_level = :experienceLevel', {
        experienceLevel,
      });
    }

    if (location) {
      qb.andWhere('job.location LIKE :location', {
        location: `%${location}%`,
      });
    }

    if (skills) {
      qb.andWhere('job.skills LIKE :skills', {
        skills: `%${skills}%`,
      });
    }

    if (salaryMin) {
      qb.andWhere('job.salary_min >= :salaryMin', { salaryMin });
    }
    if (salaryMax) {
      qb.andWhere('job.salary_max <= :salaryMax', { salaryMax });
    }

    qb.orderBy('job.created_at', 'DESC');

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

  async findOne(id: number): Promise<Job> {
    const job = await this.jobRepository.findOne({
      where: { id },
      relations: ['recruiter'],
    });

    if (!job) {
      throw new NotFoundException(`Job #${id} not found`);
    }

    return job;
  }

  async findMyJobs(recruiterId: number, query: QueryJobDto) {
    const { page = 1, limit = 10 } = query;

    const qb = this.jobRepository
      .createQueryBuilder('job')
      .where('job.recruiter_id = :recruiterId', { recruiterId })
      .orderBy('job.created_at', 'DESC');

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

  async update(
    id: number,
    recruiterId: number,
    dto: UpdateJobDto,
  ): Promise<Job> {
    const job = await this.findOne(id);

    if (job.recruiterId !== recruiterId) {
      throw new ForbiddenException('You can only update your own jobs');
    }

    Object.assign(job, {
      ...dto,
      lastDate: dto.lastDate ? new Date(dto.lastDate) : job.lastDate,
    });

    return this.jobRepository.save(job);
  }

  async closeJob(id: number, recruiterId: number): Promise<Job> {
    const job = await this.findOne(id);

    if (job.recruiterId !== recruiterId) {
      throw new ForbiddenException('You can only close your own jobs');
    }

    job.status = JobStatus.CLOSED;
    return this.jobRepository.save(job);
  }

  async remove(id: number, recruiterId: number): Promise<{ message: string }> {
    const job = await this.findOne(id);

    if (job.recruiterId !== recruiterId) {
      throw new ForbiddenException('You can only delete your own jobs');
    }

    await this.jobRepository.remove(job);
    return { message: 'Job deleted successfully' };
  }

  async incrementApplicationCount(jobId: number): Promise<void> {
    await this.jobRepository.increment(
      { id: jobId },
      'totalApplications',
      1,
    );
  }

  async decrementApplicationCount(jobId: number): Promise<void> {
    await this.jobRepository.decrement(
      { id: jobId },
      'totalApplications',
      1,
    );
  }
}