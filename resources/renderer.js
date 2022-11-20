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
    camera.position.z = 25;
    camera.position.y = 10;

    // render the model
    renderer.render(scene, camera);

// animate
function animate() {
requestAnimationFrame( animate );

//collada.scene.rotation.x += 0.01;
collada.scene.rotation.y += 0.01;
//collada.scene.rotation.z += 0.01;

renderer.render(scene, camera);
};

animate();
});
