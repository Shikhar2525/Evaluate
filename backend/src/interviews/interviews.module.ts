import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Interview } from './entities/interview.entity';
import { InterviewQuestion } from './entities/interview-question.entity';
import { Feedback } from './entities/feedback.entity';
import { InterviewsService } from './interviews.service';
import { InterviewsController } from './interviews.controller';
import { Template } from '../templates/entities/template.entity';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [TypeOrmModule.forFeature([Interview, InterviewQuestion, Feedback, Template]), AiModule],
  providers: [InterviewsService],
  controllers: [InterviewsController],
  exports: [InterviewsService],
})
export class InterviewsModule {}
