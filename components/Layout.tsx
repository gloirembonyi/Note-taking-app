//component/Layout.tsx

import React, { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex-1 min-h-screen">
      <div>
        <Header />
      </div>
      <div className="flex">
        <Sidebar />
        <div className="flex-1">
          <main className="p-0.5 shadow-sm">{children}</main>
        </div>
      </div>
    </div>
  );
};

export default Layout;
