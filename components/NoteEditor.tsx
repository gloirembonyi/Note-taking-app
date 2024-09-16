//component/NoteEditor.tsx

"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Note } from '@/models/Note';
import { saveNote } from '@/lib/api';
import { Button, TextArea, Spinner } from '@/components/ui/core';
import { Mic, StopCircle, Save } from 'lucide-react';

interface NoteEditorProps {
  note?: Note | null;
  onSave: (savedNote: Note) => void; // Accept an onSave prop
}

const NoteEditor: React.FC<NoteEditorProps> = ({ note, onSave }) => {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
    }
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [note, audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        convertSpeechToText(audioBlob);
      };

      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
    }
  };

  const convertSpeechToText = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);

      const response = await fetch('/api/speech-to-text', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Speech to text conversion failed');

      const { text } = await response.json();
      await formatTextWithAI(text);
    } catch (error) {
      console.error('Error in speech to text conversion:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTextWithAI = async (text: string) => {
    try {
      const response = await fetch('/api/format-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) throw new Error('Text formatting failed');

      const { formattedText } = await response.json();
      setContent((prevContent) => prevContent + '\n\n' + formattedText);
    } catch (error) {
      console.error('Error in AI text formatting:', error);
    }
  };

const handleSave = async () => {
  if (!title.trim()) {
    alert('Please enter a title for your note.');
    return;
  }

  try {
    const savedNote = await saveNote({ id: note?.id, title, content });
    onSave(savedNote);
    router.push('/notes');
  } catch (error) {
    console.error('Error saving note:', error);
  }
};

  return (
    <div className="space-y-4">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Note Title"
        className="w-full p-2 text-lg font-semibold border rounded"
      />
      <TextArea
        value={content}
        onChange={(e: { target: { value: React.SetStateAction<string>; }; }) => setContent(e.target.value)}
        placeholder="Start typing your note..."
        className="w-full h-64 p-2 border rounded"
      />
      <div className="flex space-x-2">
        <Button onClick={isRecording ? stopRecording : startRecording}>
          {isRecording ? <StopCircle className="mr-2" /> : <Mic className="mr-2" />}
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </Button>
        <Button onClick={handleSave} disabled={isProcessing}>
          <Save className="mr-2" /> Save Note
        </Button>
      </div>
      {isProcessing && (
        <div className="flex items-center justify-center">
          <Spinner className="mr-2" /> Processing audio...
        </div>
      )}
      {audioUrl && (
        <audio controls src={audioUrl} className="w-full mt-4">
          Your browser does not support the audio element.
        </audio>
      )}
    </div>
  );
};

export default NoteEditor;
