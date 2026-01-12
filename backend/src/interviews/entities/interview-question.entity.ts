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

  @Column({ nullable: true })
  questionId: string;

  @Column()
  interviewId: string;

  @Column({ default: 0 })
  order: number;

  @Column({ default: false })
  skipped: boolean;

  // Snapshot of question data at the time of interview creation
  @Column({ type: 'text', nullable: true })
  questionSnapshot: string; // JSON string of question data

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
