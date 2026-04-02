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

// ******  CONFIGURACIÓN  ******
console.log("Creando la escena");
const scene = new THREE.Scene();

console.log("Creando la cámara de proyección en perspectiva");
var camera = new THREE.PerspectiveCamera( 45, window.innerWidth/window.innerHeight, 0.1, 1000 );
camera.position.set(-175, 115, 5);

console.log("Creando el renderizador");
const renderer = new THREE.WebGL1Renderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
renderer.toneMapping = THREE.ACESFilmicToneMapping;

console.log("Creando el control orbital");
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.75;
controls.screenSpacePanning = false;

console.log("Configurando el cargador de texturas");
const cubeTextureLoader = new THREE.CubeTextureLoader();
const loadTexture = new THREE.TextureLoader();

// ******  CONFIGURACIÓN DE POSTPROCESADO ******
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

// ******  PASO DE CONTORNO  ******
const outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
outlinePass.edgeStrength = 3;
outlinePass.edgeGlow = 1;
outlinePass.visibleEdgeColor.set(0xffffff);
outlinePass.hiddenEdgeColor.set(0x190a05);
composer.addPass(outlinePass);

// ******  PASO DE BLOOM  ******
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1, 0.4, 0.85);
bloomPass.threshold = 1;
bloomPass.radius = 0.9;
composer.addPass(bloomPass);

// ****** LUZ AMBIENTAL ******
console.log("Añadiendo la luz ambiental");
var lightAmbient = new THREE.AmbientLight(0x222222, 6); 
scene.add(lightAmbient);

// ******  Fondo de estrellas  ******
scene.background = cubeTextureLoader.load([

  bgTexture3,
  bgTexture1,
  bgTexture2,
  bgTexture2,
  bgTexture4,
  bgTexture2
]);

// ******  CONTROLES  ******
const gui = new dat.GUI({ autoPlace: false });
const customContainer = document.getElementById('gui-container');
customContainer.appendChild(gui.domElement);

// ****** AJUSTES PARA LOS CONTROLES INTERACTIVOS  ******
const settings = {
  velocidadOrbital: 1,
  velocidad: 1,
  intensidadSol: 1.9
};

gui.add(settings, 'velocidadOrbital', 0, 10).name('Vel. Orbital').onChange(value => {
});
gui.add(settings, 'velocidad', 0, 10).name('Velocidad').onChange(value => {
});
gui.add(settings, 'intensidadSol', 1, 10).name('Intensidad del Sol').onChange(value => {
  sunMat.emissiveIntensity = value;
});

// movimiento del ratón
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onMouseMove(event) {
    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
}

// ******  SELECCIONAR PLANETA  ******
let selectedPlanet = null;
let isMovingTowardsPlanet = false;
let targetCameraPosition = new THREE.Vector3();
let offset;

function onDocumentMouseDown(event) {
  event.preventDefault();

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  var intersects = raycaster.intersectObjects(raycastTargets);

  if (intersects.length > 0) {
    const clickedObject = intersects[0].object;
    selectedPlanet = identifyPlanet(clickedObject);
    if (selectedPlanet) {
      closeInfoNoZoomOut();
      
      settings.velocidadOrbital = 0; // Detener movimiento orbital

      // Actualizar la cámara para mirar al planeta seleccionado
      const planetPosition = new THREE.Vector3();
      selectedPlanet.planet.getWorldPosition(planetPosition);
      controls.target.copy(planetPosition);
      camera.lookAt(planetPosition);

      targetCameraPosition.copy(planetPosition).add(camera.position.clone().sub(planetPosition).normalize().multiplyScalar(offset));
      isMovingTowardsPlanet = true;
    }
  }
}

