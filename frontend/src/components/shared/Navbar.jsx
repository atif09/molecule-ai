import React, { useState } from 'react';

const Navbar = ({ onAnalyze, isLoading }) => {
  const [value, setValue] = useState('');

  const handleSubmit = () => {
    if (value.trim() && onAnalyze) onAnalyze(value.trim());
  };

  return (
    <header className="flex justify-between items-center w-full px-8 py-4 bg-white border-b border-black z-30 sticky top-0">
      <div className="flex items-center gap-8">
        <span className="font-bold text-base tracking-tight text-black uppercase">Molecular Intelligence</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative hidden sm:block">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">search</span>
          <input
            className="bg-white border border-black text-sm font-mono py-2 pl-9 pr-10 w-64 focus:outline-none focus:ring-0 text-black placeholder:text-gray-400"
            placeholder="Molecule name or SMILES..."
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
          {isLoading ? (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 border border-black border-t-white rounded-full animate-spin" />
          ) : (
            value && (
              <button
                onClick={handleSubmit}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black transition-colors"
              >
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            )
          )}
        </div>
        <div className="flex items-center gap-2 text-gray-500">
          <button className="w-8 h-8 flex items-center justify-center border border-black hover:bg-black hover:text-white transition-all">
            <span className="material-symbols-outlined text-[18px]">science</span>
          </button>
          <button className="w-8 h-8 flex items-center justify-center border border-black hover:bg-black hover:text-white transition-all">
            <span className="material-symbols-outlined text-[18px]">settings</span>
          </button>
          <button className="w-8 h-8 flex items-center justify-center border border-black hover:bg-black hover:text-white transition-all relative">
            <span className="material-symbols-outlined text-[18px]">notifications</span>
            <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-black rounded-full"></span>
          </button>
          <div className="w-8 h-8 border border-black flex items-center justify-center ml-1 cursor-pointer hover:bg-black hover:text-white transition-all">
            <span className="material-symbols-outlined text-[18px]">person</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
