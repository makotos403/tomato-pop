// Injected on demand by background.js when a phase ends (needs the optional
// scripting + host permission). Shows a slide-in banner and/or flashes the tab
// title. The banner lives in a shadow root so the page's CSS can't touch it.

if (!window.__tomatoPopReady) {
  window.__tomatoPopReady = true;

  const HOST_ID = "__tomato-pop-banner";

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.type !== "TP_ALERT") return;
    if (msg.banner) showBanner(msg.banner);
    if (msg.flash) flashTitle(msg.flash.label);
  });

  function showBanner(b) {
    document.getElementById(HOST_ID)?.remove();

    // Pomodoro finished -> a break is next: calm leaf accent.
    // A break finished -> focus is next: tomato accent.
    const accent = b.kind === "pomodoro" ? "#7d8b6a" : "#e5533d";

    const host = document.createElement("div");
    host.id = HOST_ID;
    const root = host.attachShadow({ mode: "open" });
    root.innerHTML = `
      <style>
        :host { all: initial; }
        .wrap {
          position: fixed; top: 12px; left: 50%;
          transform: translate(-50%, calc(-100% - 24px));
          width: min(400px, calc(100vw - 24px));
          display: flex; gap: 12px; align-items: flex-start;
          padding: 14px 14px 14px 16px;
          background: #fbf7f2; color: #3a3330;
          border-left: 4px solid ${accent};
          border-radius: 12px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, .18);
          font-family: system-ui, -apple-system, "Segoe UI", "Yu Gothic UI", Meiryo, sans-serif;
          z-index: 2147483647;
          transition: transform .38s cubic-bezier(.2, .9, .3, 1);
        }
        .wrap.in { transform: translate(-50%, 0); }
        .text { flex: 1; min-width: 0; }
        .title { font-size: 14px; font-weight: 700; }
        .body { font-size: 12px; color: #8a817b; margin-top: 2px; }
        .cta {
          margin-top: 10px; padding: 7px 14px;
          border: 0; border-radius: 8px; cursor: pointer;
          background: #3a3330; color: #fbf7f2;
          font: inherit; font-size: 12px; font-weight: 600;
        }
        .close {
          border: 0; background: transparent; cursor: pointer;
          color: #8a817b; font-size: 18px; line-height: 1; padding: 0 2px;
        }
        @media (prefers-color-scheme: dark) {
          .wrap { background: #2a2422; color: #ede4dc; box-shadow: 0 8px 30px rgba(0, 0, 0, .5); }
          .body { color: #a79e97; }
          .cta { background: #ede4dc; color: #2a2422; }
          .close { color: #a79e97; }
        }
      </style>
      <div class="wrap" role="alert">
        <div class="text">
          <div class="title"></div>
          <div class="body"></div>
          <button class="cta"></button>
        </div>
        <button class="close" aria-label="close">&times;</button>
      </div>
    `;
    root.querySelector(".title").textContent = b.title;
    root.querySelector(".body").textContent = b.body;
    root.querySelector(".cta").textContent = b.cta;
    root.querySelector(".close").setAttribute("aria-label", b.dismiss || "close");

    (document.body || document.documentElement).appendChild(host);
    const wrap = root.querySelector(".wrap");
    requestAnimationFrame(() => wrap.classList.add("in"));

    let closed = false;
    const dismiss = () => {
      if (closed) return;
      closed = true;
      wrap.classList.remove("in");
      setTimeout(() => host.remove(), 420);
    };

    root.querySelector(".cta").addEventListener("click", () => {
      chrome.runtime.sendMessage({ type: "EVENT", event: { type: "START" } });
      dismiss();
    });
    root.querySelector(".close").addEventListener("click", dismiss);
    setTimeout(dismiss, 9000);
  }

  function flashTitle(label) {
    if (window.__tomatoPopFlashStop) return; // already flashing
    if (document.hasFocus()) return; // user is already on this tab

    const original = document.title;
    let on = false;
    let ticks = 0;

    const id = setInterval(() => {
      on = !on;
      ticks += 1;
      document.title = on ? label : original;
      if (ticks >= 20) stop();
    }, 900);

    function stop() {
      clearInterval(id);
      document.title = original;
      window.removeEventListener("focus", stop);
      window.__tomatoPopFlashStop = null;
    }

    window.__tomatoPopFlashStop = stop;
    window.addEventListener("focus", stop);
  }
}
