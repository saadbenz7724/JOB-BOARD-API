import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Job } from '../jobs/job.entity';
import { Application } from '../applications/application.entity';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { ApplicationsModule } from '../applications/applications.module';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Job, Application]),
    forwardRef(() => ApplicationsModule),
    RedisModule,
  ],
  providers: [DashboardService],
  controllers: [DashboardController],
  exports: [DashboardService],
})
export class DashboardModule {}