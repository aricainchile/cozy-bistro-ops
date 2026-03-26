import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Printer, Wifi, WifiOff, Settings } from "lucide-react";

interface PrinterRow {
  id: string;
  name: string;
  ip_address: string;
  type: string;
  location: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

const PRINTER_TYPES = [
  { value: "cocina", label: "Cocina" },
  { value: "barra", label: "Barra" },
  { value: "caja", label: "Caja" },
  { value: "general", label: "General" },
];

const typeColors: Record<string, string> = {
  cocina: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  barra: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  caja: "bg-green-500/10 text-green-600 border-green-500/20",
  general: "bg-muted text-muted-foreground border-border",
};

const PrinterConfig = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { userRole } = useAuth();
  const canManage = userRole === "admin" || userRole === "jefe_local";

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState<PrinterRow | null>(null);
  const [form, setForm] = useState({ name: "", ip_address: "", type: "cocina", location: "" });

  const { data: printers = [], isLoading } = useQuery({
    queryKey: ["printers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("printers" as any)
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data as unknown as PrinterRow[]) || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (printer: typeof form & { id?: string }) => {
      if (printer.id) {
        const { error } = await supabase
          .from("printers" as any)
          .update({ name: printer.name, ip_address: printer.ip_address, type: printer.type, location: printer.location, updated_at: new Date().toISOString() } as any)
          .eq("id", printer.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("printers" as any)
          .insert({ name: printer.name, ip_address: printer.ip_address, type: printer.type, location: printer.location } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["printers"] });
      toast({ title: editingPrinter ? "Impresora actualizada" : "Impresora agregada" });
      closeDialog();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from("printers" as any)
        .update({ active, updated_at: new Date().toISOString() } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["printers"] }),
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("printers" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["printers"] });
      toast({ title: "Impresora eliminada" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const openCreate = () => {
    setEditingPrinter(null);
    setForm({ name: "", ip_address: "", type: "cocina", location: "" });
    setDialogOpen(true);
  };

  const openEdit = (p: PrinterRow) => {
    setEditingPrinter(p);
    setForm({ name: p.name, ip_address: p.ip_address, type: p.type, location: p.location });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingPrinter(null);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.ip_address.trim()) {
      toast({ title: "Completa los campos obligatorios", variant: "destructive" });
      return;
    }
    saveMutation.mutate(editingPrinter ? { ...form, id: editingPrinter.id } : form);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" />
            Configuración de Impresoras
          </h1>
          <p className="text-muted-foreground mt-1">Administra las impresoras conectadas al sistema</p>
        </div>
        {canManage && (
          <Button onClick={openCreate} className="gap-2">
            <Plus className="w-4 h-4" /> Agregar Impresora
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : printers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Printer className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground">No hay impresoras configuradas</h3>
            <p className="text-muted-foreground mt-1 mb-4">Agrega una impresora para comenzar a imprimir tickets y comandas</p>
            {canManage && (
              <Button onClick={openCreate} className="gap-2">
                <Plus className="w-4 h-4" /> Agregar Impresora
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {printers.map((p) => (
            <Card key={p.id} className={`transition-all ${!p.active ? "opacity-60" : ""}`}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${p.active ? "bg-primary/10" : "bg-muted"}`}>
                    <Printer className={`w-5 h-5 ${p.active ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <CardTitle className="text-base">{p.name}</CardTitle>
                    <p className="text-sm text-muted-foreground font-mono">{p.ip_address}</p>
                  </div>
                </div>
                {p.active ? (
                  <Wifi className="w-4 h-4 text-green-500" />
                ) : (
                  <WifiOff className="w-4 h-4 text-muted-foreground" />
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={typeColors[p.type] || typeColors.general}>
                    {PRINTER_TYPES.find((t) => t.value === p.type)?.label || p.type}
                  </Badge>
                  {p.location && (
                    <span className="text-xs text-muted-foreground">{p.location}</span>
                  )}
                </div>
                {canManage && (
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={p.active}
                        onCheckedChange={(active) => toggleMutation.mutate({ id: p.id, active })}
                      />
                      <span className="text-xs text-muted-foreground">{p.active ? "Activa" : "Inactiva"}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(p)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      {userRole === "admin" && (
                        <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(p.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPrinter ? "Editar Impresora" : "Agregar Impresora"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input placeholder="Ej: Impresora Cocina 1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Dirección IP / Puerto *</Label>
              <Input placeholder="Ej: 192.168.1.100:9100" value={form.ip_address} onChange={(e) => setForm({ ...form, ip_address: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRINTER_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ubicación</Label>
              <Input placeholder="Ej: Cocina principal" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PrinterConfig;
