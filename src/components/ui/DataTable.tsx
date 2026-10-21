import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface DataTableProps {
  head: string[];
  children: ReactNode;
  className?: string;
}

/** Tabla basica con cabecera crema y filas con resaltado al pasar el cursor. */
export function DataTable({ head, children, className }: DataTableProps) {
  return (
    <div className="overflow-x-auto">
      <table
        className={cn(
          "w-full border-collapse text-left text-sm",
          className
        )}
      >
        <thead>
          <tr className="border-b border-line bg-cream text-plum/70">
            {head.map((column) => (
              <th key={column} className="px-4 py-3 font-semibold">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  );
}
