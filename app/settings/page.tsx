//app/pages/settings.tsx
import type { NextPage } from 'next'
import Settings from '../../components/Settings'

const SettingsPage: NextPage = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <Settings />
    </div>
  )
}

export default SettingsPage