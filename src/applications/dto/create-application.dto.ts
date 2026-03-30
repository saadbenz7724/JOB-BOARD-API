import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateApplicationDto {
  @IsNumber()
  jobId!: number;

  @IsOptional()
  @IsString()
  coverLetter?: string;
}