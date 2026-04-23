document.addEventListener("DOMContentLoaded", () => {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const body = document.body;
  initVariableProximityTitle({ reducedMotion });
  initApplicationForm();
  initTrialModal();
  initTestModal();

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

function initTrialModal() {
  const modal = document.querySelector("#trialModal");
  const form = document.querySelector("#trialForm");
  const success = document.querySelector("#trialFormSuccess");
  const openButtons = document.querySelectorAll("[data-open-trial-modal]");
  const closeButtons = document.querySelectorAll("[data-close-trial-modal]");
  if (!modal || !form || !success || !openButtons.length) return;

  const phoneInput = form.querySelector('input[name="phone"]');
  const emailInput = form.querySelector('input[name="email"]');
  const ageInput = form.querySelector('input[name="age"]');
  const requiredFields = form.querySelectorAll("input[required], select[required]");

  const setError = (el, hasError) => {
    if (!el) return;
    el.classList.toggle("field-error", hasError);
  };

  const openModal = () => {
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  openButtons.forEach((button) => {
    button.addEventListener("click", openModal);
  });

  closeButtons.forEach((button) => {
    button.addEventListener("click", closeModal);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("is-open")) {
      closeModal();
    }
  });

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
      const valid = type === "checkbox" ? field.checked : value.length > 0;
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

    if (emailInput) {
      const email = emailInput.value.trim();
      const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!emailValid) {
        setError(emailInput, true);
        hasErrors = true;
      }
    }

    if (ageInput) {
      const ageNum = parseInt(ageInput.value, 10);
      const ageValid = Number.isFinite(ageNum) && ageNum >= 5 && ageNum <= 100;
      if (!ageValid) {
        setError(ageInput, true);
        hasErrors = true;
      }
    }

    if (hasErrors) {
      success.textContent = "Проверьте форму: заполните все обязательные поля корректно.";
      success.style.color = "#ffb6b6";
      return;
    }

    const button = form.querySelector('button[type="submit"]');
    if (button) {
      button.disabled = true;
      button.textContent = "Отправляем...";
    }

    setTimeout(() => {
      success.textContent = "Спасибо! Вы записаны на пробный урок, скоро с вами свяжемся.";
      success.style.color = "#9de6b8";
      form.reset();
      if (button) {
        button.disabled = false;
        button.textContent = "Отправить";
      }
      setTimeout(closeModal, 1100);
    }, 700);
  });
}

