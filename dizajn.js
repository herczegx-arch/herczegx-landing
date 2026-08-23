// dizajn.js - megosztott motor a szemelyes oldalhoz: csillagmezo, 3D forgo graf, accordion, scroll-spy.
// A grafhoz tartozo csomopontokat az oldal maga adja meg (window.GRAF_CSOMOPONTOK), mert a
// felirat es a cel nyelvenkent mas; a tobbi resz teljesen altalanos, adat nelkul mukodik.

function csillagokLetrehozasa(tartaly) {
  for (let i = 0; i < 40; i++) {
    const left = (i * 37 + 7) % 100;
    const top = (i * 53 + 13) % 100;
    const size = 3 + (i % 4) * 1.4;
    const dur = 5 + (i % 6) * 1.3;
    const delay = -(i % 10) * 0.7;
    const rotate = (i * 47) % 360;
    const dx = (rotate % 5) - 2;
    const dy = (rotate % 7) - 3;
    const d = document.createElement('div');
    d.className = 'star';
    d.style.left = left + '%';
    d.style.top = top + '%';
    d.style.width = size + 'px';
    d.style.height = (size * 2.2) + 'px';
    d.style.setProperty('--r', rotate + 'deg');
    d.style.setProperty('--dx', dx + 'px');
    d.style.setProperty('--dy', dy + 'px');
    d.style.animationDuration = dur + 's';
    d.style.animationDelay = delay + 's';
    tartaly.appendChild(d);
  }
}

function accordionBekotese() {
  document.querySelectorAll('.acc-sor').forEach((sor) => {
    const gomb = sor.querySelector('.acc-gomb');
    const chev = sor.querySelector('.acc-chev');
    const szoveg = sor.querySelector('.acc-szoveg');
    if (!gomb || !szoveg) return;
    gomb.addEventListener('click', () => {
      const nyitva = szoveg.classList.contains('lathato');
      document.querySelectorAll('.acc-szoveg.lathato').forEach((s) => s.classList.remove('lathato'));
      document.querySelectorAll('.acc-chev.nyitva').forEach((c) => c.classList.remove('nyitva'));
      if (!nyitva) {
        szoveg.classList.add('lathato');
        if (chev) chev.classList.add('nyitva');
      }
    });
  });
}

