import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, FileText, Download, Loader2, Plus, Trash2 } from "lucide-react";
import { formatDateToItalian } from "@/lib/dateUtils";
import { useToast } from "@/hooks/use-toast";

interface WorkOrderReportProps {
  workOrderId: string;
  workOrderNumber: string;
  workOrderDescription: string;
  clientName: string;
  onBack: () => void;
}

// Interface for enriched operation data from API
interface EnrichedOperation {
  id: string;
  workTypes: string[];
  materials: string[];
  hours: number;
  notes: string | null;
  employeeName: string;
  employeeId: string;
  date: string;
  clientName: string;
  workOrderName: string;
  reportStatus: string;
}

// Interface for employee row data
interface EmployeeReportRow {
  date: string;
  employeeName: string;
  employeeId: string;
  hours: number;
  workTypes: string[];
  materials: string[];
  employeeNotes: string | null;
  adminNotes: string;
}

// Function to create employee rows grouped by date
function createEmployeeRows(operations: EnrichedOperation[]): EmployeeReportRow[] {
  const groupedByDate = operations.reduce((acc, op) => {
    if (!acc[op.date]) {
      acc[op.date] = [];
    }
    acc[op.date].push(op);
    return acc;
  }, {} as Record<string, EnrichedOperation[]>);

  const rows: EmployeeReportRow[] = [];
  
  Object.entries(groupedByDate)
    .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
    .forEach(([date, ops]) => {
      const employeeOps = ops.reduce((acc, op) => {
        if (!acc[op.employeeId]) {
          acc[op.employeeId] = [];
        }
        acc[op.employeeId].push(op);
        return acc;
      }, {} as Record<string, EnrichedOperation[]>);

      Object.entries(employeeOps).forEach(([employeeId, empOps]) => {
        const totalHours = empOps.reduce((sum, op) => sum + (Number(op.hours) || 0), 0);
        const workTypes = Array.from(new Set(empOps.flatMap(op => op.workTypes)));
        const materials = Array.from(new Set(empOps.flatMap(op => op.materials || [])));
        const notes = empOps.map(op => op.notes).filter(n => n).join("; ") || null;
        
        rows.push({
          date,
          employeeName: empOps[0].employeeName,
          employeeId,
          hours: totalHours,
          workTypes,
          materials,
          employeeNotes: notes,
          adminNotes: ""
        });
      });
    });

  return rows;
}

