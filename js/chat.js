// چت‌بات: اگر API فعال باشد از /api/chat (هوش مصنوعی واقعی) استفاده می‌کند،
// وگرنه با پاسخ‌های محلی بر اساس تحلیل اندیکاتورها کار می‌کند.
const Chat = (() => {
  const API_URL = "/api/chat"; // بعد از دیپلوی روی Vercel فعال می‌شود
  const FREE_DAILY_LIMIT = 5;
  let history = [];

  const log = document.getElementById("chatLog");

  function append(role, text) {
    const div = document.createElement("div");
    div.className = "msg " + (role === "user" ? "user" : "bot");
    div.textContent = text;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
  }

  function localAnswer(question, a, symbol) {
    const q = question.toLowerCase();
    if (!a) return "هنوز داده بازار دریافت نشده است. چند لحظه دیگر دوباره بپرسید.";
    if (q.includes("ریسک") || q.includes("حد ضرر") || q.includes("stop")) {
      const stop = (a.price * 0.97).toFixed(2);
      return `برای ${symbol} پیشنهاد آموزشی: حد ضرر حدود ۳٪ زیر قیمت (${stop}) و اندازه پوزیشن ۱ تا ۲٪ از سرمایه. سطح حمایت فعلی: ${a.support.toFixed(2)}.`;
    }
    if (q.includes("حمایت") || q.includes("مقاومت")) {
      return `حمایت اخیر: ${a.support.toFixed(2)} | مقاومت اخیر: ${a.resistance.toFixed(2)}`;
    }
    return `تحلیل ${symbol} (${a.time}):\n` +
      `قیمت: ${a.price.toFixed(2)} | تغییر ۲۴ ساعته: ${a.change24.toFixed(2)}%\n` +
      a.reasons.map((r) => "• " + r).join("\n") +
      `\n\nجمع‌بندی: ${a.verdict}\nحمایت: ${a.support.toFixed(2)} | مقاومت: ${a.resistance.toFixed(2)}\n` +
      "این تحلیل آموزشی است و توصیه سرمایه‌گذاری نیست.";
  }

  function checkLimit() {
    const u = Auth.current();
    if (!u) return { ok: false, msg: "برای استفاده از چت، ابتدا وارد حساب شوید." };
    if (u.plan === "pro") return { ok: true };
    const usedToday = u.day === Auth.today() ? u.msgsToday : 0;
    if (usedToday >= FREE_DAILY_LIMIT) {
      return { ok: false, msg: `سقف ${FREE_DAILY_LIMIT} پیام رایگان امروز تمام شد. برای چت نامحدود اشتراک بگیرید.` };
    }
    Auth.update({ msgsToday: usedToday + 1, day: Auth.today() });
    return { ok: true };
  }

  async function send(text, analysis, symbol) {
    const gate = checkLimit();
    if (!gate.ok) return append("bot", gate.msg);

    append("user", text);
    history.push({ role: "user", content: text });

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.slice(-10), context: { symbol, analysis } }),
      });
      if (!res.ok) throw new Error("API unavailable");
      const data = await res.json();
      history.push({ role: "assistant", content: data.reply });
      append("bot", data.reply);
    } catch (e) {
      const reply = localAnswer(text, analysis, symbol);
      history.push({ role: "assistant", content: reply });
      append("bot", reply);
    }
  }

  return { send, append };
})();
