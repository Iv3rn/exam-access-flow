import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { S3Client } from "https://deno.land/x/s3_lite_client@0.7.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { filePath } = await req.json();

    console.log('Downloading file from MinIO:', filePath);

    // Configure S3 client for MinIO
    const bucket = Deno.env.get('MINIO_BUCKET_NAME') || 'examescsne';
    
    const s3Client = new S3Client({
      endPoint: Deno.env.get('MINIO_ENDPOINT')?.replace('https://', '').replace('http://', '') || '',
      port: 443,
      useSSL: true,
      region: 'us-east-1',
      accessKey: Deno.env.get('MINIO_ACCESS_KEY') || '',
      secretKey: Deno.env.get('MINIO_SECRET_KEY') || '',
      bucket,
      pathStyle: true,
    });

    // Get object from MinIO
    const file = await s3Client.getObject(filePath);
    
    if (!file || !file.body) {
      throw new Error('File not found');
    }

    // Read the stream and convert to Uint8Array
    const reader = file.body.getReader();
    const chunks: Uint8Array[] = [];
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    // Concatenate all chunks
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const bytes = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }

    // Convert to base64
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);

    console.log('File downloaded successfully:', filePath);

    return new Response(
      JSON.stringify({ 
        success: true,
        fileData: base64,
        contentType: 'application/octet-stream'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error downloading from MinIO:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to download file from MinIO',
        details: error.toString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
