// نمایش نمودار زنده TradingView (ویجت رسمی)
const TVChart = {
  load(symbol = "BINANCE:BTCUSDT", interval = "60") {
    const container = document.getElementById("tvchart");
    container.innerHTML = "";
    const widget = document.createElement("div");
    widget.id = "tv_widget";
    widget.style.height = "100%";
    container.appendChild(widget);

    const init = () => {
      new TradingView.widget({
        autosize: true,
        symbol,
        interval,
        timezone: "Asia/Tehran",
        theme: "dark",
        style: "1",
        locale: "fa_IR",
        toolbar_bg: "#050816",
        enable_publishing: false,
        hide_side_toolbar: false,
        allow_symbol_change: true,
        withdateranges: true,
        studies: ["RSI@tv-basicstudies", "MACD@tv-basicstudies", "MASimple@tv-basicstudies"],
        container_id: "tv_widget",
      });
    };

    if (window.TradingView) {
      init();
    } else {
      const s = document.createElement("script");
      s.src = "https://s3.tradingview.com/tv.js";
      s.onload = init;
      document.head.appendChild(s);
    }
  },
};
