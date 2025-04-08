"use client";

import { useState, useEffect, useRef } from "react";
import {
  FaComments,
  FaPaperPlane,
  FaCopy,
  FaExpand,
  FaCompress,
  FaEraser,
  FaRobot,
  FaUser,
  FaImage,
  FaDownload,
  FaShare,
  FaVolumeUp,
  FaVolumeMute,
  FaPause,
  FaPlay,
  FaChevronDown,
  FaChevronUp,
  FaLeaf,
  FaSpinner,
} from "react-icons/fa";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface PlantChatProps {
  imageContext?: string;
  plantInfo?: string;
}

interface VoiceSettings {
  voice: SpeechSynthesisVoice | null;
  rate: number;
  pitch: number;
  volume: number;
}

const cleanResponse = (text: string) => {
  return (
    text
      // Remove Markdown symbols
      .replace(/[#*`]/g, "")
      // Remove multiple newlines
      .replace(/\n{3,}/g, "\n\n")
      // Remove leading/trailing whitespace
      .trim()
      // Format lists properly
      .split("\n")
      .map((line) => {
        // Clean up numbered lists
        if (/^\d+[\.\)]/.test(line)) {
          return line.replace(/^\d+[\.\)]/, (match) => `${match} `);
        }
        // Clean up bullet points
        if (/^[-•]/.test(line)) {
          return line.replace(/^[-•]/, "•");
        }
        return line;
      })
      .join("\n")
  );
};

const formatResponse = (text: string) => {
  if (!text || typeof text !== "string") {
    console.error("Invalid response format:", text);
    return ["Something went wrong. Please try again."];
  }

  // Format main title
  text = text.replace(/^(To prevent .+)$/m, "<title>$1</title>");

  // Format section titles
  text = text.replace(
    /^(CARE REQUIREMENTS|CHARACTERISTICS|HEALTH ASSESSMENT|PLANT INFORMATION)$/gm,
    "<section>$1</section>"
  );

  // Format subsection titles
  text = text.replace(
    /^(Care Recommendations|Observations):$/gm,
    "<subsection>$1:</subsection>"
  );

  // Format Important section
  text = text.replace(/^Important:/gm, "<important>Important:</important>");

  // Format steps and sections
  text = text.replace(/^([A-Z][^:]+):\s*/gm, "<step>$1:</step> ");

  // Format paragraphs
  text = text.replace(/^(?!<[^>]+>)(.*\.)$/gm, "<paragraph>$1</paragraph>");

  // Format lists
  text = text.replace(/^[•\-]\s+(.+)$/gm, "<bullet>$1</bullet>");

  return text.split("\n").filter((line) => line.trim());
};

