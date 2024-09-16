// app/api/format-text/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY!);

export async function POST(req: NextRequest) {
  const { text } = await req.json();

  if (!text) {
    return NextResponse.json({ error: 'No text provided' }, { status: 400 });
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Format and improve the following text for a note-taking application. Correct any grammar or spelling errors, organize the content into clear paragraphs, and add appropriate headings where necessary:

${text}

Please return the formatted text only, without any additional comments.`;

    const result = await model.generateContent(prompt);
    const formattedText = result.response.text();

    return NextResponse.json({ formattedText });
  } catch (error) {
    console.error('Error in AI text formatting:', error);
    return NextResponse.json({ error: 'Text formatting failed' }, { status: 500 });
  }
}