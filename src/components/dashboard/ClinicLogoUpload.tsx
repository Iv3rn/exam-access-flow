import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, Image } from "lucide-react";

const ClinicLogoUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(null);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCurrentLogo();
  }, []);

  const fetchCurrentLogo = async () => {
    try {
      const { data, error } = await supabase
        .from("clinic_settings")
        .select("*")
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSettingsId(data.id);
        if (data.logo_path) {
          const { data: urlData } = supabase.storage
            .from("clinic-logos")
            .getPublicUrl(data.logo_path);
          setCurrentLogoUrl(urlData.publicUrl);
        }
      }
    } catch (error: any) {
      console.error("Erro ao buscar logo:", error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione uma imagem PNG",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `clinic-logo-${Date.now()}.${fileExt}`;

      // Upload para o storage
      const { error: uploadError } = await supabase.storage
        .from("clinic-logos")
        .upload(fileName, file, {
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      // Atualizar ou inserir configurações
      if (settingsId) {
        const { error: updateError } = await supabase
          .from("clinic_settings")
          .update({ logo_path: fileName })
          .eq("id", settingsId);

        if (updateError) throw updateError;
      } else {
        const { data, error: insertError } = await supabase
          .from("clinic_settings")
          .insert({ logo_path: fileName })
          .select()
          .single();

        if (insertError) throw insertError;
        setSettingsId(data.id);
      }

      toast({
        title: "Logo atualizada com sucesso!",
        description: "A logo da clínica foi atualizada.",
      });

      fetchCurrentLogo();
    } catch (error: any) {
      toast({
        title: "Erro ao fazer upload",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5" />
          Logomarca da Clínica
        </CardTitle>
        <CardDescription>
          Adicione ou atualize a logo da clínica que aparecerá no portal do paciente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentLogoUrl && (
          <div className="flex items-center justify-center p-4 bg-muted rounded-lg">
            <img
              src={currentLogoUrl}
              alt="Logo da Clínica"
              className="max-h-32 object-contain"
            />
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="logo-upload">Selecionar nova logo (PNG)</Label>
          <Input
            id="logo-upload"
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            onChange={handleFileUpload}
            disabled={uploading}
          />
        </div>
        
        {uploading && (
          <p className="text-sm text-muted-foreground">Fazendo upload...</p>
        )}
      </CardContent>
    </Card>
  );
};

export default ClinicLogoUpload;