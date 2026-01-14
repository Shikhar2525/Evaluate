// LiteLLM API Service for AI-powered template generation

export interface GenerateTemplateParams {
  position: string;
  description: string;
  fields: string[];
  duration: number; // in minutes
  experienceLevel: string;
  interviewDifficulty: string;
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

    // Calculate questions per section based on duration
    const minutesPerQuestion = 6;
    const totalQuestions = Math.max(Math.ceil(params.duration / minutesPerQuestion), 5);
    const questionsPerSection = Math.ceil(totalQuestions / params.fields.length);

    const prompt = `Generate a comprehensive interview template for the following position:

Position: ${params.position}
Description: ${params.description}
Interview Fields/Topics: ${params.fields.join(', ')}
Interview Duration: ${params.duration} minutes
Candidate Experience Level: ${params.experienceLevel}
Interview Difficulty: ${params.interviewDifficulty}
Expected number of sections: ${params.fields.length}
Expected questions per section: ${questionsPerSection}

Requirements:
1. Create ${params.fields.length} sections, one for each field/topic
2. Each section should have ${questionsPerSection} questions
3. Mix difficulty levels (Easy, Medium, Hard) based on the ${params.interviewDifficulty} interview difficulty
4. Questions should be progressive in difficulty (easy first, hard last in each section)
5. Questions should be specific to the position and relevant to the field
6. Questions should be appropriate for candidates with ${params.experienceLevel} experience
7. For each question, provide:
   - expectedAnswer: A brief expected answer or key points to look for
   - codeSnippet: If the question requires coding, provide an example code snippet (optional)
   - codeLanguage: Programming language for the code snippet (optional, e.g., "javascript", "python")
8. Return ONLY valid JSON, no additional text or markdown
9. Follow this exact structure:
{
  "name": "Position Name - Interview Template",
  "description": "Brief description of the interview template",
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
};
