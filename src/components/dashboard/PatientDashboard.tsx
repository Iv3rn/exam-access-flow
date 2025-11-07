import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ExamList from "./ExamList";

interface PatientDashboardProps {
  user: User;
}

const PatientDashboard = ({ user }: PatientDashboardProps) => {
  const [patientId, setPatientId] = useState<string | null>(null);
  const [patientName, setPatientName] = useState("");
  const [examCount, setExamCount] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchPatientData();
  }, [user]);

  const fetchPatientData = async () => {
    try {
      // Link patient by auth user id
      const { data: patient, error } = await supabase
        .from("patients")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      setPatientId(patient.id);
      setPatientName(patient.full_name);

      // Count exams
      const { count } = await supabase
        .from("exams")
        .select("*", { count: "exact", head: true })
        .eq("patient_id", patient.id);

      setExamCount(count || 0);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
      });
    }
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
          <div>
            <h1 className="text-2xl font-bold text-primary">Portal do Paciente</h1>
            <p className="text-sm text-muted-foreground">{patientName}</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Meus Exames
              </CardTitle>
              <CardDescription>
                Você tem {examCount} {examCount === 1 ? 'exame' : 'exames'} disponível
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {patientId && <ExamList patientId={patientId} />}
      </main>
    </div>
  );
};

export default PatientDashboard;
