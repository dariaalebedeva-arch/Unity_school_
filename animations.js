document.addEventListener("DOMContentLoaded", () => {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const body = document.body;
  initVariableProximityTitle({ reducedMotion });
  initApplicationForm();

  if (reducedMotion) return;

  body.classList.add("js-animate");

  const revealTargets = document.querySelectorAll(".section, .card, .faq__item");
  revealTargets.forEach((item) => item.classList.add("reveal-item"));

  const lists = document.querySelectorAll(".list li, .steps li");
  lists.forEach((item, index) => {
    item.classList.add("stagger-item");
    item.style.setProperty("--item-index", String(index % 10));
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14, rootMargin: "0px 0px -8% 0px" }
  );

  revealTargets.forEach((item) => observer.observe(item));
  lists.forEach((item) => observer.observe(item));

  const hero = document.querySelector(".hero");
  if (!hero) return;

  const shapeOne = hero.querySelector(".hero__shape--one");
  const shapeTwo = hero.querySelector(".hero__shape--two");
  const portrait = hero.querySelector(".hero__portrait");

  hero.addEventListener("mousemove", (event) => {
    const rect = hero.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    if (shapeOne) shapeOne.style.transform = `translate(${x * 22}px, ${y * 18}px)`;
    if (shapeTwo) shapeTwo.style.transform = `translate(${x * -18}px, ${y * -12}px)`;
    if (portrait) portrait.style.transform = `translate(${x * -8}px, ${y * -6}px)`;
  });

  hero.addEventListener("mouseleave", () => {
    if (shapeOne) shapeOne.style.transform = "";
    if (shapeTwo) shapeTwo.style.transform = "";
    if (portrait) portrait.style.transform = "";
  });
});

function initVariableProximityTitle({ reducedMotion }) {
  const title = document.querySelector(".hero__title");
  if (!title || reducedMotion) return;

  const container = title.closest(".hero__content") || title.parentElement;
  if (!container) return;

  const label = title.textContent ? title.textContent.trim() : "";
  if (!label) return;

  const from = { wght: 420, opsz: 26 };
  const to = { wght: 920, opsz: 54 };
  const radius = 120;
  const falloff = "linear";

  title.setAttribute("aria-label", label);
  title.textContent = "";

  const letters = [];
  const words = label.split(" ");

  words.forEach((word, wordIndex) => {
    const wordEl = document.createElement("span");
    wordEl.className = "vp-word";

    Array.from(word).forEach((char) => {
      const letterEl = document.createElement("span");
      letterEl.className = "vp-letter";
      letterEl.textContent = char;
      letterEl.setAttribute("aria-hidden", "true");
      letterEl.style.fontVariationSettings = `"wght" ${from.wght}, "opsz" ${from.opsz}`;
      wordEl.appendChild(letterEl);
      letters.push(letterEl);
    });

    title.appendChild(wordEl);
    if (wordIndex < words.length - 1) {
      title.appendChild(document.createTextNode(" "));
    }
  });

  const srOnly = document.createElement("span");
  srOnly.className = "sr-only";
  srOnly.textContent = label;
  title.appendChild(srOnly);

  const calculateFalloff = (distance) => {
    const norm = Math.min(Math.max(1 - distance / radius, 0), 1);
    if (falloff === "exponential") return norm ** 2;
    if (falloff === "gaussian") {
      return Math.exp(-((distance / (radius / 2)) ** 2) / 2);
    }
    return norm;
  };

  const distance = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);

  const resetLetters = () => {
    letters.forEach((letter) => {
      letter.style.fontVariationSettings = `"wght" ${from.wght}, "opsz" ${from.opsz}`;
    });
  };

  let rafId = null;
  const pointer = { x: 0, y: 0 };

  const updateLetters = () => {
    const containerRect = container.getBoundingClientRect();

    letters.forEach((letter) => {
      const rect = letter.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2 - containerRect.left;
      const centerY = rect.top + rect.height / 2 - containerRect.top;

      const d = distance(pointer.x, pointer.y, centerX, centerY);
      if (d >= radius) {
        letter.style.fontVariationSettings = `"wght" ${from.wght}, "opsz" ${from.opsz}`;
        return;
      }

      const t = calculateFalloff(d);
      const wght = from.wght + (to.wght - from.wght) * t;
      const opsz = from.opsz + (to.opsz - from.opsz) * t;
      letter.style.fontVariationSettings = `"wght" ${wght.toFixed(1)}, "opsz" ${opsz.toFixed(1)}`;
    });

    rafId = null;
  };

  container.addEventListener("pointermove", (event) => {
    const rect = container.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    if (!rafId) rafId = requestAnimationFrame(updateLetters);
  });

  container.addEventListener("pointerleave", () => {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    resetLetters();
  });
}

function initApplicationForm() {
  const form = document.querySelector("#applicationForm");
  const success = document.querySelector("#applicationSuccess");
  if (!form || !success) return;

  const phoneInput = form.querySelector('input[name="phone"]');
  const requiredFields = form.querySelectorAll("input[required], select[required]");

  const setError = (el, hasError) => {
    if (!el) return;
    el.classList.toggle("field-error", hasError);
  };

  if (phoneInput) {
    phoneInput.addEventListener("input", () => {
      const digits = phoneInput.value.replace(/\D/g, "").slice(0, 11);
      const normalized = digits.startsWith("7") || digits.startsWith("8") ? `7${digits.slice(1)}` : digits;
      const d = normalized;
      let value = "+7";
      if (d.length > 1) value += ` (${d.slice(1, 4)}`;
      if (d.length >= 5) value += `) ${d.slice(4, 7)}`;
      if (d.length >= 8) value += `-${d.slice(7, 9)}`;
      if (d.length >= 10) value += `-${d.slice(9, 11)}`;
      phoneInput.value = value;
      setError(phoneInput, false);
    });
  }

  requiredFields.forEach((field) => {
    field.addEventListener("input", () => setError(field, false));
    field.addEventListener("change", () => setError(field, false));
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    success.textContent = "";

    let hasErrors = false;
    requiredFields.forEach((field) => {
      const type = field.getAttribute("type");
      const value = field.value.trim();
      const isCheckbox = type === "checkbox";
      const valid = isCheckbox ? field.checked : value.length > 0;
      setError(field, !valid);
      if (!valid) hasErrors = true;
    });

    if (phoneInput) {
      const phoneDigits = phoneInput.value.replace(/\D/g, "");
      if (phoneDigits.length < 11) {
        setError(phoneInput, true);
        hasErrors = true;
      }
    }

    if (hasErrors) {
      success.textContent = "Проверьте поля формы: заполните обязательные данные.";
      success.style.color = "#ffb6b6";
      return;
    }

    const button = form.querySelector('button[type="submit"]');
    if (button) {
      button.disabled = true;
      button.textContent = "Отправляем...";
    }

    setTimeout(() => {
      success.textContent = "Спасибо! Заявка отправлена. Мы свяжемся с вами в ближайшее время.";
      success.style.color = "#9de6b8";
      form.reset();
      if (button) {
        button.disabled = false;
        button.textContent = "Отправить заявку";
      }
    }, 700);
  });
}
