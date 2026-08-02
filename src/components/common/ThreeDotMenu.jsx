import { useState, useRef, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';

const ThreeDotMenu = ({ options }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors focus:outline-none"
      >
        <MoreVertical className="h-4.5 w-4.5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 z-30 w-48 origin-top-right rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl ring-1 ring-black/5 focus:outline-none">
          {options.map((option, idx) => {
            const Icon = option.icon;
            return (
              <button
                key={idx}
                onClick={() => {
                  setIsOpen(false);
                  option.onClick();
                }}
                className={`flex w-full items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  option.destructive
                    ? 'text-red-600 hover:bg-red-50'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {Icon && <Icon className="h-4 w-4 shrink-0" />}
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ThreeDotMenu;
