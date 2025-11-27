/* ---------- script.js - improved version ---------- */

/* Helpers */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

/* ---------- THEME TOGGLE (persist preference + icon switch) ---------- */
const themeBtn = $('#themeToggle');
const root = document.documentElement;
const storedTheme = localStorage.getItem('theme');
if (storedTheme === 'light') root.classList.add('light');
else if (!storedTheme) {
  // respect OS preference if no stored preference
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) root.classList.add('light');
}
function updateThemeButton() {
  const isLight = root.classList.contains('light');
  themeBtn.setAttribute('aria-pressed', String(isLight));
  // show/hide icons via CSS color is enough; keep accessible text
}
if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    const isLight = root.classList.toggle('light');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    updateThemeButton();
  });
}
updateThemeButton();

/* ---------- SMOOTH SCROLL for in-page anchors ---------- */
$$('a[href^="#"]').forEach(a => {
  a.addEventListener('click', function(e){
    e.preventDefault();
    const id = this.getAttribute('href').slice(1);
    const target = document.getElementById(id);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

/* ---------- BACK TO TOP ---------- */
const back = $('#backTop');
window.addEventListener('scroll', () => {
  if (!back) return;
  if (window.scrollY > 350) back.style.display = 'block';
  else back.style.display = 'none';
});
if (back) back.addEventListener('click', () => window.scrollTo({ top:0, behavior:'smooth' }));

/* ---------- PORTFOLIO CARDS: click and keyboard accessible ---------- */
$$('.portfolio-card').forEach(card => {
  card.addEventListener('click', () => {
    const url = card.dataset.url;
    if (url) window.location.href = url;
  });
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      card.click();
    }
  });
});

/* ---------- SLIDER: fade + autoplay + pause on hover + keyboard nav ---------- */
(function() {
  const slider = $('#slider');
  if (!slider) return;
  const imgs = $$('#slider .slides img');
  let i = 0;
  let interval = null;
  const show = (n) => {
    imgs.forEach((img, idx) => {
      img.classList.toggle('active', idx === n);
    });
  };
  const next = () => { i = (i + 1) % imgs.length; show(i); };
  const prev = () => { i = (i - 1 + imgs.length) % imgs.length; show(i); };

  $('#next').addEventListener('click', next);
  $('#prev').addEventListener('click', prev);

  // keyboard left/right
  slider.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') prev();
    if (e.key === 'ArrowRight') next();
  });
  slider.setAttribute('tabindex', '0');

  // autoplay
  function startAutoplay() { if (!interval) interval = setInterval(next, 4500); }
  function stopAutoplay() { if (interval) { clearInterval(interval); interval = null; } }
  slider.addEventListener('mouseenter', stopAutoplay);
  slider.addEventListener('mouseleave', startAutoplay);
  // touch swipe (basic)
  let startX = null;
  slider.addEventListener('touchstart', e => startX = e.touches[0].clientX);
  slider.addEventListener('touchend', e => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (dx > 50) prev();
    else if (dx < -50) next();
    startX = null;
  });

  startAutoplay();
  show(0);
})();

/* ---------- SKILLS: animate using IntersectionObserver ---------- */
(function() {
  const skills = $$('#skills .skill');
  if (!skills.length) return;
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const skill = entry.target;
        const percent = skill.dataset.percent || 0;
        const fill = skill.querySelector('.bar-fill');
        fill.style.width = percent + '%';
        obs.unobserve(skill);
      }
    });
  }, { threshold: 0.25 });

  skills.forEach(s => io.observe(s));
})();

/* ---------- CANVAS: simple decorative drawing ---------- */
(function() {
  const canvas = document.getElementById('myCanvas');
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  // background
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = 'rgba(244,195,0,0.12)';
  roundRect(ctx, 6, 6, canvas.width - 12, canvas.height - 12, 10);
  ctx.fill();

  ctx.font = '18px Poppins, sans-serif';
  ctx.fillStyle = 'white';
  ctx.fillText('Hello Canvas', 18, 70);

  function roundRect(ctx, x, y, w, h, r){
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.arcTo(x+w, y, x+w, y+h, r);
    ctx.arcTo(x+w, y+h, x, y+h, r);
    ctx.arcTo(x, y+h, x, y, r);
    ctx.arcTo(x, y, x+w, y, r);
    ctx.closePath();
  }
})();

/* ---------- CONTACT FORM: validation -> store array in localStorage -> redirect ---------- */
(function(){
  const contactForm = document.getElementById('contactForm');
  const formMsg = document.getElementById('formMsg');
  const submitBtn = document.getElementById('submitBtn');

  if (!contactForm) return;

  function setMessage(text, color = 'tomato') {
    formMsg.textContent = text;
    formMsg.style.color = color;
  }

  contactForm.addEventListener('submit', function(e){
    e.preventDefault();
    // disable to prevent double submission
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.7';

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const message = document.getElementById('message').value.trim();

    // simple validation
    if (!name || !email || !message) {
      setMessage('Please fill all fields.', 'tomato');
      submitBtn.disabled = false;
      submitBtn.style.opacity = '1';
      return;
    }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email)) {
      setMessage('Please enter a valid email address.', 'tomato');
      submitBtn.disabled = false;
      submitBtn.style.opacity = '1';
      return;
    }

    // prepare payload
    const payload = { name, email, message, submittedAt: new Date().toISOString() };

    // store multiple entries in localStorage under "portfolio_contacts"
    try {
      const existing = JSON.parse(localStorage.getItem('portfolio_contacts') || '[]');
      existing.push(payload);
      localStorage.setItem('portfolio_contacts', JSON.stringify(existing));
    } catch (err) {
      // fallback: overwrite
      localStorage.setItem('portfolio_contacts', JSON.stringify([payload]));
    }

    setMessage('Message saved — redirecting to details…', '#2ecc71');

    // clear form UI
    contactForm.reset();

    setTimeout(() => {
      // go to form-details page if it exists; otherwise just re-enable and stay
      if (location.pathname.endsWith('index.html') || location.pathname.endsWith('/')) {
        // redirect to form-details.html if you included that page
        // if you don't have that page, comment out the next line
        location.href = 'form-details.html';
      } else {
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        setMessage('', '');
      }
    }, 700);
  });
})();

/* ---------- small helper: reveal sections on scroll (optional) ---------- */
(function() {
  const revealables = $$('.section');
  const ior = new IntersectionObserver((entries, obs) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity = 1;
        e.target.style.transform = 'translateY(0)';
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });

  revealables.forEach(s => {
    s.style.opacity = 0;
    s.style.transform = 'translateY(12px)';
    s.style.transition = 'all 700ms cubic-bezier(.2,.9,.3,1)';
    ior.observe(s);
  });
})();
