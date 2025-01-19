"use client";

import { Dashboard } from "@/components/dashboard";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function Home() {
  return (
    <div suppressHydrationWarning>
      <TooltipProvider>
        <Dashboard />
      </TooltipProvider>
    </div>
  );
}