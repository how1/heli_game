import { camera, renderer, scene, init, character, objects, heliFlying, 
	crashedHeli, updateSprite, rocketTex, rocket, getCrashedHeli, getExplosion, getMaterial } from "./Initialize.js";
import { heliCount, gameSpeed, gameStatus, playSound, mute, listener, setHeliShooting } from "../app.js";
import * as THREE from 'three';

export let heli;
export let spawnMute = false;
let crash = require('../sounds/crash.wav');
let hover = require('../sounds/hover.wav');
let fadeIn = require('../sounds/fadeIn.wav');
let fadeOut = require('../sounds/fadeOut.wav');

export let hoverSound;

document.addEventListener("keydown", onDocumentKeyDown, false);
function onDocumentKeyDown(event) {
    let keyCode = event.which;
	if (keyCode == 77) {
        spawnMute = !spawnMute;
        // if (gameStatus == 'play')
	       //  if (hoverSound.isPlaying) {
	       //      hoverSound.pause();
	       //  } else hoverSound.play();
    }
};

export const spawn = () => {
	setHeliShooting(true);
	spawnMute = mute;
	hoverSound = playSound(hover, new THREE.Audio(listener), true);
	if (spawnMute)
		hoverSound.setVolume(0);
	let geometry = new THREE.PlaneGeometry( 30, 10, 32 );
	let material = new THREE.MeshBasicMaterial( {color: 0x000000, side: THREE.FrontSide} );
	heli = new THREE.Mesh( geometry, material );
	material.transparent = true;
	material.opacity = 0;
	heli.position.y = 150;
	scene.add( heli );
	heliFlying.spr.position.x = heli.position.x;
	heliFlying.spr.position.y = heli.position.y;
	scene.add(heliFlying.spr);
}

function rotateAboutPoint(obj, point, axis, theta, pointIsWorld){
	pointIsWorld = (pointIsWorld === undefined)? false : pointIsWorld;
  
	if(pointIsWorld){
		obj.parent.localToWorld(obj.position); // compensate for world coordinate
	}
  
	obj.position.sub(point); // remove the offset
	obj.position.applyAxisAngle(axis, theta); // rotate the POSITION
	obj.position.add(point); // re-add the offset
  
	if(pointIsWorld){
		obj.parent.worldToLocal(obj.position); // undo world coordinates compensation
	}
  
	obj.rotateOnAxis(axis, theta); // rotate the OBJECT
}

let heliHeight = 30;
let heliMaxSpeed = 1.2;
export let flyNormal = true;
let findMode = true;
let dodgeMode = false;
let dodgeDirection = -50;
let gravity = 0.002;
let boost = 0.1;
let velocityVector = new THREE.Vector3();
let forceVector = new THREE.Vector3(0,0,0);
let maxRotation = 20;
let margin = 20;
let tiltRate = .05;
let v1 = new THREE.Vector3();
let targetPosition;

const brake = () => {
	if (THREE.Math.radToDeg(heli.rotation.z) < 0){ //if tilted right
			heli.rotation.z += tiltRate * gameSpeed; //tilt left towards zero tilt
			if (heli.rotation.z > 0) heli.rotation.z = 0;
	}		
	else if (THREE.Math.radToDeg(heli.rotation.z) > 0){ //if tilted left
		heli.rotation.z -= tiltRate * gameSpeed; //tilt right towards zero tilt
		if (heli.rotation.z < 0) heli.rotation.z = 0;
	}
	
	if (velocityVector.x > 0){ //if going right
		velocityVector.x += -boost*5;
	}
	else if (velocityVector.x < 0){
		velocityVector.x += boost*5;
	}
}

const accelerate = (direction, multiplier) => {
	if (direction == 'left'){
		velocityVector.x = -boost * multiplier;
	} else {
		velocityVector.x = boost * multiplier;
	}
}

const tiltLeft = () => {
	if (THREE.Math.radToDeg(heli.rotation.z) < maxRotation)
		heli.rotation.z += tiltRate * gameSpeed;
}

const tiltRight = () => {
	if (THREE.Math.radToDeg(heli.rotation.z) > -maxRotation)
		heli.rotation.z -= tiltRate * gameSpeed;
}

let frameCounter = 0;
let fps = 10;
let curTime;
let oldTime = Date.now();
let interval = 1000/fps;
let delta;

export let volume;

