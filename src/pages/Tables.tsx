import { useState, useEffect } from "react";
import { Plus, Users, Edit2, Trash2, UserPlus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type TableStatus = "available" | "occupied" | "reserved";

interface RestaurantTable {
  id: string;
  table_number: number;
  seats: number;
  status: TableStatus;
  guests: number;
  waiter_name: string | null;
  created_at: string;
  updated_at: string;
}

const statusLabels: Record<TableStatus, string> = {
  available: "Disponible",
  occupied: "Ocupada",
  reserved: "Reservada",
};

const statusColors: Record<TableStatus, { bg: string; text: string; border: string; badge: string }> = {
  available: {
    bg: "bg-success/20",
    text: "text-success",
    border: "border-success/40",
    badge: "bg-success/15 text-success border-success/30",
  },
  occupied: {
    bg: "bg-destructive/20",
    text: "text-destructive",
    border: "border-destructive/40",
    badge: "bg-destructive/15 text-destructive border-destructive/30",
  },
  reserved: {
    bg: "bg-warning/20",
    text: "text-warning",
    border: "border-warning/40",
    badge: "bg-warning/15 text-warning border-warning/30",
  },
};

const Tables = () => {
  const { userRole } = useAuth();
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<RestaurantTable | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Form state
  const [formNumber, setFormNumber] = useState("");
  const [formSeats, setFormSeats] = useState("4");
  const [formStatus, setFormStatus] = useState<TableStatus>("available");
  const [formGuests, setFormGuests] = useState("0");
  const [formWaiter, setFormWaiter] = useState("");
  const [saving, setSaving] = useState(false);

  const canManage = userRole === "admin" || userRole === "jefe_local";
  const canDelete = userRole === "admin";

  const fetchTables = async () => {
    const { data, error } = await supabase
      .from("restaurant_tables")
      .select("*")
      .order("table_number");

    if (error) {
      toast.error("Error al cargar mesas");
      return;
    }
    setTables((data as RestaurantTable[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchTables();

    const channel = supabase
      .channel("restaurant_tables_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "restaurant_tables" },
        () => fetchTables()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const openCreate = () => {
    setEditingTable(null);
    const nextNumber = tables.length > 0 ? Math.max(...tables.map((t) => t.table_number)) + 1 : 1;
    setFormNumber(String(nextNumber));
    setFormSeats("4");
    setFormStatus("available");
    setFormGuests("0");
    setFormWaiter("");
    setDialogOpen(true);
  };

  const openEdit = (table: RestaurantTable) => {
    setEditingTable(table);
    setFormNumber(String(table.table_number));
    setFormSeats(String(table.seats));
    setFormStatus(table.status);
    setFormGuests(String(table.guests ?? 0));
    setFormWaiter(table.waiter_name ?? "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const number = parseInt(formNumber);
    const seats = parseInt(formSeats);
    const guests = parseInt(formGuests);

    if (!number || number < 1) {
      toast.error("Número de mesa inválido");
      return;
    }
    if (!seats || seats < 1) {
      toast.error("Número de asientos inválido");
      return;
    }

    setSaving(true);

    if (editingTable) {
      const { error } = await supabase
        .from("restaurant_tables")
        .update({
          table_number: number,
          seats,
          status: formStatus,
          guests: guests || 0,
          waiter_name: formWaiter || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingTable.id);

      if (error) {
        toast.error(error.message.includes("unique") ? "Ya existe una mesa con ese número" : "Error al actualizar mesa");
      } else {
        toast.success(`Mesa ${number} actualizada`);
        setDialogOpen(false);
      }
    } else {
      const { error } = await supabase
        .from("restaurant_tables")
        .insert({
          table_number: number,
          seats,
          status: formStatus,
          guests: guests || 0,
          waiter_name: formWaiter || null,
        });

      if (error) {
        toast.error(error.message.includes("unique") ? "Ya existe una mesa con ese número" : "Error al crear mesa");
      } else {
        toast.success(`Mesa ${number} creada`);
        setDialogOpen(false);
      }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("restaurant_tables").delete().eq("id", id);
    if (error) {
      toast.error("Error al eliminar mesa");
    } else {
      toast.success("Mesa eliminada");
    }
    setDeleteConfirm(null);
  };

  const cycleStatus = async (table: RestaurantTable) => {
    const next: Record<TableStatus, TableStatus> = {
      available: "occupied",
      occupied: "reserved",
      reserved: "available",
    };
    const newStatus = next[table.status];
    const { error } = await supabase
      .from("restaurant_tables")
      .update({
        status: newStatus,
        guests: newStatus === "available" ? 0 : table.guests,
        waiter_name: newStatus === "available" ? null : table.waiter_name,
        updated_at: new Date().toISOString(),
      })
      .eq("id", table.id);

    if (error) toast.error("Error al cambiar estado");
  };

  const counts = {
    total: tables.length,
    available: tables.filter((t) => t.status === "available").length,
    occupied: tables.filter((t) => t.status === "occupied").length,
    reserved: tables.filter((t) => t.status === "reserved").length,
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
      {/* Summary */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: "Total", value: counts.total, cls: "bg-secondary text-secondary-foreground" },
          { label: "Disponibles", value: counts.available, cls: statusColors.available.badge },
          { label: "Ocupadas", value: counts.occupied, cls: statusColors.occupied.badge },
          { label: "Reservadas", value: counts.reserved, cls: statusColors.reserved.badge },
        ].map((s) => (
          <div key={s.label} className={`px-4 py-2 rounded-lg border text-sm font-medium ${s.cls}`}>
            {s.label}: {s.value}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {tables.map((table) => {
          const colors = statusColors[table.status];
          return (
            <div
              key={table.id}
              className={`glass-card-hover p-4 cursor-pointer text-center relative group border ${colors.border}`}
              onClick={() => cycleStatus(table)}
            >
              {/* Action buttons */}
              {canManage && (
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); openEdit(table); }}
                    className="p-1 rounded bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  {canDelete && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteConfirm(table.id); }}
                      className="p-1 rounded bg-destructive/20 hover:bg-destructive/40 text-destructive transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}

              <div className={`w-14 h-14 mx-auto rounded-xl flex items-center justify-center text-xl font-display font-bold mb-2 ${colors.bg} ${colors.text}`}>
                {table.table_number}
              </div>
              <p className="text-xs text-muted-foreground mb-1">{table.seats} asientos</p>
              <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium border ${colors.badge}`}>
                {statusLabels[table.status]}
              </span>
              {table.guests > 0 && (
                <div className="flex items-center justify-center gap-1 mt-2 text-xs text-muted-foreground">
                  <Users className="w-3 h-3" /> {table.guests}
                </div>
              )}
              {table.waiter_name && (
                <p className="text-[10px] text-primary mt-1">{table.waiter_name}</p>
              )}
            </div>
          );
        })}

        {/* Add table button */}
        {canManage && (
          <button
            onClick={openCreate}
            className="glass-card flex flex-col items-center justify-center p-4 border-dashed border-2 border-muted-foreground/20 hover:border-primary/50 transition-colors cursor-pointer min-h-[140px]"
          >
            <Plus className="w-8 h-8 text-muted-foreground mb-2" />
            <span className="text-xs text-muted-foreground">Agregar Mesa</span>
          </button>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTable ? `Editar Mesa ${editingTable.table_number}` : "Nueva Mesa"}</DialogTitle>
            <DialogDescription>
              {editingTable ? "Modifica los datos de la mesa." : "Completa los datos para crear una nueva mesa."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="table-number">Número</Label>
                <Input
                  id="table-number"
                  type="number"
                  min={1}
                  value={formNumber}
                  onChange={(e) => setFormNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="table-seats">Asientos</Label>
                <Input
                  id="table-seats"
                  type="number"
                  min={1}
                  max={20}
                  value={formSeats}
                  onChange={(e) => setFormSeats(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={formStatus} onValueChange={(v) => setFormStatus(v as TableStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Disponible</SelectItem>
                    <SelectItem value="occupied">Ocupada</SelectItem>
                    <SelectItem value="reserved">Reservada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="table-guests">Comensales</Label>
                <Input
                  id="table-guests"
                  type="number"
                  min={0}
                  value={formGuests}
                  onChange={(e) => setFormGuests(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="table-waiter">Mesero/a asignado</Label>
              <Input
                id="table-waiter"
                value={formWaiter}
                onChange={(e) => setFormWaiter(e.target.value)}
                placeholder="Nombre del mesero"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Guardando..." : editingTable ? "Actualizar" : "Crear Mesa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Mesa</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar esta mesa? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Tables;
