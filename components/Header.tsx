//components/Header.tsx

import React from 'react';
import Link from 'next/link';
import { UserButton, useUser } from '@clerk/nextjs';
import { BrainCircuit, Settings, Folder, Search as SearchIcon, Moon, Sun, Menu } from 'lucide-react';

export default function Header() {
  const { user } = useUser();
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    // In a real implementation, you would toggle a class on the document or use a theme context
    document.documentElement.classList.toggle('dark-mode');
  };

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700">
      <div className="px-4 py-3 mx-auto max-w-screen-2xl">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <BrainCircuit size={28} className="text-indigo-600 dark:text-indigo-400" />
              <span className="ml-2 text-xl font-bold text-gray-800 dark:text-white">NoteGenius</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link href="/notes" className="px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 hover:text-indigo-600 dark:text-gray-200 dark:hover:bg-gray-700">
              Notes
            </Link>
            <Link href="/folders" className="px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 hover:text-indigo-600 dark:text-gray-200 dark:hover:bg-gray-700">
              Folders
            </Link>
            <Link href="/settings" className="px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 hover:text-indigo-600 dark:text-gray-200 dark:hover:bg-gray-700">
              Settings
            </Link>
          </nav>

          {/* Right Side Icons */}
          <div className="flex items-center space-x-3">
            {/* Search Button */}
            <button className="p-2 text-gray-500 rounded-full hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700" aria-label="Global Search">
              <SearchIcon size={20} />
            </button>
            
            {/* Theme Toggle */}
            <button 
              onClick={toggleDarkMode} 
              className="p-2 text-gray-500 rounded-full hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              aria-label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            {/* User Profile */}
            <div className="relative ml-2">
              <UserButton afterSignOutUrl="/" />
            </div>
            
            {/* Mobile Menu Button */}
            <button 
              className="p-2 text-gray-500 rounded-md md:hidden hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Menu"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <nav className="mt-3 space-y-1 md:hidden">
            <Link href="/notes" 
              className="block px-3 py-2 text-base font-medium rounded-md text-gray-700 hover:bg-gray-100 hover:text-indigo-600 dark:text-gray-200 dark:hover:bg-gray-700"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Notes
            </Link>
            <Link href="/folders" 
              className="block px-3 py-2 text-base font-medium rounded-md text-gray-700 hover:bg-gray-100 hover:text-indigo-600 dark:text-gray-200 dark:hover:bg-gray-700"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Folders
            </Link>
            <Link href="/settings" 
              className="block px-3 py-2 text-base font-medium rounded-md text-gray-700 hover:bg-gray-100 hover:text-indigo-600 dark:text-gray-200 dark:hover:bg-gray-700"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Settings
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}