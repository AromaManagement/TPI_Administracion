import { AlertTriangle } from "lucide-react";

/** Mensaje cuando falla la carga de datos desde el backend. */
export function LoadError({ message }: { message: string }) {
  return (
    <div className="border-destructive/40 bg-destructive/5 text-destructive flex items-start gap-3 rounded-lg border px-4 py-3 text-sm">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      <div>
        <p className="font-medium">No se pudieron cargar los datos</p>
        <p className="opacity-80">{message}</p>
      </div>
    </div>
  );
}
