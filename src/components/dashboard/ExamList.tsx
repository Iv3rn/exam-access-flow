import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, FileText, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import FilePreviewDialog from "./FilePreviewDialog";

interface Report {
  id: string;
  title: string;
  description: string;
  file_path: string;
  file_type: string;
  created_at: string;
}

interface Exam {
  id: string;
  exam_type: string;
  description: string;
  file_path: string;
  file_type: string;
  created_at: string;
  reports?: Report[];
}

interface ExamListProps {
  patientId: string;
}

const ExamList = ({ patientId }: ExamListProps) => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState<{ path: string; type: string; name: string } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchExams();
  }, [patientId]);

  const fetchExams = async () => {
    try {
      const { data: examsData, error: examsError } = await supabase
        .from("exams")
        .select("*")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false });

      if (examsError) throw examsError;

      // Fetch reports for each exam
      const examsWithReports = await Promise.all(
        (examsData || []).map(async (exam) => {
          const { data: reports } = await supabase
            .from("reports")
            .select("*")
            .eq("exam_id", exam.id)
            .order("created_at", { ascending: false });

          return { ...exam, reports: reports || [] };
        })
      );

      setExams(examsWithReports);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar exames",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando exames...</div>;
  }

  if (exams.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            Nenhum exame disponível no momento.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {exams.map((exam) => (
          <Card key={exam.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{exam.exam_type}</CardTitle>
                </div>
                <Button
                  size="sm"
                  onClick={() => setPreviewFile({ 
                    path: exam.file_path, 
                    type: exam.file_type,
                    name: exam.exam_type 
                  })}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Visualizar Exame
                </Button>
              </div>
              <CardDescription className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {format(new Date(exam.created_at), "dd/MM/yyyy 'às' HH:mm")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {exam.description && (
                <p className="text-sm text-muted-foreground">{exam.description}</p>
              )}
              
              {exam.reports && exam.reports.length > 0 && (
                <div className="border-t pt-4 space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">Laudos Associados:</h4>
                  {exam.reports.map((report) => (
                    <div key={report.id} className="bg-muted/50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium">{report.title}</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setPreviewFile({ 
                            path: report.file_path, 
                            type: report.file_type,
                            name: report.title 
                          })}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Ver Laudo
                        </Button>
                      </div>
                      {report.description && (
                        <p className="text-xs text-muted-foreground">{report.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(report.created_at), "dd/MM/yyyy 'às' HH:mm")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {previewFile && (
        <FilePreviewDialog
          open={!!previewFile}
          onOpenChange={(open) => !open && setPreviewFile(null)}
          filePath={previewFile.path}
          fileType={previewFile.type}
          fileName={previewFile.name}
        />
      )}
    </>
  );
};

export default ExamList;
