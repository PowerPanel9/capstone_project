import axios from "axios";
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
  const api = axios.create({ baseURL: API_URL });

  // Uploads one file and returns its public URL string.
  // You then save that URL via your normal create/update calls (e.g. image_url).
  export async function uploadFile(file) {
    const token = localStorage.getItem("token");

    // FormData is how browsers send files. The key "file" MUST match
    // upload.single("file") on the backend.
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/api/upload", formData, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.data.url; // the S3 URL
  }
