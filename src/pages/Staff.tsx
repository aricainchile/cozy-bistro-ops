import { useState, useEffect, useMemo } from "react";
import { Calendar, Clock, Users, Plus, UserPlus, LogIn, LogOut, Phone, Mail, Search, CalendarDays, Timer, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface StaffMember {
  id: string;
  user_id: string | null;
  name: string;
  role: string;
  phone: string;
  email: string | null;
  hire_date: string;
  active: boolean;
  created_at: string;
}

interface StaffShift {
  id: string;
  staff_id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  notes: string | null;
  created_at: string;
}

interface StaffAttendance {
  id: string;
  staff_id: string;
  check_in: string;
  check_out: string | null;
  shift_id: string | null;
  notes: string | null;
}

const ROLES = ["Garzón", "Jefe de Local", "Cocina", "Bartender", "Administrador", "Limpieza"];

const Staff = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState<StaffMember[]>([]);
  const [shifts, setShifts] = useState<StaffShift[]>([]);
  const [attendance, setAttendance] = useState<StaffAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Dialogs
  const [showAddMember, setShowAddMember] = useState(false);
  const [showAddShift, setShowAddShift] = useState(false);

  // Forms
  const [memberForm, setMemberForm] = useState({ name: "", role: "Garzón", phone: "", email: "" });
  const [shiftForm, setShiftForm] = useState({ staff_id: "", shift_date: undefined as Date | undefined, start_time: "", end_time: "", notes: "" });

  const fetchAll = async () => {
    setLoading(true);
    const today = new Date().toISOString().split("T")[0];
    const [{ data: m }, { data: s }, { data: a }] = await Promise.all([
      supabase.from("staff_members").select("*").eq("active", true).order("name"),
      supabase.from("staff_shifts").select("*").gte("shift_date", today).order("shift_date").order("start_time"),
      supabase.from("staff_attendance").select("*").gte("check_in", `${today}T00:00:00`).order("check_in", { ascending: false }),
    ]);
    setMembers((m as StaffMember[]) || []);
    setShifts((s as StaffShift[]) || []);
    setAttendance((a as StaffAttendance[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
    const ch = supabase
      .channel("staff-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "staff_members" }, () => fetchAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "staff_shifts" }, () => fetchAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "staff_attendance" }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const todayAttendance = useMemo(() => {
    const map = new Map<string, StaffAttendance>();
    attendance.forEach(a => {
      if (!map.has(a.staff_id) || !map.get(a.staff_id)!.check_out) {
        map.set(a.staff_id, a);
      }
    });
    return map;
  }, [attendance]);

  const activeNow = members.filter(m => {
    const att = todayAttendance.get(m.id);
    return att && !att.check_out;
  }).length;

  const filtered = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.role.toLowerCase().includes(search.toLowerCase())
  );

  const todayShifts = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return shifts.filter(s => s.shift_date === today);
  }, [shifts]);

  const handleAddMember = async () => {
    if (!memberForm.name) { toast.error("El nombre es obligatorio"); return; }
    const { error } = await supabase.from("staff_members").insert({
      name: memberForm.name,
      role: memberForm.role,
      phone: memberForm.phone,
      email: memberForm.email || null,
    } as any);
    if (error) { toast.error(error.message); return; }
    toast.success(`${memberForm.name} agregado al equipo`);
    setMemberForm({ name: "", role: "Garzón", phone: "", email: "" });
    setShowAddMember(false);
  };

  const handleAddShift = async () => {
    if (!user || !shiftForm.staff_id || !shiftForm.shift_date || !shiftForm.start_time || !shiftForm.end_time) {
      toast.error("Todos los campos son obligatorios"); return;
    }
    const { error } = await supabase.from("staff_shifts").insert({
      staff_id: shiftForm.staff_id,
      shift_date: format(shiftForm.shift_date, "yyyy-MM-dd"),
      start_time: shiftForm.start_time,
      end_time: shiftForm.end_time,
      notes: shiftForm.notes || null,
      created_by: user.id,
    } as any);
    if (error) { toast.error(error.message); return; }
    toast.success("Turno asignado");
    setShiftForm({ staff_id: "", shift_date: undefined, start_time: "", end_time: "", notes: "" });
    setShowAddShift(false);
  };

  const handleCheckIn = async (staffId: string) => {
    if (!user) return;
    const todayShift = todayShifts.find(s => s.staff_id === staffId);
    const { error } = await supabase.from("staff_attendance").insert({
      staff_id: staffId,
      shift_id: todayShift?.id || null,
    } as any);
    if (error) { toast.error(error.message); return; }
    const member = members.find(m => m.id === staffId);
    toast.success(`${member?.name} registró entrada`);
  };

  const handleCheckOut = async (staffId: string) => {
    const att = todayAttendance.get(staffId);
    if (!att) return;
    const { error } = await supabase.from("staff_attendance")
      .update({ check_out: new Date().toISOString() } as any)
      .eq("id", att.id);
    if (error) { toast.error(error.message); return; }
    const member = members.find(m => m.id === staffId);
    toast.success(`${member?.name} registró salida`);
  };

  const formatTime = (t: string) => t.slice(0, 5);
  const formatDateTime = (iso: string) => new Date(iso).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });

  const getHoursWorked = (checkIn: string, checkOut: string | null) => {
    const start = new Date(checkIn);
    const end = checkOut ? new Date(checkOut) : new Date();
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return hours.toFixed(1);
  };

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
          { label: "Total Personal", value: members.length, icon: Users, color: "text-info" },
          { label: "Trabajando Ahora", value: activeNow, icon: CheckCircle2, color: "text-success" },
          { label: "Turnos Hoy", value: todayShifts.length, icon: Calendar, color: "text-warning" },
          { label: "Registros Hoy", value: attendance.length, icon: Timer, color: "text-primary" },
        ].map(s => (
          <div key={s.label} className="glass-card-hover p-5">
            <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
            <p className="text-2xl font-display font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="equipo" className="space-y-4">
        <TabsList>
          <TabsTrigger value="equipo">Equipo</TabsTrigger>
          <TabsTrigger value="turnos">Turnos</TabsTrigger>
          <TabsTrigger value="asistencia">Asistencia</TabsTrigger>
        </TabsList>

        {/* EQUIPO TAB */}
        <TabsContent value="equipo" className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar personal..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Button size="sm" onClick={() => setShowAddMember(true)}>
              <UserPlus className="w-4 h-4 mr-1" /> Agregar Personal
            </Button>
          </div>

          {filtered.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">No hay personal registrado</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(m => {
                const att = todayAttendance.get(m.id);
                const isWorking = att && !att.check_out;
                const todayShift = todayShifts.find(s => s.staff_id === m.id);

                return (
                  <div key={m.id} className="glass-card-hover p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-semibold text-sm text-primary">
                          {m.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{m.name}</p>
                          <p className="text-xs text-muted-foreground">{m.role}</p>
                        </div>
                      </div>
                      <span className={`w-2.5 h-2.5 rounded-full ${isWorking ? "bg-success animate-pulse" : "bg-muted-foreground"}`} />
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {m.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{m.phone}</span>}
                      {m.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{m.email}</span>}
                    </div>

                    {todayShift && (
                      <div className="bg-secondary/50 rounded-lg p-2 text-xs flex items-center gap-2">
                        <Clock className="w-3 h-3 text-primary" />
                        <span className="text-foreground">Turno: {formatTime(todayShift.start_time)} - {formatTime(todayShift.end_time)}</span>
                      </div>
                    )}

                    {isWorking && att && (
                      <div className="bg-success/10 rounded-lg p-2 text-xs flex items-center justify-between">
                        <span className="text-success flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Entrada: {formatDateTime(att.check_in)}
                        </span>
                        <span className="text-muted-foreground">{getHoursWorked(att.check_in, null)}h</span>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {!isWorking ? (
                        <Button size="sm" variant="outline" className="text-xs flex-1" onClick={() => handleCheckIn(m.id)}>
                          <LogIn className="w-3 h-3 mr-1" /> Marcar Entrada
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" className="text-xs flex-1 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => handleCheckOut(m.id)}>
                          <LogOut className="w-3 h-3 mr-1" /> Marcar Salida
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* TURNOS TAB */}
        <TabsContent value="turnos" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-semibold text-foreground">Turnos Programados</h3>
            <Button size="sm" onClick={() => setShowAddShift(true)}>
              <Plus className="w-4 h-4 mr-1" /> Asignar Turno
            </Button>
          </div>

          {shifts.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <CalendarDays className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">No hay turnos programados</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Group shifts by date */}
              {Object.entries(
                shifts.reduce((acc, s) => {
                  const key = s.shift_date;
                  if (!acc[key]) acc[key] = [];
                  acc[key].push(s);
                  return acc;
                }, {} as Record<string, StaffShift[]>)
              ).map(([date, dateShifts]) => (
                <div key={date} className="glass-card p-4">
                  <h4 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-primary" />
                    {format(new Date(date + "T12:00:00"), "EEEE d 'de' MMMM", { locale: es })}
                  </h4>
                  <div className="space-y-2">
                    {dateShifts.map(s => {
                      const member = members.find(m => m.id === s.staff_id);
                      return (
                        <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                              {member?.name.split(" ").map(n => n[0]).join("").slice(0, 2) || "?"}
                            </div>
                            <div>
                              <span className="text-sm font-medium text-foreground">{member?.name || "Desconocido"}</span>
                              <p className="text-xs text-muted-foreground">{member?.role}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-semibold text-primary">
                              {formatTime(s.start_time)} - {formatTime(s.end_time)}
                            </span>
                            {s.notes && <p className="text-xs text-muted-foreground">{s.notes}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ASISTENCIA TAB */}
        <TabsContent value="asistencia" className="space-y-4">
          <div className="glass-card p-5">
            <h3 className="font-display font-semibold text-foreground mb-4">Registro de Asistencia — Hoy</h3>
            {attendance.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">Sin registros de asistencia hoy</p>
            ) : (
              <div className="space-y-2">
                {attendance.map(a => {
                  const member = members.find(m => m.id === a.staff_id);
                  return (
                    <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                      <div className="flex items-center gap-3">
                        {a.check_out ? (
                          <XCircle className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-success" />
                        )}
                        <div>
                          <span className="text-sm font-medium text-foreground">{member?.name || "Desconocido"}</span>
                          <p className="text-xs text-muted-foreground">{member?.role}</p>
                        </div>
                      </div>
                      <div className="text-right text-xs">
                        <span className="text-success">Entrada: {formatDateTime(a.check_in)}</span>
                        {a.check_out && (
                          <>
                            <span className="text-muted-foreground mx-1">·</span>
                            <span className="text-destructive">Salida: {formatDateTime(a.check_out)}</span>
                            <span className="text-muted-foreground ml-2">({getHoursWorked(a.check_in, a.check_out)}h)</span>
                          </>
                        )}
                        {!a.check_out && (
                          <span className="text-success ml-2">({getHoursWorked(a.check_in, null)}h en curso)</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* ADD MEMBER DIALOG */}
      <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
        <DialogContent>
          <DialogHeader><DialogTitle>Agregar Personal</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre *</Label>
              <Input value={memberForm.name} onChange={e => setMemberForm(p => ({ ...p, name: e.target.value }))} placeholder="Nombre completo" />
            </div>
            <div>
              <Label>Cargo</Label>
              <Select value={memberForm.role} onValueChange={v => setMemberForm(p => ({ ...p, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input value={memberForm.phone} onChange={e => setMemberForm(p => ({ ...p, phone: e.target.value }))} placeholder="+56 9 XXXX XXXX" />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={memberForm.email} onChange={e => setMemberForm(p => ({ ...p, email: e.target.value }))} placeholder="correo@ejemplo.com" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddMember(false)}>Cancelar</Button>
              <Button onClick={handleAddMember}>Agregar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ADD SHIFT DIALOG */}
      <Dialog open={showAddShift} onOpenChange={setShowAddShift}>
        <DialogContent>
          <DialogHeader><DialogTitle>Asignar Turno</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Empleado *</Label>
              <Select value={shiftForm.staff_id} onValueChange={v => setShiftForm(p => ({ ...p, staff_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecciona empleado" /></SelectTrigger>
                <SelectContent>
                  {members.map(m => <SelectItem key={m.id} value={m.id}>{m.name} — {m.role}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fecha *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !shiftForm.shift_date && "text-muted-foreground")}>
                    <CalendarDays className="w-4 h-4 mr-2" />
                    {shiftForm.shift_date ? format(shiftForm.shift_date, "PPP", { locale: es }) : "Selecciona fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarPicker
                    mode="single"
                    selected={shiftForm.shift_date}
                    onSelect={d => setShiftForm(p => ({ ...p, shift_date: d }))}
                    disabled={d => d < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Hora Inicio *</Label>
                <Input type="time" value={shiftForm.start_time} onChange={e => setShiftForm(p => ({ ...p, start_time: e.target.value }))} />
              </div>
              <div>
                <Label>Hora Fin *</Label>
                <Input type="time" value={shiftForm.end_time} onChange={e => setShiftForm(p => ({ ...p, end_time: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Notas</Label>
              <Input value={shiftForm.notes} onChange={e => setShiftForm(p => ({ ...p, notes: e.target.value }))} placeholder="Opcional" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddShift(false)}>Cancelar</Button>
              <Button onClick={handleAddShift}>Asignar Turno</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Staff;
