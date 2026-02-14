interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  count?: number;
}

export const Skeleton = ({ 
  className = '', 
  variant = 'rectangular',
  width,
  height,
  count = 1
}: SkeletonProps) => {
  const baseClass = 'animate-pulse bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 bg-[length:200%_100%]';
  
  const variantClass = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  }[variant];

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  const skeletons = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className={`${baseClass} ${variantClass} ${className}`}
      style={style}
    />
  ));

  return count > 1 ? <div className="space-y-2">{skeletons}</div> : skeletons[0];
};

export const SkeletonCard = () => (
  <div className="card p-6 space-y-4">
    <div className="flex items-center justify-between">
      <Skeleton variant="text" width={120} />
      <Skeleton variant="circular" width={40} height={40} />
    </div>
    <Skeleton variant="text" width="60%" height={32} />
    <div className="flex gap-2">
      <Skeleton variant="rectangular" width={80} height={24} />
      <Skeleton variant="rectangular" width={80} height={24} />
    </div>
  </div>
);

export const SkeletonTable = ({ rows = 5 }: { rows?: number }) => (
  <div className="space-y-3">
    <div className="flex gap-4 pb-3 border-b border-neutral-200">
      <Skeleton width="30%" height={20} />
      <Skeleton width="20%" height={20} />
      <Skeleton width="15%" height={20} />
      <Skeleton width="20%" height={20} />
      <Skeleton width="15%" height={20} />
    </div>
    {Array.from({ length: rows }, (_, i) => (
      <div key={i} className="flex gap-4 py-3">
        <Skeleton width="30%" height={16} />
        <Skeleton width="20%" height={16} />
        <Skeleton width="15%" height={16} />
        <Skeleton width="20%" height={16} />
        <Skeleton width="15%" height={16} />
      </div>
    ))}
  </div>
);

export const SkeletonMetricCard = () => (
  <div className="card p-6 space-y-3">
    <div className="flex items-center justify-between">
      <Skeleton variant="text" width={100} />
      <Skeleton variant="circular" width={48} height={48} />
    </div>
    <Skeleton variant="text" width="70%" height={36} />
    <Skeleton variant="text" width="40%" height={20} />
  </div>
);
