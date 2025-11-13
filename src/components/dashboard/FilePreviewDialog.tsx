import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FilePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filePath: string;
  fileType: string;
  fileName: string;
}

const FilePreviewDialog = ({ open, onOpenChange, filePath, fileType, fileName }: FilePreviewDialogProps) => {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadFile();
    }
    return () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl);
    };
  }, [open, filePath]);

  const loadFile = async () => {
    try {
      setLoading(true);

      // 🔥 NOVO → chamamos uma edge function que retorna uma Signed URL
      const { data, error } = await supabase.functions.invoke("get-minio-url", {
        body: { filePath },
      });

      if (error) throw error;
      if (!data?.signedUrl) throw new Error("URL inválida retornada do servidor.");

      setFileUrl(data.signedUrl);
    } catch (error: any) {
      toast({
        title: "Erro ao abrir arquivo",
        description: error.message,
        variant: "destructive",
      });
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (fileUrl) {
      const a = document.createElement("a");
      a.href = fileUrl;
      a.download = fileName;
      a.click();
    }
  };

  const isPDF = fileType === "application/pdf";
  const isImage = fileType.startsWith("image/");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{fileName}</DialogTitle>
            <Button size="sm" onClick={handleDownload} disabled={!fileUrl}>
              <Download className="h-4 w-4 mr-2" />
              Baixar
            </Button>
          </div>
        </DialogHeader>

        <div className="flex items-center justify-center min-h-[400px] bg-muted rounded-lg overflow-auto">
          {loading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Carregando arquivo...</p>
            </div>
          ) : (
            <>
              {isImage && fileUrl && (
                <img src={fileUrl} alt={fileName} className="max-w-full max-h-[70vh] object-contain" />
              )}

              {isPDF && fileUrl && (
                <iframe
                  src={fileUrl}
                  className="w-full h-[70vh]"
                  title={fileName}
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                />
              )}

              {!isImage && !isPDF && (
                <div className="text-center p-8">
                  <p className="text-muted-foreground">
                    Visualização não disponível.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Clique em “Baixar” para abrir o arquivo.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FilePreviewDialog;
