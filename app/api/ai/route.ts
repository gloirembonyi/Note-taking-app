import { NextRequest, NextResponse } from 'next/server';
import { 
  formatNoteWithAI, 
  generateNoteSummary, 
  suggestNoteTitle, 
  enhanceMeetingNotes,
  generateCompletionSuggestion,
  answerQuestionAboutNote,
  organizeNoteContent,
  findRelatedTopics as findRelatedTopicsService
} from '@/lib/ai-service';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

// Initialize Google Generative AI with your API key
let genAI: GoogleGenerativeAI | undefined;
let model: GenerativeModel | undefined;

try {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY || '';
  if (apiKey) {
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    console.log("Google Generative AI model initialized successfully");
  } else {
    console.warn("GOOGLE_GEMINI_API_KEY is not set. AI features will not work correctly.");
  }
} catch (error) {
  console.error("Failed to initialize Google Generative AI:", error);
}

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

    let result;
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
        result = await findRelatedTopicsService(content);
        return NextResponse.json({ relatedTopics: result });

      default:
        return NextResponse.json(
          { error: 'Invalid operation' },
          { status: 400 }
        );
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
      return NextResponse.json({ 
        relatedTopics: ["AI service unavailable"],
        status: "model_error" 
      });
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
    return NextResponse.json(
      { error: 'Failed to find related topics' },
      { status: 500 }
    );
  }
}

async function answerQuestion(content: string, question: string) {
  try {
    console.log("Processing question:", question);
    console.log("Content length:", content.length);
    
    // Check if model is initialized
    if (!model) {
      console.error("AI model is not initialized");
      return NextResponse.json({ 
        answer: "Sorry, the AI service is currently unavailable. Please try again later.",
        status: "model_error" 
      });
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
      // Provide a more specific fallback
      return NextResponse.json({ 
        answer: "I'm having trouble analyzing your note right now. This might be due to service limitations or content constraints. Could you try rephrasing your question?",
        status: "ai_error"
      });
    }
  } catch (error) {
    console.error('Error answering question:', error);
    return NextResponse.json({ 
      error: 'Failed to answer question', 
      answer: 'I encountered a technical error. Please try again in a moment.',
      status: "server_error"
    });
  }
} 