function identifyPlanet(clickedObject) {
  // Lógica para identificar qué planeta fue pulsado, con distancia de cámara diferente para cada uno
        if (clickedObject.material === mercury.planet.material) {
          offset = 10;
          return mercury;
        } else if (clickedObject.material === venus.Atmosphere.material) {
          offset = 25;
          return venus;
        } else if (clickedObject.material === earth.Atmosphere.material) {
          offset = 25;
          return earth;
        } else if (clickedObject.material === mars.planet.material) {
          offset = 15;
          return mars;
        } else if (clickedObject.material === jupiter.planet.material) {
          offset = 50;
          return jupiter;
        } else if (clickedObject.material === saturn.planet.material) {
          offset = 50;
          return saturn;
        } else if (clickedObject.material === uranus.planet.material) {
          offset = 25;
          return uranus;
        } else if (clickedObject.material === neptune.planet.material) {
          offset = 20;
          return neptune;
        } else if (clickedObject.material === pluto.planet.material) {
          offset = 10;
          return pluto;
        } 

  return null;
}

// ******  MOSTRAR INFO DEL PLANETA TRAS LA SELECCIÓN  ******
function showPlanetInfo(planet) {
  var info = document.getElementById('planetInfo');
  var name = document.getElementById('planetName');
  var details = document.getElementById('planetDetails');

  name.innerText = planet;
  details.innerText = `Radio: ${planetData[planet].radio}\nInclinación: ${planetData[planet].inclinacion}\nRotación: ${planetData[planet].rotacion}\nÓrbita: ${planetData[planet].orbita}\nDistancia: ${planetData[planet].distancia}\nLunas: ${planetData[planet].lunas}\nInfo: ${planetData[planet].info}`;

  info.style.display = 'block';
}
let isZoomingOut = false;
let zoomOutTargetPosition = new THREE.Vector3(-175, 115, 5);
// función del botón 'x' de cerrar
function closeInfo() {
  var info = document.getElementById('planetInfo');
  info.style.display = 'none';
  settings.velocidadOrbital = 1;
  isZoomingOut = true;
  controls.target.set(0, 0, 0);
}
window.closeInfo = closeInfo;
// cerrar info al pulsar otro planeta
function closeInfoNoZoomOut() {
  var info = document.getElementById('planetInfo');
  info.style.display = 'none';
  settings.velocidadOrbital = 1;
}
// ******  SOL  ******
let sunMat;

const sunSize = 697/40; // escala 40 veces menor que la Tierra
const sunGeom = new THREE.SphereGeometry(sunSize, 32, 20);
sunMat = new THREE.MeshStandardMaterial({
  emissive: 0xFFF88F,
  emissiveMap: loadTexture.load(sunTexture),
  emissiveIntensity: settings.intensidadSol
});
const sun = new THREE.Mesh(sunGeom, sunMat);
scene.add(sun);

// luz puntual en el sol
const pointLight = new THREE.PointLight(0xFDFFD3 , 1200, 400, 1.4);
scene.add(pointLight);


