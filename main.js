import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { socials, skills, projects, ticker } from './data.js';

/* =========================================================
   1. BUILD PAGE CONTENT FROM data.js
   ========================================================= */
const $ = (s) => document.querySelector(s);

$('#year').textContent = new Date().getFullYear();

$('#ticker').innerHTML = [...ticker, ...ticker]
  .map((t) => `<span>${t}</span>`)
  .join('');

$('#skillGrid').innerHTML = skills
  .map((g, i) => {
    const body = g.items
      ? `<div class="skill-icons">${g.items
          .map((s) => `<div class="skill"><img loading="lazy" src="https://skillicons.dev/icons?i=${s.icon}" alt="${s.name}" /><span>${s.name}</span></div>`)
          .join('')}</div>`
      : `<div class="chips">${g.chips.map((c) => `<span class="chip">${c}</span>`).join('')}</div>`;
    return `<div class="glass skill-card tilt reveal" style="--d:${(i % 3) * 0.1}s"><h3>${g.title}</h3>${body}</div>`;
  })
  .join('');

$('#projectGrid').innerHTML = projects
  .map(
    (p, i) => `
    <a class="glass project tilt reveal" style="--d:${(i % 3) * 0.1}s" href="${p.url}" target="_blank" rel="noopener">
      <span class="num">${String(i + 1).padStart(2, '0')}</span>
      <h3>${p.title}</h3>
      <p>${p.desc}</p>
      <div class="tags">${p.tags.map((t) => `<span>${t}</span>`).join('')}</div>
      <span class="go">View project <span>→</span></span>
    </a>`
  )
  .join('');

$('#socialRow').innerHTML = socials
  .map((s) => `<a href="${s.href}" target="_blank" rel="noopener">${s.label}</a>`)
  .join('');

/* =========================================================
   2. UI: typing, reveal, counters, tilt, cursor
   ========================================================= */
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(pointer: fine)').matches;

// typewriter
const roles = ['Developer', 'AI Agent Builder', 'Multi-Agent Systems Engineer', 'Algo-Trading Tinkerer', 'Full-Stack Creator'];
const typed = $('#typed');
let ri = 0, ci = 0, deleting = false;
(function type() {
  const word = roles[ri];
  typed.textContent = word.slice(0, ci);
  let delay = deleting ? 35 : 80;
  if (!deleting && ci === word.length) { deleting = true; delay = 1400; }
  else if (deleting && ci === 0) { deleting = false; ri = (ri + 1) % roles.length; delay = 300; }
  else ci += deleting ? -1 : 1;
  setTimeout(type, delay);
})();

// reveal on scroll + count-up
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      const num = e.target.querySelector('[data-count]');
      if (num) countUp(num);
      io.unobserve(e.target);
    });
  },
  { threshold: 0.15 }
);
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

function countUp(el) {
  const target = +el.dataset.count;
  const suffix = el.dataset.suffix || '';
  const start = performance.now();
  const dur = 1400;
  (function step(now) {
    const k = Math.min((now - start) / dur, 1);
    el.textContent = Math.round(target * (1 - Math.pow(1 - k, 3))) + suffix;
    if (k < 1) requestAnimationFrame(step);
  })(start);
}

