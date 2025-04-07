// components/NoteList.tsx

"use client"
import React, { useState } from 'react'
import Link from 'next/link'
import { Note } from '@/models/Note'
import { FileText, Star, Trash2, Edit, Clock, Filter, Search } from 'lucide-react'

interface NoteListProps {
  notes: Note[]
  onDelete: (id: string) => void
}

const NoteList: React.FC<NoteListProps> = ({ notes, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'title'>('date')
  const [showFilters, setShowFilters] = useState(false)
  
  // Get a truncated preview of the note content
  const getContentPreview = (content: string, maxLength = 120) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }
  
  // Handle search and sorting
  const filteredNotes = notes
    .filter(note => 
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      note.content.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title)
      } else {
        // Assuming IDs are somewhat time-based, higher ID = newer note
        return b.id.localeCompare(a.id)
      }
    })

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">My Notes</h2>
        <Link 
          href="/notes/new" 
          className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg transition duration-200 flex items-center"
        >
          <Edit className="w-4 h-4 mr-2" />
          New Note
        </Link>
      </div>
      
      <div className="mb-4">
        <div className="flex items-center relative">
          <input
            type="text"
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full py-2 px-4 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <Search className="w-5 h-5 text-gray-400 absolute right-3" />
        </div>
      </div>
      
      <div className="flex justify-between items-center mb-4">
        <button 
          onClick={() => setShowFilters(!showFilters)} 
          className="flex items-center text-sm text-gray-600 hover:text-indigo-600"
        >
          <Filter className="w-4 h-4 mr-1" />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
        
        {showFilters && (
          <div className="flex space-x-2">
            <button 
              onClick={() => setSortBy('date')} 
              className={`px-3 py-1 text-sm rounded-md flex items-center ${sortBy === 'date' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'}`}
            >
              <Clock className="w-3 h-3 mr-1" />
              Date
            </button>
            <button 
              onClick={() => setSortBy('title')} 
              className={`px-3 py-1 text-sm rounded-md flex items-center ${sortBy === 'title' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'}`}
            >
              <FileText className="w-3 h-3 mr-1" />
              Title
            </button>
          </div>
        )}
      </div>
      
      {filteredNotes.length > 0 ? (
        <div className="space-y-4">
          {filteredNotes.map((note) => (
            <div key={note.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition duration-200">
              <div className="flex justify-between items-start mb-2">
                <Link href={`/notes/${note.id}`}>
                  <h3 className="text-lg font-semibold text-indigo-700 hover:text-indigo-900">{note.title}</h3>
                </Link>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => onDelete(note.id)}
                    className="text-red-500 hover:text-red-700 p-1"
                    aria-label="Delete note"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <Link href={`/notes/${note.id}`}>
                <p className="text-gray-600 text-sm mb-3">{getContentPreview(note.content)}</p>
</Link>
              <div className="flex justify-between items-center text-xs text-gray-500">
                <div className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  <span>Last updated: Today</span>
                </div>
                {note.folderId && (
                  <div className="px-2 py-1 bg-gray-100 rounded-md">
                    Folder: {note.folderId}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-10 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No notes found</h3>
          <p className="text-gray-500">
            {searchTerm ? 'Try a different search term' : 'Create your first note to get started'}
          </p>
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="mt-3 text-indigo-600 hover:text-indigo-800"
            >
              Clear search
            </button>
          )}
        </div>
      )}
    </div>
  )
}
export default NoteList

