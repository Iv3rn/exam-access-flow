import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Patient {
  id: string;
  full_name: string;
}

interface UploadExamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient;
  onSuccess: () => void;
}

const UploadExamDialog = ({ open, onOpenChange, patient, onSuccess }: UploadExamDialogProps) => {
  const [examType, setExamType] = useState("");
  const [examTypes, setExamTypes] = useState<Array<{ id: string; name: string }>>([]);
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchExamTypes = async () => {
      const { data, error } = await supabase
        .from("exam_types")
        .select("id, name")
        .eq("active", true)
        .order("name", { ascending: true });

      if (error) {
        toast({
          title: "Erro ao carregar tipos de exame",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setExamTypes(data || []);
      }
    };

    if (open) {
      fetchExamTypes();
    }
  }, [open, toast]);

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
      const fileName = `${patient.id}/${Date.now()}.${fileExt}`;
      
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

      // Create exam record
      const { error: examError } = await supabase.from("exams").insert({
        patient_id: patient.id,
        exam_type: examType,
        description,
        file_path: fileName,
        file_type: file.type,
        uploaded_by: user.id,
      });

      if (examError) throw examError;

      toast({
        title: "Exame enviado!",
        description: "O exame foi carregado com sucesso no MinIO.",
      });

      setExamType("");
      setDescription("");
      setFile(null);
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
          <DialogTitle>Enviar Exame</DialogTitle>
          <DialogDescription>
            Enviar exame para o paciente: {patient.full_name}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="examType">Tipo de Exame</Label>
            <Select value={examType} onValueChange={setExamType} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {examTypes.map((type) => (
                  <SelectItem key={type.id} value={type.name}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Adicione observações sobre o exame..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="file">Arquivo do Exame</Label>
            <Input
              id="file"
              type="file"
              accept=".jpg,.jpeg,.pdf,.dcm"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              required
            />
            <p className="text-sm text-muted-foreground">
              Formatos aceitos: JPEG, PDF, DICOM
            </p>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Enviando..." : "Enviar Exame"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UploadExamDialog;
