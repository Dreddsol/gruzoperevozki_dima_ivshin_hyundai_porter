/* ==========================================================================
   Грузоперевозки по Глазову — interactive behaviour
   Header / nav / hero image fallback / reveal / counters / FAQ / form
   ========================================================================== */
(function () {
  'use strict';

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Header state + scroll spy ---------- */
  var header = $('#header');
  var toTop = $('#toTop');
  var navLinks = $$('.nav__link');
  var sections = navLinks
    .map(function (link) { return document.getElementById(link.getAttribute('href').slice(1)); })
    .filter(Boolean);

  function onScroll() {
    var y = window.pageYOffset || document.documentElement.scrollTop;
    if (header) header.classList.toggle('is-scrolled', y > 40);
    if (toTop) toTop.classList.toggle('is-shown', y > 700);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (sections.length && 'IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (link) {
          link.classList.toggle('is-active', link.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    sections.forEach(function (section) { spy.observe(section); });
  }

  /* ---------- Mobile menu ---------- */
  var burger = $('#burger');
  var nav = $('#nav');

  function closeMenu() {
    if (!nav || !burger) return;
    nav.classList.remove('is-open');
    burger.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      burger.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
      document.body.style.overflow = open ? 'hidden' : '';
    });

    nav.addEventListener('click', function (event) {
      if (event.target.closest('a')) closeMenu();
    });
  }

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeMenu();
  });

  /* ---------- Hero photo fallback (if img/hero.jpg is missing) ---------- */
  var heroPhoto = $('#heroPhoto');
  if (heroPhoto) {
    heroPhoto.addEventListener('error', function () { heroPhoto.classList.add('is-hidden'); });
    if (heroPhoto.complete && heroPhoto.naturalWidth === 0) heroPhoto.classList.add('is-hidden');
  }

  /* ---------- Reveal on scroll ---------- */
  var revealItems = $$('.reveal');

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach(function (item) { item.classList.add('is-visible'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.1 });

    // group children so grids animate with a small stagger
    $$('.grid, .steps, .faq, .adv').forEach(function (group) {
      $$('.reveal', group).forEach(function (item, index) {
        item.style.transitionDelay = Math.min(index, 5) * 70 + 'ms';
      });
    });

    revealItems.forEach(function (item) { revealObserver.observe(item); });
  }

  /* ---------- Animated counters ---------- */
  var counters = $$('[data-count]');

  function runCounter(el) {
    var target = parseInt(el.getAttribute('data-count'), 10) || 0;
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';
    var duration = 1400;
    var start = performance.now();

    function format(value) {
      return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }

    if (reduceMotion) {
      el.textContent = prefix + format(target) + suffix;
      return;
    }

    function tick(now) {
      var progress = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = prefix + format(Math.round(target * eased)) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  if (counters.length && 'IntersectionObserver' in window && !reduceMotion) {
    var counterObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        runCounter(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.6 });

    counters.forEach(function (counter) { counterObserver.observe(counter); });
  } else {
    counters.forEach(runCounter);
  }

  /* ---------- Smooth scroll + prefill service from CTA buttons ---------- */
  var serviceSelect = $('#service');

  function prefillService(name) {
    if (!serviceSelect || !name) return;
    var option = $$('option', serviceSelect).filter(function (opt) {
      return opt.textContent.trim() === name.trim();
    })[0];
    if (option) serviceSelect.value = option.value;
  }

  $$('.js-scroll-to').forEach(function (trigger) {
    trigger.addEventListener('click', function () {
      prefillService(trigger.getAttribute('data-service'));
      var form = $('#orderForm');
      var name = $('#name');
      if (!form || !name) return;
      // move focus into the form once the browser has scrolled there
      window.setTimeout(function () {
        name.focus({ preventScroll: true });
      }, reduceMotion ? 60 : 700);
    });
  });

  /* ---------- FAQ: keep a single answer opened ---------- */
  var faqItems = $$('.faq__item');

  faqItems.forEach(function (item) {
    item.addEventListener('toggle', function () {
      if (!item.open) return;
      faqItems.forEach(function (other) {
        if (other !== item) other.open = false;
      });
    });
  });

  /* ---------- Privacy note (no backend, so we explain data usage inline) ---------- */
  var privacyLink = $('#privacy');

  if (privacyLink) {
    privacyLink.addEventListener('click', function (event) {
      event.preventDefault();

      var dialog = $('#privacyDialog');
      if (!dialog) {
        dialog = document.createElement('dialog');
        dialog.id = 'privacyDialog';
        dialog.className = 'dialog';
        dialog.innerHTML =
          '<div class="dialog__body">' +
          '<h3 class="dialog__title">Политика конфиденциальности</h3>' +
          '<p>Мы собираем из формы заявки только имя, телефон, услугу, дату и описание груза. Эти данные используются исключительно для обратной связи и расчёта стоимости перевозки и не передаются третьим лицам.</p>' +
          '<p>Чтобы отозвать согласие, позвоните по номеру +7 (34121) 2-34-56 — заявку удалим в течение рабочего дня.</p>' +
          '<div class="dialog__foot"><button type="button" class="btn btn--primary btn--sm" data-close>Понятно</button></div>' +
          '</div>';
        document.body.appendChild(dialog);

        dialog.addEventListener('click', function (e) {
          if (e.target === dialog || e.target.closest('[data-close]')) dialog.close();
        });
      }

      if (typeof dialog.showModal === 'function') dialog.showModal();
    });
  }

  /* ---------- Phone mask ---------- */
  var phoneInput = $('#phone');

  function maskPhone(value) {
    var digits = value.replace(/\D/g, '');
    if (!digits) return '';
    if (digits[0] === '8') digits = '7' + digits.slice(1);
    if (digits[0] !== '7') digits = '7' + digits;
    digits = digits.slice(0, 11);

    var out = '+7';
    if (digits.length > 1) out += ' (' + digits.slice(1, 4);
    if (digits.length >= 5) out += ') ' + digits.slice(4, 7);
    if (digits.length >= 8) out += '-' + digits.slice(7, 9);
    if (digits.length >= 10) out += '-' + digits.slice(9, 11);
    return out;
  }

  if (phoneInput) {
    phoneInput.addEventListener('input', function () {
      var cursorAtEnd = phoneInput.selectionStart === phoneInput.value.length;
      phoneInput.value = maskPhone(phoneInput.value);
      if (cursorAtEnd) phoneInput.setSelectionRange(phoneInput.value.length, phoneInput.value.length);
    });

    phoneInput.addEventListener('focus', function () {
      if (!phoneInput.value) phoneInput.value = '+7 (';
    });
  }

  /* ---------- Form validation + submit ---------- */
  var form = $('#orderForm');
  var status = $('#formStatus');
  var submitBtn = $('#submitBtn');

  var rules = {
    name: function (value) {
      var trimmed = value.trim();
      if (!trimmed) return 'Укажите, как к вам обращаться';
      if (trimmed.length < 2) return 'Имя слишком короткое';
      if (/\d/.test(trimmed)) return 'Имя пишется без цифр';
      return '';
    },
    phone: function (value) {
      var digits = value.replace(/\D/g, '');
      if (!digits) return 'Введите номер телефона';
      if (digits.length < 11) return 'Номер должен содержать 11 цифр';
      return '';
    },
    consent: function (value, field) {
      return field.checked ? '' : 'Без согласия мы не можем принять заявку';
    }
  };

  function showError(name, message) {
    var errorEl = $('[data-error-for="' + name + '"]');
    var input = document.getElementById(name);
    var wrapper = input && (input.closest('.field') || input.closest('.agree'));

    if (errorEl) {
      errorEl.textContent = message || '';
      errorEl.classList.toggle('is-shown', Boolean(message));
    }
    if (wrapper) wrapper.classList.toggle('is-invalid', Boolean(message));
    if (input) input.setAttribute('aria-invalid', message ? 'true' : 'false');
  }

  function validateField(input) {
    var rule = rules[input.name];
    if (!rule) return true;
    var message = rule(input.value, input);
    showError(input.name, message);
    return !message;
  }

  if (form) {
    Object.keys(rules).forEach(function (name) {
      var input = document.getElementById(name);
      if (!input) return;

      input.addEventListener('blur', function () { validateField(input); });
      // re-validate live only after the first error was shown
      input.addEventListener('input', function () {
        var errorEl = $('[data-error-for="' + name + '"]');
        if (errorEl && errorEl.classList.contains('is-shown')) validateField(input);
      });
      if (input.type === 'checkbox') {
        input.addEventListener('change', function () { validateField(input); });
      }
    });

    // date of delivery cannot be in the past
    var dateInput = $('#date');
    if (dateInput) {
      var today = new Date();
      today.setHours(0, 0, 0, 0);
      dateInput.min = today.toISOString().slice(0, 10);
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      var fields = $$('input, select, textarea', form);
      var invalid = fields.filter(function (input) {
        return rules[input.name] && !validateField(input);
      });

      if (invalid.length) {
        if (status) {
          status.textContent = 'Проверьте выделенные поля — ' + invalid.length + ' из них заполнено некорректно.';
          status.className = 'form__status is-error';
        }
        invalid[0].focus();
        return;
      }

      if (status) {
        status.textContent = '';
        status.className = 'form__status';
      }
      form.classList.add('is-sending');
      if (submitBtn) submitBtn.disabled = true;

      var payload = {};
      new FormData(form).forEach(function (value, key) { payload[key] = value; });
      // Endpoint does not exist yet — replace this with a real fetch() when the backend is ready.
      console.log('[order] заявка:', payload);

      window.setTimeout(function () {
        form.classList.remove('is-sending');
        if (submitBtn) submitBtn.disabled = false;
        showSuccess(payload.name);
      }, 900);
    });
  }

  function showSuccess(clientName) {
    if (!form) return;

    var success = document.createElement('div');
    success.className = 'form__success';
    success.innerHTML =
      '<span class="form__success-icon" aria-hidden="true">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l5.2 5.2L20 6.8"/></svg>' +
      '</span>' +
      '<h3>Заявка отправлена</h3>' +
      '<p>' + (clientName ? clientName + ', ' : '') + 'диспетчер перезвонит в течение 5 минут и назовёт фиксированную стоимость.</p>' +
      '<p><b>Нужна помощь прямо сейчас?</b> <a href="tel:+73412123456">+7 (34121) 2-34-56</a></p>' +
      '<button type="button" class="btn btn--outline btn--sm" data-reset>Отправить ещё одну заявку</button>';

    form.innerHTML = '';
    form.appendChild(success);

    if (status) {
      status.textContent = '';
      form.appendChild(status);
    }

    var reset = $('[data-reset]', success);
    if (reset) reset.addEventListener('click', function () { window.location.reload(); });
  }

  /* ---------- Footer year ---------- */
  var year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
