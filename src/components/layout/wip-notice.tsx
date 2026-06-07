import { Construction } from "lucide-react";

/**
 * Aviso para módulos cuyo backend está en desarrollo.
 * La vista ya está construida y consume datos mock vía los services WIP.
 */
export function WipNotice({ endpoint }: { endpoint: string }) {
  return (
    <div className="border-amber-300/60 bg-amber-50 text-amber-900 mb-6 flex items-start gap-3 rounded-lg border px-4 py-3 text-sm dark:bg-amber-950/30 dark:text-amber-200">
      <Construction className="mt-0.5 size-4 shrink-0" />
      <div>
        <p className="font-medium">Módulo en construcción</p>
        <p className="text-amber-800/80 dark:text-amber-200/70">
          Los datos mostrados son de ejemplo. Cuando el backend exponga{" "}
          <code className="bg-amber-100 dark:bg-amber-900/50 rounded px-1 py-0.5">
            {endpoint}
          </code>{" "}
          se conectará el service correspondiente.
        </p>
      </div>
    </div>
  );
}
