import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { HardHat, CheckCircle, XCircle } from "lucide-react";
import type { EquipmentAssignment, EquipmentType } from "@shared/schema";

interface EquipmentConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EquipmentConfirmationDialog({ open, onOpenChange }: EquipmentConfirmationDialogProps) {
  const { toast } = useToast();
  const [employeeNote, setEmployeeNote] = useState("");

  const { data: pendingAssignments = [], isLoading } = useQuery<EquipmentAssignment[]>({
    queryKey: ["/api/equipment-assignments/pending"],
    enabled: open,
  });

  const { data: equipmentTypes = [] } = useQuery<EquipmentType[]>({
    queryKey: ["/api/equipment-types"],
    enabled: open,
  });

  const confirmMutation = useMutation({
    mutationFn: async ({ status, note }: { status: "confirmed" | "not_received"; note?: string }) => {
      const assignmentIds = pendingAssignments.map((a) => a.id);
      const res = await apiRequest("POST", "/api/equipment-assignments/confirm", {
        assignmentIds,
        status,
        employeeNote: note || undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment-assignments/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/equipment-assignments"] });
      toast({ title: "Conferma registrata", description: "La tua conferma è stata salvata con successo" });
      onOpenChange(false);
      setEmployeeNote("");
    },
    onError: () => {
      toast({ title: "Errore", description: "Impossibile registrare la conferma", variant: "destructive" });
    },
  });

  const getEquipmentTypeName = (id: string) => {
    const type = equipmentTypes.find((t) => t.id === id);
    return type?.name || "N/A";
  };

  const getEquipmentTypeCategory = (id: string) => {
    const type = equipmentTypes.find((t) => t.id === id);
    return type?.category || "";
  };

  const formatDate = (dateStr: string | Date | null) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" });
  };

  if (pendingAssignments.length === 0 && !isLoading) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HardHat className="h-5 w-5" />
            Conferma Ricezione DPI/Attrezzature
          </DialogTitle>
          <DialogDescription>
            Hai {pendingAssignments.length} {pendingAssignments.length === 1 ? "dotazione in attesa" : "dotazioni in attesa"} di conferma.
            Verifica l'elenco e conferma la ricezione.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Caricamento...</div>
        ) : (
          <div className="space-y-4">
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Attrezzatura/DPI</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Qtà</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Note</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingAssignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell className="font-medium">
                        {getEquipmentTypeName(assignment.equipmentTypeId)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getEquipmentTypeCategory(assignment.equipmentTypeId)}
                        </Badge>
                      </TableCell>
                      <TableCell>{assignment.quantity}</TableCell>
                      <TableCell className="text-sm">{formatDate(assignment.assignmentDate)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {assignment.notes || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="space-y-2">
              <Label htmlFor="employee-note">Note aggiuntive (facoltativo)</Label>
              <Textarea
                id="employee-note"
                placeholder="Aggiungi eventuali note..."
                value={employeeNote}
                onChange={(e) => setEmployeeNote(e.target.value)}
                rows={2}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                onClick={() => confirmMutation.mutate({ status: "confirmed", note: employeeNote })}
                disabled={confirmMutation.isPending}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Confermo Ricezione
              </Button>
              <Button
                onClick={() => confirmMutation.mutate({ status: "not_received", note: employeeNote })}
                disabled={confirmMutation.isPending}
                variant="outline"
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Non Ricevuto
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
