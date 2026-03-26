import { useState, useEffect } from "react";
import { Truck, Clock, CheckCircle2, MapPin, Phone, Plus, X, User, Package, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

type DeliveryStatus = "pendiente" | "preparando" | "en_camino" | "entregado" | "cancelado";

interface DeliveryOrder {
  id: string;
  order_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  status: DeliveryStatus;
  delivery_notes: string | null;
  assigned_driver: string | null;
  estimated_time: string | null;
  created_at: string;
  updated_at: string;
}

interface OrderWithItems {
  id: string;
  order_number: number;
  total: number;
  status: string;
  items: { product_name: string; quantity: number }[];
}

const STATUS_CONFIG: Record<DeliveryStatus, { label: string; color: string; icon: typeof Clock; next?: DeliveryStatus }> = {
  pendiente: { label: "Pendiente", color: "bg-muted text-muted-foreground", icon: Clock, next: "preparando" },
  preparando: { label: "Preparando", color: "bg-warning/20 text-warning", icon: Package, next: "en_camino" },
  en_camino: { label: "En camino", color: "bg-info/20 text-info", icon: Truck, next: "entregado" },
  entregado: { label: "Entregado", color: "bg-success/20 text-success", icon: CheckCircle2 },
  cancelado: { label: "Cancelado", color: "bg-destructive/20 text-destructive", icon: X },
};

const Delivery = () => {
  const { session } = useAuth();
  const { toast } = useToast();
  const [deliveries, setDeliveries] = useState<DeliveryOrder[]>([]);
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState<DeliveryStatus | "todos">("todos");

  // Form state
  const [form, setForm] = useState({ customer_name: "", customer_phone: "", customer_address: "", order_id: "", delivery_notes: "", assigned_driver: "", estimated_time: "" });

  const fetchDeliveries = async () => {
    const { data } = await supabase
      .from("delivery_orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setDeliveries(data as DeliveryOrder[]);
  };

  const fetchAvailableOrders = async () => {
    const { data: ordersData } = await supabase
      .from("orders")
      .select("id, order_number, total, status")
      .in("status", ["pending", "in_preparation", "ready", "served"]);

    if (!ordersData) return;

    const withItems: OrderWithItems[] = [];
    for (const o of ordersData) {
      const { data: items } = await supabase
        .from("order_items")
        .select("product_name, quantity")
        .eq("order_id", o.id);
      withItems.push({ ...o, items: items || [] });
    }
    setOrders(withItems);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchDeliveries(), fetchAvailableOrders()]);
      setLoading(false);
    };
    load();

    const channel = supabase
      .channel("delivery-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "delivery_orders" }, () => {
        fetchDeliveries();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const createDelivery = async () => {
    if (!form.customer_name || !form.customer_address) {
      toast({ title: "Error", description: "Nombre y dirección son obligatorios", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("delivery_orders").insert({
      customer_name: form.customer_name,
      customer_phone: form.customer_phone,
      customer_address: form.customer_address,
      order_id: form.order_id || null,
      delivery_notes: form.delivery_notes || null,
      assigned_driver: form.assigned_driver || null,
      estimated_time: form.estimated_time || null,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "✅ Delivery creado", description: `Pedido para ${form.customer_name}` });
    setForm({ customer_name: "", customer_phone: "", customer_address: "", order_id: "", delivery_notes: "", assigned_driver: "", estimated_time: "" });
    setShowCreate(false);
  };

  const advanceStatus = async (delivery: DeliveryOrder) => {
    const next = STATUS_CONFIG[delivery.status].next;
    if (!next) return;

    const { error } = await supabase
      .from("delivery_orders")
      .update({ status: next, updated_at: new Date().toISOString() })
      .eq("id", delivery.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Estado actualizado", description: `${delivery.customer_name} → ${STATUS_CONFIG[next].label}` });
  };

  const cancelDelivery = async (delivery: DeliveryOrder) => {
    const { error } = await supabase
      .from("delivery_orders")
      .update({ status: "cancelado" as DeliveryStatus, updated_at: new Date().toISOString() })
      .eq("id", delivery.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Delivery cancelado", description: delivery.customer_name });
  };

  const formatPrice = (n: number) => `$${n.toLocaleString("es-CL")}`;
  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });

  const stats = {
    pendiente: deliveries.filter(d => d.status === "pendiente").length,
    preparando: deliveries.filter(d => d.status === "preparando").length,
    en_camino: deliveries.filter(d => d.status === "en_camino").length,
    entregado: deliveries.filter(d => d.status === "entregado").length,
  };

  const filtered = filter === "todos" ? deliveries : deliveries.filter(d => d.status === filter);

  const linkedOrder = (orderId: string | null) => orders.find(o => o.id === orderId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {([
          { label: "Pendientes", value: stats.pendiente, icon: Clock, color: "text-muted-foreground" },
          { label: "Preparando", value: stats.preparando, icon: Package, color: "text-warning" },
          { label: "En camino", value: stats.en_camino, icon: Truck, color: "text-info" },
          { label: "Entregados", value: stats.entregado, icon: CheckCircle2, color: "text-success" },
        ] as const).map((s) => (
          <div key={s.label} className="glass-card p-4 text-center">
            <s.icon className={`w-6 h-6 mx-auto mb-2 ${s.color}`} />
            <p className="text-2xl font-display font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Actions bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {(["todos", "pendiente", "preparando", "en_camino", "entregado", "cancelado"] as const).map(f => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "default" : "outline"}
              onClick={() => setFilter(f)}
              className="text-xs capitalize"
            >
              {f === "todos" ? "Todos" : STATUS_CONFIG[f].label}
            </Button>
          ))}
        </div>
        <Button onClick={() => setShowCreate(!showCreate)} size="sm">
          <Plus className="w-4 h-4 mr-1" /> Nuevo Delivery
        </Button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-lg font-display font-bold text-foreground">Nuevo Pedido Delivery</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Cliente *</label>
              <input
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Nombre del cliente"
                value={form.customer_name}
                onChange={e => setForm(p => ({ ...p, customer_name: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Teléfono</label>
              <input
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="+56 9 XXXX XXXX"
                value={form.customer_phone}
                onChange={e => setForm(p => ({ ...p, customer_phone: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-muted-foreground mb-1 block">Dirección *</label>
              <input
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Dirección de entrega"
                value={form.customer_address}
                onChange={e => setForm(p => ({ ...p, customer_address: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Pedido asociado</label>
              <select
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                value={form.order_id}
                onChange={e => setForm(p => ({ ...p, order_id: e.target.value }))}
              >
                <option value="">Sin pedido vinculado</option>
                {orders.map(o => (
                  <option key={o.id} value={o.id}>
                    Pedido #{o.order_number} - {formatPrice(o.total)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Repartidor</label>
              <input
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Nombre del repartidor"
                value={form.assigned_driver}
                onChange={e => setForm(p => ({ ...p, assigned_driver: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Tiempo estimado</label>
              <input
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="30 min"
                value={form.estimated_time}
                onChange={e => setForm(p => ({ ...p, estimated_time: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Notas</label>
              <input
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Instrucciones especiales"
                value={form.delivery_notes}
                onChange={e => setForm(p => ({ ...p, delivery_notes: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button size="sm" onClick={createDelivery}>Crear Delivery</Button>
          </div>
        </div>
      )}

      {/* Deliveries list */}
      {filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Truck className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">No hay deliveries {filter !== "todos" ? `con estado "${STATUS_CONFIG[filter as DeliveryStatus].label}"` : ""}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((d) => {
            const config = STATUS_CONFIG[d.status];
            const order = linkedOrder(d.order_id);
            const StatusIcon = config.icon;

            return (
              <div key={d.id} className="glass-card-hover p-4 space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <StatusIcon className={`w-5 h-5 ${config.color.split(" ")[1]}`} />
                    <span className="font-display font-semibold text-foreground">{d.customer_name}</span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${config.color}`}>
                      {config.label}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatTime(d.created_at)}</span>
                </div>

                {/* Details */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                  {d.customer_phone && (
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{d.customer_phone}</span>
                  )}
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{d.customer_address}</span>
                  {d.assigned_driver && (
                    <span className="flex items-center gap-1"><User className="w-3 h-3" />{d.assigned_driver}</span>
                  )}
                  {d.estimated_time && (
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{d.estimated_time}</span>
                  )}
                </div>

                {/* Linked order */}
                {order && (
                  <div className="bg-secondary/50 rounded-lg p-3 text-xs">
                    <span className="font-semibold text-primary">Pedido #{order.order_number}</span>
                    <span className="text-muted-foreground ml-2">
                      {order.items.map(i => `${i.quantity}x ${i.product_name}`).join(", ")}
                    </span>
                    <span className="float-right font-semibold text-foreground">{formatPrice(order.total)}</span>
                  </div>
                )}

                {/* Notes */}
                {d.delivery_notes && (
                  <p className="text-xs text-muted-foreground italic">📝 {d.delivery_notes}</p>
                )}

                {/* Actions */}
                {d.status !== "entregado" && d.status !== "cancelado" && (
                  <div className="flex gap-2 pt-1">
                    {config.next && (
                      <Button size="sm" onClick={() => advanceStatus(d)} className="text-xs">
                        <ArrowRight className="w-3 h-3 mr-1" />
                        {STATUS_CONFIG[config.next].label}
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => cancelDelivery(d)} className="text-xs text-destructive border-destructive/30 hover:bg-destructive/10">
                      <X className="w-3 h-3 mr-1" /> Cancelar
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Delivery;
