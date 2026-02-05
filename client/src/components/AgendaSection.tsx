import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Calendar,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  Bell,
  Clock,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";

type AgendaItem = {
  id: string;
  title: string;
  description: string | null;
  eventDate: string;
  eventTime: string | null;
  eventType: "deadline" | "appointment" | "reminder";
  recurrence: string | null;
  createdAt: string;
};

type FormData = {
  title: string;
  description: string;
  eventDate: string;
  eventTime: string;
  eventType: "deadline" | "appointment" | "reminder";
  recurrence: string;
};

const eventTypeConfig = {
  deadline: {
    label: "Scadenza",
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    borderColor: "border-l-red-500",
    icon: AlertCircle,
  },
  appointment: {
    label: "Appuntamento",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    borderColor: "border-l-blue-500",
    icon: Calendar,
  },
  reminder: {
    label: "Promemoria",
    color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    borderColor: "border-l-yellow-500",
    icon: Bell,
  },
};

const recurrenceOptions = [
  { value: "", label: "Nessuna" },
  { value: "daily", label: "Giornaliera" },
  { value: "weekly", label: "Settimanale" },
  { value: "monthly", label: "Mensile" },
  { value: "yearly", label: "Annuale" },
];

const initialFormData: FormData = {
  title: "",
  description: "",
  eventDate: new Date().toISOString().split("T")[0],
  eventTime: "",
  eventType: "reminder",
  recurrence: "",
};

