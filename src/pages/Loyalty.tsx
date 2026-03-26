import { useState, useEffect, useMemo } from "react";
import { Star, Gift, TrendingUp, Users, Plus, Search, ArrowUpRight, ArrowDownRight, Phone, Mail, Award, History, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface LoyaltyCustomer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  points: number;
  total_visits: number;
  total_spent: number;
  tier: string;
  created_at: string;
  last_visit_at: string;
}

interface LoyaltyReward {
  id: string;
  name: string;
  description: string | null;
  points_cost: number;
  active: boolean;
}

interface LoyaltyTransaction {
  id: string;
  customer_id: string;
  type: string;
  points: number;
  description: string | null;
  created_at: string;
}

const tierColors: Record<string, string> = {
  Bronze: "bg-orange-500/20 text-orange-400",
  Silver: "bg-slate-400/20 text-slate-300",
  Gold: "bg-warning/20 text-warning",
  Platinum: "bg-primary/20 text-primary",
};

const tierThresholds = [
  { name: "Platinum", min: 2000 },
  { name: "Gold", min: 1000 },
  { name: "Silver", min: 500 },
  { name: "Bronze", min: 0 },
];

const POINTS_PER_1000 = 10; // 10 points per $1.000 spent

const formatPrice = (n: number) => `$${n.toLocaleString("es-CL")}`;