export default function WorkOrderReport({ 
  workOrderId,
  workOrderNumber, 
  workOrderDescription, 
  clientName, 
  onBack 
}: WorkOrderReportProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch operations for this work order
  const { data: operations = [], isLoading, error } = useQuery<EnrichedOperation[]>({
    queryKey: ['/api/work-orders', workOrderId, 'operations'],
    enabled: !!workOrderId
  });

  // Fetch work order stats (includes estimatedHours)
  const { data: workOrdersStats = [] } = useQuery<any[]>({
    queryKey: ['/api/work-orders/stats'],
  });

  const workOrderStats = workOrdersStats.find(s => s.workOrderId === workOrderId);

  // Fetch expenses for this work order
  const { data: expenses = [] } = useQuery<any[]>({
    queryKey: [`/api/work-orders/${workOrderId}/expenses`],
    enabled: !!workOrderId
  });

  // Create employee rows grouped by date
  const reportData = createEmployeeRows(operations);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  // Expense dialog state
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    category: 'altro' as 'carburante' | 'materiali' | 'trasferta' | 'altro'
  });

  // Mutations for expenses
  const createExpenseMutation = useMutation({
    mutationFn: async (data: typeof newExpense) => {
      const res = await fetch(`/api/work-orders/${workOrderId}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create expense");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/work-orders/${workOrderId}/expenses`] });
      setExpenseDialogOpen(false);
      setNewExpense({ amount: '', description: '', date: new Date().toISOString().split('T')[0], category: 'altro' });
      toast({ title: "Spesa registrata" });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante la creazione della spesa",
        variant: "destructive"
      });
    }
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/work-orders/expenses/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete expense");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/work-orders/${workOrderId}/expenses`] });
      toast({ title: "Spesa eliminata" });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'eliminazione della spesa",
        variant: "destructive"
      });
    }
  });

  const updateAdminNotes = (rowKey: string, notes: string) => {
    setAdminNotes(prev => ({
      ...prev,
      [rowKey]: notes
    }));
  };

  const totalProjectHours = reportData.reduce((sum: number, row: EmployeeReportRow) => sum + row.hours, 0);

  const handleExportReport = async () => {
    try {
      const response = await fetch(`/api/export/work-order/${workOrderId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore durante l\'export');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Commessa_${workOrderNumber}_${new Date().toISOString().split('T')[0]}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log('Work order export completed');
    } catch (error: any) {
      alert(error.message || 'Errore durante l\'export del report');
      console.error('Export error:', error);
    }
  };

  return (
    <div className="px-3 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={onBack}
            data-testid="button-back-to-commesse"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna alle Commesse
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Report Finale Commessa</h1>
            <p className="text-muted-foreground">
              {workOrderNumber} - {workOrderDescription}
            </p>
            <p className="text-sm text-muted-foreground">
              Cliente: <strong>{clientName}</strong>
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={handleExportReport}
            data-testid="button-export-final-report"
          >
            <Download className="h-4 w-4 mr-2" />
            Esporta Report
          </Button>
        </div>
      </div>

      {/* Summary Card */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Giorni Lavorativi</p>
              <p className="text-2xl font-bold">
                {new Set(reportData.map(row => row.date)).size}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Ore Totali Progetto</p>
              <p className="text-2xl font-bold">{totalProjectHours}h</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Dipendenti Coinvolti</p>
              <p className="text-2xl font-bold">
                {new Set(reportData.map(row => row.employeeId)).size}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confronto Ore - Only if estimatedHours exists */}
      {workOrderStats?.estimatedHours && (
        <Card>
          <CardHeader>
            <CardTitle>Confronto Ore</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Ore Previste</p>
                <p className="text-2xl font-bold">{Number(workOrderStats.estimatedHours).toFixed(1)}h</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ore Effettive</p>
                <p className="text-2xl font-bold">{Number(workOrderStats.totalHours).toFixed(1)}h</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Delta</p>
                <p className={`text-2xl font-bold ${
                  Number(workOrderStats.totalHours) > Number(workOrderStats.estimatedHours)
                    ? 'text-destructive'
                    : 'text-green-600'
                }`}>
                  {(Number(workOrderStats.totalHours) - Number(workOrderStats.estimatedHours)).toFixed(1)}h
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completamento</p>
                <p className="text-2xl font-bold">
                  {((Number(workOrderStats.totalHours) / Number(workOrderStats.estimatedHours)) * 100).toFixed(0)}%
                </p>
              </div>
            </div>
            <Progress
              value={(Number(workOrderStats.totalHours) / Number(workOrderStats.estimatedHours)) * 100}
              className="mt-4"
            />
          </CardContent>
        </Card>
      )}

      {/* Spese Commessa */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Spese Commessa</CardTitle>
          <Button onClick={() => setExpenseDialogOpen(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Aggiungi Spesa
          </Button>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nessuna spesa registrata</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Descrizione</TableHead>
                  <TableHead className="text-right">Importo</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense: any) => (
                  <TableRow key={expense.id}>
                    <TableCell>{new Date(expense.date).toLocaleDateString('it-IT')}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{expense.category}</Badge>
                    </TableCell>
                    <TableCell>{expense.description}</TableCell>
                    <TableCell className="text-right font-medium">
                      €{Number(expense.amount).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteExpenseMutation.mutate(expense.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold">
                  <TableCell colSpan={3} className="text-right">Totale Spese:</TableCell>
                  <TableCell className="text-right">
                    €{expenses.reduce((sum: number, exp: any) => sum + Number(exp.amount), 0).toFixed(2)}
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog Aggiungi Spesa */}
      <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aggiungi Spesa</DialogTitle>
            <DialogDescription>Registra una spesa per questa commessa</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Importo (€)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={newExpense.amount}
                onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
              />
            </div>
            <div>
              <Label>Descrizione</Label>
              <Input
                type="text"
                placeholder="Es: Carburante per trasferta..."
                value={newExpense.description}
                onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
              />
            </div>
            <div>
              <Label>Data</Label>
              <Input
                type="date"
                value={newExpense.date}
                onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
              />
            </div>
            <div>
              <Label>Categoria</Label>
              <Select
                value={newExpense.category}
                onValueChange={(value: any) => setNewExpense({ ...newExpense, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="carburante">Carburante</SelectItem>
                  <SelectItem value="materiali">Materiali</SelectItem>
                  <SelectItem value="trasferta">Trasferta</SelectItem>
                  <SelectItem value="altro">Altro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExpenseDialogOpen(false)}>Annulla</Button>
            <Button
              onClick={() => createExpenseMutation.mutate(newExpense)}
              disabled={!newExpense.amount || !newExpense.description || createExpenseMutation.isPending}
            >
              Salva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Report Table - Compact Excel Style */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-4 w-4" />
            Report Giornaliero Commessa
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Aggregazione di tutti i rapportini approvati per questa commessa
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto" data-testid="scroll-table-workorder">
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow className="border-b">
                  <TableHead className="h-8 px-3 text-xs font-semibold w-[90px]">Data</TableHead>
                  <TableHead className="h-8 px-3 text-xs font-semibold w-[140px]">Dipendente</TableHead>
                  <TableHead className="h-8 px-3 text-xs font-semibold w-[80px]">Ore</TableHead>
                  <TableHead className="h-8 px-3 text-xs font-semibold min-w-[160px]">Lavorazioni</TableHead>
                  <TableHead className="h-8 px-3 text-xs font-semibold min-w-[160px]">Materiali</TableHead>
                  <TableHead className="h-8 px-3 text-xs font-semibold min-w-[180px]">Note Dipendente</TableHead>
                  <TableHead className="h-8 px-3 text-xs font-semibold min-w-[180px]">Note Admin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-20 text-center text-sm text-muted-foreground">
                      Nessuna operazione approvata per questa commessa
                    </TableCell>
                  </TableRow>
                ) : (
                  reportData.map((row: EmployeeReportRow, index: number) => {
                    const rowKey = `${row.date}-${row.employeeId}`;
                    const prevRow = index > 0 ? reportData[index - 1] : null;
                    const showDate = !prevRow || prevRow.date !== row.date;
                    
                    return (
                      <TableRow key={rowKey} className="hover-elevate">
                        <TableCell className="h-10 px-3 py-1 text-xs font-medium">
                          {showDate ? formatDateToItalian(row.date) : ''}
                        </TableCell>
                        <TableCell className="h-10 px-3 py-1 text-xs">
                          {row.employeeName}
                        </TableCell>
                        <TableCell className="h-10 px-3 py-1 text-xs font-medium">
                          {row.hours.toFixed(1)}h
                        </TableCell>
                        <TableCell className="h-10 px-3 py-1">
                          <div className="flex flex-wrap gap-1">
                            {row.workTypes.map((type: string, typeIndex: number) => (
                              <Badge key={typeIndex} variant="secondary" className="text-[10px] h-4 px-1.5 py-0">
                                {type}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="h-10 px-3 py-1">
                          <div className="flex flex-wrap gap-1">
                            {row.materials.length > 0 ? (
                              row.materials.map((material: string, matIndex: number) => (
                                <Badge key={matIndex} variant="outline" className="text-[10px] h-4 px-1.5 py-0">
                                  {material}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="h-10 px-3 py-1 text-xs text-muted-foreground">
                          {row.employeeNotes || '-'}
                        </TableCell>
                        <TableCell className="h-10 px-3 py-1">
                          <Input
                            placeholder="Note..."
                            value={adminNotes[rowKey] || row.adminNotes}
                            onChange={(e) => updateAdminNotes(rowKey, e.target.value)}
                            className="text-xs h-7 px-2"
                            data-testid={`input-admin-notes-${index}`}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}