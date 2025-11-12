import { useState } from "react";
import { uploadWithPresignedUrl } from "../services/upload";

export default function FileUploader() {
  const [status, setStatus] = useState("");

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    setStatus("Enviando...");

    try {
      // Envia para a pasta "uploads/"
      const result = await uploadWithPresignedUrl(file, "uploads/");
      setStatus(`Enviado: ${result.objectName}`);
    } catch (err) {
      console.error(err);
      setStatus("Erro no upload");
    }
  }

  return (
    <div className="space-y-4">
      <input type="file" onChange={handleUpload} />

      <p className="text-sm">{status}</p>
    </div>
  );
}
