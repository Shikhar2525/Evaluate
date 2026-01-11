import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Template } from '../../templates/entities/template.entity';
import { InterviewQuestion } from './interview-question.entity';

@Entity('interviews')
export class Interview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  templateId: string;

  @Column()
  userId: string;

  @Column({ nullable: true })
  candidateName: string;

  @Column({ default: 'in_progress' })
  status: string; // 'in_progress', 'completed', 'draft'

  @Column({ nullable: true })
  overallNotes: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.interviews, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Template)
  template: Template;

  @OneToMany(() => InterviewQuestion, (iq) => iq.interview)
  questions: InterviewQuestion[];
}
