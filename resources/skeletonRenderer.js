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

// Loading Skybox images
// These textures are licensed under a Creative Commons Attribution 3.0 Unported License.
// That can be found here: https://www.humus.name/index.php?page=Textures
const cubeLoader = new THREE.CubeTextureLoader();
const cubeTexture = cubeLoader.load([
  'resources/skybox/DaylightBox_Front.bmp',
  'resources/skybox/DaylightBox_Back.bmp',
  'resources/skybox/DaylightBox_Top.bmp',
  'resources/skybox/DaylightBox_Back.bmp',
  'resources/skybox/DaylightBox_Right.bmp',
  'resources/skybox/DaylightBox_Left.bmp',
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

// load rayman
var model = loader.load('resources/models/cowboyModel.dae', function(collada) {
  // apply texture
  collada.scene.traverse(function(node) {
  if (node.isMesh) node.material = material;
  });

  // add model to scene
  scene.add(collada.scene);

  // position camera
  camera.position.z = 10;
  camera.position.y = 5;
  
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

  for (let i = 0; i < joints.length; ++i) {
    joints[i].inverseTransformMatrix = joints[i].worldMatrix.clone().inverse();
  }

  let activeJointIndices = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

  // animate
  function animate() {
    requestAnimationFrame(animate);

    if (trackedPose) {
      let referencePoint = trackedPose.feetMidpoint;

      // update all joints based on tracking data
      // for (let i = 0; i < joints.length; i++) {
      for (let i of activeJointIndices) {
        const jointName = joints[i].name;

        const poseLandmark = trackedPose[jointNamesToPoseProperties[jointName]];
        if (poseLandmark == null) continue;

        let referenceVec = jointNamesToReferenceVectors[jointName];

        let fromRotationVector = poseLandmark.rot.fromVector;
        let toRotationVector = poseLandmark.rot.toVector;
        let positionVec = poseLandmark.pos;

        // new_trans_matrix
        const rotationQuaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(fromRotationVector[0], fromRotationVector[1], fromRotationVector[2]).normalize(), new THREE.Vector3(-toRotationVector[0], toRotationVector[1], -toRotationVector[2]).normalize());
        const trackingTransformMatrix = new THREE.Matrix4().makeTranslation(positionVec[0], positionVec[1], positionVec[2]).makeRotationFromQuaternion(rotationQuaternion);
        joints[i].matrixWorld.set(trackingTransformMatrix.multiply(joints[i].inverseTransformMatrix));

        // if (referenceVec != null) {
        //   joints[i].position.set(positionVec[0] * HORIZONTAL_TRACKING_SCALE, -positionVec[1] * VERTICAL_TRACKING_SCALE, positionVec[2] * DEPTH_TRACKING_SCALE);
        // }

        // joints[i].position.set(positionVec[0] * HORIZONTAL_TRACKING_SCALE, -positionVec[1] * VERTICAL_TRACKING_SCALE, positionVec[2] * DEPTH_TRACKING_SCALE);
        // joints[i].quaternion.setFromAxisAngle(new THREE.Vector3(rotationAxis[0], rotationAxis[1], rotationAxis[2]), -rotationAngle);
        // joints[i].quaternion.setFromUnitVectors(new THREE.Vector3(fromRotationVector[0], fromRotationVector[1], fromRotationVector[2]).normalize(), new THREE.Vector3(-toRotationVector[0], toRotationVector[1], -toRotationVector[2]).normalize());
      }
    }

    renderer.render(scene, camera);
  };

  animate();
});