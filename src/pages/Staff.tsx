import { Calendar, Clock, Users, Plus } from "lucide-react";

const staff = [
  { id: 1, name: "Carlos Muñoz", role: "Garzón", shift: "09:00 - 17:00", status: "working", hours: 32 },
  { id: 2, name: "María López", role: "Garzón", shift: "12:00 - 20:00", status: "working", hours: 28 },
  { id: 3, name: "Pedro Soto", role: "Jefe de Local", shift: "08:00 - 18:00", status: "working", hours: 40 },
  { id: 4, name: "Luis Herrera", role: "Garzón", shift: "Libre", status: "off", hours: 24 },
  { id: 5, name: "Ana Torres", role: "Administrador", shift: "09:00 - 18:00", status: "working", hours: 36 },
  { id: 6, name: "Roberto Díaz", role: "Cocina", shift: "07:00 - 15:00", status: "working", hours: 38 },
];

const Staff = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <div className="glass-card px-4 py-2 flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-sm text-foreground">{staff.filter((s) => s.status === "working").length} trabajando</span>
          </div>
          <div className="glass-card px-4 py-2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{staff.filter((s) => s.status === "off").length} libres</span>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-primary text-primary-foreground font-medium text-sm">
          <Plus className="w-4 h-4" /> Agregar Turno
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {staff.map((s) => (
          <div key={s.id} className="glass-card-hover p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-semibold text-sm text-primary">
                  {s.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.role}</p>
                </div>
              </div>
              <span className={`w-2.5 h-2.5 rounded-full ${s.status === "working" ? "bg-success" : "bg-muted-foreground"}`} />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock className="w-3 h-3" /> {s.shift}
              </span>
              <span className="text-muted-foreground">{s.hours}h/sem</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Staff;
