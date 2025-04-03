// lib/api.ts
import { Note } from '../models/Note';
import { Folder } from '../models/Folder';

const API_BASE_URL = '/api'; // Adjust this if your API has a different base URL
const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true';

// Mock data
let mockNotes: Note[] = [];
let mockFolders: Folder[] = [];

// Helper function to simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Notes API
export const getNotes = async (): Promise<Note[]> => {
  if (USE_MOCK_API) {
    await delay(500); // Simulate network delay
    return mockNotes;
  }

  const response = await fetch(`${API_BASE_URL}/notes`);
  if (!response.ok) {
    throw new Error('Failed to fetch notes');
  }
  return response.json();
};

export const getNote = async (id: string): Promise<Note | undefined> => {
  if (USE_MOCK_API) {
    await delay(300);
    return mockNotes.find(note => note.id === id);
  }

  const response = await fetch(`${API_BASE_URL}/notes/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch note');
  }
  return response.json();
};

export const saveNote = async (note: Partial<Note>): Promise<Note> => {
  if (USE_MOCK_API) {
    await delay(300);
    if (note.id) {
      const index = mockNotes.findIndex(n => n.id === note.id);
      if (index !== -1) {
        mockNotes[index] = { ...mockNotes[index], ...note } as Note;
        return mockNotes[index];
      }
    }
    const newNote = { ...note, id: Date.now().toString() } as Note;
    mockNotes.push(newNote);
    return newNote;
  }

  const url = note.id ? `${API_BASE_URL}/notes/${note.id}` : `${API_BASE_URL}/notes`;
  const method = note.id ? 'PUT' : 'POST';
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(note),
  });

  if (!response.ok) {
    throw new Error('Failed to save note');
  }
  return response.json();
};

export const deleteNote = async (id: string): Promise<void> => {
  if (USE_MOCK_API) {
    await delay(300);
    mockNotes = mockNotes.filter(note => note.id !== id);
    return;
  }

  const response = await fetch(`${API_BASE_URL}/notes/${id}`, { method: 'DELETE' });
  if (!response.ok) {
    throw new Error('Failed to delete note');
  }
};

// Folders API
export const getFolders = async (): Promise<Folder[]> => {
  if (USE_MOCK_API) {
    await delay(500);
    return mockFolders;
  }

  const response = await fetch(`${API_BASE_URL}/folders`);
  if (!response.ok) {
    throw new Error('Failed to fetch folders');
  }
  return response.json();
};

export const getFolder = async (id: string): Promise<Folder | undefined> => {
  if (USE_MOCK_API) {
    await delay(300);
    return mockFolders.find(folder => folder.id === id);
  }

  const response = await fetch(`${API_BASE_URL}/folders/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch folder');
  }
  return response.json();
};

export const createFolder = async (folder: Omit<Folder, 'id'>): Promise<Folder> => {
  if (USE_MOCK_API) {
    await delay(300);
    const newFolder = { ...folder, id: Date.now().toString() };
    mockFolders.push(newFolder);
    return newFolder;
  }

  const response = await fetch(`${API_BASE_URL}/folders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(folder),
  });

  if (!response.ok) {
    throw new Error('Failed to create folder');
  }
  return response.json();
};
// You can add more API functions here as needed
