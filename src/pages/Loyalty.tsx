import { Star, Gift, TrendingUp, Users } from "lucide-react";

const customers = [
  { id: 1, name: "Alejandro Vega", points: 1250, visits: 24, tier: "Gold", lastVisit: "2024-01-15" },
  { id: 2, name: "Catalina Morales", points: 850, visits: 16, tier: "Silver", lastVisit: "2024-01-14" },
  { id: 3, name: "Diego Fuentes", points: 2100, visits: 38, tier: "Platinum", lastVisit: "2024-01-15" },
  { id: 4, name: "Elena Campos", points: 320, visits: 6, tier: "Bronze", lastVisit: "2024-01-10" },
  { id: 5, name: "Fernando Reyes", points: 680, visits: 12, tier: "Silver", lastVisit: "2024-01-13" },
];

const tierColors: Record<string, string> = {
  Bronze: "bg-orange-500/20 text-orange-400",
  Silver: "bg-slate-400/20 text-slate-300",
  Gold: "bg-warning/20 text-warning",
  Platinum: "bg-primary/20 text-primary",
};

const Loyalty = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: "Clientes Registrados", value: "156", icon: Users },
          { label: "Puntos Activos", value: "45.200", icon: Star },
          { label: "Canjes este Mes", value: "23", icon: Gift },
          { label: "Retención", value: "78%", icon: TrendingUp },
        ].map((s) => (
          <div key={s.label} className="glass-card-hover p-5">
            <s.icon className="w-5 h-5 text-primary mb-2" />
            <p className="text-2xl font-display font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-display font-semibold text-foreground">Top Clientes Frecuentes</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Cliente</th>
              <th className="text-center text-xs font-medium text-muted-foreground px-4 py-3">Nivel</th>
              <th className="text-center text-xs font-medium text-muted-foreground px-4 py-3">Puntos</th>
              <th className="text-center text-xs font-medium text-muted-foreground px-4 py-3">Visitas</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Última Visita</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-foreground">{c.name}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${tierColors[c.tier]}`}>{c.tier}</span>
                </td>
                <td className="px-4 py-3 text-center text-sm text-primary font-semibold">{c.points.toLocaleString()}</td>
                <td className="px-4 py-3 text-center text-sm text-foreground">{c.visits}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{c.lastVisit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Loyalty;