export const move = () => {
	//Chopper volume
	if (spawnMute) hoverSound.setVolume(0);
	else {
		let tmpVec = new THREE.Vector3();
		tmpVec.copy(character.mesh.position);
		let distance = tmpVec.sub(heli.position).length();
		volume = (1/(distance * distance)) * 2500;
		if (volume > .5) volume = .5;
		hoverSound.setVolume(volume);
	}
	//

	curTime = Date.now();
    delta = curTime - oldTime;
    if (delta > interval){
        oldTime = curTime - (delta % interval);
        updateSprite(heliFlying);
    }
    heliFlying.spr.position.x = heli.position.x;
    heliFlying.spr.position.y = heli.position.y;
    heliFlying.spr.material.rotation = heli.rotation.z;
	getQueueToFly();
	forceVector.y = 0;
	if (flyNormal){
		targetPosition = character.mesh.position.x;
		if (dodgeMode){
			targetPosition = character.mesh.position.x + dodgeDirection;
		}
		if (velocityVector.y > -heliMaxSpeed)
			velocityVector.y += -gravity;
		if (heli.position.y < heliHeight && velocityVector.y < 0) {
			if (velocityVector.y < heliMaxSpeed)
				forceVector.y = boost;
		}
		if (findMode){
			if (Math.abs(heli.position.x - targetPosition) < margin/2){
				findMode = false;
				brake();
			} else if (targetPosition + margin/4 < heli.position.x){
				tiltLeft();
				accelerate('left', 5);
			} else if (targetPosition - margin/4 > heli.position.x){
				tiltRight();
				accelerate('right', 5);
			}
		} else {
			//if within margin
			if (Math.abs(heli.position.x - targetPosition) < margin){
				brake();
			} else findMode = true;
		}
		v1.copy( forceVector ).applyQuaternion( heli.quaternion );
		velocityVector.add(v1);
		heli.position.add(velocityVector.multiplyScalar(gameSpeed));
	

	} else {
		if (velocityVector.y > -heliMaxSpeed)
			velocityVector.y += -gravity;
		if (heli.position.y < heliHeight && velocityVector.y < 0) {
			if (velocityVector.y < heliMaxSpeed)
				forceVector.y = boost;
		}
		if (flyOffDirection == 'left'){
			tiltLeft();
			accelerate('left', 25);
		} else {
			tiltRight();
			accelerate('right', 25);
		}
		v1.copy( forceVector ).applyQuaternion( heli.quaternion );
		velocityVector.add(v1);
		heli.position.add(velocityVector.multiplyScalar(gameSpeed));
	}

	
}

export const getQueueToFly = () => {
	if (!flyNormal)
		if (Math.abs(heli.position.x) >= character.mesh.position.x + 95){
			flyOn();
		}
}

let flyOffDirection;

export const flyOff = () => {
	// hoverSound.pause();
	// if (!mute)
	// 	playSound(fadeOut, false).onEnded(playSound(fadeIn, false).onEnded(hoverSound.play()));
	flyNormal = false;
	if (Math.random() < .5){
		flyOffDirection = 'left';
	} else flyOffDirection = 'right';
}

export const flyOn = () => {
	// playSound(fadeIn).onEnded(hoverSound.play());
	if (flyOffDirection == 'left'){
		heli.position.x = character.mesh.position.x + 100;
	} else {
		heli.position.x = character.mesh.position.x - 100;
	}
	flyNormal = true;
}

export const dodge = () => {
	if (flyNormal){
		if (dodgeMode) dodgeMode = false;
		else {
			if (Math.random() < .5){
				dodgeDirection = -50;
			} else dodgeDirection = 50;
			dodgeMode = true;
		}
	}
}

export let helipart1 = [];
export let crashedHelis = [];
export let explosions = [];
// export let helipart2 = [];
export let heliPartVelocityY = [];
export let heliPartVelocityX = [];
export let pickUps = [];

export let slowSound;

export const blowUp = () => {
	setHeliShooting(false);
	hoverSound.stop();
	if (gameStatus == 'gameOver' && !spawnMute)
		slowSound = playSound(crash, new THREE.Audio(listener), false, 'slow');
	else if (!spawnMute) playSound(crash, new THREE.Audio(listener), false);
	let geometry = new THREE.PlaneGeometry( 30, 10, 32 );
	let material = new THREE.MeshBasicMaterial( {color: 0x0000ff, side: THREE.DoubleSide} );
	material.transparent = true;
	material.opacity = 0;
	let part1 = new THREE.Mesh( geometry, material );
	scene.add( part1 );
	part1.position.x = heli.position.x;
	part1.position.y = heli.position.y;
	helipart1.push(part1);
	let crashed= getCrashedHeli();
	let explosion = getExplosion(40, 40);
	scene.add(crashed.spr);
	scene.add(explosion.spr);
	crashedHelis.push(crashed);
	explosions.push(explosion);
	explosion.spr.position.x = heli.position.x + 4;
	explosion.spr.position.y = heli.position.y;
	scene.remove(heli);
	scene.remove(heliFlying.spr);
	heliPartVelocityX.push(1);
	heliPartVelocityY.push(.0005);
	
	// geometry = new THREE.PlaneGeometry( 15, 10, 32 );
	// material = new THREE.MeshBasicMaterial( {color: 0x0000ff, side: THREE.DoubleSide} );
	// let part2 = new THREE.Mesh( geometry, material );
	// scene.add( part2 );
	// part2.position.x = heli.position.x - heli.geometry.parameters.width / 4;
	// part2.position.y = heli.position.y;
	// helipart2.push(part2);

	if (heliCount % 3 == 0 && gameStatus == 'play'){
		let dropInfo = getDropInfo();
		let drop = getDropIconMesh(dropInfo.name, 6);
		scene.add( drop );
		drop.position.x = heli.position.x;
		drop.position.y = heli.position.y;
		dropInfo.mesh = drop;
		pickUps.push(dropInfo);
	}
	if (gameStatus == 'play')
		spawn();
}

