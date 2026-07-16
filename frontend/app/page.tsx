// frontend/app/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/1_Top/");
  }, [router]);

  return (
    <main className="page">
      <p>柑橘おすすめ診断を開いています…</p>
    </main>
  );
}
