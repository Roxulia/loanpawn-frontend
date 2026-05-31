import type { PermissionCode } from './auth'

export type ServerModule = 'TenantModule' | 'PawnModule'

export type ModuleDefinition = {
  id: string
  label: string
  routeSegment: string
  apiBasePath: string
  serverModule: ServerModule
  description: string
  listPermission: PermissionCode
  modulePermissions: PermissionCode[]
}

export const moduleRegistry: ModuleDefinition[] = [
  {
    id: 'customers',
    label: 'Customers',
    routeSegment: 'customers',
    apiBasePath: '/tenant/customers',
    serverModule: 'TenantModule',
    description: 'Customer search, identity details, and soft-delete lifecycle.',
    listPermission: 'list_customer',
    modulePermissions: ['list_customer', 'create_customer', 'update_customer', 'delete_customer'],
  },
  {
    id: 'collateral',
    label: 'Collateral',
    routeSegment: 'collateral',
    apiBasePath: '/tenant/collateral-items',
    serverModule: 'PawnModule',
    description: 'Jewellery and normal collateral item lookup and status tracking.',
    listPermission: 'list_collateral',
    modulePermissions: ['list_collateral', 'delete_collateral'],
  },
  {
    id: 'slips',
    label: 'Loan Slips',
    routeSegment: 'slips',
    apiBasePath: '/tenant/loan-contract-slips',
    serverModule: 'PawnModule',
    description: 'Pawn contract creation, lookup, document preview, and history.',
    listPermission: 'list_loan_contract',
    modulePermissions: ['list_loan_contract', 'create_loan_contract', 'delete_loan_contract'],
  },
  {
    id: 'interest',
    label: 'Interest Payments',
    routeSegment: 'interest',
    apiBasePath: '/tenant/interest-payments',
    serverModule: 'PawnModule',
    description: 'Interest calculation, payment posting, and unpaid debt handling.',
    listPermission: 'list_loan_contract',
    modulePermissions: ['list_loan_contract', 'create_loan_contract'],
  },
  {
    id: 'redemptions',
    label: 'Redemptions',
    routeSegment: 'redemptions',
    apiBasePath: '/tenant/redemptions',
    serverModule: 'PawnModule',
    description: 'Redeem calculation, collateral release, and redemption records.',
    listPermission: 'list_loan_contract',
    modulePermissions: ['list_loan_contract', 'create_loan_contract'],
  },
  {
    id: 'accounting',
    label: 'Accounting',
    routeSegment: 'accounting',
    apiBasePath: '/tenant/accounting',
    serverModule: 'TenantModule',
    description: 'Income and expense ledger entries created by financial operations.',
    listPermission: 'list_accounting',
    modulePermissions: ['list_accounting'],
  },
  {
    id: 'expenses',
    label: 'Expenses',
    routeSegment: 'expenses',
    apiBasePath: '/tenant/expenses',
    serverModule: 'TenantModule',
    description: 'Shop expense recording with accounting transaction support.',
    listPermission: 'list_expense',
    modulePermissions: ['list_expense', 'create_expense', 'update_expense', 'delete_expense'],
  },
  {
    id: 'debts',
    label: 'Debts',
    routeSegment: 'debts',
    apiBasePath: '/tenant/debts',
    serverModule: 'TenantModule',
    description: 'Unpaid interest and other tenant debt records.',
    listPermission: 'list_debt',
    modulePermissions: ['list_debt', 'create_debt', 'update_debt', 'delete_debt'],
  },
  {
    id: 'staff',
    label: 'Staff',
    routeSegment: 'staff',
    apiBasePath: '/tenant/users',
    serverModule: 'TenantModule',
    description: 'Tenant staff accounts, roles, and permissions.',
    listPermission: 'list_user',
    modulePermissions: ['list_user', 'create_user', 'update_user_admin', 'update_user_all', 'update_user_own', 'delete_user'],
  },
  {
    id: 'settings',
    label: 'Settings',
    routeSegment: 'settings',
    apiBasePath: '/tenant/branding/slip-layouts',
    serverModule: 'TenantModule',
    description: 'Tenant configuration, branding, and slip document layout controls.',
    listPermission: 'manage_slip_document',
    modulePermissions: ['manage_slip_document'],
  },
]
