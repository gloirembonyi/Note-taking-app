'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Wand2, Type, Users, Check, X, FileText, Eye, EyeOff, BookOpen, Sparkles, Loader2, Plus } from 'lucide-react';
import { Room, RoomEvent, RemoteParticipant, DataPacket_Kind } from 'livekit-client';
import { FaCopy, FaPaperPlane } from 'react-icons/fa';

interface AdvancedEditorProps {
  initialContent?: string;
  onContentChange?: (content: string) => void;
  readOnly?: boolean;
  noteId?: string;
  user?: { id: string; name?: string };
}

export default function AdvancedEditor({
  initialContent = '',
  onContentChange,
  readOnly = false,
  noteId,
  user,
}: AdvancedEditorProps) {
  // Basic state
  const [content, setContent] = useState(initialContent);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [systemMessage, setSystemMessage] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState(false);
  const [isSpeechToText, setIsSpeechToText] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
  const [showFormatOptions, setShowFormatOptions] = useState(false);
  
  // AI assistant chat state
  const [showAIChat, setShowAIChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ id: string; role: 'user' | 'assistant'; content: string; timestamp: Date }[]>([]);
  const [userQuestion, setUserQuestion] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  
  // Related content state
  const [relatedImages, setRelatedImages] = useState<Array<{
    src: string;
    title: string;
    thumbnail: string;
    context: string;
    width: number;
    height: number;
  }>>([]);
  const [showRelatedImages, setShowRelatedImages] = useState(false);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [relatedTopics, setRelatedTopics] = useState<string[]>([]);
  const [showRelatedTopics, setShowRelatedTopics] = useState(false);
  const [isGeneratingTopics, setIsGeneratingTopics] = useState(false);
  
  // LiveKit collaboration state
  const [room, setRoom] = useState<Room | null>(null);
  const [isCollaborating, setIsCollaborating] = useState(false);
  const [collaborators, setCollaborators] = useState<string[]>([]);
  
  // Refs
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const initialRenderRef = useRef(true);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize content from props - only when prop changes, not on every content change
  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  // Update parent component when content changes - prevent the circular dependency
  useEffect(() => {
    // Skip the first render to prevent initial infinite loop
    if (initialRenderRef.current) {
      initialRenderRef.current = false;
      return;
    }
    
    // Use a timeout to debounce rapid changes and prevent tight render loops
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      onContentChange?.(content);
      debounceTimerRef.current = null;
    }, 500);
    
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [content, onContentChange]);

  // Toggle AI features
  const toggleAI = () => {
    setAiEnabled(!aiEnabled);
    setSystemMessage(`AI suggestions ${!aiEnabled ? 'enabled' : 'disabled'}`);
  };

  // Get AI suggestion with real API call
  const getAISuggestion = async () => {
    if (!aiEnabled || content.length < 20) {
      setSystemMessage('Please write more content to get AI suggestions');
      return;
    }
    
    setIsGeneratingSuggestion(true);
    setSystemMessage('Generating AI suggestion...');
    
    try {
      // Make a real API call to your backend
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'complete',
          partialContent: content,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get AI suggestion');
      }
      
      const data = await response.json();
      if (data.completion) {
        setAiSuggestion(data.completion);
        setSystemMessage('AI suggestion ready');
      } else if (data.error) {
        setSystemMessage(`Error: ${data.error}`);
      } else {
        setSystemMessage('No suggestion available at this time');
      }
    } catch (error) {
      console.error('Error getting AI suggestion:', error);
      setSystemMessage('Failed to get AI suggestion. Please try again.');
    } finally {
      setIsGeneratingSuggestion(false);
    }
  };

  // Accept AI suggestion
  const acceptSuggestion = () => {
    if (!aiSuggestion) return;
    
    const newContent = `${content}\n\n${aiSuggestion}`;
    setContent(newContent);
    setAiSuggestion('');
    
    // Move cursor to end
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.focus();
        editorRef.current.setSelectionRange(newContent.length, newContent.length);
      }
    }, 0);
  };

  // Reject AI suggestion
  const rejectSuggestion = () => {
    setAiSuggestion('');
    setSystemMessage('AI suggestion dismissed');
  };

  // Format selected text
  const formatSelectedText = (format: string) => {
    if (!editorRef.current) return;
    
    const start = editorRef.current.selectionStart;
    const end = editorRef.current.selectionEnd;
    
    if (start === end) {
      setSystemMessage('Please select some text to format');
      return;
    }
    
    const selectedText = content.substring(start, end);
    let formattedText = selectedText;
    
    // Apply different formatting based on the selected format
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'code':
        formattedText = `\`${selectedText}\``;
        break;
      case 'heading1':
        formattedText = `# ${selectedText}`;
        break;
      case 'heading2':
        formattedText = `## ${selectedText}`;
        break;
      case 'heading3':
        formattedText = `### ${selectedText}`;
        break;
      case 'quote':
        formattedText = `> ${selectedText}`;
        break;
      case 'list':
        formattedText = selectedText
          .split('\n')
          .map(line => `- ${line}`)
          .join('\n');
        break;
      default:
        break;
    }
    
    const newContent = content.substring(0, start) + formattedText + content.substring(end);
    setContent(newContent);
    
    // Set selection to new text
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.focus();
        editorRef.current.setSelectionRange(
          start, 
          start + formattedText.length
        );
      }
    }, 0);
    
    setSystemMessage(`Applied ${format} formatting`);
    setShowFormatOptions(false);
  };

  // Handle voice recording with real Deepgram integration
  const toggleVoiceRecording = async () => {
    setIsSpeechToText(!isSpeechToText);
    
    if (!isSpeechToText) {
      setSystemMessage('Speech-to-text activated. Speak now...');
      
      try {
        // Check if mediaDevices is available (will be undefined in non-secure contexts or server-side)
        if (!navigator.mediaDevices) {
          throw new Error('Audio recording is not supported in this environment. Please use HTTPS or a modern browser.');
        }
        
        // Request microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        const audioChunks: Blob[] = [];
        
        mediaRecorder.addEventListener('dataavailable', (event) => {
          audioChunks.push(event.data);
        });
        
        mediaRecorder.addEventListener('stop', async () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          const formData = new FormData();
          formData.append('audio', audioBlob);
          
          try {
            const response = await fetch('/api/speech-to-text', {
              method: 'POST',
              body: formData,
            });
            
            if (!response.ok) {
              throw new Error('Speech-to-text request failed');
            }
            
            const data = await response.json();
            if (data.transcription) {
              const newContent = content ? `${content}\n\n${data.transcription}` : data.transcription;
              setContent(newContent);
              setSystemMessage('Speech transcription added');
            } else {
              setSystemMessage('No transcription received');
            }
          } catch (error) {
            console.error('Error with speech-to-text:', error);
            setSystemMessage('Failed to transcribe speech. Please try again.');
          }
        });
        
        // Start recording
        mediaRecorder.start();
        
        // Record for 10 seconds then stop
        setTimeout(() => {
          if (mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            stream.getTracks().forEach(track => track.stop());
          }
          setIsSpeechToText(false);
        }, 10000);
      } catch (error) {
        console.error('Error accessing microphone:', error);
        setSystemMessage('Failed to access microphone. Please check permissions.');
        setIsSpeechToText(false);
      }
    } else {
      // User manually stopped recording
      setSystemMessage('Speech-to-text stopped');
    }
  };

  // Connect to LiveKit room
  const connectToLivekitRoom = async () => {
    if (!noteId || !user) {
      setSystemMessage('Cannot enable collaboration without a valid note ID and user');
      return;
    }

    try {
      // Get token from your backend
      const response = await fetch('/api/livekit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          room: `note-${noteId}`,
          username: user.name || user.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get collaboration token');
      }

      const { token } = await response.json();
      
      // Create a new room and connect
      const newRoom = new Room();
      setRoom(newRoom);
      
      // Set up event listeners for participant connect/disconnect
      newRoom.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
        setCollaborators(prev => [...prev, participant.identity]);
        setSystemMessage(`${participant.identity} joined the collaboration`);
      });
      
      newRoom.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
        setCollaborators(prev => prev.filter(id => id !== participant.identity));
        setSystemMessage(`${participant.identity} left the collaboration`);
      });
      
      // Listen for data messages from other participants
      newRoom.on(RoomEvent.DataReceived, (payload: Uint8Array, participant?: RemoteParticipant) => {
        if (!participant) return;
        
        try {
          const data = JSON.parse(new TextDecoder().decode(payload));
          
          if (data.type === 'cursor') {
            // Handle cursor position updates from other participants
            console.log(`${participant.identity} cursor at position ${data.position}`);
          } else if (data.type === 'content') {
            // Handle content updates from other participants
            if (data.content !== content) {
              setContent(data.content);
            }
          }
        } catch (error) {
          console.error('Error parsing data message:', error);
        }
      });
      
      // Connect to the room
      await newRoom.connect(process.env.NEXT_PUBLIC_LIVEKIT_URL || '', token);
      setIsCollaborating(true);
      setSystemMessage('Real-time collaboration activated. Others can now join this note session.');
      
    } catch (error) {
      console.error('Error connecting to LiveKit room:', error);
      setSystemMessage('Failed to start collaboration. Please try again.');
    }
  };
  
  // Send data to the room
  const sendDataToRoom = (type: string, data: any) => {
    if (!room || !isCollaborating) return;
    
    try {
      const message = JSON.stringify({
        type,
        ...data,
      });
      
      const encoder = new TextEncoder();
      const payload = encoder.encode(message);
      room.localParticipant.publishData(payload, DataPacket_Kind.RELIABLE);
    } catch (error) {
      console.error('Error sending data to room:', error);
    }
  };

  // Toggle collaboration
  const toggleCollaboration = () => {
    if (isCollaborating) {
      // Disconnect from room
      if (room) {
        room.disconnect();
        setRoom(null);
      }
      setIsCollaborating(false);
      setCollaborators([]);
      setSystemMessage('Collaboration ended');
    } else {
      // Connect to room
      connectToLivekitRoom();
    }
  };
  
  // Clean up LiveKit connection when component unmounts
  useEffect(() => {
    return () => {
      if (room) {
        room.disconnect();
      }
    };
  }, [room]);
  
  // Send cursor position updates when collaborating
  useEffect(() => {
    if (isCollaborating && editorRef.current && !previewMode) {
      const handleSelectionChange = () => {
        if (editorRef.current) {
          sendDataToRoom('cursor', { position: editorRef.current.selectionStart });
        }
      };
      
      editorRef.current.addEventListener('select', handleSelectionChange);
      return () => {
        if (editorRef.current) {
          editorRef.current.removeEventListener('select', handleSelectionChange);
        }
      };
    }
  }, [isCollaborating, previewMode]);
  
  // Send content updates when collaborating
  useEffect(() => {
    if (isCollaborating && !initialRenderRef.current) {
      const sendContentUpdate = () => {
        sendDataToRoom('content', { content });
      };
      
      const timeout = setTimeout(sendContentUpdate, 500);
      return () => clearTimeout(timeout);
    }
  }, [content, isCollaborating]);

  // Handle content changes
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  // Simple markdown to HTML conversion
  const renderMarkdown = (markdownText: string) => {
    if (!markdownText) return '';
    
    let html = markdownText;
    
    // Convert headers
    html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
    html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
    
    // Convert bold and italic
    html = html.replace(/\*\*(.*?)\*\*/gm, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/gm, '<em>$1</em>');
    
    // Convert lists
    html = html.replace(/^\- (.*$)/gm, '<li>$1</li>');
    html = html.replace(/<li>(.*)<\/li>/gm, '<ul><li>$1</li></ul>');
    
    // Convert code
    html = html.replace(/`(.*?)`/gm, '<code>$1</code>');
    
    // Convert links
    html = html.replace(/\[(.*?)\]\((.*?)\)/gm, '<a href="$2">$1</a>');
    
    // Convert paragraphs
    html = html.replace(/^(?!<[h|u|l|c])(.*$)/gm, '<p>$1</p>');
    
    // Fix empty lines
    html = html.replace(/<p><\/p>/gm, '<br>');
    
    return html;
  };

  // Get related images based on content
  const getRelatedImages = async () => {
    if (content.length < 20) {
      setSystemMessage('Please write more content to find related images');
      return;
    }
    
    setIsLoadingImages(true);
    setShowRelatedImages(true);
    
    try {
      // Extract main topic from content
      const firstParagraph = content.split('\n')[0].trim();
      const topic = firstParagraph.length > 10 ? firstParagraph : content.substring(0, 100);
      
      const response = await fetch(`/api/related-images?query=${encodeURIComponent(topic)}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch related images');
      }
      
      const data = await response.json();
      if (data.images && Array.isArray(data.images)) {
        setRelatedImages(data.images);
        setSystemMessage(`Found ${data.images.length} related images`);
      } else {
        setSystemMessage('No related images found');
      }
    } catch (error) {
      console.error('Error fetching related images:', error);
      setSystemMessage('Failed to get related images. Please try again.');
    } finally {
      setIsLoadingImages(false);
    }
  };
  
  // Generate related topics based on content
  const generateRelatedTopics = async () => {
    if (content.length < 20) {
      setSystemMessage('Please write more content to generate related topics');
      return;
    }
    
    setIsGeneratingTopics(true);
    setShowRelatedTopics(true);
    
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'find-related-topics',
          content: content,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate related topics');
      }
      
      const data = await response.json();
      if (data.relatedTopics) {
        setRelatedTopics(data.relatedTopics);
        setSystemMessage('Related topics generated');
      } else {
        setSystemMessage('No related topics found');
      }
    } catch (error) {
      console.error('Error generating related topics:', error);
      setSystemMessage('Failed to generate related topics. Please try again.');
    } finally {
      setIsGeneratingTopics(false);
    }
  };
  
  // Send a question to the AI about the current note content
  const sendQuestionToAI = async () => {
    if (!userQuestion.trim()) {
      return;
    }
    
    // Create a unique ID for this message to help with deduplication
    const messageId = Date.now().toString();
    
    const newMessage = {
      id: messageId,
      role: 'user' as const,
      content: userQuestion,
      timestamp: new Date(),
    };
    
    // Save the current question before clearing the input
    const currentQuestion = userQuestion;
    
    // Update state in this specific order to avoid React batch update issues
    setUserQuestion(''); // Clear input first
    setChatMessages(prev => [...prev.filter(msg => msg.id !== messageId), newMessage]); // Ensure no duplicates
    setIsSendingMessage(true);
    
    try {
      console.log("Sending question to AI:", currentQuestion);
      
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'answer-question',
          content: content,
          question: currentQuestion,
        }),
      });
      
      const data = await response.json();
      console.log("AI response:", data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get answer from AI');
      }
      
      // Create a unique ID for this response
      const responseId = Date.now().toString();
      
      // Ensure we're getting a string from the data.answer
      let answerText = 'I couldn\'t generate an answer at this time.';
      if (data && data.answer) {
        // Handle cases where answer might be an object instead of a string
        if (typeof data.answer === 'object') {
          // Try to extract text from the answer object
          if (data.answer.text) {
            answerText = data.answer.text;
          } else if (data.answer.content) {
            answerText = data.answer.content;
          } else {
            // If we can't find a text property, stringify the object
            try {
              answerText = JSON.stringify(data.answer);
            } catch (e) {
              console.error('Error stringifying AI response:', e);
            }
          }
        } else {
          // If it's already a string, use it directly
          answerText = data.answer;
        }
      }
      
      const aiResponse = {
        id: responseId,
        role: 'assistant' as const,
        content: answerText,
        timestamp: new Date(),
      };
      
      // Add the AI response to chat messages, ensuring deduplication
      setChatMessages(prev => [...prev.filter(msg => msg.id !== responseId), aiResponse]);
    } catch (error) {
      console.error('Error getting AI answer:', error);
      
      const errorMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant' as const,
        content: 'Sorry, I encountered an error while processing your question. Please try again.',
        timestamp: new Date(),
      };
      
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSendingMessage(false);
      
      // Scroll to bottom of chat
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 100);
    }
  };
  
  // Add a related topic to the note
  const addRelatedTopicToNote = (topic: string) => {
    const topicText = `\n\n## ${topic}`;
    const newContent = `${content}${topicText}`;
    setContent(newContent);
    setSystemMessage(`Added "${topic}" section to note`);
  };
  
  // Toggle AI chat panel
  const toggleAIChat = () => {
    setShowAIChat(!showAIChat);
    if (!showAIChat && chatMessages.length === 0) {
      const welcomeMessage = {
        id: 'welcome',
        role: 'assistant' as const,
        content: 'Hi there! I\'m your note assistant. You can ask me questions about your note, and I\'ll do my best to help.',
        timestamp: new Date(),
      };
      setChatMessages([welcomeMessage]);
    }
    
    // Focus on input when chat opens
    setTimeout(() => {
      if (chatInputRef.current) {
        chatInputRef.current.focus();
      }
    }, 100);
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Check for Ctrl+/ to toggle AI chat
    if (e.ctrlKey && e.key === '/') {
      e.preventDefault();
      toggleAIChat();
    }
    
    // Check for Alt+R to find related images
    if (e.altKey && e.key === 'r') {
      e.preventDefault();
      getRelatedImages();
    }
    
    // Check for Alt+T to find related topics
    if (e.altKey && e.key === 't') {
      e.preventDefault();
      generateRelatedTopics();
    }
    
    // In AI chat: Enter to send, Escape to close
    if (showAIChat) {
      if (e.key === 'Enter' && !e.shiftKey && document.activeElement === chatInputRef.current) {
        e.preventDefault();
        sendQuestionToAI();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowAIChat(false);
      }
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden border border-gray-200 rounded-lg" onKeyDown={handleKeyDown}>
      {/* Toolbar */}
      <div className="flex items-center p-2 border-b border-gray-200 bg-gray-50">
        <div className="flex space-x-1">
          <button
            onClick={toggleAI}
            className={`p-1.5 rounded-md ${aiEnabled ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-200'}`}
            title={aiEnabled ? 'Disable AI suggestions' : 'Enable AI suggestions'}
          >
            <Wand2 size={18} />
          </button>
          
          <div className="relative">
            <button
              onClick={() => setShowFormatOptions(!showFormatOptions)}
              className="p-1.5 rounded-md hover:bg-gray-200"
              title="Format text"
            >
              <Type size={18} />
            </button>
            
            {showFormatOptions && (
              <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 border border-gray-200">
                <div className="py-1">
                  <button
                    className="flex items-center px-4 py-2 text-sm w-full text-left text-gray-700 hover:bg-gray-100"
                    onClick={() => formatSelectedText('bold')}
                  >
                    <strong className="mr-2">B</strong> Bold
                  </button>
                  <button
                    className="flex items-center px-4 py-2 text-sm w-full text-left text-gray-700 hover:bg-gray-100"
                    onClick={() => formatSelectedText('italic')}
                  >
                    <em className="mr-2">I</em> Italic
                  </button>
                  <button
                    className="flex items-center px-4 py-2 text-sm w-full text-left text-gray-700 hover:bg-gray-100"
                    onClick={() => formatSelectedText('code')}
                  >
                    <code className="mr-2 px-1 bg-gray-100 rounded">{"{ }"}</code> Code
                  </button>
                  <button
                    className="flex items-center px-4 py-2 text-sm w-full text-left text-gray-700 hover:bg-gray-100"
                    onClick={() => formatSelectedText('heading1')}
                  >
                    <span className="mr-2 font-bold text-lg">#</span> Heading 1
                  </button>
                  <button
                    className="flex items-center px-4 py-2 text-sm w-full text-left text-gray-700 hover:bg-gray-100"
                    onClick={() => formatSelectedText('heading2')}
                  >
                    <span className="mr-2 font-bold text-base">##</span> Heading 2
                  </button>
                  <button
                    className="flex items-center px-4 py-2 text-sm w-full text-left text-gray-700 hover:bg-gray-100"
                    onClick={() => formatSelectedText('list')}
                  >
                    <span className="mr-2">•</span> List
                  </button>
                  <button
                    className="flex items-center px-4 py-2 text-sm w-full text-left text-gray-700 hover:bg-gray-100"
                    onClick={() => formatSelectedText('quote')}
                  >
                    <span className="mr-2 text-gray-400">›</span> Quote
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <button
            onClick={toggleVoiceRecording}
            className={`p-1.5 rounded-md ${isSpeechToText ? 'bg-red-100 text-red-600' : 'hover:bg-gray-200'}`}
            title={isSpeechToText ? 'Stop recording' : 'Start recording'}
          >
            {isSpeechToText ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          
          <button
            onClick={toggleCollaboration}
            className={`p-1.5 rounded-md ${isCollaborating ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200'}`}
            title={isCollaborating ? 'Stop collaboration' : 'Enable collaboration'}
          >
            <Users size={18} />
          </button>
          
          <button
            onClick={toggleAIChat}
            className={`p-1.5 rounded-md ${showAIChat ? 'bg-purple-100 text-purple-600' : 'hover:bg-gray-200'}`}
            title="AI Chat Assistant"
          >
            <BookOpen size={18} />
          </button>
          
          <button
            onClick={getRelatedImages}
            className={`p-1.5 rounded-md ${showRelatedImages ? 'bg-green-100 text-green-600' : 'hover:bg-gray-200'}`}
            title="Find related images"
          >
            <FileText size={18} />
          </button>
          
          <button
            onClick={generateRelatedTopics}
            className={`p-1.5 rounded-md ${showRelatedTopics ? 'bg-yellow-100 text-yellow-600' : 'hover:bg-gray-200'}`}
            title="Generate related topics"
          >
            <Sparkles size={18} />
          </button>
          
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`p-1.5 rounded-md ${previewMode ? 'bg-green-100 text-green-700' : 'hover:bg-gray-200'}`}
            title={previewMode ? 'Edit mode' : 'Preview mode'}
          >
            {previewMode ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
          
          {aiEnabled && content.length > 20 && (
            <button
              onClick={getAISuggestion}
              className="p-1.5 rounded-md hover:bg-gray-200 text-indigo-600"
              title="Get AI suggestions"
              disabled={isGeneratingSuggestion}
            >
              {isGeneratingSuggestion ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            </button>
          )}
        </div>
        
        <div className="ml-auto">
          {systemMessage && (
            <span className="text-sm text-gray-600 px-2 py-1 bg-gray-100 rounded-md">
              {systemMessage}
            </span>
          )}
        </div>
      </div>
      
      {/* Editor */}
      <div className="flex-1 relative overflow-hidden">
        <div className="flex h-full">
          {/* Main editor area */}
          <div className="flex-1 relative">
            {previewMode ? (
              <div 
                className="w-full h-full p-4 overflow-y-auto prose prose-indigo max-w-none"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
              />
            ) : (
              <textarea
                ref={editorRef}
                value={content}
                onChange={handleContentChange}
                className="w-full h-full p-4 resize-none focus:outline-none font-mono text-gray-800"
                placeholder="Start typing your note here..."
                readOnly={readOnly || isSpeechToText}
              />
            )}
          </div>
          
          {/* Related images panel */}
          {showRelatedImages && (
            <div className="w-1/4 min-w-[250px] border-l border-gray-200 p-3 overflow-y-auto">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium text-gray-700">Related Images</h3>
                <button 
                  onClick={() => setShowRelatedImages(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={16} />
                </button>
              </div>
              
              {isLoadingImages ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 size={24} className="animate-spin text-indigo-500" />
                </div>
              ) : relatedImages.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {relatedImages.map((image, index) => (
                    <div key={index} className="relative group cursor-pointer">
                      <a href={image.context} target="_blank" rel="noopener noreferrer" className="block">
                        <img 
                          src={image.thumbnail || image.src} 
                          alt={image.title || `Related image ${index + 1}`}
                          className="rounded-md w-full h-[120px] object-cover"
                          onError={(e) => {
                            // Fallback if image fails to load
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Image+Error';
                          }}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <div className="flex space-x-1">
                            <button 
                              className="bg-white p-1.5 rounded-full"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                navigator.clipboard.writeText(`![${image.title || 'Related image'}](${image.src})`);
                                setSystemMessage('Image markdown copied to clipboard');
                              }}
                              title="Copy markdown image link"
                            >
                              <FaCopy size={12} />
                            </button>
                            <button
                              className="bg-white p-1.5 rounded-full"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const imageMarkdown = `![${image.title || 'Related image'}](${image.src})`;
                                const newContent = `${content}\n\n${imageMarkdown}`;
                                setContent(newContent);
                                setSystemMessage('Image added to note');
                              }}
                              title="Add image to note"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        </div>
                      </a>
                      <p className="text-xs text-gray-600 mt-1 truncate">{image.title || `Image ${index + 1}`}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No images found. Try updating your note content.</p>
              )}
            </div>
          )}
          
          {/* Related topics panel */}
          {showRelatedTopics && (
            <div className="w-1/4 min-w-[250px] border-l border-gray-200 p-3 overflow-y-auto">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium text-gray-700">Related Topics</h3>
                <button 
                  onClick={() => setShowRelatedTopics(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={16} />
                </button>
              </div>
              
              {isGeneratingTopics ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 size={24} className="animate-spin text-indigo-500" />
                </div>
              ) : relatedTopics.length > 0 ? (
                <div className="space-y-2">
                  {relatedTopics.map((topic, index) => (
                    <div key={index} className="p-2 bg-gray-50 rounded-md hover:bg-gray-100">
                      <p className="text-sm font-medium">{topic}</p>
                      <div className="flex justify-end mt-1">
                        <button
                          onClick={() => addRelatedTopicToNote(topic)}
                          className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-100"
                        >
                          Add to note
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No related topics found. Try updating your note content.</p>
              )}
            </div>
          )}
          
          {/* AI Chat panel */}
          {showAIChat && (
            <div className="w-1/3 min-w-[300px] border-l border-gray-200 flex flex-col h-full">
              <div className="p-2 border-b border-gray-200 flex justify-between items-center bg-indigo-50">
                <h3 className="font-medium text-indigo-700">AI Assistant</h3>
                <button 
                  onClick={() => setShowAIChat(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={16} />
                </button>
              </div>
              
              <div 
                ref={chatContainerRef}
                className="flex-1 p-3 overflow-y-auto space-y-4"
              >
                {chatMessages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[80%] p-3 rounded-lg ${
                        msg.role === 'user' 
                          ? 'bg-indigo-500 text-white' 
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p className="text-xs mt-1 opacity-70">
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                
                {isSendingMessage && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 p-3 rounded-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Show a message if chat is empty */}
                {chatMessages.length === 0 && !isSendingMessage && (
                  <div className="flex justify-center items-center h-full">
                    <div className="text-center text-gray-500 p-4">
                      <BookOpen size={24} className="mx-auto mb-2 opacity-50" />
                      <p>Ask me a question about your note!</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-2 border-t border-gray-200">
                <div className="flex">
                  <input
                    ref={chatInputRef}
                    type="text"
                    value={userQuestion}
                    onChange={(e) => setUserQuestion(e.target.value)}
                    placeholder="Ask about your note..."
                    className="flex-1 p-2 border border-gray-300 rounded-l-md focus:outline-none focus:border-indigo-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendQuestionToAI();
                      }
                    }}
                    disabled={isSendingMessage}
                  />
                  <button
                    onClick={sendQuestionToAI}
                    disabled={isSendingMessage || !userQuestion.trim()}
                    className="p-2 bg-indigo-500 text-white rounded-r-md disabled:bg-indigo-300"
                  >
                    {isSendingMessage ? <Loader2 size={18} className="animate-spin" /> : <FaPaperPlane size={16} />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Press Enter to send, Shift+Enter for new line. Ctrl+/ to toggle chat.
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* AI Suggestion Panel */}
        {aiSuggestion && (
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center text-indigo-600">
                <Wand2 size={16} className="mr-2" />
                <span className="font-medium">AI Suggestion</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={acceptSuggestion}
                  className="p-1.5 bg-green-100 text-green-700 rounded-md hover:bg-green-200 flex items-center"
                  title="Accept suggestion"
                >
                  <Check size={16} className="mr-1" />
                  Apply
                </button>
                
                <button
                  onClick={rejectSuggestion}
                  className="p-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center"
                  title="Reject suggestion"
                >
                  <X size={16} className="mr-1" />
                  Dismiss
                </button>
              </div>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-gray-700 max-h-40 overflow-y-auto font-mono text-sm">
              {aiSuggestion}
            </div>
          </div>
        )}
        
        {/* Speech-to-text indicator */}
        {isSpeechToText && (
          <div className="absolute bottom-4 right-4 bg-red-600 text-white px-3 py-2 rounded-full flex items-center animate-pulse">
            <Mic size={16} className="mr-2" />
            Recording...
          </div>
        )}
        
        {/* Collaboration indicator */}
        {isCollaborating && collaborators.length > 0 && (
          <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-2 rounded-full">
            <span className="flex items-center">
              <Users size={16} className="mr-2" />
              {collaborators.length} collaborator{collaborators.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
