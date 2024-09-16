// components/Settings.tsx

"use client";

import React, { useState } from 'react'

const Settings: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false)
  const [fontSize, setFontSize] = useState('medium')

  return (
    <div className="space-y-4">
      <div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={darkMode}
            onChange={(e) => setDarkMode(e.target.checked)}
          />
          <span>Dark Mode</span>
        </label>
      </div>
      <div>
        <label className="block mb-2">Font Size</label>
        <select
          value={fontSize}
          onChange={(e) => setFontSize(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </select>
      </div>
    </div>
  )
}

export default Settings