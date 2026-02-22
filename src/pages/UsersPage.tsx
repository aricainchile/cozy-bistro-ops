import { Users, Shield, UserPlus, Edit, Trash2 } from "lucide-react";

const users = [
  { id: 1, name: "Carlos Muñoz", role: "garzon", email: "carlos@restaurant.cl", status: "active" },
  { id: 2, name: "María López", role: "garzon", email: "maria@restaurant.cl", status: "active" },
  { id: 3, name: "Pedro Soto", role: "jefe_local", email: "pedro@restaurant.cl", status: "active" },
  { id: 4, name: "Ana Torres", role: "admin", email: "ana@restaurant.cl", status: "active" },
  { id: 5, name: "Luis Herrera", role: "garzon", email: "luis@restaurant.cl", status: "inactive" },
];

const roleLabels: Record<string, string> = {
  garzon: "Garzón",
  jefe_local: "Jefe de Local",
  admin: "Administrador",
};

const roleColors: Record<string, string> = {
  garzon: "bg-info/20 text-info",
  jefe_local: "bg-warning/20 text-warning",
  admin: "bg-primary/20 text-primary",
};

const UsersPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{users.length} usuarios registrados</p>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-primary text-primary-foreground font-medium text-sm">
          <UserPlus className="w-4 h-4" /> Agregar Usuario
        </button>
      </div>

      {/* Role legend */}
      <div className="flex gap-3">
        {Object.entries(roleLabels).map(([key, label]) => (
          <div key={key} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${roleColors[key]}`}>
            <Shield className="w-3 h-3" /> {label}
          </div>
        ))}
      </div>

      {/* Permissions summary */}
      <div className="glass-card p-5">
        <h3 className="font-display font-semibold text-foreground mb-3">Permisos por Rol</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 text-xs text-muted-foreground">Módulo</th>
                <th className="text-center py-2 px-3 text-xs text-muted-foreground">Garzón</th>
                <th className="text-center py-2 px-3 text-xs text-muted-foreground">Jefe Local</th>
                <th className="text-center py-2 px-3 text-xs text-muted-foreground">Administrador</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Pedidos", true, true, true],
                ["Mesas (ver)", true, true, true],
                ["Mesas (editar)", false, true, true],
                ["Productos", false, false, true],
                ["Caja", false, true, true],
                ["Inventario", false, true, true],
                ["Usuarios", false, true, true],
                ["Análisis", false, false, true],
              ].map(([mod, g, j, a], i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-2 px-3 text-foreground">{mod as string}</td>
                  {[g, j, a].map((v, vi) => (
                    <td key={vi} className="text-center py-2 px-3">
                      <span className={`text-xs ${v ? "text-success" : "text-destructive"}`}>
                        {v ? "✓" : "✗"}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Users list */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Nombre</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Email</th>
                <th className="text-center text-xs font-medium text-muted-foreground px-4 py-3">Rol</th>
                <th className="text-center text-xs font-medium text-muted-foreground px-4 py-3">Estado</th>
                <th className="text-center text-xs font-medium text-muted-foreground px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-foreground">{user.name}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{user.email}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${roleColors[user.role]}`}>
                      {roleLabels[user.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${user.status === "active" ? "status-available" : "bg-muted text-muted-foreground"}`}>
                      {user.status === "active" ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button className="w-7 h-7 rounded-md bg-secondary flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button className="w-7 h-7 rounded-md bg-secondary flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UsersPage;
