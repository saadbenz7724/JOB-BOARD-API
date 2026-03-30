import { Application } from 'src/applications/application.entity';
import { RefreshToken } from 'src/auth/refresh-token.entity';
import { Job } from 'src/jobs/job.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

export enum UserRole {
  RECRUITER = 'recruiter',
  CANDIDATE = 'candidate',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'full_name' })
  fullName!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.CANDIDATE })
  role!: UserRole;

  @Column({ nullable: true })
  skills!: string;

  @Column({ nullable: true })
  experience!: string;

  @Column({ nullable: true })
  location!: string;

  @Column({ nullable: true })
  bio!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relations
  @OneToMany(() => Job, (job) => job.recruiter)
  jobs!: Job[];

  @OneToMany(() => Application, (application) => application.candidate)
  applications!: Application[];

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens!: RefreshToken[];
}