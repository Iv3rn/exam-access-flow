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
    const { fileName, fileData, contentType } = await req.json();

    if (!fileName || !fileData) {
      return new Response(
        JSON.stringify({ error: "fileName and fileData are required" }),
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

    // Decode base64 fileData
    const uint8Array = Uint8Array.from(atob(fileData), (c) => c.charCodeAt(0));

    await s3Client.putObject(fileName, uint8Array, {
      metadata: {
        "Content-Type": contentType || "application/octet-stream",
      },
    });

    return new Response(
      JSON.stringify({ success: true, filePath: fileName }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Upload error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Upload failed",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
