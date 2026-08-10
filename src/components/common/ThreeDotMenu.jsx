import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ThreeDotMenu — actions dropdown rendered in a portal so it
 * escapes ANY overflow:hidden / overflow:auto ancestor (table wrappers, cards etc.)
 *
 * Props:
 *   options  Array<{ label, icon?, onClick, destructive? }>
 */
const MENU_WIDTH = 176; // px — keep in sync with minWidth below

const ThreeDotMenu = ({ options }) => {
  const [isOpen, setIsOpen]   = useState(false);
  const [coords, setCoords]   = useState({ top: 0, left: 0 });
  const btnRef                = useRef(null);

  /* ── Close on outside click ── */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (btnRef.current && !btnRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  /* ── Close on scroll ── */
  useEffect(() => {
    if (!isOpen) return;
    const handler = () => setIsOpen(false);
    window.addEventListener('scroll', handler, true);
    return () => window.removeEventListener('scroll', handler, true);
  }, [isOpen]);

  /* ── Recompute position when opening ── */
  const handleToggle = useCallback(() => {
    if (!isOpen && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      // Flip left if would overflow right edge of viewport
      const left = rect.right - MENU_WIDTH < 8
        ? rect.left
        : rect.right - MENU_WIDTH;
      setCoords({
        top:  rect.bottom + 4,   // 4px gap below button
        left: Math.max(8, left),
      });
    }
    setIsOpen(v => !v);
  }, [isOpen]);

  return (
    <>
      {/* Trigger button */}
      <button
        ref={btnRef}
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
      >
        <MoreHorizontal style={{ width: 15, height: 15 }} />
      </button>

      {/* Dropdown rendered in a PORTAL — escapes all overflow contexts */}
      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: -4 }}
              animate={{ opacity: 1, scale: 1,    y: 0  }}
              exit={{   opacity: 0, scale: 0.94, y: -4  }}
              transition={{ duration: 0.1, ease: 'easeOut' }}
              style={{
                position: 'fixed',
                top:  coords.top,
                left: coords.left,
                zIndex: 9999,
                minWidth: MENU_WIDTH,
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: 10,
                padding: '4px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.06)',
              }}
            >
              {options.map((opt, idx) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => { setIsOpen(false); opt.onClick(); }}
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
