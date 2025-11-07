import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Patient {
  id: string;
  full_name: string;
}

interface UploadReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient;
  onSuccess: () => void;
  examId?: string;
}

const UploadReportDialog = ({ open, onOpenChange, patient, onSuccess, examId }: UploadReportDialogProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [exams, setExams] = useState<Array<{ id: string; exam_type: string; created_at: string }>>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>(examId || "");
  const { toast } = useToast();

  useEffect(() => {
    if (open && !examId) {
      fetchExams();
    }
  }, [open, patient.id, examId]);

  useEffect(() => {
    if (examId) {
      setSelectedExamId(examId);
    }
  }, [examId]);

  const fetchExams = async () => {
    const { data } = await supabase
      .from("exams")
      .select("id, exam_type, created_at")
      .eq("patient_id", patient.id)
      .order("created_at", { ascending: false });

    setExams(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      // Convert file to base64
      const fileExt = file.name.split(".").pop();
      const fileName = `laudos/${patient.id}/${Date.now()}.${fileExt}`;
      
      const reader = new FileReader();
      const fileDataPromise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const fileData = await fileDataPromise;

      // Upload to MinIO via edge function
      const { data: uploadData, error: uploadError } = await supabase.functions.invoke('upload-to-minio', {
        body: {
          fileName,
          fileData,
          contentType: file.type,
        },
      });

      if (uploadError) throw uploadError;
      if (!uploadData?.success) throw new Error(uploadData?.error || 'Failed to upload file');

      // Create report record
      const { error: reportError } = await supabase.from("reports").insert({
        patient_id: patient.id,
        exam_id: selectedExamId || null,
        title,
        description,
        file_path: fileName,
        file_type: file.type,
        uploaded_by: user.id,
      });

      if (reportError) throw reportError;

      toast({
        title: "Laudo enviado!",
        description: "O laudo foi carregado com sucesso.",
      });

      setTitle("");
      setDescription("");
      setFile(null);
      setSelectedExamId("");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar Laudo</DialogTitle>
          <DialogDescription>
            Enviar laudo para o paciente: {patient.full_name}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!examId && exams.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="exam">Vincular a um Exame (opcional)</Label>
              <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um exame..." />
                </SelectTrigger>
                <SelectContent>
                  {exams.map((exam) => (
                    <SelectItem key={exam.id} value={exam.id}>
                      {exam.exam_type} - {format(new Date(exam.created_at), "dd/MM/yyyy")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="title">Título do Laudo</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Laudo de Raio-X Tórax"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Observações</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Adicione observações sobre o laudo..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="file">Arquivo do Laudo</Label>
            <Input
              id="file"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              required
            />
            <p className="text-sm text-muted-foreground">
              Formatos aceitos: PDF, DOC, DOCX
            </p>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Enviando..." : "Enviar Laudo"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UploadReportDialog;
