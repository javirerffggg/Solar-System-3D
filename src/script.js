import * as THREE from 'three';
import * as dat from 'dat.gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';

import bgTexture1 from '/images/1.jpg';
import bgTexture2 from '/images/2.jpg';
import bgTexture3 from '/images/3.jpg';
import bgTexture4 from '/images/4.jpg';
import sunTexture from '/images/sun.jpg';
import mercuryTexture from '/images/mercurymap.jpg';
import mercuryBump from '/images/mercurybump.jpg';
import venusTexture from '/images/venusmap.jpg';
import venusBump from '/images/venusmap.jpg';
import venusAtmosphere from '/images/venus_atmosphere.jpg';
import earthTexture from '/images/earth_daymap.jpg';
import earthNightTexture from '/images/earth_nightmap.jpg';
import earthAtmosphere from '/images/earth_atmosphere.jpg';
import earthMoonTexture from '/images/moonmap.jpg';
import earthMoonBump from '/images/moonbump.jpg';
import marsTexture from '/images/marsmap.jpg';
import marsBump from '/images/marsbump.jpg';
import jupiterTexture from '/images/jupiter.jpg';
import ioTexture from '/images/jupiterIo.jpg';
import europaTexture from '/images/jupiterEuropa.jpg';
import ganymedeTexture from '/images/jupiterGanymede.jpg';
import callistoTexture from '/images/jupiterCallisto.jpg';
import saturnTexture from '/images/saturnmap.jpg';
import satRingTexture from '/images/saturn_ring.png';
import uranusTexture from '/images/uranus.jpg';
import uraRingTexture from '/images/uranus_ring.png';
import neptuneTexture from '/images/neptune.jpg';
import plutoTexture from '/images/plutomap.jpg';

// ══════════════════════════════════════════
//  CONFIGURACIÓN BASE
// ══════════════════════════════════════════
const scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 5000);
camera.position.set(-175, 115, 5);

const renderer = new THREE.WebGL1Renderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled = true;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.75;
controls.screenSpacePanning = false;

const cubeTextureLoader = new THREE.CubeTextureLoader();
const loadTexture = new THREE.TextureLoader();

// ══════════════════════════════════════════
//  POSTPROCESADO
// ══════════════════════════════════════════
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
outlinePass.edgeStrength = 3;
outlinePass.edgeGlow = 1;
outlinePass.visibleEdgeColor.set(0xffffff);
outlinePass.hiddenEdgeColor.set(0x190a05);
composer.addPass(outlinePass);

const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1, 0.4, 0.85);
bloomPass.threshold = 1;
bloomPass.radius = 0.9;
composer.addPass(bloomPass);

var lightAmbient = new THREE.AmbientLight(0x222222, 6);
scene.add(lightAmbient);

scene.background = cubeTextureLoader.load([bgTexture3, bgTexture1, bgTexture2, bgTexture2, bgTexture4, bgTexture2]);

// ══════════════════════════════════════════
//  GUI (dat.GUI)
// ══════════════════════════════════════════
const gui = new dat.GUI({ autoPlace: false });
document.getElementById('gui-container').appendChild(gui.domElement);

const settings = {
  velocidadOrbital: 1,
  velocidad: 1,
  intensidadSol: 1.9
};

gui.add(settings, 'velocidadOrbital', 0, 10).name('Vel. Orbital');
gui.add(settings, 'velocidad', 0, 10).name('Velocidad');
gui.add(settings, 'intensidadSol', 1, 10).name('Intensidad del Sol').onChange(v => { sunMat.emissiveIntensity = v; });

// ══════════════════════════════════════════
//  RAYCASTER Y RATÓN
// ══════════════════════════════════════════
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onMouseMove(e) {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
}

// ══════════════════════════════════════════
//  SOL
// ══════════════════════════════════════════
let sunMat;
const sunSize = 697 / 40;
const sunGeom = new THREE.SphereGeometry(sunSize, 32, 20);
sunMat = new THREE.MeshStandardMaterial({
  emissive: 0xFFF88F,
  emissiveMap: loadTexture.load(sunTexture),
  emissiveIntensity: settings.intensidadSol
});
const sun = new THREE.Mesh(sunGeom, sunMat);
scene.add(sun);

const pointLight = new THREE.PointLight(0xFDFFD3, 1200, 600, 1.4);
scene.add(pointLight);
pointLight.castShadow = true;
pointLight.shadow.mapSize.width = 1024;
pointLight.shadow.mapSize.height = 1024;
pointLight.shadow.camera.near = 10;
pointLight.shadow.camera.far = 40;

// ══════════════════════════════════════════
//  FUNCIÓN CREAR PLANETA
// ══════════════════════════════════════════
function createPlanet(planetName, size, position, tilt, texture, bump, ring, atmosphere, moons) {
  let material;
  if (texture instanceof THREE.Material) {
    material = texture;
  } else if (bump) {
    material = new THREE.MeshPhongMaterial({ map: loadTexture.load(texture), bumpMap: loadTexture.load(bump), bumpScale: 0.7 });
  } else {
    material = new THREE.MeshPhongMaterial({ map: loadTexture.load(texture) });
  }

  const name = planetName;
  const geometry = new THREE.SphereGeometry(size, 32, 20);
  const planet = new THREE.Mesh(geometry, material);
  const planet3d = new THREE.Object3D();
  const planetSystem = new THREE.Group();
  planetSystem.add(planet);
  let Atmosphere, Ring;

  planet.position.x = position;
  planet.rotation.z = tilt * Math.PI / 180;

  const orbitPath = new THREE.EllipseCurve(0, 0, position, position, 0, 2 * Math.PI, false, 0);
  const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPath.getPoints(100));
  const orbit = new THREE.LineLoop(orbitGeometry, new THREE.LineBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.03 }));
  orbit.rotation.x = Math.PI / 2;
  planetSystem.add(orbit);

  if (ring) {
    const RingGeo = new THREE.RingGeometry(ring.innerRadius, ring.outerRadius, 30);
    const RingMat = new THREE.MeshStandardMaterial({ map: loadTexture.load(ring.texture), side: THREE.DoubleSide });
    Ring = new THREE.Mesh(RingGeo, RingMat);
    planetSystem.add(Ring);
    Ring.position.x = position;
    Ring.rotation.x = -0.5 * Math.PI;
    Ring.rotation.y = -tilt * Math.PI / 180;
  }

  if (atmosphere) {
    const atGeo = new THREE.SphereGeometry(size + 0.1, 32, 20);
    const atMat = new THREE.MeshPhongMaterial({ map: loadTexture.load(atmosphere), transparent: true, opacity: 0.4, depthTest: true, depthWrite: false });
    Atmosphere = new THREE.Mesh(atGeo, atMat);
    Atmosphere.rotation.z = 0.41;
    planet.add(Atmosphere);
  }

  if (moons) {
    moons.forEach(moon => {
      const mMat = moon.bump
        ? new THREE.MeshStandardMaterial({ map: loadTexture.load(moon.texture), bumpMap: loadTexture.load(moon.bump), bumpScale: 0.5 })
        : new THREE.MeshStandardMaterial({ map: loadTexture.load(moon.texture) });
      const moonMesh = new THREE.Mesh(new THREE.SphereGeometry(moon.size, 32, 20), mMat);
      moonMesh.position.set(size * 1.5, 0, 0);
      planetSystem.add(moonMesh);
      moon.mesh = moonMesh;
    });
  }

  planet3d.add(planetSystem);
  scene.add(planet3d);
  return { name, planet, planet3d, Atmosphere, moons, planetSystem, Ring };
}

