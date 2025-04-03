import { AccessToken } from 'livekit-server-sdk';

export interface LiveKitTokenOptions {
  userId: string;
  name: string;
  roomName: string;
  ttl?: number; // Time to live in seconds
  canPublish?: boolean;
  canSubscribe?: boolean;
}

export interface CollaborationUser {
  id: string;
  name: string;
  color: string;
  cursor?: {
    position: number;
    updatedAt: number;
  }
}

export const livekitService = {
  /**
   * Generate a LiveKit access token for a user
   */
  generateToken(options: LiveKitTokenOptions): string {
    try {
      const { userId, name, roomName, ttl = 3600, canPublish = true, canSubscribe = true } = options;
      
      // Get API key and secret from environment variables
      const apiKey = process.env.LIVEKIT_API_KEY;
      const apiSecret = process.env.LIVEKIT_API_SECRET;
      
      if (!apiKey || !apiSecret) {
        throw new Error('LiveKit API key or secret not configured');
      }
      
      // Create an access token with the specified options
      const token = new AccessToken(apiKey, apiSecret, {
        identity: userId,
        name: name
      });
      
      // Add permission to join a room
      token.addGrant({
        roomJoin: true,
        room: roomName,
        canPublish,
        canSubscribe,
      });
      
      // Get the signed JWT
      return token.toJwt();
    } catch (error) {
      console.error('Error generating LiveKit token:', error);
      throw error;
    }
  },
  
  /**
   * Get a predefined set of colors for collaborators
   */
  getCollaboratorColors(): string[] {
    return [
      '#FF5733', // Coral red
      '#33A8FF', // Bright blue
      '#33FF57', // Bright green
      '#FF33A8', // Pink
      '#A833FF', // Purple
      '#FFBD33', // Orange
      '#33FFE0', // Teal
      '#FF3366', // Red
      '#4B0082', // Indigo
      '#FFA500', // Orange
      '#8A2BE2', // Blue violet
      '#3CB371', // Medium sea green
    ];
  },
  
  /**
   * Assign a color to a user based on their ID
   */
  assignUserColor(userId: string, existingUsers: CollaborationUser[] = []): string {
    const colors = this.getCollaboratorColors();
    
    // Check if user already has a color
    const existingUser = existingUsers.find(user => user.id === userId);
    if (existingUser) {
      return existingUser.color;
    }
    
    // Get colors already in use
    const usedColors = existingUsers.map(user => user.color);
    
    // Find available colors
    const availableColors = colors.filter(color => !usedColors.includes(color));
    
    if (availableColors.length > 0) {
      // Use first available color
      return availableColors[0];
    } else {
      // If all colors are taken, use a hash of the user ID to pick one
      const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return colors[hash % colors.length];
    }
  }
}; 