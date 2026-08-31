// Injected on demand by background.js when a phase ends (needs the optional
// scripting + host permission). Shows a slide-in banner at the top of the page.
// It lives in a shadow root so the page's CSS can't touch it, and the host is
// pinned with position:fixed + the max z-index so page content can't cover it.

if (!window.__tomatoPopReady) {
  window.__tomatoPopReady = true;

  const HOST_ID = "__tomato-pop-banner";

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.type === "TP_ALERT" && msg.banner) showBanner(msg.banner);
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
        :host {
          all: initial;
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          z-index: 2147483647 !important;
          pointer-events: none;
        }
        .wrap {
          pointer-events: auto;
          margin: 12px auto 0;
          width: min(400px, calc(100vw - 24px));
          display: flex; gap: 12px; align-items: flex-start;
          padding: 14px 14px 14px 16px;
          background: #fbf7f2; color: #3a3330;
          border-left: 4px solid ${accent};
          border-radius: 12px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, .18);
          font-family: system-ui, -apple-system, "Segoe UI", "Yu Gothic UI", Meiryo, sans-serif;
          transform: translateY(calc(-100% - 24px));
          transition: transform .38s cubic-bezier(.2, .9, .3, 1);
        }
        .wrap.in { transform: translateY(0); }
        .text { flex: 1; min-width: 0; }
        .title { font-size: 14px; font-weight: 700; }
        .body { font-size: 12px; color: #8a817b; margin-top: 2px; }
        .actions { display: flex; gap: 8px; margin-top: 10px; justify-content: space-between; }
        .btn {
          padding: 7px 14px;
          border: 0; border-radius: 8px; cursor: pointer;
          font: inherit; font-size: 12px; font-weight: 600;
        }
        .cta { background: #3a3330; color: #fbf7f2; }
        .end {
          background: transparent; color: #3a3330;
          border: 1px solid #ded5cd;
        }
        .close {
          border: 0; background: transparent; cursor: pointer;
          color: #8a817b; font-size: 18px; line-height: 1; padding: 0 2px;
          align-self: flex-start;
        }
        @media (prefers-color-scheme: dark) {
          .wrap { background: #2a2422; color: #ede4dc; box-shadow: 0 8px 30px rgba(0, 0, 0, .5); }
          .body { color: #a79e97; }
          .cta { background: #ede4dc; color: #2a2422; }
          .end { color: #ede4dc; border-color: #4a403b; }
          .close { color: #a79e97; }
        }
      </style>
      <div class="wrap" role="alert">
        <div class="text">
          <div class="title"></div>
          <div class="body"></div>
          <div class="actions">
            <button class="btn cta"></button>
            <button class="btn end"></button>
          </div>
        </div>
        <button class="close" aria-label="close">&times;</button>
      </div>
    `;
    root.querySelector(".title").textContent = b.title;
    root.querySelector(".body").textContent = b.body;
    root.querySelector(".cta").textContent = b.cta;
    root.querySelector(".end").textContent = b.end;
    root.querySelector(".close").setAttribute("aria-label", b.dismiss || "close");

    document.documentElement.appendChild(host);
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
    root.querySelector(".end").addEventListener("click", () => {
      chrome.runtime.sendMessage({ type: "EVENT", event: { type: "END_SESSION" } });
      dismiss();
    });
    root.querySelector(".close").addEventListener("click", dismiss);
    // No auto-dismiss: the banner stays until the user acts.
  }
}
