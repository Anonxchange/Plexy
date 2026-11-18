import { cn } from '@/lib/utils';
import { Loader2Icon } from '@/lib/icons';

function Spinner({
  className,
  strokeWidth,
  ...props
}: Omit<React.ComponentProps<'svg'>, 'strokeWidth'> & { strokeWidth?: number }) {
  return (
    <Loader2Icon
      role="status"
      aria-label="Loading"
      className={cn('size-4 animate-spin', className)}
      strokeWidth={strokeWidth}
      {...props}
    />
  );
}

export { Spinner };
