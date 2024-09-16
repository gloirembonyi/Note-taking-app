// app/api/speech-to-text/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Readable } from 'stream';
import speech from '@google-cloud/speech';

const client = new speech.SpeechClient();

export async function POST(req: NextRequest) {
  if (!req.body) {
    return NextResponse.json({ error: 'No audio file received' }, { status: 400 });
  }

  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as Blob;

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file found in form data' }, { status: 400 });
    }

    const buffer = Buffer.from(await audioFile.arrayBuffer());
    const audioBytes = buffer.toString('base64');

    const audio = {
      content: audioBytes,
    };
    const config = {
      encoding: 'LINEAR16' as const,
      sampleRateHertz: 16000,
      languageCode: 'en-US',
    };
    const request = {
      audio: audio,
      config: config,
    };

    const [response] = await client.recognize(request);
    const transcription = response.results
      ?.map(result => result.alternatives?.[0].transcript)
      .join('\n');

    return NextResponse.json({ text: transcription });
  } catch (error) {
    console.error('Error in speech to text conversion:', error);
    return NextResponse.json({ error: 'Speech to text conversion failed' }, { status: 500 });
  }
}