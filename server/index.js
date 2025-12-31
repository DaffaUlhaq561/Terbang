import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const result = dotenv.config({ path: path.resolve(__dirname, "../.env") });
console.log("✅ Dotenv loaded. Parsed:", result.parsed ? Object.keys(result.parsed) : "none");
console.log("SUPABASE_URL env:", process.env.SUPABASE_URL ? "✓ Set" : "✗ Not set");
console.log("SUPABASE_SERVICE_KEY env:", process.env.SUPABASE_SERVICE_KEY ? "✓ Set" : "✗ Not set");

import express from "express";
import multer from "multer";
import cors from "cors";
import OpenAI from "openai";

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

app.use(cors());
app.use(express.json({ limit: "10mb" }));

const hasApiKey = Boolean(process.env.OPENAI_API_KEY);
const openai = hasApiKey ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

let supabase = null;

async function start() {
  // Import supabase after env vars are loaded
  const { supabase: supabaseClient } = await import("./supabaseClient.js");
  supabase = supabaseClient;
  
  if (supabase) {
    console.log("✅ Testing Supabase connection...");
    try {
      const { data, error } = await supabase.from('monthly_reports').select('count', { count: 'exact', head: true });
      if (error) {
        console.error("❌ Supabase query error:", error.message);
      } else {
        console.log("✅ Supabase connection successful!");
      }
    } catch (err) {
      console.error("❌ Supabase test error:", err.message);
    }
  } else {
    console.warn("⚠️ Supabase is null!");
  }

  // POST /api/scan - Image recognition endpoint
  app.post("/api/scan", upload.single("image"), async (req, res) => {
    try {
      let dataUrl;
      const file = req.file;
      if (file) {
        const mime = file.mimetype || "image/png";
        const base64 = file.buffer.toString("base64");
        dataUrl = `data:${mime};base64,${base64}`;
      } else if (req.body && typeof req.body.dataUrl === "string") {
        dataUrl = req.body.dataUrl;
      } else {
        return res.status(400).json({ error: "Image is required (multipart 'image' or JSON 'dataUrl')" });
      }

      let parsed;
      if (hasApiKey && openai) {
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
        parsed = JSON.parse(content);
      } else {
        parsed = {
          name: "Produk Tidak Dikenal",
          category: "Tidak diketahui",
          type: "Tidak diketahui",
          confidence: 0.5,
          salesTrend: "+0%",
          insight: "Mode offline: set OPENAI_API_KEY untuk analisis AI.",
        };
      }

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
      const fallback = {
        name: "Produk Tidak Dikenal",
        category: "Tidak diketahui",
        type: "Tidak diketahui",
        confidence: 0.5,
        stock: 20,
        status: "safe",
        salesTrend: "+0%",
        insight: "Terjadi kesalahan analisis. Mode fallback digunakan.",
      };
      res.status(200).json(fallback);
    }
  });

  // GET /api/monthly-reports - Fetch monthly reports from Supabase
  app.get("/api/monthly-reports", async (req, res) => {
    console.log("[HANDLER] Route called");
    try {
      console.log("[HANDLER] Supabase is:", supabase ? "NOT NULL" : "NULL");
      if (!supabase) {
        return res.status(500).json({ error: 'Supabase is null' });
      }

      const { data, error } = await supabase
        .from('monthly_reports')
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (error) {
        console.error('[HANDLER] Query error:', error);
        return res.status(400).json({ error: 'Database query failed', detail: error.message });
      }

      console.log('[HANDLER] Success, returning', data?.length || 0, 'rows');
      return res.json(data || []);
    } catch (err) {
      console.error('[HANDLER] Catch error:', err);
      return res.status(500).json({ error: 'Server error', detail: err.message });
    }
  });

  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`✅ AI Scan server running on http://localhost:${PORT}`);
  });
}

start().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
