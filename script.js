// ---------- SINGLE-PAGE NAVIGATION ----------
let scrollObserver = null;

function getValidPages() {
  return [...document.querySelectorAll(".page")].map((p) => p.dataset.page);
}

function showPage(pageId, mode = "push") {
  const valid = getValidPages();
  if (!valid.includes(pageId)) pageId = "home";

  document
    .querySelectorAll(".page")
    .forEach((page) => page.classList.remove("active"));

  const target = document.getElementById("page-" + pageId);
  if (target) target.classList.add("active");

  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.remove("active");
    link.removeAttribute("aria-current");
    if (link.dataset.page === pageId) {
      link.classList.add("active");
      link.setAttribute("aria-current", "page");
    }
  });

  if (mode === "push") {
    history.pushState({ page: pageId }, "", "#" + pageId);
  } else if (mode === "replace") {
    history.replaceState({ page: pageId }, "", "#" + pageId);
  }

  initScrollAnimations();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.addEventListener("click", (e) => {
  const link = e.target.closest("a[data-page], button[data-page]");
  if (!link) return;
  e.preventDefault();
  const pageId = link.dataset.page;
  if (pageId) showPage(pageId, "push");
});

window.addEventListener("popstate", () => {
  const hash = window.location.hash.replace("#", "") || "home";
  if (!getValidPages().includes(hash)) return;
  showPage(hash, "none");
});

window.addEventListener("hashchange", () => {
  const hash = window.location.hash.replace("#", "") || "home";
  if (!getValidPages().includes(hash)) return;
  const active = document.querySelector(".page.active");
  if (active && active.dataset.page === hash) return;
  showPage(hash, "none");
});

// ---------- THEME TOGGLE ----------
function setThemeIcon(button, isDark) {
  if (!button) return;
  button.innerHTML = isDark
    ? '<i class="fas fa-sun" aria-hidden="true"></i>'
    : '<i class="fas fa-moon" aria-hidden="true"></i>';
}

function rotateThemeButton(button) {
  if (!button) return;
  const icon = button.querySelector("i");
  if (!icon) return;
  icon.classList.remove("is-rotating");
  void icon.offsetWidth;
  icon.classList.add("is-rotating");
}

function isDarkTheme() {
  return document.documentElement.classList.contains("dark-theme");
}

function updateHeroBackground() {
  const hero = document.querySelector(".hero");
  if (!hero) return;
  hero.style.backgroundImage = isDarkTheme()
    ? "url('images/flat.avif')"
    : "url('images/hero.jpeg')";
}

function applyTheme(button, isDark) {
  document.documentElement.classList.toggle("dark-theme", isDark);
  document.body.classList.toggle("dark-theme", isDark);
  setThemeIcon(button, isDark);
  updateHeroBackground();
  if (window.__refreshGridColors) window.__refreshGridColors();
}

function initThemeToggle() {
  let isDark;
  try {
    const saved = localStorage.getItem("theme");
    isDark = saved
      ? saved === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch (e) {
    isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  const themeToggle = document.getElementById("theme-toggle");
  applyTheme(themeToggle, isDark);

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const nowDark = !isDarkTheme();
      try {
        localStorage.setItem("theme", nowDark ? "dark" : "light");
      } catch (e) {}
      applyTheme(themeToggle, nowDark);
      rotateThemeButton(themeToggle);
    });
  }
}

