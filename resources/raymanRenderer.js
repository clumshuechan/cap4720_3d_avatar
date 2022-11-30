// initlize scene and camera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// render the viewport
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth / 2, window.innerHeight / 2);
document.getElementById('renderer-container').appendChild(renderer.domElement);

// instantiate collada loader
var loader = new THREE.ColladaLoader();

// Loading Skybox images
// These textures are licensed under a Creative Commons Attribution 3.0 Unported License.
// That can be found here: https://www.humus.name/index.php?page=Textures
const cubeLoader = new THREE.CubeTextureLoader();
const cubeTexture = cubeLoader.load([
  'resources/skybox/DaylightBox_Right.bmp',
  'resources/skybox/DaylightBox_Left.bmp',
  'resources/skybox/DaylightBox_Top.bmp',
  'resources/skybox/DaylightBox_Bottom.bmp',
  'resources/skybox/DaylightBox_Front.bmp',
  'resources/skybox/DaylightBox_Back.bmp',
]);
scene.background = cubeTexture;

// load rayman texture
var textureLoader = new THREE.TextureLoader();
var texture = textureLoader.load("resources/models/Rayman.png");
var material = new THREE.MeshBasicMaterial({map: texture});

var raymanPartMap = ['hair', 'leftFoot', 'body', 'rightHand', 'leftHand', 'rightFoot', 'eyes', 'head'];
var raymanPartVectors = [[0, -1, 0], [0, 1, 0], [0, -1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, -1, 0], [0, -1, 0]];

const TRACKING_SCALE = 8;

// camera orientation constants
const cameraDistanceToCenter = 15;
const cameraYOffset = 5;
const cameraRotationTheta = 0.1; // radians

// variables for camera rotation
let cameraVerticalAngle = 0;
let cameraHorizontalAngle = Math.PI / 2;
let panningDirection = '';

// set up arrow key event handlers
document.body.onkeydown = function(event) {
  if (event.keyCode == '38') {
    panningDirection = 'up';
  } else if (event.keyCode == '40') {
    panningDirection = 'down';
  } else if (event.keyCode == '37') {
    panningDirection = 'left';
  } else if (event.keyCode == '39') {
    panningDirection = 'right';
  }
};

document.body.onkeyup = function(event) {
  panningDirection = '';
};

function setInitialCameraOrientation() {
  camera.position.set(0, cameraYOffset, cameraDistanceToCenter);
  camera.lookAt(0, cameraYOffset, 0);
}

// animates camera rotation and position when the 
// user presses the arrow keys
function updateCameraOrientation() {
  if (panningDirection == '') {
    return;
  }

  if (panningDirection == 'up') {
    cameraVerticalAngle = Math.min(Math.PI / 2, cameraVerticalAngle + cameraRotationTheta);
  } else if (panningDirection == 'down') {
    cameraVerticalAngle = Math.max(-(Math.PI / 2), cameraVerticalAngle - cameraRotationTheta);
  } else if (panningDirection == 'left') {
    cameraHorizontalAngle = Math.min(1.5 * Math.PI, cameraHorizontalAngle + cameraRotationTheta);
  } else if (panningDirection == 'right') {
    cameraHorizontalAngle = Math.max(-(Math.PI / 2), cameraHorizontalAngle - cameraRotationTheta);
  }

  camera.position.x = cameraDistanceToCenter * Math.cos(cameraHorizontalAngle) * Math.cos(cameraVerticalAngle);
  camera.position.z = cameraDistanceToCenter * Math.sin(cameraHorizontalAngle) * Math.cos(cameraVerticalAngle);
  camera.position.y = cameraDistanceToCenter * Math.sin(cameraVerticalAngle) + cameraYOffset;

  camera.lookAt(0, cameraYOffset, 0);
}

// load rayman
var model = loader.load('resources/models/raymanModel.dae', function(collada) {
  // apply texture
  collada.scene.traverse(function(node) {
  if (node.isMesh) node.material = material;
  });

  // add model to scene
  scene.add(collada.scene);

  // position and orient camera
  setInitialCameraOrientation();

  // render the model
  renderer.render(scene, camera);

  raymanMesh = scene.children[0];
  for (let i = 0; i < raymanMesh.children.length; i++) {
    raymanMesh.children[i].geometry.center();
    raymanMesh.children[i].position.x = (i - raymanMesh.children.length / 2) * 4;
  }

  // animate
  function animate() {
    requestAnimationFrame( animate );

    updateCameraOrientation();

    if (trackedPose) {
      let refPoint = trackedPose.feetMidpoint;

      for (let i = 0; i < raymanMesh.children.length; i++) {
        if (!raymanPartMap[i]) continue;
        let vec = trackedPose[raymanPartMap[i]].rot;
        let refVec = raymanPartVectors[i];
        let pos = [...trackedPose[raymanPartMap[i]].pos];
        pos[0] -= refPoint[0];
        pos[1] -= refPoint[1];
        pos[2] -= refPoint[2];
        
        raymanMesh.children[i].quaternion.setFromUnitVectors(new THREE.Vector3(refVec[0], refVec[1], refVec[2]), new THREE.Vector3(-vec[0], vec[1], -vec[2]));
        raymanMesh.children[i].position.set(pos[0] * TRACKING_SCALE, -pos[1] * TRACKING_SCALE, -pos[2] * TRACKING_SCALE);
      }
    }

    renderer.render(scene, camera);
  };

  animate();
});
