import { useState, useEffect, useMemo } from "react";
import { CreditCard, Banknote, Building2, ArrowUpRight, CheckCircle2, Plus, X, Receipt, Clock, DollarSign, Printer, Star, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

type PaymentMethod = "efectivo" | "debito" | "credito" | "transferencia" | "cuenta_empresa";

interface CashSession {
  id: string;
  opened_by: string;
  closed_by: string | null;
  opening_amount: number;
  closing_amount: number | null;
  opened_at: string;
  closed_at: string | null;
  notes: string | null;
  is_open: boolean;
}

interface Payment {
  id: string;
  order_id: string;
  cash_session_id: string | null;
  method: PaymentMethod;
  amount: number;
  tip: number;
  receipt_number: number;
  created_by: string;
  created_at: string;
}

interface Order {
  id: string;
  order_number: number;
  table_id: string | null;
  total: number;
  status: string;
  notes: string | null;
}

interface LoyaltyCustomer {
  id: string;
  name: string;
  phone: string;
  points: number;
  tier: string;
}

const METHOD_LABELS: Record<PaymentMethod, string> = {
  efectivo: "Efectivo",
  debito: "Débito",
  credito: "Crédito",
  transferencia: "Transferencia",
  cuenta_empresa: "Cuenta Empresa",
};

const METHOD_ICONS: Record<PaymentMethod, typeof Banknote> = {
  efectivo: Banknote,
  debito: CreditCard,
  credito: CreditCard,
  transferencia: ArrowUpRight,
  cuenta_empresa: Building2,
};

const formatPrice = (n: number) => `$${n.toLocaleString("es-CL")}`;
const formatTime = (d: string) => new Date(d).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });

