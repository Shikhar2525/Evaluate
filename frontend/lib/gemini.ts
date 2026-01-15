// LiteLLM API Service for AI-powered template generation

export interface SectionDetail {
  name: string;
  details: string;
  questionCount: number;
}

export interface GenerateTemplateParams {
  position: string;
  description: string;
  fields: string[];
  sectionDetails?: SectionDetail[];
  duration: number; // in minutes
  experienceLevel: string;
  interviewDifficulty: string;
  enhancement?: string; // User feedback for regeneration
}

export interface GeneratedSection {
  title: string;
  order: number;
  questions: GeneratedQuestion[];
}

export interface GeneratedQuestion {
  text: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  order: number;
  expectedAnswer?: string;
  codeSnippet?: string;
  codeLanguage?: string;
}

// Calculate confidence score based on interview performance
const calculateConfidenceScore = (interviewData: any, allQuestions: any[]): number => {
  if (!allQuestions || allQuestions.length === 0) return 0;

  // Count rated vs skipped questions
  const ratedQuestions = allQuestions.filter((q: any) => q.rating && q.rating >= 1 && q.rating <= 5);
  const skippedQuestions = allQuestions.filter((q: any) => q.skipped);
  const totalQuestions = allQuestions.length;

  // Calculate average rating (normalized to 0-100)
  const averageRating = ratedQuestions.length > 0 
    ? (ratedQuestions.reduce((sum: number, q: any) => sum + (q.rating || 0), 0) / ratedQuestions.length) / 5 * 100
    : 0;

  // Calculate participation percentage
  const participationPercentage = (ratedQuestions.length / totalQuestions) * 100;

  // Weight the factors
  // 60% from average rating, 40% from participation
  const confidenceScore = Math.round((averageRating * 0.6) + (participationPercentage * 0.4));

  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, confidenceScore));
};

export interface GeneratedTemplate {
  name: string;
  description: string;
  sections: GeneratedSection[];
}

const LITELLM_API_KEY = process.env.NEXT_PUBLIC_LITELLM_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY;
const LITELLM_MODEL = process.env.NEXT_PUBLIC_LITELLM_MODEL || 'groq/llama-3.3-70b-versatile';
const LITELLM_BASE_URL = 'https://api.groq.com/openai/v1';