// ══════════════════════════════════════════
//  CARGA DE OBJETOS GLTF
// ══════════════════════════════════════════
function loadObject(path, position, scale, callback) {
  const loader = new GLTFLoader();
  loader.load(path, gltf => {
    const obj = gltf.scene;
    obj.position.set(position, 0, 0);
    obj.scale.set(scale, scale, scale);
    scene.add(obj);
    if (callback) callback(obj);
  }, undefined, err => console.error('Error cargando objeto:', err));
}

// ══════════════════════════════════════════
//  ASTEROIDES
// ══════════════════════════════════════════
const asteroids = [];
function loadAsteroids(path, count, minR, maxR) {
  const loader = new GLTFLoader();
  loader.load(path, gltf => {
    gltf.scene.traverse(child => {
      if (child.isMesh) {
        for (let i = 0; i < count / 12; i++) {
          const a = child.clone();
          const r = THREE.MathUtils.randFloat(minR, maxR);
          const angle = Math.random() * Math.PI * 2;
          a.position.set(r * Math.cos(angle), 0, r * Math.sin(angle));
          a.scale.setScalar(THREE.MathUtils.randFloat(0.8, 1.2));
          scene.add(a);
          asteroids.push(a);
        }
      }
    });
  }, undefined, err => console.error('Error asteroides:', err));
}

// ══════════════════════════════════════════
//  SHADER DÍA/NOCHE TIERRA
// ══════════════════════════════════════════
const earthMaterial = new THREE.ShaderMaterial({
  uniforms: {
    dayTexture: { value: loadTexture.load(earthTexture) },
    nightTexture: { value: loadTexture.load(earthNightTexture) },
    sunPosition: { value: sun.position }
  },
  vertexShader: `
    varying vec3 vNormal; varying vec2 vUv; varying vec3 vSunDir;
    uniform vec3 sunPosition;
    void main() {
      vUv = uv;
      vec4 wp = modelMatrix * vec4(position,1.0);
      vNormal = normalize(modelMatrix * vec4(normal,0.0)).xyz;
      vSunDir = normalize(sunPosition - wp.xyz);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
    }`,
  fragmentShader: `
    uniform sampler2D dayTexture; uniform sampler2D nightTexture;
    varying vec3 vNormal; varying vec2 vUv; varying vec3 vSunDir;
    void main() {
      float i = max(dot(vNormal, vSunDir),0.0);
      gl_FragColor = mix(texture2D(nightTexture,vUv)*0.2, texture2D(dayTexture,vUv), i);
    }`
});

// ══════════════════════════════════════════
//  LUNAS
// ══════════════════════════════════════════
const earthMoon = [{ size: 1.6, texture: earthMoonTexture, bump: earthMoonBump, orbitSpeed: 0.001, orbitRadius: 10 }];
const marsMoons = [
  { modelPath: '/images/mars/phobos.glb', scale: 0.1, orbitRadius: 5, orbitSpeed: 0.002, position: 100, mesh: null },
  { modelPath: '/images/mars/deimos.glb', scale: 0.1, orbitRadius: 9, orbitSpeed: 0.0005, position: 120, mesh: null }
];
const jupiterMoons = [
  { size: 1.6, texture: ioTexture, orbitRadius: 20, orbitSpeed: 0.0005 },
  { size: 1.4, texture: europaTexture, orbitRadius: 24, orbitSpeed: 0.00025 },
  { size: 2, texture: ganymedeTexture, orbitRadius: 28, orbitSpeed: 0.000125 },
  { size: 1.7, texture: callistoTexture, orbitRadius: 32, orbitSpeed: 0.00006 }
];

// ══════════════════════════════════════════
//  PLANETAS
// ══════════════════════════════════════════
const mercury = new createPlanet('Mercurio', 2.4, 40, 0, mercuryTexture, mercuryBump);
const venus = new createPlanet('Venus', 6.1, 65, 3, venusTexture, venusBump, null, venusAtmosphere);
const earth = new createPlanet('Tierra', 6.4, 90, 23, earthMaterial, null, null, earthAtmosphere, earthMoon);
const mars = new createPlanet('Marte', 3.4, 115, 25, marsTexture, marsBump);
marsMoons.forEach(moon => {
  loadObject(moon.modelPath, moon.position, moon.scale, m => {
    moon.mesh = m;
    mars.planetSystem.add(m);
    m.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
  });
});
const jupiter = new createPlanet('Júpiter', 69 / 4, 200, 3, jupiterTexture, null, null, null, jupiterMoons);
const saturn = new createPlanet('Saturno', 58 / 4, 270, 26, saturnTexture, null, { innerRadius: 18, outerRadius: 29, texture: satRingTexture });
const uranus = new createPlanet('Urano', 25 / 4, 320, 82, uranusTexture, null, { innerRadius: 6, outerRadius: 8, texture: uraRingTexture });
const neptune = new createPlanet('Neptuno', 24 / 4, 340, 28, neptuneTexture);
const pluto = new createPlanet('Plutón', 1, 350, 57, plutoTexture);

