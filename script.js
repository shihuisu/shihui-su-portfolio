(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Small luminous cursor: a clear blue point with a restrained laser-like trail.
  const finePointer = matchMedia('(hover:hover) and (pointer:fine)').matches;
  if (finePointer && !reduced) {
    document.documentElement.classList.add('cursor-ready');
    const cursor = document.createElement('div');
    cursor.className = 'site-cursor';
    cursor.setAttribute('aria-hidden', 'true');
    cursor.innerHTML = '<span class="site-cursor-streak"></span><span class="site-cursor-halo"></span><span class="site-cursor-dot"></span>';
    document.body.appendChild(cursor);

    let lastX = innerWidth / 2;
    let lastY = innerHeight / 2;
    let targetX = lastX;
    let targetY = lastY;
    let raf = 0;
    const renderCursor = () => {
      const dx = targetX - lastX;
      const dy = targetY - lastY;
      const speed = Math.min(34, Math.hypot(dx, dy) * 1.9);
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;
      lastX += dx * .58;
      lastY += dy * .58;
      cursor.style.setProperty('--cx', `${lastX}px`);
      cursor.style.setProperty('--cy', `${lastY}px`);
      cursor.style.setProperty('--rot', `${angle}deg`);
      cursor.style.setProperty('--trail', `${Math.max(8, speed)}px`);
      cursor.style.setProperty('--trail-opacity', `${Math.min(.82, .22 + speed / 48)}`);
      if (Math.abs(dx) > .12 || Math.abs(dy) > .12) raf = requestAnimationFrame(renderCursor);
      else raf = 0;
    };
    const updateCursorContrast = target => {
      // The site deliberately alternates between near-black and paper-white sections.
      // Switch to a dark two-tone cursor whenever the pointer enters a light surface.
      const onLight = Boolean(target && target.closest && target.closest('.light'));
      cursor.classList.toggle('is-on-light', onLight);
    };
    const moveCursor = event => {
      targetX = event.clientX;
      targetY = event.clientY;
      cursor.classList.add('is-visible');
      updateCursorContrast(event.target);
      if (!raf) raf = requestAnimationFrame(renderCursor);
    };
    addEventListener('pointermove', moveCursor, { passive:true });
    addEventListener('pointerdown', () => cursor.classList.add('is-clicking'));
    addEventListener('pointerup', () => cursor.classList.remove('is-clicking'));
    addEventListener('pointerleave', () => cursor.classList.remove('is-visible'));
    addEventListener('pointerenter', () => cursor.classList.add('is-visible'));

    const interactive = 'a,button,[role="button"],.visual-card,.character-card';
    document.addEventListener('pointerover', event => {
      cursor.classList.toggle('is-active', Boolean(event.target.closest(interactive)));
      cursor.classList.toggle('is-hidden', Boolean(event.target.closest('video,input,textarea,select')));
      updateCursorContrast(event.target);
    });
  }
  const body = document.body;
  const intro = document.querySelector('#intro-gate');
  const hero = document.querySelector('.hero');
  const heroTitle = document.querySelector('.hero-title');

  // Build individually responsive title letters.
  document.querySelectorAll('[data-kinetic]').forEach(line => {
    const text = line.dataset.kinetic || '';
    line.innerHTML = [...text].map((char, index) => `<i data-letter="${index}" style="--letter:${index}">${char === ' ' ? '&nbsp;' : char}</i>`).join('');
  });

  // Silent, text-free opening aperture. Pointer glow and feather tilt provide the cue.
  if (intro && !reduced) {
    const moveIntro = event => {
      const x = event.clientX;
      const y = event.clientY;
      intro.style.setProperty('--gx', `${x}px`);
      intro.style.setProperty('--gy', `${y}px`);
      intro.style.setProperty('--intro-r', `${-7 + ((x / innerWidth) - .5) * 7}deg`);
    };
    intro.addEventListener('pointermove', moveIntro);
    const enter = () => {
      if (body.classList.contains('intro-opening')) return;
      body.classList.add('intro-opening');
      setTimeout(() => {
        body.classList.remove('intro-locked');
        body.classList.add('intro-done');
      }, 980);
    };
    intro.addEventListener('click', enter);
    intro.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); enter(); }
    });
  } else {
    body.classList.remove('intro-locked');
    body.classList.add('intro-done');
  }

  // Page progress and reveal motion.
  const updateProgress = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    const progress = max > 0 ? (scrollY / max) * 100 : 0;
    document.documentElement.style.setProperty('--scroll-progress', `${progress}%`);
  };
  addEventListener('scroll', updateProgress, { passive: true });
  addEventListener('resize', updateProgress);
  updateProgress();

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: .13, rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('.reveal,.reveal-stagger').forEach(el => revealObserver.observe(el));
  } else {
    document.querySelectorAll('.reveal,.reveal-stagger').forEach(el => el.classList.add('in'));
  }

  // Hero image and lettering react gently to pointer position.
  if (hero) {
    hero.addEventListener('pointermove', event => {
      const rect = hero.getBoundingClientRect();
      const nx = (event.clientX - rect.left) / rect.width - .5;
      const ny = (event.clientY - rect.top) / rect.height - .5;
      hero.style.setProperty('--mx', nx.toFixed(3));
      hero.style.setProperty('--my', ny.toFixed(3));
    });
    hero.addEventListener('pointerleave', () => {
      hero.style.setProperty('--mx', 0);
      hero.style.setProperty('--my', 0);
    });
  }

  if (heroTitle) {
    const letters = [...heroTitle.querySelectorAll('i')];
    heroTitle.addEventListener('pointermove', event => {
      letters.forEach(letter => {
        const rect = letter.getBoundingClientRect();
        const dx = event.clientX - (rect.left + rect.width / 2);
        const dy = event.clientY - (rect.top + rect.height / 2);
        const distance = Math.hypot(dx, dy);
        const strength = Math.max(0, 1 - distance / 150);
        const tx = dx * -.065 * strength;
        const ty = dy * -.08 * strength;
        letter.style.transform = `translate(${tx}px,${ty}px) rotate(${tx * .05}deg)`;
      });
    });
    heroTitle.addEventListener('pointerleave', () => letters.forEach(letter => {
      letter.style.transform = '';
    }));
  }

  // The final film now lives in its own section. The navigation link uses normal smooth scrolling.

  // Reusable drag-and-wheel horizontal rail behaviour.
  const makeRail = (rail, update) => {
    if (!rail) return;
    let dragging = false;
    let startX = 0;
    let startScroll = 0;
    rail.addEventListener('pointerdown', event => {
      dragging = true;
      startX = event.clientX;
      startScroll = rail.scrollLeft;
      rail.classList.add('dragging');
      rail.setPointerCapture(event.pointerId);
    });
    rail.addEventListener('pointermove', event => {
      if (dragging) rail.scrollLeft = startScroll - (event.clientX - startX);
    });
    const stop = () => { dragging = false; rail.classList.remove('dragging'); };
    rail.addEventListener('pointerup', stop);
    rail.addEventListener('pointercancel', stop);
    rail.addEventListener('wheel', event => {
      if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
        event.preventDefault();
        rail.scrollBy({ left: event.deltaY * 1.15, behavior: 'smooth' });
      }
    }, { passive: false });
    rail.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
    [...rail.children].forEach(card => card.addEventListener('click', () => card.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', inline: 'center', block: 'nearest' })));
    addEventListener('resize', update);
    update();
  };

  // Character cards lift and align to a shared centre line.
  const characterRail = document.querySelector('#character-rail');
  const updateCharacters = () => {
    if (!characterRail) return;
    const centre = characterRail.scrollLeft + characterRail.clientWidth / 2;
    [...characterRail.children].forEach(card => {
      const cardCentre = card.offsetLeft + card.offsetWidth / 2;
      const distance = (cardCentre - centre) / characterRail.clientWidth;
      const abs = Math.min(1.15, Math.abs(distance));
      card.style.setProperty('--card-scale', (1 - abs * .12).toFixed(3));
      card.style.setProperty('--card-opacity', (1 - abs * .52).toFixed(3));
      card.style.setProperty('--card-y', `${abs * 28}px`);
      card.style.setProperty('--card-ry', `${distance * -7}deg`);
      card.style.setProperty('--card-sat', (1 - abs * .32).toFixed(3));
    });
  };
  makeRail(characterRail, updateCharacters);

  // Horizontal visual filmstrip: no orbit and no automatic looping.
  const visualStrip = document.querySelector('#visual-strip');
  const updateVisuals = () => {
    if (!visualStrip) return;
    const centre = visualStrip.scrollLeft + visualStrip.clientWidth / 2;
    let closest = null;
    let closestDistance = Infinity;
    [...visualStrip.children].forEach(card => {
      const cardCentre = card.offsetLeft + card.offsetWidth / 2;
      const distance = Math.abs(cardCentre - centre);
      if (distance < closestDistance) { closestDistance = distance; closest = card; }
      const normal = Math.min(1, distance / visualStrip.clientWidth);
      card.style.setProperty('--visual-scale', (1 - normal * .12).toFixed(3));
      card.style.setProperty('--visual-opacity', (1 - normal * .55).toFixed(3));
    });
    [...visualStrip.children].forEach(card => card.classList.toggle('active', card === closest));
  };
  makeRail(visualStrip, updateVisuals);

  // Click-controlled eight-stage workflow.
  const processData = [
    { n:'01', l:'STORY DIRECTION', t:'Script interpretation', b:'I defined the film as a crime-suspense opening rather than a complete investigation. The crow, the trace and the final hand mark were established as recurring signals before any image was generated.', o:'OUTPUT · LOGLINE, SCRIPT LOGIC, MOTIF SYSTEM' },
    { n:'02', l:'NARRATIVE PLANNING', t:'Shot breakdown', b:'The script became a 17-shot plan covering the landfill opening, news report, police-office call, witness interview, forensic clue and suspect reveal. Every generated image therefore had a clear story function.', o:'OUTPUT · 17-SHOT LIST WITH ACTION, LOCATION AND DIALOGUE' },
    { n:'03', l:'REFERENCE SYSTEM', t:'Character development', b:'Front, side and back views defined faces, clothing and silhouettes for Captain Su, Xiao Chen, the suspect, the witness and the victim. The sheets reduced drift when camera angles and locations changed.', o:'OUTPUT · FIVE CHARACTER REFERENCE SHEETS' },
    { n:'04', l:'WORLD BUILDING', t:'Visual direction', b:'A shared cold-blue language connected the landfill, office, forensic room and news broadcast. Rain, wet reflections and restrained police light helped independently generated locations feel like one film.', o:'OUTPUT · ENVIRONMENT, LIGHTING AND MOOD DIRECTION' },
    { n:'05', l:'IMAGE SELECTION', t:'AI still generation', b:'Key compositions were tested as still images before motion. I selected material for readable staging, costume continuity, atmosphere and whether the frame could support the next edit.', o:'OUTPUT · SELECTED PRODUCTION STILLS IN JIMENG AI' },
    { n:'06', l:'CONTROLLED MOTION', t:'Image-to-video', b:'Selected stills anchored short movement clips. When a long action introduced unstable faces, bodies or camera motion, I reduced the clip to one visual task and created continuity through cuts.', o:'OUTPUT · SHORT, CONTROLLED MOTION CLIPS' },
    { n:'07', l:'EDITORIAL REPAIR', t:'Iteration and problem solving', b:'Prompts were simplified, difficult compositions were divided and unusable outputs were rejected. Movement and the crow mark changed the final shot design rather than being hidden as technical mistakes.', o:'OUTPUT · REVISED PROMPTS AND EDITORIAL ALTERNATIVES' },
    { n:'08', l:'FINAL ASSEMBLY', t:'Edit and delivery', b:'The selected clips were assembled in CapCut. Timing, sound, motion treatment, subtitles, the title card and black-screen ending turned separate AI outputs into a complete 90-second suspense sequence.', o:'OUTPUT · REVISED FINAL MP4' }
  ];
  const processRoot = document.querySelector('#process-clicker');
  const panel = processRoot?.querySelector('.process-panel');
  const tabs = processRoot ? [...processRoot.querySelectorAll('.process-tabs button')] : [];
  const pNum = panel?.querySelector('.process-number');
  const pLabel = panel?.querySelector('.process-label');
  const pTitle = panel?.querySelector('.process-title');
  const pBody = panel?.querySelector('.process-body');
  const pOutput = panel?.querySelector('.process-output');
  let activeProcess = 0;
  const setProcess = index => {
    if (!panel || index === activeProcess && pTitle?.textContent) return;
    activeProcess = index;
    panel.classList.add('changing');
    tabs.forEach((tab, i) => {
      const active = i === index;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
    });
    setTimeout(() => {
      const d = processData[index];
      if (pNum) pNum.textContent = d.n;
      if (pLabel) pLabel.textContent = d.l;
      if (pTitle) pTitle.textContent = d.t;
      if (pBody) pBody.textContent = d.b;
      if (pOutput) pOutput.textContent = d.o;
      panel.classList.remove('changing');
    }, reduced ? 0 : 260);
  };
  tabs.forEach(tab => tab.addEventListener('click', () => setProcess(Number(tab.dataset.stage))));
  tabs.forEach((tab, index) => tab.addEventListener('keydown', event => {
    if (!['ArrowLeft','ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const next = (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    tabs[next].focus();
    setProcess(next);
  }));
  activeProcess = -1;
  setProcess(0);
})();
