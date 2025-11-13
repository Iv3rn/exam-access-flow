import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, UserPlus, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import PatientList from "./PatientList";
import AddPatientDialog from "./AddPatientDialog";
import logoInovai from "@/assets/logo-inovai.png";

interface StaffDashboardProps {
  user: User;
}

const StaffDashboard = ({ user }: StaffDashboardProps) => {
  const [patientCount, setPatientCount] = useState(0);
  const [examCount, setExamCount] = useState(0);
  const [reportCount, setReportCount] = useState(0);
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchCounts();
  }, []);

  const fetchCounts = async () => {
    const { count: patients } = await supabase
      .from("patients")
      .select("*", { count: "exact", head: true });

    const { count: exams } = await supabase
      .from("exams")
      .select("*", { count: "exact", head: true });

    const { count: reports } = await supabase
      .from("reports")
      .select("*", { count: "exact", head: true });

    setPatientCount(patients || 0);
    setExamCount(exams || 0);
    setReportCount(reports || 0);
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
          <div className="flex items-center gap-4">
            <img src={logoInovai} alt="InovAI" className="h-8" />
            <h1 className="text-2xl font-bold text-primary">Painel do Funcionário</h1>
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
              <CardTitle>Pacientes</CardTitle>
              <CardDescription>Total de pacientes cadastrados</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-primary">{patientCount}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Exames
              </CardTitle>
              <CardDescription>Total de exames enviados</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-primary">{examCount}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Laudos
              </CardTitle>
              <CardDescription>Total de laudos enviados</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-primary">{reportCount}</p>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6">
          <Button onClick={() => setShowAddPatient(true)} size="lg">
            <UserPlus className="mr-2 h-5 w-5" />
            Novo Paciente
          </Button>
        </div>

        <PatientList key={refreshKey} onUpdate={fetchCounts} />
      </main>

      <AddPatientDialog
        open={showAddPatient}
        onOpenChange={setShowAddPatient}
        onSuccess={() => {
          fetchCounts();
          setRefreshKey(prev => prev + 1);
        }}
      />
    </div>
  );
};

export default StaffDashboard;
