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
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, [open, filePath]);

  const loadFile = async () => {
    try {
      setLoading(true);
      
      // Download from MinIO via edge function
      const { data, error } = await supabase.functions.invoke('download-from-minio', {
        body: { filePath },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to download file');

      // Convert base64 to blob
      const base64 = data.fileData;
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: fileType });
      const url = URL.createObjectURL(blob);
      
      setFileUrl(url);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar arquivo",
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
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast({
        title: "Download iniciado",
        description: "O arquivo está sendo baixado.",
      });
    }
  };

  const isImage = fileType.startsWith("image/");
  const isPDF = fileType === "application/pdf";

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
                <img 
                  src={fileUrl} 
                  alt={fileName} 
                  className="max-w-full max-h-[70vh] object-contain"
                />
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
                    Visualização não disponível para este tipo de arquivo.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Clique em "Baixar" para fazer o download.
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
