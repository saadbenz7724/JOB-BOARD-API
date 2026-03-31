import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateApplicationDto {
  @ApiProperty({ example: 1, description: 'ID of the job to apply to' })
  @IsNumber()
  jobId!: number;

  @ApiPropertyOptional({
    example: 'I am a fresher with strong NestJS skills...',
  })
  @IsOptional()
  @IsString()
  coverLetter?: string;
}