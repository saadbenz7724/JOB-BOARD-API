import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Application } from './application.entity';
import { ApplicationsService } from './applications.service';
import { ApplicationsController } from './applications.controller';
import { JobsModule } from '../jobs/jobs.module';
import { DashboardModule } from '../dashboard/dashboard.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Application]),
    JobsModule,
    forwardRef(() => DashboardModule),
  ],
  providers: [ApplicationsService],
  controllers: [ApplicationsController],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}