// ---------- CONTACT FORM ----------
function initContactForm() {
  const form = document.getElementById("contact-form");
  const submitBtn = document.getElementById("submitBtn");
  const toast = document.getElementById("toast-success");
  if (!form || !submitBtn || !toast) return;

  const nameField = document.getElementById("fullname");
  const emailField = document.getElementById("email");
  const messageField = document.getElementById("message");
  const nameError = document.getElementById("name-error");
  const emailError = document.getElementById("email-error");
  const messageError = document.getElementById("message-error");
  const charCountEl = document.querySelector(".char-count");
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (messageField && charCountEl) {
    messageField.addEventListener("input", () => {
      const current = messageField.value.length;
      charCountEl.textContent = `${current} / 500`;
      charCountEl.style.color =
        current > 450 ? "#e11d48" : "var(--placeholder-color)";
    });
  }

  [nameField, emailField, messageField].forEach((field) => {
    if (field)
      field.addEventListener("input", () => field.classList.remove("error"));
  });

  function showToast(message, isSuccess) {
    toast.textContent = message;
    toast.style.background = isSuccess ? "#16a34a" : "#e11d48";
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), isSuccess ? 4000 : 5000);
  }

  function setFieldError(field, errorEl, message) {
    field.classList.add("error");
    field.setAttribute("aria-invalid", "true");
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.add("visible");
      field.setAttribute("aria-describedby", errorEl.id);
    }
  }

  function clearFieldError(field, errorEl) {
    field.classList.remove("error");
    field.removeAttribute("aria-invalid");
    field.removeAttribute("aria-describedby");
    if (errorEl) {
      errorEl.textContent = "";
      errorEl.classList.remove("visible");
    }
  }

  function validateField(field) {
    const value = field.value.trim();
    if (field === nameField) {
      if (value === "") {
        setFieldError(field, nameError, "Please enter your name.");
        return false;
      }
      clearFieldError(field, nameError);
      return true;
    }
    if (field === emailField) {
      if (value === "") {
        setFieldError(field, emailError, "Email is required.");
        return false;
      }
      if (!EMAIL_RE.test(value)) {
        setFieldError(field, emailError, "Enter a valid email address.");
        return false;
      }
      clearFieldError(field, emailError);
      return true;
    }
    if (field === messageField) {
      if (value === "") {
        setFieldError(field, messageError, "Please write a short message.");
        return false;
      }
      clearFieldError(field, messageError);
      return true;
    }
    return true;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    let allValid = true;
    [nameField, emailField, messageField].forEach((field) => {
      if (field && !validateField(field)) allValid = false;
    });
    if (!allValid) return;

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending…';

    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });

      if (response.ok) {
        showToast("Thank you! Your message has been sent.", true);
        form.reset();
        if (charCountEl) charCountEl.textContent = "0 / 500";
      } else {
        const data = await response.json().catch(() => ({}));
        const msg =
          (data.errors && data.errors[0] && data.errors[0].message) ||
          "Something went wrong. Please email me directly.";
        showToast(msg, false);
      }
    } catch (err) {
      showToast(
        "Network error. Please check your connection and try again.",
        false
      );
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = "Send Message";
    }
  });
}

