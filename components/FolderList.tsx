// components/FolderList.tsx
"use client"

import React from 'react'
import Link from 'next/link'
import { Folder } from '../models/Folder'

interface FolderListProps {
  folders: Folder[]
}

const FolderList: React.FC<FolderListProps> = ({ folders }) => {
  return (
    <ul className="space-y-2">
      {folders.map((folder) => (
        <li key={folder.id} className="bg-white p-4 rounded-md shadow">
          <Link href={`/folders/${folder.id}`}>
            <a className="text-lg font-semibold text-blue-600 hover:underline">{folder.name}</a>
          </Link>
          <p className="text-gray-600 mt-2">{folder.notes.length} notes</p>
        </li>
      ))}
    </ul>
  )
}

export default FolderList