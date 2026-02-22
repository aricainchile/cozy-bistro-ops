import { Printer, ChefHat, Wine, Receipt } from "lucide-react";

const pendingPrints = [
  { id: 1, order: "#028", table: "Mesa 5", destination: "Cocina", items: ["Lomo a lo Pobre", "Pollo Asado", "Ensalada César"], time: "14:30" },
  { id: 2, order: "#028", table: "Mesa 5", destination: "Barra", items: ["Pisco Sour x2", "Cerveza Artesanal"], time: "14:30" },
  { id: 3, order: "#028", table: "Mesa 5", destination: "Caja", items: ["Lomo a lo Pobre", "Pollo Asado", "Ensalada César", "Pisco Sour x2", "Cerveza Artesanal"], time: "14:30" },
  { id: 4, order: "#027", table: "Mesa 3", destination: "Cocina", items: ["Costillar BBQ", "Papas Fritas"], time: "14:15" },
  { id: 5, order: "#027", table: "Mesa 3", destination: "Barra", items: ["Mojito"], time: "14:15" },
];

const destIcons: Record<string, typeof ChefHat> = {
  Cocina: ChefHat,
  Barra: Wine,
  Caja: Receipt,
};

const destColors: Record<string, string> = {
  Cocina: "bg-warning/20 text-warning border-warning/30",
  Barra: "bg-info/20 text-info border-info/30",
  Caja: "bg-primary/20 text-primary border-primary/30",
};

const Printing = () => {
  return (
    <div className="space-y-6">
      {/* Destination summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {["Cocina", "Barra", "Caja"].map((dest) => {
          const Icon = destIcons[dest];
          const count = pendingPrints.filter((p) => p.destination === dest).length;
          return (
            <div key={dest} className={`glass-card p-5 border ${destColors[dest]}`}>
              <div className="flex items-center gap-3">
                <Icon className="w-6 h-6" />
                <div>
                  <h4 className="font-display font-semibold">{dest}</h4>
                  <p className="text-xs opacity-70">{count} comandas pendientes</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Print queue */}
      <div className="space-y-3">
        {pendingPrints.map((p) => {
          const Icon = destIcons[p.destination];
          return (
            <div key={p.id} className="glass-card-hover p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${destColors[p.destination]}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono font-semibold text-primary">{p.order}</span>
                    <span className="text-sm text-foreground">{p.table}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${destColors[p.destination]}`}>
                      {p.destination}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{p.items.join(" · ")}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">{p.time}</span>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-foreground text-xs font-medium hover:bg-accent transition-colors">
                  <Printer className="w-3 h-3" /> Imprimir
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Printing;
