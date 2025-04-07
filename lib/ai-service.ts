import { GoogleGenerativeAI, GenerateContentResult } from '@google/generative-ai';

// Initialize the Google Generative AI client with proper error handling
const getGeminiClient = () => {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_KEY;
  if (!apiKey) {
    console.error('GOOGLE_GENERATIVE_AI_KEY environment variable is not set');
    throw new Error('Missing Gemini API key');
  }
  return new GoogleGenerativeAI(apiKey);
};

// Define operation types
type AIOperation = 
  | 'complete'     // Complete partial text
  | 'format'       // Format and structure text
  | 'enhance-meeting' // Format and enhance meeting notes
  | 'suggest-title'   // Suggest titles for content
  | 'generate-tags'   // Generate tags from content
  | 'summarize'       // Summarize content
  | 'extract-from-image' // Extract text from an image
  | 'answer-question'    // Answer a question about the note content
  | 'organize-content'   // Reorganize and structure the content
  | 'find-related-topics' // Find related topics to the content

export interface AIServiceRequest {
  operation: AIOperation;
  content?: string;
  partialContent?: string;
  imageBase64?: string;
  question?: string;
}

export interface AIServiceResponse {
  completion?: string;
  formattedText?: string;
  enhancedNotes?: string;
  titles?: string[];
  tags?: string[];
  summary?: string;
  extractedText?: string;
  answer?: string;
  organizedContent?: string;
  relatedTopics?: string[];
  error?: string;
}

// Helper function to format prompt by operation
const getPrompt = (operation: AIOperation, content: string, question?: string): string => {
  switch (operation) {
    case 'complete':
      return `Continue this text in a natural, coherent way, maintaining the style and tone of the original content: ${content}`;
    
    case 'format':
      return `Format this text into a well-structured markdown document. Add appropriate headings, bullet points, and formatting to make it easy to read. Preserve all original content and meaning: ${content}`;
    
    case 'enhance-meeting':
      return `Transform the following raw meeting transcript into well-structured meeting notes. 
      - Format it with proper headings, bullet points, and sections
      - Extract and highlight key decisions, action items, and deadlines
      - Organize the content by topic
      - Fix any spelling or grammar errors
      - Make it easy to read and scan
      
      Raw transcript: ${content}`;
    
    case 'suggest-title':
      return `Generate 3-5 concise, descriptive titles for the following content. Return only the titles in a numbered list: ${content}`;
    
    case 'generate-tags':
      return `Generate 5-8 tags for the following content. Consider the main topics, themes, and keywords. Return only the tags as a comma-separated list without numbering: ${content}`;
    
    case 'summarize':
      return `Provide a concise summary of the following content in 3-5 sentences, highlighting the key points and main ideas: ${content}`;
    
    case 'extract-from-image':
      return `Extract and transcribe all text from this image. Format the extracted text as markdown if appropriate.`;
    
    case 'answer-question':
      return `Based on the following note content, answer this question: "${question}"\n\nNote content: ${content}`;
    
    case 'organize-content':
      return `Reorganize and structure the following content to make it more logical, coherent, and easy to read. Use appropriate headings, sections, and formatting: ${content}`;
    
    case 'find-related-topics':
      return `Based on the following content, suggest 5-7 related topics or ideas that the user might want to explore or add to their notes. For each topic, provide a brief explanation of its relevance: ${content}`;
    
    default:
      return content;
  }
};

