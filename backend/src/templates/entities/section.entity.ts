import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Template } from './template.entity';
import { Question } from './question.entity';

@Entity('sections')
export class Section {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  codeLanguage: string;

  @Column({ default: 0 })
  order: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Template, (template) => template.sections, { onDelete: 'CASCADE' })
  template: Template;

  @Column()
  templateId: string;

  @OneToMany(() => Question, (question) => question.section)
  questions: Question[];
}
