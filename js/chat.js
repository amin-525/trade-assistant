// چت: موتور داخلی (همیشه فعال) + مدل زبانی محلی (اختیاری، بعد از فعال‌سازی)
const Chat = (() => {
  const FREE_DAILY_LIMIT = 5;
  let history = [];
  let useLLM = false;
  const log = document.getElementById("chatLog");

  function append(role, text) {
    const div = document.createElement("div");
    div.className = "msg " + (role === "user" ? "user" : "bot");
    div.textContent = text;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
    return div;
  }

  function checkLimit() {
    const u = Auth.current();
    if (!u) return { ok: false, msg: "برای استفاده از چت، ابتدا وارد حساب شوید." };
    if (u.plan === "pro") return { ok: true };
    const usedToday = u.day === Auth.today() ? u.msgsToday : 0;
    if (usedToday >= FREE_DAILY_LIMIT)
      return { ok: false, msg: `سقف ${FREE_DAILY_LIMIT} پیام رایگان امروز تمام شد. برای چت نامحدود اشتراک بگیرید.` };
    Auth.update({ msgsToday: usedToday + 1, day: Auth.today() });
    return { ok: true };
  }

  async function llmAnswer(text, ctx) {
    const a = ctx.analysis;
    const facts = a
      ? `نماد: ${ctx.symbol}. قیمت: ${a.price}. RSI: ${a.rsi.toFixed(1)}. EMA20: ${a.ema20.toFixed(2)}. EMA50: ${a.ema50.toFixed(2)}. حمایت: ${a.support}. مقاومت: ${a.resistance}. جمع‌بندی موتور: ${a.verdict}. دلایل: ${a.reasons.join("؛ ")}.`
      : "داده بازار در دسترس نیست.";
    const system = `تو دستیار تحلیل بازار به فارسی هستی. کوتاه و دقیق جواب بده.
هیچ‌وقت سود را تضمین نکن و همیشه مدیریت ریسک را یادآوری کن. در پایان بنویس: این توصیه سرمایه‌گذاری نیست.
داده‌های لحظه‌ای: ${facts}`;
    const msgs = [{ role: "system", content: system }, ...history.slice(-6), { role: "user", content: text }];
    return LocalLLM.generate(msgs);
  }

  async function send(text, analysis, symbol, market = "spot") {
    const gate = checkLimit();
    if (!gate.ok) return append("bot", gate.msg);
    append("user", text);
    history.push({ role: "user", content: text });

    const ctx = { analysis, symbol, market, binanceSymbol: symbol.replace("/", "") };
    let reply;
    try {
      if (useLLM) {
        const thinking = append("bot", "در حال فکر کردن با مدل محلی...");
        reply = await llmAnswer(text, ctx);
        thinking.remove();
      } else {
        reply = await Engine.answer(text, ctx);
      }
    } catch (e) {
      reply = (await Engine.answer(text, ctx)) + `\n\n(مدل محلی در دسترس نبود: ${e.message})`;
    }
    history.push({ role: "assistant", content: reply });
    append("bot", reply);
  }

  function setLLM(on) {
    useLLM = on;
  }

  return { send, append, setLLM, isLLM: () => useLLM };
})();
