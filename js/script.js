let Colors = {
  red: 0xf25346,
  white: 0xd8d0d1,
  pink: 0x59322e,
  brown: 0xf5986e,
  darkBrown: 0x23190f,
  blue: 0x68c3c0,
};

let camera,
  fieldOfView,
  aspectRatio,
  nearPlane,
  farPlane,
  HEIGHT,
  WIDTH,
  renderer,
  container;

let mousePos = { x: 0, y: 0 };

function createScene() {
  // Getting the height and the width of the screen
  // So we can use accurate figures for aspect ratio and size of the renderer.

  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;

  //  New scene
  scene = new THREE.Scene();

  // Creating the camera
  aspectRatio = WIDTH / HEIGHT; // mostly for proportional rendering more like the screen resolution
  fieldOfView = 60; // extent of the scene that is displayed at any given moment
  nearPlane = 1;
  farPlane = 10000;

  camera = new THREE.PerspectiveCamera(
    fieldOfView,
    aspectRatio,
    nearPlane,
    farPlane
  );

  // Adding fog to the screen with the same color as the background color acts like opacity.
  scene.fog = new THREE.Fog(0xf7d9aa, 100, 950);

  // Camera position is in 3D plane
  camera.position.x = 0;
  camera.position.y = 100;
  camera.position.z = 200;

  // Creating the renderer
  renderer = new THREE.WebGLRenderer({
    // To allow transparency with respect to the background color
    alpha: true,

    // Anti aliasing is a method of smoothing textures and rough lines
    antialias: true,
  });

  // Defining the renderer's size and it should fill the whole viewport
  renderer.setSize(WIDTH, HEIGHT);

  // Enabling shadow rendering to show reflection on the "floor"
  renderer.shadowMap.enabled = true;

  // Adding the renderer to the document
  container = document.getElementById('world');
  container.appendChild(renderer.domElement);

  // This listens to the screen incase a user resizes the window
  // so the object and the camera are well updated.
  window.addEventListener('resize', handleWindowResize, false);
}

function handleWindowResize() {
  // Handles the screen resize properly
  // updates the aspect ratio and the renderer's sizes

  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;
  renderer.setSize(WIDTH, HEIGHT);
  camera.aspect = WIDTH / HEIGHT;
  camera.updateProjectionMatrix();
}

let hemisphereLight, shadowLight;

function createLights() {
  // A hemisphere light is a gradient coloured light
  // the parameters are sky color, ground color and the intensity of the light
  hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, 0.9);

  // Directional light shines from a specific direction
  // It is like a touch light and helps to cast a shadow
  shadowLight = new THREE.DirectionalLight(0xffffff, 0.9);

  // Setting the position of the shadow light
  shadowLight.position.set(150, 350, 350);

  //  Allow shadow casting
  shadowLight.castShadow = true;

  // define the visible area of the projected shadow
  shadowLight.shadow.camera.left = -400;
  shadowLight.shadow.camera.right = 400;
  shadowLight.shadow.camera.top = 400;
  shadowLight.shadow.camera.bottom = -400;
  shadowLight.shadow.camera.near = 1;
  shadowLight.shadow.camera.far = 1000;

  // define the resolution of the shadow, the higher the better
  // also the more expensive and less performant
  shadowLight.shadow.mapSize.width = 2048;
  shadowLight.shadow.mapSize.height = 2048;

  // To initialize the light is as simple as adding it
  scene.add(hemisphereLight);
  scene.add(shadowLight);
}

// Creating the objects that we are going to need
Sea = function() {
  //  Defining the dimensions of the cylinder.
  // Takes on the parameters radius top, radius bottom, height, number of segment,
  const geom = new THREE.CylinderGeometry(600, 600, 800, 40, 10);

  // rotate to the x-axis
  geom.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));

  // Create the material
  let mat = new THREE.MeshPhongMaterial({
    color: Colors.blue,
    transparent: true,
    opacity: 0.6,
    shading: THREE.FlatShading,
  });

  // Creating an object
  this.mesh = new THREE.Mesh(geom, mat);

  // ALlowing the sea to recieve shadows cast on it.
  this.mesh.receiveShadow = true;
};

