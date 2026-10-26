// موتور تحلیل داخلی: الگوهای شمعی، چندتایم‌فریم، ریسک و پیشنهاد پوزیشن (اسپات/فیوچر)
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
    const recent = c.slice(-30);
    const half = Math.floor(recent.length / 2);
    const h1 = Math.max(...recent.slice(0, half).map((x) => x.high));
    const h2 = Math.max(...recent.slice(half).map((x) => x.high));
    const l1 = Math.min(...recent.slice(0, half).map((x) => x.low));
    const l2 = Math.min(...recent.slice(half).map((x) => x.low));
    if (h2 > h1 && l2 > l1) return { trend: "صعودی (سقف و کف‌های بالاتر)", bias: 1 };
    if (h2 < h1 && l2 < l1) return { trend: "نزولی (سقف و کف‌های پایین‌تر)", bias: -1 };
    return { trend: "رنج / بی‌جهت", bias: 0 };
  }

  function volumeCheck(c) {
    const last = c[c.length - 1].volume;
    const avg = c.slice(-21, -1).reduce((s, x) => s + x.volume, 0) / 20;
    const ratio = avg ? last / avg : 1;
    return { ratio, text: ratio > 1.5 ? "حجم معامله بالاست (تأیید حرکت)" : ratio < 0.7 ? "حجم پایین است (حرکت ضعیف)" : "حجم عادی است" };
  }

  function analyzeTF(candles, tf) {
    const a = Market.analyze(candles);
    const pats = candlePatterns(candles);
    const st = structure(candles);
    const vol = volumeCheck(candles);
    let total = a.score + st.bias + pats.reduce((s, p) => s + p.bias, 0);
    if (vol.ratio > 1.5) total += Math.sign(total) || 0;
    return { tf, ...a, patterns: pats, structure: st, volume: vol, total };
  }

  async function multiTimeframe(symbol, market = "spot") {
    const results = await Promise.all(
      TIMEFRAMES.map(async (tf) => analyzeTF(await Market.fetchCandles(symbol, tf, 300, market), tf))
    );
    const sum = results.reduce((s, r) => s + Math.sign(r.total), 0);
    const agree = Math.abs(sum) >= 3;
    const bias = sum >= 3 ? "صعودی" : sum <= -3 ? "نزولی" : "مختلط";
    return { results, agree, bias, sum };
  }

  function riskPlan({ capital, riskPct = 1, entry, stop, rr = 2 }) {
    const riskAmount = capital * (riskPct / 100);
    const perUnitRisk = Math.abs(entry - stop);
    if (!perUnitRisk) return null;
    const units = riskAmount / perUnitRisk;
    const target = entry > stop ? entry + perUnitRisk * rr : entry - perUnitRisk * rr;
    return { riskAmount, units, target, rr, positionValue: units * entry };
  }

  // پیشنهاد پوزیشن بر اساس امتیاز موتور و ATR
  // اسپات: فقط خرید. فیوچر: خرید یا فروش کوتاه همراه با لوریج
  function planPosition(a, { market = "spot", capital = 1000, riskPct = 1, leverage = 3, symbol = "" } = {}) {
    if (!a) return "داده بازار هنوز آماده نیست.";
    const isFut = market === "futures";
    const lev = isFut ? Math.min(Math.max(1, Math.round(leverage)), 125) : 1;
    const dir = a.score >= 2 ? "LONG" : a.score <= -2 ? "SHORT" : null;

    if (!dir) {
      return `${symbol}: امتیاز ${a.score} و سیگنال واضحی نیست.\nپیشنهاد: وارد پوزیشن نشوید و منتظر تأیید (شکست مقاومت یا شکست حمایت با حجم) بمانید.`;
    }
    if (!isFut && dir === "SHORT") {
      return `${symbol} در اسپات فعلاً نزولی است و در اسپات نمی‌توان فروش کوتاه زد.\n` +
        `اگر فروش کوتاه می‌خواهید، بازار را روی «فیوچر» بگذارید؛ یا منتظر برگشت به روند صعودی بمانید.`;
    }

    const entry = a.price;
    const stopDist = Math.max(1.5 * a.atr, entry * 0.002);
    const stop = dir === "LONG" ? entry - stopDist : entry + stopDist;
    const tp = dir === "LONG" ? entry + 2 * stopDist : entry - 2 * stopDist;
    const riskAmt = capital * (riskPct / 100);
    let units = riskAmt / stopDist;
    const maxUnits = (capital * lev) / entry;
    const capped = units > maxUnits;
    if (capped) units = maxUnits;
    const positionValue = units * entry;
    const margin = positionValue / lev;
    const stopPct = (stopDist / entry) * 100;
    const liq = isFut ? (dir === "LONG" ? entry * (1 - 1 / lev) : entry * (1 + 1 / lev)) : null;
    const liqBeforeStop = isFut && (dir === "LONG" ? liq >= stop : liq <= stop);

    const lines = [
      `پیشنهاد پوزیشن ${symbol} (${isFut ? "فیوچر دائمی" : "اسپات"})`,
      `جهت: ${dir === "LONG" ? "خرید (LONG)" : "فروش کوتاه (SHORT)"} | امتیاز تحلیل: ${a.score}`,
      `ورود نزدیک: ${entry} | ATR: ${a.atr.toFixed(4)}`,
      `حد ضرر: ${stop.toFixed(4)} (${stopPct.toFixed(2)}% از ورود)`,
      `هدف (نسبت ۱:۲): ${tp.toFixed(4)} (${(stopPct * 2).toFixed(2)}%)`,
      `سرمایه: ${capital} | ریسک هر معامله: ${riskPct}% = ${riskAmt.toFixed(2)}`,
      `ارزش پوزیشن: ${positionValue.toFixed(2)} | ${isFut ? `مارجین: ${margin.toFixed(2)} | لوریج: ${lev}x` : "نقدی (بدون لوریج)"}`,
      `تعداد واحد: ${units.toFixed(6)}`,
    ];
    if (isFut) lines.push(`قیمت تقریبی لیکوئید: ${liq.toFixed(4)} (بدون احتساب کارمزد و حاشیه نگه‌داری)`);
    if (capped) lines.push("⚠️ به دلیل سقف سرمایه و لوریج، اندازه پوزیشن کاهش یافت.");
    if (liqBeforeStop) lines.push("⛔ قیمت لیکوئید از حد ضرر نزدیک‌تر است؛ لوریج را کم کنید.");
    if (lev > 10) lines.push("⚠️ لوریج بالای ۱۰ برابر خطر بالایی دارد.");
    lines.push("این پیشنهاد آموزشی است و تضمین سود نیست. قبل از ورود، حد ضرر را در صرافی ثبت کنید.");
    return lines.join("\n");
  }

  function parseNumbers(text) {
    return (text.match(/\d+(\.\d+)?/g) || []).map(Number);
  }

  async function answer(question, ctx) {
    const q = question.toLowerCase();
    const a = ctx.analysis;
    const sym = ctx.symbol;
    const market = ctx.market || "spot";
    if (!a) return "داده بازار هنوز آماده نیست. چند ثانیه دیگر دوباره بپرسید.";

    if (/پوزیشن|position|لوریج|لیورج|leverage|فیوچر|اسپات|ضریب/.test(q)) {
      const capMatch = q.match(/سرمایه\s*(\d+(\.\d+)?)/);
      const riskMatch = q.match(/ریسک\s*(\d+(\.\d+)?)/);
      const levMatch = q.match(/(\d+)\s*(x|برابر)/) || q.match(/(?:لوریج|لیورج|لیوریج|leverage)\s*(\d+)/);
      const mk = /فیوچر|futures/.test(q) ? "futures" : /اسپات|spot/.test(q) ? "spot" : market;
      return planPosition(a, {
        market: mk,
        capital: capMatch ? +capMatch[1] : 1000,
        riskPct: riskMatch ? +riskMatch[1] : 1,
        leverage: levMatch ? +levMatch[1] : 3,
        symbol: sym,
      });
    }

    if (/ریسک|حد ضرر|stop|اندازه پوزیشن|سرمایه/.test(q)) {
      const nums = parseNumbers(q);
      if (nums.length >= 1 && /سرمایه|capital/.test(q)) {
        const capital = nums[0];
        const riskPct = nums[1] || 1;
        const stop = a.price * 0.97;
        const p = riskPlan({ capital, riskPct, entry: a.price, stop, rr: 2 });
        return `برنامه ریسک آموزشی برای ${sym} (ورود نزدیک ${a.price}):\n` +
          `• سرمایه: ${capital} | ریسک هر معامله: ${riskPct}% = ${p.riskAmount.toFixed(2)}\n` +
          `• حد ضرر (۳٪ زیر قیمت): ${stop.toFixed(4)}\n` +
          `• تعداد واحد: ${p.units.toFixed(6)} | ارزش پوزیشن: ${p.positionValue.toFixed(2)}\n` +
          `• هدف (ریسک به ریوارد ۱:۲): ${p.target.toFixed(4)}\n` +
          `هیچ‌وقت بیش از ۱ تا ۲٪ سرمایه را در یک معامله ریسک نکنید.`;
      }
      return `قانون پایه: ریسک هر معامله ۱ تا ۲٪ سرمایه. برای ${sym} حد ضرر زیر حمایت ${a.support} قابل بررسی است.\n` +
        `برای پیشنهاد پوزیشن بنویسید: «پوزیشن فیوچر سرمایه 1000 ریسک 1 لوریج 5».`;
    }

    if (/الگو|شمع|pattern|کندل/.test(q)) {
      const r = await multiTimeframe(ctx.binanceSymbol, market);
      const lines = r.results.map((x) =>
        `${x.tf}: ${x.patterns.length ? x.patterns.map((p) => p.name).join("، ") : "الگوی واضحی نیست"}`);
      return `الگوهای شمعی ${sym}:\n${lines.join("\n")}`;
    }

    if (/تایم|چندتایم|multi|تحلیل کامل|تحلیل جامع/.test(q)) {
      const r = await multiTimeframe(ctx.binanceSymbol, market);
      const lines = r.results.map((x) =>
        `• ${x.tf}: روند ${x.structure.trend} | RSI ${x.rsi.toFixed(0)} | امتیاز ${x.total}`);
      return `تحلیل چندتایم‌فریم ${sym}:\n${lines.join("\n")}\n\n` +
        `هم‌راستایی: ${r.agree ? "بله" : "خیر"} | جهت کلی: ${r.bias}\n` +
        (r.agree ? "تأیید بالا: تایم‌فریم‌ها هم‌جهت هستند." : "هشدار: تایم‌فریم‌ها هم‌جهت نیستند؛ صبر کنید.") +
        `\n\nاین تحلیل آموزشی است و توصیه سرمایه‌گذاری نیست.`;
    }

    if (/حمایت|مقاومت|سطح|support|resistance/.test(q)) {
      return `حمایت اخیر: ${a.support} | مقاومت اخیر: ${a.resistance}\nشکست مقاومت با حجم بالا نشانه قدرت خریداران است.`;
    }

    if (/هدف|سود|profit|target/.test(q)) {
      return `اهداف آموزشی بر اساس مقاومت: ${a.resistance}. هیچ هدفی تضمین‌شده نیست؛ همیشه حد ضرر تعیین کنید.`;
    }

    const v = a.reasons.map((r) => "• " + r).join("\n");
    return `تحلیل ${sym} (${a.time}):\nقیمت: ${a.price} | تغییر ۲۴ ساعته: ${a.change24.toFixed(2)}%\n${v}\n` +
      `حمایت: ${a.support} | مقاومت: ${a.resistance}\nجمع‌بندی: ${a.verdict}\n` +
      `برای پیشنهاد پوزیشن بنویسید «پوزیشن فیوچر» یا «پوزیشن اسپات»، و برای تحلیل کامل «تحلیل کامل».`;
  }

  return { answer, multiTimeframe, riskPlan, planPosition, candlePatterns };
})();
