import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Google Generative AI
let genAI: GoogleGenerativeAI | null = null;
let initialized = false;

try {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_KEY || '';
  if (apiKey) {
    genAI = new GoogleGenerativeAI(apiKey);
    initialized = true;
    console.log("AI service initialized successfully");
  } else {
    console.warn("Google AI API key is not set. Some AI features may not work correctly.");
  }
} catch (error) {
  console.error("Failed to initialize AI service:", error);
}

interface AIProcessingOptions {
  maxOutputTokens?: number;
  temperature?: number;
  topK?: number;
  topP?: number;
  fallback?: boolean;
}

// Generic function to handle AI requests with proper error handling
async function processRequest(prompt: string, options: AIProcessingOptions = {}) {
  const {
    maxOutputTokens = 1024,
    temperature = 0.7,
    topK = 40,
    topP = 0.95,
    fallback = true
  } = options;

  try {
    if (!initialized || !genAI) {
      if (fallback) {
        console.warn("Using mock response due to uninitialized AI service");
        return getMockResponse(prompt);
      }
      throw new Error("AI service not initialized");
    }

    const geminiModel = genAI.getGenerativeModel({
      model: 'gemini-pro',
      generationConfig: {
        maxOutputTokens,
        temperature,
        topK,
        topP,
      },
    });

    const result = await geminiModel.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("AI service error:", error);
    
    if (fallback) {
      console.warn("Using mock response due to AI service error");
      return getMockResponse(prompt);
    }
    
    throw new Error("Failed to process AI request");
  }
}

// Generate a mock response for testing or when AI service is unavailable
function getMockResponse(prompt: string): string {
  // Extract the operation from the prompt (basic heuristic)
  if (prompt.includes("summarize") || prompt.includes("summary")) {
    return "This is a mock summary of the content. The AI service is currently unavailable.";
  }
  
  if (prompt.includes("format") || prompt.includes("formatting")) {
    return prompt.split("Content:")[1]?.trim() || "Mock formatted content";
  }
  
  if (prompt.includes("title") || prompt.includes("suggest title")) {
    return "Mock Title: Important Notes";
  }
  
  if (prompt.includes("meeting notes") || prompt.includes("enhance meeting")) {
    return "Enhanced meeting notes would appear here. The AI service is currently unavailable.";
  }
  
  if (prompt.includes("complete") || prompt.includes("continuation")) {
    return "... this is a mock continuation of your text. The AI service is currently unavailable.";
  }
  
  if (prompt.includes("related topics") || prompt.includes("suggest topics")) {
    return JSON.stringify([
      "Note-Taking Strategies",
      "Information Management",
      "Productivity Techniques",
      "Digital Organization",
      "Knowledge Systems"
    ]);
  }
  
  // General fallback
  return "AI response would appear here. The service is currently unavailable.";
}

// Format the note with AI
export async function formatNoteWithAI(content: string): Promise<string> {
  const prompt = `
    Format the following note content to be well-structured and readable. 
    Improve formatting but preserve all original information.
    
    Content:
    ${content}
  `;
  
  return processRequest(prompt);
}

// Generate a summary of the note
export async function generateNoteSummary(content: string): Promise<string> {
  const prompt = `
    Provide a concise summary of the following note content in 3-5 sentences.
    Capture the main points and key ideas.
    
    Content:
    ${content}
  `;
  
  return processRequest(prompt);
}

// Suggest titles for the note
export async function suggestNoteTitle(content: string): Promise<string[]> {
  const prompt = `
    Suggest 3 clear, concise titles for the following note content.
    Titles should accurately reflect the content's main topic.
    Return just the titles separated by newlines.
    
    Content:
    ${content.substring(0, 1000)}
  `;
  
  const result = await processRequest(prompt);
  return result.split('\n').filter(title => title.trim().length > 0);
}

// Enhance meeting notes
export async function enhanceMeetingNotes(content: string): Promise<string> {
  const prompt = `
    Enhance the following meeting notes by:
    1. Adding clear headings for different sections
    2. Highlighting action items
    3. Organizing information logically
    4. Formatting for better readability
    Return the enhanced notes in markdown format.
    
    Meeting Notes:
    ${content}
  `;
  
  return processRequest(prompt);
}

// Generate completion suggestion
export async function generateCompletionSuggestion(partialContent: string): Promise<string> {
  const prompt = `
    Continue the following text in a coherent and natural way.
    The continuation should be 2-3 sentences that logically follow from the partial content.
    
    Partial content:
    ${partialContent}
    
    Continuation:
  `;
  
  try {
    return await processRequest(prompt);
  } catch (error) {
    console.error("Error in completion suggestion:", error);
    throw new Error("Failed to generate completion");
  }
}

