import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { FileText, Calendar, Eye, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import FilePreviewDialog from "./FilePreviewDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface Patient {
  id: string;
  full_name: string;
  cpf: string;
}

interface FileItem {
  id: string;
  type: "exam" | "report";
  title: string;
  description: string | null;
  file_path: string;
  file_type: string;
  created_at: string;
  exam_type?: string;
}

const PatientFilesView = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<FileItem | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      fetchFiles();
    }
  }, [selectedPatientId]);

  const fetchPatients = async () => {
    const { data, error } = await supabase
      .from("patients")
      .select("id, full_name, cpf")
      .order("full_name");

    if (error) {
      toast({
        title: "Erro ao carregar pacientes",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setPatients(data || []);
  };

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const [examsResponse, reportsResponse] = await Promise.all([
        supabase
          .from("exams")
          .select("*")
          .eq("patient_id", selectedPatientId)
          .order("created_at", { ascending: false }),
        supabase
          .from("reports")
          .select("*")
          .eq("patient_id", selectedPatientId)
          .order("created_at", { ascending: false }),
      ]);

      const examFiles: FileItem[] = (examsResponse.data || []).map((exam) => ({
        id: exam.id,
        type: "exam" as const,
        title: exam.exam_type,
        description: exam.description,
        file_path: exam.file_path,
        file_type: exam.file_type,
        created_at: exam.created_at,
        exam_type: exam.exam_type,
      }));

      const reportFiles: FileItem[] = (reportsResponse.data || []).map((report) => ({
        id: report.id,
        type: "report" as const,
        title: report.title,
        description: report.description,
        file_path: report.file_path,
        file_type: report.file_type,
        created_at: report.created_at,
      }));

      const allFiles = [...examFiles, ...reportFiles].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setFiles(allFiles);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar arquivos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = (file: FileItem) => {
    setPreviewFile(file);
    setShowPreview(true);
  };

  const handleDeleteClick = (file: FileItem) => {
    setFileToDelete(file);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!fileToDelete) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const tableName = fileToDelete.type === "exam" ? "exams" : "reports";
      const { error } = await supabase.from(tableName).delete().eq("id", fileToDelete.id);

      if (error) throw error;

      // Log activity
      await supabase.from("activity_logs").insert({
        user_id: user.id,
        action: "delete",
        entity_type: fileToDelete.type,
        entity_id: fileToDelete.id,
        details: {
          title: fileToDelete.title,
          patient_id: selectedPatientId,
        },
      });

      toast({
        title: "Arquivo excluído",
        description: `${fileToDelete.type === "exam" ? "Exame" : "Laudo"} excluído com sucesso.`,
      });

      fetchFiles();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir arquivo",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setShowDeleteDialog(false);
      setFileToDelete(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Exames e Laudos dos Pacientes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um paciente" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.full_name} - {patient.cpf}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedPatientId && (
            <>
              {loading ? (
                <p className="text-muted-foreground text-center py-8">Carregando...</p>
              ) : files.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum arquivo encontrado para este paciente.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {files.map((file) => (
                      <TableRow key={`${file.type}-${file.id}`}>
                        <TableCell>
                          <Badge variant={file.type === "exam" ? "default" : "secondary"}>
                            {file.type === "exam" ? "Exame" : "Laudo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{file.title}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {file.description || "Sem descrição"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(file.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </div>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePreview(file)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Visualizar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(file)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {previewFile && (
        <FilePreviewDialog
          open={showPreview}
          onOpenChange={setShowPreview}
          filePath={previewFile.file_path}
          fileType={previewFile.file_type}
          fileName={`${previewFile.title}.${previewFile.file_path.split(".").pop()}`}
        />
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este {fileToDelete?.type === "exam" ? "exame" : "laudo"}?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PatientFilesView;
