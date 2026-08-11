const MODEL_ID = "cuplis123/facial_emotion_bgs";
const API_URL = `https://router.huggingface.co/hf-inference/models/${MODEL_ID}`;

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!process.env.HF_TOKEN) {
    res.status(500).json({ error: "HF_TOKEN is not configured in Vercel environment variables" });
    return;
  }

  const image = req.body && req.body.image;
  if (typeof image !== "string" || !image.startsWith("data:image/")) {
    res.status(400).json({ error: "Expected a base64 image in the request" });
    return;
  }

  try {
    const base64 = image.replace(/^data:image\/[^;]+;base64,/, "");
    const upstream = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HF_TOKEN}`,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        inputs: base64,
        parameters: {
          top_k: 5,
          function_to_apply: "none"
        }
      })
    });

    const payload = await upstream.json();
    if (!upstream.ok) {
      const message = payload.error || payload.message || "Hugging Face inference failed";
      res.status(upstream.status).json({ error: message, detail: payload });
      return;
    }

    const results = Array.isArray(payload) ? payload : payload.results;
    res.status(200).json({ results });
  } catch (error) {
    res.status(502).json({ error: error.message || "Could not reach Hugging Face" });
  }
};

module.exports.config = { api: { bodyParser: { sizeLimit: "2mb" } } };
