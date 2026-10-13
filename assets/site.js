/* Shotcaller. Every new file name shown is one the real app gave a sample file. The names, timings and
   log lines come from assets/data.js, which the build writes from a real run. This file only lays them out. */
(function () {
  'use strict';
  const V = 2;
  const doc = document, root = doc.documentElement;
  const STATIC = /[?&]static=1/.test(location.search) || matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (STATIC) root.classList.add('static');

  const $ = (s, n) => (n || doc).querySelector(s);
  const $$ = (s, n) => Array.from((n || doc).querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function el(tag, cls, html) { const n = doc.createElement(tag); if (cls) n.className = cls; if (html !== undefined) n.innerHTML = html; return n; }
  function btn(cls, html) { const b = el('button', cls, html); b.type = 'button'; return b; }
  function hint(node, text) { const h = el('span', 'hint', esc(text)); h.setAttribute('aria-hidden', 'true'); node.classList.add('has-hint'); node.appendChild(h); }
  function used(id) { $$('#' + id + ' .hint').forEach((h) => h.classList.add('is-gone')); }
  function pick(nodes, on) { nodes.forEach((n) => { const is = n === on; n.classList.toggle('is-on', is); if (n.tagName === 'BUTTON') n.setAttribute('aria-pressed', is ? 'true' : 'false'); }); }
  const img = (id, size, alt, eager) => '<img src="assets/shots/' + id + (size === 's' ? '-s' : '') + '.webp?v=' + V + '" alt="' + esc(alt || '') + '" width="' + (size === 's' ? 560 : 1440) + '" height="' + (size === 's' ? 350 : 900) + '"' + (eager ? '' : ' loading="lazy"') + ' decoding="async">';
  const shot = (id, size, alt, eager) => '<div class="shot">' + img(id, size, alt, eager) + '</div>';
  /* a date never breaks across two lines: its hyphens are shown as non-breaking ones */
  const nb = (s) => String(s).replace(/(\d)-(?=\d)/g, '$1\u2011');
  const fn = (name, cls) => '<span class="fn ' + (cls || 'fn--sel') + '">' + esc(nb(name)) + '</span>';
  const ic = (id) => '<span class="ic"' + (id ? ' style="background-image:url(assets/shots/' + id + '-s.webp?v=' + V + ')"' : '') + '></span>';
  const ARROW = '<svg class="arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v15m0 0-6-6m6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const GLASS = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="m15.500 15.500 5 5" stroke="currentColor" stroke-width="2.200" stroke-linecap="round"/></svg>';
  function seg(labels, onPick, name) {
    const box = el('div', 'seg' + (labels.join('').length > 34 ? ' seg--tall' : '')); box.setAttribute('role', 'group'); if (name) box.setAttribute('aria-label', name);
    const bs = labels.map((l, i) => { const b = btn('', esc(l)); b.addEventListener('click', () => { pick(bs, b); onPick(i); }); box.appendChild(b); return b; });
    pick(bs, bs[0]);
    return box;
  }
  function stack(panes, cls) { const s = el('div', 'stack ' + (cls || '')); panes.forEach((p, i) => { if (i === 0) p.classList.add('is-on'); s.appendChild(p); }); s.show = (i) => panes.forEach((p, k) => p.classList.toggle('is-on', k === i)); return s; }
  const secs = (n) => (Math.round(n * 10) / 10).toFixed(1);
  const whenSeen = (node, fn2) => { if (!('IntersectionObserver' in window)) return fn2(); const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); fn2(); } }, { threshold: .35 }); io.observe(node); };

  /* ---------------------------------------------------------------- hero: real renames, one at a time.
     The first one is already in the page's HTML, renamed, so it shows before any script runs.
     Each later one also arrives renamed: the page never shows a file that still has its old name alone. */
  function hero() {
    const items = window.SCH.hero, host = $('#d-hero'), stage = $('.stage', host), bar = $('.namebar', host);
    const fans = $$('.fan img', stage), layers = $$('.front img', stage), was = $('.was', bar), label = $('.fn', bar), ds = $$('.dot', host);
    let cur = 0, top = 1, timer = 0, held = false, seen = true;
    const src = (id, s) => 'assets/shots/' + id + (s ? '-s' : '') + '.webp?v=' + V;
    function show(i) {
      clearTimeout(timer);
      const it = items[i];
      cur = i; pick(ds, ds[i]);
      top = 1 - top;
      layers[top].src = src(it.id); layers[top].alt = 'A sample screenshot: ' + it.alt;
      layers[top].classList.remove('is-out'); layers[1 - top].classList.add('is-out');
      const set = () => fans.forEach((f, k) => { f.src = src(items[(i + 1 + k) % items.length].id, true); });
      if (STATIC) set(); else setTimeout(set, 300);
      was.textContent = nb(it.old); label.textContent = nb(it.name);
      if (!STATIC) { label.classList.remove('is-pop'); void label.offsetWidth; label.classList.add('is-pop'); if (!held) timer = setTimeout(next, 4200); }
    }
    function next() { if (!seen || doc.hidden) { timer = setTimeout(next, 900); return; } show((cur + 1) % items.length); }
    ds.forEach((b, i) => b.addEventListener('click', () => { held = true; show(i); }));
    if (STATIC) return;
    timer = setTimeout(next, 4600);
    if ('IntersectionObserver' in window) new IntersectionObserver((es) => { seen = es[0].isIntersecting; }, { threshold: .2 }).observe(stage);
    /* the crosshair macOS shows while you pick an area, with its coordinates */
    const cross = $('.cross', stage), cx = $('.cx', cross), cy = $('.cy', cross), tag = $('span', cross), front = $('.front', stage);
    let rect = null, raf = 0, px = 0, py = 0;
    const measure = () => { rect = front.getBoundingClientRect(); };
    front.addEventListener('pointerenter', measure);
    front.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      if (!rect) measure();
      px = e.clientX - rect.left; py = e.clientY - rect.top;
      if (!raf) raf = requestAnimationFrame(() => {
        raf = 0;
        cx.style.transform = 'translateX(' + px + 'px)'; cy.style.transform = 'translateY(' + py + 'px)';
        const fx = px > rect.width - 70 ? px - 62 : px + 10, fy = py > rect.height - 44 ? py - 40 : py + 10;
        tag.style.transform = 'translate(' + fx + 'px,' + fy + 'px)';
        tag.textContent = Math.round(px / rect.width * 1440) + '\n' + Math.round(py / rect.height * 900);
      });
    });
    window.addEventListener('scroll', () => { rect = null; }, { passive: true });
    window.addEventListener('resize', () => { rect = null; });
  }

  /* ---------------------------------------------------------------- 1. find: search the real names */
  function find(SC) {
    const host = $('#d-find'), ids = SC.find;
    const bar = el('div', 'find-bar');
    const spot = el('div', 'spot', GLASS + '<input type="text" inputmode="search" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Search these 12 files" aria-label="Search the sample file names"><span class="spot-n" aria-live="polite"></span>');
    const input = $('input', spot), count = $('.spot-n', spot);
    const chips = el('div', 'chips');
    const grid = el('div', 'find-grid');
    let mode = 0, q = '', touched = false;
    const tiles = ids.map((id) => { const t = el('div', 'tile', shot(id, 's', SC.shots[id].alt) + '<span class="fn"></span>'); grid.appendChild(t); return { id, t, label: $('.fn', t) }; });
    function draw() {
      const needle = q.trim().toLowerCase();
      let hits = 0;
      tiles.forEach((o) => {
        const name = mode ? SC.shots[o.id].old : SC.shots[o.id].name, at = needle ? name.toLowerCase().indexOf(needle) : -1, hit = needle && at >= 0;
        if (hit) hits++;
        o.t.classList.toggle('is-out', !!needle && !hit); o.t.classList.toggle('is-hit', !!hit);
        o.label.className = 'fn ' + (mode ? 'fn--old' : hit || !needle ? 'fn--sel' : 'fn--old');
        const show = nb(name);
        o.label.innerHTML = '<span>' + (hit ? esc(show.slice(0, at)) + '<mark>' + esc(show.slice(at, at + needle.length)) + '</mark>' + esc(show.slice(at + needle.length)) : esc(show)) + '</span>';
      });
      count.textContent = (needle ? hits + ' of ' : '') + ids.length + ' files';
    }
    const cs = SC.findWords.map((w) => { const c = btn('chip', esc(w)); c.addEventListener('click', () => { touched = true; input.value = q = w; pick(cs, c); draw(); }); chips.appendChild(c); return c; });
    input.addEventListener('input', () => { touched = true; q = input.value; pick(cs, null); draw(); });
    input.addEventListener('focus', () => { touched = true; });
    const sw = seg(['Named by Shotcaller', 'Named by macOS'], (i) => { touched = true; mode = i; draw(); }, 'Which names to search');
    bar.append(spot, chips, sw);
    host.append(bar, grid);
    draw();
    /* the first time it is seen, the page types a word itself, unless the visitor got there first */
    const demo = SC.findWords[1], ci = SC.findWords.indexOf(demo);
    const typed = (n) => { if (touched) return; input.value = q = demo.slice(0, n); if (n >= demo.length) pick(cs, cs[ci]); draw(); if (n < demo.length) setTimeout(() => typed(n + 1), 85); };
    if (STATIC) typed(demo.length); else whenSeen(spot, () => setTimeout(() => typed(1), 500));
  }

  /* ---------------------------------------------------------------- 2. how: the four steps, on a real screenshot */
  function how(SC) {
    const host = $('#d-how'), items = SC.how;
    const wrap = el('div', 'how');
    const pic = el('div', 'how-pic', '<div class="shot"></div>');
    const panel = el('div', 'steps glass');
    const heads = ['Read the text', 'Look at the picture', 'Name the file'];
    const rows = heads.map((h, i) => { const b = btn('step', '<b>' + (i + 1) + '</b><span class="sh">' + h + '</span><span class="sp"></span>'); b.addEventListener('click', () => { stop(); used('how'); go(i + 1); }); panel.appendChild(b); return b; });
    const picker = el('div', 'picker');
    let k = 0, step = 3, timer = 0;
    const picks = items.map((it, i) => { const b = btn('pick', shot(it.id, 's', '')); b.setAttribute('aria-label', 'Sample: ' + it.alt); b.addEventListener('click', () => { stop(); used('how'); load(i); play(); }); picker.appendChild(b); return b; });
    function stop() { clearInterval(timer); timer = 0; }
    function load(i) {
      k = i; const it = items[i];
      pick(picks, picks[i]);
      $('.shot', pic).innerHTML = img(it.id, '', 'A sample screenshot: ' + it.alt) + '<div class="boxes">' + it.boxes.map((b, n) => '<i style="--i:' + n + ';left:' + b[0] + '%;top:' + b[1] + '%;width:' + b[2] + '%;height:' + b[3] + '%"></i>').join('') + '</div>';
      const ps = rows.map((r) => $('.sp', r));
      ps[0].textContent = 'Apple\'s text reader found ' + it.boxes.length + ' lines of text.';
      ps[1].innerHTML = 'Apple\'s model, the one behind Apple Intelligence, said: <q>' + esc(it.sum) + '</q>';
      ps[2].innerHTML = 'The model wrote <q>' + esc(it.raw) + '</q>. Shotcaller ' + (it.cleaned ? 'cleaned it and ' : '') + 'added the date.<br>' + fn(it.name);
    }
    function go(s) {
      step = s;
      rows.forEach((r, i) => { r.classList.toggle('is-on', i + 1 === s); r.classList.toggle('is-done', i + 1 < s); r.setAttribute('aria-pressed', i + 1 === s ? 'true' : 'false'); });
      const bx = $('.boxes', pic); bx.classList.toggle('is-on', s === 1); bx.classList.toggle('is-dim', s === 2);
    }
    function play() { if (STATIC) return go(3); go(1); timer = setInterval(() => { if (step >= 3) return stop(); go(step + 1); }, 1900); }
    wrap.append(pic, panel); host.append(picker, wrap);
    load(0); go(3);
    hint(picks[1], 'Try another');
  }

  /* ---------------------------------------------------------------- 3. whole: with the picture, and with the text alone */
  function whole(SC) {
    const host = $('#d-whole'), grid = el('div', 'whole');
    const cards = SC.whole.map((it) => {
      const c = el('div', 'wcard glass');
      const names = stack([el('div', '', fn(it.see)), el('div', '', fn(it.blind))], 'wname');
      c.innerHTML = '<div class="shot">' + img(it.id, 's', 'A sample screenshot: ' + it.alt) + '<div class="veil" aria-hidden="true"><span>The text Apple\'s text reader found:</span>' + it.lines.map((l) => '<span>' + esc(l) + '</span>').join('') + '</div></div>';
      c.appendChild(names); grid.appendChild(c);
      return { c, names };
    });
    const bar = el('div', 'whole-bar');
    const sw = seg(['The model sees the picture', 'The model gets only the text'], (i) => { used('whole'); cards.forEach((o) => { o.c.classList.toggle('is-blind', i === 1); o.names.show(i); }); }, 'What the model is given');
    bar.appendChild(sw); host.append(bar, grid);
    hint($$('button', sw)[1], 'Take the picture away');
  }

  /* ---------------------------------------------------------------- 4. apps */
  function apps(SC) {
    const host = $('#d-apps'), A = SC.apps, box = el('div', 'one glass');
    const pic = el('div', 'shot', img(A.kept.id, '', 'A sample screenshot: ' + A.kept.alt) + img(A.guess.id, '', 'A sample screenshot: ' + A.guess.alt) +
      '<div class="ring" style="left:' + A.kept.box[0] + '%;top:' + A.kept.box[1] + '%;width:' + A.kept.box[2] + '%;height:' + A.kept.box[3] + '%"></div>');
    const pics = $$('img', pic), ring = $('.ring', pic);
    const pane = (raw, name, note) => el('div', 'guess', '<span class="raw">' + raw + '</span>' + fn(name) + '<p class="cap-t">' + note + '</p>');
    const st = stack([pane(A.kept.html, A.kept.name, '<span>' + esc(A.kept.word) + ' is written in the picture, so the file name keeps it.</span>')].concat(
      A.guess.tries.map((t) => pane(t.html, t.out, '<span>We put ' + esc(t.app) + ' in this name on purpose.</span> <span>The picture does not say ' + esc(t.app) + ', so Shotcaller took it out.</span>'))));
    function show(i) { pics[0].classList.toggle('is-on', i === 0); pics[1].classList.toggle('is-on', i > 0); ring.classList.toggle('is-on', i === 0); st.show(i); }
    const sw = seg(['The app\'s name is in the picture'].concat(A.guess.tries.map((t) => 'A guess: ' + t.app)), (i) => { used('apps'); show(i); }, 'Which case');
    const bar = el('div', 'bar-c'); bar.appendChild(sw);
    box.append(pic, st); host.append(bar, box);
    show(0);
    hint($$('button', sw)[1], 'Try a guess');
  }

  /* ---------------------------------------------------------------- 5. clean */
  function clean(SC) {
    const host = $('#d-clean'), chips = el('div', 'chips');
    const panes = SC.clean.map((c) => el('div', 'clean-row', '<div class="in"><span>' + c.html + '</span></div>' + ARROW + '<div class="out">' + (c.out ? fn(c.out) : '<span class="none">No name. The file keeps the one it has.</span>') + '</div>'));
    const st = stack(panes), box = el('div', 'clean glass');
    const cs = SC.clean.map((c, i) => { const b = btn('chip', esc(c.rule)); b.addEventListener('click', () => { pick(cs, b); st.show(i); used('clean'); panes[i].classList.remove('is-play'); void panes[i].offsetWidth; panes[i].classList.add('is-play'); }); chips.appendChild(b); return b; });
    pick(cs, cs[0]);
    box.appendChild(st); host.append(chips, box);
    hint(cs[1], 'Try each one');
  }

  /* ---------------------------------------------------------------- 6. seconds: real timings, played at real speed */
  function seconds(SC) {
    const host = $('#d-seconds'), S = SC.speed;
    const desk = el('div', 'desk', '<div class="watch" aria-live="off"><span>0.0</span><small>seconds</small></div>' +
      '<div class="file"><div class="shot"><img alt="" width="560" height="350"><div class="prog" hidden></div></div><span class="fn"></span></div><div class="flash" aria-hidden="true"></div>');
    const watch = $('.watch span', desk), file = $('.file', desk), pic = $('.file img', desk), label = $('.file .fn', desk), prog = $('.prog', desk), flash = $('.flash', desk);
    const note = el('p', 'cap-t sec-note'), go = btn('btn btn--main go', '');
    const names = ['Time a sample screenshot', 'Time a file still copying', 'Time the first start'];
    let mode = 0, k = 0, raf = 0, busy = false, timers = [];
    const later = (f, ms) => timers.push(setTimeout(f, ms));
    const cur = () => mode === 0 ? S.shots[k % S.shots.length] : mode === 1 ? S.pieces : S.cold;
    const notes = () => {
      const c = cur();
      if (mode === 0) return '<span>Shotcaller renamed this screenshot ' + secs(c.secs) + ' seconds after it landed in the folder.</span>';
      if (mode === 1) return '<span>This file took ' + secs(c.arriving) + ' seconds to arrive.</span> <span>Shotcaller waited for the whole file, then renamed it ' + secs(c.secs - c.arriving) + ' seconds later.</span>';
      return '<span>On its first start, Shotcaller spent ' + Math.round(c.ready) + ' seconds getting Apple\'s text reader and model ready.</span> <span>It does that before you take a screenshot, so the first screenshot still took only ' + secs(c.secs) + ' seconds.</span>';
    };
    function end() {
      const c = cur();
      cancelAnimationFrame(raf); timers.forEach(clearTimeout); timers = [];
      pic.src = 'assets/shots/' + c.id + '-s.webp?v=' + V; pic.alt = 'A sample screenshot: ' + c.alt;
      file.classList.remove('is-gone'); prog.hidden = true;
      label.className = 'fn fn--sel'; label.textContent = nb(c.name);
      watch.textContent = secs(c.secs);
      note.innerHTML = notes(); go.textContent = names[mode]; go.disabled = false; busy = false;
    }
    function count(to, ms, done) {
      const t0 = performance.now();
      const tick = (t) => { const p = Math.min(1, (t - t0) / ms); watch.textContent = secs(to * p); if (p < 1) raf = requestAnimationFrame(tick); else done(); };
      raf = requestAnimationFrame(tick);
    }
    function run() {
      if (busy) return;
      used('seconds');
      if (mode === 0) k++;
      const c = cur();
      if (STATIC) return end();
      busy = true; go.disabled = true;
      file.classList.add('is-gone'); watch.textContent = '0.0';
      const land = () => {
        pic.src = 'assets/shots/' + c.id + '-s.webp?v=' + V;
        void flash.offsetWidth; flash.classList.remove('is-go'); void flash.offsetWidth; flash.classList.add('is-go');
        file.classList.remove('is-gone'); label.className = 'fn'; label.textContent = nb(c.old);
        if (mode === 1) { prog.hidden = false; prog.animate([{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }], { duration: c.arriving * 1000, fill: 'forwards' }).onfinish = () => { prog.hidden = true; }; note.innerHTML = '<span>The file is still arriving.</span>'; }
        else note.innerHTML = '<span>Shotcaller is reading the screenshot.</span>';
        count(c.secs, c.secs * 1000, end);
      };
      if (mode === 2) { note.innerHTML = '<span>Shotcaller is getting Apple\'s text reader and model ready.</span> <span>This counter runs faster than the real wait.</span>'; count(c.ready, 1800, () => later(land, 500)); }
      else later(land, 250);
    }
    go.addEventListener('click', run);
    const sw = seg(['A new screenshot', 'A file still copying', 'The first start'], (i) => { mode = i; end(); }, 'What to time');
    const bar = el('div', 'sec-bar'); bar.appendChild(sw);
    host.append(bar, desk, go, note);
    end();
  }

  /* ---------------------------------------------------------------- 7. recordings */
  function recordings(SC) {
    const host = $('#d-recordings'), R = SC.rec;
    const player = el('div', 'player glass', '<div class="shot"><span class="rec-dot"></span></div><div class="track"><div class="track-bar"><i></i></div><div class="pin"><span>Shotcaller reads this frame</span></div><input type="range" min="0" step="0.1" aria-label="Move through the recording"></div>');
    const pic = $('.shot', player), clock = $('.rec-dot', player), fill = $('.track-bar i', player), pin = $('.pin', player), range = $('input', player);
    const names = stack(R.map((r) => el('div', '', fn(r.old, 'fn--old') + '<br>' + fn(r.name))), 'rec-name');
    let r = R[0], frames = [];
    const mmss = (t) => Math.floor(t / 60) + ':' + ('0' + (t % 60).toFixed(1)).slice(-4);
    function at(t) {
      fill.style.transform = 'scaleX(' + (t / r.dur) + ')';
      clock.textContent = mmss(t) + ' of ' + mmss(r.dur);
      let n = r.segs.findIndex((s) => t < s.to); if (n < 0) n = r.segs.length - 1;
      frames.forEach((f, i) => f.classList.toggle('is-on', i === n));
    }
    function load(i) {
      r = R[i]; names.show(i);
      $$('img', pic).forEach((n) => n.remove());
      frames = r.segs.map((s) => { const d = el('div', '', img(s.id, '', 'A frame of the sample recording: ' + s.alt)).firstChild; pic.appendChild(d); return d; });
      range.max = r.dur; range.value = r.at;
      const p = r.at / r.dur * 100; pin.style.left = p + '%'; pin.classList.toggle('is-left', p < 22); pin.classList.toggle('is-right', p > 78);
      at(r.at);
    }
    range.addEventListener('input', () => { used('recordings'); at(+range.value); });
    const sw = seg(R.map((x) => x.label), load, 'Which recording');
    const bar = el('div', 'rec-bar'); bar.appendChild(sw);
    player.appendChild(names); host.append(bar, player);
    load(0);
  }

  /* ---------------------------------------------------------------- 8. alone */
  function alone(SC) {
    const host = $('#d-alone'), A = SC.alone, grid = el('div', 'alone');
    grid.append(
      el('div', 'lcard glass', shot(A.photo.id, '', 'A sample picture with no words in it: ' + A.photo.alt) + fn(A.photo.name) +
        '<p class="cap-t"><span>This picture has no words in it.</span> <span>On macOS 27, Apple\'s model named it from the picture alone.</span></p>' +
        '<div class="loglines">' + A.photo.lines.map((l) => '<p class="logline">' + l + '</p>').join('') + '</div>'),
      el('div', 'lcard glass', shot(A.blank.id, '', 'A blank sample picture') + fn(A.blank.old, 'fn--old') +
        '<p class="cap-t"><span>This picture is blank.</span> <span>It still has the name macOS gave it.</span></p>' +
        '<div class="loglines">' + A.blank.lines.map((l) => '<p class="logline">' + l + '</p>').join('') + '</div>'));
    host.appendChild(grid);
  }

  /* ---------------------------------------------------------------- 9. safe: a folder Shotcaller really worked through */
  function safe(SC) {
    const host = $('#d-safe'), F = SC.safe, chips = el('div', 'chips');
    const win = el('div', 'finder glass', '<div class="fbar"><span class="lights" aria-hidden="true"><i></i><i></i><i></i></span><span>Desktop</span></div><div class="frow fhead"><span>Name</span><span>What Shotcaller did</span></div>');
    const lang = el('div', 'frow is-lang');
    function setLang(l) { lang.innerHTML = '<span class="nm">' + ic(l.id) + '<span><span class="old">' + esc(nb(l.old)) + '</span>' + fn(l.name) + '</span></span><span class="did">Renamed. A Mac set to ' + esc(l.lang) + ' gives a new screenshot a name that starts this way.</span>'; }
    const cs = F.langs.map((l) => { const c = btn('chip', esc(l.lang)); c.addEventListener('click', () => { pick(cs, c); setLang(l); used('safe'); }); chips.appendChild(c); return c; });
    pick(cs, cs[0]); setLang(F.langs[0]);
    win.appendChild(lang);
    F.rows.forEach((r) => win.appendChild(el('div', 'frow', '<span class="nm">' + ic(r.id) + '<span>' + esc(nb(r.name)) + '</span></span><span class="did">' + esc(r.did) + '</span>')));
    win.appendChild(el('div', 'ffoot', esc(F.foot)));
    host.append(chips, win);
    hint(cs[1], 'Pick a language');
  }

  /* ---------------------------------------------------------------- 10. settings: the real config.json, and what each key did */
  function settings(SC) {
    const host = $('#d-settings'), keys = SC.settings.keys, wrap = el('div', 'sett');
    const json = el('div', 'json glass', '<div class="fbar"><span class="lights" aria-hidden="true"><i></i><i></i><i></i></span><span>config.json</span><span class="tip hint-in" aria-hidden="true">Click a value to change it</span></div><div class="brace">{</div>');
    const fx = el('div', 'fxp glass'), panes = [], index = {};
    const pane = (p) => { const d = el('div', 'fx-pane', '<h3>' + esc(p.h) + '</h3>' + (p.p ? '<p>' + esc(p.p) + '</p>' : '') +
      (p.pairs || []).map((x) => '<div class="pair">' + ic(x.id) + '<span><span class="old">' + esc(nb(x.old)) + '</span>' + (x.name ? fn(x.name) : '<span class="same">Left alone</span>') + '</span></div>').join('') +
      (p.log || []).map((l) => '<p class="logline">' + l + '</p>').join('')); panes.push(d); return panes.length - 1; };
    const state = {}; let on = null;
    const rows = keys.map((k) => {
      index[k.key] = k.states.map(pane); state[k.key] = 0;
      const b = btn('jrow', (k.plain ? '<span class="k k--plain">' + esc(k.key) + '</span>' : '<span class="k">"' + esc(k.key) + '"</span>:') + '<span class="v"></span>');
      b.addEventListener('click', () => { $$('.hint-in', json).forEach((h) => h.classList.add('is-gone')); const flip = on === k ? (state[k.key] + 1) % k.states.length : k.states.length > 1 ? 1 : 0; sel(k, flip); });
      json.appendChild(b); return b;
    });
    json.appendChild(el('div', 'brace', '}'));
    json.appendChild(el('div', 'ffoot', esc(SC.settings.path)));
    const st = stack(panes); fx.appendChild(st);
    function sel(k, s) {
      keys.forEach((x, i) => { state[x.key] = x === k ? s : 0; const v = $('.v', rows[i]), cur = x.states[state[x.key]]; v.textContent = cur.v; v.classList.toggle('is-off', !!cur.off); v.classList.toggle('is-bad', !!cur.bad); rows[i].classList.toggle('is-on', x === k); rows[i].setAttribute('aria-pressed', x === k ? 'true' : 'false'); });
      on = k; st.show(index[k.key][s]);
    }
    wrap.append(json, fx); host.appendChild(wrap);
    sel(keys[1], 0);
  }

  /* ---------------------------------------------------------------- 11. text: how each line scored */
  function text(SC) {
    const host = $('#d-text'), T = SC.text, chips = el('div', 'chips');
    const box = el('div', 'txt glass', '<div class="shot">' + img(T.id, '', 'A sample screenshot: ' + T.alt) + '</div><div class="txt-out">' + fn(T.old, 'fn--old') + fn(T.name) + '</div>');
    const pic = $('.shot', box);
    const bs = T.rows.map((r) => { const b = el('div', 'tb' + (r.y < 9 ? ' is-flip' : '') + (r.x > 60 ? ' is-end' : ''), '<em></em>'); b.style.cssText = 'left:' + r.x + '%;top:' + r.y + '%;width:' + r.w + '%;height:' + r.h + '%'; pic.appendChild(b); return b; });
    function show(i) {
      const rule = T.rules[i];
      bs.forEach((b, n) => { const tag = T.rows[n].tags[rule.key]; b.className = b.className.replace(/ ?(is-hit|k-\w+)/g, ''); if (tag) { b.classList.add('is-hit', 'k-' + tag[0]); $('em', b).textContent = tag[1]; } });
    }
    const cs = T.rules.map((r, i) => { const c = btn('chip', esc(r.label)); c.addEventListener('click', () => { pick(cs, c); show(i); used('text'); }); chips.appendChild(c); return c; });
    pick(cs, cs[0]);
    host.append(chips, box);
    show(0);
    hint(cs[1], 'See each rule');
  }

  /* ---------------------------------------------------------------- 12. privacy: search the real source */
  function privacy(SC) {
    const host = $('#d-privacy'), P = SC.privacy;
    const box = el('div', 'src glass', '<div class="src-top">' + GLASS + '<input type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Search the code" aria-label="Search Shotcaller\'s code"></div><p class="src-count" aria-live="polite"></p><div class="src-list" tabindex="0"></div>' +
      '<div class="src-foot"><span>Shotcaller keeps a list of each rename on your Mac. Other users of the Mac cannot open the list.</span></div>');
    const input = $('input', box), count = $('.src-count', box), list = $('.src-list', box), chips = el('div', 'chips priv-chips');
    let files = null, want = P.words[0];
    function draw() {
      const q = want.trim();
      if (!files) { count.textContent = 'Loading the code.'; return; }
      if (!q) { count.innerHTML = '<b>' + P.total.toLocaleString('en-US') + '</b> <span>lines of code in ' + files.length + ' files. That is the whole app.</span>'; list.innerHTML = ''; return; }
      const needle = q.toLowerCase(), out = []; let n = 0;
      files.forEach((f) => f.lines.forEach((line, i) => { const at = line.toLowerCase().indexOf(needle); if (at < 0) return; n++; if (out.length < 200) out.push('<div><span>' + esc(f.name) + ':' + (i + 1) + '</span><span>' + esc(line.slice(0, at)) + '<mark>' + esc(line.slice(at, at + q.length)) + '</mark>' + esc(line.slice(at + q.length)) + '</span></div>'); }));
      count.innerHTML = '<b>' + n + '</b> <span>' + (n === 1 ? 'line has' : 'lines have') + ' “' + esc(q) + '”, out of ' + P.total.toLocaleString('en-US') + '.</span>';
      list.innerHTML = n ? out.join('') : '<div class="src-zero"><b>0</b><span>No line of the code has “' + esc(q) + '” in it.</span></div>';
      list.scrollTop = 0;
    }
    const cs = P.words.map((w) => { const c = btn('chip', esc(w)); c.addEventListener('click', () => { input.value = want = w; pick(cs, c); used('privacy'); draw(); }); chips.appendChild(c); return c; });
    input.addEventListener('input', () => { want = input.value; pick(cs, null); used('privacy'); draw(); });
    input.value = want; pick(cs, cs[0]);
    host.append(chips, box); draw();
    hint(cs[1], 'Try a word');
    const s = doc.createElement('script'); s.src = 'assets/src.js?v=' + V; s.onload = () => { files = window.SCSRC.map((f) => ({ name: f.name, lines: f.text.split('\n') })); draw(); }; doc.head.appendChild(s);
  }

  /* ---------------------------------------------------------------- 13. install: which Mac gets what */
  function mac(SC) {
    const host = $('#d-mac'), M = SC.mac, box = el('div', 'mac glass', '<h3>Which Mac do you have?</h3><p class="cap-t"><span>Open the Apple menu and pick About This Mac.</span> <span>A chip that starts with Apple is Apple silicon.</span></p>');
    const st = stack(M.map((m) => el('div', 'mac-pane', '<p>' + esc(m.how) + '</p>' + fn(m.title))), 'mac-out');
    box.append(seg(M.map((m) => m.label), (i) => st.show(i), 'Which Mac'), st);
    host.appendChild(box);
  }
  function copyButtons() {
    $$('.copy').forEach((b) => b.addEventListener('click', () => {
      const text = $('#' + b.dataset.copy).textContent;
      const done = () => { b.textContent = 'Copied'; b.classList.add('is-done'); setTimeout(() => { b.textContent = 'Copy'; b.classList.remove('is-done'); }, 1600); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, done); else done();
    }));
  }

  /* ---------------------------------------------------------------- page */
  function page() {
    root.classList.add('is-booted');
    const secsAll = $$('.sec');
    if (STATIC || !('IntersectionObserver' in window)) secsAll.forEach((s) => s.classList.add('is-shown'));
    else { const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-shown'); io.unobserve(e.target); } }), { threshold: .08 }); secsAll.forEach((s) => io.observe(s)); }
    /* the bar at the top takes the light of the section under it */
    const nav = $('#nav');
    if ('IntersectionObserver' in window) { const io2 = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) nav.classList.toggle('is-day', e.target.classList.contains('sec--day')); }), { rootMargin: '-30px 0px -96% 0px' }); secsAll.forEach((s) => io2.observe(s)); }
    /* a soft light follows the pointer in the night sections */
    if (!STATIC && matchMedia('(hover: hover)').matches) $$('.sec--night').forEach((s) => {
      const t = el('div', 'torch'); t.setAttribute('aria-hidden', 'true'); s.appendChild(t);
      let raf = 0, x = 0, y = 0, top = 0;
      s.addEventListener('pointerenter', () => { top = s.getBoundingClientRect().top + window.scrollY; });
      s.addEventListener('pointermove', (e) => { x = e.clientX; y = e.pageY - top; if (!raf) raf = requestAnimationFrame(() => { raf = 0; t.style.transform = 'translate(' + x + 'px,' + y + 'px)'; }); });
    });
  }
  function demos() {
    const SC = window.SC;
    [find, how, whole, apps, clean, seconds, recordings, alone, safe, settings, text, privacy, mac].forEach((f) => { try { f(SC); } catch (e) { console.error(f.name, e); } });
  }
  function boot() {
    hero(); copyButtons(); page();
    const s = doc.createElement('script'); s.src = 'assets/data.js?v=' + V; s.onload = demos; doc.head.appendChild(s);
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot); else boot();
})();