// ══════════════════════════════════════════
//  DATOS PLANETAS
// ══════════════════════════════════════════
const planetData = {
  'Mercurio': { radio: '2.439,7 km', inclinacion: '0,034°', rotacion: '58,6 días terrestres', orbita: '88 días terrestres', distancia: '57,9 millones de km', lunas: '0', info: 'El planeta más pequeño del sistema solar y el más cercano al Sol.', gravedad: 3.7, atmosfera: null, interior: 'mercurio' },
  'Venus':    { radio: '6.051,8 km', inclinacion: '177,4°', rotacion: '243 días terrestres', orbita: '225 días terrestres', distancia: '108,2 millones de km', lunas: '0', info: 'Segundo planeta desde el Sol, conocido por sus temperaturas extremas.', gravedad: 8.87, atmosfera: { 'CO₂': 96.5, 'N₂': 3.5 }, interior: 'terrestre' },
  'Tierra':   { radio: '6.371 km', inclinacion: '23,5°', rotacion: '24 horas', orbita: '365 días', distancia: '150 millones de km', lunas: '1 (Luna)', info: 'Tercer planeta desde el Sol y el único conocido que alberga vida.', gravedad: 9.81, atmosfera: { 'N₂': 78, 'O₂': 21, 'Ar': 0.93, 'CO₂': 0.04 }, interior: 'terrestre', magnetosfera: true },
  'Marte':    { radio: '3.389,5 km', inclinacion: '25,19°', rotacion: '1,03 días terrestres', orbita: '687 días terrestres', distancia: '227,9 millones de km', lunas: '2 (Fobos y Deimos)', info: 'El Planeta Rojo, con el mayor volcán del sistema solar.', gravedad: 3.71, atmosfera: { 'CO₂': 95.3, 'N₂': 2.6, 'Ar': 1.9 }, interior: 'terrestre' },
  'Júpiter':  { radio: '69.911 km', inclinacion: '3,13°', rotacion: '9,9 horas', orbita: '12 años terrestres', distancia: '778,5 millones de km', lunas: '95 lunas conocidas', info: 'El planeta más grande, con la Gran Mancha Roja.', gravedad: 24.79, atmosfera: { 'H₂': 89, 'He': 10, 'CH₄': 0.3, 'NH₃': 0.026 }, interior: 'gaseoso', magnetosfera: true },
  'Saturno':  { radio: '58.232 km', inclinacion: '26,73°', rotacion: '10,7 horas', orbita: '29,5 años terrestres', distancia: '1.400 millones de km', lunas: '146 lunas conocidas', info: 'Conocido por su extenso sistema de anillos.', gravedad: 10.44, atmosfera: { 'H₂': 96, 'He': 3, 'CH₄': 0.4 }, interior: 'gaseoso' },
  'Urano':    { radio: '25.362 km', inclinacion: '97,77°', rotacion: '17,2 horas', orbita: '84 años terrestres', distancia: '2.900 millones de km', lunas: '27 lunas conocidas', info: 'Rotación lateral única y color azul pálido.', gravedad: 8.69, atmosfera: { 'H₂': 83, 'He': 15, 'CH₄': 2.3 }, interior: 'hielo' },
  'Neptuno':  { radio: '24.622 km', inclinacion: '28,32°', rotacion: '16,1 horas', orbita: '165 años terrestres', distancia: '4.500 millones de km', lunas: '14 lunas conocidas', info: 'El más lejano del Sol, de intenso color azul.', gravedad: 11.15, atmosfera: { 'H₂': 80, 'He': 19, 'CH₄': 1.5 }, interior: 'hielo' },
  'Plutón':   { radio: '1.188,3 km', inclinacion: '122,53°', rotacion: '6,4 días terrestres', orbita: '248 años terrestres', distancia: '5.900 millones de km', lunas: '5 (Caronte, Estigia, Nix, Cérbero e Hidra)', info: 'Planeta enano en el Cinturón de Kuiper.', gravedad: 0.62, atmosfera: { 'N₂': 98, 'CH₄': 1.5, 'CO': 0.5 }, interior: 'hielo' }
};

// ══════════════════════════════════════════
//  SOMBRAS PLANETAS
// ══════════════════════════════════════════
earth.planet.castShadow = true; earth.planet.receiveShadow = true;
earth.Atmosphere.castShadow = true; earth.Atmosphere.receiveShadow = true;
earth.moons.forEach(m => { m.mesh.castShadow = true; m.mesh.receiveShadow = true; });
mercury.planet.castShadow = true; mercury.planet.receiveShadow = true;
venus.planet.castShadow = true; venus.planet.receiveShadow = true; venus.Atmosphere.receiveShadow = true;
mars.planet.castShadow = true; mars.planet.receiveShadow = true;
jupiter.planet.castShadow = true; jupiter.planet.receiveShadow = true;
jupiter.moons.forEach(m => { m.mesh.castShadow = true; m.mesh.receiveShadow = true; });
saturn.planet.castShadow = true; saturn.planet.receiveShadow = true; saturn.Ring.receiveShadow = true;
uranus.planet.receiveShadow = true; neptune.planet.receiveShadow = true; pluto.planet.receiveShadow = true;

// ══════════════════════════════════════════
//  RAYCAST TARGETS
// ══════════════════════════════════════════
const raycastTargets = [
  mercury.planet, venus.planet, venus.Atmosphere, earth.planet, earth.Atmosphere,
  mars.planet, jupiter.planet, saturn.planet, uranus.planet, neptune.planet, pluto.planet
];

// ══════════════════════════════════════════
//  SELECCIÓN DE PLANETA
// ══════════════════════════════════════════
let selectedPlanet = null;
let isMovingTowardsPlanet = false;
let isZoomingOut = false;
let targetCameraPosition = new THREE.Vector3();
let zoomOutTargetPosition = new THREE.Vector3(-175, 115, 5);
let offset;

function onDocumentMouseDown(e) {
  e.preventDefault();
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(raycastTargets);
  if (intersects.length > 0) {
    const clicked = intersects[0].object;
    selectedPlanet = identifyPlanet(clicked);
    if (selectedPlanet) {
      closeInfoNoZoomOut();
      settings.velocidadOrbital = 0;
      const pos = new THREE.Vector3();
      selectedPlanet.planet.getWorldPosition(pos);
      controls.target.copy(pos);
      camera.lookAt(pos);
      targetCameraPosition.copy(pos).add(camera.position.clone().sub(pos).normalize().multiplyScalar(offset));
      isMovingTowardsPlanet = true;
    }
  }
}

