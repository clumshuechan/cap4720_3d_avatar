// initlize scene and camera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);

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

// load stormtrooper
var textureLoader = new THREE.TextureLoader();
var texture = textureLoader.load("resources/models/Stormtrooper_D.jpg");
var material = new THREE.MeshBasicMaterial({map: texture});

// set up reference vectors for each part of the stormtrooper body
var jointNamesToPoseProperties = {
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
  };

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

// load stormtrooper into the world, along with animation based on tracking data
var model = loader.load('resources/models/Stormtrooper_D.dae', function(collada) {
    // debug collada file
    //console.log(collada.scene);
    //console.log(collada.scene.children[0]);

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

    const armature = scene.children[0].children[0]; // node, not joint
    console.log(armature);

    // get joint's from scene tree
    const torso = armature.children[0]; // hips
    const chest = torso.children[0]; //spine
    console.log(chest);

    const neck = chest.children[0].children[0].children[0]; //spine1, spine2, neck 
    const head = neck.children[0]; // Head

    const upperLeftArm = chest.children[0].children[0].children[1]; //LeftShoulder
    const lowerLeftArm = upperLeftArm.children[0].children[0]; //Leftarm, Left Forearm
    const leftHand = lowerLeftArm.children[0]; //Left Hand

    const upperRightArm = chest.children[0].children[0].children[2]; //RightShoulder
    const lowerRightArm = upperRightArm.children[0].children[0]; //Rightarm, Right Forearm
    const rightHand = lowerRightArm.children[0]; //Right Hand

    const upperLeftLeg = chest.children[1]; //LeftUpLeg
    const lowerLeftLeg = upperLeftLeg.children[0]; //LeftLeg
    const leftFoot = lowerLeftLeg.children[0]; //LeftFoot

    const upperRightLeg = chest.children[2]; //RightUpLeg
    const lowerRightLeg = upperRightLeg.children[0]; //RightLeg
    const rightFoot = lowerRightLeg.children[0]; //RightFoot


    // get joint's from scene tree
    /**
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
    const rightFoot = lowerRightLeg.children[0];**/

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
          if (joints[i] == null) continue; // debug
          const jointName = joints[i].name;
          const poseLandmark = trackedPose[jointNamesToPoseProperties[jointName]];
          if (poseLandmark == null) continue;
  
          let refVec = jointNamesToReferenceVectors[jointName];
  
          let vec = poseLandmark.rot;
          let pos = [...poseLandmark.pos];
  
          pos[0] -= refPoint[0];
          pos[1] -= refPoint[1];
          pos[2] -= refPoint[2];
  
          if (refVec != null) {
            joints[i].quaternion.setFromUnitVectors((new THREE.Vector3(refVec[0], refVec[1], refVec[2])).normalize(), (new THREE.Vector3(-vec[0], vec[1], vec[2])).normalize());
            joints[i].position.set(pos[0] * HORIZONTAL_TRACKING_SCALE, -pos[1] * VERTICAL_TRACKING_SCALE, pos[2] * DEPTH_TRACKING_SCALE);
          } else {
            let rotationAxis = new THREE.Vector3(vec.axis[0], vec.axis[1], vec.axis[2]);
            rotationAxis.transformDirection(new THREE.Matrix4().makeRotationX(Math.PI / 2));
            joints[i].quaternion.setFromAxisAngle(rotationAxis, vec.angle);
          }
        }
      }
  
      renderer.render(scene, camera);
    };
    
    animate();
});