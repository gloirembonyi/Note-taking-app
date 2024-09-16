// components/NoteList.tsx

"use client"
import React from 'react'
import Link from 'next/link'
import { Note } from '../models/Note'

interface NoteListProps {
  notes: Note[]
}

const NoteList: React.FC<NoteListProps> = ({ notes }) => {
  return (
    <ul className="space-y-2">
      {notes.map((note) => (
        <li key={note.id} className="bg-white p-4 rounded-md shadow">
          
<Link href={`/notes/${note.id}`} className="text-lg font-semibold text-blue-600 hover:underline">
  {note.title || 'Untitled Note'}
</Link>
          <p className="text-gray-600 mt-2">
            {note.content ? note.content.substring(0, 100) : 'No content'}...
          </p>
        </li>
      ))}
    </ul>
  )
}

export default NoteList
