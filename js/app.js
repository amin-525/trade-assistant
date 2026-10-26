// اتصال همه بخش‌ها به هم
(function () {
  let currentSymbol = "BTCUSDT";
  let currentInterval = "1h";
  let lastAnalysis = null;
  let validSymbols = new Set();

  const $ = (id) => document.getElementById(id);
  const tvIntervalToMarket = { "15": "15m", "60": "1h", "240": "4h", "D": "1d" };

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
      ? (u.plan === "pro" ? "اشتراک فعال: چت نامحدود" : `پیام امروز: ${u.day === Auth.today() ? u.msgsToday : 0} از 5`)
      : "برای چت، وارد حساب شوید.";
  }

  function renderAnalysis(a) {
    const cls = a.score > 0 ? "up" : a.score < 0 ? "down" : "";
    $("analysisBox").innerHTML = `
      <div class="stat"><span>قیمت</span><strong>${a.price}</strong></div>
      <div class="stat"><span>تغییر ۲۴ ساعته</span><strong class="${a.change24 >= 0 ? "up" : "down"}">${a.change24.toFixed(2)}%</strong></div>
      <div class="stat"><span>RSI (14)</span><strong>${a.rsi.toFixed(1)}</strong></div>
      <div class="stat"><span>EMA20 / EMA50</span><strong>${a.ema20.toFixed(4)} / ${a.ema50.toFixed(4)}</strong></div>
      <div class="stat"><span>حمایت</span><strong>${a.support}</strong></div>
      <div class="stat"><span>مقاومت</span><strong>${a.resistance}</strong></div>
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

  function loadSymbol(sym) {
    currentSymbol = sym;
    $("symbolInput").value = sym;
    TVChart.load("BINANCE:" + sym, $("intervalSelect").value);
    refreshAnalysis();
  }

  // فهرست همه ارزها
  Market.fetchSymbols().then((list) => {
    validSymbols = new Set(list);
    $("symbolList").innerHTML = list.map((s) => `<option value="${s}"></option>`).join("");
  }).catch(() => {});

  $("symbolInput").addEventListener("change", (e) => {
    const v = e.target.value.trim().toUpperCase();
    if (validSymbols.size && !validSymbols.has(v)) {
      $("analysisBox").textContent = `نماد «${v}» در بایننس با جفت USDT پیدا نشد.`;
      return;
    }
    loadSymbol(v);
  });

  // اسکنر بازار
  $("scanBtn").onclick = async () => {
    const box = $("scanResult");
    box.textContent = "در حال اسکن ۵۰ ارز پرحجم...";
    try {
      const top = await Market.fetchTopByVolume(50);
      const rows = [];
      let i = 0;
      const worker = async () => {
        while (i < top.length) {
          const t = top[i++];
          try {
            const a = Market.analyze(await Market.fetchCandles(t.symbol, "1h", 200));
            rows.push({ ...t, a });
          } catch (e) { /* ارز بدون داده کافی نادیده گرفته می‌شود */ }
        }
      };
      await Promise.all([1, 2, 3, 4, 5].map(worker));
      rows.sort((x, y) => y.a.score - x.a.score);
      box.innerHTML = `<table>
        <thead><tr><th>نماد</th><th>قیمت</th><th>تغییر ۲۴س</th><th>RSI</th><th>جمع‌بندی</th><th>امتیاز</th></tr></thead>
        <tbody>${rows.map((r) => `
          <tr class="row" data-symbol="${r.symbol}">
            <td>${r.symbol}</td>
            <td>${r.price}</td>
            <td class="${r.change >= 0 ? "up" : "down"}">${r.change.toFixed(2)}%</td>
            <td>${r.a.rsi.toFixed(0)}</td>
            <td>${r.a.verdict}</td>
            <td class="${r.a.score > 0 ? "up" : r.a.score < 0 ? "down" : ""}">${r.a.score}</td>
          </tr>`).join("")}
        </tbody></table>
        <p class="muted">بر اساس تحلیل ۱ ساعته. این فهرست توصیه خرید یا فروش نیست.</p>`;
    } catch (e) {
      box.textContent = "خطا در اسکن: " + e.message;
    }
  };
  $("scanResult").addEventListener("click", (e) => {
    const row = e.target.closest("tr.row");
    if (row) {
      loadSymbol(row.dataset.symbol);
      $("dashboard").scrollIntoView({ behavior: "smooth" });
    }
  });

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
  Chat.append("bot", "سلام! من دستیار TradeMind هستم. هر ارزی از بایننس را در بالا انتخاب کنید یا از اسکنر استفاده کنید. بعد بپرسید، مثلاً «تحلیل کامل» یا «سرمایه 1000 ریسک 2».");

  // بازه زمانی نمودار
  $("intervalSelect").addEventListener("change", (e) => {
    currentInterval = tvIntervalToMarket[e.target.value];
    TVChart.load("BINANCE:" + currentSymbol, e.target.value);
    refreshAnalysis();
  });
  $("refreshAnalysis").onclick = refreshAnalysis;
  $("subscribeBtn").onclick = () => Billing.upgradeDemo();

  // مدل محلی
  $("llmToggle").onclick = async () => {
    const btn = $("llmToggle");
    const status = $("llmStatus");
    if (Chat.isLLM()) {
      Chat.setLLM(false);
      btn.textContent = "فعال‌سازی مدل هوش مصنوعی محلی (بدون API)";
      status.textContent = "حالت: موتور داخلی";
      return;
    }
    status.textContent = "در حال دانلود مدل (فقط بار اول)...";
    try {
      await LocalLLM.load((p) => (status.textContent = `دانلود مدل: ${p}%`));
      Chat.setLLM(true);
      btn.textContent = "غیرفعال‌سازی مدل محلی";
      status.textContent = "حالت: مدل هوش مصنوعی محلی فعال است";
    } catch (e) {
      status.textContent = "خطا در بارگذاری مدل: " + e.message + " (موتور داخلی فعال است)";
    }
  };

  renderAuth();
  loadSymbol("BTCUSDT");
  setInterval(refreshAnalysis, 30000);
})();
