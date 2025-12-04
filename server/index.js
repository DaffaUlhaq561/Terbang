import dotenv from "dotenv";
import express from "express";
import multer from "multer";
import cors from "cors";
import OpenAI from "openai";

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

app.use(cors());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/api/scan", upload.single("image"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "Image file is required" });
    }

    const mime = file.mimetype || "image/png";
    const base64 = file.buffer.toString("base64");
    const dataUrl = `data:${mime};base64,${base64}`;

    const prompt = `Anda adalah mesin pengenal produk retail untuk pasar Indonesia.
Kembalikan JSON dengan field: name, category, type, confidence (0..1), salesTrend (mis. "+15%"), insight.
Jangan keluarkan teks lain selain JSON valid.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: prompt },
        {
          role: "user",
          content: [
            { type: "text", text: "Identifikasi produk dari foto berikut dan berikan insight singkat." },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
    });

    const content = completion.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);

    const result = {
      name: parsed.name ?? "Produk Tidak Dikenal",
      category: parsed.category ?? "Tidak diketahui",
      type: parsed.type ?? "Tidak diketahui",
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
      stock: 20,
      status: "safe",
      salesTrend: parsed.salesTrend ?? "+0%",
      insight: parsed.insight ?? "Tidak ada insight.",
    };

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to analyze image" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`AI Scan server running on http://localhost:${PORT}`);
});