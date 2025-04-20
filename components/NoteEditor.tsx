//component/NoteEditor.tsx

"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Note } from "@/models/Note";
import { saveNote } from "@/lib/api";
import { Button, TextArea, Spinner } from "@/components/ui/core";
import {
  Mic,
  StopCircle,
  Save,
  Sparkles,
  FileText,
  Edit3,
  BookOpen,
  Clock,
  Video,
  Zap,
  Settings,
  X,
  CheckCircle2,
  Type,
  MessageSquare,
  List,
} from "lucide-react";
import {
  formatNote,
  findRelatedTopics,
  answerQuestion,
} from "@/lib/ai-service";

interface NoteEditorProps {
  note?: Note | null;
  onSave: (savedNote: Note) => void; // Accept an onSave prop
}

const NoteEditor: React.FC<NoteEditorProps> = ({ note, onSave }) => {
  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);
  const [showTitleSuggestions, setShowTitleSuggestions] = useState(false);
  const [aiStatus, setAiStatus] = useState<string>("");
  const [isMeetingMode, setIsMeetingMode] = useState(false);
  const [meetingDuration, setMeetingDuration] = useState(0);
  const [meetingTimer, setMeetingTimer] = useState<NodeJS.Timeout | null>(null);
  const [autoSaveInterval, setAutoSaveInterval] =
    useState<NodeJS.Timeout | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [relatedTopics, setRelatedTopics] = useState<string[]>([]);
  const [showTopics, setShowTopics] = useState(false);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [showAiChat, setShowAiChat] = useState(false);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const contentEditableRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
    }

    // Setup autosave every 30 seconds
    const interval = setInterval(() => {
      if (title && content) {
        handleAutoSave();
      }
    }, 30000);

    setAutoSaveInterval(interval);

    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (autoSaveInterval) clearInterval(autoSaveInterval);
      if (meetingTimer) clearInterval(meetingTimer);
    };
  }, [note, audioUrl, title, content]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (content.length > 50) {
        void getRelatedTopics();
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [content]);

  const handleAutoSave = async () => {
    try {
      if (!title.trim()) return;

      const savedNote = await saveNote({ id: note?.id, title, content });
      // Just save silently, don't navigate or show UI changes
      console.log("Auto-saved note", savedNote.id);
    } catch (error) {
      console.error("Error auto-saving note:", error);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: "audio/wav" });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        convertSpeechToText(audioBlob);
      };

      mediaRecorder.current.start();
      setIsRecording(true);

      if (isMeetingMode) {
        // Start meeting timer
        startMeetingTimer();
      }
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);

      if (isMeetingMode && meetingTimer) {
        clearInterval(meetingTimer);
        setMeetingTimer(null);
      }
    }
  };

  const startMeetingTimer = () => {
    setMeetingDuration(0);
    const timer = setInterval(() => {
      setMeetingDuration((prev) => prev + 1);
    }, 1000);
    setMeetingTimer(timer);
  };

  const convertSpeechToText = async (audioBlob: Blob) => {
    setIsProcessing(true);
    setAiStatus("Transcribing audio...");
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob);

      const response = await fetch("/api/speech-to-text", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Speech to text conversion failed");

      const { text } = await response.json();

      if (isMeetingMode) {
        await enhanceMeetingNotes(text);
      } else {
        await formatTextWithAI(text);
      }
    } catch (error) {
      console.error("Error in speech to text conversion:", error);
      setAiStatus("");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTextWithAI = async (text: string) => {
    setAiStatus("Formatting with AI...");
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: text,
          operation: "format",
        }),
      });

      if (!response.ok) throw new Error("Text formatting failed");

      const { formattedText } = await response.json();
      setContent((prevContent) => prevContent + "\n\n" + formattedText);

      // Generate title suggestions if this is a new note
      if (!note?.id && !title) {
        generateTitleSuggestions(formattedText);
      }
    } catch (error) {
      console.error("Error in AI text formatting:", error);
    } finally {
      setAiStatus("");
    }
  };

  const enhanceMeetingNotes = async (text: string) => {
    setAiStatus("Enhancing meeting notes...");
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: text,
          operation: "enhance-meeting",
        }),
      });

      if (!response.ok) throw new Error("Meeting notes enhancement failed");

      const { enhancedNotes } = await response.json();
      setContent(enhancedNotes);

      // Generate title suggestions based on the meeting notes
      generateTitleSuggestions(enhancedNotes);
    } catch (error) {
      console.error("Error enhancing meeting notes:", error);
    } finally {
      setAiStatus("");
    }
  };

  const generateTitleSuggestions = async (textContent: string) => {
    setAiStatus("Generating title suggestions...");
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: textContent,
          operation: "suggest-title",
        }),
      });

      if (!response.ok) throw new Error("Title suggestion failed");

      const { titles } = await response.json();
      if (titles && titles.length > 0) {
        setTitleSuggestions(titles);
        setShowTitleSuggestions(true);
      }
    } catch (error) {
      console.error("Error generating title suggestions:", error);
    } finally {
      setAiStatus("");
    }
  };

  const generateCompletionSuggestion = async () => {
    if (!content) return;

    setAiStatus("Generating suggestions...");
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partialContent: content,
          operation: "complete",
        }),
      });

      if (!response.ok) throw new Error("Completion suggestion failed");

      const { completion } = await response.json();
      if (completion) {
        setAiSuggestions([completion]);
        setAiAssistantOpen(true);
      }
    } catch (error) {
      console.error("Error generating completion suggestions:", error);
    } finally {
      setAiStatus("");
    }
  };

  const applySuggestion = (suggestion: string) => {
    setContent(suggestion);
    setAiAssistantOpen(false);
  };

  const applyTitleSuggestion = (suggestion: string) => {
    setTitle(suggestion);
    setShowTitleSuggestions(false);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert("Please enter a title for your note.");
      return;
    }

    try {
      const savedNote = await saveNote({ id: note?.id, title, content });
      onSave(savedNote);
      router.push("/notes");
    } catch (error) {
      console.error("Error saving note:", error);
    }
  };

  const formatCurrentContent = async () => {
    if (!content) return;
    setAiStatus("Formatting content...");
    try {
      await formatTextWithAI(content);
    } catch (error) {
      console.error("Error formatting current content:", error);
    }
  };

  const getAISuggestions = async () => {
    setIsLoadingAI(true);
    try {
      const formattedContent = await formatNote(content);
      setAiSuggestions([formattedContent]);
      setAiAssistantOpen(true);
    } catch (error) {
      console.error("Error getting AI suggestions:", error);
    } finally {
      setIsLoadingAI(false);
    }
  };

  const getRelatedTopics = async () => {
    try {
      const topics = await findRelatedTopics(content);
      setRelatedTopics(topics);
    } catch (error) {
      console.error("Error getting related topics:", error);
    }
  };

  const askAIQuestion = async () => {
    if (!aiQuestion.trim()) return;

    setIsLoadingAI(true);
    try {
      const answer = await answerQuestion(content, aiQuestion);
      setAiAnswer(answer);
      setAiQuestion("");
    } catch (error) {
      console.error("Error getting AI answer:", error);
    } finally {
      setIsLoadingAI(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="mb-4 relative">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note Title"
          className="w-full p-3 text-lg font-semibold border border-gray-300 rounded-lg"
        />

        {showTitleSuggestions && titleSuggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
            <div className="p-2 border-b border-gray-200 flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">
                Suggested titles:
              </span>
              <button
                onClick={() => setShowTitleSuggestions(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            </div>
            <div className="p-2">
              {titleSuggestions.map((suggestion, idx) => (
                <div
                  key={idx}
                  className="p-2 hover:bg-gray-100 cursor-pointer flex items-center"
                  onClick={() => applyTitleSuggestion(suggestion)}
                >
                  <Type size={16} className="mr-2 text-indigo-500" />
                  {suggestion}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="relative mb-6 group">
        <TextArea
          value={content}
          onChange={(e: { target: { value: React.SetStateAction<string> } }) =>
            setContent(e.target.value)
          }
          placeholder="Start typing your note or use AI assistant to help..."
          className="w-full h-96 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />

        {/* AI Suggestion Panel */}
        {aiAssistantOpen && aiSuggestions.length > 0 && (
          <div className="absolute bottom-2 right-2 w-2/3 bg-white border border-indigo-200 rounded-lg shadow-lg">
            <div className="p-3 border-b border-indigo-100 bg-indigo-50 flex justify-between items-center">
              <div className="flex items-center">
                <Sparkles size={16} className="text-indigo-600 mr-2" />
                <span className="font-medium text-indigo-700">
                  AI Suggestion
                </span>
              </div>
              <button
                onClick={() => setAiAssistantOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4">
              {aiSuggestions.map((suggestion, idx) => (
                <div key={idx} className="mb-3">
                  <p className="text-gray-700 italic mb-2">{suggestion}</p>
                  <div className="flex justify-end">
                    <button
                      onClick={() => applySuggestion(suggestion)}
                      className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-1 rounded-md flex items-center text-sm"
                    >
                      <CheckCircle2 size={14} className="mr-1" />
                      Apply
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Status message */}
      {aiStatus && (
        <div className="mb-4 p-2 bg-blue-50 text-blue-600 rounded-md flex items-center">
          <Spinner className="animate-spin mr-2" />
          {aiStatus}
        </div>
      )}

      {/* Recording status and timer */}
      {isRecording && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-600 rounded-full mr-2 animate-pulse"></div>
            <span>
              {isMeetingMode ? "Recording meeting" : "Recording audio"}...
            </span>
          </div>
          {isMeetingMode && (
            <div className="text-gray-600">
              {new Date(meetingDuration * 1000).toISOString().slice(11, 19)}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        <Button
          onClick={isRecording ? stopRecording : startRecording}
          className={`${
            isRecording
              ? "bg-red-600 hover:bg-red-700"
              : "bg-blue-600 hover:bg-blue-700"
          } text-white flex items-center`}
        >
          {isRecording ? (
            <StopCircle className="mr-2 h-4 w-4" />
          ) : (
            <Mic className="mr-2 h-4 w-4" />
          )}
          {isRecording ? "Stop Recording" : "Start Recording"}
        </Button>

        <Button
          onClick={() => setIsMeetingMode(!isMeetingMode)}
          className={`${
            isMeetingMode
              ? "bg-purple-600 hover:bg-purple-700"
              : "bg-gray-600 hover:bg-gray-700"
          } text-white flex items-center`}
        >
          <Video className="mr-2 h-4 w-4" />
          {isMeetingMode ? "Meeting Mode: ON" : "Meeting Mode"}
        </Button>

        <Button
          onClick={generateCompletionSuggestion}
          className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center"
          disabled={!content || isProcessing}
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Suggest Completion
        </Button>

        <Button
          onClick={formatCurrentContent}
          className="bg-green-600 hover:bg-green-700 text-white flex items-center"
          disabled={!content || isProcessing}
        >
          <Edit3 className="mr-2 h-4 w-4" />
          Format with AI
        </Button>

        <Button
          onClick={handleSave}
          className="bg-yellow-600 hover:bg-yellow-700 text-white flex items-center"
          disabled={isProcessing}
        >
          <Save className="mr-2 h-4 w-4" />
          Save Note
        </Button>
      </div>

      {isProcessing && (
        <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
          <Spinner className="animate-spin mr-2 text-indigo-600" />
          <span className="text-gray-700">Processing your request...</span>
        </div>
      )}

      {audioUrl && (
        <div className="mt-4 p-4 border border-gray-300 rounded-lg bg-gray-50">
          <h3 className="text-lg font-medium mb-2 text-gray-700">
            Recorded Audio
          </h3>
          <audio controls src={audioUrl} className="w-full">
            Your browser does not support the audio element.
          </audio>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <button
          onClick={getAISuggestions}
          disabled={isLoadingAI || content.length < 10}
          className="flex items-center px-3 py-1 bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100 disabled:opacity-50"
        >
          <Sparkles size={16} className="mr-1" />
          AI Improve
        </button>

        <button
          onClick={() => setShowTopics(!showTopics)}
          className="flex items-center px-3 py-1 bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100"
        >
          <List size={16} className="mr-1" />
          Related Topics
        </button>

        <button
          onClick={() => setShowAiChat(!showAiChat)}
          className="flex items-center px-3 py-1 bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100"
        >
          <MessageSquare size={16} className="mr-1" />
          Ask AI
        </button>
      </div>

      {/* Related Topics Panel */}
      {showTopics && relatedTopics.length > 0 && (
        <div className="absolute top-2 right-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="p-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <span className="font-medium">Related Topics</span>
            <button
              onClick={() => setShowTopics(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={16} />
            </button>
          </div>
          <div className="p-4">
            <ul className="space-y-2">
              {relatedTopics.map((topic, idx) => (
                <li key={idx} className="text-gray-700">
                  {topic}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* AI Chat Panel */}
      {showAiChat && (
        <div className="absolute top-2 right-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="p-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <span className="font-medium">Ask AI About Your Note</span>
            <button
              onClick={() => setShowAiChat(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={16} />
            </button>
          </div>
          <div className="p-4">
            <div className="mb-4">
              <input
                type="text"
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                placeholder="Ask a question about your note..."
                className="w-full p-2 border border-gray-300 rounded-md"
                onKeyPress={(e) => e.key === "Enter" && askAIQuestion()}
              />
            </div>
            {aiAnswer && (
              <div className="p-3 bg-gray-50 rounded-md">
                <p className="text-gray-700 whitespace-pre-wrap">{aiAnswer}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NoteEditor;
