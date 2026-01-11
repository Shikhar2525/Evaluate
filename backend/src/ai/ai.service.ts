import { Injectable } from '@nestjs/common';

@Injectable()
export class AiService {
  async analyzeInterviewFeedback(sectionTitle: string, questions: any[]): Promise<{ strengths: string[]; gaps: string[] }> {
    // Filter valid questions with feedback
    const validQuestions = questions
      .filter((q: any) => !q.skipped)
      .filter((q: any) => q.question?.text && (q.feedback?.rating || q.feedback?.notes))
      .map((q: any) => ({
        question: q.question?.text || '',
        rating: q.feedback?.rating || 0,
        notes: q.feedback?.notes || '',
      }));

    if (validQuestions.length === 0) {
      return { strengths: [], gaps: [] };
    }

    // Group by topic first
    const topicGroups: { [key: string]: any[] } = {};

    validQuestions.forEach((q: any) => {
      const topic = this.extractTopic(q.question);
      if (!topicGroups[topic]) {
        topicGroups[topic] = [];
      }
      topicGroups[topic].push(q);
    });

    const strengths: string[] = [];
    const gaps: string[] = [];

    // Analyze each topic group
    Object.entries(topicGroups).forEach(([topic, topicQuestions]: [string, any[]]) => {
      const avgRating = topicQuestions.reduce((sum, q) => sum + q.rating, 0) / topicQuestions.length;
      const allNotes = topicQuestions.map(q => q.notes).filter(n => n).join(' ');

      if (avgRating >= 4) {
        // Strong performance - build comprehensive strength statement
        const strength = this.buildDetailedStrength(topic, topicQuestions, allNotes);
        strengths.push(strength);
      } else if (avgRating <= 2) {
        // Weak performance - build detailed gap statement
        const gap = this.buildDetailedGap(topic, topicQuestions, allNotes);
        gaps.push(gap);
      }
    });

    // Sort by quality and return top 3
    const sortedStrengths = strengths.sort((a, b) => b.length - a.length).slice(0, 3);
    const sortedGaps = gaps.sort((a, b) => b.length - a.length).slice(0, 3);

    return {
      strengths: sortedStrengths,
      gaps: sortedGaps
    };
  }

  private buildDetailedStrength(topic: string, questions: any[], allNotes: string): string {
    let statement = `Strong understanding of ${topic}`;

    // Extract key positive points from feedback
    const positiveIndicators = this.extractPositiveIndicators(allNotes);
    
    if (positiveIndicators.length > 0) {
      statement += ` - ${positiveIndicators[0]}`;
    } else if (questions.length > 1) {
      statement += ` across ${questions.length} different aspects`;
    } else if (allNotes) {
      // Use actual feedback
      const snippet = allNotes.split('.')[0].trim();
      if (snippet && snippet.length > 10) {
        statement += ` - ${snippet}`;
      }
    }

    return statement;
  }

  private buildDetailedGap(topic: string, questions: any[], allNotes: string): string {
    let statement = `Needs improvement in ${topic}`;

    // Extract specific improvement areas from feedback
    const improvementAreas = this.extractImprovementAreas(allNotes);
    
    if (improvementAreas.length > 0) {
      statement += ` - ${improvementAreas[0]}`;
    } else if (questions.length > 1) {
      statement += ` (struggled with multiple aspects)`;
    } else if (allNotes) {
      // Use actual feedback
      const snippet = allNotes.split('.')[0].trim();
      if (snippet && snippet.length > 10) {
        statement += ` - ${snippet}`;
      }
    }

    return statement;
  }

  private extractPositiveIndicators(feedback: string): string[] {
    const positivePatterns = [
      /demonstrated\s+([^.,]+)/gi,
      /good\s+(?:understanding|grasp)\s+of\s+([^.,]+)/gi,
      /excellent\s+([^.,]+)/gi,
      /strong\s+([^.,]+)/gi,
      /well[\s-]?handled\s+([^.,]+)/gi,
      /clear[\s-]?understanding\s+of\s+([^.,]+)/gi,
    ];

    const indicators: string[] = [];

    positivePatterns.forEach(pattern => {
      const matches = feedback.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          indicators.push(match[1].trim());
        }
      }
    });

    // If no pattern matches, use first sentence as fallback
    if (indicators.length === 0) {
      const firstSentence = feedback.split('.')[0].trim();
      if (firstSentence && firstSentence.length > 15) {
        indicators.push(firstSentence);
      }
    }

    return indicators;
  }

  private extractImprovementAreas(feedback: string): string[] {
    const improvementPatterns = [
      /needs?\s+(?:to\s+)?(?:work\s+)?on\s+([^.,]+)/gi,
      /(?:didn't|does not|struggled|weak)\s+(?:with|in|on)\s+([^.,]+)/gi,
      /(?:unclear|incomplete|confused|limited)\s+(?:understanding|grasp)?\s+(?:of|in)?\s+([^.,]+)/gi,
      /lacking\s+([^.,]+)/gi,
      /insufficient\s+([^.,]+)/gi,
    ];

    const areas: string[] = [];

    improvementPatterns.forEach(pattern => {
      const matches = feedback.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          areas.push(match[1].trim());
        }
      }
    });

    // If no pattern matches, use first sentence as fallback
    if (areas.length === 0) {
      const firstSentence = feedback.split('.')[0].trim();
      if (firstSentence && firstSentence.length > 15) {
        areas.push(firstSentence);
      }
    }

    return areas;
  }

  private extractTopic(questionText: string): string {
    // Remove question marks and extra whitespace
    let topic = questionText.replace(/\?.*$/, '').trim();
    
    // Remove common question prefixes
    topic = topic.replace(/^(explain|describe|what|how|why|implement|design|write|build|create|demonstrate|show|tell|discuss|compare|analyze|implement|list|name|define)\s+/i, '');
    
    // Remove "the" at the beginning
    topic = topic.replace(/^the\s+/i, '');
    
    // Capitalize first letter
    topic = topic.charAt(0).toUpperCase() + topic.slice(1);
    
    // Limit length
    if (topic.length > 80) {
      topic = topic.substring(0, 80) + '...';
    }
    
    return topic;
  }
}

