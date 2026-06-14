import React from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import StatusTicker from './StatusTicker';

const Layout = ({ children, onAnalyze, isLoading, onOpenHistory }) => {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-black selection:text-white">
      <Sidebar onOpenHistory={onOpenHistory} />
      <main className="ml-20 md:ml-64 min-h-screen flex flex-col">
        <Navbar onAnalyze={onAnalyze} isLoading={isLoading} />
        <div className="flex-1 flex flex-col">
          {children}
          <StatusTicker />
        </div>
      </main>
    </div>
  );
};

export default Layout;
