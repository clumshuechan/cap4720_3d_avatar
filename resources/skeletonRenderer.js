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

  console.log(`Left Forearm Pos: ${joints[5].position.x.toFixed(2)} ${joints[5].position.y.toFixed(2)} ${joints[5].position.z.toFixed(2)}`);

  let activeJointIndices = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

  // animate
  function animate() {
    requestAnimationFrame(animate);

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
          joints[i].quaternion.setFromAxisAngle(new THREE.Vector3(vec.axis[0], vec.axis[1], vec.axis[2]), -vec.angle);
        }

      }
    }

    renderer.render(scene, camera);
  };

  animate();
});