function scrollSpyBekotese() {
  const linkek = Array.from(document.querySelectorAll('.nav a.nav-link[href^="#"]'));
  if (!linkek.length) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      linkek.forEach((a) => a.classList.toggle('aktiv', a.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  linkek.forEach((a) => {
    const el = document.getElementById(a.getAttribute('href').slice(1));
    if (el) observer.observe(el);
  });
}

// A grafot eredetileg egy szeles, teljes kepernyos felulethez terveztek: a csomopontok radiusza
// fix pixelben van megadva. Egy ~900px-es kozponti oszlopban ez tulcsordulna a sajat dobozan
// (a kartyak levagva/egymason latszananak), ezert a teljes csoportot arányosan lekicsinyitjuk,
// hogy barmilyen szelessegen beleferjen; a forgas- es huzas-fizika valtozatlan marad.
function grafMeretezes(gyoker, grab, csomopontok) {
  let felVizszintes = 0;
  let felFuggoleges = 0;
  csomopontok.forEach((n) => {
    felVizszintes = Math.max(felVizszintes, n.radius);
    felFuggoleges = Math.max(felFuggoleges, Math.abs(n.y) + 58);
    (n.children || []).forEach((c) => {
      felVizszintes = Math.max(felVizszintes, n.radius + c.dRadius);
      felFuggoleges = Math.max(felFuggoleges, Math.abs(n.y + c.dY) + 58);
    });
  });
  const szuksegesSzelesseg = (felVizszintes + 70) * 2;
  const szuksegesMagassag = (felFuggoleges + 30) * 2;
  const box = gyoker.getBoundingClientRect();
  if (!box.width || !box.height) return;
  const faktor = Math.min(1, box.width / szuksegesSzelesseg, box.height / szuksegesMagassag);
  grab.style.transform = 'scale(' + faktor + ')';
}

// A harom dimenzios graf: automatikusan forog, egerrel/ujjal huzhato, minden csomopont valodi link.
function grafLetrehozasa(gyoker, csomopontok) {
  const csoport = gyoker.querySelector('.graf-csoport');
  const grab = gyoker.querySelector('.grab');
  if (!csoport || !grab) return;

  let ry = -18;
  let rx = 6;
  let speed = 0.12;
  let dragging = false;
  let hovering = false;
  let lastX = 0;
  let lastY = 0;
  let startX = 0;
  let startY = 0;
  let wasDrag = false;

  function csomopontElemLetrehozasa(href, label, num) {
    const kartya = document.createElement('a');
    kartya.className = 'graf-kartya';
    kartya.href = href;
    kartya.innerHTML = '<span class="szam">' + num + '</span><span class="cimke">' + label + '</span>';
    kartya.addEventListener('click', (e) => { if (wasDrag) e.preventDefault(); });
    return kartya;
  }

  function gyerekElemLetrehozasa(href, label) {
    const kartya = document.createElement('a');
    kartya.className = 'graf-gyerek';
    kartya.href = href;
    kartya.innerHTML = '<span class="cimke">' + label + '</span>';
    kartya.addEventListener('click', (e) => { if (wasDrag) e.preventDefault(); });
    return kartya;
  }

  const csomopontElemek = csomopontok.map((n) => {
    const vonal = document.createElement('div');
    vonal.className = 'graf-vonal';
    const kartya = csomopontElemLetrehozasa(n.href, n.label, n.num);
    csoport.appendChild(vonal);
    csoport.appendChild(kartya);
    const gyerekek = (n.children || []).map((c) => {
      const gvonal = document.createElement('div');
      gvonal.className = 'graf-vonal';
      const gkartya = gyerekElemLetrehozasa(n.href, c.label);
      csoport.appendChild(gvonal);
      csoport.appendChild(gkartya);
      return { cfg: c, vonal: gvonal, kartya: gkartya };
    });
    return { cfg: n, vonal, kartya, gyerekek };
  });

  const kozep = document.createElement('div');
  kozep.className = 'graf-kozep';
  csoport.appendChild(kozep);

  function frissit() {
    csoport.style.transform = 'rotateY(' + ry + 'deg) rotateX(' + rx + 'deg)';
    csomopontElemek.forEach(({ cfg: n, vonal, kartya, gyerekek }) => {
      const rad = ((ry + n.angle) * Math.PI) / 180;
      const depth = (Math.cos(rad) + 1) / 2;
      const scale = 0.8 + 0.2 * depth;
      const opacity = Math.max(0.45 + 0.55 * depth, 0.7);
      const wobble = Math.sin((ry + n.angle * 1.7) * Math.PI / 90) * 40
        + Math.sin((ry * 0.55 + n.angle * 0.4) * Math.PI / 60) * 18;
      const nodeY = n.y + wobble;

      vonal.style.transformOrigin = '0 50%';
      vonal.style.transform = 'rotateY(' + n.angle + 'deg)';
      vonal.style.width = n.radius + 'px';
      vonal.style.opacity = String(0.15 + 0.25 * depth);

      kartya.style.transform = 'rotateY(' + n.angle + 'deg) translateZ(' + n.radius + 'px) translateY(' + nodeY + 'px) rotateY(' + (-n.angle) + 'deg) translate(-50%,-50%) scale(' + scale + ')';
      kartya.style.opacity = String(opacity);

      gyerekek.forEach(({ cfg: c, vonal: gvonal, kartya: gkartya }) => {
        const total = n.angle + c.dAngle;
        const crad = ((ry + total) * Math.PI) / 180;
        const cdepth = (Math.cos(crad) + 1) / 2;
        const cscale = 0.65 + 0.2 * cdepth;
        const copacity = Math.max(0.25 + 0.4 * cdepth, 0.55);

        gvonal.style.transformOrigin = '0 50%';
        gvonal.style.transform = 'rotateY(' + n.angle + 'deg) translateZ(' + n.radius + 'px) rotateY(' + c.dAngle + 'deg)';
        gvonal.style.width = c.dRadius + 'px';
        gvonal.style.opacity = String(0.12 + 0.2 * cdepth);

        gkartya.style.transform = 'rotateY(' + n.angle + 'deg) translateZ(' + n.radius + 'px) rotateY(' + c.dAngle + 'deg) translateZ(' + c.dRadius + 'px) translateY(' + c.dY + 'px) rotateY(' + (-total) + 'deg) translate(-50%,-50%) scale(' + cscale + ')';
        gkartya.style.opacity = String(copacity);
      });
    });
  }

  function lepes() {
    const cel = (dragging || hovering) ? 0 : 0.12;
    speed += (cel - speed) * 0.04;
    if (!dragging && Math.abs(speed) > 0.001) ry += speed;
    frissit();
    requestAnimationFrame(lepes);
  }

  grab.addEventListener('pointerdown', (e) => {
    grab.setPointerCapture(e.pointerId);
    wasDrag = false;
    startX = e.clientX;
    startY = e.clientY;
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    grab.classList.add('ragad');
  });

  grab.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    if (Math.abs(e.clientX - startX) + Math.abs(e.clientY - startY) > 6) wasDrag = true;
    ry += dx * 0.4;
    rx = Math.max(-25, Math.min(25, rx - dy * 0.2));
    lastX = e.clientX;
    lastY = e.clientY;
  });

  const felenged = (e) => {
    if (e && e.pointerId != null) {
      try { grab.releasePointerCapture(e.pointerId); } catch (err) { /* mar elengedve */ }
    }
    dragging = false;
    grab.classList.remove('ragad');
  };
  grab.addEventListener('pointerup', felenged);
  grab.addEventListener('pointercancel', felenged);
  grab.addEventListener('pointerenter', () => { hovering = true; });
  grab.addEventListener('pointerleave', () => {
    hovering = false;
    dragging = false;
    grab.classList.remove('ragad');
  });

  grafMeretezes(gyoker, grab, csomopontok);
  let atmeretezesIdozito;
  window.addEventListener('resize', () => {
    clearTimeout(atmeretezesIdozito);
    atmeretezesIdozito = setTimeout(() => grafMeretezes(gyoker, grab, csomopontok), 150);
  });

  requestAnimationFrame(lepes);
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.csillagmezo').forEach(csillagokLetrehozasa);
  accordionBekotese();
  scrollSpyBekotese();
  const grafGyoker = document.querySelector('.graf-terulet');
  if (grafGyoker && window.GRAF_CSOMOPONTOK) grafLetrehozasa(grafGyoker, window.GRAF_CSOMOPONTOK);
});
