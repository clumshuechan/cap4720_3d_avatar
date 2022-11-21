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

const TRACKING_SCALE = 8;

const jointNamesToPoseProperties = {
  'Torso': 'body',
  // 'Chest': '',
  // 'Neck': '',
  'Head': 'head',
  'Upper_Arm_L': 'leftHand',
  // 'Lower_Arm_L': '',
  // 'Hand_L': '',
  'Upper_Arm_R': 'rightHand',
  // 'Lower_Arm_R': '',
  // 'Hand_R': '',
  'Upper_Leg_L': 'leftFoot',
  // 'Lower_Leg_L': '',
  // 'Foot_L': '',
  'Upper_Leg_R': 'rightFoot',
  // 'Lower_Leg_R': '',
  // 'Foot_R': '',
};

// load rayman
var model = loader.load('resources/models/cowboyModel.dae', function(collada) {
  // // display model info such as model extend, and etc. using console log
  // console.log('test' + collada.scene.children[1].children);
  //
  // // to display attributes found from console log above just follow this format
  // // overall these console logs are just debug code to show my thinking
  // console.log(collada.scene['up']);
  // console.log(collada.scene['children'][0]);					// child mesh level 0
  // console.log(collada.scene['children'][0].material);			// child mesh level 0's material attribute
  // console.log(collada.scene['children'][0].geometry);			// child mesh level 0's geometry attribute
  // // console.log(collada.scene['children'][0].geometry.attributes.uv);

  // apply texture
  collada.scene.traverse(function(node) {
  if (node.isMesh) node.material = material;
  });

  // add model to scene
  scene.add(collada.scene);

  // position camera
  camera.position.z = 35;
  camera.position.y = 10;
  camera.rotation.x -= 3.1415 / 8

  // render the model
  renderer.render(scene, camera);

  const armature = scene.children[0].children[1]; // node

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

  const referenceVectors = [
    [0, -1, 0],
    null,
    null,
    [0, -1, 0],
    [0, 1, 0],
    null,
    null,
    [0, 1, 0],
    null,
    null,
    [0, 1, 0],
    null,
    null,
    [0, 1, 0],
    null,
    null
  ];

  // for (let i = 0; i < joints.length; i++) {
  //   joints[i].geometry.center();
  //   joints[i].position.x = (i - joints.length / 2) * 4;
  // }

  // animate
  function animate() {
    requestAnimationFrame( animate );

    //modelMesh.children[2].rotation.z += 0.01;
    if (trackedPose) {
      let refPoint = trackedPose.feetMidpoint;

      for (let i = 0; i < joints.length; i++) {
        if (!jointNamesToPoseProperties[joints[i].name]) continue;
        const poseLandmark = trackedPose[jointNamesToPoseProperties[joints[i].name]];

        let refVec = referenceVectors[i];
        let vec = poseLandmark.rot;
        let pos = [...poseLandmark.pos];


        pos[0] -= refPoint[0];
        pos[1] -= refPoint[1];
        pos[2] -= refPoint[2];

        joints[i].quaternion.setFromUnitVectors(new THREE.Vector3(refVec[0], refVec[1], refVec[2]), new THREE.Vector3(-vec[0], vec[1], -vec[2]));
        joints[i].position.set(pos[0] * TRACKING_SCALE, -pos[1] * TRACKING_SCALE, -pos[2] * TRACKING_SCALE);
      }
    }

    renderer.render(scene, camera);
  };

  animate();
});