// ---------- MOBILE MENU ----------
function initMobileMenu() {
  const toggle = document.querySelector(".menu-toggle");
  const menu = document.querySelector(".mobile-menu");
  const overlay = document.querySelector(".menu-overlay");
  if (!toggle || !menu) return;

  let touchStartY = 0;
  let previousFocus = null;

  const getFocusable = () =>
    menu.querySelectorAll(
      'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );

  const setOpen = (open) => {
    menu.classList.toggle("active", open);
    toggle.classList.toggle("active", open);
    overlay && overlay.classList.toggle("active", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menu.setAttribute("aria-hidden", open ? "false" : "true");
    document.body.style.overflow = open ? "hidden" : "";

    if (open) {
      previousFocus = document.activeElement;
      const focusables = getFocusable();
      if (focusables.length) setTimeout(() => focusables[0].focus(), 60);
    } else if (previousFocus && previousFocus.focus) {
      previousFocus.focus();
    }
  };

  toggle.addEventListener("click", () =>
    setOpen(!menu.classList.contains("active"))
  );
  overlay && overlay.addEventListener("click", () => setOpen(false));
  menu
    .querySelectorAll(".nav-link")
    .forEach((link) => link.addEventListener("click", () => setOpen(false)));

  document.addEventListener("keydown", (e) => {
    if (!menu.classList.contains("active")) return;
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key === "Tab") {
      const focusables = getFocusable();
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 760 && menu.classList.contains("active"))
      setOpen(false);
  });

  menu.addEventListener("touchstart", (e) => {
    touchStartY = e.touches[0].clientY;
  });
  menu.addEventListener(
    "touchmove",
    (e) => {
      const deltaY = e.touches[0].clientY - touchStartY;
      if (deltaY > 70 && menu.classList.contains("active")) setOpen(false);
    },
    { passive: true }
  );
}

// ---------- TYPING EFFECT ----------
function initTypingEffect() {
  const el = document.getElementById("typing-text");
  if (!el) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    el.textContent = "Front-End Developer";
    return;
  }

  const professions = ["Front-End Developer", "Responsive Web Builder"];
  let i = 0,
    char = 0,
    isErasing = false;

  function loop() {
    if (!isErasing) {
      if (char < professions[i].length) {
        el.textContent += professions[i].charAt(char);
        char++;
        setTimeout(loop, 80);
      } else {
        isErasing = true;
        setTimeout(loop, 1600);
      }
    } else {
      if (char > 0) {
        el.textContent = professions[i].substring(0, char - 1);
        char--;
        setTimeout(loop, 30);
      } else {
        isErasing = false;
        i = (i + 1) % professions.length;
        el.style.animation = "none";
        void el.offsetWidth;
        el.style.animation = "slideUp 0.5s ease-out";
        setTimeout(loop, 300);
      }
    }
  }
  setTimeout(loop, 1200);
}

// ---------- BACK TO TOP ----------
function initBackToTop() {
  const wrap = document.createElement("div");
  wrap.className = "back-to-top-wrap";
  wrap.innerHTML = `
    <svg width="48" height="48" viewBox="0 0 48 48">
      <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(37,99,235,0.15)" stroke-width="3"/>
      <circle class="progress-ring-circle" cx="24" cy="24" r="20" fill="none" stroke="var(--primary-color)" stroke-width="3" stroke-dasharray="125.6" stroke-dashoffset="125.6"/>
    </svg>
    <button class="back-to-top-btn" aria-label="Back to top"><i class="fas fa-chevron-up"></i></button>
  `;
  document.body.appendChild(wrap);

  const circle = wrap.querySelector(".progress-ring-circle");
  const circumference = 2 * Math.PI * 20;

  window.addEventListener(
    "scroll",
    () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      wrap.classList.toggle("show", scrollTop > 500);
      circle.style.strokeDashoffset =
        circumference - (scrolled / 100) * circumference;
    },
    { passive: true }
  );

  wrap.querySelector(".back-to-top-btn").addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

// ---------- SCROLL REVEAL ----------
function initScrollAnimations() {
  if (scrollObserver) scrollObserver.disconnect();

  const animatedElements = document.querySelectorAll(
    ".about-container, .highlight-card, .focus-card, .skill-category, .contact-card, .contact-form, .case-study, .service-card, .process-step"
  );
  if (!animatedElements.length) return;

  scrollObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          scrollObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -30px 0px" }
  );

  animatedElements.forEach((el) => scrollObserver.observe(el));
}

