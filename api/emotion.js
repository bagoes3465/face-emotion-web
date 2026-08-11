const DEFAULT_SPACE_API_URL = "https://cuplis123-facial-emotion-cpls.hf.space/predict-base64";

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const image = req.body && req.body.image;
  if (typeof image !== "string" || !image.startsWith("data:image/")) {
    res.status(400).json({ error: "Expected a base64 image in the request" });
    return;
  }

  try {
    const base64 = image.replace(/^data:image\/[^;]+;base64,/, "");
    const upstream = await fetch(process.env.SPACE_API_URL || DEFAULT_SPACE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({ image: base64 })
    });
    const payload = await upstream.json();
    if (!upstream.ok) {
      res.status(upstream.status).json({ error: payload.detail || payload.error || "Space inference failed", detail: payload });
      return;
    }
    if (!payload.success) {
      res.status(422).json({ error: payload.error || "No face detected in image", detail: payload });
      return;
    }

    const confidence = Number(payload.confidence || 0);
    const emotion = String(payload.emotion || "unknown");
    res.status(200).json({
      results: [{ label: emotion, score: confidence }],
      prediction: payload
    });
  } catch (error) {
    res.status(502).json({ error: error.message || "Could not reach the Hugging Face Space" });
  }
};

module.exports.config = { api: { bodyParser: { sizeLimit: "2mb" } } };
