import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ClipboardList, Play, Clock, CheckCircle, ChevronRight, Pause, RotateCcw } from "lucide-react";

interface PendingServiceOrder {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  startedAt?: string | null;
  pausedAt?: string | null;
  pausedDuration?: number | null;
  clientName?: string | null;
  workOrderName?: string | null;
}

interface ServiceOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceOrders: PendingServiceOrder[];
}

function formatElapsedTime(
  startedAt: string | null | undefined,
  pausedDuration = 0,
  isPaused = false,
  pausedAt?: string | null
): string {
  if (!startedAt) return "";
  const now = Date.now();
  const currentPauseMs = isPaused && pausedAt ? now - new Date(pausedAt).getTime() : 0;
  const diff = now - new Date(startedAt).getTime() - pausedDuration * 1000 - currentPauseMs;
  const totalSec = Math.max(0, Math.floor(diff / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} minuti`;
}

export default function ServiceOrderDialog({ open, onOpenChange, serviceOrders }: ServiceOrderDialogProps) {
  const { toast } = useToast();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState("");

  const current = serviceOrders[currentIndex];

  const startMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("PUT", `/api/service-orders/${id}/start`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-orders/pending"] });
      toast({ title: "Ordine avviato", description: "Il tempo di esecuzione è stato avviato." });
    },
    onError: () => {
      toast({ title: "Errore", description: "Impossibile avviare l'ordine.", variant: "destructive" });
    },
  });

  const pauseMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("PUT", `/api/service-orders/${id}/pause`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-orders/pending"] });
      toast({ title: "Ordine in pausa" });
    },
    onError: () => {
      toast({ title: "Errore", description: "Impossibile mettere in pausa.", variant: "destructive" });
    },
  });

  const resumeMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("PUT", `/api/service-orders/${id}/resume`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-orders/pending"] });
      toast({ title: "Ordine ripreso" });
    },
    onError: () => {
      toast({ title: "Errore", description: "Impossibile riprendere l'ordine.", variant: "destructive" });
    },
  });

  const completeMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const res = await apiRequest("PUT", `/api/service-orders/${id}/complete`, { notes });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-orders/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/daily-reports/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/daily-reports"] });
      toast({
        title: "Ordine completato!",
        description: "L'operazione è stata aggiunta al rapportino di oggi.",
      });
      setShowNotes(false);
      setNotes("");
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Errore", description: "Impossibile completare l'ordine.", variant: "destructive" });
    },
  });

  const handlePosticipa = () => {
    if (currentIndex < serviceOrders.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onOpenChange(false);
    }
  };

  const handleConfermaCompletamento = () => {
    if (!current) return;
    completeMutation.mutate({ id: current.id, notes });
  };

  if (!current) return null;

  const isIniziated = current.status === "iniziato";
  const isPaused = current.status === "in_pausa";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            <DialogTitle>Ordine di Servizio</DialogTitle>
            {serviceOrders.length > 1 && (
              <Badge variant="secondary" className="ml-auto">
                {currentIndex + 1} / {serviceOrders.length}
              </Badge>
            )}
          </div>
          <DialogDescription>
            {isPaused
              ? "Ordine in pausa — riprendi o termina."
              : isIniziated
              ? "Ordine in corso — puoi metterlo in pausa o completarlo."
              : "Hai un ordine di servizio assegnato."}
          </DialogDescription>
        </DialogHeader>

        {!showNotes ? (
          <div className="space-y-4">
            {/* Dettagli ordine */}
            <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
              <h3 className="font-semibold text-base">{current.name}</h3>
              {current.description && (
                <p className="text-sm text-muted-foreground">{current.description}</p>
              )}
              <div className="flex flex-wrap gap-2 pt-1">
                {current.clientName && (
                  <Badge variant="outline" className="text-xs">
                    Cliente: {current.clientName}
                  </Badge>
                )}
                {current.workOrderName && (
                  <Badge variant="outline" className="text-xs">
                    Commessa: {current.workOrderName}
                  </Badge>
                )}
              </div>
              {(isIniziated || isPaused) && current.startedAt && (
                <div className={`flex items-center gap-1 text-sm pt-1 ${isPaused ? "text-purple-600 dark:text-purple-400" : "text-amber-600 dark:text-amber-400"}`}>
                  <Clock className="h-4 w-4" />
                  <span>
                    {isPaused ? "In pausa — lavoro effettivo: " : "In corso da: "}
                    {formatElapsedTime(current.startedAt, current.pausedDuration ?? 0, isPaused, current.pausedAt)}
                  </span>
                </div>
              )}
            </div>

            {/* Azioni */}
            <div className="flex flex-col gap-2">
              {isPaused ? (
                <>
                  <Button
                    onClick={() => resumeMutation.mutate(current.id)}
                    className="w-full"
                    disabled={resumeMutation.isPending}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    {resumeMutation.isPending ? "Riprendendo..." : "Riprendi"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowNotes(true)}
                    className="w-full"
                    disabled={completeMutation.isPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Termina ordine
                  </Button>
                </>
              ) : isIniziated ? (
                <>
                  <Button
                    onClick={() => pauseMutation.mutate(current.id)}
                    variant="outline"
                    className="w-full"
                    disabled={pauseMutation.isPending}
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    {pauseMutation.isPending ? "Pausa..." : "Metti in pausa"}
                  </Button>
                  <Button
                    onClick={() => setShowNotes(true)}
                    className="w-full"
                    disabled={completeMutation.isPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Termina ordine
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => startMutation.mutate(current.id)}
                  className="w-full"
                  disabled={startMutation.isPending}
                >
                  <Play className="h-4 w-4 mr-2" />
                  {startMutation.isPending ? "Avvio..." : "Inizia"}
                </Button>
              )}
              <Button variant="outline" onClick={handlePosticipa} className="w-full">
                {serviceOrders.length > 1 && currentIndex < serviceOrders.length - 1 ? (
                  <>
                    Prossimo <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                ) : (
                  "Posticipa"
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Aggiungi un commento (opzionale)</p>
              <Textarea
                placeholder="Descrivi brevemente il lavoro svolto..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Button
                onClick={handleConfermaCompletamento}
                disabled={completeMutation.isPending}
                className="w-full"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {completeMutation.isPending ? "Completamento..." : "Conferma completamento"}
              </Button>
              <Button variant="outline" onClick={() => setShowNotes(false)} className="w-full">
                Indietro
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
