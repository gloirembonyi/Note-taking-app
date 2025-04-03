import { NextRequest, NextResponse } from 'next/server';
import { 
  formatNoteWithAI, 
  generateNoteSummary, 
  suggestNoteTitle, 
  enhanceMeetingNotes,
  generateCompletionSuggestion 
} from '@/lib/ai-service';

export async function POST(request: NextRequest) {
  try {
    const { content, operation, partialContent } = await request.json();

    if (!content && !partialContent) {
      return NextResponse.json(
        { error: 'Content is required' },
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