// ---------- INTERACTIVE GRID ----------
function initGridCanvas() {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const canvas = document.getElementById("grid-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;

  const SETTINGS = {
    spacing: 48,
    radius: 190,
    pull: 26,
    baseAlpha: 0.07,
    maxAlpha: 0.8,
    lineWidthBase: 0.8,
    lineWidthMax: 1.6,
    settleMs: 500,
  };

  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let w = 0,
    h = 0;
  let mouseX = -9999,
    mouseY = -9999;
  let rafId = null,
    lastMove = 0,
    isRunning = false;
  let primaryRGB = "37, 99, 235";
  let secondaryRGB = "15, 240, 161";
  let cols = 0,
    rows = 0;
  let nodeX, nodeY, nodeI;

  function hexToRgbString(hex) {
    if (!hex) return null;
    hex = hex.trim().replace("#", "");
    if (hex.length === 3)
      hex = hex
        .split("")
        .map((c) => c + c)
        .join("");
    if (hex.length !== 6) return null;
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    if ([r, g, b].some(isNaN)) return null;
    return `${r}, ${g}, ${b}`;
  }

  function readColors() {
    const cs = getComputedStyle(document.documentElement);
    primaryRGB =
      hexToRgbString(cs.getPropertyValue("--primary-color")) || "37, 99, 235";
    secondaryRGB =
      hexToRgbString(cs.getPropertyValue("--secondary-color")) ||
      "15, 240, 161";
  }

  function resize() {
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(w / SETTINGS.spacing) + 2;
    rows = Math.ceil(h / SETTINGS.spacing) + 2;
    const total = cols * rows;
    nodeX = new Float32Array(total);
    nodeY = new Float32Array(total);
    nodeI = new Float32Array(total);
  }

  function renderOnce() {
    ctx.clearRect(0, 0, w, h);
    const sp = SETTINGS.spacing,
      r = SETTINGS.radius,
      r2 = r * r,
      pull = SETTINGS.pull;

    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const idx = i * rows + j;
        const baseX = i * sp - sp,
          baseY = j * sp - sp;
        const dx = mouseX - baseX,
          dy = mouseY - baseY;
        const d2 = dx * dx + dy * dy;
        let intensity = 0,
          px = baseX,
          py = baseY;
        if (d2 < r2) {
          const d = Math.sqrt(d2);
          intensity = 1 - d / r;
          const eased = intensity * intensity;
          const ux = dx / (d || 1),
            uy = dy / (d || 1);
          px = baseX + ux * pull * eased;
          py = baseY + uy * pull * eased;
        }
        nodeX[idx] = px;
        nodeY[idx] = py;
        nodeI[idx] = intensity;
      }
    }

    ctx.lineCap = "round";
    for (let i = 0; i < cols - 1; i++) {
      for (let j = 0; j < rows; j++) {
        const a = i * rows + j,
          b = (i + 1) * rows + j;
        const inten = (nodeI[a] + nodeI[b]) * 0.5;
        const alpha =
          SETTINGS.baseAlpha + inten * (SETTINGS.maxAlpha - SETTINGS.baseAlpha);
        const lw =
          SETTINGS.lineWidthBase +
          inten * (SETTINGS.lineWidthMax - SETTINGS.lineWidthBase);
        const color = inten > 0.4 ? secondaryRGB : primaryRGB;
        ctx.strokeStyle = `rgba(${color}, ${alpha.toFixed(3)})`;
        ctx.lineWidth = lw;
        ctx.beginPath();
        ctx.moveTo(nodeX[a], nodeY[a]);
        ctx.lineTo(nodeX[b], nodeY[b]);
        ctx.stroke();
      }
    }
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows - 1; j++) {
        const a = i * rows + j,
          b = i * rows + (j + 1);
        const inten = (nodeI[a] + nodeI[b]) * 0.5;
        const alpha =
          SETTINGS.baseAlpha + inten * (SETTINGS.maxAlpha - SETTINGS.baseAlpha);
        const lw =
          SETTINGS.lineWidthBase +
          inten * (SETTINGS.lineWidthMax - SETTINGS.lineWidthBase);
        const color = inten > 0.4 ? secondaryRGB : primaryRGB;
        ctx.strokeStyle = `rgba(${color}, ${alpha.toFixed(3)})`;
        ctx.lineWidth = lw;
        ctx.beginPath();
        ctx.moveTo(nodeX[a], nodeY[a]);
        ctx.lineTo(nodeX[b], nodeY[b]);
        ctx.stroke();
      }
    }
  }

  function loop() {
    renderOnce();
    if (performance.now() - lastMove > SETTINGS.settleMs) {
      isRunning = false;
      rafId = null;
      return;
    }
    rafId = requestAnimationFrame(loop);
  }

  function kick() {
    lastMove = performance.now();
    if (!isRunning) {
      isRunning = true;
      rafId = requestAnimationFrame(loop);
    }
  }

  window.addEventListener(
    "mousemove",
    (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      kick();
    },
    { passive: true }
  );
  window.addEventListener("mouseleave", () => {
    mouseX = -9999;
    mouseY = -9999;
    kick();
  });
  window.addEventListener("blur", () => {
    mouseX = -9999;
    mouseY = -9999;
    kick();
  });

  let resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      resize();
      renderOnce();
    }, 120);
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
        isRunning = false;
      }
    } else {
      renderOnce();
    }
  });

  readColors();
  resize();
  renderOnce();

  window.__refreshGridColors = () => {
    readColors();
    renderOnce();
  };
}

