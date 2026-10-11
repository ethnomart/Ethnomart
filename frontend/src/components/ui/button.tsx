import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff540a] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-[#ff540a] text-white hover:bg-[#e44808] rounded-full',
        destructive: 'bg-[#e74c3c] text-white hover:bg-[#c0392b] rounded-full',
        outline:
          'border-2 border-[#1d1d1d] bg-transparent text-[#1d1d1d] hover:bg-[#1d1d1d] hover:text-white rounded-full',
        secondary: 'bg-[#1d1d1d] text-white hover:bg-[#333333] rounded-full',
        ghost: 'bg-transparent text-[#1d1d1d] hover:bg-[#eeeeee] rounded-full',
        link: 'text-[#ff540a] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-6 py-2 text-sm',
        sm: 'h-8 px-4 py-1 text-xs',
        lg: 'h-12 px-8 py-3 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