function identifyPlanet(obj) {
  const map = [
    { check: mercury.planet.material, data: mercury, off: 10 },
    { check: venus.Atmosphere.material, data: venus, off: 25 },
    { check: earth.Atmosphere.material, data: earth, off: 25 },
    { check: mars.planet.material, data: mars, off: 15 },
    { check: jupiter.planet.material, data: jupiter, off: 50 },
    { check: saturn.planet.material, data: saturn, off: 50 },
    { check: uranus.planet.material, data: uranus, off: 25 },
    { check: neptune.planet.material, data: neptune, off: 20 },
    { check: pluto.planet.material, data: pluto, off: 10 },
  ];
  for (const e of map) {
    if (obj.material === e.check) { offset = e.off; return e.data; }
  }
  return null;
}

function showPlanetInfo(planetName) {
  const d = planetData[planetName];
  document.getElementById('planetInfo').style.display = 'block';
  document.getElementById('planetName').innerText = planetName;
  document.getElementById('planetDetails').innerText =
    `Radio: ${d.radio}\nInclinación: ${d.inclinacion}\nRotación: ${d.rotacion}\nÓrbita: ${d.orbita}\nDistancia: ${d.distancia}\nLunas: ${d.lunas}\nInfo: ${d.info}`;

  const btns = document.getElementById('planetExtraButtons');
  btns.innerHTML = '';
  if (d.interior) {
    const b = document.createElement('button'); b.className = 'extra-btn'; b.textContent = '🔍 Estructura Interna';
    b.onclick = () => showInteriorPanel(planetName); btns.appendChild(b);
  }
  if (d.atmosfera) {
    const b = document.createElement('button'); b.className = 'extra-btn'; b.textContent = '🌡️ Atmósfera';
    b.onclick = () => showSpectrumPanel(planetName); btns.appendChild(b);
  }
  const bg = document.createElement('button'); bg.className = 'extra-btn'; bg.textContent = '⚖️ Gravedad';
  bg.onclick = () => showGravityPanel(planetName); btns.appendChild(bg);
  if (d.magnetosfera) {
    const bm = document.createElement('button'); bm.className = 'extra-btn'; bm.textContent = '🧲 Magnetosfera';
    bm.onclick = () => toggleMagnetosphere(planetName); btns.appendChild(bm);
  }
}

function closeInfo() {
  document.getElementById('planetInfo').style.display = 'none';
  settings.velocidadOrbital = 1;
  isZoomingOut = true;
  controls.target.set(0, 0, 0);
}
window.closeInfo = closeInfo;

function closeInfoNoZoomOut() {
  document.getElementById('planetInfo').style.display = 'none';
  settings.velocidadOrbital = 1;
}

// ══════════════════════════════════════════
//  ZONA HABITABLE
// ══════════════════════════════════════════
let habitableZoneMesh = null;
function createHabitableZone() {
  const inner = 80, outer = 120;
  const geo = new THREE.RingGeometry(inner, outer, 128);
  const mat = new THREE.MeshBasicMaterial({
    color: 0x00ff88, transparent: true, opacity: 0.08,
    side: THREE.DoubleSide, depthWrite: false
  });
  habitableZoneMesh = new THREE.Mesh(geo, mat);
  habitableZoneMesh.rotation.x = Math.PI / 2;
  habitableZoneMesh.visible = false;
  scene.add(habitableZoneMesh);

  // Borde interior
  const edgeI = new THREE.RingGeometry(inner - 0.5, inner + 0.5, 128);
  const edgeO = new THREE.RingGeometry(outer - 0.5, outer + 0.5, 128);
  const edgeMat = new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false });
  const ei = new THREE.Mesh(edgeI, edgeMat); ei.rotation.x = Math.PI / 2;
  const eo = new THREE.Mesh(edgeO, edgeMat.clone()); eo.rotation.x = Math.PI / 2;
  habitableZoneMesh.add(ei);
  habitableZoneMesh.add(eo);
}
createHabitableZone();

// ══════════════════════════════════════════
//  COMETAS
// ══════════════════════════════════════════
const cometData = [
  { name: 'Cometa Halley', a: 280, e: 0.967, inclinacion: 162, color: 0x88ddff, period: 75, info: 'Periodo de 75 años. Se acelera al acercarse al Sol por la ley de áreas de Kepler.' },
  { name: 'Cometa Hale-Bopp', a: 520, e: 0.995, inclinacion: 89, color: 0xaaffcc, period: 2520, info: 'Fue visible a simple vista durante 18 meses (1996-97).' },
  { name: 'Cometa Encke', a: 140, e: 0.847, inclinacion: 11.8, color: 0xffddaa, period: 3.3, info: 'El cometa conocido de periodo más corto: 3,3 años.' }
];

const cometsGroup = new THREE.Group();
scene.add(cometsGroup);
const cometObjects = [];

cometData.forEach(cd => {
  const b = cd.a * Math.sqrt(1 - cd.e * cd.e);
  const c = cd.a * cd.e;

  // Órbita elíptica visual
  const pts = [];
  for (let i = 0; i <= 256; i++) {
    const theta = (i / 256) * Math.PI * 2;
    const x = cd.a * Math.cos(theta) - c;
    const z = b * Math.sin(theta);
    pts.push(new THREE.Vector3(x, 0, z));
  }
  const orbitGeo = new THREE.BufferGeometry().setFromPoints(pts);
  const orbitLine = new THREE.LineLoop(orbitGeo, new THREE.LineBasicMaterial({ color: cd.color, transparent: true, opacity: 0.25 }));
  const tiltRad = cd.inclinacion * Math.PI / 180;
  orbitLine.rotation.x = tiltRad;
  cometsGroup.add(orbitLine);

  // Núcleo
  const nucleoGeo = new THREE.SphereGeometry(1.5, 8, 8);
  const nucleoMat = new THREE.MeshBasicMaterial({ color: cd.color });
  const nucleo = new THREE.Mesh(nucleoGeo, nucleoMat);
  cometsGroup.add(nucleo);

  // Cola
  const tailPoints = [];
  for (let i = 0; i < 30; i++) {
    tailPoints.push(new THREE.Vector3(-i * 2, 0, 0));
  }
  const tailGeo = new THREE.BufferGeometry().setFromPoints(tailPoints);
  const tailMat = new THREE.LineBasicMaterial({ color: cd.color, transparent: true, opacity: 0.5 });
  const tail = new THREE.Line(tailGeo, tailMat);
  nucleo.add(tail);

  cometObjects.push({ data: cd, nucleo, orbitLine, angle: Math.random() * Math.PI * 2, a: cd.a, b, c, tiltRad });
});
cometsGroup.visible = false;

