import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Job } from '../jobs/job.entity';

export enum ApplicationStatus {
  APPLIED = 'applied',
  SHORTLISTED = 'shortlisted',
  INTERVIEW = 'interview',
  OFFERED = 'offered',
  REJECTED = 'rejected',
}

@Entity('applications')
export class Application {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'enum',
    enum: ApplicationStatus,
    default: ApplicationStatus.APPLIED,
  })
  status!: ApplicationStatus;

  @Column({ name: 'cover_letter', type: 'text', nullable: true })
  coverLetter!: string;

  @Column({ name: 'recruiter_note', type: 'text', nullable: true })
  recruiterNote!: string;

  @Column({ name: 'applied_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  appliedAt!: Date;

  @Column({ name: 'status_updated_at', type: 'timestamp', nullable: true })
  statusUpdatedAt!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.applications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'candidate_id' })
  candidate!: User;

  @Column({ name: 'candidate_id' })
  candidateId!: number;

  @ManyToOne(() => Job, (job) => job.applications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_id' })
  job!: Job;

  @Column({ name: 'job_id' })
  jobId!: number;
}