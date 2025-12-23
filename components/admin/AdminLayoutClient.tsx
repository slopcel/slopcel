'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import AdminNavbar from './AdminNavbar';

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-black">
      {/* Admin Navbar */}
      <AdminNavbar onMenuClick={() => setSidebarOpen(true)} />
      
      {/* Main Content Area */}
      <div className="flex">
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
        />
        
        <main className="flex-1 overflow-auto min-h-[calc(100vh-64px)]">
          {children}
        </main>
      </div>
    </div>
  );
}
