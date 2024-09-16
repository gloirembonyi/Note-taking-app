// models/Folder.ts
import { Note } from './Note'

export interface Folder {
  id: string
  name: string
  notes: Note[]
}