import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Template } from './entities/template.entity';
import { Section } from './entities/section.entity';
import { Question } from './entities/question.entity';
import { InterviewQuestion } from '../interviews/entities/interview-question.entity';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { CreateSectionDto } from './dto/create-section.dto';
import { CreateQuestionDto } from './dto/create-question.dto';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectRepository(Template)
    private readonly templateRepository: Repository<Template>,
    @InjectRepository(Section)
    private readonly sectionRepository: Repository<Section>,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectRepository(InterviewQuestion)
    private readonly interviewQuestionRepository: Repository<InterviewQuestion>,
  ) {}

  // Template operations
  async createTemplate(userId: string, createTemplateDto: CreateTemplateDto) {
    const template = this.templateRepository.create({
      ...createTemplateDto,
      userId,
    });
    return this.templateRepository.save(template);
  }

  async getTemplatesByUser(userId: string) {
    return this.templateRepository.find({
      where: { userId },
      relations: ['sections', 'sections.questions'],
      order: { createdAt: 'DESC' },
    });
  }

  async getTemplateById(templateId: string, userId: string) {
    const template = await this.templateRepository.findOne({
      where: { id: templateId, userId },
      relations: ['sections', 'sections.questions'],
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    return template;
  }

  async updateTemplate(templateId: string, userId: string, updateTemplateDto: UpdateTemplateDto) {
    const template = await this.getTemplateById(templateId, userId);

    Object.assign(template, updateTemplateDto);
    return this.templateRepository.save(template);
  }

  async deleteTemplate(templateId: string, userId: string) {
    const template = await this.getTemplateById(templateId, userId);
    await this.templateRepository.remove(template);
    return { message: 'Template deleted successfully' };
  }

  // Section operations
  async addSection(templateId: string, userId: string, createSectionDto: CreateSectionDto) {
    const template = await this.getTemplateById(templateId, userId);

    const section = this.sectionRepository.create({
      ...createSectionDto,
      templateId,
    });

    return this.sectionRepository.save(section);
  }

  async updateSection(
    sectionId: string,
    userId: string,
    createSectionDto: CreateSectionDto,
  ) {
    const section = await this.sectionRepository.findOne({
      where: { id: sectionId },
      relations: ['template'],
    });

    if (!section || section.template.userId !== userId) {
      throw new NotFoundException('Section not found');
    }

    Object.assign(section, createSectionDto);
    return this.sectionRepository.save(section);
  }

  async deleteSection(sectionId: string, userId: string) {
    try {
      const section = await this.sectionRepository.findOne({
        where: { id: sectionId },
        relations: ['template', 'questions'],
      });

      if (!section) {
        throw new NotFoundException('Section not found');
      }

      if (section.template.userId !== userId) {
        throw new NotFoundException('Unauthorized to delete this section');
      }

      // Delete all interview questions and their feedback for questions in this section
      if (section.questions && section.questions.length > 0) {
        const questionIds = section.questions.map(q => q.id);
        // Delete interview questions which will cascade delete feedback
        await this.interviewQuestionRepository.delete({ questionId: In(questionIds) });
      }

      // Delete the section (which will cascade delete questions due to foreign key constraint)
      await this.sectionRepository.delete(sectionId);
      return { message: 'Section deleted successfully' };
    } catch (error) {
      console.error('Delete section error:', error);
      throw error;
    }
  }

  // Question operations
  async addQuestion(sectionId: string, userId: string, createQuestionDto: CreateQuestionDto) {
    const section = await this.sectionRepository.findOne({
      where: { id: sectionId },
      relations: ['template'],
    });

    if (!section || section.template.userId !== userId) {
      throw new NotFoundException('Section not found');
    }

    const question = this.questionRepository.create({
      ...createQuestionDto,
      sectionId,
    });

    return this.questionRepository.save(question);
  }

  async updateQuestion(questionId: string, userId: string, createQuestionDto: CreateQuestionDto) {
    const question = await this.questionRepository.findOne({
      where: { id: questionId },
      relations: ['section', 'section.template'],
    });

    if (!question || question.section.template.userId !== userId) {
      throw new NotFoundException('Question not found');
    }

    Object.assign(question, createQuestionDto);
    return this.questionRepository.save(question);
  }

  async deleteQuestion(questionId: string, userId: string) {
    try {
      const question = await this.questionRepository.findOne({
        where: { id: questionId },
        relations: ['section', 'section.template'],
      });

      if (!question) {
        throw new NotFoundException('Question not found');
      }

      if (question.section.template.userId !== userId) {
        throw new NotFoundException('Unauthorized to delete this question');
      }

      // Get all interview questions using this template question
      const interviewQuestions = await this.interviewQuestionRepository.find({
        where: { questionId },
        relations: ['interview'],
      });

      // Delete interview questions from in-progress interviews completely
      const inProgressQuestionIds = interviewQuestions
        .filter((iq) => iq.interview.status === 'in_progress')
        .map((iq) => iq.id);

      if (inProgressQuestionIds.length > 0) {
        await this.interviewQuestionRepository.delete(inProgressQuestionIds);
      }

      // For completed interviews, set questionId to NULL but keep the record
      // (it's protected by snapshot data)
      const completedQuestionIds = interviewQuestions
        .filter((iq) => iq.interview.status === 'completed')
        .map((iq) => iq.id);

      if (completedQuestionIds.length > 0) {
        await this.interviewQuestionRepository.update(
          { id: In(completedQuestionIds) },
          { questionId: null },
        );
      }

      // Now delete the question - no more foreign key constraints
      await this.questionRepository.delete(questionId);
      return { message: 'Question deleted successfully' };
    } catch (error) {
      console.error('Delete question error:', error);
      throw error;
    }
  }
}
