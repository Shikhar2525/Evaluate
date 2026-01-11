import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { TemplatesModule } from './templates/templates.module';
import { InterviewsModule } from './interviews/interviews.module';
import { User } from './auth/entities/user.entity';
import { Template } from './templates/entities/template.entity';
import { Section } from './templates/entities/section.entity';
import { Question } from './templates/entities/question.entity';
import { Interview } from './interviews/entities/interview.entity';
import { InterviewQuestion } from './interviews/entities/interview-question.entity';
import { Feedback } from './interviews/entities/feedback.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: process.env.DB_PATH || './interview.db',
      entities: [User, Template, Section, Question, Interview, InterviewQuestion, Feedback],
      synchronize: true,
      logging: false,
    }),
    AuthModule,
    TemplatesModule,
    InterviewsModule,
  ],
})
export class AppModule {}
