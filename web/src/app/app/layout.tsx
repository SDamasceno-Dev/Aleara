import type { Metadata } from "next";
import { Sidebar } from "@/components/sidebar";

export const metadata: Metadata = {
  title: "Aleara • Dashboard",
  description: "Visão geral da plataforma Aleara.",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative z-10 mx-auto flex w-full max-w-7xl gap-4 px-4 py-6">
      <Sidebar />
      <div className="flex-1">{children}</div>
    </div>
  );
}


