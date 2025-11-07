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
    const { fileName, fileData, contentType } = await req.json();

    console.log('Uploading file to MinIO:', fileName);

    // Configure S3 client for MinIO
    const s3Client = new S3Client({
      endPoint: Deno.env.get('MINIO_ENDPOINT')?.replace('https://', '').replace('http://', '') || '',
      port: 443,
      useSSL: true,
      region: 'us-east-1',
      accessKey: Deno.env.get('MINIO_ACCESS_KEY') || '',
      secretKey: Deno.env.get('MINIO_SECRET_KEY') || '',
      bucket: Deno.env.get('MINIO_BUCKET_NAME') || '',
      pathStyle: true,
    });

    // Convert base64 to Uint8Array
    const binaryString = atob(fileData);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Upload to MinIO using putObject method
    await s3Client.putObject(fileName, bytes, {
      metadata: {
        'Content-Type': contentType,
      },
    });

    console.log('File uploaded successfully:', fileName);

    return new Response(
      JSON.stringify({ 
        success: true, 
        filePath: fileName,
        message: 'File uploaded to MinIO successfully' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error uploading to MinIO:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to upload file to MinIO',
        details: error.toString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
