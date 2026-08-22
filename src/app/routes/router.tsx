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
import { CurrencyManagementPage, DailyRateAssignmentPage, ExchangePairManagementPage, ReportingCurrencyRatesPage } from '../../modules/currency'
import { FinancialAccountCreatePage, FinancialAccountDetailPage, FinancialAccountEditPage, FinancialAccountListPage, FinancialAccountTransferPage } from '../../modules/financialAccounts'
import { CapitalCreatePage, CapitalEditPage, CapitalsPage } from '../../modules/capitals'
import { CollateralDetailPage, CollateralListPage } from '../../modules/collateral'
import { CustomerCreatePage, CustomerDetailPage, CustomerEditPage, CustomerListPage } from '../../modules/customers'
import { DebtCreatePage, DebtsPage } from '../../modules/debts'
import { ExpenseCreatePage, ExpenseEditPage, ExpensesPage } from '../../modules/expenses'
import { InterestPaymentsPage } from '../../modules/interest'
import { moduleRegistry } from '../../modules/moduleRegistry'
import { RedemptionsPage } from '../../modules/redemptions'
import { DefaultDataSettingsPage, FinanceSettingsPage, PersonalSettingsPage, TenantSettingsPage, TemplateEditorPage } from '../../modules/settings'
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

function featureGates(featureCodes: string[], label: string, children: ReactNode) {
  return featureCodes.reduceRight((content, featureCode) => featureGate(featureCode, label, content), children)
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
      { path: '/staff/:staffId/edit', element: featureGate('tenant_user_management', 'Staff', <PermissionRoute any={['update_user_roles', 'update_user_info', 'update_user_self', 'update_admin_user']}><StaffEditPage /></PermissionRoute>) },
      { path: routePaths.accounting, element: featureGate('accounting_management', 'Accounting', <PermissionRoute permission="list_accounting"><AccountingPage /></PermissionRoute>) },
      { path: routePaths.currencies, element: featureGate('currency_management', 'Currency Management', <PermissionRoute permission="list_currency"><CurrencyManagementPage /></PermissionRoute>) },
      { path: routePaths.exchangePairs, element: featureGates(['currency_management', 'exchange_pair_management'], 'Exchange Pair Management', <PermissionRoute permission="list_exchange_pair"><ExchangePairManagementPage /></PermissionRoute>) },
      { path: routePaths.dailyRates, element: featureGates(['currency_management', 'exchange_pair_management', 'daily_rate_assignment'], 'Daily Rate Assignment', <PermissionRoute permission="list_exchange_rate"><DailyRateAssignmentPage /></PermissionRoute>) },
      { path: routePaths.reportingCurrencyRates, element: featureGates(['currency_management', 'exchange_pair_management', 'daily_rate_assignment'], 'Required Historical Rates', <PermissionRoute permission="update_currency"><PermissionRoute permission="create_exchange_rate"><ReportingCurrencyRatesPage /></PermissionRoute></PermissionRoute>) },
      { path: routePaths.financialAccounts, element: featureGate('multi_account_management', 'Financial Accounts', <PermissionRoute permission="list_financial_account"><FinancialAccountListPage /></PermissionRoute>) },
      { path: routePaths.financialAccountCreate, element: featureGate('multi_account_management', 'Financial Accounts', <PermissionRoute permission="create_financial_account"><FinancialAccountCreatePage /></PermissionRoute>) },
      { path: routePaths.financialAccountTransfer, element: featureGates(['multi_account_management', 'account_transferable'], 'Account Transfers', <PermissionRoute permission="transfer_financial_account"><FinancialAccountTransferPage /></PermissionRoute>) },
      { path: '/financial-accounts/:accountCode', element: featureGate('multi_account_management', 'Financial Accounts', <PermissionRoute permission="list_financial_account"><FinancialAccountDetailPage /></PermissionRoute>) },
      { path: '/financial-accounts/:accountCode/edit', element: featureGate('multi_account_management', 'Financial Accounts', <PermissionRoute permission="update_financial_account"><FinancialAccountEditPage /></PermissionRoute>) },
      { path: routePaths.capitals, element: featureGate('capital_management', 'Capital Management', <PermissionRoute any={['list_capital', 'create_capital', 'update_capital', 'delete_capital']}><CapitalsPage /></PermissionRoute>) },
      { path: routePaths.capitalCreate, element: featureGate('capital_management', 'Capital Management', <PermissionRoute permission="create_capital"><CapitalCreatePage /></PermissionRoute>) },
      { path: '/capitals/:capitalCode/edit', element: featureGate('capital_management', 'Capital Management', <PermissionRoute permission="update_capital"><CapitalEditPage /></PermissionRoute>) },
      { path: routePaths.expenses, element: featureGate('expense_management', 'Expenses', <PermissionRoute any={['list_expense', 'create_expense', 'update_expense', 'delete_expense']}><ExpensesPage /></PermissionRoute>) },
      { path: routePaths.expenseCreate, element: featureGate('expense_management', 'Expenses', <PermissionRoute permission="create_expense"><ExpenseCreatePage /></PermissionRoute>) },
      { path: '/expenses/:expenseCode/edit', element: featureGate('expense_management', 'Expenses', <PermissionRoute permission="update_expense"><ExpenseEditPage /></PermissionRoute>) },
      { path: routePaths.debts, element: featureGate('debt_management', 'Debts', <PermissionRoute any={['list_debt', 'create_debt', 'update_debt', 'delete_debt']}><DebtsPage /></PermissionRoute>) },
      { path: routePaths.debtCreate, element: featureGate('debt_management', 'Debts', <PermissionRoute permission="create_debt"><DebtCreatePage /></PermissionRoute>) },
      { path: routePaths.slips, element: featureGate('loan_contract_management', 'Loan Slips', <PermissionRoute any={['list_loan_contract', 'create_loan_contract', 'delete_loan_contract']}><SlipsPage /></PermissionRoute>) },
      { path: '/slips/:slipNo', element: featureGate('loan_contract_management', 'Loan Slips', <PermissionRoute permission="list_loan_contract"><SlipDetailPage /></PermissionRoute>) },
      { path: routePaths.interest, element: featureGate('interest_payment_management', 'Interest Payments', <PermissionRoute any={['list_loan_contract', 'create_loan_contract']}><InterestPaymentsPage /></PermissionRoute>) },
      { path: routePaths.redemptions, element: featureGate('redemption_management', 'Redemptions', <PermissionRoute any={['list_loan_contract', 'create_loan_contract']}><RedemptionsPage /></PermissionRoute>) },
      { path: routePaths.settings, element: <PermissionRoute any={['manage_slip_document', 'manage_tenant_timezone', 'manage_tenant_contact', 'update_default_currency', 'update_reporting_currency', 'update_default_financial_unit', 'manage_accounting_day_schedule', 'list_currency', 'list_financial_account_type', 'list_material_type', 'list_interest_type', 'list_item_category_type', 'list_expense_type']}><Navigate to={routePaths.settingsPersonal} replace /></PermissionRoute> },
      { path: routePaths.settingsPersonal, element: <PermissionRoute any={['manage_slip_document', 'manage_tenant_timezone', 'manage_tenant_contact', 'update_default_currency', 'update_reporting_currency', 'update_default_financial_unit', 'manage_accounting_day_schedule', 'list_currency', 'list_financial_account_type', 'list_material_type', 'list_interest_type', 'list_item_category_type', 'list_expense_type']}><PersonalSettingsPage /></PermissionRoute> },
      { path: routePaths.settingsTenant, element: <PermissionRoute any={['manage_slip_document', 'manage_tenant_timezone', 'manage_tenant_contact']}><TenantSettingsPage /></PermissionRoute> },
      { path: routePaths.settingsFinance, element: <PermissionRoute any={['list_currency', 'update_default_currency', 'update_reporting_currency', 'update_default_financial_unit', 'manage_accounting_day_schedule', 'list_financial_account_type']}><FinanceSettingsPage /></PermissionRoute> },
      { path: routePaths.settingsDefaultData, element: <PermissionRoute any={['list_material_type', 'list_interest_type', 'list_item_category_type', 'list_expense_type']}><DefaultDataSettingsPage /></PermissionRoute> },
      { path: routePaths.settingsDocuments, element: featureGate('slip_document_layout_management', 'Template editor', <PermissionRoute permission="manage_slip_document"><TemplateEditorPage /></PermissionRoute>) },
      { path: routePaths.templateEditor, element: <Navigate to={routePaths.settingsDocuments} replace /> },
      ...moduleRegistry.filter((module) => !['customers', 'collateral', 'staff', 'accounting', 'capitals', 'expenses', 'debts', 'slips', 'interest', 'redemptions', 'settings'].includes(module.id)).map((module) => ({
        path: module.routeSegment,
        element: <PermissionRoute any={module.modulePermissions}><ModulePage module={module} /></PermissionRoute>,
      })),
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
