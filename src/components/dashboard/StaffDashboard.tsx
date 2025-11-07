import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, UserPlus, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import PatientList from "./PatientList";
import AddPatientDialog from "./AddPatientDialog";

interface StaffDashboardProps {
  user: User;
}

const StaffDashboard = ({ user }: StaffDashboardProps) => {
  const [patientCount, setPatientCount] = useState(0);
  const [examCount, setExamCount] = useState(0);
  const [showAddPatient, setShowAddPatient] = useState(false);
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

    setPatientCount(patients || 0);
    setExamCount(exams || 0);
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
          <h1 className="text-2xl font-bold text-primary">Painel do Funcionário</h1>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
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
                <UserPlus className="h-5 w-5" />
                Ações Rápidas
              </CardTitle>
              <CardDescription>Gerencie pacientes</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setShowAddPatient(true)} className="w-full">
                Novo Paciente
              </Button>
            </CardContent>
          </Card>
        </div>

        <PatientList onUpdate={fetchCounts} />
      </main>

      <AddPatientDialog
        open={showAddPatient}
        onOpenChange={setShowAddPatient}
        onSuccess={fetchCounts}
      />
    </div>
  );
};

export default StaffDashboard;
