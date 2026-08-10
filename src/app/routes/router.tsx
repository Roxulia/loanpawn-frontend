import { createBrowserRouter, Navigate } from 'react-router'
import type { ReactNode } from 'react'
import { AppLayout } from '../../layouts/AppLayout'
import { AuthLayout } from '../../layouts/AuthLayout'
import { LoginPage } from '../../pages/auth/LoginPage'
import { SsoLoginPage } from '../../pages/auth/SsoLoginPage'
import { DashboardPage } from '../../pages/dashboard/DashboardPage'
import { NotFoundPage } from '../../pages/NotFoundPage'
import { ModulePage } from '../../pages/ModulePage'
import { ChangePasswordPage } from '../../pages/profile/ChangePasswordPage'
import { ProfilePage } from '../../pages/profile/ProfilePage'
import { FeatureRoute, PermissionRoute } from '../../modules/auth'
import { AccountingPage } from '../../modules/accounting'
import { CurrencyExchangePage } from '../../modules/currency'
import { CapitalsPage } from '../../modules/capitals'
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

function featureGate(featureCode: string, label: string, children: ReactNode) {
  return (
    <FeatureRoute featureCode={featureCode} label={label}>
      {children}
    </FeatureRoute>
  )
}

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
      { path: routePaths.dashboard, element: featureGate('dashboard', 'Dashboard', <PermissionRoute permission='dashboard'><DashboardPage /></PermissionRoute>) },
      { path: routePaths.profile, element: <ProfilePage /> },
      { path: routePaths.profileChangePassword, element: <ChangePasswordPage /> },
      { path: routePaths.customers, element: featureGate('customer_management', 'Customers', <PermissionRoute any={['list_customer', 'create_customer', 'update_customer', 'delete_customer']}><CustomerListPage /></PermissionRoute>) },
      { path: routePaths.customerCreate, element: featureGate('customer_management', 'Customers', <PermissionRoute permission="create_customer"><CustomerCreatePage /></PermissionRoute>) },
      { path: '/customers/:customerId', element: featureGate('customer_management', 'Customers', <PermissionRoute permission="list_customer"><CustomerDetailPage /></PermissionRoute>) },
      { path: '/customers/:customerId/edit', element: featureGate('customer_management', 'Customers', <PermissionRoute permission="update_customer"><CustomerEditPage /></PermissionRoute>) },
      { path: routePaths.collateral, element: featureGate('collateral_management', 'Collateral', <PermissionRoute any={['list_collateral', 'delete_collateral']}><CollateralListPage /></PermissionRoute>) },
      { path: '/collateral/:itemId', element: featureGate('collateral_management', 'Collateral', <PermissionRoute permission="list_collateral"><CollateralDetailPage /></PermissionRoute>) },
      { path: routePaths.staff, element: featureGate('tenant_user_management', 'Staff', <PermissionRoute permission="list_user"><StaffListPage /></PermissionRoute>) },
      { path: routePaths.staffCreate, element: featureGate('tenant_user_management', 'Staff', <PermissionRoute permission="create_user"><StaffCreatePage /></PermissionRoute>) },
      { path: '/staff/:staffId', element: featureGate('tenant_user_management', 'Staff', <PermissionRoute permission="list_user"><StaffDetailPage /></PermissionRoute>) },
      { path: '/staff/:staffId/edit', element: featureGate('tenant_user_management', 'Staff', <PermissionRoute any={['update_user_admin', 'update_user_all', 'update_user_own']}><StaffEditPage /></PermissionRoute>) },
      { path: routePaths.accounting, element: featureGate('accounting_management', 'Accounting', <PermissionRoute permission="list_accounting"><AccountingPage /></PermissionRoute>) },
      { path: routePaths.currencies, element: featureGate('currency_exchange_management', 'Currencies & Exchange Rates', <PermissionRoute any={['list_currency', 'list_exchange_pair', 'list_exchange_rate']}><CurrencyExchangePage /></PermissionRoute>) },
      { path: routePaths.capitals, element: featureGate('capital_management', 'Capital Management', <PermissionRoute any={['list_capital', 'create_capital', 'update_capital', 'delete_capital']}><CapitalsPage /></PermissionRoute>) },
      { path: routePaths.expenses, element: featureGate('expense_management', 'Expenses', <PermissionRoute any={['list_expense', 'create_expense', 'update_expense', 'delete_expense']}><ExpensesPage /></PermissionRoute>) },
      { path: routePaths.expenseCreate, element: featureGate('expense_management', 'Expenses', <PermissionRoute permission="create_expense"><ExpenseCreatePage /></PermissionRoute>) },
      { path: routePaths.debts, element: featureGate('debt_management', 'Debts', <PermissionRoute any={['list_debt', 'create_debt', 'update_debt', 'delete_debt']}><DebtsPage /></PermissionRoute>) },
      { path: routePaths.debtCreate, element: featureGate('debt_management', 'Debts', <PermissionRoute permission="create_debt"><DebtCreatePage /></PermissionRoute>) },
      { path: routePaths.slips, element: featureGate('loan_contract_management', 'Loan Slips', <PermissionRoute any={['list_loan_contract', 'create_loan_contract', 'delete_loan_contract']}><SlipsPage /></PermissionRoute>) },
      { path: '/slips/:slipNo', element: featureGate('loan_contract_management', 'Loan Slips', <PermissionRoute permission="list_loan_contract"><SlipDetailPage /></PermissionRoute>) },
      { path: routePaths.interest, element: featureGate('interest_payment_management', 'Interest Payments', <PermissionRoute any={['list_loan_contract', 'create_loan_contract']}><InterestPaymentsPage /></PermissionRoute>) },
      { path: routePaths.redemptions, element: featureGate('redemption_management', 'Redemptions', <PermissionRoute any={['list_loan_contract', 'create_loan_contract']}><RedemptionsPage /></PermissionRoute>) },
      { path: routePaths.settings, element: <PermissionRoute any={['manage_slip_document', 'manage_tenant_timezone']}><SettingsPage /></PermissionRoute> },
      { path: routePaths.templateEditor, element: featureGate('slip_document_layout_management', 'Template editor', <PermissionRoute permission="manage_slip_document"><TemplateEditorPage /></PermissionRoute>) },
      ...moduleRegistry.filter((module) => !['customers', 'collateral', 'staff', 'accounting', 'capitals', 'expenses', 'debts', 'slips', 'interest', 'redemptions', 'settings'].includes(module.id)).map((module) => ({
        path: module.routeSegment,
        element: <PermissionRoute any={module.modulePermissions}><ModulePage module={module} /></PermissionRoute>,
      })),
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
