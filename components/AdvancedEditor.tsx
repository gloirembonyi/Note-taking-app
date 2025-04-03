// Empty file

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Wand2, Type, Users, Check, X, FileText, Eye, EyeOff, BookOpen, Sparkles, Loader2 } from 'lucide-react';

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
  
  // Refs
  const editorRef = useRef<HTMLTextAreaElement>(null);
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

  // Get AI suggestion
  const getAISuggestion = () => {
    if (!aiEnabled || content.length < 20) {
      setSystemMessage('Please write more content to get AI suggestions');
      return;
    }
    
    setIsGeneratingSuggestion(true);
    setSystemMessage('Generating AI suggestion...');
    
    // Simulate AI suggestion - in a real app, you would call your AI service
    setTimeout(() => {
      // Mock suggestions based on content keywords
      let suggestion = '';
      
      if (content.toLowerCase().includes('meeting')) {
        suggestion = "Consider adding the following points to your meeting notes:\n\n- Key decisions made\n- Action items with owners and deadlines\n- Follow-up meeting date if applicable";
      } else if (content.toLowerCase().includes('idea') || content.toLowerCase().includes('concept')) {
        suggestion = "To develop this idea further, you might want to:\n\n1. Identify the target audience\n2. List potential challenges\n3. Outline next steps for implementation\n4. Consider resource requirements";
      } else {
        suggestion = "Here are some suggestions to enhance your note:\n\n- Add headings to organize your content\n- Include bullet points for key items\n- Consider adding a summary at the end\n- Tag this note with relevant keywords for easier retrieval";
      }
      
      setAiSuggestion(suggestion);
      setIsGeneratingSuggestion(false);
      setSystemMessage('AI suggestion ready');
    }, 1500);
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

  // Handle voice recording simulation
  const toggleVoiceRecording = () => {
    setIsSpeechToText(!isSpeechToText);
    
    if (!isSpeechToText) {
      setSystemMessage('Speech-to-text activated. Speak now...');
      
      // Simulate recording for 3 seconds then add transcription
      setTimeout(() => {
        const transcription = "This is a simulated transcription of speech. In a real app, this would be actual text from your voice input processed by Deepgram or another speech-to-text service.";
        
        const newContent = content ? `${content}\n\n${transcription}` : transcription;
        setContent(newContent);
        setIsSpeechToText(false);
        setSystemMessage('Speech transcription added');
      }, 3000);
    } else {
      setSystemMessage('Speech-to-text stopped');
    }
  };

  // Toggle collaboration (mock)
  const toggleCollaboration = () => {
    setSystemMessage('Real-time collaboration activated. Others can now join this note session.');
  };

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

  return (
    <div className="flex flex-col h-full overflow-hidden border border-gray-200 rounded-lg">
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
            className="p-1.5 rounded-md hover:bg-gray-200"
            title="Enable collaboration"
          >
            <Users size={18} />
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
      </div>
    </div>
  );
}
