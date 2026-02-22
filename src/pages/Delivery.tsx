import { Truck, Clock, CheckCircle2, MapPin, Phone } from "lucide-react";

const deliveries = [
  { id: "#D-001", customer: "Juan Pérez", phone: "+56 9 1234 5678", address: "Av. Providencia 1234", items: 3, total: 32000, status: "En camino", time: "14:20" },
  { id: "#D-002", customer: "Ana Silva", phone: "+56 9 8765 4321", address: "Los Leones 567", items: 2, total: 22000, status: "Preparando", time: "14:30" },
  { id: "#D-003", customer: "Roberto Díaz", phone: "+56 9 5555 1234", address: "Irarrázaval 890", items: 4, total: 45000, status: "Entregado", time: "13:50" },
  { id: "#D-004", customer: "Carmen Rojas", phone: "+56 9 3333 7890", address: "Ñuñoa 456", items: 1, total: 15000, status: "Pendiente", time: "14:35" },
];

const statusColors: Record<string, string> = {
  "En camino": "bg-info/20 text-info",
  "Preparando": "bg-warning/20 text-warning",
  "Entregado": "bg-success/20 text-success",
  "Pendiente": "bg-muted text-muted-foreground",
};

const Delivery = () => {
  const formatPrice = (n: number) => `$${n.toLocaleString("es-CL")}`;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Pendientes", value: 1, icon: Clock, color: "text-muted-foreground" },
          { label: "Preparando", value: 1, icon: Truck, color: "text-warning" },
          { label: "En camino", value: 1, icon: MapPin, color: "text-info" },
          { label: "Entregados", value: 1, icon: CheckCircle2, color: "text-success" },
        ].map((s) => (
          <div key={s.label} className="glass-card p-4 text-center">
            <s.icon className={`w-6 h-6 mx-auto mb-2 ${s.color}`} />
            <p className="text-2xl font-display font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Deliveries list */}
      <div className="space-y-3">
        {deliveries.map((d) => (
          <div key={d.id} className="glass-card-hover p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono font-semibold text-primary">{d.id}</span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[d.status]}`}>
                  {d.status}
                </span>
              </div>
              <span className="text-sm font-semibold text-foreground">{formatPrice(d.total)}</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{d.customer}</span>
              <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{d.phone}</span>
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{d.address}</span>
              <span>{d.items} items · {d.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Delivery;