const renderFormattedMessage = (content: string) => {
  const lines = formatResponse(content);
  return (
    <div className="space-y-4">
      {lines.map((line, i) => {
        if (line.startsWith("<title>")) {
          return (
            <h2
              key={i}
              className="text-2xl font-medium text-[#52B788] mb-6 pb-2 border-b-2 border-[#52B788]/30"
            >
              {line.replace(/<\/?title>/g, "")}
            </h2>
          );
        }

        if (line.startsWith("<section>")) {
          return (
            <h2
              key={i}
              className="text-xl font-medium text-[#52B788] mt-6 mb-3 pb-1 border-b border-[#52B788]/30"
            >
              {line.replace(/<\/?section>/g, "")}
            </h2>
          );
        }

        if (line.startsWith("<subsection>")) {
          return (
            <h3
              key={i}
              className="text-lg font-medium text-[#52B788] mt-4 mb-2"
            >
              {line.replace(/<\/?subsection>/g, "")}
            </h3>
          );
        }

        if (line.startsWith("<important>")) {
          return (
            <div
              key={i}
              className="bg-yellow-900/20 p-3 rounded-lg border border-yellow-700/30 my-2"
            >
              <p className="text-yellow-400 font-medium">
                {line.replace(/<\/?important>/g, "")}
              </p>
            </div>
          );
        }

        if (line.startsWith("<step>")) {
          return (
            <div key={i} className="mb-4">
              <h3 className="text-lg font-medium text-[#52B788] mb-2">
                {line.replace(/<\/?step>/g, "")}
              </h3>
            </div>
          );
        }

        if (line.startsWith("<paragraph>")) {
          return (
            <p
              key={i}
              className="text-white/90 leading-relaxed pl-4 hover:text-white transition-colors"
            >
              {line.replace(/<\/?paragraph>/g, "")}
            </p>
          );
        }

        if (line.startsWith("<bullet>")) {
          return (
            <div
              key={i}
              className="flex items-start space-x-3 pl-6 py-1 group hover:bg-[#52B788]/5 rounded-lg transition-colors"
            >
              <span className="text-[#52B788] mt-1.5 text-lg transform group-hover:scale-125 transition-transform">
                •
              </span>
              <span className="text-white/90 leading-relaxed group-hover:text-white transition-colors">
                {line.replace(/<\/?bullet>/g, "")}
              </span>
            </div>
          );
        }

        return (
          <p
            key={i}
            className="text-white/90 leading-relaxed hover:text-white transition-colors"
          >
            {line}
          </p>
        );
      })}
    </div>
  );
};

// Add these CSS keyframes at the top of the file, below the imports
const typingAnimationKeyframes = `
@keyframes typing-dot {
  0%, 20% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
  80%, 100% {
    transform: translateY(0);
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse-border {
  0% {
    border-color: rgba(82, 183, 136, 0.3);
  }
  50% {
    border-color: rgba(82, 183, 136, 0.6);
  }
  100% {
    border-color: rgba(82, 183, 136, 0.3);
  }
}

.typing-indicator .dot {
  animation: typing-dot 1.4s infinite;
  animation-fill-mode: both;
}

.typing-indicator .dot:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator .dot:nth-child(3) {
  animation-delay: 0.4s;
}

.message {
  animation: fade-in 0.3s ease-out;
}

.new-plant-message {
  animation: pulse-border 2s infinite;
}
`;

