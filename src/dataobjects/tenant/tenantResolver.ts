import type { TenantDetail } from './tenant'

export type TenantResolveState =
  | { status: 'idle'; subdomain: null; tenant: null; error: null }
  | { status: 'loading'; subdomain: string | null; tenant: null; error: null }
  | { status: 'resolved'; subdomain: string | null; tenant: TenantDetail; error: null }
  | { status: 'failed'; subdomain: string | null; tenant: null; error: string }
