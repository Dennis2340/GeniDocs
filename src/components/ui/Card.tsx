'use client';

import { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  description?: string;
  footer?: ReactNode;
  noPadding?: boolean;
  variant?: 'default' | 'elevated' | 'outlined' | 'flat';
  onClick?: () => void;
}

export default function Card({
  children,
  className,
  title,
  description,
  footer,
  noPadding = false,
  variant = 'default',
  onClick,
}: CardProps) {
  const baseStyles = 'rounded-lg overflow-hidden transition-all duration-200';
  
  const variants = {
    default: 'bg-white border border-gray-200 shadow-sm',
    elevated: 'bg-white border border-gray-100 shadow-md',
    outlined: 'bg-white border border-gray-200',
    flat: 'bg-gray-50',
  };
  
  const clickableStyles = onClick ? 'cursor-pointer hover:shadow-md' : '';
  const contentPadding = noPadding ? '' : 'p-6';
  
  return (
    <div
      className={twMerge(
        baseStyles,
        variants[variant],
        clickableStyles,
        className
      )}
      onClick={onClick}
    >
      {(title || description) && (
        <div className="px-6 py-4 border-b border-gray-200">
          {title && <h3 className="text-lg font-medium text-gray-900">{title}</h3>}
          {description && (
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          )}
        </div>
      )}
      <div className={contentPadding}>{children}</div>
      {footer && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          {footer}
        </div>
      )}
    </div>
  );
} 