const getDropInfo = () => {
	let dropInfo = akimboMac10s;
	if (Math.random() < .25){
		dropInfo = rpg;
	} else if (Math.random() < .50){
		dropInfo = shotgun;
	} else if (Math.random() < .75){
		dropInfo = healthpack;
	}
	return healthpack;
	return dropInfo;
}

let bulletMat = getMaterial(new THREE.TextureLoader().load(require('../pics/bullet.png')));
let bullet2Mat = getMaterial(new THREE.TextureLoader().load(require('../pics/bullet2.png')));

export const getBulletMesh = (color, s) => {
	let size = 1.6;
	let mesh;
	if (color == 'rpg'){
		let geometry = new THREE.PlaneGeometry(3.5, 3.5, 32);
		mesh = new THREE.Mesh(geometry, rocketTex);
		mesh.transparent = true;
		mesh.opacity = 1;
		mesh.position.z = .1;
	} else if (color == 'heli') {
		mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size, 32), bullet2Mat);
		mesh.position.z = .1;
	} else {
		mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size, 32), bulletMat);
		mesh.position.z = .1;
	}
	mesh.position.z = 1;
	return mesh;
}

let maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

const getTexture = (path) => {
	let tex = new THREE.TextureLoader().load(path.toString());
	tex.anisotropy = maxAnisotropy;
	return tex;
}

export const getDropIconMesh = (gun, scale) => {
	let dropGeom = new THREE.PlaneGeometry( scale, scale, 32 );
	let mesh;
	console.log('dropping ' + gun);
	if (gun == 'akimboMac10s'){
		let mat = getMaterial(getTexture(require('../pics/akimboDrop.png')));
		mesh = new THREE.Mesh(dropGeom, mat);
	} else if (gun == 'rpg'){
		let mat = getMaterial(getTexture(require('../pics/rpgDrop.png')));
		mesh = new THREE.Mesh(dropGeom, mat);
	} else if (gun == 'shotgun'){
		let mat = getMaterial(getTexture(require('../pics/shotgunDrop.png')));
		mesh = new THREE.Mesh(dropGeom, mat);
	} else if (gun == 'standard'){
		let mat = getMaterial(getTexture(require('../pics/standardDrop.png')));
		mesh = new THREE.Mesh(dropGeom, mat);
	} else if (gun == 'healthpack'){
		let mat = getMaterial(getTexture(require('../pics/healthpackDrop.png')));
		mesh = new THREE.Mesh(dropGeom, mat);
	}
	mesh.transparent = true;
	mesh.opacity = 1;
	mesh.position.z = 2;
	return mesh;
}

export let healthpack = {
	name: 'healthpack',
	pickupSound: null,
	getDropIcon: function() { return getDropIconMesh('healthpack', 8);}
}

export let shotgun = {
	color: 0xff0000,
	name: 'shotgun',
	size: 1.1,
	speed: .5,
	ammo: 15,
	fullAmmoMax: 15,
	damage: 1,
	velocity: 0,
	mesh: null,
	reloadTime: 1700,
	shotSound: null,
	hitSound: null,
	pickupSound: null,
	getBullet: function() {return getBulletMesh('0xff0000', 1.1);},
	getDropIcon: function() { return getDropIconMesh('shotgun', 8);}
}

export let rpg = {
	color: 0xffff00,
	name: 'rpg',
	size: 1.6,
	speed: .45,
	ammo: 6,
	fullAmmoMax: 6,
	damage: 7,
	velocity: 0,
	mesh: null,
	reloadTime: 7000,
	shotSound: null,
	hitSound: null,
	pickupSound: null,
	getBullet: function(){return getBulletMesh('rpg', 1.6);},
	getDropIcon: function() { return getDropIconMesh('rpg', 8);}
}

export let akimboMac10s = {
	color: 0x0000ff,
	name: 'akimboMac10s',
	size: 1.1,
	speed: .5,
	ammo: 50,
	fullAmmoMax: 50,
	damage: 1,
	velocity: 0,
	mesh: null,
	reloadTime: 550,
	shotSound: null,
	hitSound: null,
	pickupSound: null,
	getBullet: function() { return getBulletMesh('0x0000ff',1.1);},
	getDropIcon: function() { return getDropIconMesh('akimboMac10s', 8);}
}