// ---------- PRELOADER ----------
function startPreloaderIntro() {
  const taglineEl = document.querySelector(".preloader-tagline");
  if (!taglineEl) return;
  const tagline = "Crafting Digital Experiences";
  let charIndex = 0;
  function typeTagline() {
    if (charIndex < tagline.length) {
      taglineEl.textContent += tagline.charAt(charIndex);
      charIndex++;
      setTimeout(typeTagline, 60);
    }
  }
  setTimeout(typeTagline, 800);
}

function hidePreloader() {
  const preloader = document.querySelector(".preloader");
  if (!preloader) return;
  setTimeout(() => {
    preloader.classList.add("hidden");
    setTimeout(() => preloader.remove(), 600);
  }, 2000);
}

// ---------- NAVBAR SCROLL ----------
function initNavbarScroll() {
  const navbar = document.querySelector(".navbar");
  if (!navbar) return;
  window.addEventListener(
    "scroll",
    () => {
      navbar.classList.toggle("scrolled", window.scrollY > 20);
    },
    { passive: true }
  );
}

// ============================================================
// PROJECTS — tiles + modal
// ============================================================
const PROJECT_DATA = {
  "k-sewa": {
    title: "K-Sewa",
    tagline:
      "A smart services marketplace connecting customers with trusted local professionals across Nepal — plumbing, electrical, cleaning, repairs, vehicle services, and tutoring.",
    type: "Original Project",
    image: "images/k-sewa.png",
    fallbackIcon: "fa-handshake-angle",
    tech: ["HTML5", "CSS3", "JavaScript", "Mobile-First", "UI/UX"],
    live: "https://k-sewa.netlify.app/",
    code: "https://github.com/CodeBySameeer",
    sections: [
      {
        label: "Challenge",
        text: "Finding a reliable plumber in Nepal means asking around with no way to check reviews or fair prices. K-Sewa asks: what would it take to book a service with confidence?",
      },
      {
        label: "Built",
        text: "A mobile-first marketplace across 6 service categories. Trust is the design foundation — verified providers, transparent pricing, and a frictionless booking flow.",
      },
      {
        label: "Learned",
        text: "Trust is a design problem, not a feature. A 'reviews' section doesn't make a platform trustworthy — showing who's verified does.",
      },
    ],
  },
  "mu-library": {
    title: "MU Digital Library",
    tagline:
      "A free, offline-first study hub for Mid-West University students. No login, works without internet, remembers what you were reading.",
    type: "Original Project",
    image: "images/mu-library.png",
    fallbackIcon: "fa-book-open",
    tech: ["HTML5", "CSS3", "JavaScript", "LocalStorage", "Offline-First"],
    live: "https://mu-libraryy.netlify.app/",
    code: "https://github.com/CodeBySameeer",
    sections: [
      {
        label: "Challenge",
        text: "Students scattered across WhatsApp groups and Drive links just to find a syllabus PDF. No central place, no offline access, no zero-friction solution.",
      },
      {
        label: "Built",
        text: "A no-login library covering 3 faculties, 7 programs, and 157 subjects. Search, favorites, and recently viewed all persist in localStorage — zero backend.",
      },
      {
        label: "Learned",
        text: "How to structure navigation that scales as content grows, and how to keep an interface working on slow or dead connections.",
      },
    ],
  },
  netflix: {
    title: "Netflix Clone",
    tagline:
      "A reverse-engineered rebuild of Netflix's landing page — layered gradients, horizontal scroll rows, and adaptive breakpoints.",
    type: "Clone / Study Build",
    image: "images/netflix.png",
    fallbackIcon: "fa-film",
    tech: ["HTML5", "CSS3", "Grid", "Flexbox", "Responsive"],
    live: "https://codebysameeer.github.io/Netflix-clone/",
    code: "https://github.com/CodeBySameeer",
    sections: [
      {
        label: "Why",
        text: "Netflix's UI stacks gradients, rows, and responsive layouts in ways tutorials never cover. I wanted to understand the spacing decisions behind it.",
      },
      {
        label: "Built",
        text: "Hero banner, gradient overlays, horizontal scroll rows, hover states. No JavaScript for layout — pure HTML and CSS from 320px to 4K.",
      },
      {
        label: "Learned",
        text: "Gradient stacking, responsive breakpoints, and how small spacing decisions compound across a page.",
      },
    ],
  },
  amazon: {
    title: "Amazon Clone",
    tagline:
      "An Amazon homepage rebuild — product grids, cart UI, and category navigation, built to practise dense information layout.",
    type: "Clone / Study Build",
    image: "images/amazon.png",
    fallbackIcon: "fa-cart-shopping",
    tech: ["HTML5", "CSS3", "Responsive"],
    live: "https://codebysameeer.github.io/Amazon-clone/",
    code: "https://github.com/CodeBySameeer",
    sections: [
      {
        label: "Why",
        text: "Amazon packs huge amounts of information into one screen without feeling cluttered. I wanted to learn how.",
      },
      {
        label: "Built",
        text: "Header with search, category nav, product card grids, footer. All responsive, all pure CSS.",
      },
      {
        label: "Learned",
        text: "How to keep spacing consistent across many repeated components, and how grid density affects scannability.",
      },
    ],
  },
  youtube: {
    title: "YouTube Clone",
    tagline:
      "A video platform layout with search UI, playlist sections, sidebar navigation, and dark mode support.",
    type: "Clone / Study Build",
    image: "images/youtube.png",
    fallbackIcon: "fa-play",
    tech: ["HTML5", "CSS3", "JavaScript"],
    live: "https://ybclone.netlify.app/",
    code: "https://github.com/CodeBySameeer",
    sections: [
      {
        label: "Why",
        text: "YouTube's layout changes on every screen size and still feels consistent. That's a hard problem worth solving.",
      },
      {
        label: "Built",
        text: "Grid-based video cards, collapsing sidebar, search bar, dark mode toggle. Responsive from mobile to desktop.",
      },
      {
        label: "Learned",
        text: "Complex grid layouts and component reuse — writing markup once and adapting it everywhere.",
      },
    ],
  },
  spotify: {
    title: "Spotify Clone",
    tagline:
      "A music player interface with playlist management, responsive controls, and a persistent player bar.",
    type: "Clone / Study Build",
    image: "images/spotify.png",
    fallbackIcon: "fa-music",
    tech: ["HTML5", "CSS3", "JavaScript"],
    live: "https://sftyclone.netlify.app/",
    code: "https://github.com/CodeBySameeer",
    sections: [
      {
        label: "Why",
        text: "A persistent player bar with state that never resets — the kind of UI that teaches you real state management.",
      },
      {
        label: "Built",
        text: "Sidebar playlists, main content grid, and a fixed bottom player with play/pause, next/prev, and a track progress bar.",
      },
      {
        label: "Learned",
        text: "State-driven UI without a framework — and how sticky UI patterns stay stable across screen sizes.",
      },
    ],
  },
};

