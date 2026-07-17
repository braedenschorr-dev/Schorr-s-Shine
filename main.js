// --- Mobile nav toggle ---
var toggle = document.getElementById('navToggle');
var links = document.getElementById('navLinks');
if (toggle && links) {
  toggle.addEventListener('click', function() {
    var isOpen = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
  links.querySelectorAll('a').forEach(function(link) {
    link.addEventListener('click', function() {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// --- Quote CTA links: on the Contact page, smooth-scroll to the form; everywhere else, let the link's real href take you to contact.html#quote ---
document.querySelectorAll('.js-quote-trigger').forEach(function(btn) {
  btn.addEventListener('click', function(e) {
    var quote = document.getElementById('quote');
    if (!quote) return; // not on this page — allow normal navigation to contact.html#quote
    e.preventDefault();
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    quote.scrollIntoView({behavior: reduceMotion ? 'auto' : 'smooth', block: 'center'});
    setTimeout(function() {
      var field = quote.querySelector('.qw-step.active input, .qw-step.active textarea');
      if (field) field.focus({preventScroll: true});
    }, reduceMotion ? 0 : 450);
  });
});

// --- Quote wizard (only runs on pages that actually have the form, i.e. contact.html) ---
var qwForm = document.getElementById('quoteForm');
if (qwForm) {
  var qwSteps = Array.prototype.slice.call(qwForm.querySelectorAll('.qw-step'));
  var qwFill = document.getElementById('qwFill');
  var qwStatus = document.getElementById('qwStatus');
  var qwSubmit = document.getElementById('qwSubmit');
  var qwCurrent = 0;

  function qwShow(i, skipFocus) {
    qwCurrent = Math.max(0, Math.min(i, qwSteps.length - 1));
    qwSteps.forEach(function(s, idx) { s.classList.toggle('active', idx === qwCurrent); });
    qwFill.style.width = ((qwCurrent + 1) / qwSteps.length * 100) + '%';
    if (skipFocus) return;
    var field = qwSteps[qwCurrent].querySelector('input:not([type=radio]):not([type=hidden]), textarea');
    if (field) field.focus({preventScroll: true});
  }

  function qwSetError(step, msg) {
    var err = step.querySelector('.qw-err');
    if (err) err.textContent = msg || '';
  }

  function qwValidate(step) {
    var field = step.querySelector('input:not([type=radio]):not([type=hidden]), textarea');
    qwSetError(step, '');
    if (!field) return true;
    var val = field.value.trim();
    if (step.dataset.required === 'true' && !val) {
      qwSetError(step, step.querySelector('.qw-err').dataset.msg || 'This field is required.');
      field.focus();
      return false;
    }
    if (val && !field.checkValidity()) {
      qwSetError(step, step.querySelector('.qw-err').dataset.msg || 'Please check this field.');
      field.focus();
      return false;
    }
    return true;
  }

  qwForm.addEventListener('click', function(e) {
    if (e.target.classList.contains('qw-next') && e.target.type !== 'submit') {
      if (qwValidate(qwSteps[qwCurrent])) qwShow(qwCurrent + 1);
    } else if (e.target.classList.contains('qw-back')) {
      qwShow(qwCurrent - 1);
    }
  });

  qwForm.addEventListener('keydown', function(e) {
    if (e.key !== 'Enter') return;
    var isTextarea = e.target.tagName === 'TEXTAREA';
    var isLast = qwCurrent === qwSteps.length - 1;
    if (isTextarea && e.shiftKey) return; // allow newline
    e.preventDefault();
    if (!qwValidate(qwSteps[qwCurrent])) return;
    if (isLast) { qwForm.requestSubmit(); } else { qwShow(qwCurrent + 1); }
  });

  qwForm.addEventListener('submit', function(e) {
    e.preventDefault();
    if (!qwValidate(qwSteps[qwCurrent])) return;
    qwSubmit.disabled = true;
    qwSubmit.textContent = 'Sending...';
    qwStatus.textContent = '';

    var body = new URLSearchParams(new FormData(qwForm)).toString();
    fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body
      })
      .then(function(response) {
        if (!response.ok) throw new Error('Submission failed');
        document.getElementById('qwBody').style.display = 'none';
        document.getElementById('qwFill').style.width = '100%';
        document.getElementById('qwSuccess').classList.add('active');
      })
      .catch(function() {
        qwStatus.textContent = 'Something went wrong — please call or text us instead at (518) 543-7564.';
      })
      .finally(function() {
        qwSubmit.disabled = false;
        qwSubmit.textContent = 'Send Request';
      });
  });

  qwShow(0, true);

  // If arriving from another page via a "#quote" link, scroll to the form after load
  if (window.location.hash === '#quote') {
    setTimeout(function() {
      document.getElementById('quote').scrollIntoView({behavior: 'auto', block: 'center'});
    }, 50);
  }
}
