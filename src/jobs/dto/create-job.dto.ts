import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsDateString,
  Min,
  IsNotEmpty,
} from 'class-validator';
import { JobType, ExperienceLevel } from '../job.entity';

export class CreateJobDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsString()
  @IsNotEmpty()
  company!: string;

  @IsString()
  @IsNotEmpty()
  location!: string;

  @IsEnum(JobType)
  jobType!: JobType;

  @IsEnum(ExperienceLevel)
  experienceLevel!: ExperienceLevel;

  @IsOptional()
  @IsNumber()
  @Min(0)
  salaryMin?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  salaryMax?: number;

  @IsOptional()
  @IsString()
  requirements?: string;

  @IsOptional()
  @IsString()
  benefits?: string;

  @IsOptional()
  @IsString()
  skills?: string;

  @IsOptional()
  @IsDateString()
  lastDate?: string;
}