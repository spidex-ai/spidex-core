import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { UserPointService } from '../src/modules/user-point/services/user-point.service';
import { PaginationDto } from '../src/shared/dtos/page-meta.dto';

async function testLeaderboardPerformance() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userPointService = app.get(UserPointService);

  console.log('Testing leaderboard performance...');

  const pagination: PaginationDto = { page: 1, limit: 20 };

  // Test multiple times to get average performance
  const iterations = 5;
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const startTime = Date.now();
    
    try {
      const result = await userPointService.getLeaderboard(1, pagination);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      times.push(duration);
      
      console.log(`Iteration ${i + 1}:`);
      console.log(`  - Duration: ${duration}ms`);
      console.log(`  - Results: ${result.data.length} users`);
      console.log(`  - Total users: ${result.meta.itemCount}`);
      
      if (result.data.length > 0) {
        const firstUser = result.data[0];
        console.log(`  - First user: ${firstUser.user.username} (${firstUser.totalPoint} points, ${firstUser.totalReferralCount} referrals)`);
      }
      
      console.log('');
    } catch (error) {
      console.error(`Error in iteration ${i + 1}:`, error.message);
    }
  }

  const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);

  console.log('Performance Summary:');
  console.log(`  - Average time: ${avgTime.toFixed(2)}ms`);
  console.log(`  - Min time: ${minTime}ms`);
  console.log(`  - Max time: ${maxTime}ms`);
  console.log(`  - Total iterations: ${iterations}`);

  await app.close();
}

testLeaderboardPerformance().catch(console.error);
