import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const labelVariants = cva(
  'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
);

const PreLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root ref={ref} className={cn(labelVariants(), className)} {...props} />
));
PreLabel.displayName = LabelPrimitive.Root.displayName;

interface LabelPropsShimmer extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> {
  className?: string;
  isPending?: boolean;
}

export const Label = ({ className, isPending = false, ...props }: LabelPropsShimmer) => {
  if (isPending) {
    return (
      <PreLabel
        className={cn('animate-pulse rounded disabled:cursor-auto opacity-10', className)}
        {...props}></PreLabel>
    );
  }
  return <PreLabel className={className} {...props}></PreLabel>;
};
