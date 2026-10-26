// Vercel Serverless Function: کلید API هوش مصنوعی فقط اینجا قرار دارد و هرگز در مرورگر نیست.
// متغیرهای محیطی: ANTHROPIC_API_KEY و (اختیاری) MODEL
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { messages = [], context = {} } = req.body || {};
  const a = context.analysis;
  const system = `تو دستیار تحلیل بازار به فارسی هستی. به سؤال‌ها دقیق، کوتاه و با ساختار پاسخ بده.
قوانین: هیچ‌وقت تضمین سود نده، همیشه مدیریت ریسک (حد ضرر، اندازه پوزیشن) را یادآوری کن،
و در پایان بنویس که این تحلیل توصیه سرمایه‌گذاری نیست.
${a ? `داده‌های لحظه‌ای نماد ${context.symbol}: قیمت=${a.price}، RSI=${a.rsi.toFixed(1)}، EMA20=${a.ema20.toFixed(2)}، EMA50=${a.ema50.toFixed(2)}، حمایت=${a.support}، مقاومت=${a.resistance}، جمع‌بندی=${a.verdict}، دلایل=${a.reasons.join("; ")}.` : ""}`;

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.MODEL || "claude-sonnet-4-20250514",
        max_tokens: 800,
        system,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });
    const data = await r.json();
    const reply = data?.content?.[0]?.text || "پاسخی دریافت نشد.";
    res.status(200).json({ reply });
  } catch (err) {
    res.status(500).json({ error: "AI service error" });
  }
}
