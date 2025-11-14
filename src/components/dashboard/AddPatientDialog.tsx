import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface AddPatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const AddPatientDialog = ({ open, onOpenChange, onSuccess }: AddPatientDialogProps) => {
  const [cpf, setCpf] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<"M" | "F">("M");
  const [tempPassword, setTempPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      const { data, error } = await supabase.functions.invoke('create-patient', {
        body: {
          cpf,
          full_name: fullName,
          email,
          phone,
          gender,
          password: tempPassword,
          created_by: user.id,
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "Paciente cadastrado!",
        description: "O paciente foi adicionado com sucesso.",
      });

      setCpf("");
      setFullName("");
      setEmail("");
      setPhone("");
      setGender("M");
      setTempPassword("");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cadastrar Paciente</DialogTitle>
          <DialogDescription>
            Preencha os dados para cadastrar um novo paciente no sistema.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              placeholder="000.000.000-00"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fullName">Nome Completo</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Sexo</Label>
            <RadioGroup value={gender} onValueChange={(value) => setGender(value as "M" | "F")}>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="M" id="male" />
                  <Label htmlFor="male" className="font-normal cursor-pointer">Masculino</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="F" id="female" />
                  <Label htmlFor="female" className="font-normal cursor-pointer">Feminino</Label>
                </div>
              </div>
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tempPassword">Senha Temporária</Label>
            <Input
              id="tempPassword"
              type="password"
              value={tempPassword}
              onChange={(e) => setTempPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Cadastrando..." : "Cadastrar Paciente"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddPatientDialog;
