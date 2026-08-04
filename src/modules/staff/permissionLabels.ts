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
    ],
  },
]

export function getPermissionLabel(code: string) {
  return permissionGroups
    .flatMap((group) => group.permissions)
    .find((permission) => permission.code === code)?.label ?? code
}