export default function AgendaSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [filterType, setFilterType] = useState<string>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AgendaItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<AgendaItem | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);

  // Calculate date range for current month view
  const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

  const { data: items = [], isLoading } = useQuery<AgendaItem[]>({
    queryKey: [
      "/api/agenda",
      startOfMonth.toISOString().split("T")[0],
      endOfMonth.toISOString().split("T")[0],
      filterType,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: startOfMonth.toISOString().split("T")[0],
        endDate: endOfMonth.toISOString().split("T")[0],
      });
      if (filterType !== "all") {
        params.set("eventType", filterType);
      }
      const response = await fetch(`/api/agenda?${params}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch agenda");
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        title: data.title,
        description: data.description || null,
        eventDate: data.eventDate,
        eventTime: data.eventTime || null,
        eventType: data.eventType,
        recurrence: data.recurrence && data.recurrence !== "none" ? data.recurrence : null,
      };
      const response = await apiRequest("POST", "/api/agenda", payload);
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Errore nella creazione");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agenda"] });
      toast({ title: "Evento creato con successo" });
      closeForm();
    },
    onError: (error: Error) => {
      toast({ title: error.message || "Errore nella creazione", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FormData }) => {
      const payload = {
        title: data.title,
        description: data.description || null,
        eventDate: data.eventDate,
        eventTime: data.eventTime || null,
        eventType: data.eventType,
        recurrence: data.recurrence && data.recurrence !== "none" ? data.recurrence : null,
      };
      const response = await apiRequest("PUT", `/api/agenda/${id}`, payload);
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Errore nell'aggiornamento");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agenda"] });
      toast({ title: "Evento aggiornato con successo" });
      closeForm();
    },
    onError: (error: Error) => {
      toast({ title: error.message || "Errore nell'aggiornamento", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/agenda/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agenda"] });
      toast({ title: "Evento eliminato" });
      setIsDeleteOpen(false);
      setDeletingItem(null);
    },
    onError: () => {
      toast({ title: "Errore nell'eliminazione", variant: "destructive" });
    },
  });

  const openCreateForm = () => {
    setEditingItem(null);
    setFormData(initialFormData);
    setIsFormOpen(true);
  };

  const openEditForm = (item: AgendaItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description || "",
      eventDate: item.eventDate,
      eventTime: item.eventTime || "",
      eventType: item.eventType,
      recurrence: item.recurrence || "",
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingItem(null);
    setFormData(initialFormData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const openDeleteDialog = (item: AgendaItem) => {
    setDeletingItem(item);
    setIsDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (deletingItem) {
      deleteMutation.mutate(deletingItem.id);
    }
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  // Group items by date for calendar view
  const itemsByDate = items.reduce((acc, item) => {
    if (!acc[item.eventDate]) {
      acc[item.eventDate] = [];
    }
    acc[item.eventDate].push(item);
    return acc;
  }, {} as Record<string, AgendaItem[]>);

  // Generate calendar days
  const calendarDays: Date[] = [];
  const firstDayOfWeek = (startOfMonth.getDay() + 6) % 7; // Monday = 0
  const startDate = new Date(startOfMonth);
  startDate.setDate(startDate.getDate() - firstDayOfWeek);

  for (let i = 0; i < 42; i++) {
    calendarDays.push(new Date(startDate));
    startDate.setDate(startDate.getDate() + 1);
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Agenda</h2>
          <p className="text-muted-foreground">Gestisci scadenze, appuntamenti e promemoria</p>
        </div>
        <Button onClick={openCreateForm}>
          <Plus className="h-4 w-4 mr-2" />
          Nuovo Evento
        </Button>
      </div>

      {/* Filters and Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium min-w-[150px] text-center">
            {currentMonth.toLocaleDateString("it-IT", { month: "long", year: "numeric" })}
          </span>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={goToToday}>
            Oggi
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filtra per tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti</SelectItem>
              <SelectItem value="deadline">Scadenze</SelectItem>
              <SelectItem value="appointment">Appuntamenti</SelectItem>
              <SelectItem value="reminder">Promemoria</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {/* Day headers */}
              {["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}

              {/* Calendar days */}
              {calendarDays.map((day, index) => {
                const dateStr = day.toISOString().split("T")[0];
                const dayItems = itemsByDate[dateStr] || [];
                const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                const isToday = dateStr === today;

                return (
                  <div
                    key={index}
                    className={`min-h-[80px] p-1 border rounded-lg ${
                      isCurrentMonth ? "bg-background" : "bg-muted/30"
                    } ${isToday ? "ring-2 ring-primary" : ""}`}
                  >
                    <div className={`text-xs font-medium mb-1 ${
                      isCurrentMonth ? "" : "text-muted-foreground"
                    } ${isToday ? "text-primary" : ""}`}>
                      {day.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dayItems.slice(0, 2).map((item) => {
                        const config = eventTypeConfig[item.eventType];
                        return (
                          <div
                            key={`${item.id}-${dateStr}`}
                            onClick={() => openEditForm(item)}
                            className={`text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 ${config.color}`}
                            title={item.title}
                          >
                            {item.title}
                          </div>
                        );
                      })}
                      {dayItems.length > 2 && (
                        <div className="text-xs text-muted-foreground text-center">
                          +{dayItems.length - 2}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Eventi del Mese</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nessun evento in questo mese
            </p>
          ) : (
            <div className="space-y-2">
              {items.map((item) => {
                const config = eventTypeConfig[item.eventType];
                const Icon = config.icon;
                return (
                  <div
                    key={`${item.id}-${item.eventDate}`}
                    className={`flex items-center gap-3 p-3 rounded-lg border-l-4 ${config.borderColor} bg-muted/30`}
                  >
                    <div className={`p-2 rounded ${config.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.title}</span>
                        {item.recurrence && (
                          <Badge variant="outline" className="text-xs">
                            {recurrenceOptions.find((r) => r.value === item.recurrence)?.label}
                          </Badge>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-sm text-muted-foreground truncate">
                          {item.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span>
                          {new Date(item.eventDate).toLocaleDateString("it-IT", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                          })}
                        </span>
                        {item.eventTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {item.eventTime}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditForm(item)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(item)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Modifica Evento" : "Nuovo Evento"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titolo *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrizione</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="eventDate">Data *</Label>
                <Input
                  id="eventDate"
                  type="date"
                  value={formData.eventDate}
                  onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="eventTime">Ora</Label>
                <Input
                  id="eventTime"
                  type="time"
                  value={formData.eventTime}
                  onChange={(e) => setFormData({ ...formData, eventTime: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select
                  value={formData.eventType}
                  onValueChange={(value: "deadline" | "appointment" | "reminder") =>
                    setFormData({ ...formData, eventType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deadline">Scadenza</SelectItem>
                    <SelectItem value="appointment">Appuntamento</SelectItem>
                    <SelectItem value="reminder">Promemoria</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ricorrenza</Label>
                <Select
                  value={formData.recurrence}
                  onValueChange={(value) => setFormData({ ...formData, recurrence: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Nessuna" />
                  </SelectTrigger>
                  <SelectContent>
                    {recurrenceOptions.map((opt) => (
                      <SelectItem key={opt.value || "none"} value={opt.value || "none"}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeForm}>
                Annulla
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingItem ? "Salva" : "Crea"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare questo evento?</AlertDialogTitle>
            <AlertDialogDescription>
              Stai per eliminare "{deletingItem?.title}". Questa azione non puo essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
