'use client';

// Author: Bin Lee (blee@filynai.com)
// Description: Lightweight tooltip component for displaying contextual hints on hover.
import React, { useState } from 'react';

interface SimpleTooltipProps {
  content: string;
  children: React.ReactElement;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

export function SimpleTooltip({
  content,
  children,
  side = 'top',
}: SimpleTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const sideClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div className='relative inline-block'>
      {React.cloneElement(children, {
        onMouseEnter: () => setIsVisible(true),
        onMouseLeave: () => setIsVisible(false),
      })}
      {isVisible && (
        <div
          className={`absolute z-50 px-2 py-1 text-xs text-white bg-black rounded shadow-lg whitespace-nowrap pointer-events-none ${sideClasses[side]}`}
        >
          {content}
        </div>
      )}
    </div>
  );
}
