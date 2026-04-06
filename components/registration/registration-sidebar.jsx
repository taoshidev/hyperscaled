"use client";

import { useState } from "react";
import { SidebarContent } from "./sidebar-content";

export function RegistrationSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      aria-label="Registration help"
      className={`hidden lg:block shrink-0 sticky top-6 max-h-[calc(100dvh-4rem)] transition-[width] duration-200 ${
        collapsed ? "w-12" : "w-96"
      }`}
    >
      <SidebarContent
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
      />
    </aside>
  );
}
