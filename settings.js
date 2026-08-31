// The settings view shown inside the popup (same 300px area as the timer).
// popup.js owns the shared { settings, t } object and passes it in as ctx.state.

const $ = (id) => document.getElementById(id);

// scripting + host access — needed for tab flashing and the in-page banner.
const HOST_PERM = { permissions: ["scripting"], origins: ["*://*/*"] };

let ctx; // { send, state: { settings, t }, relocalizeAll }
let savedTimer;

export function initSettings(context) {
  ctx = context;
  wire();
}

// --- render ---

export function localizeSettings() {
  const t = ctx.state.t;
  $("s-title").textContent = t("settings.title");

  $("s-h-durations").textContent = t("settings.durationsHeading");
  $("s-l-pomodoro").textContent = t("settings.workLen");
  $("s-l-shortBreak").textContent = t("settings.shortBreakLen");
  $("s-l-longBreak").textContent = t("settings.longBreakLen");
  $("s-l-interval").textContent = t("settings.longBreakInterval");
  document
    .querySelectorAll("[data-unit]")
    .forEach((e) => (e.textContent = t("settings.minutes")));

  $("s-h-notify").textContent = t("settings.notifyHeading");
  $("s-l-sound").textContent = t("settings.sound");
  $("o-sound-system").textContent = t("settings.soundSystem");
  $("o-sound-chime").textContent = t("settings.soundChime");
  $("o-sound-none").textContent = t("settings.soundNone");
  $("s-l-volume").textContent = t("settings.volume");
  $("btn-preview").textContent = t("settings.soundPreview");
  $("s-l-flashTab").textContent = t("settings.flashTab");
  $("s-l-inPageBanner").textContent = t("settings.inPageBanner");
  $("perm-note").textContent = t("settings.permissionNote");

  $("s-h-icon").textContent = t("settings.iconHeading");
  $("s-l-showBadge").textContent = t("settings.showBadge");

  $("s-h-language").textContent = t("settings.languageHeading");
  $("o-lang-auto").textContent = t("settings.langAuto");
  $("o-lang-ja").textContent = t("settings.langJa");
  $("o-lang-en").textContent = t("settings.langEn");
}

export function fillSettings() {
  const s = ctx.state.settings;
  $("dur-pomodoro").value = s.durations.pomodoro;
  $("dur-shortBreak").value = s.durations.shortBreak;
  $("dur-longBreak").value = s.durations.longBreak;
  $("interval").value = s.longBreakInterval;

  document.querySelector(`input[name=sound][value="${s.sound}"]`).checked = true;
  $("volume").value = Math.round((s.volume ?? 0.5) * 100);
  $("volume-row").hidden = s.sound !== "chime";

  $("flashTab").checked = s.flashTab;
  $("inPageBanner").checked = s.inPageBanner;
  $("showBadge").checked = s.showBadge;

  document.querySelector(`input[name=lang][value="${s.language}"]`).checked = true;
  $("perm-note").hidden = false;
}

// --- persistence ---

async function save(patch) {
  const res = await ctx.send({ type: "SET_SETTINGS", patch });
  ctx.state.settings = res.settings;
  flashSaved();
}

function flashSaved() {
  const s = $("s-saved");
  s.textContent = ctx.state.t("settings.saved");
  s.hidden = false;
  s.style.opacity = "1";
  clearTimeout(savedTimer);
  savedTimer = setTimeout(() => (s.style.opacity = "0"), 1200);
}

function clampInt(value, min, max, fallback) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

// --- permission toggles ---

async function onPermToggle(key, checkbox) {
  if (checkbox.checked) {
    let granted = false;
    try {
      granted = await chrome.permissions.request(HOST_PERM);
    } catch (_) {
      granted = false;
    }
    if (!granted) {
      checkbox.checked = false;
      const n = $("perm-note");
      n.textContent = ctx.state.t("permission.denied");
      setTimeout(
        () => (n.textContent = ctx.state.t("settings.permissionNote")),
        4000,
      );
      return;
    }
  }
  await save({ [key]: checkbox.checked });
  const s = ctx.state.settings;
  if (!s.flashTab && !s.inPageBanner) {
    try {
      await chrome.permissions.remove(HOST_PERM);
    } catch (_) {
      /* ignore */
    }
  }
}

// --- wiring (once) ---

function wire() {
  const durMap = {
    "dur-pomodoro": "pomodoro",
    "dur-shortBreak": "shortBreak",
    "dur-longBreak": "longBreak",
  };
  for (const [id, key] of Object.entries(durMap)) {
    $(id).addEventListener("change", () => {
      const v = clampInt($(id).value, 1, 180, ctx.state.settings.durations[key]);
      $(id).value = v;
      save({ durations: { ...ctx.state.settings.durations, [key]: v } });
    });
  }

  $("interval").addEventListener("change", () => {
    const v = clampInt($("interval").value, 1, 12, ctx.state.settings.longBreakInterval);
    $("interval").value = v;
    save({ longBreakInterval: v });
  });

  document.querySelectorAll("input[name=sound]").forEach((r) =>
    r.addEventListener("change", () => {
      $("volume-row").hidden = r.value !== "chime";
      save({ sound: r.value });
    }),
  );
  $("volume").addEventListener("change", () =>
    save({ volume: Number($("volume").value) / 100 }),
  );
  $("btn-preview").addEventListener("click", () =>
    ctx.send({ type: "PREVIEW_SOUND" }),
  );

  $("flashTab").addEventListener("change", (e) => onPermToggle("flashTab", e.target));
  $("inPageBanner").addEventListener("change", (e) =>
    onPermToggle("inPageBanner", e.target),
  );
  $("showBadge").addEventListener("change", () =>
    save({ showBadge: $("showBadge").checked }),
  );

  document.querySelectorAll("input[name=lang]").forEach((r) =>
    r.addEventListener("change", async () => {
      await save({ language: r.value });
      await ctx.relocalizeAll();
    }),
  );
}
