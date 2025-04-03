'use client';

import React from "react";
import { Folder, FolderPlus, File, MoreVertical } from "lucide-react";

// Sample folder data
const SAMPLE_FOLDERS = [
  {
    id: 1,
    name: "Work Projects",
    noteCount: 12,
    color: "indigo"
  },
  {
    id: 2,
    name: "Personal",
    noteCount: 8,
    color: "emerald"
  },
  {
    id: 3,
    name: "Meeting Notes",
    noteCount: 15,
    color: "amber"
  },
  {
    id: 4,
    name: "Ideas",
    noteCount: 5,
    color: "rose"
  },
  {
    id: 5,
    name: "Research",
    noteCount: 3,
    color: "blue"
  }
];

// Helper function to get folder color class
const getFolderColorClass = (color: string) => {
  const colorMap: Record<string, string> = {
    indigo: "bg-indigo-100 text-indigo-600",
    emerald: "bg-emerald-100 text-emerald-600",
    amber: "bg-amber-100 text-amber-600",
    rose: "bg-rose-100 text-rose-600",
    blue: "bg-blue-100 text-blue-600",
  };
  return colorMap[color] || "bg-gray-100 text-gray-600";
};

export default function FoldersPage() {
  return (
    <div className="h-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Folders</h1>
        <button className="bg-indigo-600 text-white flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
          <FolderPlus className="w-5 h-5" />
          <span>New Folder</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SAMPLE_FOLDERS.map(folder => (
          <div key={folder.id} className="bg-white p-5 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer border border-gray-100">
            <div className="flex justify-between items-start">
              <div className={`p-3 rounded-lg ${getFolderColorClass(folder.color)}`}>
                <Folder className="w-7 h-7" />
              </div>
              <button className="text-gray-400 hover:text-gray-600">
                <MoreVertical className="h-5 w-5" />
              </button>
            </div>
            <h3 className="text-lg font-medium mt-3 mb-1 text-gray-900">{folder.name}</h3>
            <div className="flex items-center text-sm text-gray-500">
              <File className="w-4 h-4 mr-1" />
              <span>{folder.noteCount} {folder.noteCount === 1 ? "note" : "notes"}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 