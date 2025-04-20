import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

// Initialize Google Generative AI with proper error handling
let genAI: GoogleGenerativeAI | null = null;
let geminiModel: GenerativeModel | null = null;
let initialized = false;

try {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_KEY || process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY || '';
  if (apiKey && apiKey.length > 10) {
    genAI = new GoogleGenerativeAI(apiKey);
    geminiModel = genAI.getGenerativeModel({ model: 'gemini-pro' });
    initialized = true;
    console.log("AI service initialized successfully with API key");
  } else {
    console.warn("Google AI API key is missing or invalid. AI features will use mock responses.");
  }
} catch (error) {
  console.error("Failed to initialize AI service:", error);
}

// Common configuration options for AI requests
interface AIRequestOptions {
  temperature?: number;
  maxTokens?: number;
  topK?: number;
  topP?: number;
}

// Generic function to handle AI requests with proper error handling
async function processAIRequest(
  prompt: string, 
  options: AIRequestOptions = {},
  mockResponse?: string
): Promise<string> {
  const {
    temperature = 0.7,
    maxTokens = 1024,
    topK = 40,
    topP = 0.95
  } = options;

  try {
    if (!initialized || !geminiModel) {
      console.warn("Using mock response due to uninitialized AI service");
      return mockResponse || getMockResponse(prompt);
    }

    const result = await geminiModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
        topK,
        topP,
      },
    });

    if (!result.response || !result.response.text) {
      throw new Error("Empty response from AI service");
    }

    return result.response.text();
  } catch (error) {
    console.error("AI service error:", error);
    return mockResponse || getMockResponse(prompt);
  }
}

// Format note content with improved structure
export async function formatNote(content: string): Promise<string> {
  if (!content || content.trim().length < 10) {
    return "Please provide more content to format.";
  }

  const prompt = `
    Format and improve the following note content:
    - Correct any spelling or grammar errors
    - Add appropriate headings and subheadings
    - Organize content into logical sections
    - Keep the original meaning intact
    
    ${content}
  `;
  
  return processAIRequest(prompt, { temperature: 0.3 }, content);
}

// Generate a note summary
export async function generateNoteSummary(content: string): Promise<string> {
  if (!content || content.trim().length < 10) {
    return "Please provide more content to summarize.";
  }

  const prompt = `Create a concise summary of these notes, highlighting the key points. The summary should be about 3-5 sentences.
    
    ${content}
  `;
  
  return processAIRequest(prompt, { temperature: 0.5 }, "This is a summary of your notes highlighting the key points.");
}

// Suggest titles for a note based on content
export async function suggestNoteTitle(content: string): Promise<string[]> {
  if (!content || content.trim().length < 10) {
    return ["Untitled Note", "New Note", "Note " + new Date().toLocaleDateString()];
  }

  const prompt = `
    Based on the following note content, suggest 3 concise and descriptive titles.
    Return ONLY the titles separated by newlines.
    
    ${content.substring(0, 1000)}
  `;
  
  try {
    const result = await processAIRequest(prompt, { temperature: 0.7 });
    return result.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .slice(0, 3);
  } catch (error) {
    console.error("Error suggesting titles:", error);
    return ["Untitled Note", "New Note", "Note " + new Date().toLocaleDateString()];
  }
}

// Enhance meeting notes with structure and action items
export async function enhanceMeetingNotes(content: string): Promise<string> {
  if (!content || content.trim().length < 10) {
    return "Please provide meeting notes to enhance.";
  }

  const prompt = `
    Enhance and structure these meeting notes:
    - Organize into clear sections (Attendees, Discussion, Decisions, Action Items)
    - Format action items with assignees and due dates if mentioned
    - Highlight key decisions
    
    ${content}
  `;
  
  return processAIRequest(prompt, { temperature: 0.4 }, content);
}

// Generate text completion suggestions
export async function generateCompletionSuggestion(partialContent: string): Promise<string> {
  if (!partialContent || partialContent.trim().length < 5) {
    return "Please provide some text to complete.";
  }

  const prompt = `
    Continue this text naturally:
    ${partialContent}
    
    Provide a continuation that matches the style and context (about 2-3 sentences).
  `;
  
  return processAIRequest(prompt, { temperature: 0.8 }, "...");
}

// Answer questions about a note's content
export async function answerQuestion(content: string, question: string): Promise<string> {
  if (!content || content.trim().length < 10) {
    return "Please provide more note content for me to answer questions about.";
  }

  if (!question || question.trim().length < 3) {
    return "Please ask a specific question about your note.";
  }

  const prompt = `
    Based on this note content:
    ${content}
    
    Please answer this question:
    ${question}
    
    If the answer cannot be determined from the note content, please say so clearly.
  `;
  
  return processAIRequest(prompt, { temperature: 0.5 }, 
    "I'd help answer your question based on the note content, but the AI service is currently unavailable.");
}

// Organize and structure note content
export async function organizeNoteContent(content: string): Promise<string> {
  if (!content || content.trim().length < 10) {
    return "Please provide more content to organize.";
  }

  const prompt = `
    Organize the following notes into a well-structured format:
    - Create logical sections with headings
    - Group related information together
    - Use bullet points for lists
    
    ${content}
  `;
  
  return processAIRequest(prompt, { temperature: 0.4 }, content);
}

