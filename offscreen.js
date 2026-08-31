// Offscreen document: plays the end-of-phase chime.
//
// It builds a short WAV in memory (a two-note bell) and plays it through an
// <audio> element. That path is the one Chrome exempts from autoplay
// restrictions for offscreen documents created with reason AUDIO_PLAYBACK —
// an AudioContext is not reliably exempt when triggered by an alarm (no user
// gesture), which is why the timer's chime was silent while Preview worked.

let chimeUri = null;

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.target !== "offscreen") return;
  if (msg.type === "PLAY_CHIME") {
    playChime(msg.volume ?? 0.5);
    sendResponse({ played: true });
  }
});

function playChime(volume) {
  const audio = new Audio(getChimeUri());
  audio.volume = Math.max(0, Math.min(1, volume));
  audio.play().catch(() => {
    /* nothing else we can do from here */
  });
}

function getChimeUri() {
  if (!chimeUri) chimeUri = buildChimeWav();
  return chimeUri;
}

// --- WAV synthesis -----------------------------------------------------

function buildChimeWav() {
  const sampleRate = 44100;
  const duration = 1.7; // seconds
  const n = Math.floor(sampleRate * duration);
  const samples = new Float32Array(n);

  // two soft notes: E5 then B5 (a perfect fifth), gentle bell-like decay
  const notes = [
    { freq: 659.25, start: 0.0, length: 1.3 },
    { freq: 987.77, start: 0.16, length: 1.5 },
  ];

  for (const note of notes) {
    const s0 = Math.floor(note.start * sampleRate);
    const len = Math.floor(note.length * sampleRate);
    for (let i = 0; i < len && s0 + i < n; i++) {
      const t = i / sampleRate;
      const attack = Math.min(1, t / 0.008); // ~8ms fade-in kills the onset click
      const env = attack * Math.exp(-t * 2.6); // slow amplitude decay
      const tone =
        Math.sin(2 * Math.PI * note.freq * t) * 0.38 +
        Math.sin(2 * Math.PI * note.freq * 2 * t) * 0.05 * Math.exp(-t * 5);
      samples[s0 + i] += tone * env;
    }
  }

  return encodeWavDataUri(samples, sampleRate);
}

function encodeWavDataUri(samples, sampleRate) {
  const n = samples.length;
  const buffer = new ArrayBuffer(44 + n * 2);
  const view = new DataView(buffer);
  const writeStr = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeStr(0, "RIFF");
  view.setUint32(4, 36 + n * 2, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, n * 2, true);

  let offset = 44;
  for (let i = 0; i < n; i++) {
    const v = Math.max(-1, Math.min(1, samples[i] * 0.75));
    view.setInt16(offset, v * 32767, true);
    offset += 2;
  }

  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return "data:audio/wav;base64," + btoa(binary);
}
