export function speak(text, lang = "en-US") {
  if (!("speechSynthesis" in window)) return;

  try {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    window.speechSynthesis.cancel();

    setTimeout(() => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      u.volume = 1.0;
      u.rate = 0.95;
      u.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const target = (lang || "en-US").toLowerCase();
        const match = voices.find(
          (v) => v.lang.toLowerCase() === target || v.lang.toLowerCase().startsWith(target.slice(0, 2))
        );
        if (match) u.voice = match;
      }

      window.speechSynthesis.speak(u);
    }, 60);
  } catch (e) {
    console.error("SpeechSynthesis error:", e);
  }
}

export function listen({ lang = "en-US", onResult, onError, onEnd } = {}) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    onError && onError(new Error("Speech recognition not supported"));
    return null;
  }
  const rec = new SR();
  rec.lang = lang;
  rec.interimResults = false;
  rec.maxAlternatives = 1;
  rec.onresult = (e) => onResult && onResult(e.results[0][0].transcript);
  rec.onerror = (e) => onError && onError(e);
  rec.onend = () => onEnd && onEnd();
  rec.start();
  return rec;
}