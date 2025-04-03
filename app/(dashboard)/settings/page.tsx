'use client';

import React from "react";
import { UserCircle, Bell, Shield, Moon, Palette, Globe, Save } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Settings</h1>
      
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="border-b">
          <ul className="flex overflow-x-auto -mb-px text-sm font-medium">
            <li className="mr-2">
              <a href="#" className="inline-flex items-center px-4 py-3 text-indigo-600 border-b-2 border-indigo-600">
                <UserCircle className="w-5 h-5 mr-2" />
                Account
              </a>
            </li>
            <li className="mr-2">
              <a href="#" className="inline-flex items-center px-4 py-3 text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300">
                <Bell className="w-5 h-5 mr-2" />
                Notifications
              </a>
            </li>
            <li className="mr-2">
              <a href="#" className="inline-flex items-center px-4 py-3 text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300">
                <Shield className="w-5 h-5 mr-2" />
                Privacy & Security
              </a>
            </li>
            <li className="mr-2">
              <a href="#" className="inline-flex items-center px-4 py-3 text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300">
                <Palette className="w-5 h-5 mr-2" />
                Appearance
              </a>
            </li>
          </ul>
        </div>
        
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Account Settings</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input 
                type="text" 
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                defaultValue="John Doe"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input 
                type="email" 
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                defaultValue="john.doe@example.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Language
              </label>
              <div className="relative">
                <select className="appearance-none w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent pr-8">
                  <option>English (US)</option>
                  <option>French</option>
                  <option>Spanish</option>
                  <option>German</option>
                </select>
                <Globe className="absolute right-2.5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-700 mr-2">Dark Mode</span>
                <label className="relative inline-block w-12 h-6">
                  <input type="checkbox" className="opacity-0 w-0 h-0" />
                  <span className="absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-gray-300 rounded-full transition-colors duration-300"></span>
                  <span className="absolute cursor-pointer w-5 h-5 left-0.5 bottom-0.5 bg-white rounded-full transition-transform duration-300"></span>
                </label>
              </div>
              <Moon className="w-5 h-5 text-gray-600" />
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t flex">
            <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center">
              <Save className="w-5 h-5 mr-2" />
              Save Changes
            </button>
            <button className="ml-4 text-gray-600 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Danger Zone</h2>
        <p className="text-gray-600 text-sm mb-4">
          These actions are destructive and cannot be reversed. Please proceed with caution.
        </p>
        
        <div className="space-y-4">
          <button className="text-red-600 border border-red-300 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors w-full text-left">
            Delete all notes
          </button>
          <button className="text-red-600 border border-red-300 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors w-full text-left">
            Delete account
          </button>
        </div>
      </div>
    </div>
  );
} 