// ******  FUNCIÓN DE CREACIÓN DE PLANETAS  ******
function createPlanet(planetName, size, position, tilt, texture, bump, ring, atmosphere, moons){

  let material;
  if (texture instanceof THREE.Material){
    material = texture;
  } 
  else if(bump){
    material = new THREE.MeshPhongMaterial({
    map: loadTexture.load(texture),
    bumpMap: loadTexture.load(bump),
    bumpScale: 0.7
    });
  }
  else {
    material = new THREE.MeshPhongMaterial({
    map: loadTexture.load(texture)
    });
  } 

  const name = planetName;
  const geometry = new THREE.SphereGeometry(size, 32, 20);
  const planet = new THREE.Mesh(geometry, material);
  const planet3d = new THREE.Object3D;
  const planetSystem = new THREE.Group();
  planetSystem.add(planet);
  let Atmosphere;
  let Ring;
  planet.position.x = position;
  planet.rotation.z = tilt * Math.PI / 180;

  // añadir trayectoria orbital
  const orbitPath = new THREE.EllipseCurve(
    0, 0,
    position, position,
    0, 2 * Math.PI,
    false,
    0
);

  const pathPoints = orbitPath.getPoints(100);
  const orbitGeometry = new THREE.BufferGeometry().setFromPoints(pathPoints);
  const orbitMaterial = new THREE.LineBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.03 });
  const orbit = new THREE.LineLoop(orbitGeometry, orbitMaterial);
  orbit.rotation.x = Math.PI / 2;
  planetSystem.add(orbit);

  // añadir anillo
  if(ring)
  {
    const RingGeo = new THREE.RingGeometry(ring.innerRadius, ring.outerRadius,30);
    const RingMat = new THREE.MeshStandardMaterial({
      map: loadTexture.load(ring.texture),
      side: THREE.DoubleSide
    });
    Ring = new THREE.Mesh(RingGeo, RingMat);
    planetSystem.add(Ring);
    Ring.position.x = position;
    Ring.rotation.x = -0.5 *Math.PI;
    Ring.rotation.y = -tilt * Math.PI / 180;
  }
  
  // añadir atmósfera
  if(atmosphere){
    const atmosphereGeom = new THREE.SphereGeometry(size+0.1, 32, 20);
    const atmosphereMaterial = new THREE.MeshPhongMaterial({
      map:loadTexture.load(atmosphere),
      transparent: true,
      opacity: 0.4,
      depthTest: true,
      depthWrite: false
    })
    Atmosphere = new THREE.Mesh(atmosphereGeom, atmosphereMaterial)
    
    Atmosphere.rotation.z = 0.41;
    planet.add(Atmosphere);
  }

  // añadir lunas
  if(moons){
    moons.forEach(moon => {
      let moonMaterial;
      
      if(moon.bump){
        moonMaterial = new THREE.MeshStandardMaterial({
          map: loadTexture.load(moon.texture),
          bumpMap: loadTexture.load(moon.bump),
          bumpScale: 0.5
        });
      } else{
        moonMaterial = new THREE.MeshStandardMaterial({
          map: loadTexture.load(moon.texture)
        });
      }
      const moonGeometry = new THREE.SphereGeometry(moon.size, 32, 20);
      const moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
      const moonOrbitDistance = size * 1.5;
      moonMesh.position.set(moonOrbitDistance, 0, 0);
      planetSystem.add(moonMesh);
      moon.mesh = moonMesh;
    });
  }
  // añadir el sistema planetario al objeto planet3d y a la escena
  planet3d.add(planetSystem);
  scene.add(planet3d);
  return {name, planet, planet3d, Atmosphere, moons, planetSystem, Ring};
}


// ******  MÉTODO DE CARGA DE OBJETOS  ******
function loadObject(path, position, scale, callback) {
  const loader = new GLTFLoader();

  loader.load(path, function (gltf) {
      const obj = gltf.scene;
      obj.position.set(position, 0, 0);
      obj.scale.set(scale, scale, scale);
      scene.add(obj);
      if (callback) {
        callback(obj);
      }
  }, undefined, function (error) {
      console.error('Se ha producido un error', error);
  });
}

// ******  ASTEROIDES  ******
const asteroids = [];
function loadAsteroids(path, numberOfAsteroids, minOrbitRadius, maxOrbitRadius) {
  const loader = new GLTFLoader();
  loader.load(path, function (gltf) {
      gltf.scene.traverse(function (child) {
          if (child.isMesh) {
              for (let i = 0; i < numberOfAsteroids / 12; i++) { // Se divide entre 12 porque el paquete contiene 12 asteroides
                  const asteroid = child.clone();
                  const orbitRadius = THREE.MathUtils.randFloat(minOrbitRadius, maxOrbitRadius);
                  const angle = Math.random() * Math.PI * 2;
                  const x = orbitRadius * Math.cos(angle);
                  const y = 0;
                  const z = orbitRadius * Math.sin(angle);
                  child.receiveShadow = true;
                  asteroid.position.set(x, y, z);
                  asteroid.scale.setScalar(THREE.MathUtils.randFloat(0.8, 1.2));
                  scene.add(asteroid);
                  asteroids.push(asteroid);
              }
          }
      });
  }, undefined, function (error) {
      console.error('Se ha producido un error', error);
  });
}


