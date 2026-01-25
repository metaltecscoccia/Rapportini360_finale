import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Building2,
  Plus,
  UserPlus,
  Power,
  PowerOff,
  Loader2,
  Users,
  Edit,
  Trash2,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Crown,
  ChevronDown,
  Clock,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
} from "lucide-react";
import { formatDateToItalian } from "@/lib/dateUtils";

type Organization = {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  stripeCustomerId?: string | null;
  subscriptionStatus: 'trial' | 'active' | 'past_due' | 'canceled' | 'incomplete' | 'paused';
  subscriptionPlan: 'free' | 'premium_monthly' | 'premium_yearly';
  subscriptionId?: string | null;
  trialEndDate?: string | null;
  billingEmail?: string | null;
  subscriptionCurrentPeriodEnd?: string | null;
  maxEmployees: number;
};

type OrganizationStats = {
  totalOrganizations: number;
  trialOrganizations: number;
  activeOrganizations: number;
  canceledOrganizations: number;
  pastDueOrganizations: number;
  estimatedMRR: number;
  estimatedARR: number;
};

type Admin = {
  id: string;
  username: string;
  fullName: string;
  role: string;
  isActive: boolean;
};

type PendingSignup = {
  id: string;
  name: string;
  billingEmail: string | null;
  vatNumber: string | null;
  phone: string | null;
  createdAt: string;
  adminFullName: string;
  adminUsername: string;
};

