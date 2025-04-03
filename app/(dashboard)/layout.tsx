'use client';

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { FileText, Folder, Settings, Plus, LogOut } from "lucide-react";
import { useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Sidebar - Hidden on mobile by default */}
      <aside className={`
        fixed md:relative z-10 md:z-auto top-0 bottom-0 w-64 bg-white shadow-md transform transition-transform duration-300 ease-in-out
        ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* App Logo and name */}
          <div className="p-6 border-b">
            <Link href="/notes" className="text-2xl font-bold text-indigo-700">
              NoteGenius
            </Link>
          </div>
          
          {/* Sidebar Menu */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <ul className="space-y-2">
              <li>
                <Link href="/notes" className="flex items-center px-4 py-3 rounded-lg hover:bg-indigo-50 text-gray-700 font-medium">
                  <FileText className="w-5 h-5 mr-3 text-indigo-600" />
                  All Notes
                </Link>
              </li>
              <li>
                <Link href="/folders" className="flex items-center px-4 py-3 rounded-lg hover:bg-indigo-50 text-gray-700 font-medium">
                  <Folder className="w-5 h-5 mr-3 text-indigo-600" />
                  Folders
                </Link>
              </li>
              <li>
                <Link href="/settings" className="flex items-center px-4 py-3 rounded-lg hover:bg-indigo-50 text-gray-700 font-medium">
                  <Settings className="w-5 h-5 mr-3 text-indigo-600" />
                  Settings
                </Link>
              </li>
            </ul>
          </nav>
          
          {/* Create New Note Button */}
          <div className="p-4 border-t">
            <button className="w-full flex items-center justify-center bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors">
              <Plus className="w-5 h-5 mr-2" />
              New Note
            </button>
          </div>
          
          {/* User Profile Section */}
          <div className="p-4 border-t flex items-center justify-between">
            <div className="flex items-center">
              <UserButton afterSignOutUrl="/" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">My Account</p>
              </div>
            </div>
            <Link href="/" className="text-gray-500 hover:text-gray-700">
              <LogOut className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </aside>
      
      {/* Mobile Header with Hamburger Menu */}
      <div className="md:hidden bg-white p-4 border-b flex items-center justify-between shadow-sm">
        <button
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="text-gray-600 focus:outline-none"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="text-xl font-bold text-indigo-700">NoteGenius</div>
        <UserButton afterSignOutUrl="/" />
      </div>
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        {children}
      </main>
      
      {/* Backdrop for mobile sidebar */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-0 md:hidden" 
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}
    </div>
  );
} 