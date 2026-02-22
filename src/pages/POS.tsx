import { CreditCard, Wifi, WifiOff, CheckCircle2 } from "lucide-react";

const terminals = [
  { id: 1, name: "Terminal 1 - Caja Principal", model: "Transbank POS", status: "connected", lastTx: "14:30", txToday: 18 },
  { id: 2, name: "Terminal 2 - Caja Barra", model: "Transbank POS", status: "connected", lastTx: "14:15", txToday: 12 },
  { id: 3, name: "Terminal 3 - Móvil", model: "Transbank Portátil", status: "disconnected", lastTx: "13:00", txToday: 5 },
];

const POS = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {terminals.map((t) => (
          <div key={t.id} className="glass-card-hover p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-primary" />
              </div>
              {t.status === "connected" ? (
                <span className="flex items-center gap-1.5 text-xs text-success"><Wifi className="w-3 h-3" /> Conectado</span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs text-destructive"><WifiOff className="w-3 h-3" /> Desconectado</span>
              )}
            </div>
            <h4 className="font-display font-semibold text-foreground text-sm">{t.name}</h4>
            <p className="text-xs text-muted-foreground mb-3">{t.model}</p>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Última tx: {t.lastTx}</span>
              <span>{t.txToday} tx hoy</span>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card p-5">
        <h3 className="font-display font-semibold text-foreground mb-4">Transacciones Recientes</h3>
        <div className="space-y-2">
          {[
            { id: "TX-001", amount: 45000, card: "****4532", type: "Débito", terminal: "Terminal 1", time: "14:30" },
            { id: "TX-002", amount: 28000, card: "****7891", type: "Crédito", terminal: "Terminal 2", time: "14:15" },
            { id: "TX-003", amount: 18500, card: "****2345", type: "Débito", terminal: "Terminal 1", time: "14:00" },
          ].map((tx) => (
            <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <div>
                  <span className="text-sm font-medium text-foreground">{tx.id} · {tx.card}</span>
                  <p className="text-xs text-muted-foreground">{tx.terminal} · {tx.type} · {tx.time}</p>
                </div>
              </div>
              <span className="text-sm font-semibold text-foreground">${tx.amount.toLocaleString("es-CL")}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default POS;