const CashRegister = () => {
  const { user, userRole } = useAuth();
  const isManager = userRole === "admin" || userRole === "jefe_local";

  const [activeSession, setActiveSession] = useState<CashSession | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialogs
  const [showOpenDialog, setShowOpenDialog] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);

  // Form state
  const [openingAmount, setOpeningAmount] = useState("");
  const [closingAmount, setClosingAmount] = useState("");
  const [closingNotes, setClosingNotes] = useState("");
  const [paymentOrderId, setPaymentOrderId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("efectivo");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentTip, setPaymentTip] = useState("0");

  const fetchData = async () => {
    setLoading(true);
    // Fetch active session
    const { data: sessions } = await supabase
      .from("cash_sessions")
      .select("*")
      .eq("is_open", true)
      .order("opened_at", { ascending: false })
      .limit(1);

    const session = sessions?.[0] as CashSession | undefined;
    setActiveSession(session ?? null);

    // Fetch payments for current session
    if (session) {
      const { data: paymentData } = await supabase
        .from("payments")
        .select("*")
        .eq("cash_session_id", session.id)
        .order("created_at", { ascending: false });
      setPayments((paymentData as Payment[]) ?? []);
    } else {
      setPayments([]);
    }

    // Fetch served orders without payment
    const { data: allPayments } = await supabase.from("payments").select("order_id");
    const paidOrderIds = (allPayments ?? []).map((p: any) => p.order_id);

    const { data: orders } = await supabase
      .from("orders")
      .select("*")
      .in("status", ["served", "ready"])
      .order("created_at", { ascending: false });

    const unpaid = (orders ?? []).filter((o: any) => !paidOrderIds.includes(o.id));
    setPendingOrders(unpaid as Order[]);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel("cash-register")
      .on("postgres_changes", { event: "*", schema: "public", table: "cash_sessions" }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Summaries
  const summary = useMemo(() => {
    const byMethod: Record<PaymentMethod, { amount: number; count: number }> = {
      efectivo: { amount: 0, count: 0 },
      debito: { amount: 0, count: 0 },
      credito: { amount: 0, count: 0 },
      transferencia: { amount: 0, count: 0 },
      cuenta_empresa: { amount: 0, count: 0 },
    };
    let totalSales = 0;
    let totalTips = 0;

    payments.forEach((p) => {
      byMethod[p.method].amount += p.amount;
      byMethod[p.method].count += 1;
      totalSales += p.amount;
      totalTips += p.tip;
    });

    return { byMethod, totalSales, totalTips, totalTx: payments.length };
  }, [payments]);

  const handleOpenCash = async () => {
    if (!user) return;
    const amount = parseInt(openingAmount) || 0;
    const { error } = await supabase.from("cash_sessions").insert({
      opened_by: user.id,
      opening_amount: amount,
    } as any);

    if (error) {
      toast.error("Error al abrir caja: " + error.message);
    } else {
      toast.success("Caja abierta exitosamente");
      setShowOpenDialog(false);
      setOpeningAmount("");
    }
  };

  const handleCloseCash = async () => {
    if (!activeSession || !user) return;
    const amount = parseInt(closingAmount) || 0;
    const { error } = await supabase
      .from("cash_sessions")
      .update({
        is_open: false,
        closed_by: user.id,
        closing_amount: amount,
        closed_at: new Date().toISOString(),
        notes: closingNotes || null,
      } as any)
      .eq("id", activeSession.id);

    if (error) {
      toast.error("Error al cerrar caja: " + error.message);
    } else {
      toast.success("Caja cerrada exitosamente");
      setShowCloseDialog(false);
      setClosingAmount("");
      setClosingNotes("");
    }
  };

  const handleRegisterPayment = async () => {
    if (!user || !paymentOrderId || !activeSession) return;
    const amount = parseInt(paymentAmount) || 0;
    const tip = parseInt(paymentTip) || 0;

    if (amount <= 0) {
      toast.error("El monto debe ser mayor a 0");
      return;
    }

    const { data, error } = await supabase.from("payments").insert({
      order_id: paymentOrderId,
      cash_session_id: activeSession.id,
      method: paymentMethod,
      amount,
      tip,
      created_by: user.id,
    } as any).select().single();

    if (error) {
      toast.error("Error al registrar pago: " + error.message);
      return;
    }

    // Update order status to served if not already
    await supabase.from("orders").update({ status: "served" } as any).eq("id", paymentOrderId);

    // Auto-deduct inventory for each order item
    const { data: orderItems } = await supabase
      .from("order_items")
      .select("product_id, quantity")
      .eq("order_id", paymentOrderId);

    if (orderItems && orderItems.length > 0) {
      const productIds = orderItems.map((i: any) => i.product_id);
      const { data: invItems } = await supabase
        .from("inventory_items")
        .select("id, product_id")
        .in("product_id", productIds);

      if (invItems && invItems.length > 0) {
        const invMap = new Map(invItems.map((i: any) => [i.product_id, i.id]));
        const movements = orderItems
          .filter((oi: any) => invMap.has(oi.product_id))
          .map((oi: any) => ({
            inventory_item_id: invMap.get(oi.product_id),
            type: "venta" as const,
            quantity: oi.quantity,
            reason: `Venta - Boleta #${(data as any).receipt_number}`,
            created_by: user.id,
          }));

        if (movements.length > 0) {
          await supabase.from("inventory_movements").insert(movements as any);
        }
      }
    }

    toast.success(`Pago registrado - Boleta #${(data as any).receipt_number}`);
    setShowPaymentDialog(false);
    setPaymentOrderId("");
    setPaymentAmount("");
    setPaymentTip("0");
    setSelectedReceipt(data as Payment);
    setShowReceiptDialog(true);
  };

  const openPaymentForOrder = (order: Order) => {
    setPaymentOrderId(order.id);
    setPaymentAmount(order.total.toString());
    setPaymentMethod("efectivo");
    setPaymentTip("0");
    setShowPaymentDialog(true);
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
      {/* Status Bar */}
      <div className="glass-card p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${activeSession ? "bg-success animate-pulse" : "bg-destructive"}`} />
          <div>
            <h3 className="font-display font-semibold text-foreground">
              Caja {activeSession ? "Abierta" : "Cerrada"}
            </h3>
            {activeSession && (
              <p className="text-xs text-muted-foreground">
                Apertura: {formatTime(activeSession.opened_at)} · Fondo: {formatPrice(activeSession.opening_amount)}
              </p>
            )}
          </div>
        </div>
        {isManager && (
          activeSession ? (
            <Button variant="destructive" size="sm" onClick={() => { setClosingAmount(""); setClosingNotes(""); setShowCloseDialog(true); }}>
              <X className="w-4 h-4 mr-1" /> Cerrar Caja
            </Button>
          ) : (
            <Button size="sm" onClick={() => { setOpeningAmount(""); setShowOpenDialog(true); }}>
              <Plus className="w-4 h-4 mr-1" /> Abrir Caja
            </Button>
          )
        )}
      </div>

      {activeSession ? (
        <Tabs defaultValue="resumen" className="space-y-4">
          <TabsList>
            <TabsTrigger value="resumen">Resumen</TabsTrigger>
            <TabsTrigger value="cobrar">Cobrar Pedido</TabsTrigger>
            <TabsTrigger value="historial">Historial</TabsTrigger>
          </TabsList>

          {/* RESUMEN TAB */}
          <TabsContent value="resumen" className="space-y-6">
            {/* Total */}
            <div className="glass-card p-6 text-center">
              <p className="text-sm text-muted-foreground mb-1">Venta Total del Turno</p>
              <p className="text-4xl font-display font-bold text-gradient">{formatPrice(summary.totalSales)}</p>
              <div className="flex justify-center gap-6 mt-2">
                <p className="text-sm text-muted-foreground">{summary.totalTx} transacciones</p>
                {summary.totalTips > 0 && (
                  <p className="text-sm text-muted-foreground">Propinas: {formatPrice(summary.totalTips)}</p>
                )}
              </div>
            </div>

            {/* By method */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {(Object.entries(summary.byMethod) as [PaymentMethod, { amount: number; count: number }][]).map(([method, data]) => {
                const Icon = METHOD_ICONS[method];
                return (
                  <div key={method} className="glass-card-hover p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{METHOD_LABELS[method]}</p>
                        <p className="text-xs text-muted-foreground">{data.count} tx</p>
                      </div>
                    </div>
                    <p className="text-xl font-display font-bold text-foreground">{formatPrice(data.amount)}</p>
                  </div>
                );
              })}
            </div>

            {/* Recent payments */}
            <div className="glass-card p-5">
              <h3 className="font-display font-semibold text-foreground mb-4">Últimos Pagos</h3>
              <div className="space-y-2">
                {payments.slice(0, 10).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer"
                    onClick={() => { setSelectedReceipt(p); setShowReceiptDialog(true); }}
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      <div>
                        <span className="text-sm font-medium text-foreground">
                          Boleta #{p.receipt_number} · {METHOD_LABELS[p.method]}
                        </span>
                        <p className="text-xs text-muted-foreground">{formatTime(p.created_at)}</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-foreground">{formatPrice(p.amount)}</span>
                  </div>
                ))}
                {payments.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-4">Sin pagos registrados en este turno</p>
                )}
              </div>
            </div>
          </TabsContent>

          {/* COBRAR TAB */}
          <TabsContent value="cobrar" className="space-y-4">
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold text-foreground">Pedidos Pendientes de Pago</h3>
                <span className="text-xs text-muted-foreground">{pendingOrders.length} pedidos</span>
              </div>
              <div className="space-y-2">
                {pendingOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Receipt className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-foreground">Pedido #{order.order_number}</span>
                        <p className="text-xs text-muted-foreground">
                          {order.status === "served" ? "Servido" : "Listo"} · {formatPrice(order.total)}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => openPaymentForOrder(order)}>
                      <DollarSign className="w-4 h-4 mr-1" /> Cobrar
                    </Button>
                  </div>
                ))}
                {pendingOrders.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-8">No hay pedidos pendientes de pago</p>
                )}
              </div>
            </div>
          </TabsContent>

          {/* HISTORIAL TAB */}
          <TabsContent value="historial" className="space-y-4">
            <div className="glass-card p-5">
              <h3 className="font-display font-semibold text-foreground mb-4">Todos los Pagos del Turno</h3>
              <div className="space-y-2">
                {payments.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer"
                    onClick={() => { setSelectedReceipt(p); setShowReceiptDialog(true); }}
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      <div>
                        <span className="text-sm font-medium text-foreground">
                          Boleta #{p.receipt_number}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          {METHOD_LABELS[p.method]} · {formatTime(p.created_at)}
                          {p.tip > 0 && ` · Propina: ${formatPrice(p.tip)}`}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-foreground">{formatPrice(p.amount)}</span>
                  </div>
                ))}
                {payments.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-8">Sin pagos en este turno</p>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="glass-card p-12 text-center">
          <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-display font-semibold text-foreground text-lg mb-2">Caja Cerrada</h3>
          <p className="text-sm text-muted-foreground">
            {isManager ? "Abre la caja para comenzar a registrar pagos." : "Un administrador debe abrir la caja para operar."}
          </p>
        </div>
      )}

      {/* OPEN CASH DIALOG */}
      <Dialog open={showOpenDialog} onOpenChange={setShowOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Abrir Caja</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Fondo Inicial ($)</Label>
              <Input type="number" value={openingAmount} onChange={(e) => setOpeningAmount(e.target.value)} placeholder="Ej: 50000" />
            </div>
            <Button className="w-full" onClick={handleOpenCash}>Abrir Caja</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* CLOSE CASH DIALOG */}
      <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cerrar Caja</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Summary before closing */}
            <div className="rounded-lg bg-secondary/50 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Fondo inicial</span>
                <span className="font-medium text-foreground">{formatPrice(activeSession?.opening_amount ?? 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ventas totales</span>
                <span className="font-medium text-foreground">{formatPrice(summary.totalSales)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Propinas</span>
                <span className="font-medium text-foreground">{formatPrice(summary.totalTips)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold border-t border-border pt-2">
                <span className="text-foreground">Esperado en caja</span>
                <span className="text-foreground">
                  {formatPrice((activeSession?.opening_amount ?? 0) + summary.byMethod.efectivo.amount + summary.totalTips)}
                </span>
              </div>
            </div>
            <div>
              <Label>Monto Real en Caja ($)</Label>
              <Input type="number" value={closingAmount} onChange={(e) => setClosingAmount(e.target.value)} placeholder="Ingrese el monto contado" />
            </div>
            {closingAmount && (
              <div className={`rounded-lg p-3 text-sm font-medium ${
                parseInt(closingAmount) === ((activeSession?.opening_amount ?? 0) + summary.byMethod.efectivo.amount + summary.totalTips)
                  ? "bg-success/20 text-success"
                  : "bg-destructive/20 text-destructive"
              }`}>
                {(() => {
                  const expected = (activeSession?.opening_amount ?? 0) + summary.byMethod.efectivo.amount + summary.totalTips;
                  const diff = (parseInt(closingAmount) || 0) - expected;
                  if (diff === 0) return "✓ Cuadratura exacta";
                  return `${diff > 0 ? "Sobrante" : "Faltante"}: ${formatPrice(Math.abs(diff))}`;
                })()}
              </div>
            )}
            <div>
              <Label>Notas (opcional)</Label>
              <Input value={closingNotes} onChange={(e) => setClosingNotes(e.target.value)} placeholder="Observaciones del cierre" />
            </div>
            <Button variant="destructive" className="w-full" onClick={handleCloseCash}>Cerrar Caja</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* PAYMENT DIALOG */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pago</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Método de Pago</Label>
              <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(METHOD_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Monto ($)</Label>
              <Input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} />
            </div>
            <div>
              <Label>Propina ($)</Label>
              <Input type="number" value={paymentTip} onChange={(e) => setPaymentTip(e.target.value)} />
            </div>
            <Button className="w-full" onClick={handleRegisterPayment}>
              <CheckCircle2 className="w-4 h-4 mr-1" /> Confirmar Pago
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* RECEIPT DIALOG */}
      <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Boleta #{selectedReceipt?.receipt_number}</DialogTitle>
          </DialogHeader>
          {selectedReceipt && (
            <div className="space-y-4">
              <div className="border border-border rounded-lg p-4 space-y-3 font-mono text-sm">
                <div className="text-center border-b border-dashed border-border pb-3">
                  <p className="font-bold text-foreground text-lg">BOLETA</p>
                  <p className="text-muted-foreground">N° {selectedReceipt.receipt_number}</p>
                  <p className="text-xs text-muted-foreground">{new Date(selectedReceipt.created_at).toLocaleString("es-CL")}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Método:</span>
                    <span className="text-foreground">{METHOD_LABELS[selectedReceipt.method]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="text-foreground">{formatPrice(selectedReceipt.amount)}</span>
                  </div>
                  {selectedReceipt.tip > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Propina:</span>
                      <span className="text-foreground">{formatPrice(selectedReceipt.tip)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold border-t border-dashed border-border pt-2">
                    <span className="text-foreground">TOTAL:</span>
                    <span className="text-foreground">{formatPrice(selectedReceipt.amount + selectedReceipt.tip)}</span>
                  </div>
                </div>
              </div>
              <Button variant="outline" className="w-full" onClick={() => window.print()}>
                <Printer className="w-4 h-4 mr-1" /> Imprimir
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CashRegister;
