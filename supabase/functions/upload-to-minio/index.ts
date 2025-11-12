import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { S3Client } from "https://deno.land/x/s3_lite_client@0.7.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Detecta automaticamente HTTP/HTTPS e porta correta
function resolveConnectionSettings(endpoint: string | undefined) {
  if (!endpoint) {
    throw new Error("MINIO_ENDPOINT não definido.");
  }

  const isSecure = endpoint.startsWith("https://");
  const cleanEndpoint = endpoint.replace("https://", "").replace("http://", "");

  return {
    endPoint: cleanEndpoint,
    port: isSecure ? 443 : 9000,
    useSSL: isSecure,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileName, fileData, contentType } = await req.json();

    console.log("Uploading file to MinIO:", fileName);

    // Configura o cliente S3 automaticamente conforme protocolo
    const endpoint = Deno.env.get("MINIO_ENDPOINT") || "";
    const { endPoint, port, useSSL } = resolveConnectionSettings(endpoint);

    const bucket = Deno.env.get("MINIO_BUCKET_NAME") || "examescsne";
    
    const s3Client = new S3Client({
      endPoint,
      port,
      useSSL,
      region: "us-east-1",
      accessKey: Deno.env.get("MINIO_ACCESS_KEY") || "",
      secretKey: Deno.env.get("MINIO_SECRET_KEY") || "",
      bucket,
      pathStyle: true,
    });

    // Converte Base64 para bytes
    const binaryString = atob(fileData);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Faz upload no MinIO
    await s3Client.putObject(fileName, bytes, {
      metadata: {
        "Content-Type": contentType,
      },
    });

    console.log("File uploaded successfully:", fileName);

    return new Response(
      JSON.stringify({
        success: true,
        filePath: fileName,
        message: "File uploaded to MinIO successfully",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error uploading to MinIO:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to upload file to MinIO",
        details: error.toString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
