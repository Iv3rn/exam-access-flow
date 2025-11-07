import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileUp, ClipboardPlus, MoreVertical } from "lucide-react";
import UploadExamDialog from "./UploadExamDialog";
import UploadReportDialog from "./UploadReportDialog";

interface Patient {
  id: string;
  cpf: string;
  full_name: string;
  email: string;
  phone: string;
}

interface PatientListProps {
  onUpdate: () => void;
}

const PatientList = ({ onUpdate }: PatientListProps) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showUploadExam, setShowUploadExam] = useState(false);
  const [showUploadReport, setShowUploadReport] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Erro ao carregar pacientes",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setPatients(data || []);
    setLoading(false);
  };

  const handleUploadExamClick = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowUploadExam(true);
  };

  const handleUploadReportClick = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowUploadReport(true);
  };

  if (loading) {
    return <p className="text-muted-foreground">Carregando...</p>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Pacientes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell className="font-medium">{patient.full_name}</TableCell>
                  <TableCell>{patient.cpf}</TableCell>
                  <TableCell>{patient.email || "N/A"}</TableCell>
                  <TableCell>{patient.phone || "N/A"}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleUploadExamClick(patient)}>
                          <FileUp className="h-4 w-4 mr-2" />
                          Enviar Exame
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUploadReportClick(patient)}>
                          <ClipboardPlus className="h-4 w-4 mr-2" />
                          Enviar Laudo
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedPatient && (
        <>
          <UploadExamDialog
            open={showUploadExam}
            onOpenChange={setShowUploadExam}
            patient={selectedPatient}
            onSuccess={() => {
              onUpdate();
              fetchPatients();
            }}
          />
          <UploadReportDialog
            open={showUploadReport}
            onOpenChange={setShowUploadReport}
            patient={selectedPatient}
            onSuccess={() => {
              onUpdate();
              fetchPatients();
            }}
          />
        </>
      )}
    </>
  );
};

export default PatientList;
