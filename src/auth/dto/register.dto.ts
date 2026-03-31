import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../users/user.entity';

export class RegisterDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  fullName!: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '123456', minLength: 6 })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({
    enum: [UserRole.RECRUITER, UserRole.CANDIDATE],
    example: UserRole.CANDIDATE,
    description: 'Choose recruiter or candidate role',
  })
  @IsEnum([UserRole.RECRUITER, UserRole.CANDIDATE])
  role!: UserRole;

  @ApiPropertyOptional({ example: 'Delhi' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: 'Node.js,React,MySQL' })
  @IsOptional()
  @IsString()
  skills?: string;

  @ApiPropertyOptional({ example: 'Fresher' })
  @IsOptional()
  @IsString()
  experience?: string;
}