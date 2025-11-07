import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Client } from "minio";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Vars obrigatórias
const {
  MINIO_ENDPOINT,
  MINIO_PORT = 9000,
  MINIO_USE_SSL = "false",
  MINIO_ACCESS_KEY,
  MINIO_SECRET_KEY,
  MINIO_BUCKET
} = process.env;

if (!MINIO_ENDPOINT || !MINIO_ACCESS_KEY || !MINIO_SECRET_KEY || !MINIO_BUCKET) {
  console.error("Variáveis MINIO_* ausentes.");
  process.exit(1);
}

const minio = new Client({
  endPoint: MINIO_ENDPOINT,
  port: Number(MINIO_PORT),
  useSSL: String(MINIO_USE_SSL) === "true",
  accessKey: MINIO_ACCESS_KEY,
  secretKey: MINIO_SECRET_KEY
});

// Health
app.get("/health", (_req, res) => res.json({ ok: true }));

// Presigned PUT
app.post("/presigned", async (req, res) => {
  try {
    const { filename, contentType = "application/octet-stream", prefix = "" } = req.body;

    if (!filename) return res.status(400).json({ error: "filename é obrigatório" });

    const objectName = prefix ? `${prefix.replace(/\/$/, "")}/${filename}` : filename;

    const url = await minio.presignedPutObject(
      MINIO_BUCKET,
      objectName,
      60,
      { "Content-Type": contentType }
    );

    res.json({ url, objectName });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Falha ao gerar URL" });
  }
});

// Presigned GET
app.post("/download", async (req, res) => {
  try {
    const { objectName } = req.body;
    if (!objectName) return res.status(400).json({ error: "objectName é obrigatório" });

    const url = await minio.presignedGetObject(MINIO_BUCKET, objectName, 300);
    res.json({ url });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erro ao gerar URL de download" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Presigner rodando na porta ${PORT}`));

