import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApplicationStatus } from '../application.entity';

export class UpdateStatusDto {
  @ApiProperty({
    enum: ApplicationStatus,
    example: ApplicationStatus.SHORTLISTED,
    description: 'New pipeline status',
  })
  @IsEnum(ApplicationStatus)
  status!: ApplicationStatus;

  @ApiPropertyOptional({ example: 'Strong profile, good skills match' })
  @IsOptional()
  @IsString()
  recruiterNote?: string;
}