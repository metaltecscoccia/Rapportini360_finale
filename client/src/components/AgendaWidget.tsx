import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, AlertCircle, Bell, ChevronRight, Plus } from "lucide-react";

type AgendaItem = {
  id: string;
  title: string;
  description: string | null;
  eventDate: string;
  eventTime: string | null;
  eventType: "deadline" | "appointment" | "reminder";
  recurrence: string | null;
  completed: boolean;
};

const eventTypeConfig = {
  deadline: {
    color: "bg-red-500",
    icon: AlertCircle,
  },
  appointment: {
    color: "bg-blue-500",
    icon: Calendar,
  },
  reminder: {
    color: "bg-yellow-500",
    icon: Bell,
  },
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return "Oggi";
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return "Domani";
  } else {
    return date.toLocaleDateString("it-IT", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  }
}

export default function AgendaWidget({
  onViewAll,
  onAdd,
}: {
  onViewAll?: () => void;
  onAdd?: () => void;
}) {
  const { data: items = [], isLoading } = useQuery<AgendaItem[]>({
    queryKey: ["/api/agenda/upcoming"],
  });

  if (isLoading) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="py-2 px-3 shrink-0">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5" />
            Prossimi 7 Giorni
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-2">
          <div className="flex items-center justify-center py-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="py-2 px-3 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5" />
            Prossimi 7 Giorni
          </CardTitle>
          <div className="flex items-center gap-1">
            {onAdd && (
              <Button
                variant="ghost"
                size="sm"
                className="h-5 px-1.5 text-xs"
                onClick={onAdd}
              >
                <Plus className="h-3 w-3 mr-0.5" />
                Aggiungi Evento
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-2 pt-0 flex-1 overflow-y-auto min-h-0">
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-2">
            Nessun evento in programma
          </p>
        ) : (
          <div className="space-y-0.5">
            {items.slice(0, 7).map((item) => {
              const config = eventTypeConfig[item.eventType];
              return (
                <div
                  key={`${item.id}-${item.eventDate}`}
                  className={`flex items-center gap-2 py-1 px-1.5 rounded text-xs hover:bg-muted/50 transition-colors ${item.completed ? "opacity-50" : ""}`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.color}`} />
                  <span className={`flex-1 truncate ${item.completed ? "line-through text-muted-foreground" : "font-medium"}`}>
                    {item.title}
                  </span>
                  <span className="text-muted-foreground shrink-0">{formatDate(item.eventDate)}</span>
                  {item.eventTime && (
                    <span className="text-muted-foreground shrink-0">{item.eventTime}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {items.length > 7 && (
          <p className="text-xs text-muted-foreground text-center mt-1">
            +{items.length - 7} altri
          </p>
        )}
        {onViewAll && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-1 h-6 text-xs"
            onClick={onViewAll}
          >
            Vedi Agenda
            <ChevronRight className="h-3 w-3 ml-0.5" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
