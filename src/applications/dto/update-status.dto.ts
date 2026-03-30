import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApplicationStatus } from '../application.entity';

export class UpdateStatusDto {
  @IsEnum(ApplicationStatus)
  status!: ApplicationStatus;

  @IsOptional()
  @IsString()
  recruiterNote?: string;
}