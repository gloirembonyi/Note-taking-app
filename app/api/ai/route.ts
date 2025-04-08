import { NextRequest, NextResponse } from 'next/server';
import { 
  formatNoteWithAI, 
  generateNoteSummary, 
  suggestNoteTitle, 
  enhanceMeetingNotes,
  generateCompletionSuggestion,
  answerQuestionAboutNote,
  organizeNoteContent,
  findRelatedTopics as findRelatedTopicsService,
  extractKeyInsights,
  generateMindMapStructure,
  generateFlashcards
} from '@/lib/ai-service';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

// Initialize Google Generative AI with your API key
let genAI: GoogleGenerativeAI | undefined;
let model: GenerativeModel | undefined;
let aiServiceEnabled = false;

try {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_KEY || '';
  if (apiKey) {
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    aiServiceEnabled = true;
    console.log("Google Generative AI model initialized successfully");
  } else {
    console.warn("GOOGLE_GEMINI_API_KEY is not set. AI features will use mock responses.");
  }
} catch (error) {
  console.error("Failed to initialize Google Generative AI:", error);
}

// Mock responses for when the AI service is unavailable
const getMockResponse = (operation: string, content?: string) => {
  switch (operation) {
    case 'format':
      return { formattedText: content };
    case 'summarize':
      return { summary: "This is a mock summary of your notes. The AI service is currently unavailable." };
    case 'suggest-title':
      return { titles: ["Note from " + new Date().toLocaleDateString(), "Important Notes", "My Thoughts"] };
    case 'enhance-meeting':
      return { enhancedNotes: content };
    case 'complete':
      return { completion: "... (AI completion suggestions are currently unavailable)" };
    case 'answer-question':
      return { 
        answer: "I'm sorry, but I can't provide a specific answer right now. The AI service is temporarily unavailable. Please try again later.",
        status: "mock_response" 
      };
    case 'organize-content':
      return { organizedContent: content };
    case 'find-related-topics':
      return { 
        relatedTopics: [
          "Note Taking Techniques",
          "Productivity Methods",
          "Information Management",
          "Digital Organization",
          "Knowledge Systems"
        ] 
      };
    case 'extract-insights':
      return {
        insights: [
          "Key insight 1 would appear here",
          "Key insight 2 would appear here",
          "Key insight 3 would appear here"
        ]
      };
    case 'generate-mindmap':
      return {
        mindMap: {
          root: { text: "Main Topic" },
          children: [
            { text: "Subtopic 1", children: [{ text: "Detail 1" }, { text: "Detail 2" }] },
            { text: "Subtopic 2", children: [{ text: "Detail 1" }, { text: "Detail 2" }] },
            { text: "Subtopic 3", children: [{ text: "Detail 1" }, { text: "Detail 2" }] }
          ]
        }
      };
    case 'generate-flashcards':
      return {
        flashcards: [
          { question: "Sample Question 1", answer: "Sample Answer 1" },
          { question: "Sample Question 2", answer: "Sample Answer 2" },
          { question: "Sample Question 3", answer: "Sample Answer 3" }
        ]
      };
    default:
      return { error: 'Invalid operation' };
  }
};

