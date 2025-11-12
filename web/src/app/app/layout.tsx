"use client";

import { Sidebar } from "@/components/sidebar";
import { useEffect, useState } from "react";
import Image from "next/image";
import prismUrl from "@assets/prism.svg?url";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const hasAuth = (() => {
      try {
        if (typeof document !== "undefined") {
          if (document.cookie.split(";").some((c) => c.trim().startsWith("auth=1"))) return true;
        }
      } catch {}
      try {
        if (typeof localStorage !== "undefined") {
          if (localStorage.getItem("auth") === "1") return true;
        }
      } catch {}
      return false;
    })();

    if (!hasAuth) {
      window.location.replace("/");
      return;
    }
    setReady(true);
  }, []);

  if (!ready) return null;

  return (
    <div className="relative z-10 mx-auto flex h-full w-full max-w-7xl flex-col px-4 py-6">
      <div className="flex items-center justify-center pb-4">
        <Image src={prismUrl} alt="Aleara" width={56} height={56} />
      </div>
      <div className="flex flex-1 min-h-0 gap-4 items-stretch">
        <Sidebar />
        <div className="flex-1 min-h-0 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}


