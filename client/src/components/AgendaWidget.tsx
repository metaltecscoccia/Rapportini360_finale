import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, AlertCircle, Bell, ChevronRight } from "lucide-react";

type AgendaItem = {
  id: string;
  title: string;
  description: string | null;
  eventDate: string;
  eventTime: string | null;
  eventType: "deadline" | "appointment" | "reminder";
  recurrence: string | null;
};

const eventTypeConfig = {
  deadline: {
    label: "Scadenza",
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    icon: AlertCircle,
  },
  appointment: {
    label: "Appuntamento",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    icon: Calendar,
  },
  reminder: {
    label: "Promemoria",
    color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
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
}: {
  onViewAll?: () => void;
}) {
  const { data: items = [], isLoading } = useQuery<AgendaItem[]>({
    queryKey: ["/api/agenda/upcoming"],
  });

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Prossimi Eventi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Prossimi 7 Giorni
          </CardTitle>
          {items.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {items.length}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nessun evento in programma
          </p>
        ) : (
          <>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {items.slice(0, 5).map((item) => {
                const config = eventTypeConfig[item.eventType];
                const Icon = config.icon;
                return (
                  <div
                    key={`${item.id}-${item.eventDate}`}
                    className="flex items-start gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className={`p-1.5 rounded ${config.color}`}>
                      <Icon className="h-3 w-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatDate(item.eventDate)}</span>
                        {item.eventTime && (
                          <>
                            <Clock className="h-3 w-3" />
                            <span>{item.eventTime}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {items.length > 5 && (
              <p className="text-xs text-muted-foreground text-center">
                +{items.length - 5} altri eventi
              </p>
            )}
          </>
        )}
        {onViewAll && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2"
            onClick={onViewAll}
          >
            Vedi Agenda
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