const Loyalty = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<LoyaltyCustomer[]>([]);
  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Dialogs
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showAddReward, setShowAddReward] = useState(false);
  const [showAddPoints, setShowAddPoints] = useState(false);
  const [showRedeem, setShowRedeem] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<LoyaltyCustomer | null>(null);

  // Forms
  const [custForm, setCustForm] = useState({ name: "", phone: "", email: "" });
  const [rewardForm, setRewardForm] = useState({ name: "", description: "", points_cost: "" });
  const [pointsForm, setPointsForm] = useState({ amount: "", description: "" });
  const [redeemRewardId, setRedeemRewardId] = useState("");

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: c }, { data: r }, { data: t }] = await Promise.all([
      supabase.from("loyalty_customers").select("*").order("points", { ascending: false }),
      supabase.from("loyalty_rewards").select("*").eq("active", true).order("points_cost"),
      supabase.from("loyalty_transactions").select("*").order("created_at", { ascending: false }).limit(100),
    ]);
    setCustomers((c as LoyaltyCustomer[]) || []);
    setRewards((r as LoyaltyReward[]) || []);
    setTransactions((t as LoyaltyTransaction[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
    const ch = supabase
      .channel("loyalty-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "loyalty_customers" }, () => fetchAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "loyalty_transactions" }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const stats = useMemo(() => ({
    totalCustomers: customers.length,
    totalPoints: customers.reduce((s, c) => s + c.points, 0),
    redeemThisMonth: transactions.filter(t => t.type === "redeem" && new Date(t.created_at).getMonth() === new Date().getMonth()).length,
    avgVisits: customers.length ? Math.round(customers.reduce((s, c) => s + c.total_visits, 0) / customers.length) : 0,
  }), [customers, transactions]);

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  );

  const handleAddCustomer = async () => {
    if (!custForm.name) { toast.error("El nombre es obligatorio"); return; }
    const { error } = await supabase.from("loyalty_customers").insert({
      name: custForm.name,
      phone: custForm.phone,
      email: custForm.email || null,
    } as any);
    if (error) { toast.error(error.message); return; }
    toast.success(`Cliente "${custForm.name}" registrado`);
    setCustForm({ name: "", phone: "", email: "" });
    setShowAddCustomer(false);
  };

  const handleAddReward = async () => {
    if (!rewardForm.name || !rewardForm.points_cost) { toast.error("Nombre y costo son obligatorios"); return; }
    const { error } = await supabase.from("loyalty_rewards").insert({
      name: rewardForm.name,
      description: rewardForm.description || null,
      points_cost: parseInt(rewardForm.points_cost),
    } as any);
    if (error) { toast.error(error.message); return; }
    toast.success(`Recompensa "${rewardForm.name}" creada`);
    setRewardForm({ name: "", description: "", points_cost: "" });
    setShowAddReward(false);
    fetchAll();
  };

  const handleAddPoints = async () => {
    if (!selectedCustomer || !user) return;
    const amount = parseInt(pointsForm.amount) || 0;
    if (amount <= 0) { toast.error("Monto debe ser mayor a 0"); return; }
    const pts = Math.floor(amount / 1000) * POINTS_PER_1000;
    if (pts <= 0) { toast.error("Monto insuficiente para generar puntos"); return; }

    // Insert transaction
    const { error: txErr } = await supabase.from("loyalty_transactions").insert({
      customer_id: selectedCustomer.id,
      type: "earn",
      points: pts,
      description: pointsForm.description || `Compra por ${formatPrice(amount)}`,
      created_by: user.id,
    } as any);
    if (txErr) { toast.error(txErr.message); return; }

    // Update customer
    await supabase.from("loyalty_customers").update({
      points: selectedCustomer.points + pts,
      total_visits: selectedCustomer.total_visits + 1,
      total_spent: selectedCustomer.total_spent + amount,
      last_visit_at: new Date().toISOString(),
    } as any).eq("id", selectedCustomer.id);

    toast.success(`+${pts} puntos para ${selectedCustomer.name}`);
    setPointsForm({ amount: "", description: "" });
    setShowAddPoints(false);
    setSelectedCustomer(null);
  };

  const handleRedeem = async () => {
    if (!selectedCustomer || !user || !redeemRewardId) return;
    const reward = rewards.find(r => r.id === redeemRewardId);
    if (!reward) return;
    if (selectedCustomer.points < reward.points_cost) {
      toast.error("Puntos insuficientes");
      return;
    }

    const { error: txErr } = await supabase.from("loyalty_transactions").insert({
      customer_id: selectedCustomer.id,
      type: "redeem",
      points: reward.points_cost,
      description: `Canje: ${reward.name}`,
      reward_id: reward.id,
      created_by: user.id,
    } as any);
    if (txErr) { toast.error(txErr.message); return; }

    await supabase.from("loyalty_customers").update({
      points: selectedCustomer.points - reward.points_cost,
    } as any).eq("id", selectedCustomer.id);

    toast.success(`${selectedCustomer.name} canjeó "${reward.name}"`);
    setRedeemRewardId("");
    setShowRedeem(false);
    setSelectedCustomer(null);
  };

  const customerTransactions = (custId: string) =>
    transactions.filter(t => t.customer_id === custId).slice(0, 5);

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
        {[
          { label: "Clientes Registrados", value: stats.totalCustomers, icon: Users, color: "text-info" },
          { label: "Puntos Activos", value: stats.totalPoints.toLocaleString(), icon: Star, color: "text-warning" },
          { label: "Canjes este Mes", value: stats.redeemThisMonth, icon: Gift, color: "text-success" },
          { label: "Prom. Visitas", value: stats.avgVisits, icon: TrendingUp, color: "text-primary" },
        ].map(s => (
          <div key={s.label} className="glass-card-hover p-5">
            <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
            <p className="text-2xl font-display font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="clientes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="clientes">Clientes</TabsTrigger>
          <TabsTrigger value="recompensas">Recompensas</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
        </TabsList>

        {/* CLIENTES TAB */}
        <TabsContent value="clientes" className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button size="sm" onClick={() => setShowAddCustomer(true)}>
              <Plus className="w-4 h-4 mr-1" /> Nuevo Cliente
            </Button>
          </div>

          {filtered.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">No hay clientes registrados</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(c => {
                const nextTier = tierThresholds.find(t => t.min > c.points);
                const progress = nextTier
                  ? Math.min(100, Math.round((c.points / nextTier.min) * 100))
                  : 100;

                return (
                  <div key={c.id} className="glass-card-hover p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-bold text-primary">
                          {c.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </div>
                        <div>
                          <span className="font-display font-semibold text-foreground">{c.name}</span>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {c.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</span>}
                            {c.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${tierColors[c.tier] || tierColors.Bronze}`}>
                          {c.tier}
                        </span>
                        <span className="text-lg font-display font-bold text-primary">{c.points.toLocaleString()} pts</span>
                      </div>
                    </div>

                    {/* Progress to next tier */}
                    {nextTier && (
                      <div>
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>{c.tier}</span>
                          <span>{nextTier.name} ({nextTier.min} pts)</span>
                        </div>
                        <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    )}

                    {/* Stats row */}
                    <div className="flex items-center gap-6 text-xs text-muted-foreground">
                      <span>{c.total_visits} visitas</span>
                      <span>Gastado: {formatPrice(c.total_spent)}</span>
                      <span>Última: {new Date(c.last_visit_at).toLocaleDateString("es-CL")}</span>
                    </div>

                    {/* Recent transactions */}
                    {customerTransactions(c.id).length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {customerTransactions(c.id).map(t => (
                          <span key={t.id} className={`text-xs px-2 py-0.5 rounded-full ${t.type === "earn" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                            {t.type === "earn" ? "+" : "-"}{t.points} pts
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="text-xs" onClick={() => { setSelectedCustomer(c); setShowAddPoints(true); }}>
                        <ArrowUpRight className="w-3 h-3 mr-1" /> Sumar Puntos
                      </Button>
                      {rewards.length > 0 && c.points > 0 && (
                        <Button size="sm" variant="outline" className="text-xs" onClick={() => { setSelectedCustomer(c); setShowRedeem(true); }}>
                          <Gift className="w-3 h-3 mr-1" /> Canjear
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* RECOMPENSAS TAB */}
        <TabsContent value="recompensas" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-semibold text-foreground">Catálogo de Recompensas</h3>
            <Button size="sm" onClick={() => setShowAddReward(true)}>
              <Plus className="w-4 h-4 mr-1" /> Nueva Recompensa
            </Button>
          </div>

          {rewards.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <Gift className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">No hay recompensas configuradas</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rewards.map(r => (
                <div key={r.id} className="glass-card-hover p-5 text-center space-y-2">
                  <Gift className="w-8 h-8 mx-auto text-primary" />
                  <h4 className="font-display font-semibold text-foreground">{r.name}</h4>
                  {r.description && <p className="text-xs text-muted-foreground">{r.description}</p>}
                  <p className="text-lg font-bold text-primary">{r.points_cost.toLocaleString()} pts</p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* HISTORIAL TAB */}
        <TabsContent value="historial" className="space-y-4">
          <div className="glass-card p-5">
            <h3 className="font-display font-semibold text-foreground mb-4">Últimas Transacciones</h3>
            {transactions.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">Sin transacciones registradas</p>
            ) : (
              <div className="space-y-2">
                {transactions.map(t => {
                  const cust = customers.find(c => c.id === t.customer_id);
                  return (
                    <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                      <div className="flex items-center gap-3">
                        {t.type === "earn" ? (
                          <ArrowUpRight className="w-4 h-4 text-success" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4 text-destructive" />
                        )}
                        <div>
                          <span className="text-sm font-medium text-foreground">{cust?.name || "Cliente"}</span>
                          <p className="text-xs text-muted-foreground">{t.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-semibold ${t.type === "earn" ? "text-success" : "text-destructive"}`}>
                          {t.type === "earn" ? "+" : "-"}{t.points} pts
                        </span>
                        <p className="text-xs text-muted-foreground">
                          {new Date(t.created_at).toLocaleDateString("es-CL")}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* ADD CUSTOMER DIALOG */}
      <Dialog open={showAddCustomer} onOpenChange={setShowAddCustomer}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nuevo Cliente</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre *</Label>
              <Input value={custForm.name} onChange={e => setCustForm(p => ({ ...p, name: e.target.value }))} placeholder="Nombre completo" />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input value={custForm.phone} onChange={e => setCustForm(p => ({ ...p, phone: e.target.value }))} placeholder="+56 9 XXXX XXXX" />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={custForm.email} onChange={e => setCustForm(p => ({ ...p, email: e.target.value }))} placeholder="correo@ejemplo.com" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddCustomer(false)}>Cancelar</Button>
              <Button onClick={handleAddCustomer}>Registrar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ADD REWARD DIALOG */}
      <Dialog open={showAddReward} onOpenChange={setShowAddReward}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nueva Recompensa</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre *</Label>
              <Input value={rewardForm.name} onChange={e => setRewardForm(p => ({ ...p, name: e.target.value }))} placeholder="Ej: Postre gratis" />
            </div>
            <div>
              <Label>Descripción</Label>
              <Input value={rewardForm.description} onChange={e => setRewardForm(p => ({ ...p, description: e.target.value }))} placeholder="Descripción opcional" />
            </div>
            <div>
              <Label>Costo en Puntos *</Label>
              <Input type="number" value={rewardForm.points_cost} onChange={e => setRewardForm(p => ({ ...p, points_cost: e.target.value }))} placeholder="500" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddReward(false)}>Cancelar</Button>
              <Button onClick={handleAddReward}>Crear</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ADD POINTS DIALOG */}
      <Dialog open={showAddPoints} onOpenChange={s => { setShowAddPoints(s); if (!s) setSelectedCustomer(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Sumar Puntos — {selectedCustomer?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Se otorgan <strong className="text-primary">{POINTS_PER_1000} puntos</strong> por cada $1.000 consumidos.
            </p>
            <div>
              <Label>Monto de la Compra ($)</Label>
              <Input type="number" value={pointsForm.amount} onChange={e => setPointsForm(p => ({ ...p, amount: e.target.value }))} placeholder="Ej: 25000" />
              {pointsForm.amount && parseInt(pointsForm.amount) > 0 && (
                <p className="text-xs text-success mt-1">
                  = {Math.floor(parseInt(pointsForm.amount) / 1000) * POINTS_PER_1000} puntos
                </p>
              )}
            </div>
            <div>
              <Label>Descripción (opcional)</Label>
              <Input value={pointsForm.description} onChange={e => setPointsForm(p => ({ ...p, description: e.target.value }))} placeholder="Ej: Almuerzo familiar" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setShowAddPoints(false); setSelectedCustomer(null); }}>Cancelar</Button>
              <Button onClick={handleAddPoints}>Sumar Puntos</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* REDEEM DIALOG */}
      <Dialog open={showRedeem} onOpenChange={s => { setShowRedeem(s); if (!s) setSelectedCustomer(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Canjear Recompensa — {selectedCustomer?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Puntos disponibles: <strong className="text-primary">{selectedCustomer?.points.toLocaleString()}</strong>
            </p>
            <div>
              <Label>Recompensa</Label>
              <Select value={redeemRewardId} onValueChange={setRedeemRewardId}>
                <SelectTrigger><SelectValue placeholder="Selecciona recompensa" /></SelectTrigger>
                <SelectContent>
                  {rewards.map(r => (
                    <SelectItem key={r.id} value={r.id} disabled={(selectedCustomer?.points || 0) < r.points_cost}>
                      {r.name} — {r.points_cost} pts {(selectedCustomer?.points || 0) < r.points_cost ? "(insuficiente)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setShowRedeem(false); setSelectedCustomer(null); }}>Cancelar</Button>
              <Button onClick={handleRedeem} disabled={!redeemRewardId}>Canjear</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Loyalty;
