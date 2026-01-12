import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function SetPasswordForm() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const setPasswordMutation = useMutation({
    mutationFn: async (password: string) => {
      const res = await fetch("/api/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ newPassword: password }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Errore durante impostazione password");
      }

      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Password impostata",
        description: "Password impostata con successo. Effettua nuovamente il login.",
      });
      // Redirect to login after short delay
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (newPassword.length < 8) {
      toast({
        title: "Password troppo corta",
        description: "La password deve essere di almeno 8 caratteri",
        variant: "destructive",
      });
      return;
    }

    if (!/[A-Z]/.test(newPassword)) {
      toast({
        title: "Password non valida",
        description: "La password deve contenere almeno una lettera maiuscola",
        variant: "destructive",
      });
      return;
    }

    if (!/[0-9]/.test(newPassword)) {
      toast({
        title: "Password non valida",
        description: "La password deve contenere almeno un numero",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Password non corrispondono",
        description: "Le due password inserite non corrispondono",
        variant: "destructive",
      });
      return;
    }

    setPasswordMutation.mutate(newPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Imposta Password</CardTitle>
          <CardDescription>
            Stai utilizzando una password temporanea. Imposta una nuova password per continuare.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nuova Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Inserisci nuova password"
                required
                disabled={setPasswordMutation.isPending}
              />
              <p className="text-xs text-muted-foreground">
                Minimo 8 caratteri, almeno una maiuscola e un numero
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Conferma Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Conferma password"
                required
                disabled={setPasswordMutation.isPending}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={setPasswordMutation.isPending}
            >
              {setPasswordMutation.isPending ? "Impostazione..." : "Imposta Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
