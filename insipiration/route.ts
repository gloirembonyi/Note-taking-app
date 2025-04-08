import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

type ContentPart = 
  | { text: string } 
  | { inlineData: { mimeType: string; data: string } };

export async function POST(req: Request) {
  try {
    const { image } = await req.json();

    if (!image) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY || '');
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro",
      generationConfig: {
        temperature: 0.4,
        topK: 32,
        topP: 1,
        maxOutputTokens: 2048,
      },
    });

    const imageData = {
      mimeType: "image/jpeg",
      data: image.split(",")[1],
    };

    const prompt = `
      You are a Plant Expert assistant. Analyze this plant image and provide a structured identification report.
      
      RESPONSE FORMAT:
      PLANT INFORMATION
      Common Name: [primary name]
      Scientific Name: [genus species]
      Family: [family name]

      CHARACTERISTICS
      • Growth Rate: [speed]
      • Mature Size: [dimensions]
      • Life Cycle: [type]
      • Native Region: [origin]

      CARE REQUIREMENTS
      • Light: [specific needs]
      • Water: [frequency]
      • Soil: [type]
      • Temperature: [range]
      • Humidity: [level]

      HEALTH ASSESSMENT
      Status: [current condition]

      Observations:
      • [key observation about overall health]
      • [specific note about leaves/stems]
      • [any visible issues]

      Care Recommendations:
      • [primary care action]
      • [secondary care action]
      • [preventive measure]

      Important:
      • [critical care note]
      • [warning if applicable]

      Keep each section concise and focused on essential information only.
    `;

    try {
      const result = await model.generateContent([
        { text: prompt },
        { inlineData: imageData }
      ]);

      const response = await result.response;
      const text = response.text();

      // Clean and format the response
      const cleanedText = text
        .replace(/[#*`]/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
        .split('\n')
        .map(line => {
          if (/^[-•*]\s/.test(line)) {
            return '• ' + line.replace(/^[-•*]\s/, '').trim();
          }
          if (/^\d+[.).]\s/.test(line)) {
            return line.trim();
          }
          if (/^[A-Z][A-Z\s]+:?$/.test(line.trim())) {
            return line.trim();
          }
          return line;
        })
        .join('\n');

      // Split the response into plant info and health assessment
      const [plantInfo, healthAssessment] = cleanedText.split(/HEALTH ASSESSMENT/i);

      return NextResponse.json({
        plantInfo: plantInfo.trim(),
        healthAssessment: "HEALTH ASSESSMENT\n═════════════════\n" + (healthAssessment || "").trim()
      });

    } catch (genError) {
      console.error("Generation error:", genError);
      throw new Error("Failed to identify plant");
    }

  } catch (error) {
    console.error("Plant Identification API error:", error);
    return NextResponse.json(
      { error: "Failed to process plant identification request" },
      { status: 500 }
    );
  }
} 