let sea;

function createSea() {
  sea = new Sea();

  // Setting the position of the sea on the Scene
  sea.mesh.position.y = -600;
  scene.add(sea.mesh);
}

Cloud = function() {
  this.mesh = new THREE.Object3D();
  this.mesh.name = 'cloud';

  // create a cube geometry
  const geom = new THREE.CubeGeometry(20, 20, 20);

  // white material for cloud color.
  const mat = new THREE.MeshPhongMaterial({
    color: Colors.white,
  });

  let nBlocks = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < nBlocks; i++) {
    // create the mesh by cloning the geometry
    let m = new THREE.Mesh(geom.clone(), mat);

    // Set the positon and rotation of the cube randomly
    m.position.x = i * 15;
    m.position.y = Math.random() * 10;
    m.position.z = Math.random() * 10;
    m.rotation.y = Math.random() * Math.PI * 2;
    m.rotation.z = Math.random() * Math.PI * 2;

    // set the size of the cube randomly
    let s = 0.1 + Math.random() * 0.9;
    m.scale.set(s, s, s);
    m.castShadow = true;
    m.receiveShadow = true;

    // add the cube to the container
    this.mesh.add(m);
  }
};

Sky = function() {
  // Created an empty container
  this.mesh = new THREE.Object3D();

  //  nUmber of clouds in total
  this.nClouds = 20;

  this.clouds = [];

  // For proper cloud distribution
  const stepAngle = (Math.PI * 2) / this.nClouds;

  // Creating the clouds
  for (let i = 0; i < this.nClouds; i++) {
    let c = new Cloud();
    this.clouds.push(c);

    // setting rotation and position of each cloud
    let a = stepAngle * i;
    let h = 750 + Math.random() * 200;

    // Converting polar coordinates into Cartesian coordinates
    c.mesh.position.x = Math.sin(a) * h;
    c.mesh.position.y = Math.cos(a) * h;

    // rotate the cloud according to its position
    c.mesh.rotation.z = a + Math.PI / 2;

    // Position clouds at random depths in the scene
    c.mesh.position.z = -400 - Math.random() * 400;

    // Random scale setting for size.
    let s = 1 + Math.random() * 2;
    c.mesh.scale.set(s, s, s);

    // adding the mesh into the parent scene
    this.mesh.add(c.mesh);
  }
};

let sky;

function createSky() {
  sky = new Sky();
  sky.mesh.position.y = -600;
  scene.add(sky.mesh);
}