export default function SuperAdminDashboard() {
  const { toast } = useToast();
  const [createOrgOpen, setCreateOrgOpen] = useState(false);
  const [createAdminOpen, setCreateAdminOpen] = useState(false);
  const [manageAdminsOpen, setManageAdminsOpen] = useState(false);
  const [editAdminOpen, setEditAdminOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [newOrgName, setNewOrgName] = useState("");
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState(false);
  const [newOrgAdvanced, setNewOrgAdvanced] = useState({
    subscriptionPlan: 'free' as 'free' | 'premium_monthly' | 'premium_yearly',
    maxEmployees: 5,
    trialEndDate: '',
    billingEmail: '',
  });
  const [newAdminUsername, setNewAdminUsername] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newAdminFullName, setNewAdminFullName] = useState("");
  const [editAdminUsername, setEditAdminUsername] = useState("");
  const [editAdminPassword, setEditAdminPassword] = useState("");
  const [editAdminFullName, setEditAdminFullName] = useState("");
  const [deleteAdminOpen, setDeleteAdminOpen] = useState(false);
  const [deleteAdminConfirmOpen, setDeleteAdminConfirmOpen] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<Admin | null>(null);

  // State per eliminazione organizzazione
  const [deleteOrgOpen, setDeleteOrgOpen] = useState(false);
  const [deleteOrgConfirmOpen, setDeleteOrgConfirmOpen] = useState(false);
  const [orgToDelete, setOrgToDelete] = useState<Organization | null>(null);

  const { data: organizations, isLoading } = useQuery<Organization[]>({
    queryKey: ["/api/superadmin/organizations"],
  });

  const { data: pendingSignups, isLoading: isLoadingPending } = useQuery<PendingSignup[]>({
    queryKey: ["/api/superadmin/pending-signups"],
  });

  const { data: admins, isLoading: isLoadingAdmins } = useQuery<Admin[]>({
    queryKey: ["/api/superadmin/organizations", selectedOrg?.id, "admins"],
    queryFn: async () => {
      if (!selectedOrg) return [];
      const res = await apiRequest("GET", `/api/superadmin/organizations/${selectedOrg.id}/admins`);
      return res.json();
    },
    enabled: !!selectedOrg && manageAdminsOpen,
  });

  const createOrgMutation = useMutation({
    mutationFn: async (data: { name: string; advanced?: any }) => {
      const payload: any = { name: data.name };

      // Add advanced settings if provided
      if (data.advanced) {
        if (data.advanced.subscriptionPlan !== 'free') {
          payload.subscriptionPlan = data.advanced.subscriptionPlan;
        }
        if (data.advanced.maxEmployees !== 5) {
          payload.maxEmployees = data.advanced.maxEmployees;
        }
        if (data.advanced.trialEndDate) {
          payload.trialEndDate = new Date(data.advanced.trialEndDate).toISOString();
        }
        if (data.advanced.billingEmail) {
          payload.billingEmail = data.advanced.billingEmail;
        }
      }

      const response = await apiRequest("POST", "/api/superadmin/organizations", payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/organizations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/organizations/stats"] });
      setCreateOrgOpen(false);
      setNewOrgName("");
      setAdvancedSettingsOpen(false);
      setNewOrgAdvanced({
        subscriptionPlan: 'free',
        maxEmployees: 5,
        trialEndDate: '',
        billingEmail: '',
      });
      toast({
        title: "Organizzazione creata",
        description: "L'organizzazione è stata creata con successo.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile creare l'organizzazione.",
        variant: "destructive",
      });
    },
  });

  const toggleOrgStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await apiRequest("PUT", `/api/superadmin/organizations/${id}/status`, { isActive });
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/organizations"] });
      toast({
        title: variables.isActive ? "Organizzazione attivata" : "Organizzazione disattivata",
        description: `L'organizzazione è stata ${variables.isActive ? "attivata" : "disattivata"} con successo.`,
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile modificare lo stato dell'organizzazione.",
        variant: "destructive",
      });
    },
  });

  const approveSignupMutation = useMutation({
    mutationFn: async (orgId: string) => {
      const response = await apiRequest("POST", `/api/superadmin/approve-signup/${orgId}`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/pending-signups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/organizations"] });
      toast({
        title: "Richiesta approvata",
        description: data.message || "L'organizzazione è stata attivata e le credenziali inviate via email.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile approvare la richiesta.",
        variant: "destructive",
      });
    },
  });

  const rejectSignupMutation = useMutation({
    mutationFn: async ({ orgId, reason }: { orgId: string; reason?: string }) => {
      const response = await apiRequest("POST", `/api/superadmin/reject-signup/${orgId}`, { reason });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/pending-signups"] });
      toast({
        title: "Richiesta rifiutata",
        description: data.message || "La richiesta è stata rifiutata e rimossa.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile rifiutare la richiesta.",
        variant: "destructive",
      });
    },
  });

  const createAdminMutation = useMutation({
    mutationFn: async ({ orgId, username, password, fullName }: { orgId: string; username: string; password: string; fullName: string }) => {
      const response = await apiRequest("POST", `/api/superadmin/organizations/${orgId}/admin`, { username, password, fullName });
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/organizations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/organizations", variables.orgId, "admins"] });
      setCreateAdminOpen(false);
      setNewAdminUsername("");
      setNewAdminPassword("");
      setNewAdminFullName("");
      toast({
        title: "Admin creato",
        description: "L'amministratore è stato creato con successo.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile creare l'amministratore.",
        variant: "destructive",
      });
    },
  });

  const updateAdminMutation = useMutation({
    mutationFn: async ({ orgId, adminId, username, password, fullName }: { orgId: string; adminId: string; username: string; password?: string; fullName: string }) => {
      const data: { username: string; fullName: string; password?: string } = { username, fullName };
      if (password) data.password = password;
      const response = await apiRequest("PUT", `/api/superadmin/organizations/${orgId}/admin/${adminId}`, data);
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/organizations", variables.orgId, "admins"] });
      setEditAdminOpen(false);
      setSelectedAdmin(null);
      setEditAdminUsername("");
      setEditAdminPassword("");
      setEditAdminFullName("");
      toast({
        title: "Admin aggiornato",
        description: "L'amministratore è stato modificato con successo.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile modificare l'amministratore.",
        variant: "destructive",
      });
    },
  });

  const deleteAdminMutation = useMutation({
    mutationFn: async ({ orgId, adminId }: { orgId: string; adminId: string }) => {
      const response = await apiRequest("DELETE", `/api/superadmin/organizations/${orgId}/admin/${adminId}`);
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/organizations", variables.orgId, "admins"] });
      setDeleteAdminOpen(false);
      setDeleteAdminConfirmOpen(false);
      setAdminToDelete(null);
      toast({
        title: "Admin eliminato",
        description: "L'amministratore è stato eliminato definitivamente.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile eliminare l'amministratore.",
        variant: "destructive",
      });
    },
  });

  const deleteOrgMutation = useMutation({
    mutationFn: async (orgId: string) => {
      const response = await apiRequest("DELETE", `/api/superadmin/organizations/${orgId}`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/organizations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/organizations/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/pending-signups"] });
      setDeleteOrgOpen(false);
      setDeleteOrgConfirmOpen(false);
      setOrgToDelete(null);
      toast({
        title: "Organizzazione eliminata",
        description: data.message || "L'organizzazione è stata eliminata con tutti i dati correlati.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile eliminare l'organizzazione.",
        variant: "destructive",
      });
    },
  });

  const handleCreateOrg = () => {
    if (!newOrgName.trim()) {
      toast({
        title: "Errore",
        description: "Inserisci un nome per l'organizzazione.",
        variant: "destructive",
      });
      return;
    }
    createOrgMutation.mutate({
      name: newOrgName.trim(),
      advanced: advancedSettingsOpen ? newOrgAdvanced : undefined,
    });
  };

  const handleCreateAdmin = () => {
    if (!newAdminUsername.trim() || !newAdminPassword.trim() || !newAdminFullName.trim()) {
      toast({
        title: "Errore",
        description: "Compila tutti i campi.",
        variant: "destructive",
      });
      return;
    }
    if (!selectedOrg) return;
    
    createAdminMutation.mutate({
      orgId: selectedOrg.id,
      username: newAdminUsername.trim(),
      password: newAdminPassword.trim(),
      fullName: newAdminFullName.trim(),
    });
  };

  const handleUpdateAdmin = () => {
    if (!editAdminUsername.trim() || !editAdminFullName.trim()) {
      toast({
        title: "Errore",
        description: "Username e Nome completo sono obbligatori.",
        variant: "destructive",
      });
      return;
    }
    if (!selectedOrg || !selectedAdmin) return;
    
    updateAdminMutation.mutate({
      orgId: selectedOrg.id,
      adminId: selectedAdmin.id,
      username: editAdminUsername.trim(),
      password: editAdminPassword.trim() || undefined,
      fullName: editAdminFullName.trim(),
    });
  };

  const openCreateAdminDialog = (org: Organization) => {
    setSelectedOrg(org);
    setNewAdminUsername("");
    setNewAdminPassword("");
    setNewAdminFullName("");
    setCreateAdminOpen(true);
  };

  const openManageAdminsDialog = (org: Organization) => {
    setSelectedOrg(org);
    setManageAdminsOpen(true);
  };

  const openEditAdminDialog = (admin: Admin) => {
    setSelectedAdmin(admin);
    setEditAdminUsername(admin.username);
    setEditAdminFullName(admin.fullName);
    setEditAdminPassword("");
    setEditAdminOpen(true);
  };

  const openDeleteAdminDialog = (admin: Admin) => {
    setAdminToDelete(admin);
    setDeleteAdminOpen(true);
  };

  const handleFirstDeleteConfirm = () => {
    setDeleteAdminOpen(false);
    setDeleteAdminConfirmOpen(true);
  };

  const handleFinalDelete = () => {
    if (!selectedOrg || !adminToDelete) return;
    deleteAdminMutation.mutate({
      orgId: selectedOrg.id,
      adminId: adminToDelete.id,
    });
  };

  const cancelDelete = () => {
    setDeleteAdminOpen(false);
    setDeleteAdminConfirmOpen(false);
    setAdminToDelete(null);
  };

  // Handler per eliminazione organizzazione
  const openDeleteOrgDialog = (org: Organization) => {
    setOrgToDelete(org);
    setDeleteOrgOpen(true);
  };

  const handleFirstDeleteOrgConfirm = () => {
    setDeleteOrgOpen(false);
    setDeleteOrgConfirmOpen(true);
  };

  const handleFinalDeleteOrg = () => {
    if (!orgToDelete) return;
    deleteOrgMutation.mutate(orgToDelete.id);
  };

  const cancelDeleteOrg = () => {
    setDeleteOrgOpen(false);
    setDeleteOrgConfirmOpen(false);
    setOrgToDelete(null);
  };

  return (
    <div className="p-6 space-y-6">
      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending" className="relative">
            <Clock className="h-4 w-4 mr-2" />
            Richieste
            {pendingSignups && pendingSignups.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 min-w-5 px-1">
                {pendingSignups.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="organizations">
            <Building2 className="h-4 w-4 mr-2" />
            Organizzazioni
          </TabsTrigger>
          <TabsTrigger value="saas">
            <DollarSign className="h-4 w-4 mr-2" />
            Vista SaaS
          </TabsTrigger>
        </TabsList>

        {/* Tab Richieste Pending */}
        <TabsContent value="pending" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                Richieste di Attivazione
              </h2>
              <p className="text-muted-foreground">
                Approva o rifiuta le richieste di registrazione in attesa
              </p>
            </div>
          </div>

          {isLoadingPending ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : pendingSignups && pendingSignups.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Azienda</TableHead>
                      <TableHead>P.IVA</TableHead>
                      <TableHead>Contatti</TableHead>
                      <TableHead>Admin</TableHead>
                      <TableHead>Data Richiesta</TableHead>
                      <TableHead className="text-right">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingSignups.map((signup) => (
                      <TableRow key={signup.id}>
                        <TableCell className="font-medium">{signup.name}</TableCell>
                        <TableCell className="font-mono text-sm">{signup.vatNumber || '-'}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 text-sm">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {signup.billingEmail || '-'}
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {signup.phone || '-'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{signup.adminFullName}</div>
                            <div className="text-muted-foreground">@{signup.adminUsername}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDateToItalian(signup.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => approveSignupMutation.mutate(signup.id)}
                              disabled={approveSignupMutation.isPending}
                            >
                              {approveSignupMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approva
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => rejectSignupMutation.mutate({ orgId: signup.id })}
                              disabled={rejectSignupMutation.isPending}
                            >
                              {rejectSignupMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Rifiuta
                                </>
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-1">Nessuna richiesta in attesa</h3>
                  <p className="text-sm">Le nuove richieste di registrazione appariranno qui.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="organizations" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold" data-testid="text-superadmin-title">
                Gestione Organizzazioni
              </h2>
              <p className="text-muted-foreground">
                Crea e gestisci le organizzazioni clienti
              </p>
            </div>

        <Dialog open={createOrgOpen} onOpenChange={setCreateOrgOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-org">
              <Plus className="h-4 w-4 mr-2" />
              Nuova Organizzazione
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crea Nuova Organizzazione</DialogTitle>
              <DialogDescription>
                Inserisci il nome dell'organizzazione e opzionalmente configura le impostazioni SaaS avanzate.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="org-name">Nome Organizzazione</Label>
                <Input
                  id="org-name"
                  placeholder="Es. Azienda SRL"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  data-testid="input-org-name"
                />
              </div>

              {/* Advanced Settings Collapsible */}
              <Collapsible
                open={advancedSettingsOpen}
                onOpenChange={setAdvancedSettingsOpen}
              >
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    Impostazioni SaaS Avanzate
                    <ChevronDown className={`h-4 w-4 transition-transform ${advancedSettingsOpen ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Piano Iniziale */}
                    <div className="space-y-2">
                      <Label>Piano Iniziale</Label>
                      <Select
                        value={newOrgAdvanced.subscriptionPlan}
                        onValueChange={(value: any) => setNewOrgAdvanced(prev => ({ ...prev, subscriptionPlan: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free (Trial Default)</SelectItem>
                          <SelectItem value="premium_monthly">Premium Mensile</SelectItem>
                          <SelectItem value="premium_yearly">Premium Annuale</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Max Dipendenti */}
                    <div className="space-y-2">
                      <Label htmlFor="new-max-employees">Max Dipendenti</Label>
                      <Input
                        id="new-max-employees"
                        type="number"
                        min="1"
                        value={newOrgAdvanced.maxEmployees}
                        onChange={(e) => setNewOrgAdvanced(prev => ({ ...prev, maxEmployees: parseInt(e.target.value) || 5 }))}
                      />
                      <p className="text-xs text-muted-foreground">Default: 5, 999 = Illimitati</p>
                    </div>
                  </div>

                  {/* Trial End Date */}
                  <div className="space-y-2">
                    <Label htmlFor="new-trial-end">Data Fine Trial (Opzionale)</Label>
                    <Input
                      id="new-trial-end"
                      type="date"
                      value={newOrgAdvanced.trialEndDate}
                      onChange={(e) => setNewOrgAdvanced(prev => ({ ...prev, trialEndDate: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Lascia vuoto per trial standard (+30 giorni) o nessun trial
                    </p>
                  </div>

                  {/* Billing Email */}
                  <div className="space-y-2">
                    <Label htmlFor="new-billing-email">Billing Email (Opzionale)</Label>
                    <Input
                      id="new-billing-email"
                      type="email"
                      placeholder="email@example.com"
                      value={newOrgAdvanced.billingEmail}
                      onChange={(e) => setNewOrgAdvanced(prev => ({ ...prev, billingEmail: e.target.value }))}
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOrgOpen(false)} data-testid="button-cancel-create-org">
                Annulla
              </Button>
              <Button
                onClick={handleCreateOrg}
                disabled={createOrgMutation.isPending}
                data-testid="button-confirm-create-org"
              >
                {createOrgMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Crea Organizzazione
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Organizzazioni
          </CardTitle>
          <CardDescription>
            Elenco di tutte le organizzazioni registrate
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : !organizations || organizations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nessuna organizzazione trovata. Crea la prima organizzazione.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Data Creazione</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizations.map((org) => (
                  <TableRow key={org.id} data-testid={`row-org-${org.id}`}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span data-testid={`text-org-name-${org.id}`}>{org.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={org.isActive ? "default" : "secondary"} data-testid={`badge-org-status-${org.id}`}>
                        {org.isActive ? "Attiva" : "Disattivata"}
                      </Badge>
                    </TableCell>
                    <TableCell data-testid={`text-org-date-${org.id}`}>{formatDateToItalian(org.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openManageAdminsDialog(org)}
                          data-testid={`button-manage-admins-${org.id}`}
                        >
                          <Users className="h-4 w-4 mr-1" />
                          Gestisci Admin
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openCreateAdminDialog(org)}
                          data-testid={`button-add-admin-${org.id}`}
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          Aggiungi Admin
                        </Button>
                        <Button
                          size="sm"
                          variant={org.isActive ? "destructive" : "default"}
                          onClick={() => toggleOrgStatusMutation.mutate({ id: org.id, isActive: !org.isActive })}
                          disabled={toggleOrgStatusMutation.isPending}
                          data-testid={`button-toggle-status-${org.id}`}
                        >
                          {org.isActive ? (
                            <>
                              <PowerOff className="h-4 w-4 mr-1" />
                              Disattiva
                            </>
                          ) : (
                            <>
                              <Power className="h-4 w-4 mr-1" />
                              Attiva
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openDeleteOrgDialog(org)}
                          data-testid={`button-delete-org-${org.id}`}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Elimina
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog Crea Admin */}
      <Dialog open={createAdminOpen} onOpenChange={setCreateAdminOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crea Amministratore</DialogTitle>
            <DialogDescription>
              {selectedOrg && (
                <span>Crea un nuovo amministratore per <strong>{selectedOrg.name}</strong></span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="admin-fullname">Nome Completo</Label>
              <Input
                id="admin-fullname"
                placeholder="Es. Mario Rossi"
                value={newAdminFullName}
                onChange={(e) => setNewAdminFullName(e.target.value)}
                data-testid="input-admin-fullname"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-username">Username</Label>
              <Input
                id="admin-username"
                placeholder="Es. mario.rossi"
                value={newAdminUsername}
                onChange={(e) => setNewAdminUsername(e.target.value)}
                data-testid="input-admin-username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password">Password</Label>
              <Input
                id="admin-password"
                type="password"
                placeholder="Inserisci password"
                value={newAdminPassword}
                onChange={(e) => setNewAdminPassword(e.target.value)}
                data-testid="input-admin-password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateAdminOpen(false)} data-testid="button-cancel-create-admin">
              Annulla
            </Button>
            <Button
              onClick={handleCreateAdmin}
              disabled={createAdminMutation.isPending}
              data-testid="button-confirm-create-admin"
            >
              {createAdminMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Crea Admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Gestisci Admin */}
      <Dialog open={manageAdminsOpen} onOpenChange={setManageAdminsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Amministratori</DialogTitle>
            <DialogDescription>
              {selectedOrg && (
                <span>Gestisci gli amministratori di <strong>{selectedOrg.name}</strong></span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {isLoadingAdmins ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : !admins || admins.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nessun amministratore trovato per questa organizzazione.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((admin) => (
                    <TableRow key={admin.id} data-testid={`row-admin-${admin.id}`}>
                      <TableCell className="font-medium" data-testid={`text-admin-name-${admin.id}`}>
                        {admin.fullName}
                      </TableCell>
                      <TableCell data-testid={`text-admin-username-${admin.id}`}>
                        {admin.username}
                      </TableCell>
                      <TableCell>
                        <Badge variant={admin.isActive !== false ? "default" : "secondary"}>
                          {admin.isActive !== false ? "Attivo" : "Disattivato"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditAdminDialog(admin)}
                            data-testid={`button-edit-admin-${admin.id}`}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Modifica
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openDeleteAdminDialog(admin)}
                            data-testid={`button-delete-admin-${admin.id}`}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Elimina
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManageAdminsOpen(false)}>
              Chiudi
            </Button>
            <Button onClick={() => {
              setManageAdminsOpen(false);
              if (selectedOrg) openCreateAdminDialog(selectedOrg);
            }}>
              <UserPlus className="h-4 w-4 mr-1" />
              Aggiungi Admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Modifica Admin */}
      <Dialog open={editAdminOpen} onOpenChange={setEditAdminOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica Amministratore</DialogTitle>
            <DialogDescription>
              {selectedAdmin && (
                <span>Modifica i dati di <strong>{selectedAdmin.fullName}</strong></span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-admin-fullname">Nome Completo</Label>
              <Input
                id="edit-admin-fullname"
                placeholder="Es. Mario Rossi"
                value={editAdminFullName}
                onChange={(e) => setEditAdminFullName(e.target.value)}
                data-testid="input-edit-admin-fullname"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-admin-username">Username</Label>
              <Input
                id="edit-admin-username"
                placeholder="Es. mario.rossi"
                value={editAdminUsername}
                onChange={(e) => setEditAdminUsername(e.target.value)}
                data-testid="input-edit-admin-username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-admin-password">Nuova Password (lascia vuoto per non modificare)</Label>
              <Input
                id="edit-admin-password"
                type="password"
                placeholder="Inserisci nuova password"
                value={editAdminPassword}
                onChange={(e) => setEditAdminPassword(e.target.value)}
                data-testid="input-edit-admin-password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditAdminOpen(false)} data-testid="button-cancel-edit-admin">
              Annulla
            </Button>
            <Button
              onClick={handleUpdateAdmin}
              disabled={updateAdminMutation.isPending}
              data-testid="button-confirm-edit-admin"
            >
              {updateAdminMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salva Modifiche
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Prima Conferma Eliminazione Admin */}
      <Dialog open={deleteAdminOpen} onOpenChange={(open) => !open && cancelDelete()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Conferma Eliminazione
            </DialogTitle>
            <DialogDescription>
              {adminToDelete && (
                <span>
                  Stai per eliminare l'amministratore <strong>{adminToDelete.fullName}</strong> ({adminToDelete.username}).
                  <br /><br />
                  Questa azione è <strong>irreversibile</strong>. Tutti i dati associati a questo admin verranno persi.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={cancelDelete} data-testid="button-cancel-delete-admin">
              Annulla
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleFirstDeleteConfirm}
              data-testid="button-first-confirm-delete-admin"
            >
              Sì, voglio eliminare
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Seconda Conferma Eliminazione Admin */}
      <Dialog open={deleteAdminConfirmOpen} onOpenChange={(open) => !open && cancelDelete()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Conferma Definitiva
            </DialogTitle>
            <DialogDescription>
              {adminToDelete && (
                <span>
                  <strong>ATTENZIONE!</strong> Questa è l'ultima conferma.
                  <br /><br />
                  L'amministratore <strong>{adminToDelete.fullName}</strong> sarà eliminato <strong>definitivamente</strong>.
                  <br /><br />
                  Sei assolutamente sicuro di voler procedere?
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={cancelDelete} data-testid="button-cancel-final-delete-admin">
              No, annulla
            </Button>
            <Button
              variant="destructive"
              onClick={handleFinalDelete}
              disabled={deleteAdminMutation.isPending}
              data-testid="button-final-confirm-delete-admin"
            >
              {deleteAdminMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Elimina Definitivamente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Prima Conferma Eliminazione Organizzazione */}
      <Dialog open={deleteOrgOpen} onOpenChange={(open) => !open && cancelDeleteOrg()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Conferma Eliminazione Organizzazione
            </DialogTitle>
            <DialogDescription>
              {orgToDelete && (
                <span>
                  Stai per eliminare l'organizzazione <strong>{orgToDelete.name}</strong>.
                  <br /><br />
                  <strong className="text-destructive">ATTENZIONE:</strong> Verranno eliminati TUTTI i dati correlati:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Tutti gli utenti e admin</li>
                    <li>Tutti i rapportini giornalieri</li>
                    <li>Tutte le presenze</li>
                    <li>Tutte le commesse</li>
                    <li>Tutte le attività e componenti</li>
                  </ul>
                  <br />
                  Questa azione è <strong>irreversibile</strong>.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={cancelDeleteOrg}>
              Annulla
            </Button>
            <Button
              variant="destructive"
              onClick={handleFirstDeleteOrgConfirm}
            >
              Sì, voglio eliminare
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Seconda Conferma Eliminazione Organizzazione */}
      <Dialog open={deleteOrgConfirmOpen} onOpenChange={(open) => !open && cancelDeleteOrg()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              ULTIMA CONFERMA
            </DialogTitle>
            <DialogDescription>
              {orgToDelete && (
                <span>
                  <strong className="text-destructive text-lg">⚠️ ATTENZIONE ESTREMA!</strong>
                  <br /><br />
                  Stai per eliminare <strong>DEFINITIVAMENTE</strong> l'organizzazione <strong>{orgToDelete.name}</strong> con tutti i suoi dati.
                  <br /><br />
                  <strong>NON SARÀ POSSIBILE RECUPERARE NULLA.</strong>
                  <br /><br />
                  Sei assolutamente sicuro di voler procedere?
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={cancelDeleteOrg}>
              No, annulla
            </Button>
            <Button
              variant="destructive"
              onClick={handleFinalDeleteOrg}
              disabled={deleteOrgMutation.isPending}
            >
              {deleteOrgMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              ELIMINA DEFINITIVAMENTE
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </TabsContent>

        <TabsContent value="saas">
          <SaaSManagementView />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================
// SAAS MANAGEMENT VIEW COMPONENT
// ============================================

// Helper functions for SaaS table
const formatTrialDays = (org: Organization) => {
  if (org.subscriptionStatus !== 'trial' || !org.trialEndDate) return '-';
  const endDate = new Date(org.trialEndDate);
  const today = new Date();
  const diffDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'Scaduto';
  return `${diffDays} ${diffDays === 1 ? 'giorno' : 'giorni'}`;
};

const getPlanLabel = (plan: string) => {
  switch (plan) {
    case 'premium_monthly':
      return 'Premium Mensile';
    case 'premium_yearly':
      return 'Premium Annuale';
    case 'free':
      return 'Free';
    default:
      return plan;
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'trial':
      return 'Trial';
    case 'active':
      return 'Attiva';
    case 'past_due':
      return 'Pagamento Scaduto';
    case 'canceled':
      return 'Annullata';
    case 'incomplete':
      return 'Incompleta';
    case 'paused':
      return 'In Pausa';
    default:
      return status;
  }
};

const getPlanBadgeVariant = (plan: string): "default" | "secondary" | "outline" => {
  if (plan === 'premium_monthly' || plan === 'premium_yearly') return 'default';
  return 'secondary';
};

const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case 'active':
      return 'default'; // Green
    case 'trial':
      return 'secondary'; // Yellow/Gray
    case 'past_due':
    case 'canceled':
      return 'destructive'; // Red
    default:
      return 'outline'; // Gray
  }
};

function SaaSManagementView() {
  const { toast } = useToast();
  const [filters, setFilters] = useState({
    plan: 'all',
    status: 'all',
    trialExpiring: false,
    search: ''
  });
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    subscriptionPlan: 'free' as 'free' | 'premium_monthly' | 'premium_yearly',
    subscriptionStatus: 'trial' as 'trial' | 'active' | 'past_due' | 'canceled' | 'incomplete' | 'paused',
    maxEmployees: 5,
    trialEndDate: '',
    billingEmail: '',
    stripeCustomerId: '',
    isActive: true,
  });

  // Query stats
  const { data: stats, isLoading: isLoadingStats } = useQuery<OrganizationStats>({
    queryKey: ["/api/superadmin/organizations/stats"],
  });

  // Query organizations (reuse endpoint but with SaaS fields)
  const { data: organizations, isLoading: isLoadingOrgs } = useQuery<Organization[]>({
    queryKey: ["/api/superadmin/organizations"],
  });

  // Mutation to update organization
  const updateOrgMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<Organization> }) => {
      const response = await apiRequest("PUT", `/api/superadmin/organizations/${data.id}`, data.updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/organizations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/organizations/stats"] });
      setEditingOrg(null);
      toast({
        title: "Organizzazione aggiornata",
        description: "Le modifiche sono state salvate con successo.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile aggiornare l'organizzazione.",
        variant: "destructive",
      });
    },
  });

  // Helper: Check if trial is expiring (≤7 days)
  const isTrialExpiring = (org: Organization) => {
    if (org.subscriptionStatus !== 'trial' || !org.trialEndDate) return false;
    const endDate = new Date(org.trialEndDate);
    const today = new Date();
    const diffDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays >= 0;
  };

  // Filter logic client-side
  const filteredOrgs = useMemo(() => {
    if (!organizations) return [];
    return organizations.filter(org => {
      if (filters.plan !== 'all' && org.subscriptionPlan !== filters.plan) return false;
      if (filters.status !== 'all' && org.subscriptionStatus !== filters.status) return false;
      if (filters.trialExpiring && !isTrialExpiring(org)) return false;
      if (filters.search && !org.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
      return true;
    });
  }, [organizations, filters]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Vista SaaS</h2>
        <p className="text-muted-foreground">
          Gestione completa sottoscrizioni e statistiche clienti
        </p>
      </div>

      {/* Stats Cards */}
      {isLoadingStats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-20 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Totali */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Totali</p>
                  <p className="text-3xl font-bold mt-2">{stats.totalOrganizations}</p>
                </div>
                <Building2 className="h-10 w-10 text-muted-foreground opacity-50" />
              </div>
            </CardContent>
          </Card>

          {/* In Trial */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">In Trial</p>
                  <p className="text-3xl font-bold mt-2 text-yellow-600">{stats.trialOrganizations}</p>
                </div>
                <AlertCircle className="h-10 w-10 text-yellow-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          {/* Attive */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Attive</p>
                  <p className="text-3xl font-bold mt-2 text-green-600">{stats.activeOrganizations}</p>
                </div>
                <TrendingUp className="h-10 w-10 text-green-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          {/* MRR */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">MRR Stimato</p>
                  <p className="text-3xl font-bold mt-2 text-blue-600">
                    €{stats.estimatedMRR.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    ARR: €{stats.estimatedARR.toFixed(2)}
                  </p>
                </div>
                <DollarSign className="h-10 w-10 text-blue-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Filters Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Piano Filter */}
            <div className="space-y-2">
              <Label>Piano</Label>
              <Select value={filters.plan} onValueChange={(value) => setFilters(prev => ({ ...prev, plan: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Tutti i piani" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="premium_monthly">Premium Mensile</SelectItem>
                  <SelectItem value="premium_yearly">Premium Annuale</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label>Stato</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Tutti gli stati" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="past_due">Past Due</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                  <SelectItem value="incomplete">Incomplete</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search Filter */}
            <div className="space-y-2">
              <Label>Cerca</Label>
              <Input
                placeholder="Nome organizzazione..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>

            {/* Trial Expiring Checkbox */}
            <div className="space-y-2">
              <Label className="block">Filtri Speciali</Label>
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="trial-expiring"
                  checked={filters.trialExpiring}
                  onCheckedChange={(checked) => setFilters(prev => ({ ...prev, trialExpiring: checked as boolean }))}
                />
                <label
                  htmlFor="trial-expiring"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Trial in scadenza (≤7 giorni)
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SaaS Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Organizzazioni ({filteredOrgs.length})
          </CardTitle>
          <CardDescription>
            Vista dettagliata con informazioni sottoscrizione
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingOrgs ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : !filteredOrgs || filteredOrgs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nessuna organizzazione trovata con i filtri selezionati.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Piano</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead>Trial Rimanente</TableHead>
                    <TableHead>Max Dipendenti</TableHead>
                    <TableHead>Billing Email</TableHead>
                    <TableHead>Data Creazione</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrgs.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span>{org.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getPlanBadgeVariant(org.subscriptionPlan)}>
                          {org.subscriptionPlan === 'premium_yearly' && (
                            <Crown className="h-3 w-3 mr-1" />
                          )}
                          {getPlanLabel(org.subscriptionPlan)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(org.subscriptionStatus)}>
                          {getStatusLabel(org.subscriptionStatus)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={
                          org.subscriptionStatus === 'trial' && isTrialExpiring(org)
                            ? 'text-yellow-600 font-medium'
                            : ''
                        }>
                          {formatTrialDays(org)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {org.maxEmployees === 999 ? 'Illimitati' : org.maxEmployees}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {org.billingEmail || '-'}
                        </span>
                      </TableCell>
                      <TableCell>{formatDateToItalian(org.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingOrg(org)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Modifica
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Organization Dialog */}
      <Dialog
        open={!!editingOrg}
        onOpenChange={(open) => {
          if (!open) {
            setEditingOrg(null);
          } else if (editingOrg) {
            // Populate form when opening
            setEditFormData({
              name: editingOrg.name,
              subscriptionPlan: editingOrg.subscriptionPlan,
              subscriptionStatus: editingOrg.subscriptionStatus,
              maxEmployees: editingOrg.maxEmployees,
              trialEndDate: editingOrg.trialEndDate ? new Date(editingOrg.trialEndDate).toISOString().split('T')[0] : '',
              billingEmail: editingOrg.billingEmail || '',
              stripeCustomerId: editingOrg.stripeCustomerId || '',
              isActive: editingOrg.isActive,
            });
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifica Organizzazione</DialogTitle>
            <DialogDescription>
              Controllo completo su tutti i parametri SaaS di {editingOrg?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="edit-org-name">Nome Organizzazione</Label>
              <Input
                id="edit-org-name"
                value={editFormData.name}
                onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Piano */}
              <div className="space-y-2">
                <Label>Piano Sottoscrizione</Label>
                <Select
                  value={editFormData.subscriptionPlan}
                  onValueChange={(value: any) => setEditFormData(prev => ({ ...prev, subscriptionPlan: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="premium_monthly">Premium Mensile (49€/mese)</SelectItem>
                    <SelectItem value="premium_yearly">Premium Annuale (470€/anno)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Stato */}
              <div className="space-y-2">
                <Label>Stato Sottoscrizione</Label>
                <Select
                  value={editFormData.subscriptionStatus}
                  onValueChange={(value: any) => setEditFormData(prev => ({ ...prev, subscriptionStatus: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="past_due">Past Due</SelectItem>
                    <SelectItem value="canceled">Canceled</SelectItem>
                    <SelectItem value="incomplete">Incomplete</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Max Dipendenti */}
              <div className="space-y-2">
                <Label htmlFor="edit-max-employees">Max Dipendenti</Label>
                <Input
                  id="edit-max-employees"
                  type="number"
                  min="1"
                  value={editFormData.maxEmployees}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, maxEmployees: parseInt(e.target.value) || 1 }))}
                />
                <p className="text-xs text-muted-foreground">999 = Illimitati</p>
              </div>

              {/* Trial End Date */}
              <div className="space-y-2">
                <Label htmlFor="edit-trial-end">Data Fine Trial</Label>
                <Input
                  id="edit-trial-end"
                  type="date"
                  value={editFormData.trialEndDate}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, trialEndDate: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">Lascia vuoto per nessun trial</p>
              </div>
            </div>

            {/* Billing Email */}
            <div className="space-y-2">
              <Label htmlFor="edit-billing-email">Billing Email</Label>
              <Input
                id="edit-billing-email"
                type="email"
                placeholder="email@example.com"
                value={editFormData.billingEmail}
                onChange={(e) => setEditFormData(prev => ({ ...prev, billingEmail: e.target.value }))}
              />
            </div>

            {/* Stripe Customer ID */}
            <div className="space-y-2">
              <Label htmlFor="edit-stripe-customer">Stripe Customer ID (Opzionale)</Label>
              <Input
                id="edit-stripe-customer"
                placeholder="cus_..."
                value={editFormData.stripeCustomerId}
                onChange={(e) => setEditFormData(prev => ({ ...prev, stripeCustomerId: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Link manuale al cliente Stripe. Lascia vuoto per grandfathering.
              </p>
            </div>

            {/* Is Active */}
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-is-active"
                checked={editFormData.isActive}
                onCheckedChange={(checked) => setEditFormData(prev => ({ ...prev, isActive: checked }))}
              />
              <Label htmlFor="edit-is-active" className="cursor-pointer">
                Organizzazione Attiva
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingOrg(null)}
              disabled={updateOrgMutation.isPending}
            >
              Annulla
            </Button>
            <Button
              onClick={() => {
                if (!editingOrg) return;

                const updates: Partial<Organization> = {
                  name: editFormData.name,
                  subscriptionPlan: editFormData.subscriptionPlan,
                  subscriptionStatus: editFormData.subscriptionStatus,
                  maxEmployees: editFormData.maxEmployees,
                  trialEndDate: editFormData.trialEndDate || null,
                  billingEmail: editFormData.billingEmail || null,
                  stripeCustomerId: editFormData.stripeCustomerId || null,
                  isActive: editFormData.isActive,
                };

                updateOrgMutation.mutate({ id: editingOrg.id, updates });
              }}
              disabled={updateOrgMutation.isPending || !editFormData.name.trim()}
            >
              {updateOrgMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salva Modifiche
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