// Material shader para el efecto día/noche de la Tierra
const earthMaterial = new THREE.ShaderMaterial({
  uniforms: {
    dayTexture: { type: "t", value: loadTexture.load(earthTexture) },
    nightTexture: { type: "t", value: loadTexture.load(earthNightTexture) },
    sunPosition: { type: "v3", value: sun.position }
  },
  vertexShader: `
    varying vec3 vNormal;
    varying vec2 vUv;
    varying vec3 vSunDirection;

    uniform vec3 sunPosition;

    void main() {
      vUv = uv;
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vNormal = normalize(modelMatrix * vec4(normal, 0.0)).xyz;
      vSunDirection = normalize(sunPosition - worldPosition.xyz);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D dayTexture;
    uniform sampler2D nightTexture;

    varying vec3 vNormal;
    varying vec2 vUv;
    varying vec3 vSunDirection;

    void main() {
      float intensity = max(dot(vNormal, vSunDirection), 0.0);
      vec4 dayColor = texture2D(dayTexture, vUv);
      vec4 nightColor = texture2D(nightTexture, vUv)* 0.2;
      gl_FragColor = mix(nightColor, dayColor, intensity);
    }
  `
});


// ******  LUNAS  ******
// Tierra
const earthMoon = [{
  size: 1.6,
  texture: earthMoonTexture,
  bump: earthMoonBump,
  orbitSpeed: 0.001 * settings.velocidadOrbital,
  orbitRadius: 10
}]

// Lunas de Marte con ruta a modelos 3D (Fobos y Deimos)
const marsMoons = [
  {
    modelPath: '/images/mars/phobos.glb',
    scale: 0.1,
    orbitRadius: 5,
    orbitSpeed: 0.002 * settings.velocidadOrbital,
    position: 100,
    mesh: null
  },
  {
    modelPath: '/images/mars/deimos.glb',
    scale: 0.1,
    orbitRadius: 9,
    orbitSpeed: 0.0005 * settings.velocidadOrbital,
    position: 120,
    mesh: null
  }
];

// Júpiter
const jupiterMoons = [
  {
    size: 1.6,
    texture: ioTexture,
    orbitRadius: 20,
    orbitSpeed: 0.0005 * settings.velocidadOrbital
  },
  {
    size: 1.4,
    texture: europaTexture,
    orbitRadius: 24,
    orbitSpeed: 0.00025 * settings.velocidadOrbital
  },
  {
    size: 2,
    texture: ganymedeTexture,
    orbitRadius: 28,
    orbitSpeed: 0.000125 * settings.velocidadOrbital
  },
  {
    size: 1.7,
    texture: callistoTexture,
    orbitRadius: 32,
    orbitSpeed: 0.00006 * settings.velocidadOrbital
  }
];