export default function PlantChat({ imageContext, plantInfo }: PlantChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm your Plant Expert. You can ask me anything about the identified plant, and I'll provide detailed information. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [typingText, setTypingText] = useState("");
  const [currentResponse, setCurrentResponse] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    voice: null,
    rate: 1,
    pitch: 1,
    volume: 1,
  });
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typingInterval, setTypingInterval] = useState<NodeJS.Timeout | null>(
    null
  );
  const [prevPlantInfo, setPrevPlantInfo] = useState<string | undefined>(
    plantInfo
  );
  const [isClearing, setIsClearing] = useState(false);

  // Clear chat when new plant is identified
  useEffect(() => {
    if (plantInfo && plantInfo !== prevPlantInfo) {
      clearChat(true);
      setPrevPlantInfo(plantInfo);
    }
  }, [plantInfo, prevPlantInfo]);

  const clearChat = (isNewPlant = false) => {
    // Cancel any ongoing speech
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    setIsSpeaking(false);
    setIsPaused(false);
    setError(null);

    // Visual feedback for clearing
    if (!isNewPlant) {
      setIsClearing(true);
      setTimeout(() => {
        setIsClearing(false);
      }, 500);
    }

    // Reset to initial message or add a transition message for new plant
    setMessages([
      {
        role: "assistant",
        content: isNewPlant
          ? "I see you've identified a new plant! I'm ready to answer any questions about it. How can I help you today?"
          : "Hello! I'm your Plant Expert. You can ask me anything about the identified plant, and I'll provide detailed information. How can I help you today?",
        timestamp: new Date(),
      },
    ]);

    // Focus on input field
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const scrollToBottom = (immediate = false) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: immediate ? "auto" : "smooth",
        block: "end",
      });
    }
  };

  useEffect(() => {
    // Scroll to bottom when messages change or typing state changes
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Keep scroll at bottom during typing animation
    if (isTyping) {
      scrollToBottom(true);
    }
  }, [isTyping, typingText]);

  // Force scroll when typing starts
  useEffect(() => {
    if (isTyping) {
      const scrollInterval = setInterval(() => {
        scrollToBottom(true);
      }, 100);

      setTypingInterval(scrollInterval);
      return () => {
        clearInterval(scrollInterval);
        setTypingInterval(null);
      };
    }
  }, [isTyping]);

  // Cleanup typing interval on unmount
  useEffect(() => {
    return () => {
      if (typingInterval) {
        clearInterval(typingInterval);
      }
    };
  }, [typingInterval]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    // Reset error state
    setError(null);

    // Add user message
    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setIsTyping(true);

    // Immediately scroll to show typing indicator
    setTimeout(() => scrollToBottom(true), 50);

    try {
      const response = await fetch("/api/plant-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          imageContext,
          plantInfo,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error: ${response.status}`);
      }

      const data = await response.json();
      setIsTyping(false);

      // Add AI response - handle different response formats
      if (
        data.response &&
        typeof data.response === "object" &&
        data.response.content
      ) {
        // New format with role and content
        setMessages((prev) => [
          ...prev,
          { ...data.response, timestamp: new Date() },
        ]);
      } else if (data.response && typeof data.response === "string") {
        // Old format with just a string
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.response, timestamp: new Date() },
        ]);
      } else {
        console.error("Unexpected response format:", data);
        throw new Error("Unexpected response format");
      }
    } catch (error) {
      console.error("Error in chat:", error);
      setIsTyping(false);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      setError(errorMessage);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `I'm sorry, but I encountered an error processing your request. ${
            errorMessage.includes("404")
              ? "The plant chat endpoint seems to be unavailable."
              : "Please try again."
          }`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
      // Focus back on input after response
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  useEffect(() => {
    const initVoice = () => {
      if ("speechSynthesis" in window) {
        // Wait for voices to be loaded
        window.speechSynthesis.onvoiceschanged = () => {
          const voices = window.speechSynthesis.getVoices();
          // Try to find a natural sounding English voice
          const preferredVoice =
            voices.find(
              (voice) =>
                (voice.name.includes("Natural") ||
                  voice.name.includes("Premium")) &&
                voice.lang.startsWith("en")
            ) ||
            voices.find((voice) => voice.lang.startsWith("en")) ||
            voices[0];

          setVoiceSettings((prev) => ({
            ...prev,
            voice: preferredVoice,
          }));
        };

        // Trigger initial voice load
        window.speechSynthesis.getVoices();
      }
    };

    initVoice();
  }, []);

  const speak = (text: string) => {
    if ("speechSynthesis" in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      setIsPaused(false);

      if (isSpeaking) {
        setIsSpeaking(false);
        return;
      }

      // Clean text for better speech
      const cleanedText = text
        .replace(/[<>]/g, "") // Remove HTML tags
        .replace(/\s+/g, " ") // Normalize spaces
        .replace(/\n/g, ". ") // Convert newlines to pauses
        .replace(/\([^)]*\)/g, ""); // Remove parentheses and their content

      const utterance = new SpeechSynthesisUtterance(cleanedText);

      // Apply voice settings
      if (voiceSettings.voice) utterance.voice = voiceSettings.voice;
      utterance.rate = voiceSettings.rate;
      utterance.pitch = voiceSettings.pitch;
      utterance.volume = voiceSettings.volume;

      // Add event handlers
      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        setIsPaused(false);
      };

      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  const togglePause = () => {
    if (isSpeaking) {
      if (isPaused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
      } else {
        window.speechSynthesis.pause();
        setIsPaused(true);
      }
    }
  };

  // Add cleanup on unmount
  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <>
      {/* Add keyframes styles */}
      <style jsx global>
        {typingAnimationKeyframes}
      </style>

      <div
        className={`
          bg-[#0a0520]/90 rounded-2xl overflow-hidden border border-[#52B788]/30 
          shadow-xl backdrop-blur-lg h-full flex flex-col relative
          hover:border-[#52B788]/40 transition-all duration-500
          ${isExpanded ? "shadow-2xl shadow-[#52B788]/20" : ""}
          ${isClearing ? "animate-pulse" : ""}
        `}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-20 bg-[#0a0520]/90 backdrop-blur-md shrink-0"
          onClick={() => setMinimized(!minimized)}
        >
          <div className="bg-gradient-to-r from-[#0a0520]/90 to-[#130a2a]/90 p-3 border-b border-[#52B788]/20 cursor-pointer">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="relative w-8 h-8 rounded-full bg-gradient-to-r from-[#52B788] to-[#1FBA9C] flex items-center justify-center">
                  <FaLeaf className="text-white text-sm" />
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0a0520]"></div>
                </div>
                <div>
                  <h3 className="text-transparent bg-gradient-to-r from-[#52B788] to-[#1FBA9C] bg-clip-text font-light">
                    Plant Expert
                  </h3>
                  <div className="text-xs text-gray-400 flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Online Now
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                {!minimized && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        clearChat();
                      }}
                      className="action-button-small group"
                      title="Clear chat"
                    >
                      <FaEraser
                        size={14}
                        className="group-hover:scale-110 transition-transform"
                      />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMinimized(!minimized);
                      }}
                      className="action-button-small group"
                      title="Minimize"
                    >
                      <FaChevronDown
                        size={14}
                        className="group-hover:scale-110 transition-transform"
                      />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsExpanded(!isExpanded);
                      }}
                      className="action-button-small group"
                      title={isExpanded ? "Minimize" : "Expand"}
                    >
                      {isExpanded ? (
                        <FaCompress
                          size={14}
                          className="group-hover:scale-110 transition-transform"
                        />
                      ) : (
                        <FaExpand
                          size={14}
                          className="group-hover:scale-110 transition-transform"
                        />
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Hide content when minimized */}
        {!minimized && (
          <>
            {/* Messages Container */}
            <div
              ref={chatContainerRef}
              className="flex-grow overflow-y-auto custom-scrollbar p-3 space-y-2.5 min-h-0 scroll-smooth relative"
              style={{
                maxHeight: isExpanded
                  ? "calc(80vh - 120px)"
                  : "calc(min(500px, 50vh) - 120px)",
              }}
            >
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center p-6 rounded-lg bg-[#52B788]/5 border border-[#52B788]/10">
                    <FaLeaf className="text-[#52B788] text-2xl mx-auto mb-2" />
                    <p className="text-[#52B788]/80">
                      Identify a plant to start chatting
                    </p>
                  </div>
                </div>
              ) : (
                messages.map((message, index) => {
                  const isFirstMessageAfterNewPlant =
                    index === 0 &&
                    message.content.includes(
                      "I see you've identified a new plant"
                    );

                  return (
                    <div
                      key={index}
                      className={`message-container ${
                        message.role === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`message ${
                          message.role === "user"
                            ? "user-message"
                            : "assistant-message"
                        } ${
                          isFirstMessageAfterNewPlant ? "new-plant-message" : ""
                        }
                          group hover:shadow-lg hover:shadow-[#52B788]/10 transition-all duration-300`}
                      >
                        <div className="flex items-start gap-2">
                          <div className="message-icon">
                            {message.role === "user" ? (
                              <FaUser className="group-hover:scale-110 transition-transform" />
                            ) : (
                              <FaRobot className="group-hover:scale-110 transition-transform" />
                            )}
                          </div>
                          <div className="flex-grow">
                            <div className="message-content">
                              {message.role === "assistant" ? (
                                renderFormattedMessage(message.content)
                              ) : (
                                <p className="text-white/90 group-hover:text-white transition-colors">
                                  {message.content}
                                </p>
                              )}
                            </div>
                            <div className="message-footer">
                              <div className="message-timestamp group-hover:text-white/70 transition-colors">
                                {new Date(message.timestamp).toLocaleTimeString(
                                  [],
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </div>
                              {message.role === "assistant" && (
                                <div className="message-actions opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() =>
                                      navigator.clipboard.writeText(
                                        message.content
                                      )
                                    }
                                    className="action-button-small group"
                                    title="Copy message"
                                  >
                                    <FaCopy
                                      size={12}
                                      className="group-hover:scale-110 transition-transform"
                                    />
                                  </button>
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => speak(message.content)}
                                      className={`action-button-small group ${
                                        isSpeaking ? "text-[#52B788]" : ""
                                      }`}
                                      title={isSpeaking ? "Stop" : "Read aloud"}
                                    >
                                      {isSpeaking ? (
                                        <FaVolumeMute
                                          size={12}
                                          className="group-hover:scale-110 transition-transform"
                                        />
                                      ) : (
                                        <FaVolumeUp
                                          size={12}
                                          className="group-hover:scale-110 transition-transform"
                                        />
                                      )}
                                    </button>
                                    {isSpeaking && (
                                      <button
                                        onClick={togglePause}
                                        className="action-button-small group"
                                        title={isPaused ? "Resume" : "Pause"}
                                      >
                                        {isPaused ? (
                                          <FaPause
                                            size={12}
                                            className="group-hover:scale-110 transition-transform"
                                          />
                                        ) : (
                                          <FaPlay
                                            size={12}
                                            className="group-hover:scale-110 transition-transform"
                                          />
                                        )}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Overlay when clearing */}
              {isClearing && (
                <div className="absolute inset-0 bg-[#0a0520]/50 flex items-center justify-center z-30 backdrop-blur-sm">
                  <div className="text-[#52B788] animate-bounce">
                    <FaEraser size={24} />
                  </div>
                </div>
              )}

              {/* Typing indicator */}
              {isTyping && (
                <div
                  className="message-container justify-start sticky bottom-16 z-10"
                  id="typing-indicator"
                >
                  <div className="assistant-message shadow-lg bg-[#0a0520]/95 border border-[#52B788]/30">
                    <div className="flex items-start gap-2">
                      <div className="message-icon">
                        <FaRobot />
                      </div>
                      <div className="flex-grow">
                        <div className="whitespace-pre-wrap text-white/90">
                          {typingText}
                        </div>
                        <div className="typing-indicator flex gap-1.5 my-1">
                          <div className="dot w-2 h-2 bg-[#52B788] rounded-full"></div>
                          <div className="dot w-2 h-2 bg-[#52B788] rounded-full"></div>
                          <div className="dot w-2 h-2 bg-[#52B788] rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Error message if one exists */}
              {error && (
                <div className="text-center py-2 px-4 bg-red-500/20 rounded-lg border border-red-500/40 text-white/90 text-sm">
                  Error: {error}
                </div>
              )}

              <div ref={messagesEndRef} className="h-1" />
            </div>

            {/* Input Form */}
            <div className="sticky bottom-0 z-20 bg-[#0a0520]/90 backdrop-blur-md">
              <div className="border-t border-[#52B788]/20 bg-gradient-to-r from-[#0a0520]/90 to-[#130a2a]/90 p-2.5">
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about this plant..."
                    className="chat-input min-h-[36px] text-sm"
                    disabled={loading || !plantInfo}
                    ref={inputRef}
                  />
                  <button
                    type="submit"
                    disabled={loading || !input.trim() || !plantInfo}
                    className={`send-button min-w-[36px] relative overflow-hidden ${
                      !plantInfo ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {loading ? (
                      <FaSpinner className="animate-spin" size={14} />
                    ) : (
                      <FaPaperPlane
                        size={14}
                        className="group-hover:scale-110 transition-transform"
                      />
                    )}
                    <div className="button-shine-effect"></div>
                  </button>
                </form>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}