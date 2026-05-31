import { createBrowserRouter, Navigate } from 'react-router'
import { AppLayout } from '../../layouts/AppLayout'
import { AuthLayout } from '../../layouts/AuthLayout'
import { LoginPage } from '../../pages/auth/LoginPage'
import { SsoLoginPage } from '../../pages/auth/SsoLoginPage'
import { DashboardPage } from '../../pages/dashboard/DashboardPage'
import { NotFoundPage } from '../../pages/NotFoundPage'
import { ModulePage } from '../../pages/ModulePage'
import { ChangePasswordPage } from '../../pages/profile/ChangePasswordPage'
import { ProfilePage } from '../../pages/profile/ProfilePage'
import { PermissionRoute } from '../../modules/auth'
import { AccountingPage } from '../../modules/accounting'
import { CollateralDetailPage, CollateralListPage } from '../../modules/collateral'
import { CustomerCreatePage, CustomerDetailPage, CustomerEditPage, CustomerListPage } from '../../modules/customers'
import { DebtCreatePage, DebtsPage } from '../../modules/debts'
import { ExpenseCreatePage, ExpensesPage } from '../../modules/expenses'
import { InterestPaymentsPage } from '../../modules/interest'
import { moduleRegistry } from '../../modules/moduleRegistry'
import { RedemptionsPage } from '../../modules/redemptions'
import { SettingsPage, TemplateEditorPage } from '../../modules/settings'
import { SlipDetailPage, SlipsPage } from '../../modules/slips'
import { StaffCreatePage, StaffDetailPage, StaffEditPage, StaffListPage } from '../../modules/staff'
import { ProtectedRoute } from './ProtectedRoute'
import { routePaths } from './paths'
import { PackageRoute } from '../../modules/auth/PackageRoute'

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: routePaths.home, element: <Navigate to={routePaths.dashboard} replace /> },
      { path: routePaths.login, element: <LoginPage /> },
      { path: routePaths.sso, element: <SsoLoginPage /> },
    ],
  },
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: routePaths.dashboard, element: <DashboardPage /> },
      { path: routePaths.profile, element: <ProfilePage /> },
      { path: routePaths.profileChangePassword, element: <ChangePasswordPage /> },
      { path: routePaths.customers, element: <PermissionRoute any={['list_customer', 'create_customer', 'update_customer', 'delete_customer']}><CustomerListPage /></PermissionRoute> },
      { path: routePaths.customerCreate, element: <PermissionRoute permission="create_customer"><CustomerCreatePage /></PermissionRoute> },
      { path: '/customers/:customerId', element: <PermissionRoute permission="list_customer"><CustomerDetailPage /></PermissionRoute> },
      { path: '/customers/:customerId/edit', element: <PermissionRoute permission="update_customer"><CustomerEditPage /></PermissionRoute> },
      { path: routePaths.collateral, element: <PermissionRoute any={['list_collateral', 'delete_collateral']}><CollateralListPage /></PermissionRoute> },
      { path: '/collateral/:itemId', element: <PermissionRoute permission="list_collateral"><CollateralDetailPage /></PermissionRoute> },
      { path: routePaths.staff, element: <PermissionRoute permission="list_user"><StaffListPage /></PermissionRoute> },
      { path: routePaths.staffCreate, element: <PermissionRoute permission="create_user"><StaffCreatePage /></PermissionRoute> },
      { path: '/staff/:staffId', element: <PermissionRoute permission="list_user"><StaffDetailPage /></PermissionRoute> },
      { path: '/staff/:staffId/edit', element: <PermissionRoute any={['update_user_admin', 'update_user_all', 'update_user_own']}><StaffEditPage /></PermissionRoute> },
      { path: routePaths.accounting, element: <PermissionRoute permission="list_accounting"><AccountingPage /></PermissionRoute> },
      { path: routePaths.expenses, element: <PermissionRoute any={['list_expense', 'create_expense', 'update_expense', 'delete_expense']}><ExpensesPage /></PermissionRoute> },
      { path: routePaths.expenseCreate, element: <PermissionRoute permission="create_expense"><ExpenseCreatePage /></PermissionRoute> },
      { path: routePaths.debts, element: <PermissionRoute any={['list_debt', 'create_debt', 'update_debt', 'delete_debt']}><DebtsPage /></PermissionRoute> },
      { path: routePaths.debtCreate, element: <PermissionRoute permission="create_debt"><DebtCreatePage /></PermissionRoute> },
      { path: routePaths.slips, element: <PermissionRoute any={['list_loan_contract', 'create_loan_contract', 'delete_loan_contract']}><SlipsPage /></PermissionRoute> },
      { path: '/slips/:slipNo', element: <PermissionRoute permission="list_loan_contract"><SlipDetailPage /></PermissionRoute> },
      { path: routePaths.interest, element: <PermissionRoute any={['list_loan_contract', 'create_loan_contract']}><InterestPaymentsPage /></PermissionRoute> },
      { path: routePaths.redemptions, element: <PermissionRoute any={['list_loan_contract', 'create_loan_contract']}><RedemptionsPage /></PermissionRoute> },
      { path: routePaths.settings, element: <PermissionRoute permission="manage_slip_document"><SettingsPage /></PermissionRoute> },
      { path: routePaths.templateEditor, element: <PackageRoute plan_type="premium"><PermissionRoute permission="manage_slip_document"><TemplateEditorPage /></PermissionRoute> </PackageRoute> },
      ...moduleRegistry.filter((module) => !['customers', 'collateral', 'staff', 'accounting', 'expenses', 'debts', 'slips', 'interest', 'redemptions', 'settings'].includes(module.id)).map((module) => ({
        path: module.routeSegment,
        element: <PermissionRoute any={module.modulePermissions}><ModulePage module={module} /></PermissionRoute>,
      })),
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
