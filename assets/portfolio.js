/* ============================================================================
   PORTFOLIO INTERACTIVE ENGINE — DESIGN SYSTEM v1.1 (VANILLA JS)
   Author: Esam Haraz
   Path: portfolio/assets/portfolio.js
   ============================================================================ */

(function () {
  "use strict";

  /* --------------------------------------------------------------------------
     1. CONFIGURATION & CONSTANTS
     -------------------------------------------------------------------------- */
  const DEFAULT_CFG = {
    HUB_URL: "https://esam-haraz.github.io/hub/",
    AUTODEPLOY_URL: "https://esam-haraz.github.io/AutoDeploy/",
    DATA_URL: "https://esam-haraz.github.io/Data-Analysis/",
    PORTFOLIO_URL: "https://esam-haraz.github.io/portfolio/",
    CV_URL: "https://drive.google.com/file/d/1RmhGB0Nvr3bI8VKO4Y__9YSiyUP0d5Ad/view?usp=drive_link",
    EMAIL: "esamv20@gmail.com",
    LINKEDIN: "https://www.linkedin.com/in/esam-haraz-459925402",
    GITHUB: "https://github.com/Esam-Haraz"
  };

  const CFG = Object.assign({}, DEFAULT_CFG, window.SITE_CONFIG || {});
  const REDUCED_MOTION =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const STORAGE_LANG_KEY = "esam_portfolio_lang";
  const STORAGE_THEME_KEY = "esam_ds_theme_v1";

  let currentLang = "en";
  let currentTheme = "dark";
  let isWiping = false;
  const activeDashTabs = {};

  // Enable progressive enhancements in CSS only when JS is active
  document.documentElement.classList.add("pf-js-ready");

  /* --------------------------------------------------------------------------
     2. HELPERS (ESCAPING & EMOJI SANITIZATION)
     -------------------------------------------------------------------------- */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function stripLeadingSymbols(str) {
    return String(str || "")
      .replace(/^[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\uFE0F\s]+/gu, "")
      .trim();
  }

  function getFileNameFromUrl(url) {
    try {
      const clean = String(url).split("?")[0].split("#")[0];
      const parts = clean.split("/");
      return parts[parts.length - 1] || "dashboard.webp";
    } catch (_) {
      return "dashboard.webp";
    }
  }

  /* --------------------------------------------------------------------------
     3. THEME MANAGEMENT (DARK DEFAULT, RESPECTING SAVED USER PREFERENCE)
     -------------------------------------------------------------------------- */
  function initTheme() {
    let saved = null;
    try {
      saved = localStorage.getItem(STORAGE_THEME_KEY);
    } catch (_) {}

    currentTheme = saved === "light" || saved === "dark" ? saved : "dark";
    applyTheme(currentTheme, false);
  }

  function applyTheme(theme, persist) {
    currentTheme = theme === "light" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", currentTheme);

    if (persist) {
      try {
        localStorage.setItem(STORAGE_THEME_KEY, currentTheme);
      } catch (_) {}
    }

    const isDark = currentTheme === "dark";
    document.querySelectorAll("[data-pf-theme-toggle]").forEach((btn) => {
      btn.setAttribute("aria-pressed", String(isDark));
      const lbl = btn.querySelector("[data-theme-label]");
      if (lbl) {
        lbl.textContent =
          currentLang === "ar"
            ? isDark
              ? "فاتح"
              : "داكن"
            : isDark
              ? "Light"
              : "Dark";
      }
      btn.setAttribute(
        "aria-label",
        currentLang === "ar"
          ? isDark
            ? "التبديل إلى الوضع الفاتح"
            : "التبديل إلى الوضع الداكن"
          : isDark
            ? "Switch to light mode"
            : "Switch to dark mode"
      );
    });
  }

  function toggleTheme() {
    applyTheme(currentTheme === "dark" ? "light" : "dark", true);
  }

  /* --------------------------------------------------------------------------
     4. HEADER SCROLL STATE & MOBILE DRAWER
     -------------------------------------------------------------------------- */
  function setupHeaderAndDrawer() {
    const header = document.getElementById("pf-header");
    const menuBtn = document.getElementById("pf-menu-btn");
    const drawer = document.getElementById("pf-mobile-drawer");

    function updateScrollState() {
      const y = window.scrollY || document.documentElement.scrollTop || 0;
      if (header) {
        header.classList.toggle("is-scrolled", y > 24);
      }
      const docEl = document.documentElement;
      const maxScroll = Math.max(docEl.scrollHeight - window.innerHeight, 1);
      const progress = Math.min(Math.max(y / maxScroll, 0), 1);
      docEl.style.setProperty("--scroll-progress", progress.toFixed(4));
    }

    window.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState, { passive: true });
    updateScrollState();

    if (!menuBtn || !drawer) return;

    function setDrawerOpen(open) {
      drawer.classList.toggle("is-open", open);
      menuBtn.setAttribute("aria-expanded", String(open));
      menuBtn.setAttribute(
        "aria-label",
        currentLang === "ar"
          ? open
            ? "إغلاق قائمة التنقل"
            : "فتح قائمة التنقل"
          : open
            ? "Close navigation menu"
            : "Open navigation menu"
      );
    }

    menuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const willOpen = !drawer.classList.contains("is-open");
      setDrawerOpen(willOpen);
    });

    drawer.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setDrawerOpen(false));
    });

    document.addEventListener("click", (e) => {
      if (
        drawer.classList.contains("is-open") &&
        !drawer.contains(e.target) &&
        !menuBtn.contains(e.target)
      ) {
        setDrawerOpen(false);
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && drawer.classList.contains("is-open")) {
        setDrawerOpen(false);
        menuBtn.focus();
      }
    });
  }

  /* --------------------------------------------------------------------------
     5. LINE-BY-LINE READING-DIRECTION HEADING REVEAL (H1 & H2)
     -------------------------------------------------------------------------- */
  function setupHeadingReveals() {
    const headings = Array.from(document.querySelectorAll(".pf-reveal-heading"));
    if (headings.length === 0) return;

    if (REDUCED_MOTION || typeof IntersectionObserver === "undefined") {
      headings.forEach((h) => h.classList.add("is-revealed"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    headings.forEach((h) => observer.observe(h));
  }

  /* --------------------------------------------------------------------------
     6. HERO NUMBERS-FIRST HORIZONTAL BAR CHART (0-100% FIXED SCALE)
     -------------------------------------------------------------------------- */
  function setupHeroBarsAnimation() {
    const container = document.getElementById("pf-hero-bars");
    if (!container) return;

    if (REDUCED_MOTION || typeof IntersectionObserver === "undefined") {
      container.classList.add("is-visible");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    observer.observe(container);
  }

  function renderHeroBars(lang) {
    const container = document.getElementById("pf-hero-bars");
    if (!container) return;

    const isAr = lang === "ar";
    const cards = [
      {
        href: "#case-hr-analytics",
        title: isAr ? "التسرب الوظيفي مع العمل الإضافي" : "HR Overtime Attrition",
        ariaLabel: isAr
          ? "الانتقال إلى دراسة حالة الموارد البشرية: 31% عمل إضافي مقابل 10% بدون عمل إضافي"
          : "Jump to HR Attrition case study: 31% overtime vs 10% no overtime",
        rows: [
          { label: isAr ? "عمل إضافي" : "Overtime", pct: 31, valueText: "31%", muted: false },
          { label: isAr ? "بدون إضافي" : "No overtime", pct: 10, valueText: "10%", muted: true }
        ],
        caption: isAr
          ? "3x تسرب وظيفي (31% مقابل 10%) في 1,470 موظفاً"
          : "3x attrition (31% vs 10%) across 1,470 employees"
      },
      {
        href: "#case-supply-chain",
        title: isAr ? "تأخر الشحنات حسب الطقس" : "Supply Chain Weather Delays",
        ariaLabel: isAr
          ? "الانتقال إلى دراسة حالة سلاسل الإمداد: 41.45% طقس عاصف مقابل 16.02% طقس بارد"
          : "Jump to Supply Chain case study: 41.45% stormy weather vs 16.02% cold weather",
        rows: [
          { label: isAr ? "طقس عاصف" : "Stormy weather", pct: 41.45, valueText: "41.45%", muted: false },
          { label: isAr ? "طقس بارد" : "Cold weather", pct: 16.02, valueText: "16.02%", muted: true }
        ],
        caption: isAr
          ? "25,000 شحنة • إجمالي التأخير 26.68%"
          : "25,000 shipments • 26.68% overall delay rate"
      },
      {
        href: "#case-pizza-sales",
        title: isAr ? "إيرادات مبيعات 2015" : "2015 Retail Revenue",
        ariaLabel: isAr
          ? "الانتقال إلى دراسة حالة مبيعات البيتزا: $817.86K عبر 21,350 طلباً"
          : "Jump to Pizza Sales case study: $817.86K revenue across 21,350 orders",
        bigValue: "$817.86K",
        subValue: isAr
          ? "21,350 طلباً • متوسط الطلب $38.31"
          : "21,350 orders • $38.31 avg order value",
        caption: isAr
          ? "الجمعة والخميس أعلى أيام الذروة الأسبوعية"
          : "Fridays and Thursdays lead weekly order volume"
      }
    ];

    const cardsHtml = cards
      .map((card) => {
        if (card.rows) {
          const rowsHtml = card.rows
            .map(
              (r) => `
              <div class="pf-hbar-row">
                <div class="pf-hbar-meta">
                  <span class="pf-hbar-lbl">${escapeHtml(r.label)}</span>
                  <span class="pf-hbar-val">${escapeHtml(r.valueText)}</span>
                </div>
                <div class="pf-hbar-track" aria-hidden="true">
                  <div class="pf-hbar-fill ${r.muted ? "is-muted" : ""}" style="--pct: ${r.pct};"></div>
                </div>
              </div>
            `
            )
            .join("");

          return `
            <a href="${escapeHtml(card.href)}" class="pf-hbar-card" aria-label="${escapeHtml(card.ariaLabel)}">
              <div class="pf-hbar-head">
                <span class="pf-hbar-title">${escapeHtml(card.title)}</span>
                <span class="pf-hbar-arrow" aria-hidden="true">↓</span>
              </div>
              <div class="pf-hbar-rows">${rowsHtml}</div>
              <span class="pf-hbar-caption">${escapeHtml(card.caption)}</span>
            </a>
          `;
        }

        return `
          <a href="${escapeHtml(card.href)}" class="pf-hbar-card" aria-label="${escapeHtml(card.ariaLabel)}">
            <div class="pf-hbar-head">
              <span class="pf-hbar-title">${escapeHtml(card.title)}</span>
              <span class="pf-hbar-arrow" aria-hidden="true">↓</span>
            </div>
            <div>
              <div class="pf-hbar-big">${escapeHtml(card.bigValue)}</div>
              <div class="pf-hbar-sub">${escapeHtml(card.subValue)}</div>
            </div>
            <span class="pf-hbar-caption">${escapeHtml(card.caption)}</span>
          </a>
        `;
      })
      .join("");

    // Visually hidden accessible data table for screen readers
    const srTableHtml = `
      <div class="ds-sr-only">
        <table>
          <caption>${isAr ? "ملخص مؤشرات دراسات الحالة الثلاث" : "Summary metrics across the three analytics case studies"}</caption>
          <thead>
            <tr>
              <th>${isAr ? "دراسة الحالة" : "Case Study"}</th>
              <th>${isAr ? "المقياس" : "Metric"}</th>
              <th>${isAr ? "القيمة" : "Value"}</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>IBM HR Analytics</td><td>${isAr ? "تسرب العمل الإضافي مقابل بدون إضافي" : "Overtime vs Non-Overtime Attrition"}</td><td>31% vs 10% (1,470 employees)</td></tr>
            <tr><td>Supply Chain Deliveries</td><td>${isAr ? "تأخير الطقس العاصف مقابل البارد" : "Stormy vs Cold Weather Delay Rate"}</td><td>41.45% vs 16.02% (25,000 shipments)</td></tr>
            <tr><td>Pizza Sales 2015</td><td>${isAr ? "إجمالي الإيرادات والطلبات" : "Total Revenue and Orders"}</td><td>$817.86K across 21,350 orders ($38.31 AOV)</td></tr>
          </tbody>
        </table>
      </div>
    `;

    container.innerHTML = cardsHtml + srTableHtml;
  }

  /* --------------------------------------------------------------------------
     7. STACKED CASE STUDIES, DASHBOARD TABS & IMAGE FALLBACK
     -------------------------------------------------------------------------- */
  function attachDashboardImgFallback(imgEl, backupUrl) {
    if (!imgEl) return;

    function showPlaceholder() {
      const fileName =
        imgEl.getAttribute("data-asset-name") ||
        getFileNameFromUrl(imgEl.getAttribute("src"));
      const box = document.createElement("div");
      box.className = "ds-img-missing";
      box.setAttribute("role", "img");
      box.setAttribute("aria-label", fileName);
      box.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="3"></rect>
          <path d="M8 15v-4M12 15V9M16 15v-6"></path>
        </svg>
        <code>${escapeHtml(fileName)}</code>
      `;
      const parentBtn = imgEl.closest(".pf-dash-trigger");
      if (parentBtn) {
        const zoomHint = parentBtn.querySelector(".pf-zoom-hint");
        if (zoomHint) zoomHint.remove();
        parentBtn.disabled = true;
        parentBtn.style.cursor = "default";
      }
      imgEl.replaceWith(box);
    }

    imgEl.addEventListener("error", function onErr() {
      if (!imgEl.dataset.triedBackup && backupUrl && imgEl.src !== backupUrl) {
        imgEl.dataset.triedBackup = "1";
        imgEl.src = backupUrl;
        return;
      }
      imgEl.removeEventListener("error", onErr);
      showPlaceholder();
    });
  }

  function renderCaseStudies(lang) {
    const stack = document.getElementById("pf-cases-stack");
    const store = window.PORTFOLIO_I18N;
    if (!stack || !store || !Array.isArray(store.projects)) return;

    const ui = store[lang] || store.en;
    const isAr = lang === "ar";

    const domainLabelsAr = {
      "HR Analytics": "تحليل الموارد البشرية",
      "Retail Operations": "عمليات التجزئة والمبيعات",
      "Logistics & Supply Chain": "اللوجستيات وسلاسل الإمداد"
    };

    stack.innerHTML = store.projects
      .map((proj, pIdx) => {
        const pData = proj[lang] || proj.en;
        const selectedDashIdx = activeDashTabs[proj.id] || 0;
        const activeDash = proj.dashboards[selectedDashIdx] || proj.dashboards[0];
        const fileName = getFileNameFromUrl(activeDash.imgUrl);
        const domainText = isAr ? domainLabelsAr[proj.domain] || proj.domain : proj.domain;

        const tabsHtml = proj.dashboards
          .map(
            (dash, dIdx) => `
            <button type="button"
                    class="pf-dash-tab ${dIdx === selectedDashIdx ? "is-active" : ""}"
                    role="tab"
                    aria-selected="${dIdx === selectedDashIdx}"
                    data-proj-id="${escapeHtml(proj.id)}"
                    data-dash-idx="${dIdx}">
              ${escapeHtml(dash.label)}
            </button>
          `
          )
          .join("");

        const kpisHtml = pData.kpis
          .map(
            (k) => `
            <div class="pf-kpi-box">
              <strong>${escapeHtml(k.val)}</strong>
              <span>${escapeHtml(k.lbl)}</span>
            </div>
          `
          )
          .join("");

        const insightsHtml = pData.insights
          .map((ins) => `<li>${escapeHtml(ins)}</li>`)
          .join("");

        const tagsHtml = proj.tags
          .map((t) => `<span class="ds-chip">${escapeHtml(t)}</span>`)
          .join("");

        return `
          <article class="pf-case-card" id="case-${escapeHtml(proj.id)}" aria-labelledby="title-${escapeHtml(proj.id)}">
            <div>
              <div class="pf-case-chips">
                <span class="ds-chip ds-chip-accent">${escapeHtml(domainText)}</span>
                ${tagsHtml}
                <span class="ds-chip">${escapeHtml(ui.sourceLabel)}</span>
              </div>

              <h3 class="pf-case-title" id="title-${escapeHtml(proj.id)}">${escapeHtml(pData.title)}</h3>
              <p class="pf-case-summary">${escapeHtml(pData.summary)}</p>

              <div class="pf-case-kpis">${kpisHtml}</div>

              <ul class="pf-insights-list">${insightsHtml}</ul>

              <div class="pf-rec-box">
                <strong>${escapeHtml(ui.recLabel)}</strong>
                <span>${escapeHtml(pData.recommendation)}</span>
              </div>

              <div class="pf-case-actions">
                <a href="${escapeHtml(proj.caseStudyUrl)}" class="ds-btn ds-btn-primary">
                  ${escapeHtml(ui.caseStudyBtnText)}
                </a>
                <a href="${escapeHtml(proj.repoUrl)}" target="_blank" rel="noopener noreferrer" class="ds-btn ds-btn-secondary">
                  ${escapeHtml(ui.repoBtnText)}
                </a>
              </div>
            </div>

            <div class="pf-device-frame">
              <div class="pf-device-bar">
                <div class="pf-device-dots" aria-hidden="true">
                  <span></span><span></span><span></span>
                </div>
                <div class="pf-dash-tabs" role="tablist" aria-label="${isAr ? "اختيار لوحة التحكم" : "Dashboard switcher"}">
                  ${tabsHtml}
                </div>
              </div>

              <button type="button"
                      class="pf-dash-trigger"
                      data-lightbox-proj="${pIdx}"
                      aria-label="${isAr ? "تكبير لوحة التحكم: " : "Expand dashboard: "}${escapeHtml(pData.title)}">
                <img id="pf-img-${escapeHtml(proj.id)}"
                     src="${escapeHtml(activeDash.imgUrl)}"
                     data-asset-name="${escapeHtml(fileName)}"
                     alt="${escapeHtml(pData.title)} — ${escapeHtml(activeDash.label)}"
                     width="1280"
                     height="720"
                     loading="lazy">
                <span class="pf-zoom-hint" aria-hidden="true">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"></path>
                  </svg>
                  <span>${isAr ? "تكبير" : "Expand"}</span>
                </span>
              </button>
            </div>
          </article>
        `;
      })
      .join("");

    // Bind image fallbacks
    store.projects.forEach((proj) => {
      const selectedDashIdx = activeDashTabs[proj.id] || 0;
      const activeDash = proj.dashboards[selectedDashIdx] || proj.dashboards[0];
      const imgEl = document.getElementById(`pf-img-${proj.id}`);
      attachDashboardImgFallback(imgEl, activeDash.backupUrl);
    });

    // Bind dashboard tab switching
    stack.querySelectorAll(".pf-dash-tab").forEach((tabBtn) => {
      tabBtn.addEventListener("click", () => {
        const projId = tabBtn.getAttribute("data-proj-id");
        const dashIdx = Number(tabBtn.getAttribute("data-dash-idx") || 0);
        const proj = store.projects.find((p) => p.id === projId);
        if (!proj || !proj.dashboards[dashIdx]) return;

        activeDashTabs[projId] = dashIdx;
        const targetDash = proj.dashboards[dashIdx];
        const fileName = getFileNameFromUrl(targetDash.imgUrl);

        const tabBar = tabBtn.parentElement;
        if (tabBar) {
          tabBar.querySelectorAll(".pf-dash-tab").forEach((b) => {
            const active = b === tabBtn;
            b.classList.toggle("is-active", active);
            b.setAttribute("aria-selected", String(active));
          });
        }

        const frame = tabBtn.closest(".pf-device-frame");
        const triggerBtn = frame ? frame.querySelector(".pf-dash-trigger") : null;
        if (!triggerBtn) return;

        const pData = proj[currentLang] || proj.en;
        triggerBtn.disabled = false;
        triggerBtn.style.cursor = "zoom-in";
        triggerBtn.innerHTML = `
          <img id="pf-img-${escapeHtml(proj.id)}"
               src="${escapeHtml(targetDash.imgUrl)}"
               data-asset-name="${escapeHtml(fileName)}"
               alt="${escapeHtml(pData.title)} — ${escapeHtml(targetDash.label)}"
               width="1280"
               height="720"
               loading="lazy">
          <span class="pf-zoom-hint" aria-hidden="true">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"></path>
            </svg>
            <span>${currentLang === "ar" ? "تكبير" : "Expand"}</span>
          </span>
        `;
        const newImg = document.getElementById(`pf-img-${proj.id}`);
        attachDashboardImgFallback(newImg, targetDash.backupUrl);
      });
    });

    // Bind lightbox triggers
    stack.querySelectorAll(".pf-dash-trigger").forEach((triggerBtn) => {
      triggerBtn.addEventListener("click", () => {
        const pIdx = Number(triggerBtn.getAttribute("data-lightbox-proj") || 0);
        openLightbox(pIdx, triggerBtn);
      });
    });
  }

  /* --------------------------------------------------------------------------
     8. SKILLS GRID RENDERER (SVG ICONS ONLY, NO PERCENTAGES OR STARS)
     -------------------------------------------------------------------------- */
  function renderSkills(lang) {
    const grid = document.getElementById("pf-skills-grid");
    const store = window.PORTFOLIO_I18N;
    if (!grid || !store) return;

    const ui = store[lang] || store.en;
    const icons = [
      // Database / SQL
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><ellipse cx="12" cy="5" rx="8" ry="3"></ellipse><path d="M4 5v6c0 1.66 3.58 3 8 3s8-1.34 8-3V5"></path><path d="M4 11v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6"></path></svg>',
      // Power BI / Bar Chart
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="4" y="13" width="4" height="7" rx="1"></rect><rect x="10" y="9" width="4" height="11" rx="1"></rect><rect x="16" y="4" width="4" height="16" rx="1"></rect></svg>',
      // Excel / Table Grid
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"></rect><path d="M3 10h18M9 4v16"></path></svg>',
      // Python / Code Workflow
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>'
    ];

    grid.innerHTML = ui.skills
      .map(
        (group, idx) => `
        <article class="pf-skill-card">
          <div class="pf-skill-head">
            ${icons[idx % icons.length]}
            <h3 class="pf-skill-title">${escapeHtml(group.category)}</h3>
          </div>
          <ul class="pf-skill-list">
            ${group.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
          </ul>
        </article>
      `
      )
      .join("");
  }

  /* --------------------------------------------------------------------------
     9. ACCESSIBLE KEYBOARD LIGHTBOX (ESC CLOSES & RESTORES FOCUS)
     -------------------------------------------------------------------------- */
  let lastLightboxTrigger = null;

  function openLightbox(projIdx, triggerBtn) {
    const store = window.PORTFOLIO_I18N;
    const lightbox = document.getElementById("pf-lightbox");
    const lbImg = document.getElementById("pf-lightbox-img");
    const lbTitle = document.getElementById("pf-lightbox-title");
    const lbClose = document.getElementById("pf-lightbox-close");

    if (!store || !lightbox || !lbImg || !lbClose) return;

    const proj = store.projects[projIdx];
    if (!proj) return;

    const imgEl = document.getElementById(`pf-img-${proj.id}`);
    if (!imgEl) return;

    const pData = proj[currentLang] || proj.en;
    lastLightboxTrigger = triggerBtn || document.activeElement;

    lbImg.src = imgEl.currentSrc || imgEl.src;
    lbImg.alt = imgEl.alt || pData.title;
    if (lbTitle) lbTitle.textContent = pData.title;

    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    lbClose.focus();
  }

  function closeLightbox() {
    const lightbox = document.getElementById("pf-lightbox");
    const lbImg = document.getElementById("pf-lightbox-img");
    if (!lightbox || !lightbox.classList.contains("is-open")) return;

    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lbImg) lbImg.removeAttribute("src");

    if (lastLightboxTrigger && typeof lastLightboxTrigger.focus === "function") {
      lastLightboxTrigger.focus();
    }
  }

  function setupLightbox() {
    const lightbox = document.getElementById("pf-lightbox");
    const lbClose = document.getElementById("pf-lightbox-close");
    if (!lightbox || !lbClose) return;

    lbClose.addEventListener("click", closeLightbox);

    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) {
        closeLightbox();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (!lightbox.classList.contains("is-open")) return;
      if (e.key === "Escape") {
        e.preventDefault();
        closeLightbox();
      } else if (e.key === "Tab") {
        e.preventDefault();
        lbClose.focus();
      }
    });
  }

  /* --------------------------------------------------------------------------
     10. BILINGUAL RENDERING & CIRCULAR WIPE TRANSITION
     -------------------------------------------------------------------------- */
  function hydrateLinksFromConfig() {
    document.querySelectorAll("[data-cfg-href]").forEach((el) => {
      const key = el.getAttribute("data-cfg-href");
      if (key && CFG[key]) {
        el.setAttribute("href", CFG[key]);
      }
    });
  }

  function applyLanguage(lang, persist) {
    const store = window.PORTFOLIO_I18N;
    if (!store) return;

    currentLang = lang === "ar" ? "ar" : "en";
    const ui = store[currentLang] || store.en;
    const dir = ui.dir || (currentLang === "ar" ? "rtl" : "ltr");

    document.documentElement.lang = currentLang;
    document.documentElement.dir = dir;
    if (document.body) {
      document.body.dir = dir;
    }

    if (persist) {
      try {
        localStorage.setItem(STORAGE_LANG_KEY, currentLang);
      } catch (_) {}
    }

    // Update static text nodes bound via data-pf-text / data-pf-html
    document.querySelectorAll("[data-pf-text]").forEach((el) => {
      const path = el.getAttribute("data-pf-text");
      if (!path) return;
      const parts = path.split(".");
      let val = ui;
      for (let i = 0; i < parts.length; i++) {
        val = val && val[parts[i]];
      }
      if (typeof val === "string") {
        el.textContent = stripLeadingSymbols(val);
      }
    });

    document.querySelectorAll("[data-pf-html]").forEach((el) => {
      const key = el.getAttribute("data-pf-html");
      if (key && typeof ui[key] === "string") {
        el.innerHTML = ui[key];
      }
    });

    // Update site navigation labels in desktop mini-graph & mobile drawer
    const siteLabels = {
      hub: currentLang === "ar" ? "المركز الرئيسي" : "Services Hub",
      autodeploy: "AutoDeploy",
      data: currentLang === "ar" ? "تحليل البيانات" : "Data Analysis",
      portfolio: currentLang === "ar" ? "معرض الأعمال" : "Portfolio"
    };

    document.querySelectorAll("[data-site-label]").forEach((el) => {
      const id = el.getAttribute("data-site-label");
      if (id && siteLabels[id]) {
        el.textContent = siteLabels[id];
      }
    });

    // Update language switcher buttons
    document.querySelectorAll("[data-pf-lang-toggle]").forEach((btn) => {
      btn.textContent = currentLang === "ar" ? "EN" : "عربي";
      btn.setAttribute(
        "aria-label",
        currentLang === "ar"
          ? "Switch language to English"
          : "التبديل إلى اللغة العربية"
      );
    });

    renderHeroBars(currentLang);
    renderCaseStudies(currentLang);
    renderSkills(currentLang);
    applyTheme(currentTheme, false);
    hydrateLinksFromConfig();

    // Ensure hero bars animate/appear cleanly after language render
    const barsEl = document.getElementById("pf-hero-bars");
    if (barsEl) {
      window.requestAnimationFrame(() => barsEl.classList.add("is-visible"));
    }
  }

  function triggerLanguageWipe(triggerEl) {
    if (isWiping) return;
    const nextLang = currentLang === "ar" ? "en" : "ar";

    const curtain = document.getElementById("ds-curtain");
    const outer = document.getElementById("ds-curtain-outer");
    const inner = document.getElementById("ds-curtain-inner");
    const labelEl = document.getElementById("ds-curtain-label");
    const subEl = document.getElementById("ds-curtain-sub");

    if (
      REDUCED_MOTION ||
      !curtain ||
      !outer ||
      !inner ||
      typeof outer.animate !== "function"
    ) {
      applyLanguage(nextLang, true);
      return;
    }

    isWiping = true;

    const rect = (triggerEl || document.body).getBoundingClientRect();
    const startX = Math.round(
      ((rect.left + rect.width / 2) / Math.max(window.innerWidth, 1)) * 100
    );
    const startY = Math.round(
      ((rect.top + rect.height / 2) / Math.max(window.innerHeight, 1)) * 100
    );
    const endX = 100 - startX;
    const endY = 100;

    if (labelEl) {
      labelEl.textContent = nextLang === "ar" ? "عصام حراز" : "ESAM HARAZ";
    }
    if (subEl) {
      subEl.textContent =
        nextLang === "ar" ? "التحويل إلى العربية" : "SWITCHING TO ENGLISH";
    }

    const dur = 420;
    const easing = "cubic-bezier(0.76, 0, 0.24, 1)";

    const expandOuter = outer.animate(
      [
        { clipPath: `circle(0% at ${startX}% ${startY}%)` },
        { clipPath: `circle(155% at ${startX}% ${startY}%)` }
      ],
      { duration: dur, easing, fill: "forwards" }
    );

    const expandInner = inner.animate(
      [
        { clipPath: `circle(0% at ${startX}% ${startY}%)` },
        { clipPath: `circle(155% at ${startX}% ${startY}%)` }
      ],
      { duration: dur, delay: 55, easing, fill: "forwards" }
    );

    expandInner.onfinish = () => {
      applyLanguage(nextLang, true);

      const collapseInner = inner.animate(
        [
          { clipPath: `circle(155% at ${endX}% ${endY}%)` },
          { clipPath: `circle(0% at ${endX}% ${endY}%)` }
        ],
        { duration: dur, delay: 60, easing, fill: "forwards" }
      );

      const collapseOuter = outer.animate(
        [
          { clipPath: `circle(155% at ${endX}% ${endY}%)` },
          { clipPath: `circle(0% at ${endX}% ${endY}%)` }
        ],
        { duration: dur, delay: 115, easing, fill: "forwards" }
      );

      collapseOuter.onfinish = () => {
        expandOuter.cancel();
        expandInner.cancel();
        collapseInner.cancel();
        collapseOuter.cancel();
        outer.style.clipPath = `circle(0% at ${startX}% ${startY}%)`;
        inner.style.clipPath = `circle(0% at ${startX}% ${startY}%)`;
        isWiping = false;
      };
    };
  }

  function initLanguage() {
    let saved = null;
    try {
      saved = localStorage.getItem(STORAGE_LANG_KEY);
    } catch (_) {}

    if (saved === "ar" || saved === "en") {
      currentLang = saved;
    } else {
      const docLang = (document.documentElement.lang || "en").toLowerCase();
      currentLang = docLang.startsWith("ar") ? "ar" : "en";
    }

    applyLanguage(currentLang, false);
  }

  /* --------------------------------------------------------------------------
     11. BUILT-IN 1200x630 OG-COVER.PNG GENERATOR (Ctrl+Shift+O or ?generate-og=1)
     -------------------------------------------------------------------------- */
  function generateOgCoverImage() {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const COLORS = {
      bg: "#0A0A10",
      surface: "#12121A",
      accent: "#BE9CF2",
      accentDim: "rgba(190, 156, 242, 0.14)",
      border: "#67648A",
      rule: "#1E1E2A",
      ink: "#ECEBF4",
      muted: "#A19FB5"
    };

    function roundRect(x, y, w, h, r) {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
    }

    // 1. Background & Subtle Grid
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, 1200, 630);

    ctx.strokeStyle = COLORS.rule;
    ctx.lineWidth = 1;
    for (let x = 0; x <= 1200; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 630);
      ctx.stroke();
    }
    for (let y = 0; y <= 630; y += 48) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1200, y);
      ctx.stroke();
    }

    // 2. Outer Card Frame
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 2;
    roundRect(36, 36, 1128, 558, 18);
    ctx.stroke();

    // 3. Role Pill
    ctx.fillStyle = COLORS.accentDim;
    ctx.strokeStyle = COLORS.accent;
    ctx.lineWidth = 1.5;
    roundRect(84, 84, 210, 38, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = COLORS.accent;
    ctx.font = "600 16px 'DM Mono', monospace";
    ctx.fillText("DATA ANALYST", 114, 108);

    // 4. Name & Stack Subtitle
    ctx.fillStyle = COLORS.ink;
    ctx.font = "800 66px 'Bricolage Grotesque', sans-serif";
    ctx.fillText("Esam Haraz", 84, 206);

    ctx.fillStyle = COLORS.muted;
    ctx.font = "500 26px 'Instrument Sans', sans-serif";
    ctx.fillText("SQL (PostgreSQL)  •  Power BI (DAX)  •  Microsoft Excel  •  Python", 84, 256);

    // 5. Three Verified Metric Cards
    const cards = [
      { val: "3x Attrition", lbl: "31% vs 10% Overtime Turnover (HR)" },
      { val: "$817.86K", lbl: "2015 Retail Revenue (21,350 Orders)" },
      { val: "41.45% Delay", lbl: "Stormy vs 16.02% Cold (25K Shipments)" }
    ];

    cards.forEach((c, i) => {
      const x = 84 + i * 354;
      const y = 324;
      const w = 324;
      const h = 152;

      ctx.fillStyle = COLORS.surface;
      ctx.strokeStyle = COLORS.border;
      ctx.lineWidth = 1.5;
      roundRect(x, y, w, h, 14);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = COLORS.accent;
      ctx.font = "700 32px 'DM Mono', monospace";
      ctx.fillText(c.val, x + 22, y + 58);

      ctx.fillStyle = COLORS.muted;
      ctx.font = "500 15px 'Instrument Sans', sans-serif";
      ctx.fillText(c.lbl, x + 22, y + 104);
    });

    // 6. Footer URL
    ctx.fillStyle = COLORS.accent;
    ctx.font = "500 17px 'DM Mono', monospace";
    ctx.fillText("esam-haraz.github.io/portfolio/", 84, 544);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = "og-cover.png";
      link.href = url;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    }, "image/png");
  }

  window.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "o") {
      e.preventDefault();
      generateOgCoverImage();
    }
  });

  /* --------------------------------------------------------------------------
     12. BOOTSTRAP
     -------------------------------------------------------------------------- */
  function init() {
    initTheme();
    initLanguage();
    setupHeaderAndDrawer();
    setupHeadingReveals();
    setupHeroBarsAnimation();
    setupLightbox();

    document.querySelectorAll("[data-pf-theme-toggle]").forEach((btn) => {
      btn.addEventListener("click", toggleTheme);
    });

    document.querySelectorAll("[data-pf-lang-toggle]").forEach((btn) => {
      btn.addEventListener("click", () => triggerLanguageWipe(btn));
    });

    if (window.location.search.includes("generate-og=1")) {
      window.setTimeout(generateOgCoverImage, 500);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
