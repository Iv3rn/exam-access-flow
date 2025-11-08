import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { S3Client } from "https://deno.land/x/s3_lite_client@0.7.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { filePath } = await req.json();

    if (!filePath) {
      return new Response(
        JSON.stringify({ error: "filePath is required" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const s3Client = new S3Client({
      endPoint: Deno.env.get("MINIO_ENDPOINT") || "localhost",
      port: parseInt(Deno.env.get("MINIO_PORT") || "9000"),
      useSSL: Deno.env.get("MINIO_USE_SSL") === "true",
      region: "us-east-1",
      accessKey: Deno.env.get("MINIO_ACCESS_KEY") || "",
      secretKey: Deno.env.get("MINIO_SECRET_KEY") || "",
      bucket: Deno.env.get("MINIO_BUCKET_NAME") || "exam-files",
      pathStyle: true,
    });

    const file = await s3Client.getObject(filePath);

    if (!file || !file.body) {
      return new Response(
        JSON.stringify({ error: "File not found" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        }
      );
    }

    // Read stream into Uint8Array
    const reader = file.body.getReader();
    const chunks: Uint8Array[] = [];
    let totalLength = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      totalLength += value.length;
    }

    const uint8Array = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      uint8Array.set(chunk, offset);
      offset += chunk.length;
    }

    // Convert to base64
    const base64 = btoa(String.fromCharCode(...uint8Array));

    return new Response(
      JSON.stringify({ success: true, fileData: base64 }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Download error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Download failed",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