// ══════════════════════════════════════════
//  CINTURÓN DE KUIPER
// ══════════════════════════════════════════
let kuiperGroup = null;
function createKuiperBelt() {
  kuiperGroup = new THREE.Group();
  const count = 2000;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = THREE.MathUtils.randFloat(355, 500);
    const angle = Math.random() * Math.PI * 2;
    const y = THREE.MathUtils.randFloat(-8, 8);
    positions[i * 3] = r * Math.cos(angle);
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = r * Math.sin(angle);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({ color: 0x8899bb, size: 0.8, transparent: true, opacity: 0.5 });
  kuiperGroup.add(new THREE.Points(geo, mat));
  scene.add(kuiperGroup);
  kuiperGroup.visible = false;
}
createKuiperBelt();

// ══════════════════════════════════════════
//  NUBE DE OORT (representación esquemática)
// ══════════════════════════════════════════
let oortGroup = null;
function createOortCloud() {
  oortGroup = new THREE.Group();
  const count = 3000;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = THREE.MathUtils.randFloat(600, 900);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({ color: 0x99aacc, size: 0.6, transparent: true, opacity: 0.3 });
  oortGroup.add(new THREE.Points(geo, mat));
  scene.add(oortGroup);
  oortGroup.visible = false;
}
createOortCloud();

// ══════════════════════════════════════════
//  MAGNETOSFERAS
// ══════════════════════════════════════════
const magnetosphereObjects = {};

function createMagnetosphere(planetMesh, size, color) {
  const group = new THREE.Group();
  for (let i = 0; i < 60; i++) {
    const theta = (i / 60) * Math.PI * 2;
    const pts = [];
    for (let j = 0; j <= 64; j++) {
      const t = (j / 64) * Math.PI;
      const r = size * (1.2 + 0.8 * Math.abs(Math.cos(t)));
      pts.push(new THREE.Vector3(
        r * Math.sin(t) * Math.cos(theta),
        r * Math.sin(t) * Math.sin(theta) * 0.6,
        r * Math.cos(t)
      ));
    }
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.12 })
    );
    group.add(line);
  }
  group.visible = false;
  planetMesh.add(group);
  return group;
}

magnetosphereObjects['Tierra'] = createMagnetosphere(earth.planet, 18, 0x4488ff);
magnetosphereObjects['Júpiter'] = createMagnetosphere(jupiter.planet, 35, 0xff8844);

function toggleMagnetosphere(planetName) {
  const m = magnetosphereObjects[planetName];
  if (m) {
    m.visible = !m.visible;
    showToast(m.visible ? `Magnetosfera de ${planetName} activada` : `Magnetosfera de ${planetName} desactivada`);
  }
}
window.toggleMagnetosphere = toggleMagnetosphere;

// ══════════════════════════════════════════
//  CAPAS: toggle general
// ══════════════════════════════════════════
const layerState = { habitableZone: false, magnetospheres: false, comets: false, kuiper: false, oort: false };

function toggleLayer(layer) {
  layerState[layer] = !layerState[layer];
  const btn = [...document.querySelectorAll('.tool-btn')].find(b => b.title === {
    habitableZone: 'Zona Habitable',
    magnetospheres: 'Magnetosferas',
    comets: 'Cometas',
    kuiper: 'Cinturón de Kuiper',
    oort: 'Nube de Oort'
  }[layer]);
  if (btn) btn.classList.toggle('active', layerState[layer]);

  if (layer === 'habitableZone') {
    habitableZoneMesh.visible = layerState[layer];
    showToast(layerState[layer] ? '🌿 Zona Habitable activada (80–120 UA escalado)' : 'Zona Habitable desactivada');
  }
  if (layer === 'comets') {
    cometsGroup.visible = layerState[layer];
    showToast(layerState[layer] ? '☄️ Cometas activados: Halley, Hale-Bopp, Encke' : 'Cometas desactivados');
  }
  if (layer === 'kuiper') {
    kuiperGroup.visible = layerState[layer];
    showToast(layerState[layer] ? '💫 Cinturón de Kuiper activado (más allá de Neptuno)' : 'Cinturón de Kuiper desactivado');
  }
  if (layer === 'oort') {
    oortGroup.visible = layerState[layer];
    showToast(layerState[layer] ? '🌌 Nube de Oort activada (representación esquemática)' : 'Nube de Oort desactivada');
  }
  if (layer === 'magnetospheres') {
    const vis = layerState[layer];
    magnetosphereObjects['Tierra'].visible = vis;
    magnetosphereObjects['Júpiter'].visible = vis;
    showToast(vis ? '🧲 Magnetosferas de Tierra y Júpiter activadas' : 'Magnetosferas desactivadas');
  }
}
window.toggleLayer = toggleLayer;

