import { NavLink } from 'react-router'
import { routePaths } from '../../app/routes/paths'
import { usePermissions, type PermissionCode } from '../../modules/auth'
import { useUiLocale } from '../../locales/UiLocale'

type SidebarProps = {
  onNavigate?: () => void
}

type IconName =
  | 'dashboard'
  | 'customers'
  | 'collateral'
  | 'slips'
  | 'interest'
  | 'redemptions'
  | 'accounting'
  | 'expenses'
  | 'debts'
  | 'staff'
  | 'settings'

type NavigationItem = {
  label: string
  to: string
  icon: IconName
  permissions?: PermissionCode[]
}

type NavigationGroup = {
  label: string
  items: NavigationItem[]
}

const navigationGroups: NavigationGroup[] = [
  {
    label: 'Workspace',
    items: [
      { label: 'Dashboard', to: routePaths.dashboard, icon: 'dashboard' },
    ],
  },
  {
    label: 'Pawn Operations',
    items: [
      { label: 'Customers', to: routePaths.customers, icon: 'customers', permissions: ['list_customer', 'create_customer', 'update_customer', 'delete_customer'] },
      { label: 'Collateral', to: routePaths.collateral, icon: 'collateral', permissions: ['list_collateral', 'delete_collateral'] },
      { label: 'Loan Slips', to: routePaths.slips, icon: 'slips', permissions: ['list_loan_contract', 'create_loan_contract', 'delete_loan_contract'] },
      { label: 'Interest Payments', to: routePaths.interest, icon: 'interest', permissions: ['list_loan_contract', 'create_loan_contract'] },
      { label: 'Redemptions', to: routePaths.redemptions, icon: 'redemptions', permissions: ['list_loan_contract', 'create_loan_contract'] },
    ],
  },
  {
    label: 'Finance',
    items: [
      { label: 'Accounting', to: routePaths.accounting, icon: 'accounting', permissions: ['list_accounting'] },
      { label: 'Expenses', to: routePaths.expenses, icon: 'expenses', permissions: ['list_expense', 'create_expense', 'update_expense', 'delete_expense'] },
      { label: 'Debts', to: routePaths.debts, icon: 'debts', permissions: ['list_debt', 'create_debt', 'update_debt', 'delete_debt'] },
    ],
  },
  {
    label: 'Administration',
    items: [
      { label: 'Staff', to: routePaths.staff, icon: 'staff', permissions: ['list_user', 'create_user', 'update_user_admin', 'update_user_all', 'update_user_own', 'delete_user'] },
      { label: 'Settings', to: routePaths.settings, icon: 'settings', permissions: ['manage_slip_document'] },
    ],
  },
]

export function Sidebar({ onNavigate }: SidebarProps) {
  const { hasAnyPermission } = usePermissions()
  const { t } = useUiLocale()
  const visibleGroups = navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.permissions || hasAnyPermission(item.permissions)),
    }))
    .filter((group) => group.items.length > 0)

  return (
    <aside className="sidebar" aria-label={t('Main navigation')}>
      <header className="sidebar-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <div>
            <strong>LonePawn</strong>
            <span>{t('Operations')}</span>
          </div>
        </div>
      </header>

      <div className="sidebar-body">
        <nav className="sidebar-nav" aria-label={t('Application sections')}>
          {visibleGroups.map((group) => (
            <div className="nav-group" key={group.label}>
              <span className="nav-group-label">{t(group.label)}</span>
              <div className="nav-list">
                {group.items.map((item) => (
                  <NavLink key={item.to} to={item.to} onClick={onNavigate} title={t(item.label)}>
                    <SidebarIcon name={item.icon} />
                    <span>{t(item.label)}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>

      <footer className="sidebar-footer">
        <small>&copy; 2026 One More Bit</small>
      </footer>
    </aside>
  )
}

function SidebarIcon({ name }: { name: IconName }) {
  const paths: Record<IconName, string[]> = {
    dashboard: ['M3 11h7V3H3v8Z', 'M14 21h7v-8h-7v8Z', 'M3 21h7v-6H3v6Z', 'M14 9h7V3h-7v6Z'],
    customers: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', 'M22 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75'],
    collateral: ['M6 3h12l4 6-10 12L2 9l4-6Z', 'M2 9h20', 'M12 21 8 9l4-6 4 6-4 12Z'],
    slips: ['M6 2h9l5 5v15H6V2Z', 'M14 2v6h6', 'M9 13h6', 'M9 17h6'],
    interest: ['M12 1v22', 'M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6'],
    redemptions: ['M21 12a9 9 0 1 1-3-6.7', 'M21 3v6h-6', 'M8 12l3 3 5-6'],
    accounting: ['M4 3h16v18H4V3Z', 'M8 7h8', 'M8 11h8', 'M8 15h3', 'M15 15h1'],
    expenses: ['M3 6h18', 'M8 6V4h8v2', 'M6 6l1 15h10l1-15', 'M10 11v5', 'M14 11v5'],
    debts: ['M4 4h16v16H4V4Z', 'M8 8h8', 'M8 12h8', 'M8 16h4'],
    staff: ['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2', 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', 'M19 8v6', 'M22 11h-6'],
    settings: ['M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z', 'M19.4 15a1.8 1.8 0 0 0 .36 2l.07.07a2 2 0 0 1-2.83 2.83l-.07-.07a1.8 1.8 0 0 0-2-.36 1.8 1.8 0 0 0-1 1.63V21a2 2 0 0 1-4 0v-.1a1.8 1.8 0 0 0-1-1.63 1.8 1.8 0 0 0-2 .36l-.07.07a2 2 0 0 1-2.83-2.83l.07-.07a1.8 1.8 0 0 0 .36-2 1.8 1.8 0 0 0-1.63-1H3a2 2 0 0 1 0-4h.1a1.8 1.8 0 0 0 1.63-1 1.8 1.8 0 0 0-.36-2l-.07-.07A2 2 0 0 1 7.13 3.9l.07.07a1.8 1.8 0 0 0 2 .36A1.8 1.8 0 0 0 10.2 2.7V2a2 2 0 0 1 4 0v.1a1.8 1.8 0 0 0 1 1.63 1.8 1.8 0 0 0 2-.36l.07-.07a2 2 0 0 1 2.83 2.83l-.07.07a1.8 1.8 0 0 0-.36 2 1.8 1.8 0 0 0 1.63 1H21a2 2 0 0 1 0 4h-.1a1.8 1.8 0 0 0-1.5 1Z'],
  }

  return (
    <svg className="nav-icon" aria-hidden="true" viewBox="0 0 24 24">
      {paths[name].map((path) => (
        <path d={path} key={path} />
      ))}
    </svg>
  )
}
