import { DollarSign, CreditCard, Banknote, Building2, ArrowUpRight, Clock, CheckCircle2 } from "lucide-react";

const CashRegister = () => {
  const isOpen = true;
  const payments = [
    { method: "Efectivo", icon: Banknote, amount: 485000, count: 12 },
    { method: "Débito", icon: CreditCard, amount: 320000, count: 8 },
    { method: "Transferencia", icon: ArrowUpRight, amount: 180000, count: 5 },
    { method: "Cuenta Empresa", icon: Building2, amount: 260000, count: 3 },
  ];
  const totalSales = payments.reduce((s, p) => s + p.amount, 0);
  const formatPrice = (n: number) => `$${n.toLocaleString("es-CL")}`;

  return (
    <div className="space-y-6">
      {/* Status */}
      <div className="glass-card p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isOpen ? "bg-success animate-pulse" : "bg-destructive"}`} />
          <div>
            <h3 className="font-display font-semibold text-foreground">
              Caja {isOpen ? "Abierta" : "Cerrada"}
            </h3>
            <p className="text-xs text-muted-foreground">Apertura: 09:00 · Operador: Carlos</p>
          </div>
        </div>
        <button className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          isOpen ? "bg-destructive/20 text-destructive hover:bg-destructive/30" : "gradient-primary text-primary-foreground"
        }`}>
          {isOpen ? "Cerrar Caja" : "Abrir Caja"}
        </button>
      </div>

      {/* Total */}
      <div className="glass-card p-6 text-center">
        <p className="text-sm text-muted-foreground mb-1">Venta Total del Día</p>
        <p className="text-4xl font-display font-bold text-gradient">{formatPrice(totalSales)}</p>
        <p className="text-sm text-muted-foreground mt-2">28 transacciones</p>
      </div>

      {/* Payment methods */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {payments.map((p) => (
          <div key={p.method} className="glass-card-hover p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <p.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{p.method}</p>
                <p className="text-xs text-muted-foreground">{p.count} transacciones</p>
              </div>
            </div>
            <p className="text-xl font-display font-bold text-foreground">{formatPrice(p.amount)}</p>
          </div>
        ))}
      </div>

      {/* Recent transactions */}
      <div className="glass-card p-5">
        <h3 className="font-display font-semibold text-foreground mb-4">Últimas Transacciones</h3>
        <div className="space-y-2">
          {[
            { id: "#028", table: "Mesa 5", amount: 45000, method: "Débito", time: "14:30" },
            { id: "#027", table: "Mesa 3", amount: 28000, method: "Efectivo", time: "14:15" },
            { id: "#026", table: "Delivery", amount: 22000, method: "Transferencia", time: "14:00" },
            { id: "#025", table: "Mesa 8", amount: 72000, method: "Cuenta Empresa", time: "13:45" },
            { id: "#024", table: "Mesa 1", amount: 35000, method: "Efectivo", time: "13:30" },
          ].map((tx) => (
            <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <div>
                  <span className="text-sm font-medium text-foreground">{tx.id} · {tx.table}</span>
                  <p className="text-xs text-muted-foreground">{tx.time} · {tx.method}</p>
                </div>
              </div>
              <span className="text-sm font-semibold text-foreground">{formatPrice(tx.amount)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CashRegister;
