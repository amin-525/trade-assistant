// موتور تحلیل داخلی: بدون اینترنت اضافه و بدون API
// شامل: الگوهای شمعی، تحلیل چندتایم‌فریم، محاسبه ریسک و پاسخ به قصد کاربر
const Engine = (() => {
  const TIMEFRAMES = ["15m", "1h", "4h", "1d"];

  function candlePatterns(c) {
    const out = [];
    if (c.length < 2) return out;
    const cur = c[c.length - 1], prev = c[c.length - 2];
    const body = Math.abs(cur.close - cur.open);
    const range = cur.high - cur.low || 1e-9;
    const upper = cur.high - Math.max(cur.open, cur.close);
    const lower = Math.min(cur.open, cur.close) - cur.low;
    const prevBearish = prev.close < prev.open, curBullish = cur.close > cur.open;
    const prevBullish = prev.close > prev.open, curBearish = cur.close < cur.open;

    if (prevBearish && curBullish && cur.close >= prev.open && cur.open <= prev.close)
      out.push({ name: "الگوی پوشایی صعودی (Bullish Engulfing)", bias: 1 });
    if (prevBullish && curBearish && cur.open >= prev.close && cur.close <= prev.open)
      out.push({ name: "الگوی پوشایی نزولی (Bearish Engulfing)", bias: -1 });
    if (lower >= 2 * body && upper <= body * 0.5 && body / range < 0.4)
      out.push({ name: "چکش (Hammer) - احتمال بازگشت صعودی", bias: 1 });
    if (upper >= 2 * body && lower <= body * 0.5 && body / range < 0.4)
      out.push({ name: "ستاره تیرانداز (Shooting Star) - احتمال بازگشت نزولی", bias: -1 });
    if (body / range < 0.1)
      out.push({ name: "دوجی (Doji) - تردید بازار", bias: 0 });
    return out;
  }

  function structure(c) {
    // ساختار قله و دره: آیا سقف‌ها و کف‌های بالاتر ساخته شده؟
    const recent = c.slice(-30);
    const half = Math.floor(recent.length / 2);
    const h1 = Math.max(...recent.slice(0, half).map((x) => x.high));
    const h2 = Math.max(...recent.slice(half).map((x) => x.high));
    const l1 = Math.min(...recent.slice(0, half).map((x) => x.low));
    const l2 = Math.min(...recent.slice(half).map((x) => x.low));
    if (h2 > h1 && l2 > l1) return { trend: "صعودی (قله و دره‌های بالاتر)", bias: 1 };
    if (h2 < h1 && l2 < l1) return { trend: "نزولی (قله و دره‌های پایین‌تر)", bias: -1 };
    return { trend: "رنج / بی‌جهت", bias: 0 };
  }

  function volumeCheck(c) {
    const last = c[c.length - 1].volume;
    const avg = c.slice(-21, -1).reduce((s, x) => s + x.volume, 0) / 20;
    const ratio = avg ? last / avg : 1;
    return { ratio, text: ratio > 1.5 ? "حجم معامله بالاست (تأیید حرکت)" : ratio < 0.7 ? "حجم پایین است (حرکت ضعیف)" : "حجم عادی است" };
  }

  // تحلیل یک تایم‌فریم
  function analyzeTF(candles, tf) {
    const a = Market.analyze(candles);
    const pats = candlePatterns(candles);
    const st = structure(candles);
    const vol = volumeCheck(candles);
    let score = a.score + st.bias + pats.reduce((s, p) => s + p.bias, 0);
    if (vol.ratio > 1.5) score += Math.sign(score) || 0;
    return { tf, ...a, patterns: pats, structure: st, volume: vol, total: score };
  }

  // تحلیل چندتایم‌فریم و هم‌راستایی
  async function multiTimeframe(symbol) {
    const results = await Promise.all(
      TIMEFRAMES.map(async (tf) => analyzeTF(await Market.fetchCandles(symbol, tf, 300), tf))
    );
    const sum = results.reduce((s, r) => s + Math.sign(r.total), 0);
    const agree = Math.abs(sum) >= 3;
    const bias = sum >= 3 ? "صعودی" : sum <= -3 ? "نزولی" : "مختلط";
    return { results, agree, bias, sum };
  }

  // محاسبه ریسک: اندازه پوزیشن، حد ضرر، هدف و نسبت ریسک به ریوارد
  function riskPlan({ capital, riskPct = 1, entry, stop, rr = 2 }) {
    const riskAmount = capital * (riskPct / 100);
    const perUnitRisk = Math.abs(entry - stop);
    if (!perUnitRisk) return null;
    const units = riskAmount / perUnitRisk;
    const target = entry > stop ? entry + perUnitRisk * rr : entry - perUnitRisk * rr;
    return { riskAmount, units, target, rr, positionValue: units * entry };
  }

  function parseNumbers(text) {
    return (text.match(/\d+(\.\d+)?/g) || []).map(Number);
  }

  // پاسخ به قصد کاربر
  async function answer(question, ctx) {
    const q = question.toLowerCase();
    const a = ctx.analysis;
    const sym = ctx.symbol;
    if (!a) return "داده بازار هنوز آماده نیست. چند ثانیه دیگر دوباره بپرسید.";

    if (/ریسک|حد ضرر|stop|اندازه پوزیشن|پوزیشن|سرمایه/.test(q)) {
      const nums = parseNumbers(q);
      if (nums.length >= 1 && /سرمایه|capital/.test(q)) {
        const capital = nums[0];
        const riskPct = nums[1] || 1;
        const stop = a.price * 0.97;
        const p = riskPlan({ capital, riskPct, entry: a.price, stop, rr: 2 });
        return `برنامه ریسک آموزشی برای ${sym} (ورود نزدیک ${a.price.toFixed(2)}):\n` +
          `• سرمایه: ${capital} | ریسک هر معامله: ${riskPct}% = ${p.riskAmount.toFixed(2)}\n` +
          `• حد ضرر پیشنهادی (۳٪ زیر قیمت): ${stop.toFixed(2)}\n` +
          `• تعداد واحد: ${p.units.toFixed(4)} | ارزش پوزیشن: ${p.positionValue.toFixed(2)}\n` +
          `• هدف با نسبت ریسک به ریوارد ۱:۲: ${p.target.toFixed(2)}\n` +
          `هیچ‌وقت بیش از ۱ تا ۲٪ سرمایه را در یک معامله ریسک نکنید.`;
      }
      return `قانون پایه: ریسک هر معامله ۱ تا ۲٪ سرمایه. برای ${sym} حد ضرر زیر حمایت ${a.support.toFixed(2)} و نزدیک ${(a.price * 0.97).toFixed(2)} قابل بررسی است.\nبرای محاسبه دقیق بنویسید: «سرمایه 1000 ریسک 2» (سرمایه و درصد ریسک).`;
    }

    if (/الگو|شمع|pattern|کندل/.test(q)) {
      const r = await multiTimeframe(ctx.binanceSymbol);
      const lines = r.results.map((x) =>
        `${x.tf}: ${x.patterns.length ? x.patterns.map((p) => p.name).join("، ") : "الگوی واضحی نیست"}`);
      return `الگوهای شمعی در تایم‌فریم‌های مختلف ${sym}:\n${lines.join("\n")}`;
    }

    if (/تایم|چندتایم|multi|کل بازار|همه/.test(q) || /تحلیل کامل|تحلیل جامع/.test(q)) {
      const r = await multiTimeframe(ctx.binanceSymbol);
      const lines = r.results.map((x) =>
        `• ${x.tf}: روند ${x.structure.trend} | RSI ${x.rsi.toFixed(0)} | امتیاز ${x.total}`);
      return `تحلیل چندتایم‌فریم ${sym}:\n${lines.join("\n")}\n\n` +
        `هم‌راستایی: ${r.agree ? "بله" : "خیر"} | جهت کلی: ${r.bias}\n` +
        (r.agree ? "تأیید بالا: تایم‌فریم‌ها هم‌جهت هستند." : "هشدار: تایم‌فریم‌ها هم‌جهت نیستند؛ صبر کنید.") +
        `\n\nاین تحلیل آموزشی است و توصیه سرمایه‌گذاری نیست.`;
    }

    if (/حمایت|مقاومت|سطح|support|resistance/.test(q)) {
      return `حمایت اخیر: ${a.support.toFixed(2)} | مقاومت اخیر: ${a.resistance.toFixed(2)}\nشکست مقاومت با حجم بالا نشانه قدرت خریداران است.`;
    }

    if (/هدف|سود|profit|target/.test(q)) {
      return `اهداف آموزشی بر اساس مقاومت: ${a.resistance.toFixed(2)}. هیچ هدفی تضمین‌شده نیست؛ همیشه حد ضرر تعیین کنید.`;
    }

    // پیش‌فرض: تحلیل کامل تک‌تایم‌فریم
    const v = a.reasons.map((r) => "• " + r).join("\n");
    return `تحلیل ${sym} (${a.time}):\nقیمت: ${a.price.toFixed(2)} | تغییر ۲۴ ساعته: ${a.change24.toFixed(2)}%\n${v}\n` +
      `حمایت: ${a.support.toFixed(2)} | مقاومت: ${a.resistance.toFixed(2)}\nجمع‌بندی: ${a.verdict}\n` +
      `برای تحلیل چندتایم‌فریم بنویسید «تحلیل کامل». این تحلیل آموزشی است و توصیه سرمایه‌گذاری نیست.`;
  }

  return { answer, multiTimeframe, riskPlan, candlePatterns };
})();
