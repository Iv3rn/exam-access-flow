export async function getPresignedUrl(filename, contentType, prefix = "") {
  const base = import.meta.env.VITE_PRESIGNER_URL;

  const res = await fetch(`${base}/presigned`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename, contentType, prefix })
  });

  if (!res.ok) throw new Error("Falha ao gerar URL");
  return res.json(); // { url, objectName }
}

export async function uploadWithPresignedUrl(file, prefix = "") {
  const { name, type } = file;

  const { url, objectName } = await getPresignedUrl(
    name,
    type || "application/octet-stream",
    prefix
  );

  const upload = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": type },
    body: file
  });

  if (!upload.ok) throw new Error("Falha no upload");

  return {
    objectName,
    url: url.split("?")[0]
  };
}
