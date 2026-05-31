type SkeletonVariant = 'line' | 'short' | 'control'

type SkeletonProps = {
  variant?: SkeletonVariant
}

type LoadingStateProps = {
  rows?: number
  variant?: SkeletonVariant
}

export function Skeleton({ variant = 'line' }: SkeletonProps) {
  return <div className={`ui-skeleton ui-skeleton--${variant}`} aria-hidden="true" />
}

export function LoadingState({ rows = 4, variant = 'line' }: LoadingStateProps) {
  return (
    <div className="ui-loading-stack" role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} variant={index === 0 ? 'short' : variant} />
      ))}
    </div>
  )
}
