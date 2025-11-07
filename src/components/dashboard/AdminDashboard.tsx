import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Users, UserPlus, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import StaffList from "./StaffList";
import AddStaffDialog from "./AddStaffDialog";

interface AdminDashboardProps {
  user: User;
}

const AdminDashboard = ({ user }: AdminDashboardProps) => {
  const [staffCount, setStaffCount] = useState(0);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchStaffCount();
  }, []);

  const fetchStaffCount = async () => {
    const { count } = await supabase
      .from("user_roles")
      .select("*", { count: "exact", head: true })
      .eq("role", "staff");

    setStaffCount(count || 0);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
    toast({
      title: "Logout realizado",
      description: "Até logo!",
    });
  };

  return (
    <div className="min-h-screen bg-medical-light">
      <header className="bg-card border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Activity className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-primary">Painel Administrativo</h1>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Funcionários Ativos
              </CardTitle>
              <CardDescription>Total de funcionários cadastrados no sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-primary">{staffCount}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Ações Rápidas
              </CardTitle>
              <CardDescription>Gerencie funcionários do sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setShowAddStaff(true)} className="w-full">
                Adicionar Funcionário
              </Button>
            </CardContent>
          </Card>
        </div>

        <StaffList onUpdate={fetchStaffCount} />
      </main>

      <AddStaffDialog
        open={showAddStaff}
        onOpenChange={setShowAddStaff}
        onSuccess={fetchStaffCount}
      />
    </div>
  );
};

export default AdminDashboard;
