import * as THREE from 'three';
import "../styles/components/loader.scss";
import { playerHealth,  } from "../app.js";



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

// window.addEventListener('resize', () => {
// 	width = window.innerWidth - 10;
// 	height = window.innerHeight - 10;
// 	renderer.setSize(width, height);
// 	camera.aspect = width/height;
// 	camera.updateProjectionMatrix();
// });

export let objects = [];

export let character;
export let arm;
let standingLeft;
let standingRight;
let leftFoot;
let rightFoot;
let jumping;
export let bgImage;

const spriteSheet = (sprite, x, y, d, scaleX, scaleY) => {
	let sheet = {
		xOffset: x,
		yOffset: y,
		newVal: 0,
		mat: null,
		spr: null,
		tex: null
	}
	sheet.tex = sprite;
	sheet.tex.repeat.set( 1/d, 1);
	sheet.tex.needsUpdate = true;
	sheet.tex.wrapS = sheet.tex.wrapT - THREE.repeatWrapping;
	sheet.mat = new THREE.SpriteMaterial({map: sheet.tex});

	sheet.spr = new THREE.Sprite(sheet.mat);
	sheet.spr.scale.set( scaleX, scaleY, 1);
	return sheet;
}

let walkingArrayRight = [0.016, .111, .211, .308, .398, .488, .578];
let walkingArrayLeft = [.885, .79, .69, .59, .5, .41, .32];
let standingArrayRight = [.67, .76, .85, .6];
let standingArrayLeft = [.06, .15, .24, .15];
let jumpingArrayLeft = [.06, .15, .24, .15];
let jumpingArrayRight = [.06, .15, .24, .15];

// let heliArray = [-0.014, .11, .218, .34, .25, .125];
// let heliArray = [-0.014, .11, .218, .34, .45, .55];
// let heliArray = [.218, -0.014, .45, .11, .55, .34];
let heliArray = [.217, -0.014, .47, .111, .59, .34];


export const updateSprite = (sprite) => {
	if (sprite == rightFoot){
		if (sprite.newVal == 7){
			sprite.newVal = 0;
			sprite.tex.offset.x = walkingArrayRight[sprite.newVal];
			sprite.newVal++;
		} else {
			sprite.tex.offset.x = walkingArrayRight[sprite.newVal];
			sprite.newVal++;
		}
	} else if (sprite == leftFoot){
		if (sprite.newVal == 7){
			sprite.newVal = 0;
			sprite.tex.offset.x = walkingArrayLeft[sprite.newVal];
			sprite.newVal++;
		} else {
			sprite.tex.offset.x = walkingArrayLeft[sprite.newVal];
			sprite.newVal += 1;
		}
	} else if (sprite == standingRight){
		if (sprite.newVal > 2){
			sprite.newVal = 1;
			sprite.tex.offset.x = standingArrayRight[sprite.newVal];
			sprite.newVal = 0;
		} else {
			sprite.tex.offset.x = standingArrayRight[sprite.newVal];
			sprite.newVal++;
		}
	} else if (sprite == standingLeft){
		if (sprite.newVal > 2){
			sprite.newVal = 1;
			sprite.tex.offset.x = standingArrayLeft[sprite.newVal];
			sprite.newVal = 0;
		} else {
			sprite.tex.offset.x = standingArrayLeft[sprite.newVal];
			sprite.newVal++;
		}
	} 

	if (sprite == heliFlying){
		if (sprite.newVal == 6){
			sprite.newVal = 0;
			sprite.tex.offset.x = heliArray[sprite.newVal];
			sprite.newVal++;
		} else {
			sprite.tex.offset.x = heliArray[sprite.newVal];
			sprite.newVal++;
		}
	}

}

export let heliFlying;

