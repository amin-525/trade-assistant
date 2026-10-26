// اتصال همه بخش‌ها به هم
(function () {
  let currentSymbol = "BTCUSDT";
  let currentInterval = "1h";
  let lastAnalysis = null;

  const $ = (id) => document.getElementById(id);

  function renderAuth() {
    const u = Auth.current();
    const area = $("authArea");
    if (u) {
      area.innerHTML = `<span class="badge">${u.plan === "pro" ? "حرفه‌ای" : "رایگان"}</span>
        <button id="logoutBtn" class="btn">خروج</button>`;
      $("logoutBtn").onclick = () => { Auth.logout(); renderAuth(); };
    } else {
      area.innerHTML = `<button id="openAuth" class="btn primary">ورود / ثبت‌نام</button>`;
      $("openAuth").onclick = () => $("authModal").classList.remove("hidden");
    }
    $("chatLimit").textContent = u
      ? (u.plan === "pro" ? "اشتراک فعال: چت نامحدود" : `پیام امروز: ${u.day === Auth.today() ? u.msgsToday : 0} از ${5}`)
      : "برای چت، وارد حساب شوید.";
  }

  function renderAnalysis(a) {
    const cls = a.score > 0 ? "up" : a.score < 0 ? "down" : "";
    $("analysisBox").innerHTML = `
      <div class="stat"><span>قیمت</span><strong>${a.price.toFixed(2)}</strong></div>
      <div class="stat"><span>تغییر ۲۴ ساعته</span><strong class="${a.change24 >= 0 ? "up" : "down"}">${a.change24.toFixed(2)}%</strong></div>
      <div class="stat"><span>RSI (14)</span><strong>${a.rsi.toFixed(1)}</strong></div>
      <div class="stat"><span>EMA20 / EMA50</span><strong>${a.ema20.toFixed(0)} / ${a.ema50.toFixed(0)}</strong></div>
      <div class="stat"><span>حمایت</span><strong>${a.support.toFixed(2)}</strong></div>
      <div class="stat"><span>مقاومت</span><strong>${a.resistance.toFixed(2)}</strong></div>
      <div class="stat verdict ${cls}">جمع‌بندی: ${a.verdict}<br/><small>امتیاز: ${a.score}</small></div>
      <div class="stat" style="grid-column:1/-1"><span>دلایل</span>${a.reasons.map((r) => "• " + r).join("<br/>")}</div>`;
  }

  async function refreshAnalysis() {
    try {
      lastAnalysis = Market.analyze(await Market.fetchCandles(currentSymbol, currentInterval));
      renderAnalysis(lastAnalysis);
    } catch (e) {
      $("analysisBox").textContent = "خطا در دریافت داده: " + e.message;
    }
  }

  // ثبت‌نام / ورود
  let mode = "login";
  document.querySelectorAll(".tab").forEach((t) =>
    t.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((x) => x.classList.remove("active"));
      t.classList.add("active");
      mode = t.dataset.tab;
    })
  );
  $("closeModal").onclick = () => $("authModal").classList.add("hidden");
  $("authForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = $("authEmail").value.trim();
    const pass = $("authPass").value;
    try {
      if (mode === "register") await Auth.register(email, pass);
      else await Auth.login(email, pass);
      $("authModal").classList.add("hidden");
      $("authError").textContent = "";
      renderAuth();
    } catch (err) {
      $("authError").textContent = err.message;
    }
  });
  window.addEventListener("auth-changed", renderAuth);

  // چت
  $("chatForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const text = $("chatInput").value.trim();
    if (!text) return;
    $("chatInput").value = "";
    Chat.send(text, lastAnalysis, currentSymbol.replace("USDT", "/USDT")).then(renderAuth);
  });
  if (!document.querySelector(".msg")) {
    Chat.append("bot", "سلام! من دستیار TradeMind هستم. از وضعیت بازار بپرسید، مثلاً «تحلیل کن» یا «حد ضرر چقدر باشد؟»");
  }

  // نمودار و نماد
  const symbolMap = { "BINANCE:BTCUSDT": "BTCUSDT", "BINANCE:ETHUSDT": "ETHUSDT", "BINANCE:SOLUSDT": "SOLUSDT", "BINANCE:BNBUSDT": "BNBUSDT" };
  const intervalMap = { "15": "15m", "60": "1h", "240": "4h", "D": "1d" };
  $("symbolSelect").addEventListener("change", (e) => {
    currentSymbol = symbolMap[e.target.value];
    TVChart.load(e.target.value, $("intervalSelect").value);
    refreshAnalysis();
  });
  $("intervalSelect").addEventListener("change", (e) => {
    currentInterval = intervalMap[e.target.value];
    TVChart.load($("symbolSelect").value, e.target.value);
    refreshAnalysis();
  });
  $("refreshAnalysis").onclick = refreshAnalysis;
  $("subscribeBtn").onclick = () => Billing.upgradeDemo();

  renderAuth();
  TVChart.load("BINANCE:BTCUSDT", "60");
  refreshAnalysis();
  setInterval(refreshAnalysis, 30000);
})();