// Find related topics to note content
export async function findRelatedTopics(content: string): Promise<string[]> {
  if (!content || content.trim().length < 10) {
    return ["Note Taking", "Organization", "Productivity", "Information Management", "Knowledge Base"];
  }

  const prompt = `
    Based on this note content, suggest 5 related topics that would be valuable to explore.
    Return ONLY the topic names, each on a new line.
    
    ${content.substring(0, 1500)}
  `;
  
  try {
    const result = await processAIRequest(prompt, { temperature: 0.7 });
    return result.split('\n')
      .map(line => line.replace(/^[0-9\-\.\•]+\s*/, '').trim())
      .filter(line => line.length > 0)
      .slice(0, 5);
  } catch (error) {
    console.error("Error finding related topics:", error);
    return ["Note Taking", "Organization", "Productivity", "Information Management", "Knowledge Base"];
  }
}

// Extract key insights from note content
export async function extractKeyInsights(content: string): Promise<string[]> {
  if (!content || content.trim().length < 10) {
    return ["Please provide more content to extract insights from."];
  }

  const prompt = `
    Extract 3-5 key insights or main points from this note content.
    Return ONLY the insights, each on a new line.
    
    ${content}
  `;
  
  try {
    const result = await processAIRequest(prompt, { temperature: 0.5 });
    return result.split('\n')
      .map(line => line.replace(/^[0-9\-\.\•]+\s*/, '').trim())
      .filter(line => line.length > 0)
      .slice(0, 5);
  } catch (error) {
    console.error("Error extracting insights:", error);
    return ["Key insight 1", "Key insight 2", "Key insight 3"];
  }
}

// Generate mind map structure from note content
export async function generateMindMapStructure(content: string): Promise<any> {
  if (!content || content.trim().length < 10) {
    return {
      root: { text: "Main Topic" },
      children: [
        { text: "Subtopic 1", children: [{ text: "Detail 1" }, { text: "Detail 2" }] },
        { text: "Subtopic 2", children: [{ text: "Detail 1" }, { text: "Detail 2" }] },
        { text: "Subtopic 3", children: [{ text: "Detail 1" }, { text: "Detail 2" }] }
      ]
    };
  }

  const prompt = `
    Create a mind map structure from this note content with:
    - A central topic (main theme of the notes)
    - 3-5 main branches (key topics)
    - 2-3 sub-branches for each main branch
    
    Return as a JSON structure with this format:
    {
      "root": { "text": "Central Topic" },
      "children": [
        { 
          "text": "Main Branch 1", 
          "children": [
            { "text": "Sub-branch 1" },
            { "text": "Sub-branch 2" }
          ]
        }
      ]
    }
    
    ${content.substring(0, 1500)}
  `;
  
  try {
    const result = await processAIRequest(prompt, { temperature: 0.6 });
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("No valid JSON found in response");
  } catch (error) {
    console.error("Error generating mind map:", error);
    return {
      root: { text: "Main Topic" },
      children: [
        { text: "Subtopic 1", children: [{ text: "Detail 1" }, { text: "Detail 2" }] },
        { text: "Subtopic 2", children: [{ text: "Detail 1" }, { text: "Detail 2" }] },
        { text: "Subtopic 3", children: [{ text: "Detail 1" }, { text: "Detail 2" }] }
      ]
    };
  }
}

// Generate flashcards from note content
export async function generateFlashcards(content: string): Promise<any[]> {
  if (!content || content.trim().length < 10) {
    return [
      { question: "Sample Question 1", answer: "Sample Answer 1" },
      { question: "Sample Question 2", answer: "Sample Answer 2" },
      { question: "Sample Question 3", answer: "Sample Answer 3" }
    ];
  }

  const prompt = `
    Create 5 flashcards based on this note content. Each flashcard should have a question and answer.
    Return as a JSON array with this format:
    [
      { "question": "Question text here", "answer": "Answer text here" }
    ]
    
    ${content.substring(0, 2000)}
  `;
  
  try {
    const result = await processAIRequest(prompt, { temperature: 0.6 });
    const jsonMatch = result.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("No valid JSON found in response");
  } catch (error) {
    console.error("Error generating flashcards:", error);
    return [
      { question: "Sample Question 1", answer: "Sample Answer 1" },
      { question: "Sample Question 2", answer: "Sample Answer 2" },
      { question: "Sample Question 3", answer: "Sample Answer 3" }
    ];
  }
}

// Generate a mock response when AI is unavailable
function getMockResponse(prompt: string): string {
  if (prompt.includes('format') || prompt.includes('improve')) {
    return "I would format and improve your note here, but the AI service is currently unavailable.";
  }
  
  if (prompt.includes('summarize')) {
    return "This would be a concise summary of your notes, highlighting the key points and important information.";
  }
  
  if (prompt.includes('suggest title')) {
    return "Untitled Note\nNote Summary\nImportant Information";
  }
  
  if (prompt.includes('meeting')) {
    return "## Meeting Notes\n\n### Attendees\n- Person 1\n- Person 2\n\n### Discussion\nMain discussion points would be listed here.\n\n### Action Items\n- Task 1\n- Task 2";
  }
  
  if (prompt.includes('complete')) {
    return "... here's how the text would continue naturally based on your content.";
  }
  
  if (prompt.includes('question')) {
    return "I'd help answer your question based on the note content, but the AI service is currently unavailable.";
  }
  
  if (prompt.includes('related topics')) {
    return "Topic 1\nTopic 2\nTopic 3\nTopic 4\nTopic 5";
  }
  
  if (prompt.includes('insights')) {
    return "Key insight 1\nKey insight 2\nKey insight 3";
  }
  
  return "AI response would appear here. The service is currently unavailable.";
} 