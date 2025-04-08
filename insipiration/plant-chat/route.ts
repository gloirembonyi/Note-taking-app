import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

type ContentPart = 
  | { text: string } 
  | { inlineData: { mimeType: string; data: string } };

type PlantInfo = {
  plantInfo: string;
  healthAssessment: string;
};

export async function POST(req: Request) {
  try {
    const { messages, imageContext, plantInfo } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Invalid messages format" },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY || '');
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro",
      generationConfig: {
        temperature: 0.6,
        topK: 32,
        topP: 1,
        maxOutputTokens: 1024,
      },
    });

    const lastMessage = messages[messages.length - 1].content;
    
    // Check if the last message is just a basic greeting
    const isBasicGreeting = /^(hi|hello|hey|greetings|howdy|hi there|hello there)[\s!.?]*$/i.test(lastMessage.trim());
    
    if (isBasicGreeting) {
      // Return a simple greeting without plant analysis
      return NextResponse.json({
        response: {
          role: "assistant",
          content: "Hello! I'm your plant assistant. I can help you with questions about the plant you've identified. What would you like to know about it?"
        }
      });
    }
    
    // Extract plant information and health assessment from the context
    let plantData: PlantInfo = { plantInfo: "", healthAssessment: "" };
    if (plantInfo) {
      const sections = plantInfo.split(/HEALTH ASSESSMENT/i);
      if (sections.length >= 2) {
        plantData = {
          plantInfo: sections[0].trim(),
          healthAssessment: sections[1].trim()
        };
      }
    }
    
    const conversationHistory = messages
      .slice(0, -1)
      .map((m: { role: string; content: string }) => 
        `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`
      ).join('\n\n');
    
    // Create a focused prompt that avoids repeating health assessment content
    const prompt = `
      You are a Plant Expert assistant who provides CONCISE, PRECISE answers about plants.
      
      CONTEXT:
      ${plantData.plantInfo ? `Plant Information:\n${plantData.plantInfo}` : "No plant information provided yet."}
      ${plantData.healthAssessment ? `\nHealth Status Summary: ${plantData.healthAssessment.split('\n')[0]}` : ""}
      
      ${conversationHistory ? `\nCONVERSATION HISTORY:\n${conversationHistory}` : ""}
      
      USER QUESTION: ${lastMessage}
      
      RESPONSE INSTRUCTIONS:
      - Be extremely concise and direct - limit responses to 100-150 words maximum
      - Answer ONLY what the user directly asked - no additional information
      - Use simple, straightforward language
      - If asked about health or care:
        • Reference existing health assessment without repeating it fully
        • Add only new, relevant information not already covered
        • Provide 2-3 specific, actionable points
      - If asked about plant details:
        • Reference existing plant information without repeating it
        • Add only new, relevant details not already covered
      - Only use bullet points for new, critical information
      - Never repeat information that's already visible to the user
      - If user asks something unrelated to plants, provide a brief, polite redirect
      - Keep responses focused and immediately useful

      Now, respond to the user's question with a concise, precise answer that complements (but doesn't repeat) the existing information.
    `;

    try {
      // Create content parts for the API request
      const contentParts: ContentPart[] = [{ text: prompt }];
      
      // Only include the image if it exists and is properly formatted
      if (imageContext && typeof imageContext === 'string' && imageContext.includes(',')) {
        try {
          const baseData = imageContext.split(',')[1];
          if (baseData) {
            contentParts.push({
              inlineData: {
                mimeType: "image/jpeg",
                data: baseData
              }
            });
          }
        } catch (imgError) {
          console.error("Image processing error:", imgError);
          // Continue without the image if there's an error
        }
      }
      
      const result = await model.generateContent(contentParts);
      const response = await result.response;
      const text = response.text();

      // Apply enhanced formatting to the response
      const cleanedText = text
        // Remove markdown formatting characters
        .replace(/[#*`]/g, '')
        // Remove excessive newlines
        .replace(/\n{3,}/g, '\n\n')
        // Trim whitespace
        .trim()
        // Process line by line for better formatting
        .split('\n')
        .map(line => {
          // Format bullet points consistently
          if (/^[-•*]\s/.test(line)) {
            return '• ' + line.replace(/^[-•*]\s/, '').trim();
          }
          // Format numbered lists
          if (/^\d+[.).]\s/.test(line)) {
            return line.trim();
          }
          // Ensure section titles are properly capitalized
          if (/^[A-Z][A-Z\s]+:?$/.test(line.trim())) {
            return line.trim();
          }
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
    console.error("Plant Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process plant chat request" },
      { status: 500 }
    );
  }
} 