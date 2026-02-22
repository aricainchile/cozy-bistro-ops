import { Search, AlertTriangle, Package, FileText } from "lucide-react";
import { useState } from "react";

interface InventoryItem {
  id: number;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  unit: string;
  lastInvoice: string;
  sold: number;
}

const items: InventoryItem[] = [
  { id: 1, name: "Lomo Vetado", category: "Carne", stock: 12, minStock: 5, unit: "kg", lastInvoice: "F-2024-001", sold: 24 },
  { id: 2, name: "Pechuga de Pollo", category: "Pollo", stock: 8, minStock: 5, unit: "kg", lastInvoice: "F-2024-001", sold: 18 },
  { id: 3, name: "Costillar de Cerdo", category: "Cerdo", stock: 3, minStock: 4, unit: "kg", lastInvoice: "F-2024-002", sold: 10 },
  { id: 4, name: "Pulpo", category: "Pulpo", stock: 2, minStock: 3, unit: "kg", lastInvoice: "F-2024-002", sold: 8 },
  { id: 5, name: "Papas", category: "Acompañamientos", stock: 25, minStock: 10, unit: "kg", lastInvoice: "F-2024-003", sold: 40 },
  { id: 6, name: "Pisco", category: "Destilados", stock: 6, minStock: 3, unit: "Lt", lastInvoice: "F-2024-004", sold: 15 },
  { id: 7, name: "Cerveza Artesanal", category: "Cervezas", stock: 48, minStock: 24, unit: "un", lastInvoice: "F-2024-004", sold: 65 },
  { id: 8, name: "Vino Carmenere", category: "Vinos", stock: 10, minStock: 6, unit: "bot", lastInvoice: "F-2024-005", sold: 12 },
];

const Inventory = () => {
  const [search, setSearch] = useState("");
  const filtered = items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));
  const lowStock = items.filter((i) => i.stock <= i.minStock);

  return (
    <div className="space-y-6">
      {/* Low stock alerts */}
      {lowStock.length > 0 && (
        <div className="glass-card p-4 border-warning/40">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-warning" />
            <span className="text-sm font-semibold text-warning">Stock Bajo ({lowStock.length} productos)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStock.map((i) => (
              <span key={i.id} className="text-xs px-2.5 py-1 rounded-full bg-warning/20 text-warning font-medium">
                {i.name}: {i.stock} {i.unit}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar en inventario..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-primary text-primary-foreground font-medium text-sm">
          <FileText className="w-4 h-4" /> Ingresar Factura
        </button>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Producto</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Categoría</th>
                <th className="text-center text-xs font-medium text-muted-foreground px-4 py-3">Stock</th>
                <th className="text-center text-xs font-medium text-muted-foreground px-4 py-3">Mín.</th>
                <th className="text-center text-xs font-medium text-muted-foreground px-4 py-3">Vendidos</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Última Factura</th>
                <th className="text-center text-xs font-medium text-muted-foreground px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-foreground">{item.name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{item.category}</span>
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-foreground font-medium">
                    {item.stock} {item.unit}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-muted-foreground">
                    {item.minStock} {item.unit}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-foreground">{item.sold}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground font-mono">{item.lastInvoice}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      item.stock <= item.minStock ? "status-occupied" : "status-available"
                    }`}>
                      {item.stock <= item.minStock ? "Bajo" : "OK"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Inventory;
