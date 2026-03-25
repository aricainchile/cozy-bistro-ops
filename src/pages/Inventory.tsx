import { Search, AlertTriangle, Package, FileText, Plus, ArrowUpCircle, ArrowDownCircle, RotateCcw, TrendingDown } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface InventoryItemRow {
  id: string;
  product_id: string;
  current_stock: number;
  min_stock: number;
  unit: string;
  updated_at: string;
  product: { id: string; name: string; category_id: string | null } | null;
  category_name?: string;
}

interface MovementRow {
  id: string;
  inventory_item_id: string;
  type: string;
  quantity: number;
  reason: string | null;
  invoice_number: string | null;
  created_by: string;
  created_at: string;
  inventory_item?: { product: { name: string } | null } | null;
}

interface ProductOption {
  id: string;
  name: string;
}

const Inventory = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<InventoryItemRow[]>([]);
  const [movements, setMovements] = useState<MovementRow[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [showAddItem, setShowAddItem] = useState(false);
  const [showMovement, setShowMovement] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Add item form
  const [newProductId, setNewProductId] = useState("");
  const [newMinStock, setNewMinStock] = useState("");
  const [newUnit, setNewUnit] = useState("un");
  const [newInitialStock, setNewInitialStock] = useState("");

  // Movement form
  const [movType, setMovType] = useState<"entrada" | "salida" | "ajuste">("entrada");
  const [movQuantity, setMovQuantity] = useState("");
  const [movReason, setMovReason] = useState("");

  // Invoice form
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceItems, setInvoiceItems] = useState<{ itemId: string; quantity: string }[]>([{ itemId: "", quantity: "" }]);

  const fetchData = async () => {
    setLoading(true);
    const [itemsRes, movRes, prodsRes] = await Promise.all([
      supabase.from("inventory_items").select("*, product:products(id, name, category_id)").order("updated_at", { ascending: false }),
      supabase.from("inventory_movements").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("products").select("id, name").eq("active", true).order("name"),
    ]);

    if (itemsRes.data) {
      const enriched = await Promise.all(
        (itemsRes.data as any[]).map(async (item) => {
          let category_name = "Sin categoría";
          if (item.product?.category_id) {
            const { data: cat } = await supabase.from("categories").select("name").eq("id", item.product.category_id).single();
            if (cat) category_name = cat.name;
          }
          return { ...item, category_name };
        })
      );
      setItems(enriched);
    }
    if (movRes.data) setMovements(movRes.data as any[]);
    if (prodsRes.data) setProducts(prodsRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel("inventory-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "inventory_items" }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "inventory_movements" }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const filtered = items.filter((i) =>
    i.product?.name?.toLowerCase().includes(search.toLowerCase()) ||
    i.category_name?.toLowerCase().includes(search.toLowerCase())
  );
  const lowStock = items.filter((i) => i.current_stock <= i.min_stock);

  // Productos que aún no tienen item de inventario
  const availableProducts = products.filter((p) => !items.some((i) => i.product_id === p.id));

  const handleAddItem = async () => {
    if (!newProductId || !user) return;
    const { data: item, error } = await supabase.from("inventory_items").insert({
      product_id: newProductId,
      min_stock: parseFloat(newMinStock) || 0,
      unit: newUnit || "un",
      current_stock: 0,
    }).select().single();

    if (error) { toast.error("Error al agregar: " + error.message); return; }

    // Si tiene stock inicial, crear movimiento de entrada
    const initial = parseFloat(newInitialStock);
    if (item && initial > 0) {
      await supabase.from("inventory_movements").insert({
        inventory_item_id: item.id,
        type: "entrada" as any,
        quantity: initial,
        reason: "Stock inicial",
        created_by: user.id,
      });
    }

    toast.success("Producto agregado al inventario");
    setShowAddItem(false);
    resetAddForm();
  };

  const resetAddForm = () => {
    setNewProductId("");
    setNewMinStock("");
    setNewUnit("un");
    setNewInitialStock("");
  };

  const handleMovement = async () => {
    if (!selectedItemId || !movQuantity || !user) return;
    const qty = parseFloat(movQuantity);
    if (qty <= 0) { toast.error("La cantidad debe ser mayor a 0"); return; }

    const { error } = await supabase.from("inventory_movements").insert({
      inventory_item_id: selectedItemId,
      type: movType as any,
      quantity: qty,
      reason: movReason || null,
      created_by: user.id,
    });

    if (error) { toast.error("Error: " + error.message); return; }
    toast.success(`Movimiento registrado: ${movType} de ${qty}`);
    setShowMovement(false);
    setMovQuantity("");
    setMovReason("");
  };

  const handleInvoice = async () => {
    if (!invoiceNumber || !user) return;
    const validItems = invoiceItems.filter((ii) => ii.itemId && parseFloat(ii.quantity) > 0);
    if (validItems.length === 0) { toast.error("Agrega al menos un producto"); return; }

    for (const ii of validItems) {
      await supabase.from("inventory_movements").insert({
        inventory_item_id: ii.itemId,
        type: "entrada" as any,
        quantity: parseFloat(ii.quantity),
        reason: "Ingreso por factura",
        invoice_number: invoiceNumber,
        created_by: user.id,
      });
    }

    toast.success(`Factura ${invoiceNumber} registrada con ${validItems.length} productos`);
    setShowInvoice(false);
    setInvoiceNumber("");
    setInvoiceItems([{ itemId: "", quantity: "" }]);
  };

  const openMovement = (itemId: string, type: "entrada" | "salida" | "ajuste") => {
    setSelectedItemId(itemId);
    setMovType(type);
    setShowMovement(true);
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case "entrada": return <ArrowUpCircle className="w-3.5 h-3.5 text-green-400" />;
      case "salida": return <ArrowDownCircle className="w-3.5 h-3.5 text-red-400" />;
      case "venta": return <TrendingDown className="w-3.5 h-3.5 text-orange-400" />;
      case "ajuste": return <RotateCcw className="w-3.5 h-3.5 text-blue-400" />;
      default: return null;
    }
  };

  const getMovementLabel = (type: string) => {
    switch (type) {
      case "entrada": return "Entrada";
      case "salida": return "Salida";
      case "venta": return "Venta";
      case "ajuste": return "Ajuste";
      default: return type;
    }
  };

  const getProductNameForMovement = (mov: MovementRow) => {
    const item = items.find((i) => i.id === mov.inventory_item_id);
    return item?.product?.name || "—";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

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
                {i.product?.name}: {i.current_stock} {i.unit}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass-card p-4 text-center">
          <Package className="w-5 h-5 text-primary mx-auto mb-1" />
          <div className="text-2xl font-bold text-foreground">{items.length}</div>
          <div className="text-xs text-muted-foreground">Productos en Inventario</div>
        </div>
        <div className="glass-card p-4 text-center">
          <AlertTriangle className="w-5 h-5 text-warning mx-auto mb-1" />
          <div className="text-2xl font-bold text-warning">{lowStock.length}</div>
          <div className="text-xs text-muted-foreground">Stock Bajo</div>
        </div>
        <div className="glass-card p-4 text-center">
          <ArrowUpCircle className="w-5 h-5 text-green-400 mx-auto mb-1" />
          <div className="text-2xl font-bold text-foreground">
            {movements.filter((m) => m.type === "entrada").length}
          </div>
          <div className="text-xs text-muted-foreground">Entradas (recientes)</div>
        </div>
        <div className="glass-card p-4 text-center">
          <ArrowDownCircle className="w-5 h-5 text-red-400 mx-auto mb-1" />
          <div className="text-2xl font-bold text-foreground">
            {movements.filter((m) => m.type === "salida" || m.type === "venta").length}
          </div>
          <div className="text-xs text-muted-foreground">Salidas (recientes)</div>
        </div>
      </div>

      <Tabs defaultValue="stock" className="w-full">
        <TabsList className="w-full grid grid-cols-2 bg-secondary">
          <TabsTrigger value="stock">📦 Stock Actual</TabsTrigger>
          <TabsTrigger value="movements">📋 Movimientos</TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="space-y-4 mt-4">
          {/* Search & actions */}
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar en inventario..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
            <Button onClick={() => setShowInvoice(true)} className="gradient-primary">
              <FileText className="w-4 h-4" /> Ingresar Factura
            </Button>
            <Button onClick={() => setShowAddItem(true)} variant="outline">
              <Plus className="w-4 h-4" /> Agregar Producto
            </Button>
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
                    <th className="text-center text-xs font-medium text-muted-foreground px-4 py-3">Estado</th>
                    <th className="text-center text-xs font-medium text-muted-foreground px-4 py-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">
                        {items.length === 0 ? "No hay productos en el inventario. Agrega uno para comenzar." : "Sin resultados"}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((item) => (
                      <tr key={item.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-foreground">{item.product?.name}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                            {item.category_name}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-foreground font-medium">
                          {item.current_stock} {item.unit}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-muted-foreground">
                          {item.min_stock} {item.unit}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            item.current_stock <= item.min_stock ? "status-occupied" : "status-available"
                          }`}>
                            {item.current_stock <= item.min_stock ? "Bajo" : "OK"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => openMovement(item.id, "entrada")}
                              className="p-1.5 rounded-md hover:bg-green-500/20 text-green-400 transition-colors"
                              title="Entrada"
                            >
                              <ArrowUpCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openMovement(item.id, "salida")}
                              className="p-1.5 rounded-md hover:bg-red-500/20 text-red-400 transition-colors"
                              title="Salida"
                            >
                              <ArrowDownCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openMovement(item.id, "ajuste")}
                              className="p-1.5 rounded-md hover:bg-blue-500/20 text-blue-400 transition-colors"
                              title="Ajuste"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="movements" className="mt-4">
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Fecha</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Producto</th>
                    <th className="text-center text-xs font-medium text-muted-foreground px-4 py-3">Tipo</th>
                    <th className="text-center text-xs font-medium text-muted-foreground px-4 py-3">Cantidad</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Razón</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Factura</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">
                        No hay movimientos registrados
                      </td>
                    </tr>
                  ) : (
                    movements.map((mov) => (
                      <tr key={mov.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {new Date(mov.created_at).toLocaleString("es-CL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground font-medium">
                          {getProductNameForMovement(mov)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            {getMovementIcon(mov.type)}
                            <span className="text-xs font-medium">{getMovementLabel(mov.type)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-sm font-medium text-foreground">
                          {mov.type === "salida" || mov.type === "venta" ? "-" : "+"}{mov.quantity}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{mov.reason || "—"}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{mov.invoice_number || "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog: Agregar producto al inventario */}
      <Dialog open={showAddItem} onOpenChange={setShowAddItem}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Agregar Producto al Inventario</DialogTitle>
            <DialogDescription>Selecciona un producto y configura su stock mínimo</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Producto</Label>
              <Select value={newProductId} onValueChange={setNewProductId}>
                <SelectTrigger className="bg-secondary border-border mt-1">
                  <SelectValue placeholder="Seleccionar producto..." />
                </SelectTrigger>
                <SelectContent>
                  {availableProducts.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Stock Mínimo</Label>
                <Input type="number" value={newMinStock} onChange={(e) => setNewMinStock(e.target.value)} placeholder="0" className="bg-secondary border-border mt-1" />
              </div>
              <div>
                <Label>Unidad</Label>
                <Select value={newUnit} onValueChange={setNewUnit}>
                  <SelectTrigger className="bg-secondary border-border mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="un">Unidad</SelectItem>
                    <SelectItem value="kg">Kg</SelectItem>
                    <SelectItem value="Lt">Litro</SelectItem>
                    <SelectItem value="bot">Botella</SelectItem>
                    <SelectItem value="caja">Caja</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Stock Inicial</Label>
                <Input type="number" value={newInitialStock} onChange={(e) => setNewInitialStock(e.target.value)} placeholder="0" className="bg-secondary border-border mt-1" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddItem(false)}>Cancelar</Button>
            <Button onClick={handleAddItem} disabled={!newProductId} className="gradient-primary">Agregar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Registrar movimiento */}
      <Dialog open={showMovement} onOpenChange={setShowMovement}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>
              {movType === "entrada" ? "📥 Registrar Entrada" : movType === "salida" ? "📤 Registrar Salida" : "🔄 Ajuste de Stock"}
            </DialogTitle>
            <DialogDescription>
              {items.find((i) => i.id === selectedItemId)?.product?.name || ""} — Stock actual: {items.find((i) => i.id === selectedItemId)?.current_stock} {items.find((i) => i.id === selectedItemId)?.unit}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Cantidad</Label>
              <Input type="number" value={movQuantity} onChange={(e) => setMovQuantity(e.target.value)} placeholder="0" className="bg-secondary border-border mt-1" />
            </div>
            <div>
              <Label>Razón (opcional)</Label>
              <Input value={movReason} onChange={(e) => setMovReason(e.target.value)} placeholder="Ej: Compra proveedor, merma, corrección..." className="bg-secondary border-border mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMovement(false)}>Cancelar</Button>
            <Button onClick={handleMovement} disabled={!movQuantity} className="gradient-primary">Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Ingresar factura */}
      <Dialog open={showInvoice} onOpenChange={setShowInvoice}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle>📄 Ingresar Factura</DialogTitle>
            <DialogDescription>Registra una entrada de stock por factura de proveedor</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Número de Factura</Label>
              <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="F-2024-001" className="bg-secondary border-border mt-1" />
            </div>
            <div className="space-y-2">
              <Label>Productos</Label>
              {invoiceItems.map((ii, idx) => (
                <div key={idx} className="flex gap-2">
                  <Select value={ii.itemId} onValueChange={(v) => {
                    const updated = [...invoiceItems];
                    updated[idx].itemId = v;
                    setInvoiceItems(updated);
                  }}>
                    <SelectTrigger className="bg-secondary border-border flex-1">
                      <SelectValue placeholder="Producto..." />
                    </SelectTrigger>
                    <SelectContent>
                      {items.map((item) => (
                        <SelectItem key={item.id} value={item.id}>{item.product?.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    value={ii.quantity}
                    onChange={(e) => {
                      const updated = [...invoiceItems];
                      updated[idx].quantity = e.target.value;
                      setInvoiceItems(updated);
                    }}
                    placeholder="Cant."
                    className="bg-secondary border-border w-24"
                  />
                </div>
              ))}
              <Button variant="ghost" size="sm" onClick={() => setInvoiceItems([...invoiceItems, { itemId: "", quantity: "" }])}>
                <Plus className="w-3 h-3 mr-1" /> Agregar línea
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvoice(false)}>Cancelar</Button>
            <Button onClick={handleInvoice} disabled={!invoiceNumber} className="gradient-primary">Registrar Factura</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Inventory;
