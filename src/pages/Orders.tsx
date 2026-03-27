import { useState, useEffect, useMemo } from "react";
import { Plus, Minus, Trash2, Send, Search, Clock, CheckCircle, ChefHat, Coffee, XCircle, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

type OrderStatus = "pending" | "in_preparation" | "ready" | "served" | "cancelled";

interface RestaurantTable {
  id: string;
  table_number: number;
  status: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  discount: number | null;
  category_id: string | null;
  image_url: string | null;
  active: boolean;
}

interface CartItem {
  product_id: string;
  name: string;
  unit_price: number;
  quantity: number;
}

interface Order {
  id: string;
  order_number: number;
  table_id: string | null;
  guests: number;
  status: OrderStatus;
  notes: string | null;
  total: number;
  created_by: string;
  created_at: string;
}

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
}

const statusConfig: Record<OrderStatus, { label: string; icon: React.ElementType; color: string }> = {
  pending: { label: "Pendiente", icon: Clock, color: "text-warning" },
  in_preparation: { label: "En preparación", icon: ChefHat, color: "text-info" },
  ready: { label: "Listo", icon: CheckCircle, color: "text-success" },
  served: { label: "Servido", icon: Coffee, color: "text-muted-foreground" },
  cancelled: { label: "Cancelado", icon: XCircle, color: "text-destructive" },
};

