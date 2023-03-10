
import * as THREE from 'three';
import { AnimationAction, Vector3 } from 'three';
import globeNormal from './assets/globe-normal.png';
import * as dat from 'dat.gui'


/**
 * Scene
 */
var scene = new THREE.Scene();


/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
};

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    // Update camera
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    // Update renderer
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});


/**
 * Camera
 */
// Perspective camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.5, 2000);
const cameraBaseZ = 100;
camera.position.x = 0;
camera.position.y = 0;
camera.position.z = cameraBaseZ;
scene.add(camera);


/**
 * Canvas
 */
var canvas = document.createElement('canvas');
canvas.style.position = 'sticky';
canvas.style.top = 0;
canvas.style.left = 0;
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true
});


/**
 * Renderer
 */
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));


/**
 * Light
 */
// Point Light
const pointLight = new THREE.PointLight(0xF5F5DC, 1);
pointLight.position.set(-0.46, 0.47, 80);
scene.add(pointLight);


// Ambient Light
const ambientLight = new THREE.AmbientLight( 0x404040, 2 ); // soft white light
scene.add( ambientLight );


/**
 * Sphere
 */
const sphereMinZoom = 50;
var geometry = new THREE.SphereGeometry(sphereMinZoom, 50, 50, 0, Math.PI * 2, 0, Math.PI * 2);;
var material = new THREE.MeshStandardMaterial();
material.metalness = 0.5
material.roughness = 0.9
const textureLoader = new THREE.TextureLoader();
const normalTexture = textureLoader.load(globeNormal);
material.normalMap = normalTexture;
var sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);


var geometry2 = new THREE.SphereGeometry(0.5, 50, 50, 0, Math.PI * 2, 0, Math.PI * 2);;
var material2 = new THREE.MeshStandardMaterial();
material2.color = (0xFFFFFF);
material2.metalness = 0.5
material2.roughness = 0.9
var sphere2 = new THREE.Mesh(geometry2, material2);
scene.add(sphere2);
sphere2.position.z = 50;
sphere.attach(sphere2);

/**
 * Raycaster
 */
const raycaster = new THREE.Raycaster();


/**
 * Pointer, pointer events
 */
const pointer = new THREE.Vector2();
const lastPointer = new THREE.Vector2(0, 0);
var globeGrabbed = false;

// Pointer down
var pointerdown = function ( event ) {

	raycaster.setFromCamera({x: pointer.x, y: pointer.y}, camera);
	const intersect = raycaster.intersectObject(sphere, false);

	if (intersect.length > 0) {	// If pointer intersects the globe, mark it as grabbed
		globeGrabbed = true;
	}

}

// Pointer up
var pointerup = function ( event ) {

	globeGrabbed = false;

}

// Pointer move
var pointermove = function ( event ) {

	if (globeGrabbed) {
		lastPointer.x = pointer.x;
		lastPointer.y = pointer.y;
	}

	pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

	if (globeGrabbed) {	// Change the globe rotation if grabbed

		sphere.rotation.y += pointer.x - lastPointer.x;
		sphere.rotation.x -= pointer.y - lastPointer.y;

	}

}


/**
 * Scroll event
 */
var scroll = function ( event ) {

	camera.position.z = cameraBaseZ - (window.scrollY / document.getElementById('main-area-1').clientHeight);	// Zoom camera in and out

}


/**
 * Animation
 */
const animationMixer = new THREE.AnimationMixer( camera );
const globeSetupAnimationClip = new THREE.AnimationClip(
	'globeSetup', -1,
	[new THREE.VectorKeyframeTrack('.position', [0, 2], [
		0,10,20, 0,0,cameraBaseZ
	], THREE.InterpolateSmooth)]
	);
const globeSetupAnimationAction = animationMixer.clipAction(
	globeSetupAnimationClip
);
globeSetupAnimationAction.loop = THREE.LoopOnce;


/**
 * Onload event
 */
var onLoad = function ( event ) {

	window.scroll({
		top: 0,
		left: 0,
		behavior: 'smooth'
	  });

}


/**
 * Gui
 */
const gui = new dat.GUI();
const cameraGui = gui.addFolder('camera');
cameraGui.add(camera.position, 'x', -3, 3);
cameraGui.add(camera.position, 'y', -3, 3);
cameraGui.add(camera.position, 'z', -3, 3);
cameraGui.add(camera, 'fov', -100, 100);
cameraGui.add(camera, 'near', -100, 100);
cameraGui.add(camera, 'far', -100, 100);
const lightGui = gui.addFolder('point light');
lightGui.add(pointLight.position, 'y').min(-3).max(3).step(0.01);
lightGui.add(pointLight.position, 'x').min(-3).max(3).step(0.01);
lightGui.add(pointLight.position, 'z').min(-3).max(3).step(0.01);
const ambientGui = gui.addFolder('ambient light');
ambientGui.add(ambientLight, 'intensity').min(1).max(10).step(0.01);


/**
 * Renderer
 */
const clock = new THREE.Clock();

var render = function () {
    requestAnimationFrame(render);

	// Update sphere rotation

    sphere.rotation.y += 0.0005;

	// you must do this every frame
	const delta = clock.getDelta();
	animationMixer.update(delta);

    renderer.render(scene, camera);
};


/**
 * Globe setup
 */
export function setupGlobe() {

	document.getElementById('main-area-1').style.display = 'block';
	document.getElementById('main-area-1').style.height = '400vh';
	document.getElementById('main-area-1').replaceChildren(canvas);

	window.addEventListener('pointerdown', pointerdown);
	window.addEventListener('pointerup', pointerup);
	window.addEventListener('pointermove', pointermove);
	window.addEventListener('scroll', scroll);
	window.addEventListener('load', onLoad);

	render();

	globeSetupAnimationAction.play();
	globeSetupAnimationAction.reset();

}
