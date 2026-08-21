import { useState } from 'react'
import { Outlet } from 'react-router'
import { Sidebar } from '../components/navigation/Sidebar'
import { TopBar } from '../components/navigation/TopBar'
import { AppCompatibilityBanner, useAppCompatibility } from '../modules/appCompatibility'

export function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { isReadOnly } = useAppCompatibility()

  return (
    <div className={isSidebarOpen ? 'app-shell is-sidebar-open' : 'app-shell'}>
      <Sidebar onNavigate={() => setIsSidebarOpen(false)} />
      <button
        type="button"
        className="sidebar-backdrop"
        onClick={() => setIsSidebarOpen(false)}
        aria-label="Close navigation"
      />
      <main className="workspace">
        <TopBar onOpenSidebar={() => setIsSidebarOpen(true)} />
        <div className="workspace-content">
          <AppCompatibilityBanner />
          <fieldset className="app-compatibility-readonly-boundary" disabled={isReadOnly}>
            <Outlet />
          </fieldset>
        </div>
      </main>
    </div>
  )
}
