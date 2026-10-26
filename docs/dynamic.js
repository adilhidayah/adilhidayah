/* Motion layer: scroll progress, scroll reveal, count-up stats, cursor glow, nav scrollspy.
   Everything is skipped when the visitor prefers reduced motion, and the page is fully
   visible if this script never runs. */
(function () {
  const root = document.documentElement;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Cursor glow on glass cards: CSS reads --mx / --my.
  document.addEventListener(
    "pointermove",
    (e) => {
      const t = e.target.closest && e.target.closest(".card, .pc");
      if (!t) return;
      const r = t.getBoundingClientRect();
      t.style.setProperty("--mx", e.clientX - r.left + "px");
      t.style.setProperty("--my", e.clientY - r.top + "px");
    },
    { passive: true }
  );

  function init() {
    // Scroll progress bar.
    const bar = document.createElement("div");
    bar.className = "progress";
    bar.setAttribute("aria-hidden", "true");
    document.body.appendChild(bar);
    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const max = root.scrollHeight - window.innerHeight;
        bar.style.transform = "scaleX(" + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ")";
        ticking = false;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    // Journey: light each node as it scrolls into view.
    const stops = document.querySelectorAll(".stop");
    if (reduce || !("IntersectionObserver" in window)) stops.forEach((el) => el.classList.add("reached"));
    else {
      const jo = new IntersectionObserver(
        (entries) => entries.forEach((en) => { if (en.isIntersecting) en.target.classList.add("reached"); }),
        { rootMargin: "0px 0px -35% 0px" }
      );
      stops.forEach((el) => jo.observe(el));
    }

    if (reduce || !("IntersectionObserver" in window)) return;

    // Scroll reveal with a small stagger among siblings.
    const sel = [
      ".hero-main", ".hero-photo", ".tools .card", ".sec h2", ".projects-intro",
      ".bento .card", ".skills .card", ".pc", ".work-grid .card", ".stop .card", ".edu", ".contact .card",
      ".proj-head .card", ".proj-body .card"
    ].join(",");
    const items = Array.from(new Set(document.querySelectorAll(sel)));
    root.classList.add("js");
    const seen = new Map();
    items.forEach((el) => {
      const sibs = el.parentElement ? Array.from(el.parentElement.children) : [el];
      const n = seen.get(el.parentElement) || 0;
      seen.set(el.parentElement, n + 1);
      el.style.setProperty("--d", Math.min(n, 4) * 90 + "ms");
      el.classList.add("rv");
    });
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          const el = en.target;
          io.unobserve(el);
          el.classList.add("in");
          // Clean up afterwards so normal hover transitions work again.
          setTimeout(() => el.classList.remove("rv", "in"), 1100 + parseInt(el.style.getPropertyValue("--d") || "0", 10));
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    items.forEach((el) => io.observe(el));

    // Count-up for stat numbers ("19 years", "42 kg", "3.58" or "3,58").
    const nums = document.querySelectorAll(".stat .n");
    const nio = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          nio.unobserve(en.target);
          countUp(en.target);
        });
      },
      { threshold: 0.6 }
    );
    nums.forEach((n) => nio.observe(n));

    function countUp(el) {
      const text = el.textContent;
      const m = text.match(/^([\d.,]+)(.*)$/);
      if (!m) return;
      const sep = m[1].includes(",") ? "," : ".";
      const parts = m[1].replace(",", ".").split(".");
      const decimals = parts[1] ? parts[1].length : 0;
      const target = parseFloat(m[1].replace(",", "."));
      const suffix = m[2];
      const t0 = performance.now();
      const dur = 1100;
      function step(now) {
        if (el.textContent !== text && !el.dataset.counting) return;
        el.dataset.counting = "1";
        const p = Math.min(1, (now - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        const v = (target * eased).toFixed(decimals).replace(".", sep);
        el.textContent = v + suffix;
        if (p < 1) requestAnimationFrame(step);
        else {
          delete el.dataset.counting;
          el.textContent = text;
        }
      }
      requestAnimationFrame(step);
    }

    // Scrollspy: highlight the nav link of the section in view.
    const links = Array.from(document.querySelectorAll('.nav a.link[href^="#"]'));
    if (links.length) {
      const map = new Map();
      links.forEach((a) => {
        const s = document.querySelector(a.getAttribute("href"));
        if (s) map.set(s, a);
      });
      const sio = new IntersectionObserver(
        (entries) => {
          entries.forEach((en) => {
            const a = map.get(en.target);
            if (a && en.isIntersecting) {
              links.forEach((l) => l.classList.remove("active"));
              a.classList.add("active");
            }
          });
        },
        { rootMargin: "-45% 0px -50% 0px" }
      );
      map.forEach((_, s) => sio.observe(s));
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
