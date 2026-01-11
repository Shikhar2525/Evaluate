import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Section } from './section.entity';

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  text: string;

  @Column({ nullable: true })
  codeSnippet: string;

  @Column({ nullable: true })
  codeLanguage: string;

  @Column({ nullable: true })
  difficulty: string; // 'easy', 'medium', 'hard', or custom

  @Column({ nullable: true })
  expectedAnswer: string;

  @Column({ default: 0 })
  order: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Section, (section) => section.questions, { onDelete: 'CASCADE' })
  section: Section;

  @Column()
  sectionId: string;

  @OneToMany('InterviewQuestion', 'question')
  interviewQuestions: any[];
}
