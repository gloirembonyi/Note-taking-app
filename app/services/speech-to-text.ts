import { createClient } from '@deepgram/sdk';

// Check if Deepgram API key is available
const DEEPGRAM_API_KEY = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY || '';

// Initialize the Deepgram client
let deepgramClient: any;

if (DEEPGRAM_API_KEY) {
  try {
    deepgramClient = createClient(DEEPGRAM_API_KEY);
  } catch (error) {
    console.error('Failed to initialize Deepgram client:', error);
  }
}

interface TranscriptionOptions {
  audioData: Blob;
  language?: string;
  detectSpeakers?: boolean;
  smartFormatting?: boolean;
  model?: 'nova' | 'enhanced';
}

export interface TranscriptionResult {
  text: string;
  confidence: number;
  speakers?: {
    speaker: string;
    text: string;
    startTime: number;
    endTime: number;
  }[];
  error?: string;
}

/**
 * Transcribe audio data using Deepgram
 */
export async function transcribeAudio({
  audioData,
  language = 'en',
  detectSpeakers = false,
  smartFormatting = true,
  model = 'nova',
}: TranscriptionOptions): Promise<TranscriptionResult> {
  try {
    if (!deepgramClient) {
      console.warn('Deepgram client not initialized. Using mock transcription.');
      return mockTranscription(audioData);
    }

    // Convert Blob to ArrayBuffer
    const arrayBuffer = await audioData.arrayBuffer();
    
    // Prepare Deepgram options
    const options = {
      language,
      model,
      smart_format: smartFormatting,
      diarize: detectSpeakers,
    };
    
    // Send to Deepgram for transcription
    const response = await deepgramClient.listen.prerecorded.transcribeFile(
      new Uint8Array(arrayBuffer),
      options
    );
    
    // Parse the response
    const { results } = response;
    
    if (!results || !results.channels || results.channels.length === 0) {
      throw new Error('No transcription results returned from Deepgram');
    }
    
    const transcript = results.channels[0].alternatives[0];
    
    // Format response
    const result: TranscriptionResult = {
      text: transcript.transcript,
      confidence: transcript.confidence,
    };
    
    // Add speaker diarization if available
    if (detectSpeakers && transcript.words && transcript.words.length > 0) {
      const speakerSegments = transcript.words
        .filter((word: any) => word.speaker !== undefined)
        .reduce((acc: any[], word: any, index: number, words: any[]) => {
          const lastItem = acc[acc.length - 1];
          
          if (lastItem && lastItem.speaker === word.speaker) {
            // Append to the current speaker's segment
            lastItem.text += ` ${word.word}`;
            lastItem.endTime = word.end;
          } else {
            // Start a new speaker segment
            acc.push({
              speaker: `Speaker ${word.speaker}`,
              text: word.word,
              startTime: word.start,
              endTime: word.end
            });
          }
          
          return acc;
        }, []);
      
      result.speakers = speakerSegments;
    }
    
    return result;
  } catch (error) {
    console.error('Transcription error:', error);
    
    // Fall back to mock transcription in case of error
    return {
      ...mockTranscription(audioData),
      error: error instanceof Error ? error.message : 'Unknown transcription error'
    };
  }
}

/**
 * Returns mock transcription data for testing without API
 */
function mockTranscription(audioData: Blob): TranscriptionResult {
  const mockDuration = audioData.size / 10000; // Rough estimate of audio duration
  const mockResult: TranscriptionResult = {
    text: 'This is a mock transcription. In production, this would be the actual transcribed text from your audio recording. Please set up your Deepgram API key in the environment variables to enable real transcription.',
    confidence: 0.95,
  };
  
  // Add mock speaker diarization if the blob is large enough
  if (audioData.size > 50000) {
    mockResult.speakers = [
      {
        speaker: 'Speaker 0',
        text: 'This is a mock transcription.',
        startTime: 0,
        endTime: mockDuration * 0.3,
      },
      {
        speaker: 'Speaker 1',
        text: 'In production, this would be the actual transcribed text from your audio recording.',
        startTime: mockDuration * 0.35,
        endTime: mockDuration * 0.8,
      },
      {
        speaker: 'Speaker 0',
        text: 'Please set up your Deepgram API key in the environment variables to enable real transcription.',
        startTime: mockDuration * 0.85,
        endTime: mockDuration,
      },
    ];
  }
  
  return mockResult;
}

/**
 * Starts a microphone recording session
 */
export function startRecording(): Promise<MediaRecorder> {
  return new Promise((resolve, reject) => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        const mediaRecorder = new MediaRecorder(stream);
        const audioChunks: BlobPart[] = [];
        
        mediaRecorder.addEventListener('dataavailable', (event) => {
          audioChunks.push(event.data);
        });
        
        mediaRecorder.addEventListener('stop', () => {
          // Close the microphone stream
          stream.getTracks().forEach((track) => track.stop());
        });
        
        mediaRecorder.start();
        resolve(mediaRecorder);
      })
      .catch((err) => {
        reject(new Error(`Microphone access denied: ${err.message}`));
      });
  });
}

/**
 * Stops recording and returns the audio data
 */
export function stopRecording(mediaRecorder: MediaRecorder): Promise<Blob> {
  return new Promise((resolve) => {
    const audioChunks: BlobPart[] = [];
    
    const onDataAvailable = (event: BlobEvent) => {
      audioChunks.push(event.data);
    };
    
    const onStop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
      mediaRecorder.removeEventListener('dataavailable', onDataAvailable);
      mediaRecorder.removeEventListener('stop', onStop);
      resolve(audioBlob);
    };
    
    mediaRecorder.addEventListener('dataavailable', onDataAvailable);
    mediaRecorder.addEventListener('stop', onStop);
    
    mediaRecorder.stop();
  });
} 