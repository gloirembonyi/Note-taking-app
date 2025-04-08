import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { messages, imageContext, plantInfo, context } = await req.json();

    const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY || '');
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro",
      generationConfig: {
        temperature: 0.7,
        topK: 32,
        topP: 1,
        maxOutputTokens: 2048,
      },
    });

    const lastMessage = messages[messages.length - 1].content;
    const prompt = `
      Context: You are a plant expert assistant. The user has provided an image of a plant and this information about it:
      ${plantInfo}

      Previous messages:
      ${messages.slice(0, -1).map((m: { role: string; content: string }) => 
        `${m.role}: ${m.content}`
      ).join('\n')}

      User's question: ${lastMessage}

      Instructions:
      - Provide a clear, direct answer about the plant
      - Use natural language without special characters
      - If making a list, use simple bullet points
      - Reference the image when relevant
      - Keep formatting simple and clean
    `;

    try {
      const result = await model.generateContent([
        { text: prompt },
        imageContext && {
          inlineData: {
            mimeType: "image/jpeg",
            data: imageContext.split(',')[1]
          }
        }
      ].filter((part): part is NonNullable<typeof part> => part !== null));

      const response = await result.response;
      const text = response.text();

      // Clean up the response
      const cleanedText = text
        .replace(/[#*`]/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
        .split('\n')
        .map(line => {
          if (/^[-•]/.test(line)) return '• ' + line.substring(1).trim();
          if (/^\d+[.)]/.test(line)) return line.trim();
          return line;
        })
        .join('\n');

      return NextResponse.json({
        response: {
          role: "assistant",
          content: cleanedText
        }
      });

    } catch (genError) {
      console.error("Generation error:", genError);
      throw new Error("Failed to generate response");
    }

  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process chat request" },
      { status: 500 }
    );
  }
} 