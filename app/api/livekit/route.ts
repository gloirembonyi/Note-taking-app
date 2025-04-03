import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';
import { currentUser } from '@clerk/nextjs/server';

// Get the LiveKit API key and secret from environment variables
const apiKey = process.env.LIVEKIT_API_KEY;
const apiSecret = process.env.LIVEKIT_API_SECRET;

export async function POST(req: NextRequest) {
  try {
    // Check if LiveKit credentials are properly configured
    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'LiveKit API credentials not configured' },
        { status: 500 }
      );
    }

    // Check authentication
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse the request body to get room name
    const body = await req.json();
    const { roomName } = body;

    if (!roomName) {
      return NextResponse.json(
        { error: 'Room name is required' },
        { status: 400 }
      );
    }

    // Create a token with the user's identity
    const token = new AccessToken(apiKey, apiSecret, {
      identity: user.id,
      name: user.firstName || 'Anonymous',
    });

    // Add permissions to the token
    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    // Generate the JWT token
    const jwt = token.toJwt();

    // Return the token
    return NextResponse.json({ token: jwt });
  } catch (error) {
    console.error('Error generating LiveKit token:', error);
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    );
  }
} 