// Process the AI operations
export const aiService = {
  async processRequest(request: AIServiceRequest): Promise<AIServiceResponse> {
    try {
      const { operation, content = '', partialContent = '', imageBase64, question = '' } = request;
      
      // Create the client only when needed
      const genAI = getGeminiClient();
      
      // Try multiple models in case of failure
      const modelOptions = ['gemini-1.5-pro', 'gemini-1.0-pro'];
      let result: GenerateContentResult | null = null;
      let error: any = null;
      
      for (const modelName of modelOptions) {
        try {
          // Select the appropriate model
          const model = genAI.getGenerativeModel({ model: modelName });
          
          // For image-related operations, use a vision model
          if (operation === 'extract-from-image' && imageBase64) {
            try {
              // Try different vision models
              const visionModelOptions = ['gemini-1.5-pro-vision', 'gemini-1.0-pro-vision'];
              let visionResult = null;
              
              for (const visionModelName of visionModelOptions) {
                try {
                  const visionModel = genAI.getGenerativeModel({ model: visionModelName });
                  
                  // Create a part that includes the image
                  const imagePart = {
                    inlineData: {
                      data: imageBase64,
                      mimeType: 'image/jpeg', // Adjust based on actual image type if needed
                    },
                  };
                  
                  const prompt = getPrompt(operation, content);
                  visionResult = await visionModel.generateContent([prompt, imagePart]);
                  break; // Exit loop if successful
                } catch (err) {
                  console.warn(`Vision model ${visionModelName} failed, trying next option if available`);
                  error = err;
                }
              }
              
              if (!visionResult) {
                throw error || new Error('All vision models failed');
              }
              
              const text = visionResult.response.text();
              return { extractedText: text };
            } catch (error) {
              console.error('Vision model error:', error);
              return { error: 'Failed to process image with AI' };
            }
          }
          
          // Handle text-based operations
          const textToProcess = operation === 'complete' ? partialContent : content;
          const prompt = getPrompt(operation, textToProcess, question);
          
          // Configure the model with appropriate settings
          const generationConfig = {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          };
          
          result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig,
          });
          
          break; // Exit the loop if successful
        } catch (err) {
          console.warn(`Model ${modelName} failed, trying next option if available`);
          error = err;
        }
      }
      
      if (!result) {
        throw error || new Error('All models failed');
      }
      
      const responseText = result.response.text();
      
      // Process the result based on operation type
      switch (operation) {
        case 'complete':
          return { completion: responseText };
        
        case 'format':
          return { formattedText: responseText };
        
        case 'enhance-meeting':
          return { enhancedNotes: responseText };
        
        case 'suggest-title':
          // Extract numbered titles from the response
          const titles = responseText
            .split('\n')
            .map(line => line.trim())
            .filter(line => /^\d+\.\s+/.test(line))
            .map(line => line.replace(/^\d+\.\s+/, ''));
          
          return { titles: titles.length ? titles : [responseText] };
        
        case 'generate-tags':
          // Parse comma-separated tags
          const tags = responseText
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0);
          
          return { tags };
        
        case 'summarize':
          return { summary: responseText };
        
        case 'answer-question':
          return { answer: responseText };
        
        case 'organize-content':
          return { organizedContent: responseText };
        
        case 'find-related-topics':
          return { relatedTopics: responseText.split('\n').filter(line => line.trim().length > 0) };
        
        default:
          return { error: 'Invalid operation type' };
      }
    } catch (error) {
      console.error('AI service error:', error);
      return { error: 'Failed to process AI request' };
    }
  }
}; 

// Helper functions for the AI route
export async function formatNoteWithAI(content: string): Promise<string> {
  const response = await aiService.processRequest({
    operation: 'format',
    content
  });
  
  if (response.error) {
    throw new Error(response.error);
  }
  
  return response.formattedText || '';
}

export async function generateNoteSummary(content: string): Promise<string> {
  const response = await aiService.processRequest({
    operation: 'summarize',
    content
  });
  
  if (response.error) {
    throw new Error(response.error);
  }
  
  return response.summary || '';
}

export async function suggestNoteTitle(content: string): Promise<string[]> {
  const response = await aiService.processRequest({
    operation: 'suggest-title',
    content
  });
  
  if (response.error) {
    throw new Error(response.error);
  }
  
  return response.titles || [];
}

export async function enhanceMeetingNotes(content: string): Promise<string> {
  const response = await aiService.processRequest({
    operation: 'enhance-meeting',
    content
  });
  
  if (response.error) {
    throw new Error(response.error);
  }
  
  return response.enhancedNotes || '';
}

export async function generateCompletionSuggestion(partialContent: string): Promise<string> {
  const response = await aiService.processRequest({
    operation: 'complete',
    partialContent
  });
  
  if (response.error) {
    throw new Error(response.error);
  }
  
  return response.completion || '';
}

export async function answerQuestionAboutNote(content: string, question: string): Promise<string> {
  const response = await aiService.processRequest({
    operation: 'answer-question',
    content,
    question
  });
  
  if (response.error) {
    throw new Error(response.error);
  }
  
  return response.answer || '';
}

export async function organizeNoteContent(content: string): Promise<string> {
  const response = await aiService.processRequest({
    operation: 'organize-content',
    content
  });
  
  if (response.error) {
    throw new Error(response.error);
  }
  
  return response.organizedContent || '';
}

export async function findRelatedTopics(content: string): Promise<string[]> {
  const response = await aiService.processRequest({
    operation: 'find-related-topics',
    content
  });
  
  if (response.error) {
    throw new Error(response.error);
  }
  
  return response.relatedTopics || [];
} 