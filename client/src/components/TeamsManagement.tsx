import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Plus, Pencil, Trash2, Users, Loader2, UserCheck, Crown } from "lucide-react";

type User = {
  id: string;
  username: string;
  fullName: string;
  role: string;
  isActive: boolean;
};

type Team = {
  id: string;
  name: string;
  teamLeaderId: string;
  isActive: boolean;
  createdAt: string;
};

type TeamMember = {
  id: string;
  teamId: string;
  userId: string;
  isActive: boolean;
  user: User;
};

export default function TeamsManagement() {
  const { toast } = useToast();

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);

  // Form states
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamLeaderId, setNewTeamLeaderId] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  // Edit states
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [editTeamName, setEditTeamName] = useState("");
  const [editTeamLeaderId, setEditTeamLeaderId] = useState("");

  // Team to delete/manage members
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  // Fetch teams
  const { data: teams, isLoading: isLoadingTeams } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  // Fetch all employees (active only)
  const { data: employees } = useQuery<User[]>({
    queryKey: ["/api/employees"],
  });

  // Fetch team members when managing members
  const { data: teamMembers, isLoading: isLoadingMembers } = useQuery<TeamMember[]>({
    queryKey: ["/api/teams", selectedTeam?.id, "members"],
    queryFn: async () => {
      const res = await fetch(`/api/teams/${selectedTeam!.id}/members`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch members");
      return res.json();
    },
    enabled: !!selectedTeam && membersDialogOpen,
  });

  // Get employees that are not team leaders and not in any team (for adding to teams)
  const availableEmployees = employees?.filter(
    (emp) => emp.role === "employee" && emp.isActive
  ) || [];

  // Get employees that could be team leaders (employees not already leading a team)
  const availableLeaders = employees?.filter(
    (emp) => (emp.role === "employee" || emp.role === "teamleader") && emp.isActive
  ) || [];

  // Create team mutation
  const createTeamMutation = useMutation({
    mutationFn: async (data: { name: string; teamLeaderId: string; memberIds: string[] }) => {
      const response = await apiRequest("POST", "/api/teams", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      setCreateDialogOpen(false);
      resetCreateForm();
      toast({ title: "Squadra creata", description: "La squadra è stata creata con successo." });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile creare la squadra.",
        variant: "destructive",
      });
    },
  });

  // Update team mutation
  const updateTeamMutation = useMutation({
    mutationFn: async (data: { id: string; name: string; teamLeaderId: string }) => {
      const response = await apiRequest("PATCH", `/api/teams/${data.id}`, {
        name: data.name,
        teamLeaderId: data.teamLeaderId,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      setEditDialogOpen(false);
      setEditingTeam(null);
      toast({ title: "Squadra aggiornata", description: "La squadra è stata aggiornata con successo." });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile aggiornare la squadra.",
        variant: "destructive",
      });
    },
  });

  // Delete team mutation
  const deleteTeamMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/teams/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      setDeleteDialogOpen(false);
      setSelectedTeam(null);
      toast({ title: "Squadra eliminata", description: "La squadra è stata eliminata con successo." });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile eliminare la squadra.",
        variant: "destructive",
      });
    },
  });

  // Update team members mutation
  const updateMembersMutation = useMutation({
    mutationFn: async (data: { teamId: string; memberIds: string[] }) => {
      const response = await apiRequest("PUT", `/api/teams/${data.teamId}/members`, {
        memberIds: data.memberIds,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", selectedTeam?.id, "members"] });
      toast({ title: "Membri aggiornati", description: "I membri della squadra sono stati aggiornati." });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile aggiornare i membri.",
        variant: "destructive",
      });
    },
  });

  const resetCreateForm = () => {
    setNewTeamName("");
    setNewTeamLeaderId("");
    setSelectedMemberIds([]);
  };

  const handleCreateTeam = () => {
    if (!newTeamName.trim()) {
      toast({ title: "Errore", description: "Inserisci un nome per la squadra.", variant: "destructive" });
      return;
    }
    if (!newTeamLeaderId) {
      toast({ title: "Errore", description: "Seleziona un caposquadra.", variant: "destructive" });
      return;
    }
    createTeamMutation.mutate({
      name: newTeamName.trim(),
      teamLeaderId: newTeamLeaderId,
      memberIds: selectedMemberIds,
    });
  };

  const handleEditTeam = (team: Team) => {
    setEditingTeam(team);
    setEditTeamName(team.name);
    setEditTeamLeaderId(team.teamLeaderId);
    setEditDialogOpen(true);
  };

  const handleUpdateTeam = () => {
    if (!editingTeam) return;
    if (!editTeamName.trim()) {
      toast({ title: "Errore", description: "Inserisci un nome per la squadra.", variant: "destructive" });
      return;
    }
    updateTeamMutation.mutate({
      id: editingTeam.id,
      name: editTeamName.trim(),
      teamLeaderId: editTeamLeaderId,
    });
  };

  const handleDeleteTeam = (team: Team) => {
    setSelectedTeam(team);
    setDeleteDialogOpen(true);
  };

  const handleManageMembers = (team: Team) => {
    setSelectedTeam(team);
    setMembersDialogOpen(true);
  };

  const handleMemberToggle = (userId: string) => {
    if (!selectedTeam) return;

    const currentMemberIds = teamMembers?.map((m) => m.userId) || [];
    let newMemberIds: string[];

    if (currentMemberIds.includes(userId)) {
      newMemberIds = currentMemberIds.filter((id) => id !== userId);
    } else {
      newMemberIds = [...currentMemberIds, userId];
    }

    updateMembersMutation.mutate({
      teamId: selectedTeam.id,
      memberIds: newMemberIds,
    });
  };

  const getLeaderName = (teamLeaderId: string) => {
    const leader = employees?.find((e) => e.id === teamLeaderId);
    return leader?.fullName || "N/A";
  };

  const getMembersCount = (team: Team) => {
    // This will be fetched separately per team if needed
    return "-";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestione Squadre</h2>
          <p className="text-muted-foreground">
            Crea e gestisci le squadre con i caposquadra
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuova Squadra
        </Button>
      </div>

      {/* Teams Table */}
      <Card>
        <CardHeader>
          <CardTitle>Squadre</CardTitle>
          <CardDescription>
            Lista di tutte le squadre dell'organizzazione
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingTeams ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : teams && teams.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome Squadra</TableHead>
                  <TableHead>Caposquadra</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell className="font-medium">{team.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4 text-yellow-500" />
                        {getLeaderName(team.teamLeaderId)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={team.isActive ? "default" : "secondary"}>
                        {team.isActive ? "Attiva" : "Inattiva"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleManageMembers(team)}
                        >
                          <Users className="h-4 w-4 mr-1" />
                          Membri
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditTeam(team)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteTeam(team)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nessuna squadra presente</p>
              <p className="text-sm">Clicca "Nuova Squadra" per crearne una</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Team Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuova Squadra</DialogTitle>
            <DialogDescription>
              Crea una nuova squadra con un caposquadra
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="teamName">Nome Squadra</Label>
              <Input
                id="teamName"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="es. Squadra A"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teamLeader">Caposquadra</Label>
              <Select value={newTeamLeaderId} onValueChange={setNewTeamLeaderId}>
                <SelectTrigger id="teamLeader">
                  <SelectValue placeholder="Seleziona caposquadra..." />
                </SelectTrigger>
                <SelectContent>
                  {availableLeaders.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.fullName}
                      {emp.role === "teamleader" && " (già caposquadra)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Membri (opzionale)</Label>
              <div className="border rounded-md max-h-48 overflow-y-auto">
                {availableEmployees.map((emp) => (
                  <div
                    key={emp.id}
                    className="flex items-center gap-2 p-2 hover:bg-muted/50 cursor-pointer"
                    onClick={() => {
                      if (selectedMemberIds.includes(emp.id)) {
                        setSelectedMemberIds(selectedMemberIds.filter(id => id !== emp.id));
                      } else {
                        setSelectedMemberIds([...selectedMemberIds, emp.id]);
                      }
                    }}
                  >
                    <Checkbox
                      checked={selectedMemberIds.includes(emp.id)}
                      disabled={emp.id === newTeamLeaderId}
                    />
                    <span className={emp.id === newTeamLeaderId ? "text-muted-foreground" : ""}>
                      {emp.fullName}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleCreateTeam} disabled={createTeamMutation.isPending}>
              {createTeamMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Crea Squadra
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Team Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifica Squadra</DialogTitle>
            <DialogDescription>
              Modifica i dettagli della squadra
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editTeamName">Nome Squadra</Label>
              <Input
                id="editTeamName"
                value={editTeamName}
                onChange={(e) => setEditTeamName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editTeamLeader">Caposquadra</Label>
              <Select value={editTeamLeaderId} onValueChange={setEditTeamLeaderId}>
                <SelectTrigger id="editTeamLeader">
                  <SelectValue placeholder="Seleziona caposquadra..." />
                </SelectTrigger>
                <SelectContent>
                  {availableLeaders.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleUpdateTeam} disabled={updateTeamMutation.isPending}>
              {updateTeamMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salva Modifiche
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Members Dialog */}
      <Dialog open={membersDialogOpen} onOpenChange={setMembersDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Membri Squadra: {selectedTeam?.name}</DialogTitle>
            <DialogDescription>
              Aggiungi o rimuovi membri dalla squadra
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {isLoadingMembers ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="border rounded-md max-h-64 overflow-y-auto">
                {availableEmployees.map((emp) => {
                  const isMember = teamMembers?.some((m) => m.userId === emp.id);
                  const isLeader = emp.id === selectedTeam?.teamLeaderId;

                  return (
                    <div
                      key={emp.id}
                      className={`flex items-center gap-2 p-2 ${
                        isLeader ? "bg-muted/30" : "hover:bg-muted/50 cursor-pointer"
                      }`}
                      onClick={() => !isLeader && handleMemberToggle(emp.id)}
                    >
                      <Checkbox
                        checked={isMember || isLeader}
                        disabled={isLeader || updateMembersMutation.isPending}
                      />
                      <span className={isLeader ? "text-muted-foreground" : ""}>
                        {emp.fullName}
                        {isLeader && (
                          <Badge variant="outline" className="ml-2">
                            <Crown className="h-3 w-3 mr-1" />
                            Caposquadra
                          </Badge>
                        )}
                      </span>
                      {isMember && !isLeader && (
                        <UserCheck className="h-4 w-4 ml-auto text-green-500" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMembersDialogOpen(false)}>
              Chiudi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Elimina Squadra</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare la squadra "{selectedTeam?.name}"?
              <br /><br />
              Questa azione rimuoverà tutti i membri dalla squadra e il caposquadra
              tornerà a essere un dipendente normale.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedTeam && deleteTeamMutation.mutate(selectedTeam.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteTeamMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
