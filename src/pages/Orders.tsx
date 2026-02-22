import { useState } from "react";
import { Plus, Minus, Trash2, Send, Users, ChevronDown } from "lucide-react";

interface OrderItem {
  id: number;
  name: string;
  price: number;
  qty: number;
  category: string;
}

const quickProducts = [
  { id: 1, name: "Lomo a lo Pobre", price: 14500, category: "Carne" },
  { id: 2, name: "Pollo Asado", price: 9800, category: "Pollo" },
  { id: 3, name: "Pisco Sour", price: 5500, category: "Cocktail" },
  { id: 4, name: "Cerveza Artesanal", price: 4200, category: "Cervezas" },
  { id: 5, name: "Papas Fritas", price: 3500, category: "Acompañamientos" },
  { id: 6, name: "Pulpo al Olivo", price: 18500, category: "Pulpo" },
  { id: 7, name: "Costillar BBQ", price: 13500, category: "Cerdo" },
  { id: 8, name: "Jugo Natural", price: 3200, category: "Jugos" },
  { id: 9, name: "Café Espresso", price: 2500, category: "Café" },
  { id: 10, name: "Mojito", price: 5800, category: "Cocktail" },
  { id: 11, name: "Ensalada César", price: 5200, category: "Acompañamientos" },
  { id: 12, name: "Vino Carmenere", price: 4500, category: "Vinos" },
];

const Orders = () => {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<number>(1);
  const [guests, setGuests] = useState(2);

  const addItem = (product: typeof quickProducts[0]) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) return prev.map((i) => (i.id === product.id ? { ...i, qty: i.qty + 1 } : i));
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id: number, delta: number) => {
    setItems((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0)
    );
  };

  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const formatPrice = (n: number) => `$${n.toLocaleString("es-CL")}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
      {/* Product selection */}
      <div className="lg:col-span-2 space-y-4 overflow-y-auto">
        <h3 className="font-display font-semibold text-foreground">Seleccionar Productos</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {quickProducts.map((p) => (
            <button
              key={p.id}
              onClick={() => addItem(p)}
              className="glass-card-hover p-3 text-left"
            >
              <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
              <p className="text-xs text-muted-foreground">{p.category}</p>
              <p className="text-sm font-bold text-primary mt-1">{formatPrice(p.price)}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Order panel */}
      <div className="glass-card flex flex-col">
        <div className="p-4 border-b border-border">
          <h3 className="font-display font-semibold text-foreground mb-3">Pedido Actual</h3>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">Mesa</label>
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                {Array.from({ length: 20 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>Mesa {i + 1}</option>
                ))}
              </select>
            </div>
            <div className="w-24">
              <label className="text-xs text-muted-foreground mb-1 block">Clientes</label>
              <div className="flex items-center gap-1">
                <button onClick={() => setGuests(Math.max(1, guests - 1))} className="w-8 h-9 rounded-lg bg-secondary flex items-center justify-center text-foreground hover:bg-accent transition-colors">
                  <Minus className="w-3 h-3" />
                </button>
                <span className="flex-1 text-center text-sm font-medium text-foreground">{guests}</span>
                <button onClick={() => setGuests(guests + 1)} className="w-8 h-9 rounded-lg bg-secondary flex items-center justify-center text-foreground hover:bg-accent transition-colors">
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Seleccione productos para agregar al pedido
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{formatPrice(item.price)} c/u</p>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 rounded-md bg-muted flex items-center justify-center text-foreground hover:bg-destructive/20 hover:text-destructive transition-colors">
                    {item.qty === 1 ? <Trash2 className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                  </button>
                  <span className="w-6 text-center text-sm font-semibold text-foreground">{item.qty}</span>
                  <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 rounded-md bg-muted flex items-center justify-center text-foreground hover:bg-primary/20 hover:text-primary transition-colors">
                    <Plus className="w-3 h-3" />
                  </button>
                  <span className="w-20 text-right text-sm font-medium text-foreground">
                    {formatPrice(item.price * item.qty)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Total + send */}
        <div className="p-4 border-t border-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-xl font-display font-bold text-primary">{formatPrice(total)}</span>
          </div>
          <button
            disabled={items.length === 0}
            className="w-full py-3 rounded-lg gradient-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" /> Enviar Pedido
          </button>
        </div>
      </div>
    </div>
  );
};

export default Orders;