function initTestModal() {
  const modal = document.querySelector("#testModal");
  const openButtons = document.querySelectorAll("[data-open-test-modal]");
  const closeButtons = document.querySelectorAll("[data-close-test-modal]");
  const setupForm = document.querySelector("#testSetupForm");
  const setupStatus = document.querySelector("#testSetupStatus");
  const quizBlock = document.querySelector("#quizBlock");
  const quizMeta = document.querySelector("#quizMeta");
  const quizQuestion = document.querySelector("#quizQuestion");
  const quizOptions = document.querySelector("#quizOptions");
  const quizNextBtn = document.querySelector("#quizNextBtn");
  const quizRestartBtn = document.querySelector("#quizRestartBtn");
  const quizResult = document.querySelector("#quizResult");
  const quizDetails = document.querySelector("#quizDetails");
  const quizTimer = document.querySelector("#quizTimer");

  if (
    !modal || !openButtons.length || !setupForm || !setupStatus || !quizBlock ||
    !quizMeta || !quizQuestion || !quizOptions || !quizNextBtn || !quizRestartBtn || !quizResult ||
    !quizDetails || !quizTimer
  ) {
    return;
  }

  const questionBank = {
    english: {
      beginner: [
        { q: "Выберите правильный перевод: «книга»", options: ["book", "table", "window", "apple"], answer: 0 },
        { q: "Выберите форму глагола to be для I:", options: ["am", "is", "are", "be"], answer: 0 },
        { q: "Как сказать «Меня зовут Анна»?", options: ["My name Anna", "I name is Anna", "My name is Anna", "I am name Anna"], answer: 2 },
        { q: "Выберите множественное число слова child:", options: ["childs", "children", "childes", "child"], answer: 1 },
        { q: "Какой артикль обычно ставится перед согласным звуком?", options: ["an", "the", "a", "no article"], answer: 2 }
      ],
      intermediate: [
        { q: "I ____ this movie before.", options: ["have seen", "saw", "see", "am seeing"], answer: 0 },
        { q: "If I had more time, I ____ Spanish.", options: ["learn", "would learn", "learned", "will learn"], answer: 1 },
        { q: "She asked me where I ____.", options: ["live", "lived", "am living", "will live"], answer: 1 },
        { q: "The project ____ by Friday.", options: ["will finish", "will be finished", "is finishing", "finished"], answer: 1 },
        { q: "Выберите корректный фразовый глагол:", options: ["look after", "look of", "look over to", "look at for"], answer: 0 }
      ],
      advanced: [
        { q: "Hardly ____ the meeting started when the fire alarm went off.", options: ["had", "has", "did", "was"], answer: 0 },
        { q: "Not only ____ late, but she also forgot the report.", options: ["she arrived", "did she arrive", "she did arrive", "arrived she"], answer: 1 },
        { q: "His explanation was so ____ that everyone understood immediately.", options: ["lucid", "opaque", "vague", "ambiguous"], answer: 0 },
        { q: "Choose the closest meaning of 'to mitigate':", options: ["to worsen", "to reduce", "to ignore", "to postpone"], answer: 1 },
        { q: "By this time next year, they ____ the merger.", options: ["will complete", "will have completed", "have completed", "are completing"], answer: 1 }
      ]
    },
    german: {
      beginner: [
        { q: "Выберите перевод слова «дом»:", options: ["das Haus", "die Schule", "der Tisch", "das Buch"], answer: 0 },
        { q: "Какой артикль у слова Mann?", options: ["die", "das", "der", "den"], answer: 2 },
        { q: "Ich ____ Anna.", options: ["heiße", "heißt", "heiß", "heißen"], answer: 0 },
        { q: "Выберите правильное местоимение для «мы»:", options: ["ich", "du", "wir", "sie"], answer: 2 },
        { q: "Как сказать «Доброе утро»?", options: ["Guten Tag", "Gute Nacht", "Guten Morgen", "Hallo Abend"], answer: 2 }
      ],
      intermediate: [
        { q: "Ich habe keine Zeit, ____ ich arbeiten muss.", options: ["denn", "weil", "ob", "wenn"], answer: 1 },
        { q: "Wir treffen uns, ____ das Wetter gut ist.", options: ["dass", "weil", "wenn", "obwohl"], answer: 2 },
        { q: "Er interessiert sich ____ Musik.", options: ["für", "an", "auf", "mit"], answer: 0 },
        { q: "Das Buch liegt ____ Tisch.", options: ["im", "an", "auf dem", "zu"], answer: 2 },
        { q: "Gestern ____ ich ins Kino gegangen.", options: ["bin", "habe", "war", "werde"], answer: 0 }
      ],
      advanced: [
        { q: "Obwohl er krank war, ____ er zur Arbeit.", options: ["geht", "ging", "gegangen", "ist gegangen"], answer: 1 },
        { q: "Ich wünschte, ich ____ mehr Zeit gehabt.", options: ["hätte", "habe", "hatte", "hätten"], answer: 0 },
        { q: "Der Vortrag war sehr ____ und präzise.", options: ["oberflächlich", "verständlich", "missverständlich", "zweifelhaft"], answer: 1 },
        { q: "Kaum ____ wir angekommen, begann es zu regnen.", options: ["waren", "hatten", "sind", "haben"], answer: 0 },
        { q: "Wähle das passende Verb: eine Entscheidung ____.", options: ["nehmen", "machen", "tun", "geben"], answer: 1 }
      ]
    }
  };

  let state = {
    language: "",
    level: "",
    questions: [],
    currentIndex: 0,
    selectedIndex: null,
    correctCount: 0,
    answers: []
  };
  let timerId = null;
  let secondsLeft = 600;

  const formatTime = (seconds) => {
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  const stopTimer = () => {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  };

  const updateTimerLabel = () => {
    quizTimer.textContent = formatTime(secondsLeft);
  };

  const openModal = () => {
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    stopTimer();
  };

  const resetQuizUi = () => {
    stopTimer();
    secondsLeft = 600;
    updateTimerLabel();
    setupStatus.textContent = "";
    quizResult.textContent = "";
    quizDetails.innerHTML = "";
    setupForm.hidden = false;
    quizBlock.hidden = true;
    state = {
      language: "",
      level: "",
      questions: [],
      currentIndex: 0,
      selectedIndex: null,
      correctCount: 0,
      answers: []
    };
    quizNextBtn.textContent = "Следующий вопрос";
    quizNextBtn.disabled = true;
    setupForm.reset();
  };

  const renderQuestion = () => {
    const question = state.questions[state.currentIndex];
    if (!question) return;

    const langLabel = state.language === "english" ? "Английский" : "Немецкий";
    const levelLabel = state.level === "beginner" ? "Начальный" : state.level === "intermediate" ? "Средний" : "Продвинутый";
    quizMeta.textContent = `${langLabel} • ${levelLabel} • Вопрос ${state.currentIndex + 1} из 5`;
    quizQuestion.textContent = question.q;
    quizOptions.innerHTML = "";
    state.selectedIndex = null;
    quizNextBtn.disabled = true;

    question.options.forEach((optionText, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "quiz-option";
      button.textContent = optionText;
      button.addEventListener("click", () => {
        state.selectedIndex = index;
        quizNextBtn.disabled = false;
        const all = quizOptions.querySelectorAll(".quiz-option");
        all.forEach((el) => el.classList.remove("is-selected"));
        button.classList.add("is-selected");
      });
      quizOptions.appendChild(button);
    });

    quizNextBtn.textContent = state.currentIndex === state.questions.length - 1 ? "Завершить тест" : "Следующий вопрос";
  };

  const showResult = () => {
    stopTimer();
    const percent = Math.round((state.correctCount / state.questions.length) * 100);
    let recommendation = "Рекомендуем начать с базовой систематизации и регулярной практики.";
    if (percent >= 80) recommendation = "Отличный результат! Вам подойдет группа продвинутого уровня.";
    else if (percent >= 50) recommendation = "Хорошая база. Оптимально продолжить на среднем уровне.";
    quizResult.textContent = `Результат: ${state.correctCount} из ${state.questions.length} (${percent}%). ${recommendation}`;
    quizResult.style.color = "#9de6b8";

    quizDetails.innerHTML = "";
    state.answers.forEach((entry, idx) => {
      const row = document.createElement("div");
      row.className = `quiz-detail ${entry.isCorrect ? "quiz-detail--ok" : "quiz-detail--bad"}`;
      row.innerHTML = `<strong>Вопрос ${idx + 1}:</strong> ${entry.question}<br>Ваш ответ: ${entry.userAnswer}<br>Правильный ответ: ${entry.correctAnswer}`;
      quizDetails.appendChild(row);
    });
  };

  setupForm.addEventListener("submit", (event) => {
    event.preventDefault();
    setupStatus.textContent = "";
    const formData = new FormData(setupForm);
    const language = String(formData.get("language") || "");
    const level = String(formData.get("level") || "");

    if (!language || !level || !questionBank[language] || !questionBank[language][level]) {
      setupStatus.textContent = "Выберите язык и уровень, чтобы начать тест.";
      setupStatus.style.color = "#ffb6b6";
      return;
    }

    state.language = language;
    state.level = level;
    state.questions = questionBank[language][level];
    state.currentIndex = 0;
    state.correctCount = 0;
    state.answers = [];
    secondsLeft = 600;
    updateTimerLabel();
    stopTimer();
    timerId = setInterval(() => {
      secondsLeft -= 1;
      updateTimerLabel();
      if (secondsLeft <= 0) {
        secondsLeft = 0;
        updateTimerLabel();
        quizOptions.innerHTML = "";
        quizQuestion.textContent = "Время вышло. Тест завершён автоматически.";
        quizMeta.textContent = "";
        quizNextBtn.disabled = true;
        showResult();
      }
    }, 1000);
    setupForm.hidden = true;
    quizBlock.hidden = false;
    renderQuestion();
  });

  quizNextBtn.addEventListener("click", () => {
    if (state.selectedIndex === null) return;
    const question = state.questions[state.currentIndex];
    if (question) {
      const isCorrect = state.selectedIndex === question.answer;
      if (isCorrect) state.correctCount += 1;
      state.answers.push({
        question: question.q,
        userAnswer: question.options[state.selectedIndex],
        correctAnswer: question.options[question.answer],
        isCorrect
      });
    }

    if (state.currentIndex < state.questions.length - 1) {
      state.currentIndex += 1;
      renderQuestion();
      return;
    }

    quizOptions.innerHTML = "";
    quizQuestion.textContent = "Тест завершён.";
    quizMeta.textContent = "";
    quizNextBtn.disabled = true;
    showResult();
  });

  quizRestartBtn.addEventListener("click", resetQuizUi);

  openButtons.forEach((button) => button.addEventListener("click", () => {
    resetQuizUi();
    openModal();
  }));
  closeButtons.forEach((button) => button.addEventListener("click", closeModal));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("is-open")) closeModal();
  });
}
