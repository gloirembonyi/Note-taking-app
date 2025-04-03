import { GoogleGenerativeAI } from '@google/generative-ai';

// Check if API key is available
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY || '';

// Initialize the Google Generative AI client
let genAI: GoogleGenerativeAI | null = null;

if (API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(API_KEY);
  } catch (error) {
    console.error('Failed to initialize Google Generative AI:', error);
  }
}

/**
 * Interface for AI suggestion options
 */
export interface AISuggestionOptions {
  prompt: string; 
  context?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Interface for AI suggestion results
 */
export interface AISuggestionResult {
  text: string;
  error?: string;
}

/**
 * Get text suggestions from Google's Generative AI
 */
export async function getTextSuggestion({
  prompt,
  context = '',
  temperature = 0.7,
  maxTokens = 256,
}: AISuggestionOptions): Promise<AISuggestionResult> {
  try {
    if (!genAI) {
      console.warn('Google Generative AI not initialized. Using mock suggestions.');
      return mockSuggestion(prompt, context);
    }

    // Set up the model
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    // Build the prompt with context if available
    const fullPrompt = context 
      ? `${context}\n\nContinue the text: ${prompt}`
      : prompt;
      
    // Generate content
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();
    
    return { text };
  } catch (error) {
    console.error('AI suggestion error:', error);
    
    // Fall back to mock suggestions in case of error
    return {
      ...mockSuggestion(prompt, context),
      error: error instanceof Error ? error.message : 'Unknown AI suggestion error'
    };
  }
}

/**
 * Format text with specific style using AI
 */
export async function formatText(
  text: string, 
  format: 'professional' | 'concise' | 'casual' | 'technical' | 'creative'
): Promise<AISuggestionResult> {
  // Create a formatting instruction based on the requested style
  let instruction = '';
  
  switch (format) {
    case 'professional':
      instruction = 'Rewrite the following text in a formal, professional tone suitable for business communication:';
      break;
    case 'concise':
      instruction = 'Rewrite the following text more concisely while preserving the key information:';
      break;
    case 'casual':
      instruction = 'Rewrite the following text in a casual, conversational tone:';
      break;
    case 'technical':
      instruction = 'Rewrite the following text in a precise, technical tone with proper terminology:';
      break;
    case 'creative':
      instruction = 'Rewrite the following text in a creative, engaging style:';
      break;
  }
  
  return getTextSuggestion({
    prompt: `${instruction}\n\n${text}`,
    temperature: 0.5,
  });
}

/**
 * Generate tags for a note using AI
 */
export async function generateTags(content: string): Promise<string[]> {
  try {
    if (!genAI) {
      console.warn('Google Generative AI not initialized. Using mock tags.');
      return mockTags(content);
    }
    
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `
      Extract 5 or fewer relevant tags for the following note content. 
      Return only the tags separated by commas without any additional text.
      The tags should be single words or short phrases that capture the key topics.
      
      Note content:
      ${content.substring(0, 1500)} // Limit to first 1500 chars for large notes
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const tagsText = response.text().trim();
    
    // Split the comma-separated tags and trim each tag
    const tags = tagsText
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    
    return tags;
  } catch (error) {
    console.error('Tag generation error:', error);
    return mockTags(content);
  }
}

/**
 * Enhance meeting transcription with structure and action items
 */
export async function enhanceTranscription(transcription: string): Promise<AISuggestionResult> {
  const prompt = `
    Format the following meeting transcription into a structured note with:
    1. A clear title/heading based on the meeting content
    2. List of key points discussed
    3. Action items with assignees if mentioned
    4. Decisions made
    5. Any follow-up items or next steps

    Use markdown formatting for structure.
    
    Transcription:
    ${transcription}
  `;
  
  return getTextSuggestion({
    prompt,
    temperature: 0.3,
    maxTokens: 1000,
  });
}

/**
 * Extract text from an image description for note-taking
 */
export async function extractTextFromImageDescription(imageDescription: string): Promise<AISuggestionResult> {
  const prompt = `
    Extract the most important information from this image description to create a clear, 
    concise note with key details. Use bullet points where appropriate.
    
    Image description:
    ${imageDescription}
  `;
  
  return getTextSuggestion({
    prompt,
    temperature: 0.4,
  });
}

/**
 * Returns mock AI suggestion data for testing without API
 */
function mockSuggestion(prompt: string, context?: string): AISuggestionResult {
  // Simple mock that returns different responses based on the input prompt
  if (prompt.toLowerCase().includes('meeting')) {
    return {
      text: "Here's a suggested continuation for your meeting notes:\n\n## Action Items\n- Complete project proposal by Friday\n- Schedule follow-up meeting with stakeholders\n- Review budget allocations for Q2\n\n## Next Steps\nWe'll reconvene next week to finalize the timeline and resource allocation.",
    };
  }
  
  if (prompt.toLowerCase().includes('idea') || prompt.toLowerCase().includes('concept')) {
    return {
      text: "Building on your idea, consider these additional points:\n\n1. Market validation through user interviews\n2. Competitive landscape analysis\n3. Potential technological constraints\n4. Initial budget requirements\n\nThis approach would provide a solid foundation for your concept.",
    };
  }
  
  // Default mock response
  return {
    text: "This is a mock AI suggestion. In production, the Google Generative AI would provide contextually relevant suggestions based on your input. Please set up your Google AI API key in the environment variables to enable real AI suggestions.",
  };
}

/**
 * Returns mock tags for testing without API
 */
function mockTags(content: string): string[] {
  // Extract some keywords from the content as mock tags
  const contentLower = content.toLowerCase();
  const possibleTags = [
    { tag: 'meeting', check: ['meeting', 'agenda', 'minutes'] },
    { tag: 'todo', check: ['todo', 'task', 'to-do', 'to do'] },
    { tag: 'idea', check: ['idea', 'concept', 'thought'] },
    { tag: 'project', check: ['project', 'initiative'] },
    { tag: 'research', check: ['research', 'study', 'analysis'] },
    { tag: 'personal', check: ['personal', 'private'] },
    { tag: 'work', check: ['work', 'job', 'professional'] },
    { tag: 'important', check: ['important', 'critical', 'urgent'] },
  ];
  
  // Find matching tags
  const matchedTags = possibleTags
    .filter(({ check }) => check.some(keyword => contentLower.includes(keyword)))
    .map(({ tag }) => tag);
  
  // Add a default tag if none matched
  if (matchedTags.length === 0) {
    matchedTags.push('note');
  }
  
  return matchedTags;
} 