function initProjects() {
  const tiles = document.querySelectorAll(".project-tile");
  const modal = document.getElementById("projectModal");
  if (!tiles.length || !modal) return;

  const els = {
    media: document.getElementById("modalMedia"),
    title: document.getElementById("modalTitle"),
    type: document.getElementById("modalType"),
    tagline: document.getElementById("modalTagline"),
    tech: document.getElementById("modalTech"),
    sections: document.getElementById("modalSections"),
    actions: document.getElementById("modalActions"),
  };

  let lastFocused = null;

  function openModal(id) {
    const project = PROJECT_DATA[id];
    if (!project) return;

    lastFocused = document.activeElement;

    els.media.innerHTML = `
      <img src="${project.image}" alt="${project.title} preview" loading="lazy"
           onerror="this.style.display='none'; this.insertAdjacentHTML('afterend','<i class=\\'fas ${project.fallbackIcon} modal-media-fallback\\'></i>');" />
    `;

    els.title.textContent = project.title;
    els.type.textContent = project.type;
    els.tagline.textContent = project.tagline;
    els.tech.innerHTML = project.tech.map((t) => `<span>${t}</span>`).join("");
    els.sections.innerHTML = project.sections
      .map(
        (s) =>
          `<div class="modal-section"><strong>${s.label}</strong><p>${s.text}</p></div>`
      )
      .join("");

    const actions = [];
    if (project.live) {
      actions.push(
        `<a href="${project.live}" class="project-btn" target="_blank" rel="noopener noreferrer">Live Demo <i class="fas fa-arrow-right"></i></a>`
      );
    }
    if (project.code) {
      actions.push(
        `<a href="${project.code}" class="project-btn btn-outline-dark" target="_blank" rel="noopener noreferrer"><i class="fab fa-github"></i> Code</a>`
      );
    }
    els.actions.innerHTML = actions.join("");

    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");

    setTimeout(() => {
      const closeBtn = modal.querySelector(".modal-close");
      if (closeBtn) closeBtn.focus();
    }, 60);
  }

  function closeModal() {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  tiles.forEach((tile) => {
    tile.addEventListener("click", () => openModal(tile.dataset.projectId));
  });

  modal
    .querySelectorAll("[data-close-modal]")
    .forEach((el) => el.addEventListener("click", closeModal));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("open")) closeModal();
  });

  modal.addEventListener("keydown", (e) => {
    if (e.key !== "Tab" || !modal.classList.contains("open")) return;
    const focusables = modal.querySelectorAll(
      'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  const filterBtns = document.querySelectorAll(".filter-btn");
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const filter = btn.dataset.filter;
      filterBtns.forEach((b) => {
        const on = b === btn;
        b.classList.toggle("active", on);
        b.setAttribute("aria-selected", on ? "true" : "false");
      });
      tiles.forEach((tile) => {
        const show = filter === "all" || tile.dataset.type === filter;
        tile.classList.toggle("is-hidden", !show);
      });
    });
  });

  // Scroll-reveal with stagger
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const tile = entry.target;
          const index = [...tiles].indexOf(tile);
          setTimeout(() => tile.classList.add("revealed"), (index % 2) * 90);
          revealObserver.unobserve(tile);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
  );

  tiles.forEach((tile) => revealObserver.observe(tile));
}

// ---------- STARTUP ----------
document.addEventListener("DOMContentLoaded", () => {
  startPreloaderIntro();
  window.addEventListener("load", hidePreloader);

  initThemeToggle();
  initMobileMenu();
  initTypingEffect();
  initBackToTop();
  initScrollAnimations();
  initContactForm();
  initNavbarScroll();
  initGridCanvas();
  initProjects();

  const footerYear = document.getElementById("footer-year");
  if (footerYear) footerYear.textContent = String(new Date().getFullYear());

  const hash = window.location.hash.replace("#", "") || "home";
  showPage(hash, "replace");
});