export async function POST(request: NextRequest) {
  try {
    console.log("AI API request received");
    
    const body = await request.json();
    const { content, operation, partialContent, question, imageBase64 } = body;
    
    console.log("Operation:", operation);
    
    if (!content && !partialContent && !imageBase64) {
      console.log("Missing required content");
      return NextResponse.json(
        { error: 'Content, partial content, or image is required' },
        { status: 400 }
      );
    }

    // If AI service is not enabled, return mock responses
    if (!aiServiceEnabled) {
      console.log("Using mock response for operation:", operation);
      return NextResponse.json(getMockResponse(operation, content || partialContent));
    }

    let result;
    try {
      switch (operation) {
        case 'format':
          result = await formatNoteWithAI(content);
          return NextResponse.json({ formattedText: result });

        case 'summarize':
          result = await generateNoteSummary(content);
          return NextResponse.json({ summary: result });

        case 'suggest-title':
          result = await suggestNoteTitle(content);
          return NextResponse.json({ titles: result });

        case 'enhance-meeting':
          result = await enhanceMeetingNotes(content);
          return NextResponse.json({ enhancedNotes: result });

        case 'complete':
          if (!partialContent) {
            return NextResponse.json(
              { error: 'Partial content is required for completion' },
              { status: 400 }
            );
          }
          result = await generateCompletionSuggestion(partialContent);
          return NextResponse.json({ completion: result });

        case 'answer-question':
          if (!question) {
            return NextResponse.json(
              { error: 'Question is required for answering' },
              { status: 400 }
            );
          }
          return await answerQuestion(content, question);

        case 'organize-content':
          result = await organizeNoteContent(content);
          return NextResponse.json({ organizedContent: result });

        case 'find-related-topics':
          result = await findRelatedTopics(content);
          return NextResponse.json({ relatedTopics: result });
          
        case 'extract-insights':
          result = await extractKeyInsights(content);
          return NextResponse.json({ insights: result });
          
        case 'generate-mindmap':
          result = await generateMindMapStructure(content);
          return NextResponse.json({ mindMap: result });
          
        case 'generate-flashcards':
          result = await generateFlashcards(content);
          return NextResponse.json({ flashcards: result });

        default:
          return NextResponse.json(
            { error: 'Invalid operation' },
            { status: 400 }
          );
      }
    } catch (operationError) {
      console.error(`Error in operation ${operation}:`, operationError);
      // Return mock response as fallback when operation fails
      return NextResponse.json(getMockResponse(operation, content || partialContent));
    }
  } catch (error: any) {
    console.error('AI API error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}

async function findRelatedTopics(content: string) {
  try {
    // Check if model is initialized
    if (!model) {
      console.error("AI model is not initialized");
      return NextResponse.json(getMockResponse('find-related-topics').relatedTopics);
    }

    const prompt = `
      Based on the following note content, suggest 5 related topics that would be valuable to add to this note. 
      Return your response as a JSON array of strings with just the topic names.
      
      Note content:
      ${content.substring(0, 2000)}
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Attempt to parse JSON from the response
    let relatedTopics = [];
    try {
      // Find JSON array in the response text
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        relatedTopics = JSON.parse(match[0]);
      } else {
        // Fallback: Split by newlines and clean up
        relatedTopics = text
          .split('\n')
          .map(line => line.replace(/^\d+\.\s*/, '').trim())
          .filter(line => line.length > 0)
          .slice(0, 5);
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      // Fallback: Split by newlines and clean up
      relatedTopics = text
        .split('\n')
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .filter(line => line.length > 0)
        .slice(0, 5);
    }

    return NextResponse.json({ relatedTopics });
  } catch (error) {
    console.error('Error finding related topics:', error);
    // Return mock topics as fallback
    return NextResponse.json(getMockResponse('find-related-topics').relatedTopics);
  }
}

async function answerQuestion(content: string, question: string) {
  try {
    console.log("Processing question:", question);
    console.log("Content length:", content.length);
    
    // Check if model is initialized
    if (!model) {
      console.error("AI model is not initialized");
      return NextResponse.json(getMockResponse('answer-question'));
    }
    
    // Fallback for empty content
    if (!content || content.trim().length < 10) {
      return NextResponse.json({ 
        answer: "I need more content in your note to provide a relevant answer. Please add some text to your note first." 
      });
    }
    
    const prompt = `
      You are an AI assistant helping with a note-taking application. The user has a question about their note content.
      
      Note content:
      ${content.substring(0, 3000)}
      
      User question:
      ${question}
      
      Please provide a helpful, concise answer based solely on the note content. If the answer cannot be determined from the note content, explain that kindly.
    `;

    try {
      const result = await model.generateContent(prompt);
      const answer = result.response.text();
      console.log("Generated answer successfully");
      
      // Ensure we're returning a string
      return NextResponse.json({ 
        answer: answer.toString(),
        status: "success" 
      });
    } catch (aiError) {
      console.error("AI model error:", aiError);
      // Return mock response
      return NextResponse.json(getMockResponse('answer-question'));
    }
  } catch (error) {
    console.error('Error answering question:', error);
    return NextResponse.json(getMockResponse('answer-question'));
  }
} 