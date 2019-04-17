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

export const init = () => {
	const directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
	directionalLight.position.set( 1, 1, 0 );
	scene.add(directionalLight);

	const ambientLight = new THREE.AmbientLight( 0xcccccc, 1 );
	scene.add(ambientLight);

	let sceneryX = [0,-50,50,100,150,200];
	let sceneryY = [-30, -20, -15,-20,-30, -20];

	let geometry = new THREE.PlaneGeometry( 2.5, 5, 32 );
	let material = new THREE.MeshBasicMaterial( {color: 0xffff00, side: THREE.DoubleSide} );
	character = new THREE.Mesh( geometry, material );
	scene.add( character );

	for (var i = 0; i < sceneryX.length; i++) {
		geometry = new THREE.PlaneGeometry( 50, 20, 32 );
		material = new THREE.MeshBasicMaterial( {color: 0xff0000, side: THREE.DoubleSide} );
		let ground = new THREE.Mesh( geometry, material );
		scene.add( ground );
		ground.position.x = sceneryX[i];
		ground.position.y = sceneryY[i];
		objects.push(ground);
	}

}
