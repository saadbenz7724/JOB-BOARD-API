import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Application } from 'src/applications/application.entity';

export enum JobType {
  FULL_TIME = 'full_time',
  PART_TIME = 'part_time',
  INTERNSHIP = 'internship',
  CONTRACT = 'contract',
  REMOTE = 'remote',
}

export enum JobStatus {
  ACTIVE = 'active',
  CLOSED = 'closed',
  DRAFT = 'draft',
}

export enum ExperienceLevel {
  FRESHER = 'fresher',
  JUNIOR = 'junior',
  MID = 'mid',
  SENIOR = 'senior',
}

@Entity('jobs')
export class Job {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column()
  company!: string;

  @Column()
  location!: string;

  @Column({ name: 'job_type', type: 'enum', enum: JobType })
  jobType!: JobType;

  @Column({
    name: 'experience_level',
    type: 'enum',
    enum: ExperienceLevel,
    default: ExperienceLevel.FRESHER,
  })
  experienceLevel!: ExperienceLevel;

  @Column({ name: 'salary_min', type: 'decimal', precision: 10, scale: 2, nullable: true })
  salaryMin!: number;

  @Column({ name: 'salary_max', type: 'decimal', precision: 10, scale: 2, nullable: true })
  salaryMax!: number;

  @Column({ type: 'text', nullable: true })
  requirements!: string;

  @Column({ type: 'text', nullable: true })
  benefits!: string;

  @Column({ nullable: true })
  skills!: string;

  @Column({
    type: 'enum',
    enum: JobStatus,
    default: JobStatus.ACTIVE,
  })
  status!: JobStatus;

  @Column({ name: 'last_date', type: 'date', nullable: true })
  lastDate!: Date;

  @Column({ name: 'total_applications', default: 0 })
  totalApplications!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => User, (user) => user.jobs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recruiter_id' })
  recruiter!: User;

  @Column({ name: 'recruiter_id' })
  recruiterId!: number;

  @OneToMany(() => Application, (application) => application.job)
  applications!: Application[];
}