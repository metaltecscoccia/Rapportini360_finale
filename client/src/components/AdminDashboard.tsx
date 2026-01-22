import { useState, useRef, Fragment, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDateToItalian, formatDateToISO } from "@/lib/dateUtils";
import { 
  Users, 
  FileText, 
  Building,
  Building2, 
  Briefcase, 
  Search, 
  Filter,
  CheckCircle,
  Clock,
  Plus,
  Edit,
  Trash,
  Calendar,
  Wrench,
  Eye,
  Key,
  Hammer,
  Package,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  MapPin,
  ClipboardList,
  Camera,
  Calculator,
  Bell,
  UserX,
  UserCheck,
  BarChart2,
  TrendingUp,
  AlertTriangle,
  Download,
  Copy
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import StatusBadge from "./StatusBadge";
import WorkOrderReport from "./WorkOrderReport";
import DailyReportForm from "./DailyReportForm";
import AttendanceSheet from "./AttendanceSheet";
import { HoursAdjustmentDialog } from "./HoursAdjustmentDialog";
import VehiclesManagement from "./VehiclesManagement";
import FuelRefillsManagement from "./FuelRefillsManagement";
import FuelStatistics from "./FuelStatistics";

// Schema per form aggiunta dipendente
const addEmployeeSchema = z.object({
  fullName: z.string().min(2, "Il nome deve essere di almeno 2 caratteri"),
  username: z.string().min(3, "L'username deve essere di almeno 3 caratteri"),
  password: z.string().min(1, "Password è richiesta"),
});

// Schema per modifica dipendente (password opzionale)
const editEmployeeSchema = z.object({
  fullName: z.string().min(2, "Il nome deve essere di almeno 2 caratteri"),
  username: z.string().min(3, "L'username deve essere di almeno 3 caratteri"),
  password: z.string().min(1, "Password è richiesta").optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

// Schema per creazione commessa
const addWorkOrderSchema = z.object({
  clientId: z.string().min(1, "Cliente è richiesto"),
  name: z.string().min(2, "Il nome deve essere di almeno 2 caratteri"),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  availableWorkTypes: z.array(z.string()).default([]),
  availableMaterials: z.array(z.string()).default([]),
});

// Schema per creazione cliente
const addClientSchema = z.object({
  name: z.string().min(2, "Il nome deve essere di almeno 2 caratteri"),
});

// Schema per lavorazioni (work types)
const workTypeSchema = z.object({
  name: z.string().min(2, "Il nome deve essere di almeno 2 caratteri"),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

// Schema per materiali
const materialSchema = z.object({
  name: z.string().min(2, "Il nome deve essere di almeno 2 caratteri"),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

// Schema per registrazione assenze
const registerAbsenceSchema = z.object({
  date: z.string().min(1, "Data è richiesta"),
  userIds: z.array(z.string()).min(1, "Seleziona almeno un dipendente"),
  absenceType: z.string().min(1, "Tipo assenza è richiesto"),
  notes: z.string().optional(),
});

type AddEmployeeForm = z.infer<typeof addEmployeeSchema>;
type EditEmployeeForm = z.infer<typeof editEmployeeSchema>;
type AddWorkOrderForm = z.infer<typeof addWorkOrderSchema>;
type AddClientForm = z.infer<typeof addClientSchema>;
type WorkTypeForm = z.infer<typeof workTypeSchema>;
type MaterialForm = z.infer<typeof materialSchema>;
type RegisterAbsenceForm = z.infer<typeof registerAbsenceSchema>;


// Mock data removed - now using real data from API

export default function AdminDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [employeeStatusFilter, setEmployeeStatusFilter] = useState("all"); // all, active, inactive
  const [mainSection, setMainSection] = useState("rapportini"); // rapportini or rifornimenti
  const [selectedTab, setSelectedTab] = useState("reports");
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<{
    id: string;
    number: string;
    description: string;
    clientName: string;
  } | null>(null);
  const [addEmployeeDialogOpen, setAddEmployeeDialogOpen] = useState(false);
  const [editEmployeeDialogOpen, setEditEmployeeDialogOpen] = useState(false);
  const [deleteEmployeeDialogOpen, setDeleteEmployeeDialogOpen] = useState(false);
  const [toggleStatusDialogOpen, setToggleStatusDialogOpen] = useState(false);
  const [employeeToToggle, setEmployeeToToggle] = useState<any>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [tempPasswordModalOpen, setTempPasswordModalOpen] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [employeeStatsDialogOpen, setEmployeeStatsDialogOpen] = useState(false);
  const [selectedEmployeeForStats, setSelectedEmployeeForStats] = useState<any>(null);
  const [editReportDialogOpen, setEditReportDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [reportOperations, setReportOperations] = useState<any[]>([]);
  const [createReportDialogOpen, setCreateReportDialogOpen] = useState(false);
  const [selectedEmployeeForReport, setSelectedEmployeeForReport] = useState<any>(null);

  // Filtri per commesse
  const [workOrderStatusFilter, setWorkOrderStatusFilter] = useState("all");
  const [workOrderDateFilter, setWorkOrderDateFilter] = useState("all"); // all, last7days, last30days, last90days
  const [addWorkOrderDialogOpen, setAddWorkOrderDialogOpen] = useState(false);
  const [editWorkOrderDialogOpen, setEditWorkOrderDialogOpen] = useState(false);
  const [deleteWorkOrderDialogOpen, setDeleteWorkOrderDialogOpen] = useState(false);
  const [selectedWorkOrderToEdit, setSelectedWorkOrderToEdit] = useState<any>(null);
  const [selectedWorkOrderToDelete, setSelectedWorkOrderToDelete] = useState<any>(null);
  const [deleteReportDialogOpen, setDeleteReportDialogOpen] = useState(false);
  const [selectedReportToDelete, setSelectedReportToDelete] = useState<any>(null);
  const [changeDateDialogOpen, setChangeDateDialogOpen] = useState(false);
  const [selectedReportToChangeDate, setSelectedReportToChangeDate] = useState<any>(null);
  const [newReportDate, setNewReportDate] = useState<string>("");
  const [addClientDialogOpen, setAddClientDialogOpen] = useState(false);
  const [deleteClientDialogOpen, setDeleteClientDialogOpen] = useState(false);
  const [selectedClientToDelete, setSelectedClientToDelete] = useState<any>(null);
  const [clientWorkOrdersCount, setClientWorkOrdersCount] = useState<number>(0);
  const [clientOperationsCount, setClientOperationsCount] = useState<number>(0);
  const [employeeReportsCount, setEmployeeReportsCount] = useState<number>(0);

  // Lightbox state for photo gallery
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxPhotos, setLightboxPhotos] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Ref for auto-focus on toDate input
  const toDateInputRef = useRef<HTMLInputElement>(null);

  // State for work types management
  const [addWorkTypeDialogOpen, setAddWorkTypeDialogOpen] = useState(false);
  const [editWorkTypeDialogOpen, setEditWorkTypeDialogOpen] = useState(false);
  const [deleteWorkTypeDialogOpen, setDeleteWorkTypeDialogOpen] = useState(false);
  const [selectedWorkType, setSelectedWorkType] = useState<any>(null);

  // State for materials management
  const [addMaterialDialogOpen, setAddMaterialDialogOpen] = useState(false);
  const [editMaterialDialogOpen, setEditMaterialDialogOpen] = useState(false);
  const [deleteMaterialDialogOpen, setDeleteMaterialDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);

  // State for inline quick-add forms in work order dialog
  const [showQuickAddWorkType, setShowQuickAddWorkType] = useState(false);
  const [quickAddWorkTypeName, setQuickAddWorkTypeName] = useState("");
  const [showQuickAddMaterial, setShowQuickAddMaterial] = useState(false);
  const [quickAddMaterialName, setQuickAddMaterialName] = useState("");

  // State for expandable report rows
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);
  const [expandedReportData, setExpandedReportData] = useState<any>(null);

  // State for hours adjustment dialog
  const [hoursAdjustmentDialogOpen, setHoursAdjustmentDialogOpen] = useState(false);
  const [selectedReportForAdjustment, setSelectedReportForAdjustment] = useState<string | null>(null);
  const [currentHoursAdjustment, setCurrentHoursAdjustment] = useState<any>(null);

  // State for missing employees dialog
  const [missingEmployeesDialogOpen, setMissingEmployeesDialogOpen] = useState(false);

  // State for register absence dialog
  const [registerAbsenceDialogOpen, setRegisterAbsenceDialogOpen] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [missingEmployeesDate, setMissingEmployeesDate] = useState<string>(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });

  // State for reports time filter (7 days or all)
  const [showAllReports, setShowAllReports] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();


  // Form per aggiunta dipendente
  const form = useForm<AddEmployeeForm>({
    resolver: zodResolver(addEmployeeSchema),
    defaultValues: {
      fullName: "",
      username: "",
      password: "",
    },
  });

  // Form per aggiunta commessa
  const workOrderForm = useForm<AddWorkOrderForm>({
    resolver: zodResolver(addWorkOrderSchema),
    defaultValues: {
      clientId: "",
      name: "",
      description: "",
      isActive: true,
      availableWorkTypes: [],
      availableMaterials: [],
    },
  });

  // Form per modifica commessa
  const editWorkOrderForm = useForm<AddWorkOrderForm>({
    resolver: zodResolver(addWorkOrderSchema),
    defaultValues: {
      clientId: "",
      name: "",
      description: "",
      isActive: true,
      availableWorkTypes: [],
      availableMaterials: [],
    },
  });

  // Form per modifica dipendente
  const editForm = useForm<EditEmployeeForm>({
    resolver: zodResolver(editEmployeeSchema),
    defaultValues: {
      fullName: "",
      username: "",
      password: "",
      isActive: true,
    },
  });

  // Form per aggiunta cliente
  const clientForm = useForm<AddClientForm>({
    resolver: zodResolver(addClientSchema),
    defaultValues: {
      name: "",
    },
  });

  // Form per lavorazioni
  const workTypeForm = useForm<WorkTypeForm>({
    resolver: zodResolver(workTypeSchema),
    defaultValues: {
      name: "",
      description: "",
      isActive: true,
    },
  });

  // Form per materiali
  const materialForm = useForm<MaterialForm>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      name: "",
      description: "",
      isActive: true,
    },
  });

  // Form per registrazione assenze
  const registerAbsenceForm = useForm<RegisterAbsenceForm>({
    resolver: zodResolver(registerAbsenceSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format (today)
      userIds: [],
      absenceType: "",
      notes: "",
    },
  });

  // Query per recuperare tutti i dipendenti
  const { data: employees = [], isLoading: isLoadingEmployees } = useQuery<any[]>({
    queryKey: ['/api/users'],
  });

  // Query per recuperare solo i dipendenti attivi (per form creazione rapportini)
  const { data: activeEmployees = [], isLoading: isLoadingActiveEmployees } = useQuery<any[]>({
    queryKey: ['/api/users/active'],
  });

  // Query per recuperare tutti i rapportini
  const { data: reports = [], isLoading: isLoadingReports } = useQuery<any[]>({
    queryKey: ['/api/daily-reports', showAllReports ? 'all' : '7'],
    queryFn: async () => {
      const daysParam = showAllReports ? 'all' : '7';
      const res = await fetch(`/api/daily-reports?days=${daysParam}`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch daily reports');
      return res.json();
    },
  });

  // Query per recuperare tutti i clienti
  const { data: clients = [], isLoading: isLoadingClients } = useQuery<any[]>({
    queryKey: ['/api/clients'],
  });

  // Query per recuperare tutte le commesse
  const { data: workOrders = [], isLoading: isLoadingWorkOrders } = useQuery<any[]>({
    queryKey: ['/api/work-orders'],
  });

  // Query per recuperare le statistiche delle commesse
  const { data: workOrdersStats = [], isLoading: isLoadingWorkOrdersStats } = useQuery<any[]>({
    queryKey: ['/api/work-orders/stats'],
  });

  // Query per recuperare le lavorazioni
  const { data: workTypes = [], isLoading: isLoadingWorkTypes } = useQuery<any[]>({
    queryKey: ['/api/work-types'],
  });

  // Query per recuperare i materiali
  const { data: materials = [], isLoading: isLoadingMaterials } = useQuery<any[]>({
    queryKey: ['/api/materials'],
  });

  // Query per statistiche assenze (caricato solo quando la tab è selezionata)
  const { data: attendanceStats, isLoading: isLoadingAttendanceStats, isFetching: isFetchingAttendanceStats } = useQuery<{
    totalAbsences: number;
    totalStrategicAbsences: number;
    byEmployee: Array<{ userId: string; fullName: string; isActive: boolean; totalAbsences: number; strategicAbsences: number }>;
    byType: Record<string, number>;
    byDayOfWeek: Record<number, number>;
    byMonth: Array<{ month: string; count: number }>;
  }>({
    queryKey: ['/api/attendance/stats', selectedTab],
    queryFn: async () => {
      console.log('[DEBUG] Fetching attendance stats...');
      const res = await fetch(`/api/attendance/stats?days=90&_t=${Date.now()}`, {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      if (!res.ok) {
        console.error('[DEBUG] Failed to fetch attendance stats:', res.status);
        throw new Error('Failed to fetch attendance stats');
      }
      const data = await res.json();
      console.log('[DEBUG] Attendance stats received:', JSON.stringify(data));
      return data;
    },
    enabled: selectedTab === 'absence-stats',
  });

  // Query per statistiche assenze singolo dipendente
  const { data: employeeStats, isLoading: isLoadingEmployeeStats } = useQuery<{
    userId: string;
    fullName: string;
    totalAbsences: number;
    strategicAbsences: number;
    strategicPercentage: number;
    byType: Record<string, number>;
    byDayOfWeek: Record<number, number>;
    byMonth: Array<{ month: string; count: number }>;
  }>({
    queryKey: ['/api/attendance/stats', selectedEmployeeForStats?.id],
    queryFn: async () => {
      const res = await fetch(`/api/attendance/stats/${selectedEmployeeForStats?.id}?days=90`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch employee attendance stats');
      return res.json();
    },
    enabled: employeeStatsDialogOpen && !!selectedEmployeeForStats?.id,
  });

  // Helper function to get work type name by ID
  const getWorkTypeName = (id: string) => {
    const workType = (workTypes as any[]).find((wt: any) => wt.id === id);
    return workType?.name || id;
  };

  // Helper function to get material name by ID
  const getMaterialName = (id: string) => {
    const material = (materials as any[]).find((m: any) => m.id === id);
    return material?.name || id;
  };

  // Query per dipendenti mancanti (solo quando il dialog è aperto)
  const { data: missingEmployeesData, isLoading: isLoadingMissingEmployees, isError: isMissingEmployeesError } = useQuery<any>({
    queryKey: ['/api/daily-reports/missing-employees', missingEmployeesDate],
    queryFn: async () => {
      const res = await fetch(`/api/daily-reports/missing-employees?date=${missingEmployeesDate}`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch missing employees');
      return res.json();
    },
    enabled: missingEmployeesDialogOpen,
  });

  // Mutation per creare nuovo dipendente - genera password temporanea
  const createEmployeeMutation = useMutation({
    mutationFn: async (data: AddEmployeeForm) => {
      const response = await apiRequest('POST', '/api/users', {
        fullName: data.fullName,
        username: data.username,
        password: data.password, // Will be replaced with temp password by server
        role: 'employee'
      });
      return response.json(); // Returns user + temporaryPassword
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      form.reset();
      setAddEmployeeDialogOpen(false);

      // Show temp password modal
      setTemporaryPassword(data.temporaryPassword);
      setTempPasswordModalOpen(true);
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'aggiunta del dipendente.",
        variant: "destructive",
      });
    },
  });

  // Mutation per aggiornare dipendente
  const updateEmployeeMutation = useMutation({
    mutationFn: async (data: EditEmployeeForm & { id: string }) => {
      const updateData: any = {
        fullName: data.fullName,
        username: data.username,
        isActive: data.isActive,
      };

      // Include password only if provided
      if (data.password && data.password.trim() !== "") {
        updateData.password = data.password;
      }

      return apiRequest('PUT', `/api/users/${data.id}`, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Dipendente aggiornato",
        description: "Il dipendente è stato aggiornato con successo.",
      });
      editForm.reset();
      setEditEmployeeDialogOpen(false);
      setSelectedEmployee(null);
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'aggiornamento del dipendente.",
        variant: "destructive",
      });
    },
  });

  // Mutation per eliminare dipendente
  const deleteEmployeeMutation = useMutation({
    mutationFn: async (employeeId: string) => {
      return apiRequest('DELETE', `/api/users/${employeeId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/daily-reports'] });
      toast({
        title: "Dipendente eliminato",
        description: "Il dipendente è stato eliminato con successo.",
      });
      setDeleteEmployeeDialogOpen(false);
      setSelectedEmployee(null);
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'eliminazione del dipendente.",
        variant: "destructive",
      });
    },
  });

  // Mutation per creare nuovo cliente
  const createClientMutation = useMutation({
    mutationFn: async (data: AddClientForm) => {
      return apiRequest('POST', '/api/clients', {
        name: data.name,
        description: null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      toast({
        title: "Cliente aggiunto",
        description: "Il nuovo cliente è stato aggiunto con successo.",
      });
      clientForm.reset();
      setAddClientDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante la creazione del cliente.",
        variant: "destructive",
      });
    },
  });

  // Mutation per eliminare cliente
  const deleteClientMutation = useMutation({
    mutationFn: async (clientId: string) => {
      return apiRequest('DELETE', `/api/clients/${clientId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      queryClient.invalidateQueries({ queryKey: ['/api/work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/daily-reports'] });
      toast({
        title: "Cliente eliminato",
        description: "Il cliente e tutte le commesse e operazioni associate sono stati eliminati con successo.",
      });
      setDeleteClientDialogOpen(false);
      setSelectedClientToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'eliminazione del cliente.",
        variant: "destructive",
      });
    },
  });

  // Mutation per creare nuova commessa
  const createWorkOrderMutation = useMutation({
    mutationFn: async (data: AddWorkOrderForm) => {
      return apiRequest('POST', `/api/clients/${data.clientId}/work-orders`, {
        name: data.name,
        description: data.description || "",
        isActive: data.isActive,
        availableWorkTypes: data.availableWorkTypes || [],
        availableMaterials: data.availableMaterials || [],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/work-orders'] });
      toast({
        title: "Commessa creata",
        description: "La nuova commessa è stata creata con successo.",
      });
      workOrderForm.reset();
      setAddWorkOrderDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante la creazione della commessa.",
        variant: "destructive",
      });
    },
  });

  // Mutation per eliminare commessa
  const deleteWorkOrderMutation = useMutation({
    mutationFn: async (workOrderId: string) => {
      return apiRequest('DELETE', `/api/work-orders/${workOrderId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/work-orders'] });
      toast({
        title: "Commessa eliminata",
        description: "La commessa è stata eliminata con successo.",
      });
      setDeleteWorkOrderDialogOpen(false);
      setSelectedWorkOrderToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'eliminazione della commessa.",
        variant: "destructive",
      });
    },
  });

  // Mutation per aggiornare stato commessa
  const updateWorkOrderStatusMutation = useMutation({
    mutationFn: async ({ workOrderId, isActive }: { workOrderId: string; isActive: boolean }) => {
      return apiRequest('PATCH', `/api/work-orders/${workOrderId}/status`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/work-orders'] });
      toast({
        title: "Stato aggiornato",
        description: "Lo stato della commessa è stato aggiornato con successo."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore nell'aggiornamento dello stato",
        variant: "destructive"
      });
    }
  });

  // Mutation per aggiornare commessa completa
  const updateWorkOrderMutation = useMutation({
    mutationFn: async ({ workOrderId, data }: { workOrderId: string; data: AddWorkOrderForm }) => {
      return apiRequest('PUT', `/api/work-orders/${workOrderId}`, {
        clientId: data.clientId,
        name: data.name,
        description: data.description || "",
        isActive: data.isActive,
        availableWorkTypes: data.availableWorkTypes || [],
        availableMaterials: data.availableMaterials || [],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/work-orders'] });
      toast({
        title: "Commessa aggiornata",
        description: "La commessa è stata aggiornata con successo."
      });
      editWorkOrderForm.reset();
      setEditWorkOrderDialogOpen(false);
      setSelectedWorkOrderToEdit(null);
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'aggiornamento della commessa.",
        variant: "destructive"
      });
    }
  });

  // Reset password mutation - generates temporary password
  const resetPasswordMutation = useMutation({
    mutationFn: async (employeeId: string) => {
      const response = await apiRequest('POST', `/api/users/${employeeId}/reset-password`, {});
      return response.json(); // Returns { temporaryPassword, username, fullName }
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] }); // Refresh user list
      setResetPasswordDialogOpen(false);
      setTemporaryPassword(data.temporaryPassword); // Save temp password to show in modal
      setTempPasswordModalOpen(true); // Show modal with temp password
      setSelectedEmployee(null);
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante la generazione della password temporanea.",
        variant: "destructive",
      });
    },
  });

  // Toggle employee status mutation
  const toggleEmployeeStatusMutation = useMutation({
    mutationFn: async ({ employeeId, isActive }: { employeeId: string; isActive: boolean }) => {
      return apiRequest('PUT', `/api/users/${employeeId}/status`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/active'] });
      toast({
        title: "Stato aggiornato",
        description: "Lo stato del dipendente è stato aggiornato con successo.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'aggiornamento dello stato.",
        variant: "destructive",
      });
    },
  });

  const handleAddEmployee = (data: AddEmployeeForm) => {
    createEmployeeMutation.mutate(data);
  };

  const handleEditEmployee = (employee: any) => {
    setSelectedEmployee(employee);
    editForm.reset({
      fullName: employee.fullName,
      username: employee.username,
      password: "", // Password vuota per default
      isActive: employee.isActive ?? true,
    });
    setEditEmployeeDialogOpen(true);
  };

  const handleUpdateEmployee = (data: EditEmployeeForm) => {
    if (selectedEmployee) {
      updateEmployeeMutation.mutate({ ...data, id: selectedEmployee.id });
    }
  };

  const handleDeleteEmployee = async (employee: any) => {
    setSelectedEmployee(employee);

    // Fetch daily reports count
    try {
      const response = await fetch(`/api/users/${employee.id}/daily-reports/count`);
      const data = await response.json();
      setEmployeeReportsCount(data.count || 0);
    } catch (error) {
      console.error("Error fetching reports count:", error);
      setEmployeeReportsCount(0);
    }

    setDeleteEmployeeDialogOpen(true);
  };

  const confirmDeleteEmployee = () => {
    if (selectedEmployee) {
      deleteEmployeeMutation.mutate(selectedEmployee.id);
    }
  };

  const handleAddClient = (data: AddClientForm) => {
    createClientMutation.mutate(data);
  };

  const handleAddWorkOrder = (data: AddWorkOrderForm) => {
    createWorkOrderMutation.mutate(data);
  };

  const handleEditWorkOrder = (workOrder: any) => {
    setSelectedWorkOrderToEdit(workOrder);
    editWorkOrderForm.reset({
      clientId: workOrder.clientId,
      name: workOrder.name,
      description: workOrder.description || "",
      isActive: workOrder.isActive ?? true,
      availableWorkTypes: workOrder.availableWorkTypes || [],
      availableMaterials: workOrder.availableMaterials || [],
    });
    setEditWorkOrderDialogOpen(true);
  };

  const handleUpdateWorkOrder = (data: AddWorkOrderForm) => {
    if (selectedWorkOrderToEdit) {
      updateWorkOrderMutation.mutate({
        workOrderId: selectedWorkOrderToEdit.id,
        data
      });
    }
  };

  const handleDeleteWorkOrder = (workOrder: any) => {
    setSelectedWorkOrderToDelete(workOrder);
    setDeleteWorkOrderDialogOpen(true);
  };

  const confirmDeleteWorkOrder = () => {
    if (selectedWorkOrderToDelete) {
      deleteWorkOrderMutation.mutate(selectedWorkOrderToDelete.id);
    }
  };

  const handleDeleteClient = async (client: any) => {
    setSelectedClientToDelete(client);

    // Fetch work orders and operations count
    try {
      const [workOrdersResponse, operationsResponse] = await Promise.all([
        fetch(`/api/clients/${client.id}/work-orders/count`),
        fetch(`/api/clients/${client.id}/operations/count`)
      ]);
      const workOrdersData = await workOrdersResponse.json();
      const operationsData = await operationsResponse.json();
      setClientWorkOrdersCount(workOrdersData.count || 0);
      setClientOperationsCount(operationsData.count || 0);
    } catch (error) {
      console.error("Error fetching client counts:", error);
      setClientWorkOrdersCount(0);
      setClientOperationsCount(0);
    }

    setDeleteClientDialogOpen(true);
  };

  const confirmDeleteClient = () => {
    if (selectedClientToDelete) {
      deleteClientMutation.mutate(selectedClientToDelete.id);
    }
  };

  const confirmDeleteReport = () => {
    if (selectedReportToDelete) {
      deleteReportMutation.mutate(selectedReportToDelete.id);
    }
  };

  const handleResetPassword = (employee: any) => {
    setSelectedEmployee(employee);
    setResetPasswordDialogOpen(true);
  };

  const confirmResetPassword = () => {
    if (selectedEmployee) {
      resetPasswordMutation.mutate(selectedEmployee.id);
    }
  };

  // Mutations for Work Types
  const createWorkTypeMutation = useMutation({
    mutationFn: async (data: WorkTypeForm) => {
      return apiRequest('POST', '/api/work-types', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/work-types'] });
      toast({
        title: "Lavorazione aggiunta",
        description: "La nuova lavorazione è stata aggiunta con successo.",
      });
      workTypeForm.reset();
      setAddWorkTypeDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'aggiunta della lavorazione.",
        variant: "destructive",
      });
    },
  });

  const updateWorkTypeMutation = useMutation({
    mutationFn: async (data: WorkTypeForm & { id: string }) => {
      const { id, ...updateData } = data;
      return apiRequest('PATCH', `/api/work-types/${id}`, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/work-types'] });
      toast({
        title: "Lavorazione aggiornata",
        description: "La lavorazione è stata aggiornata con successo.",
      });
      workTypeForm.reset();
      setEditWorkTypeDialogOpen(false);
      setSelectedWorkType(null);
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'aggiornamento della lavorazione.",
        variant: "destructive",
      });
    },
  });

  const deleteWorkTypeMutation = useMutation({
    mutationFn: async (workTypeId: string) => {
      return apiRequest('DELETE', `/api/work-types/${workTypeId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/work-types'] });
      toast({
        title: "Lavorazione eliminata",
        description: "La lavorazione è stata eliminata con successo.",
      });
      setDeleteWorkTypeDialogOpen(false);
      setSelectedWorkType(null);
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'eliminazione della lavorazione.",
        variant: "destructive",
      });
    },
  });

  // Mutations for Materials
  const createMaterialMutation = useMutation({
    mutationFn: async (data: MaterialForm) => {
      return apiRequest('POST', '/api/materials', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials'] });
      toast({
        title: "Materiale aggiunto",
        description: "Il nuovo materiale è stato aggiunto con successo.",
      });
      materialForm.reset();
      setAddMaterialDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'aggiunta del materiale.",
        variant: "destructive",
      });
    },
  });

  const updateMaterialMutation = useMutation({
    mutationFn: async (data: MaterialForm & { id: string }) => {
      const { id, ...updateData } = data;
      return apiRequest('PATCH', `/api/materials/${id}`, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials'] });
      toast({
        title: "Materiale aggiornato",
        description: "Il materiale è stato aggiornato con successo.",
      });
      materialForm.reset();
      setEditMaterialDialogOpen(false);
      setSelectedMaterial(null);
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'aggiornamento del materiale.",
        variant: "destructive",
      });
    },
  });

  const deleteMaterialMutation = useMutation({
    mutationFn: async (materialId: string) => {
      return apiRequest('DELETE', `/api/materials/${materialId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials'] });
      toast({
        title: "Materiale eliminato",
        description: "Il materiale è stato eliminato con successo.",
      });
      setDeleteMaterialDialogOpen(false);
      setSelectedMaterial(null);
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'eliminazione del materiale.",
        variant: "destructive",
      });
    },
  });

  // Mutation per registrare assenze
  const registerAbsenceMutation = useMutation({
    mutationFn: async (data: RegisterAbsenceForm) => {
      // Crea una assenza per ogni userId selezionato
      const promises = data.userIds.map(userId => 
        apiRequest('POST', '/api/attendance-entries', {
          userId,
          date: data.date,
          absenceType: data.absenceType,
          notes: data.notes || "",
        })
      );
      return Promise.all(promises);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/attendance-entries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/monthly'] });
      toast({
        title: "Assenze registrate",
        description: `${variables.userIds.length} assenza/e registrata/e con successo.`,
      });
      registerAbsenceForm.reset({
        date: new Date().toISOString().split('T')[0],
        userIds: [],
        absenceType: "",
        notes: "",
      });
      setSelectedUserIds([]);
      setRegisterAbsenceDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante la registrazione delle assenze.",
        variant: "destructive",
      });
    },
  });

  // Quick-add mutations for work order dialog
  const quickAddWorkTypeMutation = useMutation({
    mutationFn: async (data: WorkTypeForm) => {
      return apiRequest('POST', '/api/work-types', data);
    },
    onMutate: async (newWorkType: WorkTypeForm) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['/api/work-types'] });

      // Snapshot the previous value for rollback
      const previousWorkTypes = queryClient.getQueryData(['/api/work-types']);

      // Optimistically update the cache with a temporary ID
      const optimisticWorkType = {
        id: `temp-${Date.now()}`,
        name: newWorkType.name,
        description: newWorkType.description || "",
        isActive: true,
      };

      queryClient.setQueryData(['/api/work-types'], (old: any) => {
        return old ? [...old, optimisticWorkType] : [optimisticWorkType];
      });

      // Auto-select the newly created work type in both forms immediately using the temp ID
      const currentWorkTypes = workOrderForm.getValues('availableWorkTypes') || [];
      workOrderForm.setValue('availableWorkTypes', [...currentWorkTypes, optimisticWorkType.id]);

      const currentEditWorkTypes = editWorkOrderForm.getValues('availableWorkTypes') || [];
      editWorkOrderForm.setValue('availableWorkTypes', [...currentEditWorkTypes, optimisticWorkType.id]);

      // Return context for rollback
      return { previousWorkTypes, tempId: optimisticWorkType.id };
    },
    onSuccess: async (response: any, newWorkType: WorkTypeForm, context: any) => {
      // Get the real ID from the response
      const realId = response.id;
      
      // Replace temp ID with real ID in both forms
      if (context?.tempId && realId) {
        const currentWorkTypes = workOrderForm.getValues('availableWorkTypes') || [];
        workOrderForm.setValue('availableWorkTypes', currentWorkTypes.map((id: string) => id === context.tempId ? realId : id));

        const currentEditWorkTypes = editWorkOrderForm.getValues('availableWorkTypes') || [];
        editWorkOrderForm.setValue('availableWorkTypes', currentEditWorkTypes.map((id: string) => id === context.tempId ? realId : id));
      }
      
      // Refetch to get the real data from server
      queryClient.invalidateQueries({ queryKey: ['/api/work-types'] });
      toast({
        title: "Lavorazione aggiunta",
        description: "La nuova lavorazione è stata aggiunta con successo.",
      });

      // Reset quick-add form
      setQuickAddWorkTypeName("");
      setShowQuickAddWorkType(false);
    },
    onError: (error: any, newWorkType: WorkTypeForm, context: any) => {
      // Rollback optimistic update
      if (context?.previousWorkTypes) {
        queryClient.setQueryData(['/api/work-types'], context.previousWorkTypes);
      }

      // Remove temp ID from form selections
      if (context?.tempId) {
        const currentWorkTypes = workOrderForm.getValues('availableWorkTypes') || [];
        workOrderForm.setValue('availableWorkTypes', currentWorkTypes.filter((id: string) => id !== context.tempId));

        const currentEditWorkTypes = editWorkOrderForm.getValues('availableWorkTypes') || [];
        editWorkOrderForm.setValue('availableWorkTypes', currentEditWorkTypes.filter((id: string) => id !== context.tempId));
      }

      toast({
        title: "Errore",
        description: error.message || "Errore durante l'aggiunta della lavorazione.",
        variant: "destructive",
      });
    },
  });

  const quickAddMaterialMutation = useMutation({
    mutationFn: async (data: MaterialForm) => {
      return apiRequest('POST', '/api/materials', data);
    },
    onMutate: async (newMaterial: MaterialForm) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['/api/materials'] });

      // Snapshot the previous value for rollback
      const previousMaterials = queryClient.getQueryData(['/api/materials']);

      // Optimistically update the cache with a temporary ID
      const optimisticMaterial = {
        id: `temp-${Date.now()}`,
        name: newMaterial.name,
        description: newMaterial.description || "",
        isActive: true,
      };

      queryClient.setQueryData(['/api/materials'], (old: any) => {
        return old ? [...old, optimisticMaterial] : [optimisticMaterial];
      });

      // Auto-select the newly created material in both forms immediately using the temp ID
      const currentMaterials = workOrderForm.getValues('availableMaterials') || [];
      workOrderForm.setValue('availableMaterials', [...currentMaterials, optimisticMaterial.id]);

      const currentEditMaterials = editWorkOrderForm.getValues('availableMaterials') || [];
      editWorkOrderForm.setValue('availableMaterials', [...currentEditMaterials, optimisticMaterial.id]);

      // Return context for rollback
      return { previousMaterials, tempId: optimisticMaterial.id };
    },
    onSuccess: async (response: any, newMaterial: MaterialForm, context: any) => {
      // Get the real ID from the response
      const realId = response.id;
      
      // Replace temp ID with real ID in both forms
      if (context?.tempId && realId) {
        const currentMaterials = workOrderForm.getValues('availableMaterials') || [];
        workOrderForm.setValue('availableMaterials', currentMaterials.map((id: string) => id === context.tempId ? realId : id));

        const currentEditMaterials = editWorkOrderForm.getValues('availableMaterials') || [];
        editWorkOrderForm.setValue('availableMaterials', currentEditMaterials.map((id: string) => id === context.tempId ? realId : id));
      }
      
      // Refetch to get the real data from server
      queryClient.invalidateQueries({ queryKey: ['/api/materials'] });
      toast({
        title: "Materiale aggiunto",
        description: "Il nuovo materiale è stato aggiunto con successo.",
      });

      // Reset quick-add form
      setQuickAddMaterialName("");
      setShowQuickAddMaterial(false);
    },
    onError: (error: any, newMaterial: MaterialForm, context: any) => {
      // Rollback optimistic update
      if (context?.previousMaterials) {
        queryClient.setQueryData(['/api/materials'], context.previousMaterials);
      }

      // Remove temp ID from form selections
      if (context?.tempId) {
        const currentMaterials = workOrderForm.getValues('availableMaterials') || [];
        workOrderForm.setValue('availableMaterials', currentMaterials.filter((id: string) => id !== context.tempId));

        const currentEditMaterials = editWorkOrderForm.getValues('availableMaterials') || [];
        editWorkOrderForm.setValue('availableMaterials', currentEditMaterials.filter((id: string) => id !== context.tempId));
      }

      toast({
        title: "Errore",
        description: error.message || "Errore durante l'aggiunta del materiale.",
        variant: "destructive",
      });
    },
  });

  // Handlers for Work Types
  const handleAddWorkType = (data: WorkTypeForm) => {
    createWorkTypeMutation.mutate(data);
  };

  const handleEditWorkType = (workType: any) => {
    setSelectedWorkType(workType);
    workTypeForm.reset({
      name: workType.name,
      description: workType.description || "",
      isActive: workType.isActive,
    });
    setEditWorkTypeDialogOpen(true);
  };

  const handleUpdateWorkType = (data: WorkTypeForm) => {
    if (selectedWorkType) {
      updateWorkTypeMutation.mutate({ ...data, id: selectedWorkType.id });
    }
  };

  const handleDeleteWorkType = (workType: any) => {
    setSelectedWorkType(workType);
    setDeleteWorkTypeDialogOpen(true);
  };

  const confirmDeleteWorkType = () => {
    if (selectedWorkType) {
      deleteWorkTypeMutation.mutate(selectedWorkType.id);
    }
  };

  // Handlers for Materials
  const handleAddMaterial = (data: MaterialForm) => {
    createMaterialMutation.mutate(data);
  };

  const handleEditMaterial = (material: any) => {
    setSelectedMaterial(material);
    materialForm.reset({
      name: material.name,
      description: material.description || "",
      isActive: material.isActive,
    });
    setEditMaterialDialogOpen(true);
  };

  const handleUpdateMaterial = (data: MaterialForm) => {
    if (selectedMaterial) {
      updateMaterialMutation.mutate({ ...data, id: selectedMaterial.id });
    }
  };

  const handleDeleteMaterial = (material: any) => {
    setSelectedMaterial(material);
    setDeleteMaterialDialogOpen(true);
  };

  const confirmDeleteMaterial = () => {
    if (selectedMaterial) {
      deleteMaterialMutation.mutate(selectedMaterial.id);
    }
  };

  // Handlers for quick-add functionality
  const handleQuickAddWorkType = () => {
    if (quickAddWorkTypeName.trim().length >= 2) {
      quickAddWorkTypeMutation.mutate({
        name: quickAddWorkTypeName.trim(),
        isActive: true,
      });
    }
  };

  const handleQuickAddMaterial = () => {
    if (quickAddMaterialName.trim().length >= 2) {
      quickAddMaterialMutation.mutate({
        name: quickAddMaterialName.trim(),
        isActive: true,
      });
    }
  };

  const filteredReports = (reports as any[])
    .filter((report: any) => {
      const employeeName = report.employeeName || report.employee || "";
      const matchesSearch = employeeName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || report.status === statusFilter;

      // Filtro intervallo date
      let matchesDate = true;
      if (fromDate || toDate) {
        const reportDate = new Date(report.date);
        reportDate.setHours(0, 0, 0, 0);

        if (fromDate && toDate) {
          const from = new Date(fromDate);
          const to = new Date(toDate);
          from.setHours(0, 0, 0, 0);
          to.setHours(23, 59, 59, 999);
          matchesDate = reportDate >= from && reportDate <= to;
        } else if (fromDate) {
          const from = new Date(fromDate);
          from.setHours(0, 0, 0, 0);
          matchesDate = reportDate >= from;
        } else if (toDate) {
          const to = new Date(toDate);
          to.setHours(23, 59, 59, 999);
          matchesDate = reportDate <= to;
        }
      }

      return matchesSearch && matchesStatus && matchesDate;
    })
    .sort((a: any, b: any) => {
      // Prima ordina per data (più recente prima)
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();

      if (dateA !== dateB) {
        return dateB - dateA; // Data più recente prima
      }

      // A parità di data, ordina per stato (In attesa prima di Approvato)
      if (a.status === "In attesa" && b.status === "Approvato") {
        return -1; // a viene prima
      }
      if (a.status === "Approvato" && b.status === "In attesa") {
        return 1; // b viene prima
      }

      return 0; // Stesso stato
    });

  // Mutation per approvare rapportino
  const approveReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      return apiRequest('PATCH', `/api/daily-reports/${reportId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/daily-reports'] });
      queryClient.invalidateQueries({ queryKey: ['/api/work-orders/stats'] });
      toast({
        title: "Rapportino approvato",
        description: "Il rapportino è stato approvato con successo."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore nell'approvazione del rapportino",
        variant: "destructive"
      });
    }
  });

  // Mutation per cambiare data rapportino
  const changeDateMutation = useMutation({
    mutationFn: async ({ reportId, newDate }: { reportId: string; newDate: string }) => {
      return apiRequest('PATCH', `/api/daily-reports/${reportId}/change-date`, { newDate });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/daily-reports'] });
      queryClient.invalidateQueries({ queryKey: ['/api/work-orders/stats'] });
      toast({
        title: "Data modificata",
        description: "La data del rapportino è stata modificata con successo."
      });
      setChangeDateDialogOpen(false);
      setSelectedReportToChangeDate(null);
      setNewReportDate("");
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile modificare la data del rapportino",
        variant: "destructive"
      });
    }
  });

  // Mutation per eliminare rapportino
  const deleteReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      return apiRequest('DELETE', `/api/daily-reports/${reportId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/daily-reports'] });
      queryClient.invalidateQueries({ queryKey: ['/api/work-orders/stats'] });
      toast({
        title: "Rapportino eliminato",
        description: "Il rapportino è stato eliminato con successo."
      });
      setDeleteReportDialogOpen(false);
      setSelectedReportToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore nell'eliminazione del rapportino",
        variant: "destructive"
      });
    }
  });

  const handleApproveReport = (reportId: string) => {
    approveReportMutation.mutate(reportId);
  };

  // Mutation per recuperare singolo rapportino con operazioni
  const fetchReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const response = await apiRequest('GET', `/api/daily-reports/${reportId}`);
      return response.json();
    },
    onSuccess: (data) => {
      setSelectedReport(data);
      setReportOperations(data.operations || []);
      setEditReportDialogOpen(true);
    },
    onError: (error: any) => {
      console.error("Error fetching report:", error);
      toast({
        title: "Errore",
        description: "Impossibile caricare il rapportino",
        variant: "destructive",
      });
    },
  });

  // Mutation per aggiornare rapportino
  const updateReportMutation = useMutation({
    mutationFn: async ({ reportId, operations }: { reportId: string; operations: any[] }) => {
      const response = await apiRequest('PUT', `/api/daily-reports/${reportId}`, {
        operations
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/daily-reports'] });
      queryClient.invalidateQueries({ queryKey: ['/api/work-orders/stats'] });
      setEditReportDialogOpen(false);
      setSelectedReport(null);
      setReportOperations([]);
      toast({
        title: "Rapportino aggiornato",
        description: "Il rapportino è stato aggiornato con successo.",
      });
    },
    onError: (error: any) => {
      console.error("Error updating report:", error);
      toast({
        title: "Errore",
        description: "Impossibile aggiornare il rapportino",
        variant: "destructive",
      });
    },
  });

  const handleEditReport = (reportId: string) => {
    fetchReportMutation.mutate(reportId);
  };

  const handleUpdateReport = (operations: any[]) => {
    if (selectedReport) {
      updateReportMutation.mutate({
        reportId: selectedReport.id,
        operations
      });
    }
  };

  // Mutation per espandere e recuperare dettagli rapportino
  const fetchReportDetailsMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const response = await apiRequest('GET', `/api/daily-reports/${reportId}`);
      return response.json();
    },
    onSuccess: (data) => {
      setExpandedReportData(data);
    },
    onError: (error: any) => {
      console.error("Error fetching report details:", error);
      toast({
        title: "Errore",
        description: "Impossibile caricare i dettagli del rapportino",
        variant: "destructive",
      });
    },
  });

  const handleToggleReportExpansion = (reportId: string) => {
    if (expandedReportId === reportId) {
      // Collassa se già espanso
      setExpandedReportId(null);
      setExpandedReportData(null);
    } else {
      // Espandi e carica i dettagli
      setExpandedReportId(reportId);
      fetchReportDetailsMutation.mutate(reportId);
    }
  };

  const handleExportReports = async (selectedDate?: string) => {
    try {
      const exportDate = selectedDate || new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const response = await fetch(`/api/export/daily-reports/${exportDate}`);

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Rapportini_${exportDate}.docx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        console.log("Word export completed");
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to export Word document");
      }
    } catch (error) {
      console.error("Error exporting Word document:", error);
      if (error instanceof Error) {
        toast({
          title: "Esportazione non riuscita",
          description: error.message || "Errore nell'esportazione del documento Word",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Errore",
          description: "Errore nell'esportazione del documento Word",
          variant: "destructive"
        });
      }
    }
  };

  const handleExportFilteredReportsTxt = async () => {
    try {
      // Build URL with parameters for date range
      let url = '/api/export/daily-reports-txt-range';
      const params = new URLSearchParams();

      if (fromDate) params.append('from', fromDate);
      if (toDate) params.append('to', toDate);
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      if (searchTerm) params.append('search', searchTerm);

      if (params.toString()) {
        url += '?' + params.toString();
      }

      const response = await fetch(url);

      if (response.ok) {
        const blob = await response.blob();
        const url_blob = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url_blob;

        // Dynamic filename based on filters
        let filename = 'Rapportini';
        if (fromDate && toDate) {
          filename += `_${fromDate}_${toDate}`;
        } else if (fromDate) {
          filename += `_da_${fromDate}`;
        } else if (toDate) {
          filename += `_fino_${toDate}`;
        } else {
          filename += `_${new Date().toISOString().split('T')[0]}`;
        }
        filename += '.txt';

        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url_blob);
        document.body.removeChild(a);
        console.log("TXT export completed");
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to export TXT document");
      }
    } catch (error) {
      console.error("Error exporting TXT document:", error);
      if (error instanceof Error) {
        toast({
          title: "Esportazione non riuscita",
          description: error.message || "Errore nell'esportazione del documento TXT",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Errore",
          description: "Errore nell'esportazione del documento TXT",
          variant: "destructive"
        });
      }
    }
  };

  const handleExportFilteredReports = async () => {
    try {
      // Costruisci URL con parametri per intervallo di date
      let url = '/api/export/daily-reports-range';
      const params = new URLSearchParams();

      if (fromDate) params.append('from', fromDate);
      if (toDate) params.append('to', toDate);
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      if (searchTerm) params.append('search', searchTerm);

      if (params.toString()) {
        url += '?' + params.toString();
      }

      const response = await fetch(url);

      if (response.ok) {
        const blob = await response.blob();
        const url_blob = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url_blob;

        // Nome file dinamico basato sui filtri
        let filename = 'Rapportini';
        if (fromDate && toDate) {
          filename += `_${fromDate}_${toDate}`;
        } else if (fromDate) {
          filename += `_da_${fromDate}`;
        } else if (toDate) {
          filename += `_fino_${toDate}`;
        } else {
          filename += `_${new Date().toISOString().split('T')[0]}`;
        }
        filename += '.docx';

        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url_blob);
        document.body.removeChild(a);
        toast({
          title: "Esportazione completata",
          description: `${filteredReports.length} rapportini esportati`
        });
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to export Word document");
      }
    } catch (error) {
      console.error("Error exporting filtered reports:", error);
      if (error instanceof Error) {
        toast({
          title: "Esportazione non riuscita",
          description: error.message || "Errore nell'esportazione dei rapportini",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Errore",
          description: "Errore nell'esportazione dei rapportini",
          variant: "destructive"
        });
      }
    }
  };

  const totalPendingReports = (reports as any[]).filter((r: any) => r.status === "In attesa").length;
  const totalOpenWorkOrders = (workOrders as any[]).filter((wo: any) => wo.isActive === true).length;

  const handleViewWorkOrderReport = (operation: any) => {
    setSelectedWorkOrder({
      id: operation.workOrderId,
      number: operation.workOrderNumber,
      description: operation.workOrderDescription,
      clientName: operation.clientName
    });
    setSelectedTab("work-orders");
  };

  const handleBackToWorkOrders = () => {
    setSelectedWorkOrder(null);
  };

  const handleSelectWorkOrder = (workOrder: any) => {
    setSelectedWorkOrder({
      id: workOrder.id,
      number: workOrder.number,
      description: workOrder.description,
      clientName: workOrder.clientName
    });
  };

  // Prepara dati commesse con statistiche aggregate
  const workOrdersWithStats = workOrders.map((wo: any) => {
    const client = clients.find((c: any) => c.id === wo.clientId);
    const stats = workOrdersStats.find((s: any) => s.workOrderId === wo.id);

    return {
      ...wo,
      clientName: client?.name || "Cliente eliminato",
      totalHours: stats?.totalHours || 0,
      totalOperations: stats?.totalOperations || 0,
      lastActivity: stats?.lastActivity || "Nessuna attività",
      status: wo.isActive ? "In Corso" : "Completato"
    };
  });

  // Filtraggio commesse
  const filteredWorkOrders = workOrdersWithStats.filter((workOrder: any) => {
    // Filtro per stato
    if (workOrderStatusFilter !== "all") {
      const status = workOrder.status.toLowerCase().replace(" ", "-");
      if (status !== workOrderStatusFilter) {
        return false;
      }
    }

    // Filtro per data
    if (workOrderDateFilter !== "all" && workOrder.lastActivity !== "Nessuna attività") {
      const lastActivityDate = new Date(workOrder.lastActivity);
      const today = new Date();
      const daysDiff = Math.floor((today.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24));

      if (workOrderDateFilter === "last7days" && daysDiff > 7) {
        return false;
      }
      if (workOrderDateFilter === "last30days" && daysDiff > 30) {
        return false;
      }
      if (workOrderDateFilter === "last90days" && daysDiff > 90) {
        return false;
      }
    }

    return true;
  });

  // Raggruppa commesse per cliente
  const workOrdersByClient = filteredWorkOrders.reduce((acc: any, workOrder: any) => {
    // Safety check: assicurati che clientName non sia mai undefined/null/empty
    const clientName = workOrder.clientName || "Cliente eliminato";
    if (!acc[clientName]) {
      acc[clientName] = [];
    }
    acc[clientName].push(workOrder);
    return acc;
  }, {});

  // Ordina i clienti alfabeticamente
  const sortedClientNames = Object.keys(workOrdersByClient).sort((a, b) => a.localeCompare(b));

  return (
    <div className="p-6 space-y-6">
      {/* Main Navigation */}
      <Tabs value={mainSection} onValueChange={setMainSection}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="rapportini" data-testid="tab-main-rapportini">
            <FileText className="h-4 w-4 mr-2" />
            Rapportini
          </TabsTrigger>
          <TabsTrigger value="rifornimenti" data-testid="tab-main-rifornimenti">
            <Package className="h-4 w-4 mr-2" />
            Rifornimenti
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rapportini" className="space-y-6 mt-6">

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rapportini in Attesa</p>
                <p className="text-2xl font-bold">{totalPendingReports}</p>
              </div>
              <Clock className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Commesse Aperte</p>
                <p className="text-2xl font-bold">{totalOpenWorkOrders}</p>
              </div>
              <Wrench className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Dipendenti Attivi</p>
                <p className="text-2xl font-bold">
                  {employees ? (employees as any[]).filter((emp: any) => emp.role === 'employee' && emp.isActive === true).length : 0}
                </p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="reports" data-testid="tab-reports">
            <FileText className="h-4 w-4 mr-2" />
            Rapportini
          </TabsTrigger>
          <TabsTrigger value="clients" data-testid="tab-clients">
            <Building2 className="h-4 w-4 mr-2" />
            Clienti
          </TabsTrigger>
          <TabsTrigger value="work-orders" data-testid="tab-work-orders">
            <Wrench className="h-4 w-4 mr-2" />
            Commesse
          </TabsTrigger>
          <TabsTrigger value="employees" data-testid="tab-employees">
            <Users className="h-4 w-4 mr-2" />
            Dipendenti
          </TabsTrigger>
          <TabsTrigger value="work-types" data-testid="tab-work-types">
            <Hammer className="h-4 w-4 mr-2" />
            Configurazione
          </TabsTrigger>
          <TabsTrigger value="attendance" data-testid="tab-attendance">
            <ClipboardList className="h-4 w-4 mr-2" />
            Presenze
          </TabsTrigger>
          <TabsTrigger value="absence-stats" data-testid="tab-absence-stats">
            <BarChart2 className="h-4 w-4 mr-2" />
            Statistiche Assenze
          </TabsTrigger>
        </TabsList>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle>Rapportini Giornalieri</CardTitle>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportFilteredReports()}
                    data-testid="button-export-filtered"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Esporta Word
                  </Button>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportFilteredReportsTxt()}
                    data-testid="button-export-txt"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Esporta TXT
                  </Button>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => setMissingEmployeesDialogOpen(true)}
                    data-testid="button-missing-employees"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Dipendenti Mancanti
                  </Button>
                </div>
                <Button 
                  onClick={() => setCreateReportDialogOpen(true)}
                  data-testid="button-create-report"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nuovo Rapportino
                </Button>
              </div>

              {/* Filters */}
              <div className="flex flex-col gap-4 max-w-sm">
                <div className="w-full relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cerca dipendente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                    data-testid="input-search-employee"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full" data-testid="select-status-filter">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti gli stati</SelectItem>
                    <SelectItem value="In attesa">In attesa</SelectItem>
                    <SelectItem value="Approvato">Confermato</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center justify-between gap-2 px-3 py-2 border rounded-md bg-background">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium whitespace-nowrap">
                      {showAllReports ? 'Tutti' : 'Ultimi 7gg'}
                    </span>
                  </div>
                  <Switch
                    checked={showAllReports}
                    onCheckedChange={setShowAllReports}
                    data-testid="switch-show-all-reports"
                  />
                </div>

                <div className="flex flex-row gap-2 items-center">
                  <div className="flex items-center gap-2 flex-1">
                    <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                    <Input
                      type="date"
                      value={fromDate}
                      onChange={(e) => {
                        setFromDate(e.target.value);
                        setTimeout(() => {
                          toDateInputRef.current?.focus();
                        }, 0);
                      }}
                      placeholder="Da"
                      className="flex-1 min-w-0"
                      data-testid="input-from-date"
                    />
                  </div>
                  <span className="text-muted-foreground">-</span>
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      ref={toDateInputRef}
                      type="date"
                      value={toDate}
                      onChange={(e) => {
                        setToDate(e.target.value);
                        setTimeout(() => {
                          toDateInputRef.current?.blur();
                        }, 0);
                      }}
                      placeholder="A"
                      className="flex-1 min-w-0"
                      data-testid="input-to-date"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {isLoadingReports ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                      <Skeleton className="h-6 w-20 rounded-full" />
                      <Skeleton className="h-9 w-24 rounded-md" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto" data-testid="scroll-table-reports">
                  <Table className="min-w-[480px] md:min-w-[820px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12 hidden md:table-cell"></TableHead>
                        <TableHead>Dipendente</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead className="hidden md:table-cell">Ora Creazione</TableHead>
                        <TableHead>Stato</TableHead>
                        <TableHead className="hidden md:table-cell">Operazioni</TableHead>
                        <TableHead className="hidden md:table-cell">Ore Totali</TableHead>
                        <TableHead>Azioni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                    {filteredReports.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <div className="text-muted-foreground">
                            {searchTerm || statusFilter !== "all" || fromDate || toDate
                              ? "Nessun rapportino trovato con i filtri applicati" 
                              : "Nessun rapportino disponibile"}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredReports.map((report: any) => {
                        const isExpanded = expandedReportId === report.id;
                        const reportDetails = isExpanded ? expandedReportData : null;

                        return (
                          <Fragment key={report.id}>
                            <TableRow 
                              className="cursor-pointer hover-elevate"
                              onClick={() => handleToggleReportExpansion(report.id)}
                              data-testid={`row-report-${report.id}`}
                            >
                              <TableCell className="w-12 hidden md:table-cell">
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </TableCell>
                              <TableCell className="font-medium">
                                <div className="flex items-center justify-between gap-2">
                                  <span>{report.employeeName || report.employee || "Sconosciuto"}</span>
                                  <span className="md:hidden">
                                    {isExpanded ? (
                                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    )}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {formatDateToItalian(report.date)}
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                {report.createdAt ? (
                                  <div className="flex items-center gap-2">
                                    <span>
                                      {new Date(report.createdAt).toLocaleTimeString("it-IT", {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                                      report.createdBy === 'admin'
                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                        : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                    }`}>
                                      {report.createdBy === 'admin' ? 'Ufficio' : 'Utente'}
                                    </span>
                                  </div>
                                ) : "-"}
                              </TableCell>
                              <TableCell>
                                <StatusBadge status={report.status} />
                              </TableCell>
                              <TableCell className="hidden md:table-cell">{report.operations || 0}</TableCell>
                              <TableCell className="hidden md:table-cell">{report.totalHours || 0}h</TableCell>
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditReport(report.id)}
                                    data-testid={`button-edit-report-${report.id}`}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedReportToChangeDate(report);
                                      setNewReportDate(report.date);
                                      setChangeDateDialogOpen(true);
                                    }}
                                    data-testid={`button-change-date-${report.id}`}
                                  >
                                    <Calendar className="h-4 w-4" />
                                  </Button>
                                  {report.status === "In attesa" && (
                                    <Button
                                      variant="default"
                                      size="sm"
                                      onClick={() => handleApproveReport(report.id)}
                                      disabled={approveReportMutation.isPending}
                                      data-testid={`button-approve-report-${report.id}`}
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedReportToDelete(report);
                                      setDeleteReportDialogOpen(true);
                                    }}
                                    data-testid={`button-delete-report-${report.id}`}
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>

                            {/* Riga espandibile con dettagli operazioni */}
                            {isExpanded && reportDetails && (
                              <TableRow key={`${report.id}-details`}>
                                <TableCell colSpan={8} className="bg-muted/30 p-6">
                                  {fetchReportDetailsMutation.isPending ? (
                                    <div className="flex items-center justify-center py-4">
                                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                    </div>
                                  ) : reportDetails.operations && reportDetails.operations.length > 0 ? (
                                    <div className="space-y-4">
                                      {/* Info aggiuntive visibili solo su mobile */}
                                      <div className="md:hidden bg-background rounded-md border p-3 space-y-2">
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                          <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-muted-foreground">Ora creazione:</span>
                                          </div>
                                          <div className="font-medium">
                                            {report.createdAt ? new Date(report.createdAt).toLocaleTimeString("it-IT", { 
                                              hour: '2-digit', 
                                              minute: '2-digit' 
                                            }) : "-"}
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <ClipboardList className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-muted-foreground">Operazioni:</span>
                                          </div>
                                          <div className="font-medium">{report.operations || 0}</div>
                                          <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-muted-foreground">Ore totali:</span>
                                          </div>
                                          <div className="font-medium flex items-center gap-2">
                                            {report.totalHours || 0}h
                                            <Button
                                              size="icon"
                                              variant="ghost"
                                              className="h-6 w-6"
                                              onClick={async () => {
                                                setSelectedReportForAdjustment(report.id);
                                                try {
                                                  const response = await fetch(`/api/hours-adjustment/${report.id}`);
                                                  const data = await response.json();
                                                  setCurrentHoursAdjustment(data);
                                                } catch (error) {
                                                  setCurrentHoursAdjustment(null);
                                                }
                                                setHoursAdjustmentDialogOpen(true);
                                              }}
                                              data-testid={`button-hours-adjustment-${report.id}`}
                                            >
                                              <Calculator className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="font-medium text-sm flex items-center gap-2">
                                        <ClipboardList className="h-4 w-4" />
                                        Operazioni del Rapportino
                                      </div>

                                      <div className="grid gap-3">
                                        {reportDetails.operations.map((operation: any, index: number) => (
                                          <div 
                                            key={operation.id} 
                                            className="bg-background rounded-md border p-4 space-y-2"
                                            data-testid={`operation-${index}`}
                                          >
                                            <div className="flex items-start justify-between gap-4">
                                              <div className="flex-1 space-y-2">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                  <Badge variant="outline" className="gap-1">
                                                    <Building2 className="h-3 w-3" />
                                                    {operation.clientName || "Cliente non specificato"}
                                                  </Badge>
                                                  <Badge variant="outline" className="gap-1">
                                                    <Briefcase className="h-3 w-3" />
                                                    {operation.workOrderName || "Commessa non specificata"}
                                                  </Badge>
                                                  <Badge variant="secondary" className="gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {operation.hours}h
                                                  </Badge>
                                                </div>

                                                {operation.workTypes && operation.workTypes.length > 0 && (
                                                  <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                      <Wrench className="h-3 w-3" />
                                                      Tipi lavoro:
                                                    </span>
                                                    {operation.workTypes.map((type: string, idx: number) => (
                                                      <Badge key={idx} variant="secondary" className="text-xs">
                                                        {getWorkTypeName(type)}
                                                      </Badge>
                                                    ))}
                                                  </div>
                                                )}

                                                {operation.materials && operation.materials.length > 0 && (
                                                  <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                      <Package className="h-3 w-3" />
                                                      Materiali:
                                                    </span>
                                                    {operation.materials.map((material: string, idx: number) => (
                                                      <Badge key={idx} variant="outline" className="text-xs">
                                                        {getMaterialName(material)}
                                                      </Badge>
                                                    ))}
                                                  </div>
                                                )}

                                                {operation.notes && (
                                                  <div className="text-sm text-muted-foreground pt-1 border-t">
                                                    <span className="font-medium">Note operazione:</span> {operation.notes}
                                                  </div>
                                                )}

                                                {operation.photos && operation.photos.length > 0 && (
                                                  <div className="pt-2 border-t">
                                                    <span className="text-xs text-muted-foreground font-medium flex items-center gap-1 mb-2">
                                                      <Camera className="h-3 w-3" />
                                                      Foto allegate:
                                                    </span>
                                                    <div className="flex flex-wrap gap-2">
                                                      {operation.photos.map((photoPath: string, idx: number) => {
                                                        const fullPhotoPath = photoPath.startsWith('http') ? photoPath : `/objects/${encodeURIComponent(photoPath)}`;
                                                        return (
                                                          <img
                                                            key={idx}
                                                            src={fullPhotoPath}
                                                            alt={`Foto ${idx + 1}`}
                                                            className="w-20 h-20 object-cover rounded-md border cursor-pointer hover:opacity-80 transition-opacity"
                                                            data-testid={`operation-photo-${index}-${idx}`}
                                                            onClick={() => {
                                                              const allPhotos = operation.photos.map((p: string) =>
                                                                p.startsWith('http') ? p : `/objects/${encodeURIComponent(p)}`
                                                              );
                                                              setLightboxPhotos(allPhotos);
                                                              setLightboxIndex(idx);
                                                              setLightboxOpen(true);
                                                            }}
                                                          />
                                                        );
                                                      })}
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>

                                      {reportDetails.notes && (
                                        <div className="mt-4 p-4 bg-background rounded-md border">
                                          <div className="flex items-center gap-2 mb-2">
                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-medium text-sm">Note Rapportino</span>
                                          </div>
                                          <p className="text-sm text-muted-foreground">{reportDetails.notes}</p>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="text-center text-muted-foreground py-4">
                                      Nessuna operazione registrata
                                    </div>
                                  )}
                                </TableCell>
                              </TableRow>
                            )}
                          </Fragment>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>


        {/* Work Orders Tab - LAYOUT SISTEMATO */}
        <TabsContent value="work-orders" className="space-y-4">
          {selectedWorkOrder ? (
            <WorkOrderReport
              workOrderId={selectedWorkOrder.id}
              workOrderNumber={selectedWorkOrder.number}
              workOrderDescription={selectedWorkOrder.description}
              clientName={selectedWorkOrder.clientName}
              onBack={handleBackToWorkOrders}
            />
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Gestione Commesse</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Seleziona una commessa per visualizzare il report dettagliato
                    </p>
                  </div>
                  <Button onClick={() => setAddWorkOrderDialogOpen(true)} data-testid="button-add-workorder">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuova Commessa
                  </Button>
                </div>

                {/* Filtri per commesse */}
                <div className="flex flex-col sm:flex-row flex-wrap gap-4 mt-4">
                  <div className="flex-1">
                    <Label htmlFor="status-filter" className="text-sm mb-2 block">Stato</Label>
                    <Select
                      value={workOrderStatusFilter}
                      onValueChange={setWorkOrderStatusFilter}
                    >
                      <SelectTrigger id="status-filter" data-testid="select-workorder-status-filter">
                        <SelectValue placeholder="Tutti" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tutti</SelectItem>
                        <SelectItem value="in-corso">In Corso</SelectItem>
                        <SelectItem value="completato">Completato</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-1">
                    <Label htmlFor="date-filter" className="text-sm mb-2 block">Periodo</Label>
                    <Select
                      value={workOrderDateFilter}
                      onValueChange={setWorkOrderDateFilter}
                    >
                      <SelectTrigger id="date-filter" data-testid="select-workorder-date-filter">
                        <SelectValue placeholder="Tutte" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tutte</SelectItem>
                        <SelectItem value="last7days">Ultimi 7 giorni</SelectItem>
                        <SelectItem value="last30days">Ultimi 30 giorni</SelectItem>
                        <SelectItem value="last90days">Ultimi 90 giorni</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredWorkOrders.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    Nessuna commessa trovata con i filtri selezionati
                  </div>
                ) : (
                  <div className="space-y-6" data-testid="scroll-table-workorders">
                    {sortedClientNames.map((clientName) => (
                      <div key={clientName} className="space-y-3">
                        {/* Intestazione Cliente */}
                        <div className="flex items-center gap-2 pb-2 border-b-2 border-primary">
                          <Building2 className="h-5 w-5 text-primary" />
                          <h3 className="text-lg font-semibold text-primary">{clientName}</h3>
                          <Badge variant="outline" className="ml-2">
                            {workOrdersByClient[clientName].length} {workOrdersByClient[clientName].length === 1 ? 'commessa' : 'commesse'}
                          </Badge>
                        </div>

                        {/* Tabella Commesse del Cliente - LAYOUT MIGLIORATO */}
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[35%]">Nome Commessa</TableHead>
                                <TableHead className="w-[150px]">Stato</TableHead>
                                <TableHead className="w-[100px] text-right">Ore</TableHead>
                                <TableHead className="w-[180px]">Ultima Attività</TableHead>
                                <TableHead className="w-[280px] text-right">Azioni</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {workOrdersByClient[clientName].map((workOrder: any) => (
                                <TableRow key={workOrder.id}>
                                  <TableCell className="font-medium">
                                    <div className="truncate max-w-[300px]" title={workOrder.name}>
                                      {workOrder.name}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Select
                                      value={workOrder.isActive ? "in-corso" : "completato"}
                                      onValueChange={(value) => {
                                        const isActive = value === "in-corso";
                                        updateWorkOrderStatusMutation.mutate({ workOrderId: workOrder.id, isActive });
                                      }}
                                      disabled={updateWorkOrderStatusMutation.isPending}
                                    >
                                      <SelectTrigger 
                                        className="w-[130px]" 
                                        data-testid={`select-workorder-status-${workOrder.id}`}
                                      >
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="in-corso">In Corso</SelectItem>
                                        <SelectItem value="completato">Completato</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                  <TableCell className="text-right font-medium tabular-nums">
                                    {workOrder.totalHours}h
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground">
                                    {workOrder.lastActivity === "Nessuna attività" 
                                      ? workOrder.lastActivity 
                                      : formatDateToItalian(workOrder.lastActivity)}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex gap-2 justify-end">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleSelectWorkOrder(workOrder)}
                                        data-testid={`button-view-workorder-${workOrder.id}`}
                                      >
                                        <Eye className="h-4 w-4 mr-2" />
                                        Visualizza
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEditWorkOrder(workOrder)}
                                        data-testid={`button-edit-workorder-${workOrder.id}`}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDeleteWorkOrder(workOrder)}
                                        data-testid={`button-delete-workorder-${workOrder.id}`}
                                      >
                                        <Trash className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Clients Tab */}
        <TabsContent value="clients" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Gestione Clienti</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Visualizza e gestisci tutti i clienti. L'eliminazione di un cliente non eliminerà le commesse associate.
                  </p>
                </div>
                <Button onClick={() => setAddClientDialogOpen(true)} data-testid="button-add-client">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuovo Cliente
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto" data-testid="scroll-table-clients">
                <Table className="min-w-[640px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome Cliente</TableHead>
                      <TableHead>Commesse Attive</TableHead>
                      <TableHead>Commesse Totali</TableHead>
                      <TableHead>Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                  {isLoadingClients ? (
                    <>
                      {[...Array(3)].map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Skeleton className="h-9 w-9 rounded-md" />
                              <Skeleton className="h-9 w-9 rounded-md" />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </>
                  ) : (clients as any[]).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        Nessun cliente trovato. Aggiungi il primo cliente.
                      </TableCell>
                    </TableRow>
                  ) : (
                    (clients as any[]).map((client: any) => {
                      const clientWorkOrders = (workOrders as any[]).filter((wo: any) => wo.clientId === client.id);
                      const activeWorkOrders = clientWorkOrders.filter((wo: any) => wo.isActive);

                      return (
                        <TableRow key={client.id}>
                          <TableCell className="font-medium" data-testid={`text-client-name-${client.id}`}>
                            {client.name}
                          </TableCell>
                          <TableCell data-testid={`text-active-workorders-${client.id}`}>
                            {activeWorkOrders.length}
                          </TableCell>
                          <TableCell data-testid={`text-total-workorders-${client.id}`}>
                            {clientWorkOrders.length}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteClient(client)}
                              data-testid={`button-delete-client-${client.id}`}
                            >
                              <Trash className="h-4 w-4 mr-2" />
                              Elimina
                            </Button>
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
        </TabsContent>

        {/* Employees Tab - CONTINUA NELLA PARTE 3 */}
{/* Employees Tab */}
        <TabsContent value="employees" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Gestione Dipendenti</CardTitle>
              <Dialog open={addEmployeeDialogOpen} onOpenChange={setAddEmployeeDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-employee">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuovo Dipendente
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Aggiungi Nuovo Dipendente</DialogTitle>
                    <DialogDescription>
                      Inserisci i dati del nuovo dipendente.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleAddEmployee)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome e Cognome</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Es. Mario Rossi" 
                                {...field} 
                                data-testid="input-full-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Username unico" 
                                {...field} 
                                data-testid="input-username"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="Password sicura" 
                                {...field} 
                                data-testid="input-password"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <DialogFooter>
                        <Button 
                          type="submit" 
                          disabled={createEmployeeMutation.isPending}
                          data-testid="button-submit-employee"
                        >
                          {createEmployeeMutation.isPending ? "Aggiungendo..." : "Aggiungi Dipendente"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

              {/* Dialog modifica dipendente */}
              <Dialog open={editEmployeeDialogOpen} onOpenChange={setEditEmployeeDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Modifica Dipendente</DialogTitle>
                    <DialogDescription>
                      Modifica i dati del dipendente. Lascia la password vuota se non vuoi cambiarla.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...editForm}>
                    <form onSubmit={editForm.handleSubmit(handleUpdateEmployee)} className="space-y-4">
                      <FormField
                        control={editForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome e Cognome</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Es. Mario Rossi" 
                                {...field} 
                                data-testid="input-edit-full-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={editForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Username unico" 
                                {...field} 
                                data-testid="input-edit-username"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={editForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password (opzionale)</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="Lascia vuoto per non modificare" 
                                {...field} 
                                data-testid="input-edit-password"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={editForm.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Stato Dipendente
                              </FormLabel>
                              <div className="text-sm text-muted-foreground">
                                {field.value ? "Attivo" : "Licenziato"}
                              </div>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-employee-active"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <DialogFooter>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setEditEmployeeDialogOpen(false)}
                        >
                          Annulla
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={updateEmployeeMutation.isPending}
                          data-testid="button-update-employee"
                        >
                          {updateEmployeeMutation.isPending ? "Aggiornando..." : "Aggiorna Dipendente"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

              {/* Dialog conferma eliminazione dipendente */}
              <AlertDialog open={deleteEmployeeDialogOpen} onOpenChange={setDeleteEmployeeDialogOpen}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Elimina Dipendente</AlertDialogTitle>
                    <AlertDialogDescription>
                      Sei sicuro di voler eliminare il dipendente "{selectedEmployee?.fullName}"?
                      {employeeReportsCount > 0 && (
                        <span className="block mt-2 font-semibold text-destructive">
                          Questa operazione eliminerà anche {employeeReportsCount} {employeeReportsCount === 1 ? 'rapportino associato' : 'rapportini associati'}.
                        </span>
                      )}
                      <span className="block mt-2">
                        Questa azione non può essere annullata.
                      </span>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annulla</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={confirmDeleteEmployee}
                      disabled={deleteEmployeeMutation.isPending}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      data-testid="button-confirm-delete-employee"
                    >
                      {deleteEmployeeMutation.isPending ? "Eliminando..." : "Elimina"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {/* AlertDialog conferma cambio stato dipendente */}
              <AlertDialog open={toggleStatusDialogOpen} onOpenChange={setToggleStatusDialogOpen}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {employeeToToggle?.isActive ? "Disattiva Dipendente" : "Riattiva Dipendente"}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {employeeToToggle?.isActive 
                        ? `Sei sicuro di voler impostare "${employeeToToggle?.fullName}" come licenziato? Il dipendente non potrà più accedere al sistema.`
                        : `Sei sicuro di voler riattivare "${employeeToToggle?.fullName}"? Il dipendente potrà nuovamente accedere al sistema.`
                      }
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel data-testid="button-cancel-toggle-status">Annulla</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => {
                        if (employeeToToggle) {
                          toggleEmployeeStatusMutation.mutate({ 
                            employeeId: employeeToToggle.id, 
                            isActive: !employeeToToggle.isActive 
                          });
                          setToggleStatusDialogOpen(false);
                          setEmployeeToToggle(null);
                        }
                      }}
                      disabled={toggleEmployeeStatusMutation.isPending}
                      className={employeeToToggle?.isActive 
                        ? "bg-orange-600 text-white hover:bg-orange-700" 
                        : "bg-green-600 text-white hover:bg-green-700"
                      }
                      data-testid="button-confirm-toggle-status"
                    >
                      {toggleEmployeeStatusMutation.isPending 
                        ? "Aggiornando..." 
                        : employeeToToggle?.isActive ? "Disattiva" : "Riattiva"
                      }
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Label>Filtra per Stato</Label>
                <Select value={employeeStatusFilter} onValueChange={setEmployeeStatusFilter}>
                  <SelectTrigger className="w-[200px]" data-testid="select-employee-status-filter">
                    <SelectValue placeholder="Seleziona stato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti i dipendenti</SelectItem>
                    <SelectItem value="active">Solo attivi</SelectItem>
                    <SelectItem value="inactive">Solo licenziati</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {isLoadingEmployees ? (
                <div className="overflow-x-auto" data-testid="scroll-table-employees">
                  <Table className="min-w-[700px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Ruolo</TableHead>
                        <TableHead>Stato</TableHead>
                        <TableHead>Azioni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...Array(4)].map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Skeleton className="h-9 w-9 rounded-md" />
                              <Skeleton className="h-9 w-9 rounded-md" />
                              <Skeleton className="h-9 w-9 rounded-md" />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="overflow-x-auto" data-testid="scroll-table-employees">
                  <Table className="min-w-[700px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Ruolo</TableHead>
                        <TableHead>Stato</TableHead>
                        <TableHead>Azioni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                    {(employees as any[])
                      .filter((emp: any) => emp.role === 'employee')
                      .filter((emp: any) => {
                        if (employeeStatusFilter === "active") return emp.isActive === true;
                        if (employeeStatusFilter === "inactive") return emp.isActive === false;
                        return true;
                      })
                      .sort((a: any, b: any) => {
                        // Dipendenti attivi prima, licenziati alla fine
                        if (a.isActive === b.isActive) return 0;
                        return a.isActive ? -1 : 1;
                      })
                      .map((employee: any) => (
                      <TableRow key={employee.id}>
                        <TableCell className="font-medium">{employee.fullName}</TableCell>
                        <TableCell>{employee.username}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">Dipendente</Badge>
                        </TableCell>
                        <TableCell data-testid={`text-employee-status-${employee.id}`}>
                          <Badge variant={employee.isActive ? "default" : "outline"}>
                            {employee.isActive ? "Attivo" : "Licenziato"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => {
                                    setSelectedEmployeeForStats(employee);
                                    setEmployeeStatsDialogOpen(true);
                                  }}
                                  data-testid={`button-employee-stats-${employee.id}`}
                                  className="text-purple-600 hover:text-purple-700"
                                >
                                  <BarChart2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Statistiche Assenze</TooltipContent>
                            </Tooltip>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEditEmployee(employee)}
                              data-testid={`button-edit-employee-${employee.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleResetPassword(employee)}
                              data-testid={`button-reset-password-${employee.id}`}
                              className="text-blue-600 hover:text-blue-700"
                              disabled={resetPasswordMutation.isPending}
                            >
                              <Key className="h-4 w-4" />
                            </Button>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => {
                                    setEmployeeToToggle(employee);
                                    setToggleStatusDialogOpen(true);
                                  }}
                                  data-testid={`button-toggle-status-${employee.id}`}
                                  className={employee.isActive ? "text-orange-600 hover:text-orange-700" : "text-green-600 hover:text-green-700"}
                                  disabled={toggleEmployeeStatusMutation.isPending}
                                >
                                  {employee.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {employee.isActive ? "Imposta come licenziato" : "Riattiva dipendente"}
                              </TooltipContent>
                            </Tooltip>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDeleteEmployee(employee)}
                              data-testid={`button-delete-employee-${employee.id}`}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configurazione Tab (Lavorazioni e Materiali) */}
        <TabsContent value="work-types">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Lavorazioni Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Lavorazioni</CardTitle>
                <Button onClick={() => setAddWorkTypeDialogOpen(true)} data-testid="button-add-worktype">
                  <Plus className="h-4 w-4 mr-2" />
                  Aggiungi Lavorazione
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingWorkTypes ? (
                <div className="text-center py-8 text-muted-foreground">
                  Caricamento lavorazioni...
                </div>
              ) : (
                <div className="overflow-x-auto" data-testid="scroll-table-worktypes">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead className="hidden lg:table-cell">Descrizione</TableHead>
                        <TableHead className="hidden lg:table-cell">Stato</TableHead>
                        <TableHead>Azioni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                    {(workTypes as any[]).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center text-muted-foreground py-8 lg:hidden">
                          Nessuna lavorazione trovata. Aggiungi la prima lavorazione.
                        </TableCell>
                        <TableCell colSpan={4} className="hidden lg:table-cell text-center text-muted-foreground py-8">
                          Nessuna lavorazione trovata. Aggiungi la prima lavorazione.
                        </TableCell>
                      </TableRow>
                    ) : (
                      (workTypes as any[]).map((workType: any) => (
                        <TableRow key={workType.id}>
                          <TableCell className="font-medium" data-testid={`text-worktype-name-${workType.id}`}>
                            {workType.name}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell" data-testid={`text-worktype-description-${workType.id}`}>
                            {workType.description || "-"}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell" data-testid={`text-worktype-status-${workType.id}`}>
                            <Badge variant={workType.isActive ? "default" : "secondary"}>
                              {workType.isActive ? "Attivo" : "Non attivo"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleEditWorkType(workType)}
                                data-testid={`button-edit-worktype-${workType.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleDeleteWorkType(workType)}
                                data-testid={`button-delete-worktype-${workType.id}`}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Materiali Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Materiali</CardTitle>
                <Button onClick={() => setAddMaterialDialogOpen(true)} data-testid="button-add-material">
                  <Plus className="h-4 w-4 mr-2" />
                  Aggiungi Materiale
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingMaterials ? (
                <div className="text-center py-8 text-muted-foreground">
                  Caricamento materiali...
                </div>
              ) : (
                <div className="overflow-x-auto" data-testid="scroll-table-materials">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead className="hidden lg:table-cell">Descrizione</TableHead>
                        <TableHead className="hidden lg:table-cell">Stato</TableHead>
                        <TableHead>Azioni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                    {(materials as any[]).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center text-muted-foreground py-8 lg:hidden">
                          Nessun materiale trovato. Aggiungi il primo materiale.
                        </TableCell>
                        <TableCell colSpan={4} className="hidden lg:table-cell text-center text-muted-foreground py-8">
                          Nessun materiale trovato. Aggiungi il primo materiale.
                        </TableCell>
                      </TableRow>
                    ) : (
                      (materials as any[]).map((material: any) => (
                        <TableRow key={material.id}>
                          <TableCell className="font-medium" data-testid={`text-material-name-${material.id}`}>
                            {material.name}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell" data-testid={`text-material-description-${material.id}`}>
                            {material.description || "-"}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell" data-testid={`text-material-status-${material.id}`}>
                            <Badge variant={material.isActive ? "default" : "secondary"}>
                              {material.isActive ? "Attivo" : "Non attivo"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleEditMaterial(material)}
                                data-testid={`button-edit-material-${material.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleDeleteMaterial(material)}
                                data-testid={`button-delete-material-${material.id}`}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                </div>
              )}
            </CardContent>
          </Card>
          </div>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Foglio Presenze</h2>
            <Button 
              onClick={() => setRegisterAbsenceDialogOpen(true)}
              data-testid="button-register-absence"
            >
              <Plus className="h-4 w-4 mr-2" />
              Registra Assenze
            </Button>
          </div>
          <AttendanceSheet />
        </TabsContent>

        {/* Absence Statistics Tab */}
        <TabsContent value="absence-stats" className="space-y-6">
          {(isLoadingAttendanceStats || isFetchingAttendanceStats) && !attendanceStats ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-muted-foreground">Caricamento statistiche assenze...</p>
              </div>
            </div>
          ) : attendanceStats ? (
            <>
              {/* KPI Cards */}
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Totale Assenze (90gg)</p>
                        <p className="text-2xl font-bold" data-testid="text-total-absences">{attendanceStats.totalAbsences || 0}</p>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-warning" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Tipo Più Comune</p>
                        <p className="text-2xl font-bold" data-testid="text-most-common-type">
                          {attendanceStats.byType && Object.keys(attendanceStats.byType).length > 0 
                            ? (() => {
                                const typeMap: Record<string, string> = {
                                  'A': 'Assenza',
                                  'F': 'Ferie',
                                  'P': 'Permesso',
                                  'M': 'Malattia',
                                  'CP': 'Congedo',
                                  'L104': 'L.104'
                                };
                                const sortedTypes = Object.entries(attendanceStats.byType as Record<string, number>)
                                  .sort((a, b) => b[1] - a[1]);
                                return sortedTypes.length > 0 
                                  ? (typeMap[sortedTypes[0][0]] || sortedTypes[0][0])
                                  : '-';
                              })()
                            : '-'}
                        </p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Giorno Picco</p>
                        <p className="text-2xl font-bold" data-testid="text-peak-day">
                          {attendanceStats.byDayOfWeek && Object.keys(attendanceStats.byDayOfWeek).length > 0 
                            ? (() => {
                                const dayMap: Record<number, string> = {
                                  0: 'Domenica',
                                  1: 'Lunedì',
                                  2: 'Martedì',
                                  3: 'Mercoledì',
                                  4: 'Giovedì',
                                  5: 'Venerdì',
                                  6: 'Sabato'
                                };
                                const sortedDays = Object.entries(attendanceStats.byDayOfWeek as Record<number, number>)
                                  .sort((a, b) => b[1] - a[1]);
                                return sortedDays.length > 0 
                                  ? (dayMap[parseInt(sortedDays[0][0])] || '-')
                                  : '-';
                              })()
                            : '-'}
                        </p>
                      </div>
                      <Calendar className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Media per Dipendente</p>
                        <p className="text-2xl font-bold" data-testid="text-avg-absences">
                          {attendanceStats.byEmployee && attendanceStats.byEmployee.length > 0 
                            ? (attendanceStats.totalAbsences / attendanceStats.byEmployee.length).toFixed(1)
                            : '0'}
                        </p>
                      </div>
                      <Users className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Strategic Absences Card */}
              <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/30">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                      <AlertTriangle className="h-5 w-5" />
                      Assenze Strategiche
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        window.open('/api/attendance/strategic-report?days=90', '_blank');
                      }}
                      data-testid="button-export-strategic-absences"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Export
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Assenze (escluse Ferie) registrate il giorno prima o dopo weekend/festività
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                      {attendanceStats.totalStrategicAbsences || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      su {attendanceStats.totalAbsences - (attendanceStats.byType?.['F'] || 0)} assenze non-ferie
                    </div>
                  </div>
                  
                  {/* Strategic absences by employee ranking */}
                  {attendanceStats.byEmployee && attendanceStats.byEmployee.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground mb-2">Classifica per assenze strategiche (solo dipendenti attivi):</p>
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {attendanceStats.byEmployee
                          .filter(emp => emp.strategicAbsences > 0 && emp.isActive)
                          .sort((a, b) => b.strategicAbsences - a.strategicAbsences)
                          .slice(0, 10)
                          .map((emp, index) => (
                            <div key={emp.userId} className="flex items-center justify-between py-1 px-2 rounded bg-background">
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ${
                                  index === 0 ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                                  index === 1 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' :
                                  index === 2 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                                  'bg-muted text-muted-foreground'
                                }`}>
                                  {index + 1}
                                </span>
                                <span className="text-sm">{emp.fullName}</span>
                              </div>
                              <Badge variant={emp.strategicAbsences >= 5 ? "destructive" : emp.strategicAbsences >= 3 ? "secondary" : "outline"}>
                                {emp.strategicAbsences}
                              </Badge>
                            </div>
                          ))}
                        {attendanceStats.byEmployee.filter(emp => emp.strategicAbsences > 0 && emp.isActive).length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            Nessuna assenza strategica rilevata
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Charts Row */}
              <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                {/* Monthly Trend Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Trend Mensile Assenze
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {attendanceStats.byMonth && attendanceStats.byMonth.length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={attendanceStats.byMonth.slice().reverse()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="month" 
                            tickFormatter={(value) => {
                              const [year, month] = value.split('-');
                              const monthNames = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
                              return monthNames[parseInt(month) - 1] || value;
                            }}
                          />
                          <YAxis />
                          <RechartsTooltip 
                            formatter={(value: number) => [value, 'Assenze']}
                            labelFormatter={(label) => {
                              const [year, month] = label.split('-');
                              const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
                              return `${monthNames[parseInt(month) - 1]} ${year}`;
                            }}
                          />
                          <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center py-8 text-muted-foreground">
                        Nessun dato disponibile
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Absence by Type Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart2 className="h-5 w-5" />
                      Assenze per Tipo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {attendanceStats.byType && Object.keys(attendanceStats.byType).length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={Object.entries(attendanceStats.byType as Record<string, number>).map(([type, count]) => {
                          const typeMap: Record<string, string> = {
                            'A': 'Assenza',
                            'F': 'Ferie',
                            'P': 'Permesso',
                            'M': 'Malattia',
                            'CP': 'Congedo',
                            'L104': 'L.104'
                          };
                          return { type: typeMap[type] || type, count };
                        })}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="type" />
                          <YAxis />
                          <RechartsTooltip formatter={(value: number) => [value, 'Assenze']} />
                          <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center py-8 text-muted-foreground">
                        Nessun dato disponibile
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Absence by Day of Week */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Assenze per Giorno della Settimana
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {attendanceStats.byDayOfWeek && Object.keys(attendanceStats.byDayOfWeek).length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={(() => {
                        const dayNames = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
                        const byDayRecord = attendanceStats.byDayOfWeek as Record<number, number>;
                        return [1, 2, 3, 4, 5, 6, 0].map(dayNum => ({
                          day: dayNames[dayNum],
                          count: byDayRecord[dayNum] || 0
                        }));
                      })()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <RechartsTooltip formatter={(value: number) => [value, 'Assenze']} />
                        <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                      Nessun dato disponibile
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Employee Absence Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Dipendenti con Più Assenze
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {attendanceStats.byEmployee && attendanceStats.byEmployee.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">Pos.</TableHead>
                            <TableHead>Dipendente</TableHead>
                            <TableHead className="text-right">Totale Assenze</TableHead>
                            <TableHead className="text-right">% sul Totale</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {attendanceStats.byEmployee
                            .slice(0, 10)
                            .sort((a: any, b: any) => b.totalAbsences - a.totalAbsences)
                            .map((emp: any, index: number) => (
                            <TableRow key={emp.userId} data-testid={`row-employee-absence-${index}`}>
                              <TableCell>
                                <Badge variant={index < 3 ? "default" : "outline"}>
                                  #{index + 1}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-medium">{emp.fullName}</TableCell>
                              <TableCell className="text-right">{emp.totalAbsences}</TableCell>
                              <TableCell className="text-right">
                                {attendanceStats.totalAbsences > 0 
                                  ? ((emp.totalAbsences / attendanceStats.totalAbsences) * 100).toFixed(1)
                                  : '0'}%
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                      Nessun dato disponibile
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              Nessun dato disponibile per le statistiche assenze.
            </div>
          )}
        </TabsContent>
      </Tabs>
      </TabsContent>

      {/* TUTTI I DIALOG - INIZIO */}

      {/* Dialog per conferma reset password */}
      <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reset Password Dipendente</DialogTitle>
            <DialogDescription>
              Verrà generata una password temporanea casuale che dovrai comunicare al dipendente.
            </DialogDescription>
          </DialogHeader>

          {selectedEmployee && (
            <div className="bg-muted p-4 rounded-lg">
              <div className="space-y-2">
                <div>
                  <Label className="text-sm font-medium">Dipendente:</Label>
                  <p className="text-sm">{selectedEmployee.fullName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Username:</Label>
                  <p className="text-sm font-mono">{selectedEmployee.username}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Il dipendente dovrà impostare una nuova password al prossimo accesso.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResetPasswordDialogOpen(false)}
              data-testid="button-cancel-password"
            >
              Annulla
            </Button>
            <Button
              onClick={confirmResetPassword}
              disabled={resetPasswordMutation.isPending}
              data-testid="button-confirm-password"
            >
              {resetPasswordMutation.isPending ? "Generando..." : "Genera Password Temporanea"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal per mostrare password temporanea (UNA VOLTA) */}
      <Dialog open={tempPasswordModalOpen} onOpenChange={setTempPasswordModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-green-600">Password Temporanea Generata</DialogTitle>
            <DialogDescription>
              Comunica questa password al dipendente. Sarà visualizzata SOLO UNA VOLTA.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-amber-50 border-2 border-amber-300 p-4 rounded-lg">
              <Label className="text-sm font-medium text-amber-900">Password Temporanea:</Label>
              <div className="flex items-center gap-2 mt-2">
                <code className="flex-1 text-2xl font-bold font-mono bg-white p-3 rounded border-2 border-amber-400 text-center select-all">
                  {temporaryPassword}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(temporaryPassword);
                    toast({
                      title: "Copiato",
                      description: "Password copiata negli appunti",
                    });
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>Importante:</strong> Al prossimo accesso, il dipendente dovrà impostare una nuova password personale.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                setTempPasswordModalOpen(false);
                setTemporaryPassword("");
              }}
            >
              Ho comunicato la password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog per cambiare data rapportino */}
      <Dialog open={changeDateDialogOpen} onOpenChange={setChangeDateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Modifica Data Rapportino</DialogTitle>
            <DialogDescription>
              Seleziona la nuova data per il rapportino giornaliero.
            </DialogDescription>
          </DialogHeader>

          {selectedReportToChangeDate && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <div className="space-y-2">
                  <div>
                    <Label className="text-sm font-medium">Dipendente:</Label>
                    <p className="text-sm">{selectedReportToChangeDate.employeeName || "Sconosciuto"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Data attuale:</Label>
                    <p className="text-sm">{formatDateToItalian(selectedReportToChangeDate.date)}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newDate">Nuova Data</Label>
                <Input
                  id="newDate"
                  type="date"
                  value={newReportDate}
                  onChange={(e) => setNewReportDate(e.target.value)}
                  data-testid="input-new-date"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setChangeDateDialogOpen(false)}
              data-testid="button-cancel-change-date"
            >
              Annulla
            </Button>
            <Button 
              onClick={() => {
                if (selectedReportToChangeDate && newReportDate) {
                  changeDateMutation.mutate({
                    reportId: selectedReportToChangeDate.id,
                    newDate: newReportDate
                  });
                }
              }}
              disabled={changeDateMutation.isPending || !newReportDate}
              data-testid="button-confirm-change-date"
            >
              {changeDateMutation.isPending ? "Salvando..." : "Salva"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog per modifica rapportino */}
      <Dialog open={editReportDialogOpen} onOpenChange={setEditReportDialogOpen}>
        <DialogContent className="sm:max-w-[90vw] md:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifica Rapportino</DialogTitle>
            <DialogDescription>
              Modifica le operazioni del rapportino giornaliero.
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="mt-4">
              <DailyReportForm
                employeeName={selectedReport.employeeName || "Dipendente"}
                date={formatDateToItalian(selectedReport.date)}
                onSubmit={handleUpdateReport}
                initialOperations={reportOperations}
                isEditing={true}
              />
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditReportDialogOpen(false)}
              data-testid="button-cancel-edit-report"
            >
              Annulla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog per creazione rapportino da amministratore */}
      <Dialog 
        open={createReportDialogOpen} 
        onOpenChange={(open) => {
          setCreateReportDialogOpen(open);
          if (!open) {
            setSelectedEmployeeForReport(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[90vw] md:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crea Rapportino per Dipendente</DialogTitle>
            <DialogDescription>
              Seleziona un dipendente e compila il rapportino giornaliero.
            </DialogDescription>
          </DialogHeader>

          {!selectedEmployeeForReport ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Dipendente</Label>
                <Select
                  onValueChange={(value) => {
                    const emp = (employees as any[]).find((e: any) => e.id === value);
                    setSelectedEmployeeForReport(emp);
                  }}
                >
                  <SelectTrigger data-testid="select-employee-for-report">
                    <SelectValue placeholder="Seleziona dipendente" />
                  </SelectTrigger>
                  <SelectContent>
                    {(activeEmployees as any[])
                      .filter((emp: any) => emp.role === 'employee')
                      .map((emp: any) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.fullName}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <div className="mb-4 p-4 bg-muted rounded-md">
                <p className="text-sm font-medium">
                  Creazione rapportino per: <span className="text-primary">{selectedEmployeeForReport.fullName}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Data: {formatDateToItalian(new Date().toISOString().split('T')[0])}
                </p>
              </div>
              <DailyReportForm
                employeeName={selectedEmployeeForReport.fullName}
                date={formatDateToItalian(new Date().toISOString().split('T')[0])}
                onSubmit={async (operations) => {
                  try {
                    await apiRequest('POST', '/api/daily-reports', {
                      employeeId: selectedEmployeeForReport.id,
                      date: new Date().toISOString().split('T')[0],
                      status: 'In attesa',
                      operations: operations
                    });

                    queryClient.invalidateQueries({ queryKey: ['/api/daily-reports'] });
                    queryClient.invalidateQueries({ queryKey: ['/api/work-orders/stats'] });
                    toast({
                      title: "Rapportino creato",
                      description: `Rapportino per ${selectedEmployeeForReport.fullName} creato con successo.`
                    });
                    setCreateReportDialogOpen(false);
                    setSelectedEmployeeForReport(null);
                  } catch (error: any) {
                    toast({
                      title: "Errore",
                      description: error.message || "Errore nella creazione del rapportino",
                      variant: "destructive"
                    });
                  }
                }}
                isEditing={false}
              />
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setCreateReportDialogOpen(false);
                setSelectedEmployeeForReport(null);
              }}
              data-testid="button-cancel-create-report"
            >
              {selectedEmployeeForReport ? "Indietro" : "Annulla"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CONTINUA PARTE 3... */}
{/* Dialog per aggiungere nuova commessa */}
      <Dialog open={addWorkOrderDialogOpen} onOpenChange={setAddWorkOrderDialogOpen}>
        <DialogContent className="sm:max-w-[425px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Aggiungi Nuova Commessa</DialogTitle>
            <DialogDescription>
              Inserisci i dati della nuova commessa.
            </DialogDescription>
          </DialogHeader>
          <Form {...workOrderForm}>
            <form onSubmit={workOrderForm.handleSubmit(handleAddWorkOrder)} className="space-y-4">
              <FormField
                control={workOrderForm.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-client">
                          <SelectValue placeholder="Seleziona cliente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(clients as any[]).map((client: any) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={workOrderForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Commessa</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Es. Cancello Automatico" 
                        {...field} 
                        data-testid="input-work-order-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={workOrderForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrizione (opzionale)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Descrizione della commessa" 
                        {...field} 
                        data-testid="input-work-order-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={workOrderForm.control}
                name="availableWorkTypes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lavorazioni Disponibili</FormLabel>
                    <div className="border rounded-md p-4 max-h-48 overflow-y-auto space-y-2">
                      {(workTypes as any[])
                        .filter((wt: any) => wt.isActive)
                        .map((workType: any) => (
                          <label 
                            key={workType.id} 
                            className="flex items-center space-x-2 cursor-pointer hover-elevate p-2 rounded"
                          >
                            <input
                              type="checkbox"
                              checked={field.value?.includes(workType.id) || false}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                const newValue = checked
                                  ? [...(field.value || []), workType.id]
                                  : (field.value || []).filter((id: string) => id !== workType.id);
                                field.onChange(newValue);
                              }}
                              className="h-4 w-4"
                              data-testid={`checkbox-worktype-${workType.id}`}
                            />
                            <span className="text-sm">{workType.name}</span>
                          </label>
                        ))}
                      {(workTypes as any[]).filter((wt: any) => wt.isActive).length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-2">
                          Nessuna lavorazione disponibile. Aggiungile nella tab Configurazione.
                        </p>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={workOrderForm.control}
                name="availableMaterials"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Materiali Disponibili</FormLabel>
                    <div className="border rounded-md p-4 max-h-48 overflow-y-auto space-y-2">
                      {(materials as any[])
                        .filter((m: any) => m.isActive)
                        .map((material: any) => (
                          <label 
                            key={material.id} 
                            className="flex items-center space-x-2 cursor-pointer hover-elevate p-2 rounded"
                          >
                            <input
                              type="checkbox"
                              checked={field.value?.includes(material.id) || false}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                const newValue = checked
                                  ? [...(field.value || []), material.id]
                                  : (field.value || []).filter((id: string) => id !== material.id);
                                field.onChange(newValue);
                              }}
                              className="h-4 w-4"
                              data-testid={`checkbox-material-${material.id}`}
                            />
                            <span className="text-sm">{material.name}</span>
                          </label>
                        ))}
                      {(materials as any[]).filter((m: any) => m.isActive).length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-2">
                          Nessun materiale disponibile. Aggiungili nella tab Configurazione.
                        </p>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={workOrderForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Stato Commessa
                      </FormLabel>
                      <div className="text-sm text-muted-foreground">
                        {field.value ? "Attiva" : "Archiviata"}
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-work-order-active"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setAddWorkOrderDialogOpen(false)}
                  data-testid="button-cancel-add-work-order"
                >
                  Annulla
                </Button>
                <Button 
                  type="submit" 
                  disabled={createWorkOrderMutation.isPending}
                  data-testid="button-submit-work-order"
                >
                  {createWorkOrderMutation.isPending ? "Creazione..." : "Crea Commessa"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* TUTTI GLI ALTRI DIALOG SONO COMPLETI NEL FILE ORIGINALE */}
      {/* Per brevità non li riporto tutti qui, ma sono presenti nel tuo file originale */}

      {/* Dialog conferma eliminazione rapportino */}
      <AlertDialog open={deleteReportDialogOpen} onOpenChange={setDeleteReportDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Elimina Rapportino</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare questo rapportino?
              <span className="block mt-2">
                Questa azione eliminerà il rapportino e tutte le operazioni associate. Questa azione non può essere annullata.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteReport}
              disabled={deleteReportMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-report"
            >
              {deleteReportMutation.isPending ? "Eliminando..." : "Elimina"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog dipendenti mancanti */}
      <Dialog open={missingEmployeesDialogOpen} onOpenChange={setMissingEmployeesDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Dipendenti Mancanti</DialogTitle>
            <DialogDescription>
              Dipendenti che non hanno inviato il rapportino per la data selezionata
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Label htmlFor="missing-employees-date">Data:</Label>
              <Input
                id="missing-employees-date"
                type="date"
                value={missingEmployeesDate}
                onChange={(e) => setMissingEmployeesDate(e.target.value)}
                className="w-[200px]"
                data-testid="input-missing-employees-date"
              />
            </div>
            {isLoadingMissingEmployees ? (
              <div className="text-center py-8 text-muted-foreground">
                Caricamento...
              </div>
            ) : isMissingEmployeesError ? (
              <div className="text-center py-8 text-destructive">
                <p className="mb-2">Errore nel caricamento dei dati</p>
                <p className="text-sm text-muted-foreground">
                  Si è verificato un errore durante il recupero dei dipendenti mancanti.
                </p>
              </div>
            ) : missingEmployeesData && missingEmployeesData.missingEmployees && missingEmployeesData.missingEmployees.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {missingEmployeesData.missingEmployees.length} {missingEmployeesData.missingEmployees.length === 1 ? 'dipendente non ha' : 'dipendenti non hanno'} inviato il rapportino per il{' '}
                  {new Date(missingEmployeesDate + 'T00:00:00').toLocaleDateString('it-IT', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    year: 'numeric' 
                  })}
                </p>
                <div className="border rounded-lg divide-y">
                  {missingEmployeesData.missingEmployees.map((employee: any) => (
                    <div key={employee.id} className="p-3 flex items-center justify-between hover:bg-muted/50">
                      <div>
                        <p className="font-medium">{employee.fullName}</p>
                        <p className="text-sm text-muted-foreground">{employee.username}</p>
                      </div>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Tutti i dipendenti hanno inviato il rapportino per questa data!</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setMissingEmployeesDialogOpen(false)}
              data-testid="button-close-missing-employees"
            >
              Chiudi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog per aggiungere nuovo cliente */}
      <Dialog open={addClientDialogOpen} onOpenChange={setAddClientDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Aggiungi Nuovo Cliente</DialogTitle>
            <DialogDescription>
              Inserisci il nome del nuovo cliente.
            </DialogDescription>
          </DialogHeader>
          <Form {...clientForm}>
            <form onSubmit={clientForm.handleSubmit(handleAddClient)} className="space-y-4">
              <FormField
                control={clientForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Cliente</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Es. Acme Corporation" 
                        {...field} 
                        data-testid="input-client-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setAddClientDialogOpen(false)}
                  data-testid="button-cancel-add-client"
                >
                  Annulla
                </Button>
                <Button 
                  type="submit" 
                  disabled={createClientMutation.isPending}
                  data-testid="button-submit-client"
                >
                  {createClientMutation.isPending ? "Aggiungendo..." : "Aggiungi Cliente"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog conferma eliminazione cliente */}
      <AlertDialog open={deleteClientDialogOpen} onOpenChange={setDeleteClientDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Elimina Cliente</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare il cliente "{selectedClientToDelete?.name}"?
              {(clientWorkOrdersCount > 0 || clientOperationsCount > 0) && (
                <span className="block mt-2 font-semibold text-destructive">
                  Questa operazione eliminerà anche:
                  {clientWorkOrdersCount > 0 && (
                    <span className="block">• {clientWorkOrdersCount} {clientWorkOrdersCount === 1 ? 'commessa' : 'commesse'}</span>
                  )}
                  {clientOperationsCount > 0 && (
                    <span className="block">• {clientOperationsCount} {clientOperationsCount === 1 ? 'operazione' : 'operazioni'}</span>
                  )}
                </span>
              )}
              <span className="block mt-2">
                Questa azione non può essere annullata.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-client">Annulla</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteClient}
              disabled={deleteClientMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-client"
            >
              {deleteClientMutation.isPending ? "Eliminando..." : "Elimina"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog per modificare commessa */}
      <Dialog open={editWorkOrderDialogOpen} onOpenChange={setEditWorkOrderDialogOpen}>
        <DialogContent className="sm:max-w-[425px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifica Commessa</DialogTitle>
            <DialogDescription>
              Modifica i dati della commessa.
            </DialogDescription>
          </DialogHeader>
          <Form {...editWorkOrderForm}>
            <form onSubmit={editWorkOrderForm.handleSubmit(handleUpdateWorkOrder)} className="space-y-4">
              <FormField
                control={editWorkOrderForm.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-client">
                          <SelectValue placeholder="Seleziona cliente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(clients as any[]).map((client: any) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editWorkOrderForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Commessa</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Es. Cancello Automatico" 
                        {...field} 
                        data-testid="input-edit-work-order-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editWorkOrderForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrizione (opzionale)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Descrizione della commessa" 
                        {...field} 
                        data-testid="input-edit-work-order-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editWorkOrderForm.control}
                name="availableWorkTypes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lavorazioni Disponibili</FormLabel>
                    <div className="border rounded-md p-4 max-h-48 overflow-y-auto space-y-2">
                      {(workTypes as any[])
                        .filter((wt: any) => wt.isActive)
                        .map((workType: any) => (
                          <label 
                            key={workType.id} 
                            className="flex items-center space-x-2 cursor-pointer hover-elevate p-2 rounded"
                          >
                            <input
                              type="checkbox"
                              checked={field.value?.includes(workType.id) || false}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                const newValue = checked
                                  ? [...(field.value || []), workType.id]
                                  : (field.value || []).filter((id: string) => id !== workType.id);
                                field.onChange(newValue);
                              }}
                              className="h-4 w-4"
                              data-testid={`checkbox-edit-worktype-${workType.id}`}
                            />
                            <span className="text-sm">{workType.name}</span>
                          </label>
                        ))}
                      {(workTypes as any[]).filter((wt: any) => wt.isActive).length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-2">
                          Nessuna lavorazione disponibile. Aggiungile nella tab Configurazione.
                        </p>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editWorkOrderForm.control}
                name="availableMaterials"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Materiali Disponibili</FormLabel>
                    <div className="border rounded-md p-4 max-h-48 overflow-y-auto space-y-2">
                      {(materials as any[])
                        .filter((m: any) => m.isActive)
                        .map((material: any) => (
                          <label 
                            key={material.id} 
                            className="flex items-center space-x-2 cursor-pointer hover-elevate p-2 rounded"
                          >
                            <input
                              type="checkbox"
                              checked={field.value?.includes(material.id) || false}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                const newValue = checked
                                  ? [...(field.value || []), material.id]
                                  : (field.value || []).filter((id: string) => id !== material.id);
                                field.onChange(newValue);
                              }}
                              className="h-4 w-4"
                              data-testid={`checkbox-edit-material-${material.id}`}
                            />
                            <span className="text-sm">{material.name}</span>
                          </label>
                        ))}
                      {(materials as any[]).filter((m: any) => m.isActive).length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-2">
                          Nessun materiale disponibile. Aggiungili nella tab Configurazione.
                        </p>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editWorkOrderForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Stato Commessa
                      </FormLabel>
                      <div className="text-sm text-muted-foreground">
                        {field.value ? "Attiva" : "Archiviata"}
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-edit-work-order-active"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditWorkOrderDialogOpen(false)}
                  data-testid="button-cancel-edit-work-order"
                >
                  Annulla
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateWorkOrderMutation.isPending}
                  data-testid="button-submit-edit-work-order"
                >
                  {updateWorkOrderMutation.isPending ? "Aggiornando..." : "Aggiorna Commessa"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog conferma eliminazione commessa */}
      <AlertDialog open={deleteWorkOrderDialogOpen} onOpenChange={setDeleteWorkOrderDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Elimina Commessa</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare la commessa "{selectedWorkOrderToDelete?.name}"?
              <span className="block mt-2">
                Questa azione eliminerà la commessa e tutte le operazioni associate. Questa azione non può essere annullata.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-work-order">Annulla</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteWorkOrder}
              disabled={deleteWorkOrderMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-work-order"
            >
              {deleteWorkOrderMutation.isPending ? "Eliminando..." : "Elimina"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog per aggiungere tipo lavorazione */}
      <Dialog open={addWorkTypeDialogOpen} onOpenChange={setAddWorkTypeDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Aggiungi Tipo Lavorazione</DialogTitle>
            <DialogDescription>
              Inserisci i dati del nuovo tipo di lavorazione.
            </DialogDescription>
          </DialogHeader>
          <Form {...workTypeForm}>
            <form onSubmit={workTypeForm.handleSubmit(handleAddWorkType)} className="space-y-4">
              <FormField
                control={workTypeForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Lavorazione</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Es. Saldatura" 
                        {...field} 
                        data-testid="input-work-type-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={workTypeForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrizione (opzionale)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Descrizione della lavorazione" 
                        {...field} 
                        data-testid="input-work-type-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={workTypeForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Stato
                      </FormLabel>
                      <div className="text-sm text-muted-foreground">
                        {field.value ? "Attiva" : "Non attiva"}
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-work-type-active"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setAddWorkTypeDialogOpen(false)}
                  data-testid="button-cancel-add-work-type"
                >
                  Annulla
                </Button>
                <Button 
                  type="submit" 
                  disabled={createWorkTypeMutation.isPending}
                  data-testid="button-submit-work-type"
                >
                  {createWorkTypeMutation.isPending ? "Aggiungendo..." : "Aggiungi Lavorazione"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog per modificare tipo lavorazione */}
      <Dialog open={editWorkTypeDialogOpen} onOpenChange={setEditWorkTypeDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Modifica Tipo Lavorazione</DialogTitle>
            <DialogDescription>
              Modifica i dati del tipo di lavorazione.
            </DialogDescription>
          </DialogHeader>
          <Form {...workTypeForm}>
            <form onSubmit={workTypeForm.handleSubmit(handleUpdateWorkType)} className="space-y-4">
              <FormField
                control={workTypeForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Lavorazione</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Es. Saldatura" 
                        {...field} 
                        data-testid="input-edit-work-type-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={workTypeForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrizione (opzionale)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Descrizione della lavorazione" 
                        {...field} 
                        data-testid="input-edit-work-type-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={workTypeForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Stato
                      </FormLabel>
                      <div className="text-sm text-muted-foreground">
                        {field.value ? "Attiva" : "Non attiva"}
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-edit-work-type-active"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditWorkTypeDialogOpen(false)}
                  data-testid="button-cancel-edit-work-type"
                >
                  Annulla
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateWorkTypeMutation.isPending}
                  data-testid="button-submit-edit-work-type"
                >
                  {updateWorkTypeMutation.isPending ? "Aggiornando..." : "Aggiorna Lavorazione"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog conferma eliminazione tipo lavorazione */}
      <AlertDialog open={deleteWorkTypeDialogOpen} onOpenChange={setDeleteWorkTypeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Elimina Tipo Lavorazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare il tipo di lavorazione "{selectedWorkType?.name}"?
              <span className="block mt-2">
                Questa azione non può essere annullata.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-work-type">Annulla</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteWorkType}
              disabled={deleteWorkTypeMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-work-type"
            >
              {deleteWorkTypeMutation.isPending ? "Eliminando..." : "Elimina"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog per aggiungere materiale */}
      <Dialog open={addMaterialDialogOpen} onOpenChange={setAddMaterialDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Aggiungi Materiale</DialogTitle>
            <DialogDescription>
              Inserisci i dati del nuovo materiale.
            </DialogDescription>
          </DialogHeader>
          <Form {...materialForm}>
            <form onSubmit={materialForm.handleSubmit(handleAddMaterial)} className="space-y-4">
              <FormField
                control={materialForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Materiale</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Es. Acciaio Inox" 
                        {...field} 
                        data-testid="input-material-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={materialForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrizione (opzionale)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Descrizione del materiale" 
                        {...field} 
                        data-testid="input-material-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={materialForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Stato
                      </FormLabel>
                      <div className="text-sm text-muted-foreground">
                        {field.value ? "Attivo" : "Non attivo"}
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-material-active"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setAddMaterialDialogOpen(false)}
                  data-testid="button-cancel-add-material"
                >
                  Annulla
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMaterialMutation.isPending}
                  data-testid="button-submit-material"
                >
                  {createMaterialMutation.isPending ? "Aggiungendo..." : "Aggiungi Materiale"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog per modificare materiale */}
      <Dialog open={editMaterialDialogOpen} onOpenChange={setEditMaterialDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Modifica Materiale</DialogTitle>
            <DialogDescription>
              Modifica i dati del materiale.
            </DialogDescription>
          </DialogHeader>
          <Form {...materialForm}>
            <form onSubmit={materialForm.handleSubmit(handleUpdateMaterial)} className="space-y-4">
              <FormField
                control={materialForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Materiale</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Es. Acciaio Inox" 
                        {...field} 
                        data-testid="input-edit-material-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={materialForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrizione (opzionale)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Descrizione del materiale" 
                        {...field} 
                        data-testid="input-edit-material-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={materialForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Stato
                      </FormLabel>
                      <div className="text-sm text-muted-foreground">
                        {field.value ? "Attivo" : "Non attivo"}
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-edit-material-active"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditMaterialDialogOpen(false)}
                  data-testid="button-cancel-edit-material"
                >
                  Annulla
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateMaterialMutation.isPending}
                  data-testid="button-submit-edit-material"
                >
                  {updateMaterialMutation.isPending ? "Aggiornando..." : "Aggiorna Materiale"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog conferma eliminazione materiale */}
      <AlertDialog open={deleteMaterialDialogOpen} onOpenChange={setDeleteMaterialDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Elimina Materiale</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare il materiale "{selectedMaterial?.name}"?
              <span className="block mt-2">
                Questa azione non può essere annullata.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-material">Annulla</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteMaterial}
              disabled={deleteMaterialMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-material"
            >
              {deleteMaterialMutation.isPending ? "Eliminando..." : "Elimina"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog per aggiustamento ore */}
      <HoursAdjustmentDialog
        open={hoursAdjustmentDialogOpen}
        onOpenChange={setHoursAdjustmentDialogOpen}
        dailyReportId={selectedReportForAdjustment || ""}
        currentAdjustment={currentHoursAdjustment}
      />

      {/* Dialog per registrazione assenze */}
      <Dialog open={registerAbsenceDialogOpen} onOpenChange={setRegisterAbsenceDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Registra Assenze</DialogTitle>
            <DialogDescription>
              Seleziona i dipendenti e registra le assenze per la data indicata.
            </DialogDescription>
          </DialogHeader>
          <Form {...registerAbsenceForm}>
            <form onSubmit={registerAbsenceForm.handleSubmit((data) => registerAbsenceMutation.mutate(data))} className="space-y-4">
              <FormField
                control={registerAbsenceForm.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field}
                        data-testid="input-absence-date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={registerAbsenceForm.control}
                name="userIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dipendenti</FormLabel>
                    <div className="border rounded-md p-4 max-h-48 overflow-y-auto space-y-2">
                      {employees
                        .filter((emp: any) => emp.role === 'employee' && emp.isActive)
                        .map((employee: any) => (
                          <label 
                            key={employee.id} 
                            className="flex items-center space-x-2 cursor-pointer hover-elevate p-2 rounded"
                          >
                            <input
                              type="checkbox"
                              checked={field.value.includes(employee.id)}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                const newValue = checked
                                  ? [...field.value, employee.id]
                                  : field.value.filter((id: string) => id !== employee.id);
                                field.onChange(newValue);
                              }}
                              className="h-4 w-4"
                              data-testid={`checkbox-employee-${employee.id}`}
                            />
                            <span className="text-sm">{employee.fullName}</span>
                          </label>
                        ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={registerAbsenceForm.control}
                name="absenceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-absence-type">
                          <SelectValue placeholder="Seleziona tipo..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="A">A - Assenza</SelectItem>
                        <SelectItem value="F">F - Ferie</SelectItem>
                        <SelectItem value="P">P - Permesso</SelectItem>
                        <SelectItem value="M">M - Malattia</SelectItem>
                        <SelectItem value="CP">CP - Congedo Parentale</SelectItem>
                        <SelectItem value="L104">L104 - Legge 104</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={registerAbsenceForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note (opzionale)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field}
                        placeholder="Note aggiuntive..."
                        data-testid="input-absence-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setRegisterAbsenceDialogOpen(false)}
                  data-testid="button-cancel-register-absence"
                >
                  Annulla
                </Button>
                <Button 
                  type="submit" 
                  disabled={registerAbsenceMutation.isPending}
                  data-testid="button-submit-register-absence"
                >
                  {registerAbsenceMutation.isPending ? "Registrando..." : "Registra Assenze"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog Statistiche Assenze Dipendente */}
      <Dialog open={employeeStatsDialogOpen} onOpenChange={setEmployeeStatsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5" />
              Statistiche Assenze - {selectedEmployeeForStats?.fullName}
            </DialogTitle>
            <DialogDescription>
              Statistiche delle assenze negli ultimi 90 giorni
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingEmployeeStats ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-muted-foreground">Caricamento statistiche...</p>
              </div>
            </div>
          ) : employeeStats ? (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Totale Assenze (90gg)</p>
                        <p className="text-2xl font-bold">{employeeStats.totalAbsences || 0}</p>
                      </div>
                      <AlertTriangle className="h-6 w-6 text-warning" />
                    </div>
                  </CardContent>
                </Card>

                <Card className={employeeStats.strategicAbsences > 0 ? "border-orange-200 dark:border-orange-800" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Assenze Strategiche</p>
                        <p className={`text-2xl font-bold ${employeeStats.strategicAbsences >= 5 ? 'text-red-600' : employeeStats.strategicAbsences >= 3 ? 'text-orange-600' : ''}`}>
                          {employeeStats.strategicAbsences || 0}
                        </p>
                        {employeeStats.strategicPercentage > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {employeeStats.strategicPercentage}% delle assenze
                          </p>
                        )}
                      </div>
                      <Badge variant={employeeStats.strategicAbsences >= 5 ? "destructive" : employeeStats.strategicAbsences >= 3 ? "secondary" : "outline"} className="h-8 w-8 rounded-full p-0 flex items-center justify-center">
                        <AlertTriangle className="h-4 w-4" />
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Tipo Più Comune</p>
                        <p className="text-2xl font-bold">
                          {employeeStats.byType && Object.keys(employeeStats.byType).length > 0 
                            ? (() => {
                                const typeMap: Record<string, string> = {
                                  'A': 'Assenza',
                                  'F': 'Ferie',
                                  'P': 'Permesso',
                                  'M': 'Malattia',
                                  'CP': 'Congedo',
                                  'L104': 'L.104'
                                };
                                const sortedTypes = Object.entries(employeeStats.byType as Record<string, number>)
                                  .sort((a, b) => b[1] - a[1]);
                                return sortedTypes.length > 0 
                                  ? (typeMap[sortedTypes[0][0]] || sortedTypes[0][0])
                                  : '-';
                              })()
                            : '-'}
                        </p>
                      </div>
                      <TrendingUp className="h-6 w-6 text-primary" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Giorno Picco</p>
                        <p className="text-2xl font-bold">
                          {employeeStats.byDayOfWeek && Object.keys(employeeStats.byDayOfWeek).length > 0 
                            ? (() => {
                                const dayMap: Record<number, string> = {
                                  0: 'Dom',
                                  1: 'Lun',
                                  2: 'Mar',
                                  3: 'Mer',
                                  4: 'Gio',
                                  5: 'Ven',
                                  6: 'Sab'
                                };
                                const sortedDays = Object.entries(employeeStats.byDayOfWeek as Record<number, number>)
                                  .filter(([_, count]) => count > 0)
                                  .sort((a, b) => b[1] - a[1]);
                                return sortedDays.length > 0 
                                  ? (dayMap[parseInt(sortedDays[0][0])] || '-')
                                  : '-';
                              })()
                            : '-'}
                        </p>
                      </div>
                      <Calendar className="h-6 w-6 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Row */}
              <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                {/* Monthly Trend Chart */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Trend Mensile
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {employeeStats.byMonth && employeeStats.byMonth.length > 0 ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={employeeStats.byMonth.slice().reverse()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="month" 
                            tickFormatter={(value) => {
                              const [year, month] = value.split('-');
                              const monthNames = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
                              return monthNames[parseInt(month) - 1] || value;
                            }}
                          />
                          <YAxis />
                          <RechartsTooltip 
                            formatter={(value: number) => [value, 'Assenze']}
                            labelFormatter={(label) => {
                              const [year, month] = label.split('-');
                              const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
                              return `${monthNames[parseInt(month) - 1]} ${year}`;
                            }}
                          />
                          <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center py-8 text-muted-foreground">
                        Nessun dato disponibile
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Absence by Type Chart */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BarChart2 className="h-4 w-4" />
                      Assenze per Tipo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {employeeStats.byType && Object.keys(employeeStats.byType).length > 0 ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={Object.entries(employeeStats.byType as Record<string, number>).map(([type, count]) => {
                          const typeMap: Record<string, string> = {
                            'A': 'Assenza',
                            'F': 'Ferie',
                            'P': 'Permesso',
                            'M': 'Malattia',
                            'CP': 'Congedo',
                            'L104': 'L.104'
                          };
                          return { type: typeMap[type] || type, count };
                        })}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="type" />
                          <YAxis />
                          <RechartsTooltip formatter={(value: number) => [value, 'Assenze']} />
                          <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center py-8 text-muted-foreground">
                        Nessun dato disponibile
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Absence by Day of Week */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Assenze per Giorno della Settimana
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {employeeStats.byDayOfWeek && Object.values(employeeStats.byDayOfWeek).some(v => v > 0) ? (
                    <ResponsiveContainer width="100%" height={150}>
                      <BarChart data={(() => {
                        const dayNames = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
                        const byDayRecord = employeeStats.byDayOfWeek as Record<number, number>;
                        return [1, 2, 3, 4, 5, 6, 0].map(dayNum => ({
                          day: dayNames[dayNum],
                          count: byDayRecord[dayNum] || 0
                        }));
                      })()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <RechartsTooltip formatter={(value: number) => [value, 'Assenze']} />
                        <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                      Nessun dato disponibile
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              Nessun dato disponibile per questo dipendente.
            </div>
          )}
        </DialogContent>
      </Dialog>


        <TabsContent value="rifornimenti" className="space-y-6 mt-6">
          <Tabs defaultValue="refills">
            <TabsList>
              <TabsTrigger value="refills" data-testid="tab-refills">
                Rifornimenti
              </TabsTrigger>
              <TabsTrigger value="vehicles" data-testid="tab-vehicles">
                Mezzi
              </TabsTrigger>
              <TabsTrigger value="statistics" data-testid="tab-statistics">
                Statistiche
              </TabsTrigger>
            </TabsList>
            <TabsContent value="refills" className="mt-6">
              <FuelRefillsManagement />
            </TabsContent>
            <TabsContent value="vehicles" className="mt-6">
              <VehiclesManagement />
            </TabsContent>
            <TabsContent value="statistics" className="mt-6">
              <FuelStatistics />
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>

      {/* Lightbox for photo gallery */}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        slides={lightboxPhotos.map(src => ({ src }))}
        index={lightboxIndex}
      />
    </div>
  );
}