import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { InterviewQuestion } from './interview-question.entity';

@Entity('feedback')
export class Feedback {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  interviewQuestionId: string;

  @Column({ nullable: true })
  notes: string;

  @Column({ type: 'decimal', precision: 3, scale: 1, nullable: true })
  rating: number; // 1-5 or custom scale

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => InterviewQuestion, (iq) => iq.feedback, { onDelete: 'CASCADE' })
  @JoinColumn()
  interviewQuestion: InterviewQuestion;
}
