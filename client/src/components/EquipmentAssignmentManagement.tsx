import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash, Download, Search } from "lucide-react";
import type { EquipmentType, EquipmentAssignment, User } from "@shared/schema";

const assignmentSchema = z.object({
  equipmentTypeId: z.string().min(1, "Tipo attrezzatura richiesto"),
  employeeId: z.string().min(1, "Dipendente richiesto"),
  quantity: z.coerce.number().min(1, "Quantità minima 1"),
  notes: z.string().optional(),
  expiryDate: z.string().optional(),
});

type AssignmentForm = z.infer<typeof assignmentSchema>;

interface EquipmentAssignmentManagementProps {
  autoOpenAdd?: boolean;
  onAutoOpenHandled?: () => void;
}

export default function EquipmentAssignmentManagement({ autoOpenAdd, onAutoOpenHandled }: EquipmentAssignmentManagementProps = {}) {
  const { toast } = useToast();
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  useEffect(() => {
    if (autoOpenAdd) {
      setAddDialogOpen(true);
      onAutoOpenHandled?.();
    }
  }, [autoOpenAdd]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<EquipmentAssignment | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const addForm = useForm<AssignmentForm>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: { quantity: 1, notes: "", expiryDate: "" },
  });

  const { data: assignments = [], isLoading } = useQuery<EquipmentAssignment[]>({
    queryKey: ["/api/equipment-assignments"],
  });

  const { data: equipmentTypes = [] } = useQuery<EquipmentType[]>({
    queryKey: ["/api/equipment-types"],
  });

  const { data: employees = [] } = useQuery<User[]>({
    queryKey: ["/api/users/active"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: AssignmentForm) => {
      const payload: any = {
        equipmentTypeId: data.equipmentTypeId,
        employeeId: data.employeeId,
        quantity: data.quantity,
        notes: data.notes || undefined,
        assignmentDate: new Date().toISOString(),
      };
      if (data.expiryDate) {
        payload.expiryDate = data.expiryDate;
      }
      const res = await apiRequest("POST", "/api/equipment-assignments", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment-assignments"] });
      toast({ title: "Assegnazione creata", description: "L'attrezzatura è stata assegnata al dipendente" });
      setAddDialogOpen(false);
      addForm.reset({ quantity: 1, notes: "", expiryDate: "" });
    },
    onError: () => {
      toast({ title: "Errore", description: "Impossibile creare l'assegnazione", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/equipment-assignments/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment-assignments"] });
      toast({ title: "Assegnazione eliminata" });
      setDeleteDialogOpen(false);
      setSelectedAssignment(null);
    },
    onError: () => {
      toast({ title: "Errore", description: "Impossibile eliminare l'assegnazione", variant: "destructive" });
    },
  });

  const handleDelete = (assignment: EquipmentAssignment) => {
    setSelectedAssignment(assignment);
    setDeleteDialogOpen(true);
  };

  const handleExportPDF = async () => {
    try {
      const res = await fetch("/api/equipment-assignments/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentIds: selectedIds }),
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("PDF generation failed");
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `verbale-consegna-dpi-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast({ title: "PDF generato", description: "Il verbale è stato scaricato" });
    } catch {
      toast({ title: "Errore", description: "Impossibile generare il PDF", variant: "destructive" });
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredAssignments.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAssignments.map((a) => a.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const getEquipmentTypeName = (id: string) => {
    const type = equipmentTypes.find((t) => t.id === id);
    return type?.name || "N/A";
  };

  const getEquipmentTypeCategory = (id: string) => {
    const type = equipmentTypes.find((t) => t.id === id);
    return type?.category || "";
  };

  const getEmployeeName = (id: string) => {
    const emp = employees.find((e) => e.id === id);
    return emp?.fullName || "N/A";
  };

  const getStatusBadge = (status: string) => {
    if (status === "confirmed") return { label: "Confermato", variant: "default" as const };
    if (status === "not_received") return { label: "Non ricevuto", variant: "destructive" as const };
    return { label: "In attesa", variant: "secondary" as const };
  };

  const formatDate = (dateStr: string | Date | null) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const filteredAssignments = assignments.filter((a) => {
    if (filterStatus !== "all" && a.confirmationStatus !== filterStatus) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const empName = getEmployeeName(a.employeeId).toLowerCase();
      const typeName = getEquipmentTypeName(a.equipmentTypeId).toLowerCase();
      if (!empName.includes(search) && !typeName.includes(search)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cerca dipendente o attrezzatura..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Stato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti</SelectItem>
              <SelectItem value="pending">In attesa</SelectItem>
              <SelectItem value="confirmed">Confermati</SelectItem>
              <SelectItem value="not_received">Non ricevuti</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <Button variant="outline" onClick={handleExportPDF}>
              <Download className="h-4 w-4 mr-2" />
              PDF ({selectedIds.length})
            </Button>
          )}
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuova Assegnazione
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nuova Assegnazione</DialogTitle>
                <DialogDescription>Assegna un'attrezzatura o DPI a un dipendente</DialogDescription>
              </DialogHeader>
              <Form {...addForm}>
                <form onSubmit={addForm.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={addForm.control}
                    name="employeeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dipendente *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleziona dipendente" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {employees.map((emp) => (
                              <SelectItem key={emp.id} value={emp.id}>
                                {emp.fullName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={addForm.control}
                    name="equipmentTypeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Attrezzatura/DPI *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleziona tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {equipmentTypes
                              .filter((t) => t.isActive)
                              .map((type) => (
                                <SelectItem key={type.id} value={type.id}>
                                  {type.name} ({type.category})
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={addForm.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantità *</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={addForm.control}
                      name="expiryDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Scadenza</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={addForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Note (taglia, matricola, ecc.)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Es: Taglia L, Matricola 12345" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending ? "Salvataggio..." : "Assegna"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Caricamento...</div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={selectedIds.length === filteredAssignments.length && filteredAssignments.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>Dipendente</TableHead>
                <TableHead>Attrezzatura/DPI</TableHead>
                <TableHead className="hidden md:table-cell">Categoria</TableHead>
                <TableHead>Qtà</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="hidden lg:table-cell">Note</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead>Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssignments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    Nessuna assegnazione trovata
                  </TableCell>
                </TableRow>
              ) : (
                filteredAssignments.map((assignment) => {
                  const status = getStatusBadge(assignment.confirmationStatus);
                  return (
                    <TableRow key={assignment.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(assignment.id)}
                          onCheckedChange={() => toggleSelect(assignment.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{getEmployeeName(assignment.employeeId)}</TableCell>
                      <TableCell>{getEquipmentTypeName(assignment.equipmentTypeId)}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline">{getEquipmentTypeCategory(assignment.equipmentTypeId)}</Badge>
                      </TableCell>
                      <TableCell>{assignment.quantity}</TableCell>
                      <TableCell>{formatDate(assignment.assignmentDate)}</TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                        {assignment.notes || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(assignment)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare questa assegnazione? Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedAssignment && deleteMutation.mutate(selectedAssignment.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
