// pages/api/notes.ts

import { NextApiRequest, NextApiResponse } from 'next'
import { Note } from '@/models/Note'

const notes: Note[] = [
  { id: '1', title: 'First Note', content: 'This is the content of the first note.' },
  { id: '2', title: 'Second Note', content: 'This is the content of the second note.' },
]

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    res.status(200).json(notes)
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
