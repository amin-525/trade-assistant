// اشتراک: نمونه. برای فعال‌سازی واقعی، درگاه پرداخت (مثلاً زرین‌پال یا Stripe)
// را از طریق یک API سمت سرور صدا بزنید و بعد پلن کاربر را به pro تغییر دهید.
const Billing = (() => {
  function upgradeDemo() {
    const u = Auth.current();
    if (!u) return alert("ابتدا وارد حساب شوید.");
    Auth.update({ plan: "pro" });
    alert("اشتراک حرفه‌ای فعال شد (حالت نمایشی).");
    window.dispatchEvent(new Event("auth-changed"));
  }
  return { upgradeDemo };
})();
