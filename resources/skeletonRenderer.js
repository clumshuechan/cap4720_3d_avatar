console.log("Debug Test")

// initlize scene and camera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// render the viewport
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth / 2, window.innerHeight / 2);
document.getElementById('renderer-container').appendChild(renderer.domElement);

// instantiate collada loader
var loader = new THREE.ColladaLoader();

// load model texture
var textureLoader = new THREE.TextureLoader();

// set up directional light (needs fixing)
var light = new THREE.SpotLight(0xffffff);
light.position.set(0, 400, 0);
//scene.add(light);

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

// this 3D model is free to use under the Unlicense license
// which can be found here: https://github.com/TheThinMatrix/OpenGL-Animation/blob/master/LICENSE
var texture = textureLoader.load("resources/models/cowboyTexture.png");
var material = new THREE.MeshBasicMaterial({map: texture});

const HORIZONTAL_TRACKING_SCALE = 3;
const VERTICAL_TRACKING_SCALE = 2;
const DEPTH_TRACKING_SCALE = 3;

// maps the model's joint names to tracking data names
const jointNamesToPoseProperties = {
  'Chest': 'body',
  'Neck': 'neck',
  'Head': 'head',
  'Upper_Arm_L': 'leftBicep',
  'Lower_Arm_L': 'leftForearm',
  'Hand_L': 'leftHand',
  'Upper_Arm_R': 'rightBicep',
  'Lower_Arm_R': 'rightForearm',
  'Hand_R': 'rightHand',
  'Upper_Leg_L': 'leftThigh',
  'Lower_Leg_L': 'leftCalf',
  'Foot_L': 'leftFoot',
  'Upper_Leg_R': 'rightThigh',
  'Lower_Leg_R': 'rightCalf',
  'Foot_R': 'rightFoot'
};

const jointNamesToReferenceVectors = {
  'Chest': [0, -1, 0],
  'Neck': [0, -1, 0],
  'Head': null,
  'Upper_Arm_L': [0, -1, 0],
  'Lower_Arm_L': null,
  'Hand_L': null,
  'Upper_Arm_R': [0, -1, 0],
  'Lower_Arm_R': null,
  'Hand_R': null,
  'Upper_Leg_L': [0, -1, 0],
  'Lower_Leg_L': null,
  'Foot_L': null,
  'Upper_Leg_R': [0, -1, 0],
  'Lower_Leg_R': null,
  'Foot_R': null
};

// camera orientation constants
const cameraDistanceToCenter = 10;
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
var model = loader.load('resources/models/cowboyModel.dae', function(collada) {
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

  const armature = scene.children[0].children[1]; // node, not joint

  // get joint's from scene tree
  const torso = armature.children[0];
  const chest = torso.children[0];

  const neck = chest.children[0];
  const head = neck.children[0];

  const upperLeftArm = chest.children[1];
  const lowerLeftArm = upperLeftArm.children[0];
  const leftHand = lowerLeftArm.children[0];

  const upperRightArm = chest.children[2];
  const lowerRightArm = upperRightArm.children[0];
  const rightHand = lowerRightArm.children[0];

  const upperLeftLeg = torso.children[1];
  const lowerLeftLeg = upperLeftLeg.children[0];
  const leftFoot = lowerLeftLeg.children[0];

  const upperRightLeg = torso.children[2];
  const lowerRightLeg = upperRightLeg.children[0];
  const rightFoot = lowerRightLeg.children[0];

  // create array of joints to iterate over while animating
  const joints = [
    torso,
    chest,
    neck,
    head,
    upperLeftArm,
    lowerLeftArm,
    leftHand,
    upperRightArm,
    lowerRightArm,
    rightHand,
    upperLeftLeg,
    lowerLeftLeg,
    leftFoot,
    upperRightLeg,
    lowerRightLeg,
    rightFoot
  ];

  let activeJointIndices = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

  // animate
  function animate() {
    requestAnimationFrame(animate);

    // animate camera orientation as user
    // presses arrow keys
    updateCameraOrientation();

    if (trackedPose) {
      let refPoint = trackedPose.feetMidpoint;

      // update all joints based on tracking data
      // for (let i = 0; i < joints.length; i++) {
      for (let i of activeJointIndices) {
        const jointName = joints[i].name;
        const poseLandmark = trackedPose[jointNamesToPoseProperties[jointName]];
        if (poseLandmark == null) continue;

        let refVec = jointNamesToReferenceVectors[jointName];

        let vec = poseLandmark.rot;
        let pos = [...poseLandmark.pos];

        pos[0] -= refPoint[0];
        pos[1] -= refPoint[1];
        pos[2] -= refPoint[2];

        // if (refVec == null && i != 0) {
        //   let a = joints[i - 1].position;
        //   let b = joints[i].position;
        //   refVec = [b.x - a.x, b.y - a.y, b.z - a.z];
        //   // I think that this calculation is wrong
        //   // and that is why child nodes aren't animating correctly
        // }

        if (refVec != null) {
          joints[i].quaternion.setFromUnitVectors((new THREE.Vector3(refVec[0], refVec[1], refVec[2])).normalize(), (new THREE.Vector3(-vec[0], vec[1], vec[2])).normalize());
          joints[i].position.set(pos[0] * HORIZONTAL_TRACKING_SCALE, -pos[1] * VERTICAL_TRACKING_SCALE, pos[2] * DEPTH_TRACKING_SCALE);
        } else {
          joints[i].quaternion.setFromAxisAngle(new THREE.Vector3(vec.axis[0], vec.axis[1], vec.axis[2]).transformDirection(new THREE.Matrix4().makeRotationX(Math.PI / 2)), vec.angle);
        }

      }
    }

    renderer.render(scene, camera);
  };

  animate();
});