// Answer question about note
export async function answerQuestionAboutNote(content: string, question: string): Promise<string> {
  const prompt = `
    Based on the following note content, answer this question:
    "${question}"
    
    If the answer cannot be determined from the content, say so clearly.
    
    Note content:
    ${content.substring(0, 3000)}
  `;
  
  return processRequest(prompt);
}

// Organize note content
export async function organizeNoteContent(content: string): Promise<string> {
  const prompt = `
    Organize the following note content into a well-structured format with:
    - Clear headings and subheadings
    - Bullet points for lists
    - Logical grouping of related information
    
    Return the organized content in markdown format.
    
    Content:
    ${content}
  `;
  
  return processRequest(prompt);
}

// Find related topics
export async function findRelatedTopics(content: string): Promise<string[]> {
  const prompt = `
    Based on the following note content, suggest 5 related topics that would be valuable to explore.
    Return your response as a JSON array of strings with just the topic names.
    
    Note content:
    ${content.substring(0, 2000)}
  `;
  
  try {
    const result = await processRequest(prompt);
    
    // Try to parse as JSON
    try {
      const jsonMatch = result.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error("Error parsing JSON from AI response:", parseError);
    }
    
    // Fallback to text processing
    return result
      .split('\n')
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(line => line.length > 0)
      .slice(0, 5);
  } catch (error) {
    console.error("Error finding related topics:", error);
    return [
      "Note Taking Techniques",
      "Information Management",
      "Productivity Methods",
      "Digital Organization",
      "Knowledge Systems"
    ];
  }
}

// Extract key insights from a note
export async function extractKeyInsights(content: string): Promise<string[]> {
  const prompt = `
    Extract 3-5 key insights or important points from the following note content.
    Return each insight as a separate line.
    
    Content:
    ${content.substring(0, 2500)}
  `;
  
  try {
    const result = await processRequest(prompt);
    return result
      .split('\n')
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(line => line.length > 0);
  } catch (error) {
    console.error("Error extracting key insights:", error);
    return ["Key insights would appear here. The AI service is currently unavailable."];
  }
}

// Generate a mind map structure from note content
export async function generateMindMapStructure(content: string): Promise<any> {
  const prompt = `
    Create a mind map structure from the following note content.
    Return the result as a JSON object with a 'root' node and 'children' array.
    Each node should have a 'text' property and optional 'children' array.
    Keep it to 3 levels deep maximum with 3-5 main branches.
    
    Content:
    ${content.substring(0, 2000)}
  `;
  
  try {
    const result = await processRequest(prompt);
    
    // Try to extract and parse JSON
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.error("Error parsing mind map JSON:", parseError);
      }
    }
    
    // Fallback structure
    return {
      root: { text: "Main Topic" },
      children: [
        { text: "Subtopic 1", children: [{ text: "Detail 1" }, { text: "Detail 2" }] },
        { text: "Subtopic 2", children: [{ text: "Detail 1" }, { text: "Detail 2" }] },
        { text: "Subtopic 3", children: [{ text: "Detail 1" }, { text: "Detail 2" }] }
      ]
    };
  } catch (error) {
    console.error("Error generating mind map:", error);
    
    // Simplified fallback
    return {
      root: { text: "Main Topic" },
      children: [
        { text: "Subtopic 1" },
        { text: "Subtopic 2" },
        { text: "Subtopic 3" }
      ]
    };
  }
}

// Generate flashcards from note content
export async function generateFlashcards(content: string): Promise<{ question: string, answer: string }[]> {
  const prompt = `
    Create 5 flashcards from the following note content.
    Each flashcard should have a question and answer.
    Return the result as a JSON array where each item has 'question' and 'answer' properties.
    
    Content:
    ${content.substring(0, 2500)}
  `;
  
  try {
    const result = await processRequest(prompt);
    
    // Try to extract and parse JSON
    const jsonMatch = result.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.error("Error parsing flashcards JSON:", parseError);
      }
    }
    
    // Fallback flashcards
    return [
      { question: "What is the main topic of these notes?", answer: "Refer to the content for specific details" },
      { question: "What are the key points mentioned?", answer: "Refer to the content for specific details" },
      { question: "What conclusions can be drawn from this information?", answer: "Refer to the content for specific details" }
    ];
  } catch (error) {
    console.error("Error generating flashcards:", error);
    return [
      { question: "AI-generated flashcards would appear here", answer: "The service is currently unavailable" }
    ];
  }
} 