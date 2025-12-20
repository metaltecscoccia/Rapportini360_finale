import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "lucide-react";
import { formatDateToItalian } from "@/lib/dateUtils";

type Organization = {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
};

type Admin = {
  id: string;
  username: string;
  fullName: string;
  role: string;
  isActive: boolean;
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
  const [newAdminUsername, setNewAdminUsername] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newAdminFullName, setNewAdminFullName] = useState("");
  const [editAdminUsername, setEditAdminUsername] = useState("");
  const [editAdminPassword, setEditAdminPassword] = useState("");
  const [editAdminFullName, setEditAdminFullName] = useState("");
  const [deleteAdminOpen, setDeleteAdminOpen] = useState(false);
  const [deleteAdminConfirmOpen, setDeleteAdminConfirmOpen] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<Admin | null>(null);

  const { data: organizations, isLoading } = useQuery<Organization[]>({
    queryKey: ["/api/superadmin/organizations"],
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
    mutationFn: async (name: string) => {
      const response = await apiRequest("POST", "/api/superadmin/organizations", { name });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/organizations"] });
      setCreateOrgOpen(false);
      setNewOrgName("");
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

  const handleCreateOrg = () => {
    if (!newOrgName.trim()) {
      toast({
        title: "Errore",
        description: "Inserisci un nome per l'organizzazione.",
        variant: "destructive",
      });
      return;
    }
    createOrgMutation.mutate(newOrgName.trim());
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

  return (
    <div className="p-6 space-y-6">
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crea Nuova Organizzazione</DialogTitle>
              <DialogDescription>
                Inserisci il nome dell'organizzazione da creare.
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
                Crea
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
    </div>
  );
}