export const init = () => {
	character = {
		mesh: null,
		texture: null,
		sheet: null
	}
	let bgGeom = new THREE.PlaneGeometry(192, 108, 32);
	let bg = new THREE.TextureLoader().load(require('../pics/background.png'));
	let bgMat = new THREE.MeshBasicMaterial({map: bg, side: THREE.FrontSide});
	// let bgMat = new THREE.MeshBasicMaterial({color: 0xeeffcc, side: THREE.FrontSide});
	bgMat.transparent = true;
	bgMat.opacity = 1;
	bgImage = new THREE.Mesh(bgGeom, bgMat);
	bgImage.position.z = -1;
	scene.add(bgImage);

	// var spriteMap = new THREE.TextureLoader().load( require("../pics/armyguy.png") );
	// var spriteMaterial = new THREE.SpriteMaterial( { map: spriteMap, color: 0xffffff } );
	// standing = new THREE.Sprite( spriteMaterial );
	// spriteMaterial.transparent = true;
	// spriteMaterial.opacity = .5;
	let standingRightSpr = new THREE.TextureLoader().load(require('../pics/roboWalkingLarge.png'));
	standingRightSpr.anisotropy = renderer.getMaxAnisotropy();
	standingRight = new spriteSheet(standingRightSpr, 0, 1, 11, 10, 10);
	let standingLeftSpr = new THREE.TextureLoader().load(require('../pics/roboWalkingLarge2.png'));
	standingLeftSpr.anisotropy = renderer.getMaxAnisotropy();
	standingLeft = new spriteSheet(standingLeftSpr, 0, 1, 11, 10, 10);
	let rightFootSpr = new THREE.TextureLoader().load(require('../pics/roboWalkingLarge.png'));
	rightFootSpr.anisotropy = renderer.getMaxAnisotropy();
	rightFoot = new spriteSheet(rightFootSpr, 0, 1, 11, 10, 10);
	let leftFootSpr = new THREE.TextureLoader().load(require('../pics/roboWalkingLarge2.png'));
	leftFootSpr.anisotropy = renderer.getMaxAnisotropy();
	leftFoot = new spriteSheet(leftFootSpr, 0, 1, 11, 10, 10);
	let heliFlyingSpr = new THREE.TextureLoader().load(require('../pics/heli5.png'));
	heliFlyingSpr.anisotropy = renderer.getMaxAnisotropy();
	heliFlying = new spriteSheet(heliFlyingSpr, 0, 1, 8, 40, 20);
	console.log(heliFlying);

	let geometry = new THREE.PlaneGeometry( 2, 8, 32 );
	let armTex = new THREE.TextureLoader().load(require('../pics/roboArm.png'));
	armTex.anisotropy = renderer.getMaxAnisotropy();
	let mat1 = new THREE.MeshBasicMaterial( {map: armTex, side: THREE.FrontSide } );
	mat1.transparent = true;
	mat1.opacity = 1;
	arm = new THREE.Mesh( geometry, mat1 );
	scene.add(arm);

	const directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
	directionalLight.position.set( 1, 1, 0 );
	scene.add(directionalLight);

	const ambientLight = new THREE.AmbientLight( 0xcccccc, 1 );
	scene.add(ambientLight);

	let sceneryX = [0,-50,50,100,150,200];
	let sceneryY = [-30, -20, -15,-20,-30, -20];

	character.sheet = standingRight;
	character.texture = character.sheet.spr;
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

export const walk = (dir) => {
	// if (character.texture == standingRight || character.texture == standingLeft){
	// 	scene.remove(character.texture);
	// 	character.texture = leftFoot;
	// 	scene.add(character.texture);
	// } else if (character.texture == leftFoot){
	// 	scene.remove(character.texture);
	// 	character.texture = rightFoot;
	// 	scene.add(character.texture);
	// } else if (character.texture == rightFoot){
	// 	scene.remove(character.texture);
	// 	character.texture = leftFoot;
	// 	scene.add(character.texture);
	// }

	if (dir == 'left'){
		scene.remove(character.texture);
		character.sheet = leftFoot;
		character.sheet.newVal = 0;
		character.texture = character.sheet.spr;
		scene.add(character.texture);
	} else if (dir == 'right'){
		scene.remove(character.texture);
		character.sheet = rightFoot;
		character.sheet.newVal = 0;
		character.texture = character.sheet.spr;
		scene.add(character.texture);
	}
	updateSprite();
	character.texture.position.x = character.mesh.position.x;
	character.texture.position.y = character.mesh.position.y;
}

export const stand = (dir) => {
	scene.remove(character.texture);
	if (dir == 'right') {
		character.sheet = standingRight;
		character.texture = character.sheet.spr;
	}
	else if (dir == 'left') {
		character.sheet = standingLeft;
		character.texture = character.sheet.spr;
	}
	character.texture.position.x = character.mesh.position.x;
	character.texture.position.y = character.mesh.position.y;
	scene.add(character.texture);
	updateSprite();
}

export const jump = (dir) => {
	stand(dir);
	// scene.remove(character.texture);
	// character.texture = jumping;
	// scene.add(character.texture);
	// character.texture.position.x = character.mesh.position.x;
	// character.texture.position.y = character.mesh.position.y;
}