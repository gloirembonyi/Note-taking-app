import { NextRequest, NextResponse } from 'next/server';
import { 
  generateNoteSummary, 
  suggestNoteTitle, 
  enhanceMeetingNotes,
  generateCompletionSuggestion,
  organizeNoteContent,
  extractKeyInsights,
  generateMindMapStructure,
  generateFlashcards,
  formatNote,
  findRelatedTopics,
  answerQuestion
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
    const body = await request.json();
    const { content, operation, question, partialContent } = body;
    
    if (!content && !partialContent) {
      return NextResponse.json(
        { error: 'Content or partial content is required' },
        { status: 400 }
      );
    }

    // Use the imported functions from ai-service.ts
    try {
      switch (operation) {
        case 'format':
          const formattedText = await formatNote(content);
          return NextResponse.json({ formattedText });

        case 'summarize':
          const summary = await generateNoteSummary(content);
          return NextResponse.json({ summary });

        case 'suggest-title':
          const titles = await suggestNoteTitle(content);
          return NextResponse.json({ titles });

        case 'enhance-meeting':
          const enhancedNotes = await enhanceMeetingNotes(content);
          return NextResponse.json({ enhancedNotes });

        case 'complete':
          if (!partialContent) {
            return NextResponse.json(
              { error: 'Partial content is required for completion' },
              { status: 400 }
            );
          }
          const completion = await generateCompletionSuggestion(partialContent);
          return NextResponse.json({ completion });

        case 'find-topics':
        case 'find-related-topics':
          const topics = await findRelatedTopics(content);
          return NextResponse.json({ topics, relatedTopics: topics });

        case 'ask-question':
          if (!question) {
            return NextResponse.json(
              { error: 'Question is required' },
              { status: 400 }
            );
          }
          const answer = await answerQuestion(content, question);
          return NextResponse.json({ answer });

        case 'organize-content':
          const organizedContent = await organizeNoteContent(content);
          return NextResponse.json({ organizedContent });
          
        case 'extract-insights':
          const insights = await extractKeyInsights(content);
          return NextResponse.json({ insights });
          
        case 'generate-mindmap':
          const mindMap = await generateMindMapStructure(content);
          return NextResponse.json({ mindMap });
          
        case 'generate-flashcards':
          const flashcards = await generateFlashcards(content);
          return NextResponse.json({ flashcards });

        default:
          return NextResponse.json(
            { error: 'Invalid operation' },
            { status: 400 }
          );
      }
    } catch (opError) {
      console.error(`Error in AI operation ${operation}:`, opError);
      // Fall back to mock responses
      return NextResponse.json(getMockResponse(operation, content));
    }
  } catch (error) {
    console.error('AI API error:', error);
    return NextResponse.json(
      { error: 'Failed to process AI request' },
      { status: 500 }
    );
  }
} 