// initlize scene and camera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// render the viewport
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth / 2, window.innerHeight / 2);
document.getElementById('renderer-container').appendChild(renderer.domElement);

// instantiate collada loader
var loader = new THREE.ColladaLoader();

// load rayman texture
var textureLoader = new THREE.TextureLoader();
var texture = textureLoader.load("resources/models/Rayman.png");
var material = new THREE.MeshBasicMaterial({map: texture});

var raymanPartMap = [null, 'leftFoot', 'body', 'rightHand', 'leftHand', 'rightFoot', null, 'head'];
var raymanPartVectors = [null, [0, 1, 0], [0, -1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], null, [0, -1, 0]];

const TRACKING_SCALE = 8;

// load rayman
var model = loader.load('resources/models/raymanModel.dae', function(collada) {
  // display model info such as model extend, and etc. using console log
  console.log(collada.scene);

  // to display attributes found from console log above just follow this format
  // overall these console logs are just debug code to show my thinking
  console.log(collada.scene['up']);
  console.log(collada.scene['children'][0]);					// child mesh level 0
  console.log(collada.scene['children'][0].material);			// child mesh level 0's material attribute
  console.log(collada.scene['children'][0].geometry);			// child mesh level 0's geometry attribute
  console.log(collada.scene['children'][0].geometry.attributes.uv);

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

  raymanMesh = scene.children[0];
  for (let i = 0; i < raymanMesh.children.length; i++) {
    raymanMesh.children[i].geometry.center();
    raymanMesh.children[i].position.x = (i - raymanMesh.children.length / 2) * 4;
  }

  // animate
  function animate() {
    requestAnimationFrame( animate );

    //raymanMesh.children[2].rotation.z += 0.01;
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
