document.documentElement.classList.add("js");

const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");
const navLinks = [...document.querySelectorAll('.site-nav a[href^="#"]')];
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function updateHeader() {
  header?.classList.toggle("is-scrolled", window.scrollY > 24);
}

function setNavigation(open) {
  if (!header || !navToggle) return;

  header.classList.toggle("is-open", open);
  document.body.classList.toggle("nav-open", open);
  navToggle.setAttribute("aria-expanded", String(open));
  navToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
}

updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

navToggle?.addEventListener("click", () => {
  setNavigation(navToggle.getAttribute("aria-expanded") !== "true");
});

nav?.addEventListener("click", (event) => {
  if (event.target.closest("a")) setNavigation(false);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setNavigation(false);
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 820) setNavigation(false);
});

const revealItems = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window && !reduceMotion.matches) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -8%", threshold: 0.08 },
  );

  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

const heroVideo = document.querySelector(".hero-video");
const lazyVideos = [...document.querySelectorAll("[data-lazy-video]")];

function loadVideo(video) {
  if (video.dataset.loaded === "true") return;

  video.querySelectorAll("source[data-src]").forEach((source) => {
    source.src = source.dataset.src;
    source.removeAttribute("data-src");
  });
  video.dataset.loaded = "true";
  video.load();
}

function playVideo(video) {
  if (reduceMotion.matches || !video.hasAttribute("data-autoplay")) return;
  video.play().catch(() => {
    // Autoplay can be blocked by browser policy; native controls remain available.
  });
}

if ("IntersectionObserver" in window) {
  const videoLoadObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          loadVideo(entry.target);
          videoLoadObserver.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "600px 0px", threshold: 0 },
  );

  const videoPlaybackObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.35) {
          playVideo(entry.target);
        } else {
          entry.target.pause();
        }
      });
    },
    { threshold: [0, 0.35] },
  );

  lazyVideos.forEach((video) => {
    videoLoadObserver.observe(video);
    videoPlaybackObserver.observe(video);
  });
  if (heroVideo) videoPlaybackObserver.observe(heroVideo);
} else {
  lazyVideos.forEach(loadVideo);
}

function isMostlyVisible(video) {
  const rect = video.getBoundingClientRect();
  const visibleHeight = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
  return visibleHeight > 0 && visibleHeight / rect.height >= 0.35;
}

function applyMotionPreference() {
  if (reduceMotion.matches) {
    heroVideo?.pause();
    lazyVideos.forEach((video) => {
      if (video.hasAttribute("data-autoplay")) video.pause();
    });
  } else if (document.visibilityState === "visible") {
    [heroVideo, ...lazyVideos]
      .filter((video) => video?.hasAttribute("data-autoplay") && isMostlyVisible(video))
      .forEach(playVideo);
  }
}

reduceMotion.addEventListener?.("change", applyMotionPreference);
applyMotionPreference();

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    heroVideo?.pause();
    lazyVideos.forEach((video) => video.pause());
  } else {
    applyMotionPreference();
  }
});

const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

if ("IntersectionObserver" in window && sections.length) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visible) return;
      navLinks.forEach((link) => {
        link.classList.toggle("is-active", link.hash === `#${visible.target.id}`);
      });
    },
    { rootMargin: "-28% 0px -58%", threshold: [0, 0.1, 0.5] },
  );

  sections.forEach((section) => sectionObserver.observe(section));
}
