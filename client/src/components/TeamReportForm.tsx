import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDateToItalian } from "@/lib/dateUtils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Users, Briefcase, CheckCircle2, AlertCircle, UserX, Crown } from "lucide-react";

type Client = {
  id: string;
  name: string;
};

type WorkOrder = {
  id: string;
  name: string;
  clientId: string;
  availableWorkTypes: string[];
  availableMaterials: string[];
};

type WorkType = {
  id: string;
  name: string;
};

type Material = {
  id: string;
  name: string;
};

type TeamMemberWithStatus = {
  id: string;
  teamId: string;
  userId: string;
  isActive: boolean;
  user: {
    id: string;
    fullName: string;
    username: string;
  };
  absenceType: string | null;
  isAvailable: boolean;
  isTeamLeader?: boolean;
};

type Team = {
  id: string;
  name: string;
  teamLeaderId: string;
};

type TeamSubmission = {
  id: string;
  teamId: string;
  date: string;
  status: string;
  clientId: string;
  workOrderId: string;
  hours: string;
  notes: string | null;
};

interface TeamReportFormProps {
  teamLeaderId: string;
  teamLeaderName: string;
}

// Mappa dei tipi di assenza
const absenceTypeLabels: Record<string, string> = {
  A: "Assenza",
  F: "Ferie",
  P: "Permesso",
  M: "Malattia",
  CP: "Congedo Parentale",
  L104: "Legge 104",
};

