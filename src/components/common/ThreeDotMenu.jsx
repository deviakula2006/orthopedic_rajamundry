import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ThreeDotMenu — actions dropdown rendered in a portal with intelligent
 * viewport-aware upward/downward and horizontal positioning.
 *
 * Props:
 *   options  Array<{ label, icon?, onClick, destructive? }>
 */
const MENU_WIDTH = 184; // px

const ThreeDotMenu = ({ options = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, openUpward: false });
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  /* ── Compute intelligent position ── */
  const computePosition = useCallback(() => {
    if (!btnRef.current) return null;
    const rect = btnRef.current.getBoundingClientRect();

    // Check if anchor button is still visible in viewport
    if (rect.bottom < 0 || rect.top > window.innerHeight) {
      return null;
    }

    const estimatedHeight = Math.max(72, options.length * 36 + 12);
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    // Flip upward if insufficient space below and more space above
    const openUpward = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;

    let top = openUpward
      ? rect.top - estimatedHeight - 4
      : rect.bottom + 4;

    // Clamp inside viewport vertical boundaries
    if (top < 8) top = 8;
    if (top + estimatedHeight > window.innerHeight - 8) {
      top = Math.max(8, window.innerHeight - estimatedHeight - 8);
    }

    // Align with right edge of button, flip or clamp if overflowing
    let left = rect.right - MENU_WIDTH;
    if (left < 8) left = 8;
    if (left + MENU_WIDTH > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - MENU_WIDTH - 8);
    }

    return { top, left, openUpward };
  }, [options.length]);

  const updatePosition = useCallback(() => {
    const next = computePosition();
    if (next) {
      setCoords(next);
    } else {
      setIsOpen(false);
    }
  }, [computePosition]);

  /* ── Close on outside click ── */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (
        btnRef.current && !btnRef.current.contains(e.target) &&
        menuRef.current && !menuRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  /* ── Close on Escape key ── */
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  /* ── Keep position attached on scroll and resize ── */
  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = () => {
      updatePosition();
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen, updatePosition]);

  /* ── Toggle open state ── */
  const handleToggle = useCallback((e) => {
    e.stopPropagation();
    if (!isOpen) {
      const pos = computePosition();
      if (pos) setCoords(pos);
    }
    setIsOpen(v => !v);
  }, [isOpen, computePosition]);

  return (
    <>
      {/* Trigger button */}
      <button
        ref={btnRef}
        type="button"
        onClick={handleToggle}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 28, height: 28, borderRadius: 6,
          border: '1px solid transparent',
          background: 'transparent',
          color: '#9ca3af',
          cursor: 'pointer',
          transition: 'all 100ms',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background    = '#f3f4f6';
          e.currentTarget.style.borderColor   = '#e5e7eb';
          e.currentTarget.style.color         = '#374151';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background    = 'transparent';
          e.currentTarget.style.borderColor   = 'transparent';
          e.currentTarget.style.color         = '#9ca3af';
        }}
        aria-label="Row Actions"
      >
        <MoreHorizontal style={{ width: 15, height: 15 }} />
      </button>

      {/* Dropdown rendered in a PORTAL — completely escapes table overflow clipping */}
      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={menuRef}
              initial={{
                opacity: 0,
                scale: 0.94,
                y: coords.openUpward ? 6 : -6
              }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{
                opacity: 0,
                scale: 0.94,
                y: coords.openUpward ? 6 : -6
              }}
              transition={{ duration: 0.12, ease: 'easeOut' }}
              style={{
                position: 'fixed',
                top: coords.top,
                left: coords.left,
                zIndex: 99999,
                minWidth: MENU_WIDTH,
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: 10,
                padding: '4px',
                boxShadow: '0 10px 28px rgba(0,0,0,0.15), 0 3px 8px rgba(0,0,0,0.06)',
              }}
            >
              {options.map((opt, idx) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsOpen(false);
                      if (opt.onClick) {
                        opt.onClick();
                      }
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '7px 10px', borderRadius: 6, width: '100%',
                      fontSize: '0.8125rem', fontWeight: 500,
                      color: opt.destructive ? '#dc2626' : '#111827',
                      cursor: 'pointer', transition: 'background 100ms',
                      background: 'transparent', border: 'none', textAlign: 'left',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = opt.destructive ? '#fff1f2' : '#f3f4f6';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {Icon && <Icon style={{ width: 14, height: 14, flexShrink: 0 }} />}
                    {opt.label}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default ThreeDotMenu;
