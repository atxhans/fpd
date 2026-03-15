import { SettingsSubNav } from './settings-sub-nav'

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>
      <SettingsSubNav />
      <div>{children}</div>
    </div>
  )
}