export default function TeamReportForm({ teamLeaderId, teamLeaderName }: TeamReportFormProps) {
  const { toast } = useToast();
  const today = new Date().toISOString().split("T")[0];

  // Form state
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<string>("");
  const [hours, setHours] = useState<string>("8");
  const [notes, setNotes] = useState<string>("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>("lavorazione");
  const [selectedWorkTypes, setSelectedWorkTypes] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);

  // Fetch team for this leader
  const { data: team, isLoading: isLoadingTeam } = useQuery<Team>({
    queryKey: ["/api/teams/by-leader", teamLeaderId],
    queryFn: async () => {
      const res = await fetch(`/api/teams/by-leader/${teamLeaderId}`, { credentials: "include" });
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error("Failed to fetch team");
      }
      return res.json();
    },
  });

  // Fetch team members with absence status
  const { data: members, isLoading: isLoadingMembers } = useQuery<TeamMemberWithStatus[]>({
    queryKey: ["/api/teams", team?.id, "members-status", today],
    queryFn: async () => {
      const res = await fetch(`/api/teams/${team!.id}/members-status?date=${today}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch team members");
      return res.json();
    },
    enabled: !!team?.id,
  });

  // Fetch today's submission if exists
  const { data: todaySubmission, isLoading: isLoadingSubmission } = useQuery<TeamSubmission | null>({
    queryKey: ["/api/team-submissions/today"],
    queryFn: async () => {
      const res = await fetch("/api/team-submissions/today", { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch submission");
      return res.json();
    },
  });

  // Fetch clients
  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  // Fetch work orders (using /active endpoint accessible to all authenticated users)
  const { data: workOrders } = useQuery<WorkOrder[]>({
    queryKey: ["/api/work-orders/active"],
  });

  // Fetch work types (global list for name lookup)
  const { data: workTypes } = useQuery<WorkType[]>({
    queryKey: ["/api/work-types"],
  });

  // Fetch materials (global list for name lookup)
  const { data: materials } = useQuery<Material[]>({
    queryKey: ["/api/materials"],
  });

  // Filter work orders by selected client
  const filteredWorkOrders = workOrders?.filter(
    (wo) => wo.clientId === selectedClientId
  ) || [];

  // Get selected work order details
  const selectedWorkOrder = workOrders?.find((wo) => wo.id === selectedWorkOrderId);
  const availableWorkTypes = selectedWorkOrder?.availableWorkTypes || [];
  const availableMaterials = selectedWorkOrder?.availableMaterials || [];

  // Helper functions to get names from IDs
  const getWorkTypeName = (id: string) => {
    const wt = workTypes?.find((w) => w.id === id);
    return wt?.name || id;
  };

  const getMaterialName = (id: string) => {
    const m = materials?.find((mat) => mat.id === id);
    return m?.name || id;
  };

  // Toggle functions for work types and materials
  const toggleWorkType = (workTypeId: string) => {
    setSelectedWorkTypes((prev) =>
      prev.includes(workTypeId)
        ? prev.filter((id) => id !== workTypeId)
        : [...prev, workTypeId]
    );
  };

  const toggleMaterial = (materialId: string) => {
    setSelectedMaterials((prev) =>
      prev.includes(materialId)
        ? prev.filter((id) => id !== materialId)
        : [...prev, materialId]
    );
  };

  // Initialize selected members when members load
  useEffect(() => {
    if (members) {
      // Select all available members by default
      const availableIds = members
        .filter((m) => m.isAvailable)
        .map((m) => m.userId);
      setSelectedMemberIds(availableIds);
    }
  }, [members]);

  // Create team report mutation
  const createReportMutation = useMutation({
    mutationFn: async (data: {
      clientId: string;
      workOrderId: string;
      hours: string;
      selectedMemberIds: string[];
      notes: string;
      workTypes: string[];
      materials: string[];
    }) => {
      const response = await apiRequest("POST", "/api/team-submissions", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team-submissions/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/team-submissions"] });
      toast({
        title: "Rapportino inviato",
        description: `Rapportino squadra creato per ${selectedMemberIds.length} dipendenti.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile creare il rapportino.",
        variant: "destructive",
      });
    },
  });

  const handleMemberToggle = (userId: string, isAvailable: boolean) => {
    if (!isAvailable) return; // Can't toggle unavailable members

    setSelectedMemberIds((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      }
      return [...prev, userId];
    });
  };

  const handleSubmit = () => {
    if (!selectedClientId) {
      toast({
        title: "Errore",
        description: "Seleziona un cliente.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedWorkOrderId) {
      toast({
        title: "Errore",
        description: "Seleziona una commessa.",
        variant: "destructive",
      });
      return;
    }

    if (selectedMemberIds.length === 0) {
      toast({
        title: "Errore",
        description: "Seleziona almeno un membro della squadra.",
        variant: "destructive",
      });
      return;
    }

    if (selectedWorkTypes.length === 0 && availableWorkTypes.length > 0) {
      toast({
        title: "Errore",
        description: "Seleziona almeno un'attività.",
        variant: "destructive",
      });
      return;
    }

    createReportMutation.mutate({
      clientId: selectedClientId,
      workOrderId: selectedWorkOrderId,
      hours,
      selectedMemberIds,
      notes,
      workTypes: selectedWorkTypes,
      materials: selectedMaterials,
    });
  };

  // Loading states
  if (isLoadingTeam) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // No team assigned
  if (!team) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nessuna Squadra Assegnata</h3>
            <p className="text-muted-foreground">
              Non sei ancora assegnato come caposquadra. Contatta l'amministratore.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Already submitted today
  if (todaySubmission) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Rapportino Inviato
          </CardTitle>
          <CardDescription>
            {formatDateToItalian(today)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Stato</p>
              <Badge variant={todaySubmission.status === "Approvato" ? "default" : "secondary"}>
                {todaySubmission.status}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              Il rapportino della squadra per oggi è già stato inviato ed è in attesa di approvazione.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const availableMembersCount = members?.filter((m) => m.isAvailable).length || 0;
  const unavailableMembersCount = members?.filter((m) => !m.isAvailable).length || 0;

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Rapportino Squadra - {team.name}
        </CardTitle>
        <CardDescription>
          {formatDateToItalian(today)} - Caposquadra: {teamLeaderName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="lavorazione" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Lavorazione
            </TabsTrigger>
            <TabsTrigger value="presenze" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Presenze
              {selectedMemberIds.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {selectedMemberIds.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Tab Lavorazione */}
          <TabsContent value="lavorazione" className="space-y-4 mt-4">
            {/* Cliente */}
            <div className="space-y-2">
              <Label htmlFor="client">Cliente</Label>
              <Select value={selectedClientId} onValueChange={(val) => {
                setSelectedClientId(val);
                setSelectedWorkOrderId(""); // Reset work order when client changes
                setSelectedWorkTypes([]); // Reset work types
                setSelectedMaterials([]); // Reset materials
              }}>
                <SelectTrigger id="client">
                  <SelectValue placeholder="Seleziona cliente..." />
                </SelectTrigger>
                <SelectContent>
                  {clients?.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Commessa */}
            <div className="space-y-2">
              <Label htmlFor="workOrder">Commessa</Label>
              <Select
                value={selectedWorkOrderId}
                onValueChange={(val) => {
                  setSelectedWorkOrderId(val);
                  setSelectedWorkTypes([]); // Reset work types when work order changes
                  setSelectedMaterials([]); // Reset materials when work order changes
                }}
                disabled={!selectedClientId}
              >
                <SelectTrigger id="workOrder">
                  <SelectValue placeholder={selectedClientId ? "Seleziona commessa..." : "Prima seleziona un cliente"} />
                </SelectTrigger>
                <SelectContent>
                  {filteredWorkOrders.map((wo) => (
                    <SelectItem key={wo.id} value={wo.id}>
                      {wo.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Attività */}
            <div className="space-y-2">
              <Label>Attività</Label>
              {!selectedWorkOrderId ? (
                <div className="p-3 border rounded-md text-sm text-muted-foreground">
                  Seleziona prima una commessa
                </div>
              ) : availableWorkTypes.length === 0 ? (
                <div className="p-3 border rounded-md text-sm text-muted-foreground">
                  Nessuna attività disponibile per questa commessa
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 border rounded-md">
                  {availableWorkTypes.map((workTypeId) => (
                    <div key={workTypeId} className="flex items-center space-x-2">
                      <Checkbox
                        id={`worktype-${workTypeId}`}
                        checked={selectedWorkTypes.includes(workTypeId)}
                        onCheckedChange={() => toggleWorkType(workTypeId)}
                      />
                      <Label
                        htmlFor={`worktype-${workTypeId}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {getWorkTypeName(workTypeId)}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Componenti */}
            <div className="space-y-2">
              <Label>Componenti (opzionale)</Label>
              {!selectedWorkOrderId ? (
                <div className="p-3 border rounded-md text-sm text-muted-foreground">
                  Seleziona prima una commessa
                </div>
              ) : availableMaterials.length === 0 ? (
                <div className="p-3 border rounded-md text-sm text-muted-foreground">
                  Nessun componente disponibile per questa commessa
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 border rounded-md">
                  {availableMaterials.map((materialId) => (
                    <div key={materialId} className="flex items-center space-x-2">
                      <Checkbox
                        id={`material-${materialId}`}
                        checked={selectedMaterials.includes(materialId)}
                        onCheckedChange={() => toggleMaterial(materialId)}
                      />
                      <Label
                        htmlFor={`material-${materialId}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {getMaterialName(materialId)}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Ore */}
            <div className="space-y-2">
              <Label htmlFor="hours">Ore Lavorate</Label>
              <Input
                id="hours"
                type="number"
                min="0.5"
                max="24"
                step="0.5"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
              />
            </div>

            {/* Note */}
            <div className="space-y-2">
              <Label htmlFor="notes">Note (opzionale)</Label>
              <Textarea
                id="notes"
                placeholder="Note aggiuntive..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </TabsContent>

          {/* Tab Presenze */}
          <TabsContent value="presenze" className="space-y-4 mt-4">
            {isLoadingMembers ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <>
                {/* Summary */}
                <div className="flex gap-4 mb-4">
                  <Badge variant="outline" className="text-sm">
                    Presenti: {selectedMemberIds.length}/{availableMembersCount}
                  </Badge>
                  {unavailableMembersCount > 0 && (
                    <Badge variant="secondary" className="text-sm">
                      Assenti registrati: {unavailableMembersCount}
                    </Badge>
                  )}
                </div>

                {/* Members list */}
                <div className="space-y-2">
                  {members?.map((member) => (
                    <div
                      key={member.userId}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        member.isAvailable
                          ? "bg-background hover:bg-muted/50 cursor-pointer"
                          : "bg-muted/30 opacity-60"
                      }`}
                      onClick={() => handleMemberToggle(member.userId, member.isAvailable)}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedMemberIds.includes(member.userId)}
                          disabled={!member.isAvailable}
                          onCheckedChange={() => handleMemberToggle(member.userId, member.isAvailable)}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className={`font-medium ${!member.isAvailable ? "text-muted-foreground" : ""}`}>
                              {member.user.fullName}
                            </p>
                            {member.isTeamLeader && (
                              <Badge variant="outline" className="text-xs py-0 px-1.5 gap-1">
                                <Crown className="h-3 w-3" />
                                Caposquadra
                              </Badge>
                            )}
                          </div>
                          {!member.isAvailable && member.absenceType && (
                            <p className="text-xs text-muted-foreground">
                              {absenceTypeLabels[member.absenceType] || member.absenceType}
                            </p>
                          )}
                        </div>
                      </div>
                      {!member.isAvailable && (
                        <Badge variant="outline" className="text-muted-foreground">
                          <UserX className="h-3 w-3 mr-1" />
                          {absenceTypeLabels[member.absenceType!] || "Assente"}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>

                {unavailableMembersCount > 0 && (
                  <p className="text-sm text-muted-foreground mt-4">
                    I dipendenti in grigio hanno già un'assenza registrata nel foglio presenze
                    e non possono essere inclusi nel rapportino.
                  </p>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* Submit Button */}
        <div className="mt-6">
          <Button
            onClick={handleSubmit}
            disabled={createReportMutation.isPending || !selectedClientId || !selectedWorkOrderId || selectedMemberIds.length === 0 || (availableWorkTypes.length > 0 && selectedWorkTypes.length === 0)}
            className="w-full"
            size="lg"
          >
            {createReportMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Invio in corso...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Invia Rapportino Squadra ({selectedMemberIds.length} dipendenti)
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
