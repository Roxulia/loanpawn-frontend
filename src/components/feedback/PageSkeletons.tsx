import { Card } from '../molecules'
import { LoadingState, Skeleton } from './LoadingState'

export function DashboardSkeleton() {
  return (
    <div className="page">
      <LoadingState rows={2} />
      <div className="module-grid">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <LoadingState rows={3} />
          </Card>
        ))}
      </div>
    </div>
  )
}

export function TablePageSkeleton() {
  return (
    <div className="page">
      <LoadingState rows={2} />
      <Card>
        <Skeleton variant="control" />
        <LoadingState rows={6} />
      </Card>
    </div>
  )
}

export function FormPageSkeleton() {
  return (
    <div className="page">
      <LoadingState rows={2} />
      <Card>
        <div className="ui-form-group__grid ui-form-group__grid--2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} variant="control" />
          ))}
        </div>
      </Card>
    </div>
  )
}

export function DetailPageSkeleton() {
  return (
    <div className="page">
      <LoadingState rows={2} />
      <Card>
        <LoadingState rows={8} />
      </Card>
    </div>
  )
}