AirPlane = function() {
  this.mesh = new THREE.Object3D();

  // Creating the cabin
  const geomCockpit = new THREE.BoxGeometry(60, 50, 50, 1, 1, 1);
  const matCockpit = new THREE.MeshPhongMaterial({
    color: Colors.red,
    shading: THREE.FlatShading,
  });
  const cockpit = new THREE.Mesh(geomCockpit, matCockpit);
  cockpit.castShadow = true;
  cockpit.receiveShadow = true;
  this.mesh.add(cockpit);

  // Creating the engine
  const geomEngine = new THREE.BoxGeometry(20, 50, 50, 1, 1, 1);
  const matEngine = new THREE.MeshPhongMaterial({
    color: Colors.white,
    shading: THREE.FlatShading,
  });
  const engine = new THREE.Mesh(geomEngine, matEngine);
  engine.position.x = 40;
  engine.castShadow = true;
  engine.receiveShadow = true;
  this.mesh.add(engine);

  // create the tail
  const geomTail = new THREE.BoxGeometry(15, 20, 5, 1, 1, 1);
  const matTail = new THREE.MeshPhongMaterial({
    color: Colors.red,
    shading: THREE.FlatShading,
  });
  const tail = new THREE.Mesh(geomTail, matTail);
  tail.position.set(-35, 25, 0);
  tail.castShadow = true;
  tail.receiveShadow = true;
  this.mesh.add(tail);

  // Creating the wing
  const geomWing = new THREE.BoxGeometry(40, 8, 150, 1, 1, 1);
  const matWing = new THREE.MeshPhongMaterial({
    color: Colors.white,
    shading: THREE.FlatShading,
  });
  const wing = new THREE.Mesh(geomWing, matWing);
  wing.castShadow = true;
  wing.receiveShadow = true;
  this.mesh.add(wing);

  // Creating the propeller
  const geomPropeller = new THREE.BoxGeometry(20, 10, 10, 1, 1, 1);
  const matPropeller = new THREE.MeshPhongMaterial({
    color: Colors.brown,
    shading: THREE.FlatShading,
  });
  this.propeller = new THREE.Mesh(geomPropeller, matPropeller);
  this.propeller.castShadow = true;
  this.propeller.receiveShadow = true;

  // Blade
  const geomBlade = new THREE.BoxGeometry(1, 100, 10, 1, 1, 1);
  const matBlade = new THREE.MeshPhongMaterial({
    color: Colors.darkBrown,
    shading: THREE.FlatShading,
  });

  const blade = new THREE.Mesh(geomBlade, matBlade);
  blade.position.set(8, 0, 0);
  blade.castShadow = true;
  blade.receiveShadow = true;
  this.propeller.add(blade);
  this.propeller.position.set(50, 0, 0);
  this.mesh.add(this.propeller);
};

let airPlane;

createPlane = () => {
  airPlane = new AirPlane();
  airPlane.mesh.scale.set(0.25, 0.25, 0.25);
  airPlane.mesh.position.y = 100;
  scene.add(airPlane.mesh);
};

normalize = (v, vmin, vmax, tmin, tmax) => {
  let nv = Math.max(Math.min(v, vmax), vmin);
  let dv = vmax - vmin;
  let pc = (nv - vmin) / dv;
  let dt = tmax - tmin;
  let tv = tmin + pc * dt;

  return tv;
};

updatePlane = () => {
  let targetY = normalize(mousePos.y, -0.75, 0.75, 25, 175);
  let targetX = normalize(mousePos.x, -0.75, 0.75, -100, 100);

  airPlane.mesh.position.x = targetX;
  airPlane.mesh.position.y = targetY;

  airPlane.propeller.rotation.x += 0.3;
};

loop = () => {
  updatePlane();

  sea.mesh.rotation.z += 0.005;
  sky.mesh.rotation.z += 0.01;

  // calling the renderer
  renderer.render(scene, camera);

  // the looping
  requestAnimationFrame(loop);
};

function myNotes() {
  // NOTES
  // A scene is where every object needs to be added before they can be rendered
  // Camera determines the angle you are viewing from could be persepective or othographic
  // A renderer displays the scene using WebGL
  // Objects are the things that you want to render.
  // A renderer consists of a scene and camera(s) at the basic setup up.
  // A scene consists of letious objects which are referred to as Mesh
  // A mesh consist of a geometry and a material.
  // The geometry is majorly about the shape/dimension of the object.
  // The material deals majorly with the texture and describes the surface properties.
  // Both the geometry and the texture can be imported from external resources.
}

handleMouseMove = event => {
  let tx = -1 + (event.clientX / WIDTH) * 2;
  let ty = 1 - (event.clientY / HEIGHT) * 2;

  mousePos = { x: tx, y: ty };
};

function init() {
  // Setup the scene and the camera
  createScene();

  // add the Lights
  createLights();

  // add the aesthetics/objects
  createSky();
  createPlane();
  createSea();

  // listener for mouse movement
  document.addEventListener('mousemove', handleMouseMove, false);

  // start a loop that will update the object's position
  // and render the scene on each frame
  loop();
}

window.addEventListener('load', init, false);
