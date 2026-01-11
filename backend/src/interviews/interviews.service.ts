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

  private generateComprehensiveSummary(interview: any, questionsBySection: Map<string, any[]>, completedCount: number, avgRating: any) {
    const rating = typeof avgRating === 'string' ? parseFloat(avgRating) : avgRating;
    const totalQuestions = interview.questions.length;
    const completionRate = ((completedCount / totalQuestions) * 100).toFixed(0);
    const isAborted = interview.status === 'aborted';

    if (isAborted) {
      return `## Interview Summary\n\n⚠️ **Status: INCOMPLETE**\n\nThis interview was not completed. Only ${completedCount}/${totalQuestions} questions were addressed (${completionRate}%).\n\nA complete re-interview is recommended to properly assess the candidate's qualifications.`;
    }

    // Detailed analysis of all feedback
    const analysis = this.analyzeInterviewFeedback(interview.questions);

    // Build the comprehensive summary
    let summary = `## Interview Summary\n\n`;

    // Overview section
    const templateName = interview.template?.name || 'Technical Interview';
    const assessmentLevel = rating >= 4 ? 'strong' : rating >= 3 ? 'moderate' : 'basic';
    summary += `### Overview\n\nThe candidate demonstrated a **${assessmentLevel} understanding of ${templateName}** with ${analysis.strongAreas.length} key strengths and ${analysis.weakAreas.length} development areas. Overall performance: **${rating}/5** (${completedCount}/${totalQuestions} questions answered).\n\n`;

    // Strengths section
    summary += `### Strengths\n\n`;
    if (analysis.strongAreas.length > 0) {
      analysis.strongAreas.forEach((area: any) => {
        summary += `* **${area.topic}**\n  Demonstrated solid understanding. ${area.evidence}\n\n`;
      });
    } else {
      summary += `* Shows foundational knowledge in assessed areas.\n\n`;
    }

    // Gaps section
    summary += `### Gaps & Areas of Improvement\n\n`;
    if (Object.keys(analysis.gapsByCategory).length > 0) {
      Object.keys(analysis.gapsByCategory).forEach(category => {
        summary += `**${category}**\n\n`;
        analysis.gapsByCategory[category].forEach((gap: any) => {
          summary += `* ${gap.topic}\n  Feedback: ${gap.evidence}\n\n`;
        });
      });
    } else {
      summary += `* No significant gaps identified. Candidate performed consistently well across all areas.\n\n`;
    }

    // Final verdict
    summary += `---\n\n## Final Verdict\n\n`;
    const { verdict, emoji, explanation } = this.determineVerdict(rating, analysis.weakAreas.length, completionRate);
    summary += `${emoji} **${verdict}**\n\n${explanation}\n\n`;

    // Suggestions
    summary += `---\n\n## Suggestions for Improvement\n\n`;
    summary += this.generateDetailedSuggestions(analysis, rating);

    return summary;
  }

  private analyzeInterviewFeedback(questions: any[]) {
    const strongAreas: any[] = [];
    const weakAreas: any[] = [];
    const gapsByCategory: { [key: string]: any[] } = {};

    questions.forEach((q: any) => {
      if (q.skipped) return;

      const rating = q.feedback?.rating || 0;
      const notes = q.feedback?.notes || '';
      const question = q.question?.text || '';
      const section = q.question?.section?.title || 'General';

      // Extract topic from question
      const topic = this.extractTopic(question);

      if (rating >= 4 && notes) {
        strongAreas.push({
          topic,
          rating,
          evidence: this.extractPositiveEvidence(notes)
        });
      } else if (rating <= 2 && notes) {
        if (!gapsByCategory[section]) {
          gapsByCategory[section] = [];
        }
        weakAreas.push({ topic, rating });
        gapsByCategory[section].push({
          topic,
          rating,
          evidence: this.extractNegativeEvidence(notes)
        });
      }
    });

    // Remove duplicates and limit
    const uniqueStrongAreas = Array.from(new Map(strongAreas.map(a => [a.topic, a])).values()).slice(0, 5);
    
    return {
      strongAreas: uniqueStrongAreas,
      weakAreas: weakAreas.slice(0, 5),
      gapsByCategory
    };
  }

  private extractPositiveEvidence(feedback: string): string {
    const positiveKeywords = ['understand', 'know', 'good', 'strong', 'excellent', 'correct', 'clear', 'well', 'great', 'solid', 'effective'];
    const evidence = feedback.split('.')[0]; // Take first sentence
    return evidence.length > 120 ? evidence.substring(0, 120) + '...' : evidence;
  }

  private extractNegativeEvidence(feedback: string): string {
    const evidence = feedback.split('.')[0]; // Take first sentence
    return evidence.length > 120 ? evidence.substring(0, 120) + '...' : evidence;
  }

  private determineVerdict(rating: number, gapCount: number, completionRate: string): { verdict: string; emoji: string; explanation: string } {
    if (rating >= 4 && gapCount <= 1) {
      return {
        verdict: 'Highly Recommended',
        emoji: '✅',
        explanation: 'The candidate demonstrated strong technical knowledge, problem-solving abilities, and professional competence. They are well-prepared for the role.'
      };
    } else if (rating >= 3.5 && gapCount <= 2) {
      return {
        verdict: 'Strongly Consider',
        emoji: '✅',
        explanation: 'The candidate shows strong fundamentals with only minor gaps. With minimal additional training, they would be an excellent fit for the role.'
      };
    } else if (rating >= 3 && gapCount <= 3) {
      return {
        verdict: 'Consider',
        emoji: '⚠️',
        explanation: 'The candidate demonstrates solid understanding of core concepts with some gaps in specific areas. They could succeed with proper onboarding and mentoring.'
      };
    } else if (rating >= 2.5 && gapCount <= 4) {
      return {
        verdict: 'Consider with Caution',
        emoji: '⚠️',
        explanation: 'The candidate has foundational knowledge but several development areas. They would benefit from additional training before taking on complex tasks.'
      };
    } else {
      return {
        verdict: 'Not Selected',
        emoji: '❌',
        explanation: `The candidate lacks sufficient knowledge in key areas (${gapCount} major gaps, ${rating}/5 rating). Significant skill development is needed before reconsidering.`
      };
    }
  }

  private generateDetailedSuggestions(analysis: any, rating: number): string {
    let suggestions = '';

    // Add category-specific suggestions
    const categories = Object.keys(analysis.gapsByCategory);
    if (categories.length > 0) {
      categories.forEach(category => {
        const gaps = analysis.gapsByCategory[category];
        suggestions += `* **${category} Fundamentals:**\n`;
        suggestions += `  - Focus on understanding core concepts in this area\n`;
        suggestions += `  - Practice hands-on implementation exercises\n`;
        suggestions += `  - Study best practices and design patterns\n\n`;
      });
    }

    // General recommendations based on rating
    if (rating < 2) {
      suggestions += `* **Immediate Actions:**\n`;
      suggestions += `  - Review fundamental concepts and theory\n`;
      suggestions += `  - Take structured courses or tutorials\n`;
      suggestions += `  - Practice coding problems from basic to intermediate level\n`;
      suggestions += `  - Build small projects to gain practical experience\n\n`;
    } else if (rating < 3) {
      suggestions += `* **Development Plan:**\n`;
      suggestions += `  - Study the identified gap areas in detail\n`;
      suggestions += `  - Build real-world projects to solidify knowledge\n`;
      suggestions += `  - Practice problem-solving and implementation\n`;
      suggestions += `  - Seek mentorship in weak areas\n\n`;
    } else {
      suggestions += `* **Next Steps:**\n`;
      suggestions += `  - Deepen expertise in specialized areas\n`;
      suggestions += `  - Work on more complex projects\n`;
      suggestions += `  - Stay updated with latest practices and tools\n\n`;
    }

    suggestions += `With focused effort and practical experience, the candidate can significantly improve and is encouraged to reapply or continue skill development.`;
    return suggestions;
  }

  private generateSectionSummary(sectionTitle: string, questions: any[], completedCount: number, avgRating: number | string, status: string) {
    // This function is kept for backward compatibility but not used in new flow
    return '';
  }
}
