// اشتراک: پلن فقط از سمت سرور تغییر می‌کند (بعد از پرداخت موفق).
// در حالت نمایشی بدون Supabase، فعال‌سازی محلی برای تست امکان‌پذیر است.
const Billing = (() => {
  function upgradeDemo() {
    const u = Auth.current();
    if (!u) return alert("ابتدا وارد حساب شوید.");
    if (Auth.isBackend()) {
      return alert("برای خرید اشتراک، درگاه پرداخت باید وصل شود. بعد از پرداخت موفق، پلن شما روی سرور فعال می‌شود.");
    }
    alert("حالت نمایشی: اشتراک محلی فعال شد (فقط برای تست).");
    window.dispatchEvent(new Event("auth-changed"));
  }
  return { upgradeDemo };
})();