export const geminiAPI = {
  generateTemplate: async (params: GenerateTemplateParams): Promise<GeneratedTemplate> => {
    if (!LITELLM_API_KEY) {
      throw new Error('LiteLLM API key is not configured. Please set NEXT_PUBLIC_GROQ_API_KEY in .env.local');
    }

    // Calculate questions per section based on duration or use custom counts
    const minutesPerQuestion = 6;
    const totalQuestions = Math.max(Math.ceil(params.duration / minutesPerQuestion), 5);
    const defaultQuestionsPerSection = Math.ceil(totalQuestions / params.fields.length);

    // Build section-specific instructions
    let sectionInstructions = '';
    if (params.sectionDetails && params.sectionDetails.length > 0) {
      sectionInstructions = params.sectionDetails.map((section, index) => 
        `Section ${index + 1}: "${section.name}" - ${section.questionCount} questions. ${section.details ? `Focus: ${section.details}` : ''}`
      ).join('\n');
    } else {
      sectionInstructions = params.fields.map((field, index) => 
        `Section ${index + 1}: "${field}" - ${defaultQuestionsPerSection} questions`
      ).join('\n');
    }

    const prompt = `Generate a comprehensive interview template for the following position:

Position: ${params.position}
Candidate Experience Level: ${params.experienceLevel}
Interview Difficulty: ${params.interviewDifficulty}
Interview Duration: ${params.duration} minutes

Sections to create:
${sectionInstructions}
${params.enhancement ? `
⚠️ IMPORTANT REGENERATION INSTRUCTIONS:
The user wants to improve the previous template with the following enhancements:
${params.enhancement}

Please incorporate these enhancements while maintaining the structure and requirements below.
` : ''}
Requirements:
1. Create exactly ${params.fields.length} sections as specified above
2. For each section, create the exact number of questions specified
3. Follow the focus/details provided for each section when generating questions
4. Mix difficulty levels (Easy, Medium, Hard) based on the ${params.interviewDifficulty} interview difficulty
5. Questions should be progressive in difficulty (easy first, hard last in each section)
6. Questions should be specific to the position and relevant to the section topic
7. Questions should be appropriate for candidates with ${params.experienceLevel} experience
8. For each question, provide:
   - expectedAnswer: A brief expected answer or key points to look for
   - codeSnippet: If the question requires coding, provide an example code snippet (optional)
   - codeLanguage: Programming language for the code snippet (optional, e.g., "javascript", "python")
9. Return ONLY valid JSON, no additional text or markdown
10. Follow this exact structure:
{
  "name": "${params.position} - Interview Template",
  "description": "Interview template for ${params.position} position",
  "sections": [
    {
      "title": "Section Title",
      "order": 1,
      "questions": [
        {
          "text": "Question text here?",
          "difficulty": "Easy",
          "order": 1,
          "expectedAnswer": "Key points the candidate should mention...",
          "codeSnippet": "// Optional code example",
          "codeLanguage": "javascript"
        }
      ]
    }
  ]
}

Generate the interview template now. Return ONLY the JSON object, no markdown or extra text.`;

    try {
      const response = await fetch(`${LITELLM_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${LITELLM_API_KEY}`,
        },
        body: JSON.stringify({
          model: LITELLM_MODEL.replace('groq/', ''),
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that generates interview templates in JSON format. Always return valid JSON without markdown formatting.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 4096,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        const errorMsg = error.error?.message || JSON.stringify(error);
        throw new Error(`API Error: ${errorMsg}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No content returned from API');
      }

      // Parse JSON response
      let jsonStr = content.trim();
      if (jsonStr.startsWith('```json')) jsonStr = jsonStr.substring(7);
      if (jsonStr.startsWith('```')) jsonStr = jsonStr.substring(3);
      if (jsonStr.endsWith('```')) jsonStr = jsonStr.substring(0, jsonStr.length - 3);

      const template: GeneratedTemplate = JSON.parse(jsonStr.trim());

      if (!template.sections || !Array.isArray(template.sections)) {
        throw new Error('Invalid template structure');
      }

      return template;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to generate template: ${error.message}`);
      }
      throw error;
    }
  },

  generateInterviewSummary: async (interviewData: any): Promise<any> => {
    if (!LITELLM_API_KEY) {
      throw new Error('LiteLLM API key is not configured. Please set NEXT_PUBLIC_GROQ_API_KEY in .env.local');
    }

    // Prepare interview data for the prompt
    const sections: any[] = [];
    const allQuestions: any[] = [];

    if (interviewData.sections) {
      Object.values(interviewData.sections as any[]).forEach((section: any) => {
        const sectionData = {
          name: section.name || section.title || section.sectionName,
          questions: [] as any[],
        };

        if (section.questions) {
          Object.values(section.questions as any[]).forEach((question: any) => {
            const questionData = {
              text: question.text,
              difficulty: question.difficulty,
              rating: question.feedback?.rating,
              notes: question.feedback?.notes,
              skipped: question.skipped,
            };
            sectionData.questions.push(questionData);
            allQuestions.push(questionData);
          });
        }

        sections.push(sectionData);
      });
    }

    const prompt = `You are an expert interviewer and HR professional. Analyze the following interview results and generate a comprehensive summary.

Interview Template: ${interviewData.template?.name || 'Unknown Template'}
Candidate: ${interviewData.candidateName || 'Unknown Candidate'}
Position: ${interviewData.template?.description || 'Unknown Position'}

Interview Data:
${JSON.stringify(sections, null, 2)}

Generate a detailed analysis with the following structure (return as JSON):
{
  "sections": [
    {
      "name": "Section Name",
      "strengths": ["2-3 sentences explaining a strength demonstrated in the section with reference to specific topics", "another strength with context"],
      "gaps": ["2-3 sentences explaining a gap or area for improvement with reference to specific topics that need work", "another gap with context"],
      "summary": "2-3 sentences summarizing overall section performance with specific observations",
      "topics": [
        {"name": "useCallback", "understood": true},
        {"name": "var vs const", "understood": false},
        {"name": "React hooks", "understood": true}
      ]
    }
  ],
  "overallSummary": "Comprehensive 3-4 sentence assessment of the candidate's performance across all sections, highlighting key patterns, strengths, areas for improvement, and overall readiness",
  "overallRating": "2-3 sentences about overall performance quality, consistency, and fit for the role",
  "keyStrengths": ["Strength 1 with brief explanation (1 sentence)", "Strength 2 with brief explanation", "Strength 3 with brief explanation"],
  "areasForImprovement": ["Area 1 with brief explanation (1 sentence)", "Area 2 with brief explanation", "Area 3 with brief explanation"],
  "recommendations": ["Specific recommendation 1 to address gaps", "Specific recommendation 2", "Specific recommendation 3"],
  "confidence": {
    "score": 75,
    "level": "Strong Candidate",
    "hiring_likelihood": "Likely to be hired",
    "description": "1-2 sentences explaining the confidence score and hiring likelihood"
  }
}

IMPORTANT INSTRUCTIONS:
1. Analyze each question text and its corresponding rating to understand specific strengths/gaps - BUT DO NOT mention the ratings in your response
2. A high rating (4-5) on a question indicates the candidate is strong in that area - reference the question topic without mentioning the rating
3. A low rating (1-2) or skipped question indicates a gap - reference what the question was testing without mentioning the rating
4. Make strengths and gaps ELABORATIVE but concise - 2-3 sentences each that explain the demonstrated skills/knowledge
5. Include specific question topics in strengths/gaps descriptions WITHOUT rating numbers (e.g., "Demonstrated strong understanding of React hooks and component state management" NOT "Demonstrated strong understanding of React hooks (rated 5/5 on...)")
6. For the "topics" array in each section:
   - READ EACH QUESTION TEXT CAREFULLY to identify the technical concepts/topics being tested
   - Extract ALL relevant topics from each question - the more topics the better (aim for 5-10+ topics per section if applicable)
   - For each topic, determine if it was "understood" based on the question's rating: understood=true if rating >= 3, understood=false if rating < 3 or skipped
   - Topic names should be concise and specific (1-4 words) like "useCallback hook", "async/await", "var vs const vs let", "closures", "event delegation", "REST API design", etc.
   - If a question tests multiple topics (e.g., "Explain useCallback and useMemo differences"), create separate topic entries for each concept
   - Include both high-level concepts and specific technical details as separate topics when present in questions
7. Consider difficulty levels - high ratings on hard questions are stronger strengths - reflect this in language like "Advanced understanding of..." for difficult topics
8. Provide context for recommendations - how they address the identified gaps
9. Calculate confidence score (0-100) based on:
   - Average rating across all questions (heavily weighted)
   - Percentage of questions answered vs skipped
   - Consistency of performance across sections
   - Difficulty of questions answered well
10. Set hiring_likelihood to one of: "Very Likely to be hired", "Likely to be hired", "Moderate Fit", "Below Average", "Not a Good Fit"
11. Hiring level guidelines:
    - 80-100: "Very Strong Candidate" / "Very Likely to be hired"
    - 65-79: "Strong Candidate" / "Likely to be hired"
    - 50-64: "Moderate Candidate" / "Moderate Fit"
    - 35-49: "Weak Candidate" / "Below Average"
    - 0-34: "Not a Good Fit" / "Not a Good Fit"

Return ONLY valid JSON, no markdown or additional text.`;

    try {
      const response = await fetch(`${LITELLM_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${LITELLM_API_KEY}`,
        },
        body: JSON.stringify({
          model: LITELLM_MODEL.replace('groq/', ''),
          messages: [
            {
              role: 'system',
              content: 'You are an expert interviewer analyzing candidate performance. Always return valid JSON without markdown formatting.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No content in response');
      }

      // Parse the JSON response
      const summary = JSON.parse(content);
      
      // Calculate correct confidence score based on interview data
      const confidenceScore = calculateConfidenceScore(interviewData, allQuestions);
      
      // Update the confidence score in the summary
      if (summary.confidence) {
        summary.confidence.score = confidenceScore;
        
        // Update level and hiring_likelihood based on correct score
        if (confidenceScore >= 80) {
          summary.confidence.level = 'Very Strong Candidate';
          summary.confidence.hiring_likelihood = 'Very Likely to be hired';
        } else if (confidenceScore >= 65) {
          summary.confidence.level = 'Strong Candidate';
          summary.confidence.hiring_likelihood = 'Likely to be hired';
        } else if (confidenceScore >= 50) {
          summary.confidence.level = 'Moderate Candidate';
          summary.confidence.hiring_likelihood = 'Moderate Fit';
        } else if (confidenceScore >= 35) {
          summary.confidence.level = 'Weak Candidate';
          summary.confidence.hiring_likelihood = 'Below Average';
        } else {
          summary.confidence.level = 'Not a Good Fit';
          summary.confidence.hiring_likelihood = 'Not a Good Fit';
        }
      }
      
      return summary;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to generate interview summary: ${error.message}`);
      }
      throw error;
    }
  },
};
