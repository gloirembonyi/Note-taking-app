// app/api/speech-to-text/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { SpeechClient, protos } from '@google-cloud/speech';

// Initialize the Speech Client
let speechClient: SpeechClient | null = null;

const initializeSpeechClient = () => {
  try {
    // Use environment variable for authentication
    const apiKey = process.env.GOOGLE_SPEECH_API_KEY;
    
    if (!apiKey) {
      throw new Error('Google Speech API key is not configured');
    }
    
    speechClient = new SpeechClient({ 
      credentials: { 
        client_email: 'speech-to-text@project.iam.gserviceaccount.com', // This is a placeholder
        private_key: apiKey 
      }
    });
    
    return speechClient;
  } catch (error) {
    console.error('Error initializing Speech Client:', error);
    throw error;
  }
};

export async function POST(request: NextRequest) {
  try {
    // Get the audio data from the request
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }
    
    // Convert the audio file to a buffer
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
    
    // Initialize the speech client if not already initialized
    if (!speechClient) {
      speechClient = initializeSpeechClient();
    }
    
    // Configure the request
    const config: protos.google.cloud.speech.v1.IRecognitionConfig = {
      encoding: protos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding.LINEAR16,
      sampleRateHertz: 16000,
      languageCode: 'en-US',
      enableAutomaticPunctuation: true,
      model: 'latest_long',
    };
    
    // Create the audio object
    const audio = {
      content: audioBuffer.toString('base64'),
    };
    
    // Perform the speech recognition
    const [response] = await speechClient.recognize({
      config,
      audio,
    });
    
    // Process the results
    const transcription = response.results
      ?.map((result: any) => result.alternatives?.[0]?.transcript)
      .filter(Boolean)
      .join('\n');
    
    if (!transcription) {
      return NextResponse.json({ error: 'No transcription generated' }, { status: 400 });
    }
    
    return NextResponse.json({ text: transcription });
  } catch (error: any) {
    console.error('Speech-to-text error:', error);
    return NextResponse.json(
      { error: error.message || 'Speech-to-text conversion failed' },
      { status: 500 }
    );
  }
}