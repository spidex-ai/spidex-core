import { Global, Module } from '@nestjs/common';
import { UserActivityTrackingService } from './user-activity-tracking.service';

@Global()
@Module({
  providers: [UserActivityTrackingService],
  exports: [UserActivityTrackingService],
})
export class SharedServicesModule {}
