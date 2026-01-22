import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, Send } from "lucide-react";
import { Status } from "@shared/schema";

interface StatusBadgeProps {
  status: Status;
  viewMode?: 'employee' | 'admin';
  isNew?: boolean; // true se il rapportino non esiste ancora nel database
}

export default function StatusBadge({ status, viewMode = 'admin', isNew = false }: StatusBadgeProps) {
  // Per employee: 3 stati distinti
  // 1. isNew=true → "Non inviato" (arancione)
  // 2. isNew=false + status="In attesa" → "Inviato" (blu)
  // 3. isNew=false + status="Approvato" → "Accettato" (verde)

  // Per admin: 2 stati
  // 1. status="In attesa" → "In attesa" (arancione)
  // 2. status="Approvato" → "Confermato" (verde)

  if (viewMode === 'employee') {
    if (isNew) {
      // Stato 1: Form aperto, non ancora inviato
      return (
        <Badge
          variant="outline"
          className="flex items-center gap-1 border-0 bg-gradient-warning text-white shadow-md"
          data-testid="badge-status-non-inviato"
        >
          <Clock className="h-3 w-3" />
          Non inviato
        </Badge>
      );
    } else if (status === "In attesa") {
      // Stato 2: Inviato all'admin, in attesa di approvazione
      return (
        <Badge
          variant="outline"
          className="flex items-center gap-1 border-0 bg-gradient-info text-white shadow-md"
          data-testid="badge-status-inviato"
        >
          <Send className="h-3 w-3" />
          Inviato
        </Badge>
      );
    } else {
      // Stato 3: Approvato dall'admin
      return (
        <Badge
          variant="outline"
          className="flex items-center gap-1 border-0 bg-gradient-success text-white shadow-md"
          data-testid="badge-status-accettato"
        >
          <CheckCircle className="h-3 w-3" />
          Accettato
        </Badge>
      );
    }
  } else {
    // Vista admin: 2 stati (In attesa / Confermato)
    const isPending = status === "In attesa";
    return (
      <Badge
        variant="outline"
        className={`flex items-center gap-1 border-0 shadow-md ${
          isPending
            ? 'bg-gradient-warning text-white'
            : 'bg-gradient-success text-white'
        }`}
        data-testid={`badge-status-${status.toLowerCase().replace(' ', '-')}`}
      >
        {isPending ? (
          <>
            <Clock className="h-3 w-3" />
            In attesa
          </>
        ) : (
          <>
            <CheckCircle className="h-3 w-3" />
            Confermato
          </>
        )}
      </Badge>
    );
  }
}