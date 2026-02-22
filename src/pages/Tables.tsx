import { useState } from "react";
import { Plus, Minus, Users } from "lucide-react";

interface Table {
  id: number;
  number: number;
  seats: number;
  status: "available" | "occupied" | "reserved";
  guests?: number;
  waiter?: string;
}

const initialTables: Table[] = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  number: i + 1,
  seats: [2, 4, 4, 6, 4, 2, 8, 4, 6, 4, 2, 4, 4, 6, 4, 2, 8, 4, 6, 4][i],
  status: (["available", "occupied", "reserved", "available", "occupied", "available", "occupied", "available", "reserved", "available",
    "available", "occupied", "available", "available", "occupied", "available", "available", "available", "reserved", "available"] as const)[i],
  guests: [0, 3, 0, 0, 2, 0, 6, 0, 0, 0, 0, 4, 0, 0, 2, 0, 0, 0, 0, 0][i] || undefined,
  waiter: ["", "Carlos", "", "", "María", "", "Pedro", "", "", "", "", "Carlos", "", "", "María", "", "", "", "", ""][i] || undefined,
}));

const statusLabels = {
  available: "Disponible",
  occupied: "Ocupada",
  reserved: "Reservada",
};

const Tables = () => {
  const [tables, setTables] = useState<Table[]>(initialTables);

  const counts = {
    total: tables.length,
    available: tables.filter((t) => t.status === "available").length,
    occupied: tables.filter((t) => t.status === "occupied").length,
    reserved: tables.filter((t) => t.status === "reserved").length,
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: "Total", value: counts.total, cls: "bg-secondary text-secondary-foreground" },
          { label: "Disponibles", value: counts.available, cls: "status-available" },
          { label: "Ocupadas", value: counts.occupied, cls: "status-occupied" },
          { label: "Reservadas", value: counts.reserved, cls: "status-reserved" },
        ].map((s) => (
          <div key={s.label} className={`px-4 py-2 rounded-lg border text-sm font-medium ${s.cls}`}>
            {s.label}: {s.value}
          </div>
        ))}
      </div>

      {/* Grid of tables */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {tables.map((table) => (
          <div
            key={table.id}
            className={`glass-card-hover p-4 cursor-pointer text-center ${
              table.status === "occupied" ? "border-destructive/40" :
              table.status === "reserved" ? "border-warning/40" : "border-success/40"
            }`}
          >
            <div className={`w-14 h-14 mx-auto rounded-xl flex items-center justify-center text-xl font-display font-bold mb-2 ${
              table.status === "available" ? "bg-success/20 text-success" :
              table.status === "occupied" ? "bg-destructive/20 text-destructive" :
              "bg-warning/20 text-warning"
            }`}>
              {table.number}
            </div>
            <p className="text-xs text-muted-foreground mb-1">{table.seats} asientos</p>
            <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium ${
              table.status === "available" ? "status-available" :
              table.status === "occupied" ? "status-occupied" : "status-reserved"
            }`}>
              {statusLabels[table.status]}
            </span>
            {table.guests && (
              <div className="flex items-center justify-center gap-1 mt-2 text-xs text-muted-foreground">
                <Users className="w-3 h-3" /> {table.guests}
              </div>
            )}
            {table.waiter && (
              <p className="text-[10px] text-primary mt-1">{table.waiter}</p>
            )}
          </div>
        ))}

        {/* Add table button */}
        <button className="glass-card flex flex-col items-center justify-center p-4 border-dashed border-2 border-muted-foreground/20 hover:border-primary/50 transition-colors cursor-pointer min-h-[140px]">
          <Plus className="w-8 h-8 text-muted-foreground mb-2" />
          <span className="text-xs text-muted-foreground">Agregar Mesa</span>
        </button>
      </div>
    </div>
  );
};

export default Tables;
