// مدل زبانی داخل مرورگر (بدون API و بدون کلید) با Transformers.js
// مدل روی دستگاه کاربر دانلود و اجرا می‌شود؛ اولین بار چند صد مگابایت دانلود دارد.
const LocalLLM = (() => {
  // برای کیفیت بهتر می‌توانید به "onnx-community/Qwen2.5-1.5B-Instruct" تغییر دهید (حجم و نیاز سخت‌افزاری بیشتر)
  const MODEL_ID = "onnx-community/Qwen2.5-0.5B-Instruct";
  const LIB = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.2";
  let generator = null;
  let loading = null;
  let status = "idle"; // idle | loading | ready | error

  async function load(onProgress) {
    if (generator) return generator;
    if (loading) return loading;
    status = "loading";
    loading = (async () => {
      const { pipeline, env } = await import(LIB);
      env.allowLocalModels = false;
      const device = navigator.gpu ? "webgpu" : "wasm";
      generator = await pipeline("text-generation", MODEL_ID, {
        dtype: "q4",
        device,
        progress_callback: (p) => onProgress && p.progress && onProgress(Math.round(p.progress)),
      });
      status = "ready";
      return generator;
    })().catch((e) => {
      status = "error";
      loading = null;
      throw e;
    });
    return loading;
  }

  async function generate(messages, maxTokens = 350) {
    const gen = await load();
    const out = await gen(messages, { max_new_tokens: maxTokens, do_sample: false, repetition_penalty: 1.1 });
    const msgs = out[0].generated_text;
    return msgs[msgs.length - 1].content.trim();
  }

  return { load, generate, getStatus: () => status };
})();
