import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Users, UserPlus, Activity, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import StaffList from "./StaffList";
import AddStaffDialog from "./AddStaffDialog";
import ExamTypesList from "./ExamTypesList";
import ClinicLogoUpload from "./ClinicLogoUpload";
import logoInovai from "@/assets/logo-inovai.png";

interface AdminDashboardProps {
  user: User;
}

const AdminDashboard = ({ user }: AdminDashboardProps) => {
  const [staffCount, setStaffCount] = useState(0);
  const [examTypesCount, setExamTypesCount] = useState(0);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchStaffCount();
    fetchExamTypesCount();
  }, []);

  const fetchStaffCount = async () => {
    const { count } = await supabase
      .from("user_roles")
      .select("*", { count: "exact", head: true })
      .eq("role", "staff");

    setStaffCount(count || 0);
  };

  const fetchExamTypesCount = async () => {
    const { count } = await supabase
      .from("exam_types")
      .select("*", { count: "exact", head: true })
      .eq("active", true);

    setExamTypesCount(count || 0);
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
            <img src={logoInovai} alt="InovAI" className="h-8" />
            <h1 className="text-2xl font-bold text-primary">Painel Administrativo</h1>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-3 mb-8">
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
                <FileText className="h-5 w-5" />
                Tipos de Exames
              </CardTitle>
              <CardDescription>Total de tipos de exames cadastrados</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-primary">{examTypesCount}</p>
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

        <div className="space-y-8">
          <ClinicLogoUpload />
          <StaffList onUpdate={fetchStaffCount} />
          <ExamTypesList onUpdate={fetchExamTypesCount} />
        </div>
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
