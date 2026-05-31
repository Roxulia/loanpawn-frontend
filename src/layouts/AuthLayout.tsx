import { Outlet } from 'react-router'

export function AuthLayout() {
  return (
    <main className="auth-shell">
      <Outlet />
    </main>
  )
}
