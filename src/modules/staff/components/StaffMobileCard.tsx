import type { ReactNode } from 'react'
import { Badge } from '../../../components/atoms'
import { ChevronRightIcon } from '../../../components/icons/icon'
import type { TenantUser } from '../../../dataobjects/tenant/auth'
import { getUserRoleName } from '../staffFormat'

type StaffMobileCardProps = {
  actions?: ReactNode
  onView: () => void
  user: TenantUser
}

export function StaffMobileCard({ actions, onView, user }: StaffMobileCardProps) {
  return (
    <article className="staff-mobile-card">
      <button
        aria-label={`View ${user.name}`}
        className="staff-mobile-card__details-target"
        onClick={onView}
        type="button"
      >
        <span className="staff-mobile-card__header">
          <span className="staff-mobile-card__identity">
            <strong>{user.name}</strong>
            <small>@{user.username}</small>
          </span>
          <span className="staff-mobile-card__badges">
            <Badge tone="info">{getUserRoleName(user)}</Badge>
            <Badge tone={user.status === 'active' ? 'success' : 'warning'}>{user.status}</Badge>
          </span>
        </span>

        <span className="staff-mobile-card__contact">
          <span>
            <small>Phone</small>
            <strong>{user.phone || 'Not provided'}</strong>
          </span>
          <span>
            <small>Email</small>
            <strong>{user.email || 'Not provided'}</strong>
          </span>
        </span>
      </button>

      <footer className="staff-mobile-card__footer">
        <button className="staff-mobile-card__view" onClick={onView} type="button">
          <span>View details</span>
          <ChevronRightIcon />
        </button>
        {actions && <div className="staff-mobile-card__actions">{actions}</div>}
      </footer>
    </article>
  )
}
