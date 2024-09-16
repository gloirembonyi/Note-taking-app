// components/Sidebar.tsx
import React from 'react';
import Link from 'next/link';
import { FiBook, FiFolder, FiSettings, FiPlus } from 'react-icons/fi';

const Sidebar: React.FC = () => {
  return (
    <aside className="bg-white w-64 min-h-screen p-4 shadow-md">
      <nav>
        <ul className="space-y-2">
          <li>
            <Link href="/notes" className="flex items-center p-2 text-gray-700 hover:bg-blue-50 rounded-md transition-colors">
              <FiBook className="mr-2" />
              All Notes
            </Link>
          </li>
          <li>
            <Link href="/folders" className="flex items-center p-2 text-gray-700 hover:bg-blue-50 rounded-md transition-colors">
              <FiFolder className="mr-2" />
              Folders
            </Link>
          </li>
          <li>
            <Link href="/settings" className="flex items-center p-2 text-gray-700 hover:bg-blue-50 rounded-md transition-colors">
              <FiSettings className="mr-2" />
              Settings
            </Link>
          </li>
        </ul>
      </nav>
      <div className="mt-8">
        <Link href="/notes/new" className="flex items-center justify-center w-full bg-indigo-600 text-white p-2 rounded-md hover:bg-blue-700 transition-colors">
          <FiPlus className="mr-2" />
          New Note
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;