'use client';

import React, { ButtonHTMLAttributes, forwardRef, ReactElement, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = 'primary', size = 'md', className = '', children, ...props },
    ref
  ): ReactElement {
    const pathname = usePathname();
    const isAdminPanelButton = pathname?.startsWith('/supersudo') ?? false;
    const showFoodIcons = isAdminPanelButton && variant !== 'ghost';
    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const [iconCount, setIconCount] = useState(3);
    const baseStyles = 'font-medium rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variantStyles = {
      primary: 'bg-gray-900 text-white hover:bg-gray-800 focus:ring-gray-900',
      secondary: 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 focus:ring-gray-500',
      outline: 'bg-transparent text-gray-900 border border-gray-300 hover:bg-gray-50 focus:ring-gray-500',
      ghost: 'bg-transparent text-gray-900 hover:bg-gray-100 focus:ring-gray-500',
    };
    
    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    useEffect(() => {
      if (!showFoodIcons || !buttonRef.current || typeof ResizeObserver === 'undefined') {
        return;
      }

      const currentButton = buttonRef.current;
      const updateIconCount = () => {
        const buttonWidth = currentButton.getBoundingClientRect().width;
        if (buttonWidth < 220) {
          setIconCount(0);
          return;
        }
        const nextCount = Math.max(3, Math.min(12, Math.floor(buttonWidth / 90)));
        setIconCount(nextCount);
      };

      updateIconCount();
      const resizeObserver = new ResizeObserver(updateIconCount);
      resizeObserver.observe(currentButton);
      return () => resizeObserver.disconnect();
    }, [showFoodIcons]);

    const icons = useMemo(() => ['🍕', '🍔', '🥗', '🍟', '🌮', '🍝'], []);

    const foodIcons = useMemo(
      () =>
        Array.from({ length: iconCount }).map((_, index) => {
          const icon = icons[index % icons.length];
          const leftPercent = ((index + 1) / (iconCount + 1)) * 100;
          const verticalPattern = [24, 50, 76];
          const animationPattern = ['admin-food-float-a', 'admin-food-float-b', 'admin-food-float-c'];

          return (
            <span
              key={`food-icon-${index}`}
              className="admin-food-icon"
              style={{
                left: `${leftPercent}%`,
                top: `${verticalPattern[index % verticalPattern.length]}%`,
                color: '#0f0f0f',
                animation: `${animationPattern[index % animationPattern.length]} ${
                  3.3 + (index % 3) * 0.6
                }s ease-in-out ${index * 0.14}s infinite`,
              }}
            >
              {icon}
            </span>
          );
        }),
      [iconCount, icons]
    );

    const handleButtonRef = (node: HTMLButtonElement | null) => {
      buttonRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };
    
    return (
      <button
        ref={handleButtonRef}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${showFoodIcons ? 'relative overflow-hidden' : ''} ${className}`}
        {...props}
      >
        {showFoodIcons && iconCount > 0 ? (
          <span className="admin-food-icon-wrap" aria-hidden>{foodIcons}</span>
        ) : null}
        <span className="relative z-10 inline-flex items-center justify-center gap-2">{children}</span>
      </button>
    );
  }
);

