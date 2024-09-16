//app/folders/index.tsx

"use client"

import type { NextPage } from 'next'
import { useEffect, useState } from 'react'
import FolderList from '../../components/FolderList'
import { getFolders } from '../../lib/api'
import { Folder } from '../../models/Folder'

const FoldersPage: NextPage = () => {
  const [folders, setFolders] = useState<Folder[]>([])

  useEffect(() => {
    const fetchFolders = async () => {
      const fetchedFolders = await getFolders()
      setFolders(fetchedFolders)
    }
    fetchFolders()
  }, [])

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Your Folders</h1>
      <FolderList folders={folders} />
    </div>
  )
}

export default FoldersPage