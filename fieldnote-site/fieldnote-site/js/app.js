/* Fieldnote — tab routing, keyboard support, demo form.
   No dependencies. Tabs are real buttons driven by ARIA + the URL hash. */

(() => {
  "use strict";

  const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
  const rule = document.querySelector(".tabs__rule");
  const names = tabs.map((tab) => tab.dataset.panel);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const panelFor = (tab) => document.getElementById(tab.getAttribute("aria-controls"));

  const titles = {
    home: "Fieldnote — Independent design studio",
    services: "Services — Fieldnote Studio",
    work: "Work — Fieldnote Studio",
    about: "About — Fieldnote Studio",
    contact: "Contact — Fieldnote Studio",
  };

  /* ── Indicator ─────────────────────────────────────────── */

  function moveIndicator(tab, animate = true) {
    if (!rule || !tab) return;
    if (!animate) rule.style.transition = "none";
    rule.style.width = `${tab.offsetWidth}px`;
    rule.style.transform = `translateX(${tab.offsetLeft}px)`;
    if (!animate) {
      // Force a reflow so the transition property can be restored cleanly.
      void rule.offsetWidth;
      rule.style.transition = "";
    }
  }

  /* ── Activation ────────────────────────────────────────── */

  function activate(name, { updateHash = true, scroll = false } = {}) {
    const target = tabs.find((tab) => tab.dataset.panel === name);
    if (!target) return false;

    tabs.forEach((tab) => {
      const selected = tab === target;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;

      const panel = panelFor(tab);
      if (!panel) return;

      if (selected) {
        panel.hidden = false;
        panel.classList.add("is-active");
      } else {
        panel.hidden = true;
        panel.classList.remove("is-active");
      }
    });

    moveIndicator(target);
    document.title = titles[name] || document.title;

    if (updateHash && window.location.hash !== `#${name}`) {
      history.pushState({ tab: name }, "", `#${name}`);
    }

    if (scroll && window.scrollY > 80) {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    }

    return true;
  }

  function activateFromHash(fallback = "home") {
    const name = window.location.hash.replace("#", "");
    return activate(names.includes(name) ? name : fallback, { updateHash: false });
  }

  /* ── Tab interactions ──────────────────────────────────── */

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => {
      activate(tab.dataset.panel, { scroll: true });
    });

    tab.addEventListener("keydown", (event) => {
      const keys = {
        ArrowRight: (index + 1) % tabs.length,
        ArrowLeft: (index - 1 + tabs.length) % tabs.length,
        Home: 0,
        End: tabs.length - 1,
      };
      if (!(event.key in keys)) return;

      event.preventDefault();
      const next = tabs[keys[event.key]];
      next.focus();
      activate(next.dataset.panel);
      next.scrollIntoView({ block: "nearest", inline: "center" });
    });
  });

  /* In-page links that switch tabs (#work, #contact, …). */
  document.querySelectorAll("[data-tab-link]").forEach((link) => {
    link.addEventListener("click", (event) => {
      const name = link.dataset.tabLink;
      if (!names.includes(name)) return;
      event.preventDefault();
      activate(name, { scroll: true });
      if (window.scrollY > 80) window.scrollTo({ top: 0, behavior: "smooth" });
      const tab = tabs.find((t) => t.dataset.panel === name);
      tab?.scrollIntoView({ block: "nearest", inline: "center" });
    });
  });

  window.addEventListener("popstate", () => activateFromHash());
  window.addEventListener("hashchange", () => activateFromHash());

  /* ── Boot ──────────────────────────────────────────────── */

  activateFromHash();

  requestAnimationFrame(() => {
    const active = tabs.find((tab) => tab.getAttribute("aria-selected") === "true");
    moveIndicator(active, false);
  });

  if (document.fonts?.ready) {
    document.fonts.ready.then(() => {
      const active = tabs.find((tab) => tab.getAttribute("aria-selected") === "true");
      moveIndicator(active, false);
    });
  }

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const active = tabs.find((tab) => tab.getAttribute("aria-selected") === "true");
      moveIndicator(active, false);
    }, 120);
  });

  /* ── Demo form ─────────────────────────────────────────── */

  const form = document.getElementById("contact-form");
  const status = document.getElementById("form-status");

  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const fields = [
        { input: document.getElementById("cf-name"), test: (v) => v.trim().length > 0 },
        { input: document.getElementById("cf-email"), test: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) },
        { input: document.getElementById("cf-message"), test: (v) => v.trim().length > 8 },
      ];

      let firstInvalid = null;
      fields.forEach(({ input, test }) => {
        if (!input) return;
        const wrap = input.closest(".field");
        const valid = test(input.value);
        if (wrap) wrap.dataset.invalid = valid ? "false" : "true";
        input.setAttribute("aria-invalid", String(!valid));
        if (!valid && !firstInvalid) firstInvalid = input;
      });

      if (firstInvalid) {
        status.textContent = "Check the marked fields and try again.";
        firstInvalid.focus();
        return;
      }

      status.textContent = "This template form doesn't send yet — email hello@fieldnote.studio.";
      form.reset();
      fields.forEach(({ input }) => {
        input?.closest(".field")?.setAttribute("data-invalid", "false");
      });
    });
  }

  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
