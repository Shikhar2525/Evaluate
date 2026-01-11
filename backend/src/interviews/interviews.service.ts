import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Interview } from './entities/interview.entity';
import { InterviewQuestion } from './entities/interview-question.entity';
import { Feedback } from './entities/feedback.entity';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import { Template } from '../templates/entities/template.entity';
import { Question } from '../templates/entities/question.entity';
import { AiService } from '../ai/ai.service';

@Injectable()
export class InterviewsService {
  constructor(
    @InjectRepository(Interview)
    private readonly interviewRepository: Repository<Interview>,
    @InjectRepository(InterviewQuestion)
    private readonly interviewQuestionRepository: Repository<InterviewQuestion>,
    @InjectRepository(Feedback)
    private readonly feedbackRepository: Repository<Feedback>,
    @InjectRepository(Template)
    private readonly templateRepository: Repository<Template>,
    private readonly aiService: AiService,
  ) {}

  // Interview operations
  async createInterview(userId: string, createInterviewDto: CreateInterviewDto) {
    const { templateId, candidateName, questions, sectionOrder } = createInterviewDto;

    const interview = this.interviewRepository.create({
      templateId,
      userId,
      candidateName,
      status: 'in_progress',
    });

    const savedInterview = await this.interviewRepository.save(interview);

    // Get questions from template if not provided
    let questionsToAdd = questions;
    if (!questions || questions.length === 0) {
      // Fetch all questions from the template
      const template = await this.templateRepository.findOne({
        where: { id: templateId },
        relations: ['sections', 'sections.questions'],
      });

      if (template && template.sections) {
        questionsToAdd = [];
        
        // If sectionOrder is provided, use it; otherwise use template order
        let orderedSections = template.sections;
        if (sectionOrder && sectionOrder.length > 0) {
          orderedSections = template.sections.sort(
            (a, b) => sectionOrder.indexOf(a.id) - sectionOrder.indexOf(b.id),
          );
        }
        
        let order = 0;
        for (const section of orderedSections) {
          if (section.questions) {
            for (const question of section.questions) {
              questionsToAdd.push({ questionId: question.id });
              order++;
            }
          }
        }
      }
    }

    // Create interview questions
    if (questionsToAdd && questionsToAdd.length > 0) {
      const interviewQuestions = questionsToAdd.map((q, index) =>
        this.interviewQuestionRepository.create({
          questionId: q.questionId,
          interviewId: savedInterview.id,
          order: index,
          skipped: false,
        }),
      );
      await this.interviewQuestionRepository.save(interviewQuestions);
    }

    return this.getInterviewById(savedInterview.id, userId);
  }

  async getInterviewsByUser(userId: string) {
    return this.interviewRepository.find({
      where: { userId },
      relations: ['template', 'questions'],
      order: { createdAt: 'DESC' },
    });
  }

  async getInterviewById(interviewId: string, userId: string) {
    const interview = await this.interviewRepository.findOne({
      where: { id: interviewId, userId },
      relations: ['template', 'template.sections', 'template.sections.questions', 'questions', 'questions.question', 'questions.question.section', 'questions.feedback'],
    });

    if (!interview) {
      throw new NotFoundException('Interview not found');
    }

    return interview;
  }

  async updateInterviewStatus(interviewId: string, userId: string, status: string) {
    const interview = await this.getInterviewById(interviewId, userId);

    interview.status = status;
    return this.interviewRepository.save(interview);
  }

  async updateOverallNotes(interviewId: string, userId: string, overallNotes: string) {
    const interview = await this.getInterviewById(interviewId, userId);

    interview.overallNotes = overallNotes;
    return this.interviewRepository.save(interview);
  }

  async deleteInterview(interviewId: string, userId: string) {
    const interview = await this.getInterviewById(interviewId, userId);
    await this.interviewRepository.remove(interview);
    return { message: 'Interview deleted successfully' };
  }

  // Question navigation
  async getInterviewQuestion(interviewId: string, userId: string, questionIndex: number) {
    const interview = await this.getInterviewById(interviewId, userId);

    if (questionIndex < 0 || questionIndex >= interview.questions.length) {
      throw new NotFoundException('Question index out of range');
    }

    return interview.questions[questionIndex];
  }

  async skipQuestion(interviewQuestionId: string, userId: string) {
    const interviewQuestion = await this.interviewQuestionRepository.findOne({
      where: { id: interviewQuestionId },
      relations: ['interview'],
    });

    if (!interviewQuestion || interviewQuestion.interview.userId !== userId) {
      throw new NotFoundException('Interview question not found');
    }

    interviewQuestion.skipped = true;
    return this.interviewQuestionRepository.save(interviewQuestion);
  }

  // Feedback operations
  async saveFeedback(
    interviewQuestionId: string,
    userId: string,
    updateFeedbackDto: UpdateFeedbackDto,
  ) {
    const interviewQuestion = await this.interviewQuestionRepository.findOne({
      where: { id: interviewQuestionId },
      relations: ['interview', 'feedback'],
    });

    if (!interviewQuestion || interviewQuestion.interview.userId !== userId) {
      throw new NotFoundException('Interview question not found');
    }

    let feedback = interviewQuestion.feedback;

    if (!feedback) {
      feedback = this.feedbackRepository.create({
        interviewQuestionId,
        ...updateFeedbackDto,
      });
    } else {
      Object.assign(feedback, updateFeedbackDto);
    }

    return this.feedbackRepository.save(feedback);
  }

  async getFeedback(interviewQuestionId: string, userId: string) {
    const interviewQuestion = await this.interviewQuestionRepository.findOne({
      where: { id: interviewQuestionId },
      relations: ['interview', 'feedback'],
    });

    if (!interviewQuestion || interviewQuestion.interview.userId !== userId) {
      throw new NotFoundException('Interview question not found');
    }

    return interviewQuestion.feedback;
  }

  async deleteFeedback(feedbackId: string, userId: string) {
    const feedback = await this.feedbackRepository.findOne({
      where: { id: feedbackId },
      relations: ['interviewQuestion', 'interviewQuestion.interview'],
    });

    if (!feedback || feedback.interviewQuestion.interview.userId !== userId) {
      throw new NotFoundException('Feedback not found');
    }

    await this.feedbackRepository.remove(feedback);
    return { message: 'Feedback deleted successfully' };
  }

  async generateAISummary(interviewId: string, userId: string) {
    const interview = await this.getInterviewById(interviewId, userId);

    // Group questions by section
    const questionsBySection = new Map<string, { title: string; questions: any[] }>();
    interview.questions.forEach((iq: any) => {
      const sectionId = iq.question?.sectionId || 'uncategorized';
      const sectionTitle = iq.question?.section?.title || 'General';
      
      if (!questionsBySection.has(sectionId)) {
        questionsBySection.set(sectionId, { title: sectionTitle, questions: [] });
      }
      questionsBySection.get(sectionId)!.questions.push(iq);
    });

    // Use AI to analyze feedback for each section
    const sectionSummaries = await Promise.all(
      Array.from(questionsBySection.entries()).map(async ([_, sectionData]) => {
        const sectionTitle = sectionData.title;
        const questions = sectionData.questions;

        // Call AI service to analyze the feedback
        const analysis = await this.aiService.analyzeInterviewFeedback(sectionTitle, questions);

        return {
          sectionTitle,
          strengths: analysis.strengths.slice(0, 3),
          gaps: analysis.gaps.slice(0, 3)
        };
      })
    );

    return { sectionSummaries };
  }
}