// 3D tilt + glare
if (finePointer && !reduce) {
  document.querySelectorAll('.tilt').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      card.style.setProperty('--mx', `${x * 100}%`);
      card.style.setProperty('--my', `${y * 100}%`);
      card.style.transform = `perspective(900px) rotateX(${(0.5 - y) * 12}deg) rotateY(${(x - 0.5) * 14}deg) scale3d(1.02,1.02,1.02)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });
}

// custom cursor
const dot = $('#cursorDot');
const ring = $('#cursorRing');
const cur = { x: innerWidth / 2, y: innerHeight / 2, rx: innerWidth / 2, ry: innerHeight / 2 };
if (finePointer) {
  addEventListener('pointermove', (e) => { cur.x = e.clientX; cur.y = e.clientY; });
  document.querySelectorAll('a, button, .tilt').forEach((el) => {
    el.addEventListener('pointerenter', () => ring.classList.add('hover'));
    el.addEventListener('pointerleave', () => ring.classList.remove('hover'));
  });
}

/* =========================================================
   3. THREE.JS SCENE
   ========================================================= */
const isMobile = matchMedia('(max-width: 800px)').matches;
const speed = reduce ? 0.2 : 1;

const canvas = $('#bg');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x05070d, 0.03);

const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 0, 8);

// reflections for the metallic look
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

// lights
scene.add(new THREE.AmbientLight(0xffffff, 0.35));
const lightA = new THREE.PointLight(0x00e5ff, 220, 25);
const lightB = new THREE.PointLight(0x8b5cf6, 220, 25);
const lightC = new THREE.PointLight(0xffc857, 90, 20);
scene.add(lightA, lightB, lightC);

// ---- hero object ----
const hero = new THREE.Group();
scene.add(hero);

const knot = new THREE.Mesh(
  new THREE.TorusKnotGeometry(1.1, 0.34, 240, 40, 2, 3),
  new THREE.MeshPhysicalMaterial({
    color: 0x1c2b45, metalness: 1, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.1,
    envMapIntensity: 1.1, emissive: 0x041a2a, emissiveIntensity: 0.6,
  })
);
hero.add(knot);

const wire = new THREE.Mesh(
  new THREE.TorusKnotGeometry(1.16, 0.37, 140, 18, 2, 3),
  new THREE.MeshBasicMaterial({ color: 0x00e5ff, wireframe: true, transparent: true, opacity: 0.22 })
);
hero.add(wire);

const core = new THREE.Mesh(
  new THREE.IcosahedronGeometry(0.42, 1),
  new THREE.MeshStandardMaterial({ color: 0x8b5cf6, emissive: 0x8b5cf6, emissiveIntensity: 1.6, wireframe: true })
);
hero.add(core);

// orbit rings with satellites (gold = the XAUUSD nod)
function makeOrbit(radius, color, tiltX, tiltZ, satSize) {
  const pivot = new THREE.Group();
  pivot.rotation.set(tiltX, 0, tiltZ);
  const ringMesh = new THREE.Mesh(
    new THREE.TorusGeometry(radius, 0.012, 12, 220),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.65 })
  );
  ringMesh.rotation.x = Math.PI / 2;
  const sat = new THREE.Mesh(
    new THREE.SphereGeometry(satSize, 32, 32),
    new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.2, metalness: 0.8, roughness: 0.2 })
  );
  const spin = new THREE.Group();
  sat.position.x = radius;
  spin.add(sat);
  pivot.add(ringMesh, spin);
  hero.add(pivot);
  return { pivot, spin };
}
const orbits = [
  makeOrbit(2.3, 0xffc857, 0.5, 0.2, 0.09),
  makeOrbit(2.9, 0x00e5ff, -0.8, 0.5, 0.07),
  makeOrbit(3.4, 0x8b5cf6, 1.1, -0.4, 0.06),
];

// ---- particle field ----
const PCOUNT = isMobile ? 1200 : 3000;
const pos = new Float32Array(PCOUNT * 3);
const col = new Float32Array(PCOUNT * 3);
const cA = new THREE.Color(0x00e5ff);
const cB = new THREE.Color(0x8b5cf6);
const cC = new THREE.Color(0xffffff);
for (let i = 0; i < PCOUNT; i++) {
  const r = 6 + Math.random() * 22;
  const th = Math.random() * Math.PI * 2;
  const ph = Math.acos(2 * Math.random() - 1);
  pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
  pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
  pos[i * 3 + 2] = r * Math.cos(ph);
  const c = Math.random() < 0.15 ? cC : Math.random() < 0.5 ? cA : cB;
  col.set([c.r, c.g, c.b], i * 3);
}
const pGeo = new THREE.BufferGeometry();
pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
pGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
const particles = new THREE.Points(
  pGeo,
  new THREE.PointsMaterial({ size: 0.045, vertexColors: true, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false })
);
scene.add(particles);

// ---- floating wireframe shapes ----
const shapes = [
  new THREE.OctahedronGeometry(0.34),
  new THREE.TetrahedronGeometry(0.4),
  new THREE.IcosahedronGeometry(0.3),
  new THREE.BoxGeometry(0.42, 0.42, 0.42),
  new THREE.TorusGeometry(0.28, 0.08, 10, 24),
];
const floaters = [];
for (let i = 0; i < (isMobile ? 8 : 16); i++) {
  const m = new THREE.Mesh(
    shapes[i % shapes.length],
    new THREE.MeshBasicMaterial({ color: i % 2 ? 0x00e5ff : 0x8b5cf6, wireframe: true, transparent: true, opacity: 0.45 })
  );
  const a = Math.random() * Math.PI * 2;
  const r = 5 + Math.random() * 6;
  m.position.set(Math.cos(a) * r, (Math.random() - 0.5) * 9, Math.sin(a) * r - 3);
  m.userData = { rx: (Math.random() - 0.5) * 0.8, ry: (Math.random() - 0.5) * 0.8, base: m.position.y, ph: Math.random() * 6 };
  scene.add(m);
  floaters.push(m);
}

/* =========================================================
   4. INTERACTION + ANIMATION LOOP
   ========================================================= */
const mouse = { x: 0, y: 0 };
const smooth = { x: 0, y: 0 };
addEventListener('pointermove', (e) => {
  mouse.x = (e.clientX / innerWidth) * 2 - 1;
  mouse.y = -((e.clientY / innerHeight) * 2 - 1);
});

const bar = $('#progress');
let scrollP = 0;
let scrollSm = 0;
function onScroll() {
  const max = document.documentElement.scrollHeight - innerHeight;
  scrollP = max > 0 ? scrollY / max : 0;
  bar.style.transform = `scaleX(${scrollP})`;
}
addEventListener('scroll', onScroll, { passive: true });
onScroll();

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

const clock = new THREE.Clock();
function tick() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  smooth.x += (mouse.x - smooth.x) * Math.min(1, dt * 3);
  smooth.y += (mouse.y - smooth.y) * Math.min(1, dt * 3);
  scrollSm += (scrollP - scrollSm) * Math.min(1, dt * 3.5);

  // hero object glides left/right as you scroll through sections
  const side = isMobile ? 0 : 2.3 * Math.cos(scrollSm * Math.PI * 3.2);
  hero.position.x = side;
  hero.position.y = isMobile ? 1.6 - scrollSm * 2 : Math.sin(scrollSm * Math.PI * 2) * 0.7;
  hero.rotation.y = t * 0.18 * speed + scrollSm * Math.PI * 4 + smooth.x * 0.5;
  hero.rotation.x = smooth.y * 0.35 + scrollSm * 1.6;
  const s = (isMobile ? 0.62 : 1) * (1 + Math.sin(t * 1.3) * 0.025);
  hero.scale.setScalar(s);

  knot.rotation.z = t * 0.1 * speed;
  wire.rotation.z = -t * 0.14 * speed;
  core.rotation.x = t * 0.6 * speed;
  core.rotation.y = t * 0.4 * speed;
  core.scale.setScalar(1 + Math.sin(t * 2) * 0.08);

  orbits.forEach((o, i) => {
    o.spin.rotation.y = t * (0.7 - i * 0.18) * speed + i * 2;
    o.pivot.rotation.y = t * 0.1 * speed * (i % 2 ? -1 : 1);
  });

  particles.rotation.y = t * 0.02 * speed + scrollSm * 0.9;
  particles.rotation.x = scrollSm * 0.35;

  floaters.forEach((m) => {
    const u = m.userData;
    m.rotation.x += u.rx * dt * speed;
    m.rotation.y += u.ry * dt * speed;
    m.position.y = u.base + Math.sin(t * 0.6 + u.ph) * 0.5;
  });

  // moving lights give the metal a living shimmer
  lightA.position.set(Math.cos(t * 0.6) * 5, Math.sin(t * 0.4) * 3, 4);
  lightB.position.set(Math.cos(t * 0.5 + 3) * 5, Math.sin(t * 0.7) * 3, 3);
  lightC.position.set(-4, Math.sin(t * 0.3) * 4, -2);

  // camera parallax
  camera.position.x += (smooth.x * 0.8 - camera.position.x) * 0.05;
  camera.position.y += (smooth.y * 0.5 - camera.position.y) * 0.05;
  camera.position.z = 8 - Math.sin(scrollSm * Math.PI) * 1.4;
  camera.lookAt(0, 0, 0);

  // cursor follow
  if (finePointer) {
    cur.rx += (cur.x - cur.rx) * 0.16;
    cur.ry += (cur.y - cur.ry) * 0.16;
    dot.style.transform = `translate(${cur.x}px, ${cur.y}px)`;
    ring.style.transform = `translate(${cur.rx}px, ${cur.ry}px)`;
  }

  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
tick();

addEventListener('load', () => setTimeout(() => $('#loader').classList.add('done'), 500));
