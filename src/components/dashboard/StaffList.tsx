import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Shield, ShieldOff } from "lucide-react";

interface Staff {
  id: string;
  user_id: string;
  role: string;
  active: boolean;
  profiles: {
    full_name: string;
    email: string;
  };
}

interface StaffListProps {
  onUpdate: () => void;
}

const StaffList = ({ onUpdate }: StaffListProps) => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("*")
      .eq("role", "staff")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Erro ao carregar funcionários",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Fetch profiles separately
    const userIds = data?.map(role => role.user_id) || [];
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", userIds);

    // Merge data
    const mergedData = data?.map(role => ({
      ...role,
      profiles: profilesData?.find(p => p.id === role.user_id) || { full_name: "N/A", email: "N/A" }
    })) || [];

    setStaff(mergedData);
    setLoading(false);
  };

  const toggleStaffStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("user_roles")
      .update({ active: !currentStatus })
      .eq("id", id);

    if (error) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Status atualizado",
      description: `Funcionário ${!currentStatus ? "ativado" : "desativado"} com sucesso.`,
    });

    fetchStaff();
    onUpdate();
  };

  if (loading) {
    return <p className="text-muted-foreground">Carregando...</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lista de Funcionários</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="font-medium">
                  {member.profiles?.full_name || "N/A"}
                </TableCell>
                <TableCell>{member.profiles?.email || "N/A"}</TableCell>
                <TableCell>
                  <Badge variant={member.active ? "default" : "secondary"}>
                    {member.active ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleStaffStatus(member.id, member.active)}
                  >
                    {member.active ? (
                      <ShieldOff className="h-4 w-4" />
                    ) : (
                      <Shield className="h-4 w-4" />
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default StaffList;
