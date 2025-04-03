import { GoogleGenerativeAI } from '@google/generative-ai';

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

export interface AIServiceRequest {
  operation: AIOperation;
  content?: string;
  partialContent?: string;
  imageBase64?: string;
}

export interface AIServiceResponse {
  completion?: string;
  formattedText?: string;
  enhancedNotes?: string;
  titles?: string[];
  tags?: string[];
  summary?: string;
  extractedText?: string;
  error?: string;
}

// Helper function to format prompt by operation
const getPrompt = (operation: AIOperation, content: string): string => {
  switch (operation) {
    case 'complete':
      return `Continue this text naturally: ${content}`;
    
    case 'format':
      return `Format this text into a well-structured markdown document. Add appropriate headings, bullet points, and formatting to make it easy to read: ${content}`;
    
    case 'enhance-meeting':
      return `Transform the following raw meeting transcript into well-structured meeting notes. 
      - Format it with proper headings, bullet points, and sections
      - Extract and highlight key decisions, action items, and deadlines
      - Organize the content by topic
      - Fix any spelling or grammar errors
      - Make it easy to read and scan
      
      Raw transcript: ${content}`;
    
    case 'suggest-title':
      return `Generate 3 concise, descriptive titles for the following content. Return only the titles in a numbered list: ${content}`;
    
    case 'generate-tags':
      return `Generate 5-8 tags for the following content. Return only the tags as a comma-separated list without numbering: ${content}`;
    
    case 'summarize':
      return `Provide a concise summary of the following content in 3-5 sentences: ${content}`;
    
    case 'extract-from-image':
      return `Extract and transcribe all text from this image. Format the extracted text as markdown if appropriate.`;
    
    default:
      return content;
  }
};

// Process the AI operations
export const aiService = {
  async processRequest(request: AIServiceRequest): Promise<AIServiceResponse> {
    try {
      const { operation, content = '', partialContent = '', imageBase64 } = request;
      
      // Create the client only when needed
      const genAI = getGeminiClient();
      
      // Select the appropriate model
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      
      // For image-related operations, use a model that supports images
      if (operation === 'extract-from-image' && imageBase64) {
        try {
          const visionModel = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });
          
          // Create a part that includes the image
          const imagePart = {
            inlineData: {
              data: imageBase64,
              mimeType: 'image/jpeg', // Adjust based on actual image type if needed
            },
          };
          
          const prompt = getPrompt(operation, content);
          const result = await visionModel.generateContent([prompt, imagePart]);
          const text = result.response.text();
          
          return { extractedText: text };
        } catch (error) {
          console.error('Vision model error:', error);
          return { error: 'Failed to process image with AI' };
        }
      }
      
      // Handle text-based operations
      const textToProcess = operation === 'complete' ? partialContent : content;
      const prompt = getPrompt(operation, textToProcess);
      
      try {
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        // Process the result based on operation type
        switch (operation) {
          case 'complete':
            return { completion: responseText.replace(textToProcess, '').trim() };
          
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
          
          default:
            return { error: 'Invalid operation type' };
        }
      } catch (error) {
        console.error('Generative model error:', error);
        return { error: 'Failed to generate AI content' };
      }
    } catch (error) {
      console.error('AI service error:', error);
      return { error: 'Failed to process AI request' };
    }
  }
}; 