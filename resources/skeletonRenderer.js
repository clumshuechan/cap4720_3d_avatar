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
var texture = textureLoader.load("resources/models/character Texture.png");
var material = new THREE.MeshBasicMaterial({map: texture});

const HORIZONTAL_TRACKING_SCALE = 5;
const VERTICAL_TRACKING_SCALE = 5;
const DEPTH_TRACKING_SCALE = 5;

// maps the model's joint names to tracking data names
const jointNamesToPoseProperties = {
  'Torso': 'torso',
  'Chest': 'chest',
  'Neck': 'neck',
  'Head': 'head',
  'Upper_Arm_L': 'leftShoulder',
  'Lower_Arm_L': 'leftElbow',
  'Hand_L': 'leftHand',
  'Upper_Arm_R': 'rightShoulder',
  'Lower_Arm_R': 'rightElbow',
  'Hand_R': 'rightHand',
  'Upper_Leg_L': 'leftHip',
  'Lower_Leg_L': 'leftKnee',
  'Foot_L': 'leftFoot',
  'Upper_Leg_R': 'rightHip',
  'Lower_Leg_R': 'rightKnee',
  'Foot_R': 'rightFoot'
};

const jointNamesToReferenceVectors = {
  'Chest': [0, -1, 0],
  'Neck': null,
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

  initialStates = {};
  for (let joint of joints) {
    let parent = joint.parent;
    initialStates[joint.id] = [joint.position.clone(), joint.quaternion.clone(), joint.scale.clone()];
  }

  function eulerToVec(rotation) {
    return new THREE.Vector3(Math.cos(rotation.x) * Math.sin(rotation.y), Math.cos(rotation.y) * Math.sin(rotation.x), Math.sin(rotation.z)).normalize();
  }

  function getJointVec(joint) {
    let worldRotation = joint.quaternion.clone();
    let refVec = new THREE.Vector3(0, 1, 0);
    refVec.applyQuaternion(worldRotation);
    return refVec;
  }

  function setWorldJointState(joint, position, rotVec) {
    let parent = joint.parent;
    scene.attach(joint);
    let updateQuat = new THREE.Quaternion();
    let sourceQuat = joint.quaternion.clone();
    updateQuat.setFromUnitVectors(getJointVec(joint), new THREE.Vector3(rotVec[0], -rotVec[1], -rotVec[2]));
    updateQuat.multiply(sourceQuat);
    joint.quaternion.copy(updateQuat);
    joint.position.set(position[0] * HORIZONTAL_TRACKING_SCALE, -position[1] * VERTICAL_TRACKING_SCALE, -position[2] * DEPTH_TRACKING_SCALE);
    parent.attach(joint);
  }

  // animate
  function animate() {
    requestAnimationFrame(animate);

    // animate camera orientation as user
    // presses arrow keys
    updateCameraOrientation();

    if (trackedPose) {
      let refPoint = trackedPose.feetMidpoint;

      // reset joint states
      for (let joint of joints) {
        let parent = joint.parent;
        joint.position.copy(initialStates[joint.id][0]);
        joint.quaternion.copy(initialStates[joint.id][1]);
        joint.scale.copy(initialStates[joint.id][2]);
      }

      for (let joint of joints) {
        const jointName = joint.name;
        const poseLandmark = trackedPose[jointNamesToPoseProperties[jointName]];
        if (poseLandmark == null) {
          continue;
        }

        let vec = poseLandmark.rot;
        let pos = [...poseLandmark.pos];

        pos[0] -= refPoint[0];
        pos[1] -= refPoint[1];
        pos[2] -= refPoint[2];

        setWorldJointState(joint, pos, vec);
      }

      torso.rotation.x -= 0.3;
    }

    renderer.render(scene, camera);
  };

  animate();
});
