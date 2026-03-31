import { useState, useEffect } from "react";
import { Users, Shield, UserPlus, Edit, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppRole, roleDisplayName } from "@/lib/permissions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface UserRow {
  id: string;
  full_name: string | null;
  email: string | null;
  role: AppRole | null;
}

const roleColors: Record<string, string> = {
  garzon: "bg-info/20 text-info",
  jefe_local: "bg-warning/20 text-warning",
  admin: "bg-primary/20 text-primary",
};

const UsersPage = () => {
  const { toast } = useToast();
  const { userRole } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<AppRole>("garzon");
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, full_name, email");

    if (error) {
      toast({ title: "Error al cargar usuarios", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    const { data: roles } = await supabase.from("user_roles").select("user_id, role");
    const roleMap = new Map((roles || []).map((r) => [r.user_id, r.role as AppRole]));

    setUsers(
      (profiles || []).map((p) => ({
        id: p.id,
        full_name: p.full_name,
        email: p.email,
        role: roleMap.get(p.id) || null,
      }))
    );
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openCreate = () => {
    setEditingUser(null);
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    setFormRole("garzon");
    setDialogOpen(true);
  };

  const openEdit = (user: UserRow) => {
    setEditingUser(user);
    setFormName(user.full_name || "");
    setFormEmail(user.email || "");
    setFormPassword("");
    setFormRole(user.role || "garzon");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingUser) {
        // Update profile name
        await supabase.from("profiles").update({ full_name: formName }).eq("id", editingUser.id);
        // Update role
        const { data: existingRole } = await supabase
          .from("user_roles")
          .select("id")
          .eq("user_id", editingUser.id)
          .maybeSingle();

        if (existingRole) {
          await supabase.from("user_roles").update({ role: formRole }).eq("user_id", editingUser.id);
        } else {
          await supabase.from("user_roles").insert({ user_id: editingUser.id, role: formRole });
        }
        toast({ title: "Usuario actualizado" });
      } else {
        // Create new user via edge function (doesn't affect current session)
        if (!formEmail || !formPassword) {
          toast({ title: "Email y contraseña son requeridos", variant: "destructive" });
          setSaving(false);
          return;
        }
        const { data: fnData, error: fnError } = await supabase.functions.invoke("manage-user", {
          body: { action: "create", email: formEmail, password: formPassword, full_name: formName, role: formRole },
        });
        if (fnError) throw fnError;
        if (fnData?.error) throw new Error(fnData.error);
        toast({ title: "Usuario creado exitosamente" });
      }
      setDialogOpen(false);
      fetchUsers();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const handleDelete = async (user: UserRow) => {
    if (!confirm(`¿Eliminar a ${user.full_name || user.email}?`)) return;
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke("manage-user", {
        body: { action: "delete", user_id: user.id },
      });
      if (fnError) throw fnError;
      if (fnData?.error) throw new Error(fnData.error);
      toast({ title: "Usuario eliminado" });
      fetchUsers();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{users.length} usuarios registrados</p>
        {(userRole === "admin" || userRole === "jefe_local") && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-primary text-primary-foreground font-medium text-sm"
          >
            <UserPlus className="w-4 h-4" /> Agregar Usuario
          </button>
        )}
      </div>

      {/* Role legend */}
      <div className="flex gap-3">
        {Object.entries(roleDisplayName).map(([key, label]) => (
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
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Nombre</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Email</th>
                  <th className="text-center text-xs font-medium text-muted-foreground px-4 py-3">Rol</th>
                  <th className="text-center text-xs font-medium text-muted-foreground px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{user.full_name || "Sin nombre"}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{user.email}</td>
                    <td className="px-4 py-3 text-center">
                      {user.role ? (
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${roleColors[user.role]}`}>
                          {roleDisplayName[user.role]}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Sin rol</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEdit(user)}
                          className="w-7 h-7 rounded-md bg-secondary flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        {userRole === "admin" && (
                          <button
                            onClick={() => handleDelete(user)}
                            className="w-7 h-7 rounded-md bg-secondary flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No hay usuarios registrados</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? "Editar Usuario" : "Agregar Usuario"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre completo</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Nombre del usuario" />
            </div>
            {!editingUser && (
              <>
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="correo@ejemplo.cl" />
                </div>
                <div>
                  <Label>Contraseña</Label>
                  <Input type="password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
                </div>
              </>
            )}
            <div>
              <Label>Rol</Label>
              <Select value={formRole} onValueChange={(v) => setFormRole(v as AppRole)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="garzon">Garzón</SelectItem>
                  <SelectItem value="jefe_local">Jefe de Local</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setDialogOpen(false)} className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground">
              Cancelar
            </button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersPage;
