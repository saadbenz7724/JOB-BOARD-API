import { IsOptional, IsEnum, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApplicationStatus } from '../application.entity';

export class QueryApplicationDto {
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}