const Orders = () => {
  const { user } = useAuth();
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // New order state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedTable, setSelectedTable] = useState("");
  const [guests, setGuests] = useState(2);
  const [orderNotes, setOrderNotes] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [productSearch, setProductSearch] = useState("");
  const [sending, setSending] = useState(false);

  // View order detail
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [viewItems, setViewItems] = useState<OrderItem[]>([]);

  // Active tab
  const [activeTab, setActiveTab] = useState("new");

  const fetchData = async () => {
    const [tablesRes, catsRes, prodsRes, ordersRes] = await Promise.all([
      supabase.from("restaurant_tables").select("id, table_number, status").order("table_number"),
      supabase.from("categories").select("id, name, icon").order("sort_order"),
      supabase.from("products").select("id, name, price, discount, category_id, image_url, active").eq("active", true).order("name"),
      supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(50),
    ]);
    if (tablesRes.data) setTables(tablesRes.data as RestaurantTable[]);
    if (catsRes.data) setCategories(catsRes.data as Category[]);
    if (prodsRes.data) setProducts(prodsRes.data as Product[]);
    if (ordersRes.data) setOrders(ordersRes.data as Order[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const ch = supabase
      .channel("orders_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = activeCategory === "all" || p.category_id === activeCategory;
      const matchSearch = p.name.toLowerCase().includes(productSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, activeCategory, productSearch]);

  const getEffectivePrice = (p: Product) => {
    if (p.discount && p.discount > 0) return Math.round(p.price * (1 - p.discount / 100));
    return p.price;
  };

  const formatPrice = (n: number) => `$${n.toLocaleString("es-CL")}`;

  const getTableNumber = (tableId: string | null) => {
    if (!tableId) return "Delivery";
    const t = tables.find((t) => t.id === tableId);
    return t ? `Mesa ${t.table_number}` : "—";
  };

  // Cart operations
  const addToCart = (product: Product) => {
    const price = getEffectivePrice(product);
    setCart((prev) => {
      const existing = prev.find((i) => i.product_id === product.id);
      if (existing) return prev.map((i) => i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product_id: product.id, name: product.name, unit_price: price, quantity: 1 }];
    });
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev.map((i) => i.product_id === productId ? { ...i, quantity: i.quantity + delta } : i).filter((i) => i.quantity > 0)
    );
  };

  const cartTotal = cart.reduce((s, i) => s + i.unit_price * i.quantity, 0);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  const handleSendOrder = async () => {
    if (cart.length === 0) { toast.error("Agrega productos al pedido"); return; }
    if (!selectedTable) { toast.error("Selecciona una mesa"); return; }
    if (!user) { toast.error("Sesión expirada"); return; }

    setSending(true);

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        table_id: selectedTable,
        guests,
        notes: orderNotes.trim() || null,
        total: cartTotal,
        created_by: user.id,
      })
      .select()
      .single();

    if (orderError || !order) {
      toast.error("Error al crear pedido");
      setSending(false);
      return;
    }

    // Create order items
    const items = cart.map((i) => ({
      order_id: order.id,
      product_id: i.product_id,
      product_name: i.name,
      unit_price: i.unit_price,
      quantity: i.quantity,
      subtotal: i.unit_price * i.quantity,
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(items);

    if (itemsError) {
      toast.error("Error al guardar items del pedido");
      setSending(false);
      return;
    }

    // Update table status to occupied
    await supabase
      .from("restaurant_tables")
      .update({ status: "occupied", guests, updated_at: new Date().toISOString() })
      .eq("id", selectedTable);

    // Generate print jobs automatically
    await generatePrintJobs(order, items);

    toast.success(`Pedido #${order.order_number} enviado`);
    setCart([]);
    setOrderNotes("");
    setSending(false);
    setActiveTab("list");
  };

  const generatePrintJobs = async (
    order: { id: string; order_number: number; table_id: string | null },
    orderItems: Array<{ product_id: string; product_name: string; quantity: number; unit_price: number; subtotal: number }>
  ) => {
    try {
      // Get product -> category -> print_destination mapping
      const productIds = orderItems.map((i) => i.product_id);
      const { data: productCats } = await supabase
        .from("products")
        .select("id, category_id, categories!products_category_id_fkey(print_destination)")
        .in("id", productIds);

      const destMap: Record<string, string> = {};
      if (productCats) {
        for (const p of productCats) {
          const cat = p.categories as unknown as { print_destination: string } | null;
          destMap[p.id] = cat?.print_destination || "cocina";
        }
      }

      // Group items by destination
      const grouped: Record<string, Array<{ name: string; quantity: number }>> = {};
      const allItems: Array<{ name: string; quantity: number }> = [];
      for (const item of orderItems) {
        const dest = destMap[item.product_id] || "cocina";
        if (!grouped[dest]) grouped[dest] = [];
        grouped[dest].push({ name: item.product_name, quantity: item.quantity });
        allItems.push({ name: item.product_name, quantity: item.quantity });
      }

      const tableLabel = getTableNumber(order.table_id);

      // Create print jobs for each destination + one for caja
      const printJobs = Object.entries(grouped).map(([dest, items]) => ({
        order_id: order.id,
        order_number: order.order_number,
        table_info: tableLabel,
        destination: dest,
        items: JSON.stringify(items),
      }));

      // Always add a "caja" job with all items
      printJobs.push({
        order_id: order.id,
        order_number: order.order_number,
        table_info: tableLabel,
        destination: "caja",
        items: JSON.stringify(allItems),
      });

      await supabase.from("print_jobs").insert(printJobs as any);
    } catch (e) {
      console.error("Error generating print jobs:", e);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", orderId);
    if (error) toast.error("Error al actualizar estado");
    else toast.success(`Estado actualizado a ${statusConfig[newStatus].label}`);
  };

  const handleViewOrder = async (order: Order) => {
    setViewOrder(order);
    const { data } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", order.id)
      .order("created_at");
    setViewItems((data as OrderItem[]) ?? []);
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Ahora";
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 h-[calc(100vh-8rem)]">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        <TabsList className="w-fit">
          <TabsTrigger value="new">
            Nuevo Pedido {cartCount > 0 && <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-primary text-primary-foreground">{cartCount}</span>}
          </TabsTrigger>
          <TabsTrigger value="list">
            Pedidos Activos <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-secondary text-secondary-foreground">{orders.filter((o) => !["served", "cancelled"].includes(o.status)).length}</span>
          </TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
        </TabsList>

        {/* ===== NEW ORDER TAB ===== */}
        <TabsContent value="new" className="flex-1 overflow-hidden mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
            {/* Product selection */}
            <div className="lg:col-span-2 flex flex-col overflow-hidden">
              {/* Search */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Buscar producto..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {/* Category filter */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                <button
                  onClick={() => setActiveCategory("all")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                    activeCategory === "all" ? "gradient-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"
                  }`}
                >
                  Todos
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                      activeCategory === cat.id ? "gradient-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"
                    }`}
                  >
                    {cat.icon} {cat.name}
                  </button>
                ))}
              </div>

              {/* Products grid */}
              <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {filteredProducts.map((p) => {
                    const effectivePrice = getEffectivePrice(p);
                    const inCart = cart.find((i) => i.product_id === p.id);
                    return (
                      <button
                        key={p.id}
                        onClick={() => addToCart(p)}
                        className={`glass-card-hover p-2.5 text-left relative ${inCart ? "ring-1 ring-primary/50" : ""}`}
                      >
                        {inCart && (
                          <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                            {inCart.quantity}
                          </span>
                        )}
                        <p className="text-xs font-medium text-foreground truncate">{p.name}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-xs font-bold text-primary">{formatPrice(effectivePrice)}</span>
                          {p.discount && p.discount > 0 && (
                            <span className="text-[9px] text-muted-foreground line-through">{formatPrice(p.price)}</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                  {filteredProducts.length === 0 && (
                    <div className="col-span-full text-center py-8 text-muted-foreground text-sm">Sin productos</div>
                  )}
                </div>
              </div>
            </div>

            {/* Order panel */}
            <div className="glass-card flex flex-col overflow-hidden">
              <div className="p-3 border-b border-border">
                <h3 className="font-display font-semibold text-foreground text-sm mb-2">Pedido Actual</h3>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] text-muted-foreground mb-0.5 block">Mesa</label>
                    <Select value={selectedTable} onValueChange={setSelectedTable}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                      <SelectContent>
                        {tables.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            Mesa {t.table_number} {t.status === "occupied" ? "🔴" : t.status === "reserved" ? "🟡" : "🟢"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-24">
                    <label className="text-[10px] text-muted-foreground mb-0.5 block">Clientes</label>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setGuests(Math.max(1, guests - 1))} className="w-7 h-9 rounded-md bg-secondary flex items-center justify-center text-foreground hover:bg-accent transition-colors">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="flex-1 text-center text-sm font-medium text-foreground">{guests}</span>
                      <button onClick={() => setGuests(guests + 1)} className="w-7 h-9 rounded-md bg-secondary flex items-center justify-center text-foreground hover:bg-accent transition-colors">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cart items */}
              <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                {cart.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-xs">Seleccione productos</div>
                ) : (
                  cart.map((item) => (
                    <div key={item.product_id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{item.name}</p>
                        <p className="text-[10px] text-muted-foreground">{formatPrice(item.unit_price)} c/u</p>
                      </div>
                      <div className="flex items-center gap-1.5 ml-2">
                        <button onClick={() => updateCartQty(item.product_id, -1)} className="w-6 h-6 rounded bg-muted flex items-center justify-center text-foreground hover:bg-destructive/20 hover:text-destructive transition-colors">
                          {item.quantity === 1 ? <Trash2 className="w-2.5 h-2.5" /> : <Minus className="w-2.5 h-2.5" />}
                        </button>
                        <span className="w-5 text-center text-xs font-semibold text-foreground">{item.quantity}</span>
                        <button onClick={() => updateCartQty(item.product_id, 1)} className="w-6 h-6 rounded bg-muted flex items-center justify-center text-foreground hover:bg-primary/20 hover:text-primary transition-colors">
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                        <span className="w-16 text-right text-xs font-medium text-foreground">
                          {formatPrice(item.unit_price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Notes */}
              <div className="px-3 pb-2">
                <Textarea
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Notas del pedido (opcional)"
                  rows={2}
                  className="text-xs"
                />
              </div>

              {/* Total + send */}
              <div className="p-3 border-t border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Total ({cartCount} items)</span>
                  <span className="text-lg font-display font-bold text-primary">{formatPrice(cartTotal)}</span>
                </div>
                <button
                  onClick={handleSendOrder}
                  disabled={cart.length === 0 || sending}
                  className="w-full py-2.5 rounded-lg gradient-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" /> {sending ? "Enviando..." : "Enviar Pedido"}
                </button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ===== ACTIVE ORDERS TAB ===== */}
        <TabsContent value="list" className="flex-1 overflow-y-auto mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {orders.filter((o) => !["served", "cancelled"].includes(o.status)).map((order) => {
              const cfg = statusConfig[order.status];
              const StatusIcon = cfg.icon;
              return (
                <div key={order.id} className="glass-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-display font-bold text-foreground">#{order.order_number}</span>
                      <span className="text-xs text-muted-foreground">{getTableNumber(order.table_id)}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{timeAgo(order.created_at)}</span>
                  </div>

                  <div className={`flex items-center gap-1.5 ${cfg.color}`}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">{cfg.label}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-primary">{formatPrice(order.total)}</span>
                    <span className="text-[10px] text-muted-foreground">{order.guests} clientes</span>
                  </div>

                  {order.notes && <p className="text-[10px] text-muted-foreground italic line-clamp-1">{order.notes}</p>}

                  <div className="flex gap-1.5 pt-1">
                    <Button variant="outline" size="sm" className="flex-1 text-[10px] h-7" onClick={() => handleViewOrder(order)}>
                      <Eye className="w-3 h-3" /> Ver
                    </Button>
                    {order.status === "pending" && (
                      <Button size="sm" className="flex-1 text-[10px] h-7" onClick={() => handleStatusChange(order.id, "in_preparation")}>
                        <ChefHat className="w-3 h-3" /> Preparar
                      </Button>
                    )}
                    {order.status === "in_preparation" && (
                      <Button size="sm" className="flex-1 text-[10px] h-7" onClick={() => handleStatusChange(order.id, "ready")}>
                        <CheckCircle className="w-3 h-3" /> Listo
                      </Button>
                    )}
                    {order.status === "ready" && (
                      <Button size="sm" className="flex-1 text-[10px] h-7" onClick={() => handleStatusChange(order.id, "served")}>
                        <Coffee className="w-3 h-3" /> Servido
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
            {orders.filter((o) => !["served", "cancelled"].includes(o.status)).length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">No hay pedidos activos</div>
            )}
          </div>
        </TabsContent>

        {/* ===== HISTORY TAB ===== */}
        <TabsContent value="history" className="flex-1 overflow-y-auto mt-4">
          <div className="space-y-2">
            {orders.filter((o) => ["served", "cancelled"].includes(o.status)).map((order) => {
              const cfg = statusConfig[order.status];
              const StatusIcon = cfg.icon;
              return (
                <div key={order.id} className="glass-card p-3 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-display font-bold text-foreground">#{order.order_number}</span>
                    <span className="text-xs text-muted-foreground">{getTableNumber(order.table_id)}</span>
                    <div className={`flex items-center gap-1 ${cfg.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      <span className="text-[10px] font-medium">{cfg.label}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-primary">{formatPrice(order.total)}</span>
                    <span className="text-[10px] text-muted-foreground">{new Date(order.created_at).toLocaleString("es-CL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                    <Button variant="ghost" size="sm" className="h-7" onClick={() => handleViewOrder(order)}>
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
            {orders.filter((o) => ["served", "cancelled"].includes(o.status)).length === 0 && (
              <div className="text-center py-12 text-muted-foreground">Sin historial de pedidos</div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* ===== Order Detail Dialog ===== */}
      <Dialog open={!!viewOrder} onOpenChange={() => setViewOrder(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pedido #{viewOrder?.order_number}</DialogTitle>
            <DialogDescription>
              {viewOrder && `${getTableNumber(viewOrder.table_id)} · ${viewOrder.guests} clientes · ${statusConfig[viewOrder.status].label}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[50vh] overflow-y-auto">
            {viewItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
                <div>
                  <p className="text-sm font-medium text-foreground">{item.product_name}</p>
                  <p className="text-[10px] text-muted-foreground">{formatPrice(item.unit_price)} × {item.quantity}</p>
                </div>
                <span className="text-sm font-medium text-foreground">{formatPrice(item.subtotal)}</span>
              </div>
            ))}
            {viewOrder?.notes && (
              <div className="p-2 rounded-lg bg-muted/50">
                <p className="text-[10px] text-muted-foreground">Notas:</p>
                <p className="text-xs text-foreground">{viewOrder.notes}</p>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-lg font-display font-bold text-primary">{viewOrder && formatPrice(viewOrder.total)}</span>
          </div>
          <DialogFooter>
            {viewOrder && !["served", "cancelled"].includes(viewOrder.status) && (
              <Button variant="destructive" size="sm" onClick={() => { handleStatusChange(viewOrder.id, "cancelled"); setViewOrder(null); }}>
                Cancelar Pedido
              </Button>
            )}
            <Button variant="outline" onClick={() => setViewOrder(null)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;
