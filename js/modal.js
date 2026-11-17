document.addEventListener("DOMContentLoaded", function () {
  const siteHeader = document.querySelector(".site-header");
  const menuToggle = document.querySelector(".mobile-menu-toggle");
  const navigation = document.querySelector(".main-navigation");

  if (siteHeader && menuToggle && navigation) {
    let lastScrollY = window.scrollY;

    function updateHeaderVisibility() {
      const currentScrollY = window.scrollY;

      if (
        navigation.classList.contains("is-open") ||
        currentScrollY <= 8 ||
        currentScrollY < lastScrollY
      ) {
        siteHeader.classList.remove("is-hidden");
      } else if (currentScrollY > lastScrollY) {
        siteHeader.classList.add("is-hidden");
      }

      lastScrollY = currentScrollY;
    }

    window.addEventListener("scroll", updateHeaderVisibility, { passive: true });

    function closeMobileMenu() {
      siteHeader.classList.remove("is-open");
      siteHeader.classList.remove("is-hidden");
      navigation.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Відкрити меню");
      const isMobile = window.innerWidth <= 820;
      navigation.setAttribute("aria-hidden", String(isMobile));
      navigation.inert = isMobile;
    }

    function toggleMobileMenu() {
      const isOpen = navigation.classList.toggle("is-open");
      siteHeader.classList.toggle("is-open", isOpen);
      menuToggle.setAttribute("aria-expanded", String(isOpen));
      menuToggle.setAttribute("aria-label", isOpen ? "Закрити меню" : "Відкрити меню");
      const isMobile = window.innerWidth <= 820;
      navigation.setAttribute("aria-hidden", String(isMobile && !isOpen));
      navigation.inert = isMobile && !isOpen;
    }

    menuToggle.addEventListener("click", toggleMobileMenu);

    navigation.querySelectorAll("a, [data-modal-target]").forEach(function (item) {
      item.addEventListener("click", closeMobileMenu);
    });

    document.addEventListener("click", function (event) {
      if (
        navigation.classList.contains("is-open") &&
        !siteHeader.contains(event.target)
      ) {
        closeMobileMenu();
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 820) {
        closeMobileMenu();
      } else {
        const isOpen = navigation.classList.contains("is-open");
        navigation.setAttribute("aria-hidden", String(!isOpen));
        navigation.inert = !isOpen;
      }
    });

    closeMobileMenu();
  }

  const modalTriggers = document.querySelectorAll("[data-modal-target]");
  const calculator = document.querySelector("#cost-calculator");
  let activeModal = null;
  let lastFocusedElement = null;

  function setBackgroundInert(isInert, modal) {
    Array.from(document.body.children).forEach(function (element) {
      element.inert = isInert && element !== modal;
    });
  }

  function getCalculatorSummary() {
    if (!calculator) {
      return { parameters: "Параметри не вказані", cost: "Приклад розрахунку уточнюється" };
    }
    const area = calculator.querySelector("#area");
    const selectedType = calculator.querySelector('input[name="object-type"]:checked');
    const extras = Array.from(calculator.querySelectorAll('input[name="service[]"]:checked'))
      .map(function (input) { return input.closest("label").textContent.trim().replace(/\s*\(\+\d+%\)/, ""); });
    const value = calculator.querySelector("#cost-value");
    const type = selectedType ? selectedType.closest("label").textContent.trim() : "Тип не вказаний";
    return {
      parameters: [(area && area.value ? area.value + " м²" : "Площа не вказана"), type].concat(extras).join(" / "),
      cost: value ? "Приклад розрахунку " + value.textContent : "Приклад розрахунку уточнюється"
    };
  }

  function updateCalculatorSummary() {
    const modal = document.querySelector("#calculator-modal");
    if (!modal) return;
    const summary = getCalculatorSummary();
    modal.querySelector("#modal-project-parameters").textContent = summary.parameters;
    modal.querySelector("#modal-project-cost").textContent = summary.cost;
  }

  function closeModal() {
    if (!activeModal) return;
    stopModalVideo(activeModal);
    activeModal.classList.remove("is-open");
    activeModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    setBackgroundInert(false);
    if (lastFocusedElement) lastFocusedElement.focus();
    activeModal = null;
  }

  function stopModalVideo(modal) {
    const video = modal.querySelector("[data-case-video]");
    if (!video) return;
    if (!video.dataset.videoSrc) {
      video.dataset.videoSrc = video.getAttribute("src") || "";
    }
    video.setAttribute("src", "about:blank");
  }

  function restoreModalVideo(modal) {
    const video = modal.querySelector("[data-case-video]");
    if (!video || !video.dataset.videoSrc) return;
    video.setAttribute("src", video.dataset.videoSrc);
  }

  function openModal(selector) {
    const modal = document.querySelector(selector);
    if (!modal) return;
    if (activeModal) closeModal();
    activeModal = modal;
    lastFocusedElement = document.activeElement;
    restoreModalVideo(modal);
    if (modal.id === "calculator-modal") updateCalculatorSummary();
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    setBackgroundInert(true, modal);
    modal.querySelector(".modal-close").focus();
  }

  modalTriggers.forEach(function (trigger) {
    trigger.addEventListener("click", function () {
      openModal(trigger.dataset.modalTarget);
    });
  });

  document.querySelectorAll("[data-modal-close]").forEach(function (button) {
    button.addEventListener("click", function () {
      const scrollTarget = button.dataset.scrollTarget;
      closeModal();
      if (scrollTarget) {
        const target = document.querySelector(scrollTarget);
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    });
  });

  document.addEventListener("keydown", function (event) {
    if (!activeModal) {
      return;
    }

    if (event.key === "Escape") {
      closeModal();
      return;
    }

    if (event.key === "Tab") {
      const dialog = activeModal.querySelector(".modal-dialog");
      const focusable = Array.from(dialog.querySelectorAll(
        "a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex='-1'])"
      ));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  if (calculator) {
    calculator.addEventListener("input", updateCalculatorSummary);
  }

  document.querySelectorAll(".modal-form").forEach(function (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      const status = form.querySelector(".modal-status");
      status.textContent = "Форма заповнена. Підключіть endpoint, щоб надіслати заявку.";
    });
  });
});
