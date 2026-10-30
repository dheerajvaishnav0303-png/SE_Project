import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Editorial Slide-Over Sheet
 * Right-anchored full-height drawer replacing centered modals across all transactional flows.
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

      <div className="fixed inset-y-0 right-0 flex pl-10">
        <div className={`w-screen ${width} bg-white border-l border-[#E5E4DF] flex flex-col shadow-none`}>
          {/* Header */}
          <div className="p-6 border-b border-[#E5E4DF] flex items-start justify-between bg-[#FAF9F5]">
            <div>
              <h2 className="text-xl font-serif font-medium text-[#111827] tracking-tight">
                {title}
              </h2>
              {subtitle && (
                <p className="text-xs text-[#4B5563] mt-1 font-normal">
                  {subtitle}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-[#4B5563] hover:text-[#111827] hover:bg-[#E5E4DF] transition-colors rounded-none"
              title="Close drawer (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div className="flex-1 overflow-y-auto p-6 bg-white">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

