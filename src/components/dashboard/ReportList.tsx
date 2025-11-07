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

interface ReportListProps {
  patientId: string;
}

const ReportList = ({ patientId }: ReportListProps) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState<{ path: string; type: string; name: string } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchReports();
  }, [patientId]);

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setReports(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar laudos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando laudos...</div>;
  }

  if (reports.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            Nenhum laudo disponível no momento.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {reports.map((report) => (
          <Card key={report.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{report.title}</CardTitle>
                </div>
                <Button
                  size="sm"
                  onClick={() => setPreviewFile({ 
                    path: report.file_path, 
                    type: report.file_type,
                    name: report.title 
                  })}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Visualizar
                </Button>
              </div>
              <CardDescription className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {format(new Date(report.created_at), "dd/MM/yyyy 'às' HH:mm")}
              </CardDescription>
            </CardHeader>
            {report.description && (
              <CardContent>
                <p className="text-sm text-muted-foreground">{report.description}</p>
              </CardContent>
            )}
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

export default ReportList;
