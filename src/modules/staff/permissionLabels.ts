import type { PermissionCode } from '../auth'

export type PermissionOption = {
  code: PermissionCode
  description: string
  label: string
}

export type PermissionGroup = {
  label: string
  permissions: PermissionOption[]
}

export const permissionGroups: PermissionGroup[] = [
  {
    label: 'Staff',
    permissions: [
      { code: 'list_user', label: 'View staff records', description: 'Open staff list and staff profiles.' },
      { code: 'create_user', label: 'Create staff accounts', description: 'Add new tenant users.' },
      { code: 'update_user_admin', label: 'Manage staff roles and permissions', description: 'Change status, role, and permission settings.' },
      { code: 'update_user_all', label: 'Edit any staff profile', description: 'Update profile details for other staff.' },
      { code: 'update_user_own', label: 'Edit own profile', description: 'Update only their own profile details.' },
      { code: 'delete_user', label: 'Deactivate staff accounts', description: 'Disable staff accounts.' },
      { code: 'create_admin_user', label: 'Create Admin accounts', description: 'Assign the Admin role to new staff accounts.' },
      { code: 'update_admin_user', label: 'Edit Admin accounts', description: 'Update profiles, roles, status, and passwords for Admin accounts.' },
      { code: 'delete_admin_user', label: 'Deactivate Admin accounts', description: 'Disable staff accounts that have the Admin role.' },
      { code: 'assign_admin_permissions', label: 'Assign Admin permissions', description: 'Change permission settings for Admin accounts.' },
    ],
  },
  {
    label: 'Customers',
    permissions: [
      { code: 'list_customer', label: 'View customers', description: 'See customer records and profiles.' },
      { code: 'create_customer', label: 'Create customers', description: 'Add customer records.' },
      { code: 'update_customer', label: 'Edit customers', description: 'Update customer records.' },
      { code: 'delete_customer', label: 'Delete customers', description: 'Remove invalid customer records.' },
    ],
  },
  {
    label: 'Collateral',
    permissions: [
      { code: 'list_collateral', label: 'View collateral', description: 'See collateral records and details.' },
      { code: 'delete_collateral', label: 'Delete collateral', description: 'Remove invalid collateral records.' },
    ],
  },
  {
    label: 'Loan slips',
    permissions: [
      { code: 'list_loan_contract', label: 'View loan slips', description: 'See slip records, interest, redemption, and documents.' },
      { code: 'create_loan_contract', label: 'Create slip operations', description: 'Create slips, interest payments, and redemptions.' },
      { code: 'delete_loan_contract', label: 'Delete loan slips', description: 'Delete invalid loan slip records.' },
      { code: 'manage_slip_document', label: 'Manage slip document layout', description: 'Update printable slip document settings.' },
    ],
  },
  {
    label: 'Finance',
    permissions: [
      { code: 'list_accounting', label: 'View accounting', description: 'See income and expense ledger records.' },
      { code: 'list_financial_account_type', label: 'View financial account types', description: 'See built-in and tenant financial account types.' },
      { code: 'create_financial_account_type', label: 'Create financial account types', description: 'Add tenant-owned financial account types.' },
      { code: 'update_financial_account_type', label: 'Edit financial account types', description: 'Update tenant-owned financial account types.' },
      { code: 'delete_financial_account_type', label: 'Delete financial account types', description: 'Deactivate tenant-owned financial account types.' },
      { code: 'list_material_type', label: 'View material types', description: 'See built-in and tenant material types.' },
      { code: 'create_material_type', label: 'Create material types', description: 'Add tenant-owned material types.' },
      { code: 'update_material_type', label: 'Edit material types', description: 'Update tenant-owned material types.' },
      { code: 'delete_material_type', label: 'Delete material types', description: 'Delete tenant-owned material types.' },
      { code: 'list_interest_type', label: 'View interest types', description: 'See built-in and tenant interest types.' },
      { code: 'create_interest_type', label: 'Create interest types', description: 'Add tenant-owned interest types.' },
      { code: 'update_interest_type', label: 'Edit interest types', description: 'Update tenant-owned interest types.' },
      { code: 'delete_interest_type', label: 'Delete interest types', description: 'Delete tenant-owned interest types.' },
      { code: 'list_item_category_type', label: 'View item category types', description: 'See built-in and tenant item category types.' },
      { code: 'create_item_category_type', label: 'Create item category types', description: 'Add tenant-owned item category types.' },
      { code: 'update_item_category_type', label: 'Edit item category types', description: 'Update tenant-owned item category types.' },
      { code: 'delete_item_category_type', label: 'Delete item category types', description: 'Delete tenant-owned item category types.' },
      { code: 'list_expense_type', label: 'View expense types', description: 'See built-in and tenant expense types.' },
      { code: 'create_expense_type', label: 'Create expense types', description: 'Add tenant-owned expense types.' },
      { code: 'update_expense_type', label: 'Edit expense types', description: 'Update tenant-owned expense types.' },
      { code: 'delete_expense_type', label: 'Delete expense types', description: 'Delete tenant-owned expense types.' },
      { code: 'list_expense', label: 'View expenses', description: 'See shop expense records.' },
      { code: 'create_expense', label: 'Create expenses', description: 'Add shop expense records.' },
      { code: 'update_expense', label: 'Edit expenses', description: 'Update expense records.' },
      { code: 'delete_expense', label: 'Delete expenses', description: 'Remove expense records.' },
      { code: 'list_capital', label: 'View capital', description: 'See shop capital records.' },
      { code: 'create_capital', label: 'Create capital', description: 'Add shop capital records.' },
      { code: 'update_capital', label: 'Edit capital', description: 'Update capital records.' },
      { code: 'delete_capital', label: 'Delete capital', description: 'Remove capital records.' },
      { code: 'list_debt', label: 'View debts', description: 'See unpaid debt records.' },
      { code: 'create_debt', label: 'Create debts', description: 'Add debt records.' },
      { code: 'update_debt', label: 'Edit debts', description: 'Update or mark debt records.' },
      { code: 'delete_debt', label: 'Delete debts', description: 'Remove debt records.' },
      { code: 'manage_tenant_timezone', label: 'Manage business timezone', description: 'Choose the timezone used for tenant business-day boundaries.' },
    ],
  },
]

export function getPermissionLabel(code: string) {
  return permissionGroups
    .flatMap((group) => group.permissions)
    .find((permission) => permission.code === code)?.label ?? code
}
