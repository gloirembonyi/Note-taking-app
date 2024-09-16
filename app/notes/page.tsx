// app/notes/page.tsx

"use client"

import type { NextPage } from 'next'
import { useEffect, useState } from 'react'
import { Note } from '@/models/Note'
import NoteList from '@/components/NoteList'
import { getNotes } from '@/lib/api'
import Link from 'next/link'

const NotesPage: NextPage = () => {
  const [notes, setNotes] = useState<Note[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const fetchedNotes = await getNotes()
        setNotes(fetchedNotes)
      } catch (err) {
        console.error("Failed to fetch notes:", err)
        setError("Failed to load notes. Please try again later.")
      } finally {
        setLoading(false)
      }
    }
    fetchNotes()
  }, [])

  if (loading) {
    return <div className="p-4">Loading...</div>
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold mb-4">Your Notes</h1>
        <Link href="/notes/new" className="bg-blue-500 text-white px-4 py-2 rounded">
            Create New Note
        </Link>
      </div>
      {notes.length > 0 ? (
        <NoteList notes={notes} />
      ) : (
        <p>No notes found. Create your first note!</p>
      )}
    </div>
  )
}

export default NotesPage
