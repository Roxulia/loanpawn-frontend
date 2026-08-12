import type { TenantUser } from '../../dataobjects/tenant/auth'

export const permissionCodes = [
  'access_all',
  'list_user',
  'create_user',
  'delete_user',
  'update_user_admin',
  'update_user_all',
  'update_user_own',
  'create_admin_user',
  'update_admin_user',
  'delete_admin_user',
  'assign_admin_permissions',
  'list_customer',
  'create_customer',
  'delete_customer',
  'update_customer',
  'list_collateral',
  'delete_collateral',
  'list_accounting',
  'open_accounting_day',
  'close_accounting_day',
  'list_financial_account_type',
  'create_financial_account_type',
  'update_financial_account_type',
  'delete_financial_account_type',
  'list_financial_account',
  'create_financial_account',
  'update_financial_account',
  'delete_financial_account',
  'list_material_type',
  'create_material_type',
  'update_material_type',
  'delete_material_type',
  'list_interest_type',
  'create_interest_type',
  'update_interest_type',
  'delete_interest_type',
  'list_item_category_type',
  'create_item_category_type',
  'update_item_category_type',
  'delete_item_category_type',
  'list_expense_type',
  'create_expense_type',
  'update_expense_type',
  'delete_expense_type',
  'list_expense',
  'create_expense',
  'update_expense',
  'delete_expense',
  'list_capital',
  'create_capital',
  'update_capital',
  'delete_capital',
  'list_debt',
  'create_debt',
  'update_debt',
  'delete_debt',
  'list_loan_contract',
  'create_loan_contract',
  'delete_loan_contract',
  'manage_slip_document',
  'list_currency',
  'create_currency',
  'update_currency',
  'delete_currency',
  'list_exchange_pair',
  'create_exchange_pair',
  'update_exchange_pair',
  'delete_exchange_pair',
  'list_exchange_rate',
  'create_exchange_rate',
  'correct_exchange_rate',
  'void_exchange_rate',
  'manage_tenant_timezone',
  'dashboard'
] as const

export type PermissionCode = (typeof permissionCodes)[number]

const permissionCodeSet = new Set<string>(permissionCodes)

export function hasPermission(user: TenantUser | null, permission: PermissionCode) {
  if (!user?.permissions) {
    return false
  }

  return user.permissions.includes('access_all') || user.permissions.includes(permission)
}

export function hasAnyPermission(user: TenantUser | null, permissions: PermissionCode[]) {
  return permissions.some((permission) => hasPermission(user, permission))
}

export function hasAllPermissions(user: TenantUser | null, permissions: PermissionCode[]) {
  return permissions.every((permission) => hasPermission(user, permission))
}

export function isPermissionCode(value: string): value is PermissionCode {
  return permissionCodeSet.has(value)
}
