import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Exam {
  id: string;
  exam_type: string;
  description: string;
  file_path: string;
  file_type: string;
  created_at: string;
}

interface ExamListProps {
  patientId: string;
}

const ExamList = ({ patientId }: ExamListProps) => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchExams();
  }, [patientId]);

  const fetchExams = async () => {
    try {
      const { data, error } = await supabase
        .from("exams")
        .select("*")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setExams(data || []);
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

  const handleDownload = async (filePath: string, examType: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("exam-files")
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${examType}_${new Date().getTime()}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Download iniciado",
        description: "O arquivo está sendo baixado.",
      });
    } catch (error: any) {
      toast({
        title: "Erro no download",
        description: error.message,
        variant: "destructive",
      });
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
                onClick={() => handleDownload(exam.file_path, exam.exam_type)}
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar
              </Button>
            </div>
            <CardDescription className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {format(new Date(exam.created_at), "dd/MM/yyyy 'às' HH:mm")}
            </CardDescription>
          </CardHeader>
          {exam.description && (
            <CardContent>
              <p className="text-sm text-muted-foreground">{exam.description}</p>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
};

export default ExamList;
