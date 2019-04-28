import * as THREE from 'three';
import "../styles/components/loader.scss";
import { playerHealth } from "../app.js";



(function(){var script=document.createElement('script');script.onload=function(){var stats=new Stats();document.body.appendChild(stats.dom);requestAnimationFrame(function loop(){stats.update();requestAnimationFrame(loop)});};script.src='//rawgit.com/mrdoob/stats.js/master/build/stats.min.js';document.head.appendChild(script);})()

export let scene = new THREE.Scene();
export let renderer = new THREE.WebGLRenderer();

let width = window.innerWidth - 10;
let height = window.innerHeight - 10;
renderer.setSize( width, height );
document.body.appendChild( renderer.domElement );

export let camera = new THREE.PerspectiveCamera( 45, width / height, 0.1, 1000 );
scene.add( camera );

camera.position.z = 100;

window.addEventListener('resize', () => {
	width = window.innerWidth - 10;
	height = window.innerHeight - 10;
	renderer.setSize(width, height);
	camera.aspect = width/height;
	camera.updateProjectionMatrix();
});

export let objects = [];

export let character;
let standing;
let leftFoot;
let rightFoot;
let jumping;

export const init = () => {
	character = {
		mesh: null,
		texture: null
	}
	let geometry = new THREE.PlaneGeometry( 8, 8, 32 );

	standing = new THREE.TextureLoader().load(require('../pics/standing.png'));
	leftFoot = new THREE.TextureLoader().load(require('../pics/leftFoot.png'));
	rightFoot = new THREE.TextureLoader().load(require('../pics/rightFoot.png'));
	jumping = new THREE.TextureLoader().load(require('../pics/jumping.png'));
	let mat1 = new THREE.MeshBasicMaterial( {map: leftFoot, side: THREE.FrontSide } );
	let mat2 = new THREE.MeshBasicMaterial( {map: rightFoot, side: THREE.FrontSide } );
	let mat3 = new THREE.MeshBasicMaterial( {map: jumping, side: THREE.FrontSide } );
	let mat4 = new THREE.MeshBasicMaterial( {map: standing, side: THREE.FrontSide } );
	leftFoot = new THREE.Mesh( geometry, mat1 );
	rightFoot = new THREE.Mesh( geometry, mat2 );
	jumping = new THREE.Mesh( geometry, mat3 );
	standing = new THREE.Mesh( geometry, mat4 );

	const directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
	directionalLight.position.set( 1, 1, 0 );
	scene.add(directionalLight);

	const ambientLight = new THREE.AmbientLight( 0xcccccc, 1 );
	scene.add(ambientLight);

	let sceneryX = [0,-50,50,100,150,200];
	let sceneryY = [-30, -20, -15,-20,-30, -20];

	character.texture = jumping;
	scene.add( character.texture );

	let geometry2 = new THREE.PlaneGeometry( 3.5, 7, 32);
	let material2 = new THREE.MeshBasicMaterial( {color: 0x000000, side: THREE.FrontSide} );
	material2.transparent = true;
	material2.opacity = 0;
	character.mesh = new THREE.Mesh( geometry2, material2);
	scene.add(character.mesh);

	// 	// instantiate a loader
	// var loader = new THREE.ImageLoader();

	// // load a image resource
	// loader.load(
	// 	// resource URL
	// 	image,

	// 	// onLoad callback
	// 	function ( image ) {
	// 		// use the image, e.g. draw part of it on a canvas
	// 		var canvas = document.createElement( 'canvas' );
	// 		var context = canvas.getContext( '2d' );
	// 		context.drawImage( image, 100, 100 );
	// 	},

	// 	// onProgress callback currently not supported
	// 	undefined,

	// 	// onError callback
	// 	function () {
	// 		console.error( 'An error happened.' );
	// 	}
	// );

	// var spriteMap = new THREE.TextureLoader().load( image );
	// var spriteMaterial = new THREE.SpriteMaterial( { map: spriteMap, color: 0xffffff } );
	// var sprite = new THREE.Sprite( spriteMaterial );
	// scene.add( sprite );

	for (var i = 0; i < sceneryX.length; i++) {
		let geometry = new THREE.PlaneGeometry( 50, 20, 32 );
		let material = new THREE.MeshBasicMaterial( {color: 0xff0000, side: THREE.DoubleSide} );
		let ground = new THREE.Mesh( geometry, material );
		scene.add( ground );
		ground.position.x = sceneryX[i];
		ground.position.y = sceneryY[i];
		objects.push(ground);
	}

}

export const moveCharacter = (x, y) => {
	character.mesh.position.x = x;
	character.mesh.position.y = y;

	// character.texture.position.x = character.mesh.position.x;
	// character.texture.position.y = character.mesh.position.y;
}

export const walk = () => {
	console.log('walking');
	if (character.texture == standing || character.texture == jumping){
		scene.remove(character.texture);
		character.texture = leftFoot;
		scene.add(character.texture);
	} else if (character.texture == leftFoot){
		scene.remove(character.texture);
		character.texture = rightFoot;
		scene.add(character.texture);
	} else if (character.texture == rightFoot){
		scene.remove(character.texture);
		character.texture = leftFoot;
		scene.add(character.texture);
	}
	character.texture.position.x = character.mesh.position.x;
	character.texture.position.y = character.mesh.position.y;
}

export const stand = () => {
	scene.remove(character.texture);
	character.texture = standing;
	character.texture.position.x = character.mesh.position.x;
	character.texture.position.y = character.mesh.position.y;
	scene.add(character.texture);
}

export const jump = () => {
	scene.remove(character.texture);
	character.texture = jumping;
	scene.add(character.texture);
	character.texture.position.x = character.mesh.position.x;
	character.texture.position.y = character.mesh.position.y;
}