import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { room, username } = body;
    
    if (!room || !username) {
      return NextResponse.json(
        { error: 'Room and username are required' },
        { status: 400 }
      );
    }
    
    // Get API key and secret from environment variables
    const apiKey = process.env.LIVEKIT_API_KEY || 'devkey';
    const apiSecret = process.env.LIVEKIT_API_SECRET || 'secret';
    
    // Create a new token
    const token = new AccessToken(apiKey, apiSecret, {
      identity: username,
    });
    
    // Add room access
    token.addGrant({
      roomJoin: true,
      room,
      canPublish: true,
      canSubscribe: true,
    });
    
    // Generate the JWT token
    const jwt = token.toJwt();
    
    return NextResponse.json({ token: jwt });
  } catch (error: any) {
    console.error('Error creating LiveKit token:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create token' },
      { status: 500 }
    );
  }
} 