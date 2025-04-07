import { useState, useEffect, useCallback, useRef } from 'react';
import { Room, RoomEvent, DataPacket_Kind, RemoteParticipant, ConnectionState } from 'livekit-client';

interface UseCollaborationProps {
  noteId: string;
  userId?: string;
  userName?: string;
  initialContent: string;
  onExternalContentChange: (newContent: string) => void;
}

interface UseCollaborationReturn {
  room: Room | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  collaborators: string[];
  connect: () => Promise<void>;
  disconnect: () => void;
  broadcastContent: (content: string) => void;
}

export function useCollaboration({
  noteId,
  userId,
  userName = 'Anonymous',
  initialContent,
  onExternalContentChange,
}: UseCollaborationProps): UseCollaborationReturn {
  const [room, setRoom] = useState<Room | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collaborators, setCollaborators] = useState<string[]>([]);
  
  // Use refs to avoid issues with stale closures in event listeners
  const contentRef = useRef(initialContent);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Clean up function
  const cleanupRoom = useCallback(() => {
    if (room) {
      room.removeAllListeners();
      room.disconnect();
      setRoom(null);
      setIsConnected(false);
      setCollaborators([]);
    }
  }, [room]);
  
  useEffect(() => {
    return () => {
      cleanupRoom();
    };
  }, [cleanupRoom]);
  
  // Connect to LiveKit room
  const connect = useCallback(async () => {
    if (!noteId || !userId) {
      setError("Note ID and User ID are required for collaboration");
      return;
    }
    
    try {
      setIsConnecting(true);
      setError(null);
      
      // Create room instance
      const newRoom = new Room({
        adaptiveStream: true,
        dynacast: true,
      });
      
      // Set up event listeners
      newRoom.on(RoomEvent.ParticipantConnected, () => {
        updateCollaboratorsList(newRoom);
      });
      
      newRoom.on(RoomEvent.ParticipantDisconnected, () => {
        updateCollaboratorsList(newRoom);
      });
      
      newRoom.on(RoomEvent.DataReceived, (payload: Uint8Array, participant?: RemoteParticipant) => {
        if (!participant) return;
        
        try {
          const decoder = new TextDecoder();
          const data = JSON.parse(decoder.decode(payload));
          
          if (data.type === 'content_update' && data.noteId === noteId) {
            contentRef.current = data.content;
            onExternalContentChange(data.content);
          }
        } catch (e) {
          console.error('Failed to parse collaboration data:', e);
        }
      });
      
      newRoom.on(RoomEvent.Disconnected, () => {
        setIsConnected(false);
        setCollaborators([]);
      });
      
      // Get token from server
      const response = await fetch(`/api/livekit/token?room=${noteId}&userId=${userId}&name=${encodeURIComponent(userName)}`);
      
      if (!response.ok) {
        throw new Error('Failed to get collaboration token');
      }
      
      const { token } = await response.json();
      
      // Connect to room
      await newRoom.connect(process.env.NEXT_PUBLIC_LIVEKIT_URL || 'wss://your-livekit-server.com', token);
      
      // Save room instance
      setRoom(newRoom);
      setIsConnected(newRoom.state === ConnectionState.Connected);
      updateCollaboratorsList(newRoom);
      
      // If there are connected participants, request the current content
      if (newRoom.participants.size > 0) {
        broadcastRequestContent(newRoom, noteId, userId);
      }
    } catch (error: any) {
      console.error('Error connecting to collaboration room:', error);
      setError(error.message || 'Failed to connect to collaboration room');
      cleanupRoom();
    } finally {
      setIsConnecting(false);
    }
  }, [noteId, userId, userName, cleanupRoom, onExternalContentChange]);
  
  // Disconnect from LiveKit room
  const disconnect = useCallback(() => {
    cleanupRoom();
  }, [cleanupRoom]);
  
  // Broadcast content changes to all participants
  const broadcastContent = useCallback((content: string) => {
    if (!room || !room.localParticipant || !isConnected || !noteId || !userId) return;
    
    // Store the current content
    contentRef.current = content;
    
    // Debounce to avoid sending too many updates
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      const data = {
        type: 'content_update',
        noteId,
        userId,
        content,
        timestamp: Date.now(),
      };
      
      const encoder = new TextEncoder();
      const payload = encoder.encode(JSON.stringify(data));
      
      room.localParticipant.publishData(payload, DataPacket_Kind.RELIABLE);
    }, 500);
  }, [room, isConnected, noteId, userId]);
  
  // Request content from other participants
  const broadcastRequestContent = (room: Room, noteId: string, userId: string) => {
    if (!room.localParticipant) return;
    
    const data = {
      type: 'content_request',
      noteId,
      userId,
      timestamp: Date.now(),
    };
    
    const encoder = new TextEncoder();
    const payload = encoder.encode(JSON.stringify(data));
    
    room.localParticipant.publishData(payload, DataPacket_Kind.RELIABLE);
  };
  
  // Update list of collaborators
  const updateCollaboratorsList = (room: Room) => {
    const names: string[] = [];
    
    // Add all remote participants
    room.participants.forEach((participant) => {
      if (participant.name) {
        names.push(participant.name);
      } else {
        names.push(`User ${participant.sid.substring(0, 6)}`);
      }
    });
    
    setCollaborators(names);
  };
  
  return {
    room,
    isConnected,
    isConnecting,
    error,
    collaborators,
    connect,
    disconnect,
    broadcastContent,
  };
} 