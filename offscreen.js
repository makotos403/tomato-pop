// Offscreen document: synthesises a soft two-note chime with Web Audio.
// No audio file needed. Messages are addressed with target: "offscreen".

let ctx;

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.target !== "offscreen") return;
  if (msg.type === "PLAY_CHIME") {
    playChime(msg.volume ?? 0.5);
    sendResponse({ played: true });
  }
});

function playChime(volume) {
  if (!ctx) ctx = new (self.AudioContext || self.webkitAudioContext)();
  if (ctx.state === "suspended") ctx.resume();

  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.value = Math.max(0, Math.min(1, volume)) * 0.55;
  master.connect(ctx.destination);

  // gentle, bell-like: two rising notes (A5 → E6, a perfect fifth)
  note(880.0, now, 0.9, master);
  note(1318.51, now + 0.13, 1.15, master);
}

function note(freq, start, dur, out) {
  const fundamental = ctx.createOscillator();
  const shimmer = ctx.createOscillator();
  const g1 = ctx.createGain();
  const g2 = ctx.createGain();

  fundamental.type = "sine";
  shimmer.type = "sine";
  fundamental.frequency.value = freq;
  shimmer.frequency.value = freq * 2; // one octave up, for a touch of sparkle

  g1.gain.setValueAtTime(0, start);
  g1.gain.linearRampToValueAtTime(0.5, start + 0.012);
  g1.gain.exponentialRampToValueAtTime(0.0001, start + dur);

  g2.gain.setValueAtTime(0, start);
  g2.gain.linearRampToValueAtTime(0.1, start + 0.012);
  g2.gain.exponentialRampToValueAtTime(0.0001, start + dur * 0.55);

  fundamental.connect(g1).connect(out);
  shimmer.connect(g2).connect(out);

  fundamental.start(start);
  shimmer.start(start);
  fundamental.stop(start + dur + 0.05);
  shimmer.stop(start + dur + 0.05);
}
