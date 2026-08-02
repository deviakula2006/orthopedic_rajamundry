import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';

const Autocomplete = ({ options, value, onChange, placeholder, displayKey = 'name', idKey = 'id' }) => {
  const selectedItem = options.find((opt) => opt[idKey] === value);
  const [searchTerm, setSearchTerm] = useState(selectedItem ? selectedItem[displayKey] : '');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  const [prevSelectedItem, setPrevSelectedItem] = useState(selectedItem);
  if (prevSelectedItem !== selectedItem) {
    setPrevSelectedItem(selectedItem);
    setSearchTerm(selectedItem ? selectedItem[displayKey] : '');
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        if (selectedItem) {
          setSearchTerm(selectedItem[displayKey]);
        } else {
          setSearchTerm('');
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedItem, displayKey]);

  const filteredOptions = options.filter((opt) =>
    opt[displayKey]?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (item) => {
    onChange(item[idKey]);
    setSearchTerm(item[displayKey]);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setSearchTerm('');
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative">
        <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 pointer-events-none">
          <Search className="h-4 w-4" />
        </span>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder || 'Search...'}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-8 text-sm font-semibold text-slate-700 placeholder-slate-400 focus:border-hospital-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-hospital-500 transition-all"
        />
        {searchTerm ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <span className="absolute inset-y-0 right-3 flex items-center text-slate-400 pointer-events-none">
            <ChevronDown className="h-4 w-4" />
          </span>
        )}
      </div>

      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute left-0 mt-1 z-30 max-h-60 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
          {filteredOptions.map((opt) => (
            <button
              key={opt[idKey]}
              type="button"
              onClick={() => handleSelect(opt)}
              className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <span>{opt[displayKey]}</span>
              {opt[idKey] && <span className="text-[10px] text-slate-400 font-mono">({opt[idKey]})</span>}
            </button>
          ))}
        </div>
      )}
      {isOpen && filteredOptions.length === 0 && (
        <div className="absolute left-0 mt-1 z-30 w-full rounded-xl border border-slate-200 bg-white p-4 text-center text-xs font-semibold text-slate-400 shadow-xl">
          No matches found
        </div>
      )}
    </div>
  );
};

export default Autocomplete;
