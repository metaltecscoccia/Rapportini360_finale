import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash, HardHat, Search } from "lucide-react";
import type { EquipmentType } from "@shared/schema";

const equipmentTypeSchema = z.object({
  name: z.string().min(2, "Il nome deve essere di almeno 2 caratteri"),
  category: z.enum(["DPI", "Attrezzatura", "Altro"], {
    required_error: "Categoria è richiesta",
  }),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

type EquipmentTypeForm = z.infer<typeof equipmentTypeSchema>;

export default function EquipmentCatalogManagement() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<EquipmentType | null>(null);

  const addForm = useForm<EquipmentTypeForm>({
    resolver: zodResolver(equipmentTypeSchema),
    defaultValues: { name: "", category: "DPI", description: "", isActive: true },
  });

  const editForm = useForm<EquipmentTypeForm>({
    resolver: zodResolver(equipmentTypeSchema),
  });

  const { data: equipmentTypes = [], isLoading } = useQuery<EquipmentType[]>({
    queryKey: ["/api/equipment-types"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: EquipmentTypeForm) => {
      const res = await apiRequest("POST", "/api/equipment-types", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment-types"] });
      toast({ title: "Tipo attrezzatura aggiunto" });
      setAddDialogOpen(false);
      addForm.reset({ name: "", category: "DPI", description: "", isActive: true });
    },
    onError: () => {
      toast({ title: "Errore", description: "Impossibile aggiungere il tipo", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: EquipmentTypeForm }) => {
      const res = await apiRequest("PATCH", `/api/equipment-types/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment-types"] });
      toast({ title: "Tipo attrezzatura aggiornato" });
      setEditDialogOpen(false);
      setSelectedType(null);
    },
    onError: () => {
      toast({ title: "Errore", description: "Impossibile aggiornare il tipo", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/equipment-types/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment-types"] });
      toast({ title: "Tipo attrezzatura eliminato" });
      setDeleteDialogOpen(false);
      setSelectedType(null);
    },
    onError: () => {
      toast({ title: "Errore", description: "Impossibile eliminare il tipo", variant: "destructive" });
    },
  });

  const handleEdit = (type: EquipmentType) => {
    setSelectedType(type);
    editForm.reset({
      name: type.name,
      category: type.category as "DPI" | "Attrezzatura" | "Altro",
      description: type.description || "",
      isActive: type.isActive,
    });
    setEditDialogOpen(true);
  };

  const handleDelete = (type: EquipmentType) => {
    setSelectedType(type);
    setDeleteDialogOpen(true);
  };

  const filteredTypes = equipmentTypes.filter((t) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return t.name.toLowerCase().includes(search) || t.category.toLowerCase().includes(search);
  });

  const getCategoryBadgeVariant = (category: string) => {
    if (category === "DPI") return "default";
    if (category === "Attrezzatura") return "secondary";
    return "outline";
  };

  const renderForm = (form: ReturnType<typeof useForm<EquipmentTypeForm>>, onSubmit: (data: EquipmentTypeForm) => void, isPending: boolean, buttonLabel: string) => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome *</FormLabel>
              <FormControl>
                <Input placeholder="Es: Casco di sicurezza" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona categoria" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="DPI">DPI</SelectItem>
                  <SelectItem value="Attrezzatura">Attrezzatura</SelectItem>
                  <SelectItem value="Altro">Altro</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrizione</FormLabel>
              <FormControl>
                <Textarea placeholder="Descrizione opzionale" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Attivo</FormLabel>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Salvataggio..." : buttonLabel}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca tipo attrezzatura..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Aggiungi Tipo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Aggiungi Tipo Attrezzatura</DialogTitle>
              <DialogDescription>Inserisci i dettagli del nuovo tipo di attrezzatura/DPI</DialogDescription>
            </DialogHeader>
            {renderForm(addForm, (data) => createMutation.mutate(data), createMutation.isPending, "Aggiungi")}
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Caricamento...</div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="hidden md:table-cell">Descrizione</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead>Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTypes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nessun tipo di attrezzatura trovato
                  </TableCell>
                </TableRow>
              ) : (
                filteredTypes.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell className="font-medium">{type.name}</TableCell>
                    <TableCell>
                      <Badge variant={getCategoryBadgeVariant(type.category) as any}>
                        {type.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{type.description || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={type.isActive ? "default" : "secondary"}>
                        {type.isActive ? "Attivo" : "Non attivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(type)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(type)} className="text-destructive hover:text-destructive">
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

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica Tipo Attrezzatura</DialogTitle>
          </DialogHeader>
          {renderForm(editForm, (data) => updateMutation.mutate({ id: selectedType!.id, data }), updateMutation.isPending, "Salva")}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare "{selectedType?.name}"? Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedType && deleteMutation.mutate(selectedType.id)}
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