// ******  CREACIÓN DE PLANETAS  ******
const mercury = new createPlanet('Mercurio', 2.4, 40, 0, mercuryTexture, mercuryBump);
const venus = new createPlanet('Venus', 6.1, 65, 3, venusTexture, venusBump, null, venusAtmosphere);
const earth = new createPlanet('Tierra', 6.4, 90, 23, earthMaterial, null, null, earthAtmosphere, earthMoon);
const mars = new createPlanet('Marte', 3.4, 115, 25, marsTexture, marsBump)
// Cargar lunas de Marte
marsMoons.forEach(moon => {
  loadObject(moon.modelPath, moon.position, moon.scale, function(loadedModel) {
    moon.mesh = loadedModel;
    mars.planetSystem.add(moon.mesh);
    moon.mesh.traverse(function (child) {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  });
});

const jupiter = new createPlanet('Júpiter', 69/4, 200, 3, jupiterTexture, null, null, null, jupiterMoons);
const saturn = new createPlanet('Saturno', 58/4, 270, 26, saturnTexture, null, {
  innerRadius: 18, 
  outerRadius: 29, 
  texture: satRingTexture
});
const uranus = new createPlanet('Urano', 25/4, 320, 82, uranusTexture, null, {
  innerRadius: 6, 
  outerRadius: 8, 
  texture: uraRingTexture
});
const neptune = new createPlanet('Neptuno', 24/4, 340, 28, neptuneTexture);
const pluto = new createPlanet('Plutón', 1, 350, 57, plutoTexture)

  // ******  DATOS DE LOS PLANETAS  ******
  const planetData = {
    'Mercurio': {
        radio: '2.439,7 km',
        inclinacion: '0,034°',
        rotacion: '58,6 días terrestres',
        orbita: '88 días terrestres',
        distancia: '57,9 millones de km',
        lunas: '0',
        info: 'El planeta más pequeño del sistema solar y el más cercano al Sol.'
    },
    'Venus': {
        radio: '6.051,8 km',
        inclinacion: '177,4°',
        rotacion: '243 días terrestres',
        orbita: '225 días terrestres',
        distancia: '108,2 millones de km',
        lunas: '0',
        info: 'Segundo planeta desde el Sol, conocido por sus temperaturas extremas y su densa atmósfera.'
    },
    'Tierra': {
        radio: '6.371 km',
        inclinacion: '23,5°',
        rotacion: '24 horas',
        orbita: '365 días',
        distancia: '150 millones de km',
        lunas: '1 (Luna)',
        info: 'Tercer planeta desde el Sol y el único conocido que alberga vida.'
    },
    'Marte': {
        radio: '3.389,5 km',
        inclinacion: '25,19°',
        rotacion: '1,03 días terrestres',
        orbita: '687 días terrestres',
        distancia: '227,9 millones de km',
        lunas: '2 (Fobos y Deimos)',
        info: 'Conocido como el Planeta Rojo, famoso por su aspecto rojizo y su potencial para la colonización humana.'
    },
    'Júpiter': {
        radio: '69.911 km',
        inclinacion: '3,13°',
        rotacion: '9,9 horas',
        orbita: '12 años terrestres',
        distancia: '778,5 millones de km',
        lunas: '95 lunas conocidas (Ganímedes, Calisto, Europa e Ío son las 4 mayores)',
        info: 'El planeta más grande del sistema solar, conocido por su Gran Mancha Roja.'
    },
    'Saturno': {
        radio: '58.232 km',
        inclinacion: '26,73°',
        rotacion: '10,7 horas',
        orbita: '29,5 años terrestres',
        distancia: '1.400 millones de km',
        lunas: '146 lunas conocidas',
        info: 'Distinguido por su extenso sistema de anillos, es el segundo planeta más grande del sistema solar.'
    },
    'Urano': {
        radio: '25.362 km',
        inclinacion: '97,77°',
        rotacion: '17,2 horas',
        orbita: '84 años terrestres',
        distancia: '2.900 millones de km',
        lunas: '27 lunas conocidas',
        info: 'Conocido por su singular rotación lateral y su color azul pálido.'
    },
    'Neptuno': {
        radio: '24.622 km',
        inclinacion: '28,32°',
        rotacion: '16,1 horas',
        orbita: '165 años terrestres',
        distancia: '4.500 millones de km',
        lunas: '14 lunas conocidas',
        info: 'El planeta más lejano del Sol en nuestro sistema solar, conocido por su intenso color azul.'
    },
    'Plutón': {
        radio: '1.188,3 km',
        inclinacion: '122,53°',
        rotacion: '6,4 días terrestres',
        orbita: '248 años terrestres',
        distancia: '5.900 millones de km',
        lunas: '5 (Caronte, Estigia, Nix, Cérbero e Hidra)',
        info: 'Clasificado originalmente como el noveno planeta, Plutón se considera ahora un planeta enano.'
    }
};


// Array de planetas y atmósferas para raycasting
const raycastTargets = [
  mercury.planet, venus.planet, venus.Atmosphere, earth.planet, earth.Atmosphere, 
  mars.planet, jupiter.planet, saturn.planet, uranus.planet, neptune.planet, pluto.planet
];

// ******  SOMBRAS  ******
renderer.shadowMap.enabled = true;
pointLight.castShadow = true;

// propiedades para la luz puntual
pointLight.shadow.mapSize.width = 1024;
pointLight.shadow.mapSize.height = 1024;
pointLight.shadow.camera.near = 10;
pointLight.shadow.camera.far = 20;

// proyección y recepción de sombras
earth.planet.castShadow = true;
earth.planet.receiveShadow = true;
earth.Atmosphere.castShadow = true;
earth.Atmosphere.receiveShadow = true;
earth.moons.forEach(moon => {
moon.mesh.castShadow = true;
moon.mesh.receiveShadow = true;
});
mercury.planet.castShadow = true;
mercury.planet.receiveShadow = true;
venus.planet.castShadow = true;
venus.planet.receiveShadow = true;
venus.Atmosphere.receiveShadow = true;
mars.planet.castShadow = true;
mars.planet.receiveShadow = true;
jupiter.planet.castShadow = true;
jupiter.planet.receiveShadow = true;
jupiter.moons.forEach(moon => {
  moon.mesh.castShadow = true;
  moon.mesh.receiveShadow = true;
  });
saturn.planet.castShadow = true;
saturn.planet.receiveShadow = true;
saturn.Ring.receiveShadow = true;
uranus.planet.receiveShadow = true;
neptune.planet.receiveShadow = true;
pluto.planet.receiveShadow = true;




function animate(){

  // rotar planetas alrededor del sol y sobre sí mismos
  sun.rotateY(0.001 * settings.velocidad);
  mercury.planet.rotateY(0.001 * settings.velocidad);
  mercury.planet3d.rotateY(0.004 * settings.velocidadOrbital);
  venus.planet.rotateY(0.0005 * settings.velocidad)
  venus.Atmosphere.rotateY(0.0005 * settings.velocidad);
  venus.planet3d.rotateY(0.0006 * settings.velocidadOrbital);
  earth.planet.rotateY(0.005 * settings.velocidad);
  earth.Atmosphere.rotateY(0.001 * settings.velocidad);
  earth.planet3d.rotateY(0.001 * settings.velocidadOrbital);
  mars.planet.rotateY(0.01 * settings.velocidad);
  mars.planet3d.rotateY(0.0007 * settings.velocidadOrbital);
  jupiter.planet.rotateY(0.005 * settings.velocidad);
  jupiter.planet3d.rotateY(0.0003 * settings.velocidadOrbital);
  saturn.planet.rotateY(0.01 * settings.velocidad);
  saturn.planet3d.rotateY(0.0002 * settings.velocidadOrbital);
  uranus.planet.rotateY(0.005 * settings.velocidad);
  uranus.planet3d.rotateY(0.0001 * settings.velocidadOrbital);
  neptune.planet.rotateY(0.005 * settings.velocidad);
  neptune.planet3d.rotateY(0.00008 * settings.velocidadOrbital);
  pluto.planet.rotateY(0.001 * settings.velocidad)
  pluto.planet3d.rotateY(0.00006 * settings.velocidadOrbital)

// Animar la Luna de la Tierra
if (earth.moons) {
  earth.moons.forEach(moon => {
    const time = performance.now();
    const tiltAngle = 5 * Math.PI / 180;

    const moonX = earth.planet.position.x + moon.orbitRadius * Math.cos(time * moon.orbitSpeed);
    const moonY = moon.orbitRadius * Math.sin(time * moon.orbitSpeed) * Math.sin(tiltAngle);
    const moonZ = earth.planet.position.z + moon.orbitRadius * Math.sin(time * moon.orbitSpeed) * Math.cos(tiltAngle);

    moon.mesh.position.set(moonX, moonY, moonZ);
    moon.mesh.rotateY(0.01);
  });
}
// Animar las lunas de Marte
if (marsMoons){
marsMoons.forEach(moon => {
  if (moon.mesh) {
    const time = performance.now();

    const moonX = mars.planet.position.x + moon.orbitRadius * Math.cos(time * moon.orbitSpeed);
    const moonY = moon.orbitRadius * Math.sin(time * moon.orbitSpeed);
    const moonZ = mars.planet.position.z + moon.orbitRadius * Math.sin(time * moon.orbitSpeed);

    moon.mesh.position.set(moonX, moonY, moonZ);
    moon.mesh.rotateY(0.001);
  }
});
}

// Animar las lunas de Júpiter
if (jupiter.moons) {
  jupiter.moons.forEach(moon => {
    const time = performance.now();
    const moonX = jupiter.planet.position.x + moon.orbitRadius * Math.cos(time * moon.orbitSpeed);
    const moonY = moon.orbitRadius * Math.sin(time * moon.orbitSpeed);
    const moonZ = jupiter.planet.position.z + moon.orbitRadius * Math.sin(time * moon.orbitSpeed);

    moon.mesh.position.set(moonX, moonY, moonZ);
    moon.mesh.rotateY(0.01);
  });
}

// Rotar asteroides
asteroids.forEach(asteroid => {
  asteroid.rotation.y += 0.0001;
  asteroid.position.x = asteroid.position.x * Math.cos(0.0001 * settings.velocidadOrbital) + asteroid.position.z * Math.sin(0.0001 * settings.velocidadOrbital);
  asteroid.position.z = asteroid.position.z * Math.cos(0.0001 * settings.velocidadOrbital) - asteroid.position.x * Math.sin(0.0001 * settings.velocidadOrbital);
});

// ****** CONTORNOS EN LOS PLANETAS ******
raycaster.setFromCamera(mouse, camera);

// Comprobar intersecciones
var intersects = raycaster.intersectObjects(raycastTargets);

// Restablecer todos los contornos
outlinePass.selectedObjects = [];

if (intersects.length > 0) {
  const intersectedObject = intersects[0].object;

  // Si el objeto intersectado es una atmósfera, buscar el planeta correspondiente
  if (intersectedObject === earth.Atmosphere) {
    outlinePass.selectedObjects = [earth.planet];
  } else if (intersectedObject === venus.Atmosphere) {
    outlinePass.selectedObjects = [venus.planet];
  } else {
    // Para el resto de planetas, resaltar el objeto intersectado directamente
    outlinePass.selectedObjects = [intersectedObject];
  }
}
// ******  ZOOM DE ACERCAMIENTO/ALEJAMIENTO  ******
if (isMovingTowardsPlanet) {
  // Mover la cámara suavemente hacia la posición objetivo
  camera.position.lerp(targetCameraPosition, 0.03);

  // Comprobar si la cámara está cerca de la posición objetivo
  if (camera.position.distanceTo(targetCameraPosition) < 1) {
      isMovingTowardsPlanet = false;
      showPlanetInfo(selectedPlanet.name);

  }
} else if (isZoomingOut) {
  camera.position.lerp(zoomOutTargetPosition, 0.05);

  if (camera.position.distanceTo(zoomOutTargetPosition) < 1) {
      isZoomingOut = false;
  }
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
window.addEventListener('resize', function(){
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth,window.innerHeight);
  composer.setSize(window.innerWidth,window.innerHeight);
});
