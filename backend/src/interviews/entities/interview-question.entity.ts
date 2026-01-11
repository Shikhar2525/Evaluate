import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { Interview } from './interview.entity';
import { Question } from '../../templates/entities/question.entity';
import { Feedback } from './feedback.entity';

@Entity('interview_questions')
export class InterviewQuestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  questionId: string;

  @Column()
  interviewId: string;

  @Column({ default: 0 })
  order: number;

  @Column({ default: false })
  skipped: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Interview, (interview) => interview.questions, { onDelete: 'CASCADE' })
  interview: Interview;

  @ManyToOne(() => Question, (question) => question.interviewQuestions)
  question: Question;

  @OneToOne(() => Feedback, (feedback) => feedback.interviewQuestion)
  feedback: Feedback;
}
