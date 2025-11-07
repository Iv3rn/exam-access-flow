import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Activity, Users, FileText, Shield } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    checkAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-light via-background to-medical-light">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <Activity className="h-20 w-20 text-primary" />
          </div>
          <h1 className="text-5xl font-bold text-foreground mb-4">
            Sistema de Gestão de Exames Médicos
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Plataforma completa para gerenciamento de exames médicos com segurança e praticidade
          </p>
          <Button size="lg" onClick={() => navigate("/auth")} className="text-lg px-8">
            Acessar Sistema
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-card p-8 rounded-lg border shadow-sm hover:shadow-md transition-shadow">
            <Shield className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-2xl font-semibold mb-3">Área Administrativa</h3>
            <p className="text-muted-foreground">
              Gerencie funcionários, ative ou desative acessos e mantenha o controle total do sistema.
            </p>
          </div>

          <div className="bg-card p-8 rounded-lg border shadow-sm hover:shadow-md transition-shadow">
            <Users className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-2xl font-semibold mb-3">Área dos Funcionários</h3>
            <p className="text-muted-foreground">
              Cadastre pacientes e envie exames em múltiplos formatos (JPEG, DICOM, PDF) de forma rápida e segura.
            </p>
          </div>

          <div className="bg-card p-8 rounded-lg border shadow-sm hover:shadow-md transition-shadow">
            <FileText className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-2xl font-semibold mb-3">Portal do Paciente</h3>
            <p className="text-muted-foreground">
              Acesse seus exames de qualquer lugar usando CPF e senha, com total segurança e privacidade.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
