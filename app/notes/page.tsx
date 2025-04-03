'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Mic, FileText, Save, X, Plus, Search, Tag, Star, StarOff, Trash2, Filter, Download, Upload, Layout, Clock, Calendar } from 'lucide-react';
import Header from '@/components/Header';
import AdvancedEditor from '@/components/AdvancedEditor';

// Note type
interface Note {
  id: string;
  title: string;
  content: string;
  tags?: string[];
  created: string;
  updated: string;
  hasAI?: boolean;
  isFavorite?: boolean;
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [filterBy, setFilterBy] = useState<'all' | 'favorites' | 'recent'>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  
  const router = useRouter();
  const { isSignedIn, user, isLoaded } = useUser();

  // Redirect if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in');
    }
  }, [isSignedIn, isLoaded, router]);

  // Load sample notes or from localStorage
  useEffect(() => {
    setIsLoading(true);
    
    try {
      // In a real app, this would be an API call
      const savedNotes = localStorage.getItem('notes');
      if (savedNotes) {
        setNotes(JSON.parse(savedNotes));
      } else {
        // Sample notes for demo
        const demoNotes: Note[] = [
          {
            id: '1',
            title: 'Welcome to NoteGenius!',
            content: '# Welcome to NoteGenius!\n\nThis is your first note. Start typing to see the AI suggestions at work.\n\n- Create new notes using the + button\n- Format text with the AI assistant\n- Record meetings and let AI transcribe them',
            tags: ['welcome', 'getting-started'],
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            hasAI: true,
            isFavorite: true
          },
          {
            id: '2',
            title: 'Meeting Notes - Project Kickoff',
            content: '# Project Kickoff Meeting\n\n**Date:** Today\n\n## Attendees\n- Sarah (Product)\n- Alex (Engineering)\n- Maya (Design)\n\n## Action Items\n- [ ] Create wireframes by Friday (Maya)\n- [ ] Set up project repository (Alex)\n- [ ] Draft product specs (Sarah)',
            tags: ['meeting', 'project'],
            created: new Date(Date.now() - 86400000).toISOString(), // Yesterday
            updated: new Date(Date.now() - 86400000).toISOString(),
            hasAI: true,
            isFavorite: false
          }
        ];
        
        setNotes(demoNotes);
        localStorage.setItem('notes', JSON.stringify(demoNotes));
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create a new note
  const handleNewNote = () => {
    const newNote: Note = {
      id: Math.random().toString(36).substring(2, 9), // Simple ID generation (use UUID in production)
      title: 'Untitled Note',
      content: '',
      tags: [],
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      hasAI: false,
      isFavorite: false,
    };
    
    const updatedNotes = [newNote, ...notes];
    setNotes(updatedNotes);
    localStorage.setItem('notes', JSON.stringify(updatedNotes));
    setSelectedNote(newNote);
  };

  // Edit note content
  const handleNoteEdit = (content: string) => {
    if (!selectedNote) return;
    
    // Don't update if the content hasn't changed
    if (selectedNote.content === content) return;
    
    const updatedNote = {
      ...selectedNote,
      content,
      updated: new Date().toISOString(),
    };
    
    const updatedNotes = notes.map(note => 
      note.id === selectedNote.id ? updatedNote : note
    );
    
    setNotes(updatedNotes);
    setSelectedNote(updatedNote);
    localStorage.setItem('notes', JSON.stringify(updatedNotes));
  };

  // Edit note title
  const handleTitleEdit = (title: string) => {
    if (!selectedNote) return;
    
    const updatedNote = {
      ...selectedNote,
      title,
      updated: new Date().toISOString(),
    };
    
    const updatedNotes = notes.map(note => 
      note.id === selectedNote.id ? updatedNote : note
    );
    
    setNotes(updatedNotes);
    setSelectedNote(updatedNote);
    localStorage.setItem('notes', JSON.stringify(updatedNotes));
  };

  // Toggle favorite status
  const handleToggleFavorite = (noteId: string) => {
    const updatedNotes = notes.map(note => 
      note.id === noteId 
        ? { ...note, isFavorite: !note.isFavorite } 
        : note
    );
    
    setNotes(updatedNotes);
    
    if (selectedNote?.id === noteId) {
      setSelectedNote({
        ...selectedNote,
        isFavorite: !selectedNote.isFavorite
      });
    }
    
    localStorage.setItem('notes', JSON.stringify(updatedNotes));
  };

  // Delete a note
  const handleDeleteNote = (noteId: string) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    
    const updatedNotes = notes.filter(note => note.id !== noteId);
    setNotes(updatedNotes);
    localStorage.setItem('notes', JSON.stringify(updatedNotes));
    
    if (selectedNote?.id === noteId) {
      setSelectedNote(updatedNotes.length > 0 ? updatedNotes[0] : null);
    }
  };

  // Export note as markdown
  const handleExportNote = () => {
    if (!selectedNote) return;
    
    const filename = `${selectedNote.title.replace(/\s+/g, '-').toLowerCase()}.md`;
    const blob = new Blob([selectedNote.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Filter notes based on search term and filters
  const filteredNotes = notes.filter(note => {
    // Text search
    const matchesSearch = 
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      note.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by category
    if (filterBy === 'all') return matchesSearch;
    if (filterBy === 'favorites') return matchesSearch && note.isFavorite;
    if (filterBy === 'recent') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return matchesSearch && new Date(note.updated) >= oneWeekAgo;
    }
    
    return matchesSearch;
  });

  // Sort notes by updated date (newest first)
  const sortedNotes = [...filteredNotes].sort((a, b) => 
    new Date(b.updated).getTime() - new Date(a.updated).getTime()
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Note list */}
        <div className="w-full md:w-1/3 lg:w-1/4 border-r border-gray-200 bg-white flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">My Notes</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                  className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
                  title={viewMode === 'list' ? 'Grid view' : 'List view'}
                >
                  <Layout size={18} />
                </button>
                
                <div className="relative">
                  <button
                    onClick={() => setShowFilterMenu(!showFilterMenu)}
                    className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
                    title="Filter notes"
                  >
                    <Filter size={18} />
                  </button>
                  
                  {showFilterMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                      <div className="py-1">
                        <button
                          className={`block px-4 py-2 text-sm w-full text-left ${filterBy === 'all' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'}`}
                          onClick={() => {
                            setFilterBy('all');
                            setShowFilterMenu(false);
                          }}
                        >
                          All Notes
                        </button>
                        <button
                          className={`block px-4 py-2 text-sm w-full text-left ${filterBy === 'favorites' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'}`}
                          onClick={() => {
                            setFilterBy('favorites');
                            setShowFilterMenu(false);
                          }}
                        >
                          Favorites
                        </button>
                        <button
                          className={`block px-4 py-2 text-sm w-full text-left ${filterBy === 'recent' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'}`}
                          onClick={() => {
                            setFilterBy('recent');
                            setShowFilterMenu(false);
                          }}
                        >
                          Recent (7 days)
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                <button 
                  onClick={handleNewNote}
                  className="p-2 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition-colors"
                  aria-label="New note"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              {searchTerm && (
                <button
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setSearchTerm('')}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {sortedNotes.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {searchTerm ? 'No notes matching your search' : 'No notes yet'}
              </div>
            ) : (
              <div className={viewMode === 'list' ? "divide-y divide-gray-100" : "grid grid-cols-1 sm:grid-cols-2 gap-2 p-2"}>
                {sortedNotes.map(note => (
                  <div 
                    key={note.id}
                    className={`${
                      viewMode === 'list' 
                        ? `p-4 cursor-pointer ${selectedNote?.id === note.id ? 'bg-indigo-50' : 'hover:bg-gray-50'}`
                        : `p-3 cursor-pointer rounded-lg border ${selectedNote?.id === note.id ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`
                    }`}
                    onClick={() => setSelectedNote(note)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{note.title}</h3>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {note.content.replace(/#{1,6}\s|[*_~`]|\[[^\]]*\]\([^)]*\)/g, '')}
                        </p>
                        {note.tags && note.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {note.tags.slice(0, 3).map(tag => (
                              <span key={tag} className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                                {tag}
                              </span>
                            ))}
                            {note.tags.length > 3 && (
                              <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                                +{note.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end ml-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFavorite(note.id);
                          }}
                          className={`p-1 rounded-full ${note.isFavorite ? 'text-yellow-500 hover:text-yellow-600' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                          {note.isFavorite ? <Star size={16} /> : <StarOff size={16} />}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNote(note.id);
                          }}
                          className="p-1 mt-1 rounded-full text-gray-400 hover:text-red-500"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center text-xs text-gray-500 mt-2">
                      <Clock size={12} className="mr-1" />
                      <span>{new Date(note.updated).toLocaleDateString()}</span>
                      {note.hasAI && (
                        <span className="ml-2 flex items-center text-indigo-500">
                          <Mic size={12} className="mr-1" />
                          AI Enhanced
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Note editor */}
        <div className="hidden md:flex md:w-2/3 lg:w-3/4 flex-col bg-white">
          {selectedNote ? (
            <div className="flex flex-col h-full">
              <div className="border-b border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={selectedNote.title}
                    onChange={(e) => handleTitleEdit(e.target.value)}
                    className="w-full text-xl font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 px-2 py-1 rounded"
                    placeholder="Note title"
                  />
                  <div className="flex space-x-1 ml-2">
                    <button 
                      onClick={handleExportNote}
                      className="p-2 rounded-md text-gray-500 hover:bg-gray-100" 
                      title="Export as Markdown"
                    >
                      <Download size={18} />
                    </button>
                    <button 
                      onClick={() => handleToggleFavorite(selectedNote.id)}
                      className={`p-2 rounded-md ${selectedNote.isFavorite ? 'text-yellow-500' : 'text-gray-500 hover:bg-gray-100'}`}
                      title={selectedNote.isFavorite ? "Remove from favorites" : "Add to favorites"}
                    >
                      {selectedNote.isFavorite ? <Star size={18} /> : <StarOff size={18} />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center text-xs text-gray-500 mt-2">
                  <Calendar size={12} className="mr-1" />
                  <span>Created: {new Date(selectedNote.created).toLocaleDateString()}</span>
                  <Clock size={12} className="ml-3 mr-1" />
                  <span>Updated: {new Date(selectedNote.updated).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                <AdvancedEditor
                  initialContent={selectedNote.content}
                  onContentChange={handleNoteEdit}
                  noteId={selectedNote.id}
                  user={{ id: user?.id || 'anonymous' }}
                />
              </div>
              <div className="p-4 border-t border-gray-200 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <button className="p-2 rounded-lg hover:bg-gray-100" title="View as plain text">
                    <FileText size={18} />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-gray-100" title="Record audio">
                    <Mic size={18} />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-gray-100" title="Manage tags">
                    <Tag size={18} />
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">Last saved: {new Date(selectedNote.updated).toLocaleTimeString()}</span>
                  <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center">
                    <Save size={16} className="mr-2" />
                    Save
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-8 max-w-md">
                <FileText size={64} className="mx-auto text-gray-300 mb-6" />
                <h2 className="text-2xl font-semibold text-gray-800 mb-3">No Note Selected</h2>
                <p className="text-gray-500 mb-6">Select a note from the sidebar or create a new one to get started with NoteGenius's powerful features.</p>
                <button
                  onClick={handleNewNote}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md flex items-center mx-auto"
                >
                  <Plus size={20} className="mr-2" />
                  Create New Note
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 