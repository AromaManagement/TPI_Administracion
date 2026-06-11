"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCwIcon } from "lucide-react";
import { Button } from "./button";

const INTERVAL_MS = 30_000;

export function AutoRefresh() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function refresh() {
    startTransition(() => { router.refresh(); });
  }

  useEffect(() => {
    const id = setInterval(refresh, INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={refresh}
      disabled={isPending}
      title="Actualizar"
    >
      <RefreshCwIcon className={`size-4 ${isPending ? "animate-spin" : ""}`} />
      <span className="ml-1.5">{isPending ? "Actualizando…" : "Actualizar"}</span>
    </Button>
  );
}
