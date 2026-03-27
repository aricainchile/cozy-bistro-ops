import { useState, useEffect } from "react";
import { Printer, ChefHat, Wine, Receipt, Check, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PrintJob {
  id: string;
  order_id: string;
  order_number: number;
  table_info: string;
  destination: string;
  items: Array<{ name: string; quantity: number }>;
  status: string;
  created_at: string;
}

const destIcons: Record<string, typeof ChefHat> = {
  cocina: ChefHat,
  barra: Wine,
  caja: Receipt,
};

const destLabels: Record<string, string> = {
  cocina: "Cocina",
  barra: "Barra",
  caja: "Caja",
};

const destColors: Record<string, string> = {
  cocina: "bg-warning/20 text-warning border-warning/30",
  barra: "bg-info/20 text-info border-info/30",
  caja: "bg-primary/20 text-primary border-primary/30",
};

const Printing = () => {
  const [printJobs, setPrintJobs] = useState<PrintJob[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPrintJobs = async () => {
    const { data, error } = await supabase
      .from("print_jobs")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (data) {
      setPrintJobs(
        data.map((d: any) => ({
          ...d,
          items: typeof d.items === "string" ? JSON.parse(d.items) : d.items,
        }))
      );
    }
    if (error) console.error(error);
    setLoading(false);
  };

  useEffect(() => {
    fetchPrintJobs();
    const ch = supabase
      .channel("print_jobs_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "print_jobs" }, () => fetchPrintJobs())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const handlePrint = async (jobId: string) => {
    const { error } = await supabase
      .from("print_jobs")
      .update({ status: "printed" } as any)
      .eq("id", jobId);
    if (error) toast.error("Error al marcar como impreso");
    else toast.success("Comanda marcada como impresa");
  };

  const handlePrintAll = async (destination: string) => {
    const ids = printJobs.filter((j) => j.destination === destination).map((j) => j.id);
    if (ids.length === 0) return;
    const { error } = await supabase
      .from("print_jobs")
      .update({ status: "printed" } as any)
      .in("id", ids);
    if (error) toast.error("Error al imprimir");
    else toast.success(`${ids.length} comandas de ${destLabels[destination]} impresas`);
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const destinations = ["cocina", "barra", "caja"];

  return (
    <div className="space-y-6">
      {/* Destination summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {destinations.map((dest) => {
          const Icon = destIcons[dest] || Receipt;
          const count = printJobs.filter((p) => p.destination === dest).length;
          return (
            <div key={dest} className={`glass-card p-5 border ${destColors[dest] || destColors.caja}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icon className="w-6 h-6" />
                  <div>
                    <h4 className="font-display font-semibold">{destLabels[dest] || dest}</h4>
                    <p className="text-xs opacity-70">{count} comandas pendientes</p>
                  </div>
                </div>
                {count > 0 && (
                  <button
                    onClick={() => handlePrintAll(dest)}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-background/50 text-xs font-medium hover:bg-background transition-colors"
                  >
                    <Printer className="w-3 h-3" /> Imprimir todo
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Print queue */}
      {printJobs.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Check className="w-12 h-12 text-success mx-auto mb-3" />
          <h3 className="font-display font-semibold text-foreground mb-1">Sin comandas pendientes</h3>
          <p className="text-sm text-muted-foreground">Las nuevas comandas aparecerán aquí automáticamente</p>
        </div>
      ) : (
        <div className="space-y-3">
          {printJobs.map((p) => {
            const Icon = destIcons[p.destination] || Receipt;
            const colors = destColors[p.destination] || destColors.caja;
            return (
              <div key={p.id} className="glass-card-hover p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${colors}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-semibold text-primary">#{p.order_number}</span>
                      <span className="text-sm text-foreground">{p.table_info}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${colors}`}>
                        {destLabels[p.destination] || p.destination}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {p.items.map((i) => `${i.name}${i.quantity > 1 ? ` x${i.quantity}` : ""}`).join(" · ")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{formatTime(p.created_at)}</span>
                  <button
                    onClick={() => handlePrint(p.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-foreground text-xs font-medium hover:bg-accent transition-colors"
                  >
                    <Printer className="w-3 h-3" /> Imprimir
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Refresh */}
      <div className="flex justify-center">
        <button
          onClick={fetchPrintJobs}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-foreground text-xs font-medium hover:bg-accent transition-colors"
        >
          <RefreshCw className="w-3 h-3" /> Actualizar
        </button>
      </div>
    </div>
  );
};

export default Printing;
