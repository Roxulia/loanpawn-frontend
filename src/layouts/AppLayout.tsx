import { useState } from 'react'
import { Outlet } from 'react-router'
import { Sidebar } from '../components/navigation/Sidebar'
import { TopBar } from '../components/navigation/TopBar'

export function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

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
          <Outlet />
        </div>
      </main>
    </div>
  )
}
