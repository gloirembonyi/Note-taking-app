// app/api/speech-to-text/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@deepgram/sdk';

// Configure Deepgram client
const setupDeepgram = () => {
  const apiKey = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY;
  if (!apiKey) {
    throw new Error('NEXT_PUBLIC_DEEPGRAM_API_KEY is not set');
  }
  return createClient(apiKey);
};

export async function POST(request: NextRequest) {
  try {
    // Create Deepgram client
    const deepgram = setupDeepgram();
    
    // Get the form data from the request
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }
    
    // Convert the file to a buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Set transcription options
    const options = {
      smart_format: true,
      model: 'nova-2',
      language: 'en',
      detect_language: true,
      mimetype: audioFile.type
    };
    
    // Send to Deepgram for transcription
    const response = await deepgram.listen.prerecorded.transcribeFile(
      buffer,
      options
    );
    
    // Extract the transcription from the response
    const transcription = response.result?.results?.channels[0]?.alternatives[0]?.transcript;
    
    if (!transcription) {
      return NextResponse.json(
        { error: 'No transcription was generated' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ transcription });
  } catch (error: any) {
    console.error('Speech-to-text error:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}