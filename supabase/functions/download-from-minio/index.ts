import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { S3Client } from "https://deno.land/x/s3_lite_client@0.7.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Detect HTTP/HTTPS and correct port from endpoint (same logic as upload)
  function resolveConnectionSettings(endpoint: string | undefined) {
    if (!endpoint) throw new Error('MINIO_ENDPOINT não definido.');
    const isSecure = endpoint.startsWith('https://');
    const cleanEndpoint = endpoint.replace('https://', '').replace('http://', '');
    return {
      endPoint: cleanEndpoint,
      port: isSecure ? 443 : 9000,
      useSSL: isSecure,
    } as const;
  }

  try {
    const { filePath } = await req.json();

    console.log('Downloading file from MinIO:', filePath);

    // Configure S3 client for MinIO
    const endpoint = Deno.env.get('MINIO_ENDPOINT') || '';
    const { endPoint, port, useSSL } = resolveConnectionSettings(endpoint);
    const bucket = Deno.env.get('MINIO_BUCKET_NAME') || 'examescsne';

    const s3Client = new S3Client({
      endPoint,
      port,
      useSSL,
      region: 'us-east-1',
      accessKey: Deno.env.get('MINIO_ACCESS_KEY') || '',
      secretKey: Deno.env.get('MINIO_SECRET_KEY') || '',
      bucket,
      pathStyle: true,
    });

    const obj = await s3Client.getObject(filePath);
    const bytes = await obj.arrayBuffer();

    const contentType = obj.headers.get("Content-Type") ?? "application/pdf";

    return new Response(JSON.stringify({
      success: true,
      fileData: btoa(String.fromCharCode(...new Uint8Array(bytes))),
      fileType: contentType,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" }});

  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Erro desconhecido';
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