// ══════════════════════════════════════════
//  TOAST
// ══════════════════════════════════════════
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('infoToast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}
window.showToast = showToast;

// ══════════════════════════════════════════
//  PANEL ESTRUCTURA INTERNA
// ══════════════════════════════════════════
const interiorLayers = {
  terrestre: [
    { label: 'Corteza', r: 0.95, color: '#8B7355' },
    { label: 'Manto', r: 0.75, color: '#cc5500' },
    { label: 'Núcleo externo', r: 0.50, color: '#ff8800' },
    { label: 'Núcleo interno', r: 0.28, color: '#ffdd00' }
  ],
  gaseoso: [
    { label: 'Atmósfera', r: 0.95, color: '#aacc88' },
    { label: 'H₂ molecular', r: 0.80, color: '#88aacc' },
    { label: 'H₂ metálico', r: 0.55, color: '#4466aa' },
    { label: 'Núcleo rocoso', r: 0.25, color: '#aa7744' }
  ],
  hielo: [
    { label: 'Atmósfera', r: 0.95, color: '#99ccee' },
    { label: 'Manto de hielo', r: 0.75, color: '#5599aa' },
    { label: 'Núcleo rocoso', r: 0.40, color: '#887755' }
  ],
  mercurio: [
    { label: 'Corteza', r: 0.95, color: '#998877' },
    { label: 'Núcleo férrico', r: 0.80, color: '#cc7733' }
  ]
};

function showInteriorPanel(planetName) {
  const d = planetData[planetName];
  const panel = document.getElementById('interiorPanel');
  document.getElementById('interiorTitle').textContent = `Estructura Interna — ${planetName}`;
  panel.style.display = 'block';

  const canvas = document.getElementById('interiorCanvas');
  const ctx = canvas.getContext('2d');
  const cx = 130, cy = 130, maxR = 120;
  ctx.clearRect(0, 0, 260, 260);

  const layers = interiorLayers[d.interior] || interiorLayers.terrestre;
  [...layers].reverse().forEach(layer => {
    ctx.beginPath();
    ctx.arc(cx, cy, maxR * layer.r, 0, Math.PI * 2);
    ctx.fillStyle = layer.color;
    ctx.fill();
  });

  // Etiquetas
  layers.forEach((layer, i) => {
    const x = cx + (i % 2 === 0 ? 10 : -90);
    const y = cy - maxR * layer.r + 12;
    ctx.fillStyle = '#fff';
    ctx.font = '11px Arial';
    ctx.fillText(layer.label, x, y);
  });

  const descs = {
    terrestre: 'Planeta rocoso con núcleo metálico, manto silicatado y corteza.',
    gaseoso: 'Gigante gaseoso con núcleo rocoso rodeado de hidrógeno metálico.',
    hielo: 'Gigante de hielo con manto de agua, amoníaco y metano congelado.',
    mercurio: 'Núcleo férrico gigante (85% del radio) cubierto de delgada corteza.'
  };
  document.getElementById('interiorDesc').textContent = descs[d.interior] || '';
}
window.showInteriorPanel = showInteriorPanel;

// ══════════════════════════════════════════
//  PANEL ESPECTROSCOPÍA
// ══════════════════════════════════════════
const gasColors = {
  'CO₂': '#ff4422', 'N₂': '#88aaff', 'O₂': '#44ffaa',
  'Ar': '#bbbbff', 'H₂': '#ffee55', 'He': '#ffaaff',
  'CH₄': '#ff9900', 'NH₃': '#ccff66', 'CO': '#ff6655'
};

function showSpectrumPanel(planetName) {
  const d = planetData[planetName];
  if (!d.atmosfera) return;
  document.getElementById('spectrumTitle').textContent = `Atmósfera — ${planetName}`;
  document.getElementById('spectrumPanel').style.display = 'block';

  const canvas = document.getElementById('spectrumCanvas');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 260, 200);

  const gases = Object.entries(d.atmosfera);
  const barW = 30, gap = 12, startX = 20;
  const maxVal = Math.max(...gases.map(g => g[1]));

  gases.forEach(([gas, pct], i) => {
    const h = (pct / maxVal) * 140;
    const x = startX + i * (barW + gap);
    const color = gasColors[gas] || '#aaaaff';

    ctx.fillStyle = color;
    ctx.fillRect(x, 160 - h, barW, h);
    ctx.fillStyle = '#fff';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(gas, x + barW / 2, 175);
    ctx.fillText(pct + '%', x + barW / 2, 155 - h);
  });

  let descGases = gases.map(([g, p]) => `${g}: ${p}%`).join(' • ');
  document.getElementById('spectrumDesc').textContent = `Composición: ${descGases}`;
}
window.showSpectrumPanel = showSpectrumPanel;

// ══════════════════════════════════════════
//  PANEL GRAVEDAD
// ══════════════════════════════════════════
const gravityData = {
  'Mercurio': 3.7, 'Venus': 8.87, 'Tierra': 9.81, 'Marte': 3.71,
  'Júpiter': 24.79, 'Saturno': 10.44, 'Urano': 8.69, 'Neptuno': 11.15, 'Plutón': 0.62
};

function showGravityPanel(focusPlanet) {
  document.getElementById('gravityPanel').style.display = 'block';
  const canvas = document.getElementById('gravityCanvas');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 260, 220);

  const planets = Object.entries(gravityData);
  const max = Math.max(...planets.map(p => p[1]));
  const barH = 16, gap = 6, startY = 10;

  planets.forEach(([name, g], i) => {
    const w = (g / max) * 180;
    const y = startY + i * (barH + gap);
    const highlight = name === focusPlanet;
    ctx.fillStyle = highlight ? '#00ffaa' : '#336699';
    ctx.fillRect(60, y, w, barH);
    ctx.fillStyle = '#fff';
    ctx.font = highlight ? 'bold 10px Arial' : '10px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(name, 55, y + 12);
    ctx.textAlign = 'left';
    ctx.fillStyle = highlight ? '#00ffaa' : '#aad';
    ctx.fillText(`${g} m/s²`, 65 + w, y + 12);
  });

  if (focusPlanet) {
    const g = gravityData[focusPlanet];
    const h = 10; // metros
    const t = Math.sqrt(2 * h / g).toFixed(2);
    document.getElementById('gravityResult').innerHTML =
      `En <b>${focusPlanet}</b>: caería 10 m en <b>${t} s</b> (g = ${g} m/s²)`;
  }
}
window.showGravityPanel = showGravityPanel;

// ══════════════════════════════════════════
//  PANEL INCLINACIÓN AXIAL
// ══════════════════════════════════════════
function showAxialPanel() {
  document.getElementById('axialPanel').style.display = 'block';
  const canvas = document.getElementById('axialCanvas');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 260, 200);

  const cx = 130, cy = 100, sunR = 18, earthR = 10;
  const orbitR = 90;
  const seasons = [
    { label: 'Primavera (Mar)', angle: 0, tilt: 0 },
    { label: 'Verano (Jun)', angle: Math.PI / 2, tilt: 23.5 },
    { label: 'Otoño (Sep)', angle: Math.PI, tilt: 0 },
    { label: 'Invierno (Dic)', angle: 3 * Math.PI / 2, tilt: -23.5 }
  ];

  // Sol
  ctx.beginPath();
  ctx.arc(cx, cy, sunR, 0, Math.PI * 2);
  const sunGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, sunR);
  sunGrad.addColorStop(0, '#fff7aa');
  sunGrad.addColorStop(1, '#ff9900');
  ctx.fillStyle = sunGrad;
  ctx.fill();
  ctx.fillStyle = '#ffee44'; ctx.font = 'bold 10px Arial'; ctx.textAlign = 'center';
  ctx.fillText('Sol', cx, cy + 3);

  // Órbita
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.beginPath(); ctx.arc(cx, cy, orbitR, 0, Math.PI * 2); ctx.stroke();

  seasons.forEach(s => {
    const ex = cx + orbitR * Math.cos(s.angle);
    const ey = cy + orbitR * Math.sin(s.angle);
    ctx.save();
    ctx.translate(ex, ey);
    const tiltRad = s.tilt * Math.PI / 180;
    ctx.rotate(tiltRad);
    ctx.beginPath();
    ctx.arc(0, 0, earthR, 0, Math.PI * 2);
    ctx.fillStyle = '#1a88ff'; ctx.fill();
    // Eje
    ctx.strokeStyle = '#ff4444'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, -earthR - 4); ctx.lineTo(0, earthR + 4); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#adf'; ctx.font = '9px Arial'; ctx.textAlign = 'center';
    const lx = cx + (orbitR + 18) * Math.cos(s.angle);
    const ly = cy + (orbitR + 18) * Math.sin(s.angle);
    ctx.fillText(s.label.split(' ')[0], lx, ly);
  });
}
window.showAxialPanel = showAxialPanel;

