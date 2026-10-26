// داده بازار از Binance: اسپات و فیوچر دائمی (USDT-M) بدون کلید
const Market = (() => {
  const BASE = {
    spot: "https://api.binance.com/api/v3",
    futures: "https://fapi.binance.com/fapi/v1",
  };
  const EXCLUDE = /(UP|DOWN|BEAR|BULL)USDT$/;

  async function fetchCandles(symbol, interval = "1h", limit = 300, market = "spot") {
    const url = `${BASE[market]}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("دریافت داده از Binance ناموفق بود");
    const rows = await res.json();
    return rows.map((r) => ({
      time: r[0], open: +r[1], high: +r[2], low: +r[3], close: +r[4], volume: +r[5],
    }));
  }

  function ema(values, period) {
    const k = 2 / (period + 1);
    const out = [];
    let prev = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
    out[period - 1] = prev;
    for (let i = period; i < values.length; i++) {
      prev = values[i] * k + prev * (1 - k);
      out[i] = prev;
    }
    return out;
  }

  function rsi(closes, period = 14) {
    let gain = 0, loss = 0;
    for (let i = 1; i <= period; i++) {
      const d = closes[i] - closes[i - 1];
      if (d >= 0) gain += d; else loss -= d;
    }
    gain /= period; loss /= period;
    let value = loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
    for (let i = period + 1; i < closes.length; i++) {
      const d = closes[i] - closes[i - 1];
      gain = (gain * (period - 1) + Math.max(d, 0)) / period;
      loss = (loss * (period - 1) + Math.max(-d, 0)) / period;
      value = loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
    }
    return value;
  }

  function macd(closes) {
    const e12 = ema(closes, 12), e26 = ema(closes, 26);
    const line = closes.map((_, i) => (e12[i] != null && e26[i] != null ? e12[i] - e26[i] : null)).filter((v) => v != null);
    const signal = ema(line, 9);
    const last = line.length - 1;
    return { macd: line[last], signal: signal[last] };
  }

  // ATR (میانگین دامنه واقعی) برای تعیین فاصله حد ضرر
  function atr(candles, period = 14) {
    const trs = [];
    for (let i = 1; i < candles.length; i++) {
      const c = candles[i], p = candles[i - 1];
      trs.push(Math.max(c.high - c.low, Math.abs(c.high - p.close), Math.abs(c.low - p.close)));
    }
    let value = trs.slice(0, period).reduce((a, b) => a + b, 0) / period;
    for (let i = period; i < trs.length; i++) value = (value * (period - 1) + trs[i]) / period;
    return value;
  }

  function analyze(candles) {
    const closes = candles.map((c) => c.close);
    const last = candles[candles.length - 1];
    const price = last.close;
    const e20 = ema(closes, 20).at(-1);
    const e50 = ema(closes, 50).at(-1);
    const r = rsi(closes, 14);
    const m = macd(closes);
    const recent = candles.slice(-50);
    const support = Math.min(...recent.map((c) => c.low));
    const resistance = Math.max(...recent.map((c) => c.high));
    const base = closes[Math.max(0, closes.length - 25)];
    const change24 = ((price - base) / base) * 100;

    let score = 0;
    const reasons = [];
    if (price > e50) { score++; reasons.push("قیمت بالای EMA50 است (روند صعودی)"); }
    else { score--; reasons.push("قیمت زیر EMA50 است (روند نزولی)"); }
    if (e20 > e50) { score++; reasons.push("EMA20 بالای EMA50 است"); }
    else { score--; reasons.push("EMA20 زیر EMA50 است"); }
    if (r > 70) { score--; reasons.push(`RSI=${r.toFixed(1)} اشباع خرید است`); }
    else if (r < 30) { score++; reasons.push(`RSI=${r.toFixed(1)} اشباع فروش است`); }
    else if (r > 50) { score++; reasons.push(`RSI=${r.toFixed(1)} قدرت خریداران را نشان می‌دهد`); }
    else { score--; reasons.push(`RSI=${r.toFixed(1)} ضعف خریداران را نشان می‌دهد`); }
    if (m.macd > m.signal) { score++; reasons.push("MACD بالای خط سیگنال است"); }
    else { score--; reasons.push("MACD زیر خط سیگنال است"); }

    const verdict = score >= 2 ? "خرید (صعودی)" : score <= -2 ? "فروش (نزولی)" : "خنثی / منتظر تأیید";

    return {
      price, ema20: e20, ema50: e50, rsi: r, macd: m.macd, macdSignal: m.signal,
      support, resistance, change24, score, verdict, reasons, atr: atr(candles, 14),
      time: new Date(last.time).toLocaleString("fa-IR"),
    };
  }

  // لیست نمادهای فعال USDT در بازار مشخص (spot | futures)
  async function fetchSymbols(market = "spot") {
    const res = await fetch(`${BASE[market]}/exchangeInfo`);
    if (!res.ok) throw new Error("دریافت فهرست ارزها ناموفق بود");
    const data = await res.json();
    return data.symbols
      .filter((s) =>
        s.status === "TRADING" &&
        s.quoteAsset === "USDT" &&
        (market === "spot" || s.contractType === "PERPETUAL") &&
        !EXCLUDE.test(s.symbol))
      .map((s) => s.symbol)
      .sort();
  }

  // پرحجم‌ترین نمادها در ۲۴ ساعت گذشته
  async function fetchTopByVolume(n = 50, market = "spot") {
    const res = await fetch(`${BASE[market]}/ticker/24hr`);
    if (!res.ok) throw new Error("دریافت آمار بازار ناموفق بود");
    const data = await res.json();
    return data
      .filter((t) => t.symbol.endsWith("USDT") && !EXCLUDE.test(t.symbol))
      .sort((a, b) => +b.quoteVolume - +a.quoteVolume)
      .slice(0, n)
      .map((t) => ({ symbol: t.symbol, price: +t.lastPrice, change: +t.priceChangePercent, volume: +t.quoteVolume }));
  }

  return { fetchCandles, analyze, ema, rsi, atr, fetchSymbols, fetchTopByVolume };
})();
