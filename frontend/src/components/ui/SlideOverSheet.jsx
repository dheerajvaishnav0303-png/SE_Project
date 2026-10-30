import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Editorial Slide-Over Sheet
 * Right-anchored drawer on desktop, full-width responsive drawer on mobile viewports.
 */
export function SlideOverSheet({ isOpen, onClose, title, subtitle, children, width = 'max-w-lg' }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Daylight Muted Backdrop */}
      <div
        className="fixed inset-0 bg-[#111827]/25 backdrop-blur-[1px] transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 flex pl-0 sm:pl-10 w-full sm:w-auto">
        <div className={`w-full sm:${width} bg-white sm:border-l border-[#E5E4DF] flex flex-col shadow-none h-full`}>
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-[#E5E4DF] flex items-start justify-between bg-[#FAF9F5] shrink-0">
            <div>
              <h2 className="text-lg sm:text-xl font-serif font-medium text-[#111827] tracking-tight">
                {title}
              </h2>
              {subtitle && (
                <p className="text-xs text-[#4B5563] mt-0.5 sm:mt-1 font-normal">
                  {subtitle}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-[#4B5563] hover:text-[#111827] hover:bg-[#E5E4DF] transition-colors rounded-none touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Close drawer (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white pb-10">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
