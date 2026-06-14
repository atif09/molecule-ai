import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { name: 'ANALYZE', icon: 'biotech', path: '/analyzer' },
  { name: 'COMPARE', icon: 'compare_arrows', path: '/compare' },
  { name: 'SYNTHESIS', icon: 'precision_manufacturing', path: '/synthesis' },
  { name: 'LIBRARY', icon: 'menu_book', path: '#' },
  { name: 'HISTORY', icon: 'history', path: '#history' },
];

const Sidebar = ({ onOpenHistory }) => {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 h-full flex flex-col py-8 px-4 z-40 bg-white w-20 md:w-64 border-r border-black">
      {/* Logo */}
      <Link to="/" className="mb-10 px-1 block group hover:opacity-70 transition-opacity">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-black flex items-center justify-center border border-black flex-shrink-0">
            <span className="material-symbols-outlined text-white text-lg">science</span>
          </div>
          <div className="hidden md:block">
            <h1 className="font-black text-black text-base leading-none">MoleculeAI</h1>
            <p className="font-mono text-[11px] uppercase tracking-widest text-gray-400 mt-1">Drug Discovery</p>
          </div>
        </div>
      </Link>

      <nav className="flex-1 space-y-1.5">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const isHistory = item.name === 'HISTORY';

          const content = (
            <>
              {/* Icon box with black border */}
              <span className={`flex-shrink-0 w-8 h-8 flex items-center justify-center border ${
                isActive ? 'bg-black border-black' : 'border-black bg-white'
              }`}>
                <span
                  className={`material-symbols-outlined text-[20px] ${isActive ? 'text-white' : 'text-black'}`}
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  {item.icon}
                </span>
              </span>
              <span className={`hidden md:block truncate font-mono text-[12px] uppercase tracking-widest ${
                isActive ? 'text-black font-bold' : 'text-gray-600'
              }`}>
                {item.name}
              </span>
            </>
          );

          const baseClass = `flex items-center gap-3 px-1 py-2 transition-all w-full text-left rounded-none ${
            isActive ? 'bg-gray-50' : 'hover:bg-gray-50'
          }`;

          if (isHistory) {
            return (
              <button key={item.name} onClick={onOpenHistory} className={baseClass}>
                {content}
              </button>
            );
          }

          return (
            <Link key={item.name} to={item.path} className={baseClass}>
              {content}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3">
        <button className="hidden md:flex w-full bg-black text-white font-bold py-3 px-4 text-xs font-mono uppercase tracking-widest items-center justify-center gap-2 hover:bg-gray-800 transition-colors border border-black">
          <span className="material-symbols-outlined text-sm">add</span>
          New Experiment
        </button>
        <div className="pt-4 space-y-1 border-t border-gray-100">
          <a className="flex items-center gap-3 px-1 py-2 text-gray-400 hover:text-black transition-colors" href="#">
            <span className="w-8 h-8 flex items-center justify-center border border-gray-200 flex-shrink-0">
              <span className="material-symbols-outlined text-lg">description</span>
            </span>
          </a>
          <a className="flex items-center gap-3 px-1 py-2 text-gray-400 hover:text-black transition-colors" href="#">
            <span className="w-8 h-8 flex items-center justify-center border border-gray-200 flex-shrink-0">
              <span className="material-symbols-outlined text-lg">contact_support</span>
            </span>
          </a>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
