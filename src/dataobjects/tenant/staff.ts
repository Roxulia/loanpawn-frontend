export type TenantUserCreateResponse = {
    username : string,
    name : string,
    email : string,
    password : string,
    roleName?: string,
    role_name?: string
}

export type TenantRoleOption = {
    role_id: number
    role_name: string
}
