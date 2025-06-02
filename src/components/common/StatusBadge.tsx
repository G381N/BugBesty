"use client";

import { useState, useRef, useEffect } from 'react';

interface StatusBadgeProps {
  status: string;
  onStatusChange: (newStatus: string) => void;
  position?: 'top' | 'bottom';
  badgeId: string;
  openStatusId: string | null;
  setOpenStatusId: (id: string | null) => void;
}

export default function StatusBadge({ 
  status, 
  onStatusChange, 
  position = 'bottom',
  badgeId,
  openStatusId,
  setOpenStatusId
}: StatusBadgeProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropDirection, setDropDirection] = useState<'top' | 'bottom'>('bottom');
  
  const isOpen = openStatusId === badgeId;

  useEffect(() => {
    // Check if we need to flip the dropdown direction
    if (buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const spaceBelow = windowHeight - buttonRect.bottom;
      
      // If space below is less than 150px, show dropdown above
      setDropDirection(spaceBelow < 150 ? 'top' : 'bottom');
    }
  }, [isOpen]);

  const handleClick = () => {
    if (isOpen) {
      setOpenStatusId(null);
    } else {
      setOpenStatusId(badgeId);
    }
  };

  const getStatusColor = (statusType: string) => {
    switch (statusType.toLowerCase()) {
      case 'found':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'not found':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={handleClick}
        className={`px-3 py-1 rounded-full text-sm border ${getStatusColor(status)} hover:opacity-80 transition-opacity`}
      >
        {status}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setOpenStatusId(null)}
          />
          <div 
            className={`absolute ${
              dropDirection === 'top' 
                ? 'bottom-full mb-2' 
                : 'top-full mt-2'
            } right-0 w-32 bg-secondary rounded-lg border border-white/10 shadow-lg z-20`}
          >
            {['Found', 'Not Found', 'Not Yet Done'].map((option) => (
              <button
                key={option}
                onClick={() => {
                  onStatusChange(option);
                  setOpenStatusId(null);
                }}
                className={`w-full px-4 py-2 text-sm text-left hover:bg-white/5 transition-colors
                  ${option === status ? 'text-primary' : 'text-foreground/70'}
                  ${option === 'Found' ? 'rounded-t-lg' : ''}
                  ${option === 'Not Yet Done' ? 'rounded-b-lg' : ''}`}
              >
                {option}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
} 