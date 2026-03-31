import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsDateString,
  Min,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JobType, ExperienceLevel } from '../job.entity';

export class CreateJobDto {
  @ApiProperty({ example: 'Backend Developer' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'We are looking for a Node.js developer...' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ example: 'Tech Corp' })
  @IsString()
  @IsNotEmpty()
  company!: string;

  @ApiProperty({ example: 'Delhi' })
  @IsString()
  @IsNotEmpty()
  location!: string;

  @ApiProperty({ enum: JobType, example: JobType.FULL_TIME })
  @IsEnum(JobType)
  jobType!: JobType;

  @ApiProperty({ enum: ExperienceLevel, example: ExperienceLevel.FRESHER })
  @IsEnum(ExperienceLevel)
  experienceLevel!: ExperienceLevel;

  @ApiPropertyOptional({ example: 300000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  salaryMin?: number;

  @ApiPropertyOptional({ example: 600000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  salaryMax?: number;

  @ApiPropertyOptional({ example: 'Knowledge of NestJS and TypeORM' })
  @IsOptional()
  @IsString()
  requirements?: string;

  @ApiPropertyOptional({ example: 'Health insurance, flexible hours' })
  @IsOptional()
  @IsString()
  benefits?: string;

  @ApiPropertyOptional({ example: 'Node.js,MySQL,REST API' })
  @IsOptional()
  @IsString()
  skills?: string;

  @ApiPropertyOptional({ example: '2025-04-30' })
  @IsOptional()
  @IsDateString()
  lastDate?: string;
}