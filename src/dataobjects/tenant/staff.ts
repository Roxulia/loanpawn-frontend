export type TenantUserCreateResponse = {
    username : string,
    name : string,
    email : string,
    password : string,
    roleName : string
}

export type TenantRoleOption = {
    role_id: number
    role_name: string
}