// ══════════════════════════════════════════
//  PANEL SONDAS ESPACIALES
// ══════════════════════════════════════════
const probesHistory = [
  { name: 'Sputnik 1', launch: 1957, end: 1958, events: { 1957: 'Primer satélite artificial en órbita terrestre.' } },
  { name: 'Luna 9', launch: 1966, end: 1966, events: { 1966: 'Primer aterrizaje suave en la Luna.' } },
  { name: 'Apollo 11', launch: 1969, end: 1969, events: { 1969: 'Primer alunizaje con humanos (Neil Armstrong).' } },
  { name: 'Mariner 9', launch: 1971, end: 1972, events: { 1971: 'Primera sonda en orbitar Marte.' } },
  { name: 'Pioneer 10', launch: 1972, end: 2003, events: { 1972: 'Lanzamiento. Primer vuelo por el Cinturón de Asteroides.', 1973: 'Sobrevuelo de Júpiter.', 1983: 'Cruza la órbita de Neptuno.' } },
  { name: 'Voyager 1', launch: 1977, end: null, events: { 1977: 'Lanzamiento (5 sep).', 1979: 'Sobrevuelo de Júpiter.', 1980: 'Sobrevuelo de Saturno.', 2012: 'Entra en el espacio interestelar.' } },
  { name: 'Voyager 2', launch: 1977, end: null, events: { 1977: 'Lanzamiento (20 ago).', 1979: 'Sobrevuelo de Júpiter.', 1981: 'Sobrevuelo de Saturno.', 1986: 'Sobrevuelo de Urano.', 1989: 'Sobrevuelo de Neptuno.' } },
  { name: 'Galileo', launch: 1989, end: 2003, events: { 1989: 'Lanzamiento.', 1995: 'Entrada en órbita de Júpiter.', 2003: 'Desintegración en Júpiter.' } },
  { name: 'Cassini', launch: 1997, end: 2017, events: { 1997: 'Lanzamiento.', 2004: 'Entrada en órbita de Saturno.', 2005: 'Huygens aterriza en Titán.', 2017: 'Gran final en Saturno.' } },
  { name: 'Mars Curiosity', launch: 2011, end: null, events: { 2011: 'Lanzamiento.', 2012: 'Aterrizaje en el Cáter Gale (Marte).' } },
  { name: 'New Horizons', launch: 2006, end: null, events: { 2006: 'Lanzamiento.', 2015: 'Sobrevuelo de Plutón.', 2019: 'Sobrevuelo de Arrokoth (Cinturón de Kuiper).' } },
  { name: 'James Webb', launch: 2021, end: null, events: { 2021: 'Lanzamiento.', 2022: 'Primeras imágenes científicas.' } }
];

function updateProbes(year) {
  year = parseInt(year);
  document.getElementById('probeYearLabel').textContent = year;
  const container = document.getElementById('probesList');
  container.innerHTML = '';
  probesHistory.forEach(probe => {
    if (probe.launch > year) return;
    const active = probe.end === null || probe.end >= year;
    const event = probe.events[year];
    const div = document.createElement('div');
    div.style.cssText = `padding:4px 0; border-bottom:1px solid #223; color:${active ? '#8ef' : '#556'};`;
    div.innerHTML = `<b>${probe.name}</b> (${probe.launch}${probe.end ? '–' + probe.end : '+'})<br>
      ${event ? `<span style="color:#ffa;">★ ${event}</span>` : (active ? '<span style="color:#7a7">En operación</span>' : '<span style="color:#555">Misión finalizada</span>')}`;
    container.appendChild(div);
  });
  if (container.innerHTML === '') container.innerHTML = '<i style="color:#556">No hay sondas activas en este año.</i>';
}
window.updateProbes = updateProbes;
updateProbes(1977);

// ══════════════════════════════════════════
//  GUÍA DE OBSERVACIÓN NOCTURNA
// ══════════════════════════════════════════
const PLANET_AVG_DIST_AU = {
  'Mercurio': 0.387, 'Venus': 0.723, 'Marte': 1.524,
  'Júpiter': 5.20, 'Saturno': 9.58, 'Urano': 19.2, 'Neptuno': 30.05
};

function requestNightGuide() {
  const result = document.getElementById('nightResult');
  result.innerHTML = '<i style="color:#7af;">Obteniendo ubicación...</i>';
  if (!navigator.geolocation) {
    result.innerHTML = '<span style="color:#f88;">Tu navegador no soporta geolocalización.</span>';
    return;
  }
  navigator.geolocation.getCurrentPosition(pos => {
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;
    const date = new Date();
    const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);

    result.innerHTML = `<b>📍 Lat: ${lat.toFixed(2)}° • Lon: ${lon.toFixed(2)}°</b><br>
    <b>📅 ${date.toLocaleDateString('es-ES')}</b><br><br>`;

    let html = '';
    Object.entries(PLANET_AVG_DIST_AU).forEach(([name, dist]) => {
      // Elongación aproximada basada en el día del año
      const period = { 'Mercurio': 116, 'Venus': 584, 'Marte': 780, 'Júpiter': 399, 'Saturno': 378, 'Urano': 370, 'Neptuno': 368 }[name];
      const phase = ((dayOfYear % period) / period) * 360;
      const elongation = Math.abs(phase - 180);
      const visible = dist < 1 ? elongation > 20 : true;
      const bestTime = dist < 1 ? (elongation > 90 ? 'al anochecer/amanecer' : 'difícil de ver') : 'toda la noche';
      const icon = visible ? '✨' : '🌙';
      html += `${icon} <b>${name}</b>: ${visible ? `<span style="color:#8f8;">Visible</span>` : `<span style="color:#f88;">Oculto</span>`} — ${bestTime}<br>`;
    });
    result.innerHTML += html;
    result.innerHTML += `<br><i style="color:#667;">Nota: Cálculos aproximados. Para observación precisa usa Stellarium.</i>`;
  }, () => {
    result.innerHTML = '<span style="color:#f88;">No se pudo obtener ubicación. Asegúrate de dar permiso.</span>';
  });
}
window.requestNightGuide = requestNightGuide;

