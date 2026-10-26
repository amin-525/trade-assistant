// اتصال همه بخش‌ها به هم
(function () {
  let currentSymbol = "BTCUSDT";
  let currentMarket = "spot"; // spot | futures
  let currentInterval = "1h";
  let lastAnalysis = null;
  const symbolsByMarket = { spot: new Set(), futures: new Set() };

  const $ = (id) => document.getElementById(id);
  const tvIntervalToMarket = { "15": "15m", "60": "1h", "240": "4h", "D": "1d" };
  const tvSymbol = (sym, mk) => "BINANCE:" + sym + (mk === "futures" ? ".P" : "");

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
      lastAnalysis = Market.analyze(await Market.fetchCandles(currentSymbol, currentInterval, 300, currentMarket));
      renderAnalysis(lastAnalysis);
    } catch (e) {
      $("analysisBox").textContent = "خطا در دریافت داده: " + e.message;
    }
  }

  function loadSymbol(sym, mk = currentMarket) {
    currentSymbol = sym;
    currentMarket = mk;
    $("symbolInput").value = sym;
    $("marketSelect").value = mk;
    TVChart.load(tvSymbol(sym, mk), $("intervalSelect").value);
    refreshAnalysis();
  }

  // فهرست نمادها برای هر بازار
  async function loadSymbolLists() {
    for (const mk of ["spot", "futures"]) {
      try {
        const list = await Market.fetchSymbols(mk);
        symbolsByMarket[mk] = new Set(list);
      } catch (e) { /* بازار بدون داده */ }
    }
    refreshDatalist();
  }

  function refreshDatalist() {
    const list = [...symbolsByMarket[currentMarket]];
    $("symbolList").innerHTML = list.map((s) => `<option value="${s}"></option>`).join("");
  }

  $("marketSelect").addEventListener("change", (e) => {
    currentMarket = e.target.value;
    refreshDatalist();
    const sym = symbolsByMarket[currentMarket].has(currentSymbol) ? currentSymbol : "BTCUSDT";
    loadSymbol(sym, currentMarket);
  });

  $("symbolInput").addEventListener("change", (e) => {
    const v = e.target.value.trim().toUpperCase();
    const set = symbolsByMarket[currentMarket];
    if (set.size && !set.has(v)) {
      $("analysisBox").textContent = `نماد «${v}» در بازار ${currentMarket === "spot" ? "اسپات" : "فیوچر"} بایننس پیدا نشد.`;
      return;
    }
    loadSymbol(v, currentMarket);
  });

  // لیست بازارها: اسپات، فیوچر، طلا
  let activeTab = "spot";
  function renderMarketList() {
    const q = $("marketSearch").value.trim().toUpperCase();
    let list;
    if (activeTab === "gold") {
      list = [...symbolsByMarket.spot].filter((s) => /PAXG|XAUT/.test(s));
    } else {
      list = [...symbolsByMarket[activeTab]];
    }
    if (q) list = list.filter((s) => s.includes(q));
    if (!list.length) {
      $("marketList").textContent = "موردی پیدا نشد (یا داده هنوز بارگذاری نشده).";
      return;
    }
    $("marketList").innerHTML = list.slice(0, 400).map((s) => `<button data-sym="${s}" data-mk="${activeTab === "futures" ? "futures" : "spot"}">${s}</button>`).join("");
  }
  document.querySelectorAll(".mk-tab").forEach((b) =>
    b.addEventListener("click", () => {
      document.querySelectorAll(".mk-tab").forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      activeTab = b.dataset.mk;
      renderMarketList();
    })
  );
  $("marketSearch").addEventListener("input", renderMarketList);
  $("marketList").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-sym]");
    if (!btn) return;
    loadSymbol(btn.dataset.sym, btn.dataset.mk);
    $("dashboard").scrollIntoView({ behavior: "smooth" });
  });

  // اسکنر بازار
  $("scanBtn").onclick = async () => {
    const box = $("scanResult");
    const mk = currentMarket;
    box.textContent = "در حال اسکن ۵۰ ارز پرحجم...";
    try {
      const top = await Market.fetchTopByVolume(50, mk);
      const rows = [];
      let i = 0;
      const worker = async () => {
        while (i < top.length) {
          const t = top[i++];
          try {
            const a = Market.analyze(await Market.fetchCandles(t.symbol, "1h", 200, mk));
            rows.push({ ...t, a });
          } catch (e) { /* داده کافی نیست */ }
        }
      };
      await Promise.all([1, 2, 3, 4, 5].map(worker));
      rows.sort((x, y) => y.a.score - x.a.score);
      box.innerHTML = `<table>
        <thead><tr><th>نماد</th><th>قیمت</th><th>تغییر ۲۴س</th><th>RSI</th><th>جمع‌بندی</th><th>امتیاز</th></tr></thead>
        <tbody>${rows.map((r) => `
          <tr class="row" data-symbol="${r.symbol}" data-mk="${mk}">
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
      loadSymbol(row.dataset.symbol, row.dataset.mk);
      $("dashboard").scrollIntoView({ behavior: "smooth" });
    }
  });

  // پیشنهاد پوزیشن
  $("plBtn").onclick = () => {
    const out = Engine.planPosition(lastAnalysis, {
      market: $("plMarket").value,
      capital: +$("plCapital").value || 1000,
      riskPct: +$("plRisk").value || 1,
      leverage: +$("plLev").value || 1,
      symbol: currentSymbol,
    });
    $("plOut").textContent = out;
  };

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
    Chat.send(text, lastAnalysis, currentSymbol.replace("USDT", "/USDT"), currentMarket).then(renderAuth);
  });
  Chat.append("bot", "سلام! من دستیار TradeMind هستم. ارز یا بازار (اسپات، فیوچر، طلا) را انتخاب کنید. بعد بپرسید، مثلاً «پوزیشن فیوچر سرمایه 1000 ریسک 1 لوریج 5» یا «تحلیل کامل».");

  // بازه زمانی نمودار
  $("intervalSelect").addEventListener("change", (e) => {
    currentInterval = tvIntervalToMarket[e.target.value];
    TVChart.load(tvSymbol(currentSymbol, currentMarket), e.target.value);
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
  loadSymbolLists().then(() => renderMarketList());
  loadSymbol("BTCUSDT", "spot");
  setInterval(refreshAnalysis, 30000);
})();
