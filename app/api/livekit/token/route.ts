import { AccessToken } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';

// Remove the NextAuth import for now since we're not enforcing authentication
// import { getServerSession } from 'next-auth';
// import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const url = new URL(request.url);
    const room = url.searchParams.get('room');
    const userId = url.searchParams.get('userId');
    const name = url.searchParams.get('name') || 'Anonymous';
    
    // Validate required parameters
    if (!room) {
      return NextResponse.json({ error: 'Room parameter is required' }, { status: 400 });
    }
    
    if (!userId) {
      return NextResponse.json({ error: 'UserId parameter is required' }, { status: 400 });
    }
    
    // Create a new token
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    
    if (!apiKey || !apiSecret) {
      console.error('LiveKit API key or secret is missing');
      return NextResponse.json(
        { error: 'LiveKit is not properly configured on the server' },
        { status: 500 }
      );
    }
    
    // For this example, we'll allow collaboration without authentication
    // Uncomment this code when you implement authentication
    /*
    const session = await getServerSession(authOptions);
    const isAuthenticated = !!session?.user;
    
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    */
    
    // Create token with identity
    const at = new AccessToken(apiKey, apiSecret, {
      identity: userId,
      name: name,
    });
    
    // Add permissions based on the room and user
    at.addGrant({ 
      roomJoin: true, 
      room, 
      canPublish: true, 
      canSubscribe: true,
      canPublishData: true 
    });
    
    // Generate JWT token
    const token = at.toJwt();
    
    // Return token to client
    return NextResponse.json({ token });
  } catch (error: any) {
    console.error('Error generating LiveKit token:', error);
    return NextResponse.json(
      { error: 'Failed to generate collaboration token: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
} 