// ══════════════════════════════════════════
//  ANIMACIÓN COMETAS (ley de Kepler)
// ══════════════════════════════════════════
let cometTime = 0;
function animateComets() {
  if (!cometsGroup.visible) return;
  cometTime += 0.003 * settings.velocidadOrbital;
  cometObjects.forEach(co => {
    // Velocidad mayor cerca del perihelio (ley de áreas)
    const meanAnomaly = cometTime * (1 / co.data.a) * 20;
    // Aproximación Kepler
    let E = meanAnomaly;
    for (let i = 0; i < 10; i++) E = meanAnomaly + co.data.e * Math.sin(E);
    const trueAnomaly = 2 * Math.atan2(
      Math.sqrt(1 + co.data.e) * Math.sin(E / 2),
      Math.sqrt(1 - co.data.e) * Math.cos(E / 2)
    );
    const r = co.a * (1 - co.data.e * Math.cos(E));
    const x = r * Math.cos(trueAnomaly) - co.c;
    const z = co.b * Math.sin(trueAnomaly);

    co.nucleo.position.set(x * Math.cos(co.tiltRad), x * Math.sin(co.tiltRad) * 0.3, z);
    // Cola apunta opuesta al Sol
    const toSun = new THREE.Vector3(-x, -x * Math.sin(co.tiltRad) * 0.3, -z).normalize();
    co.nucleo.lookAt(co.nucleo.position.clone().add(toSun.multiplyScalar(-1)));
  });
}

// ══════════════════════════════════════════
//  LOOP DE ANIMACIÓN PRINCIPAL
// ══════════════════════════════════════════
function animate() {
  sun.rotateY(0.001 * settings.velocidad);
  mercury.planet.rotateY(0.001 * settings.velocidad); mercury.planet3d.rotateY(0.004 * settings.velocidadOrbital);
  venus.planet.rotateY(0.0005 * settings.velocidad); venus.Atmosphere.rotateY(0.0005 * settings.velocidad); venus.planet3d.rotateY(0.0006 * settings.velocidadOrbital);
  earth.planet.rotateY(0.005 * settings.velocidad); earth.Atmosphere.rotateY(0.001 * settings.velocidad); earth.planet3d.rotateY(0.001 * settings.velocidadOrbital);
  mars.planet.rotateY(0.01 * settings.velocidad); mars.planet3d.rotateY(0.0007 * settings.velocidadOrbital);
  jupiter.planet.rotateY(0.005 * settings.velocidad); jupiter.planet3d.rotateY(0.0003 * settings.velocidadOrbital);
  saturn.planet.rotateY(0.01 * settings.velocidad); saturn.planet3d.rotateY(0.0002 * settings.velocidadOrbital);
  uranus.planet.rotateY(0.005 * settings.velocidad); uranus.planet3d.rotateY(0.0001 * settings.velocidadOrbital);
  neptune.planet.rotateY(0.005 * settings.velocidad); neptune.planet3d.rotateY(0.00008 * settings.velocidadOrbital);
  pluto.planet.rotateY(0.001 * settings.velocidad); pluto.planet3d.rotateY(0.00006 * settings.velocidadOrbital);

  // Luna Tierra
  if (earth.moons) {
    earth.moons.forEach(moon => {
      const t = performance.now();
      const tilt = 5 * Math.PI / 180;
      moon.mesh.position.set(
        earth.planet.position.x + moon.orbitRadius * Math.cos(t * moon.orbitSpeed),
        moon.orbitRadius * Math.sin(t * moon.orbitSpeed) * Math.sin(tilt),
        earth.planet.position.z + moon.orbitRadius * Math.sin(t * moon.orbitSpeed) * Math.cos(tilt)
      );
      moon.mesh.rotateY(0.01);
    });
  }

  // Lunas Marte
  marsMoons.forEach(moon => {
    if (moon.mesh) {
      const t = performance.now();
      moon.mesh.position.set(
        mars.planet.position.x + moon.orbitRadius * Math.cos(t * moon.orbitSpeed),
        moon.orbitRadius * Math.sin(t * moon.orbitSpeed),
        mars.planet.position.z + moon.orbitRadius * Math.sin(t * moon.orbitSpeed)
      );
      moon.mesh.rotateY(0.001);
    }
  });

  // Lunas Júpiter
  if (jupiter.moons) {
    jupiter.moons.forEach(moon => {
      const t = performance.now();
      moon.mesh.position.set(
        jupiter.planet.position.x + moon.orbitRadius * Math.cos(t * moon.orbitSpeed),
        moon.orbitRadius * Math.sin(t * moon.orbitSpeed),
        jupiter.planet.position.z + moon.orbitRadius * Math.sin(t * moon.orbitSpeed)
      );
      moon.mesh.rotateY(0.01);
    });
  }

  // Asteroides
  asteroids.forEach(a => {
    a.rotation.y += 0.0001;
    const cos = Math.cos(0.0001 * settings.velocidadOrbital);
    const sin = Math.sin(0.0001 * settings.velocidadOrbital);
    const nx = a.position.x * cos + a.position.z * sin;
    const nz = a.position.z * cos - a.position.x * sin;
    a.position.x = nx; a.position.z = nz;
  });

  animateComets();

  // Contornos hover
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(raycastTargets);
  outlinePass.selectedObjects = [];
  if (intersects.length > 0) {
    const obj = intersects[0].object;
    if (obj === earth.Atmosphere) outlinePass.selectedObjects = [earth.planet];
    else if (obj === venus.Atmosphere) outlinePass.selectedObjects = [venus.planet];
    else outlinePass.selectedObjects = [obj];
  }

  // Zoom hacia planeta
  if (isMovingTowardsPlanet) {
    camera.position.lerp(targetCameraPosition, 0.03);
    if (camera.position.distanceTo(targetCameraPosition) < 1) {
      isMovingTowardsPlanet = false;
      showPlanetInfo(selectedPlanet.name);
    }
  } else if (isZoomingOut) {
    camera.position.lerp(zoomOutTargetPosition, 0.05);
    if (camera.position.distanceTo(zoomOutTargetPosition) < 1) isZoomingOut = false;
  }

  controls.update();
  requestAnimationFrame(animate);
  composer.render();
}

loadAsteroids('/asteroids/asteroidPack.glb', 1000, 130, 160);
loadAsteroids('/asteroids/asteroidPack.glb', 3000, 352, 370);
animate();

window.addEventListener('mousemove', onMouseMove, false);
window.addEventListener('mousedown', onDocumentMouseDown, false);
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});
