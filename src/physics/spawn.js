import { camera, renderer, scene, init, character, objects, heliFlying, updateSprite } from "./Initialize.js";
import { heliCount, gameSpeed } from "../app.js";
import * as THREE from 'three';

export let heli;

export const spawn = () => {
	// let image = new THREE.TextureLoader().load(require('../pics/heli4.png'));
	let geometry = new THREE.PlaneGeometry( 30, 10, 32 );
	let material = new THREE.MeshBasicMaterial( {color: 0x000000, side: THREE.FrontSide} );
	// let material = new THREE.MeshBasicMaterial( {map: image, side: THREE.FrontSide} );
	heli = new THREE.Mesh( geometry, material );
	material.transparent = true;
	material.opacity = 0;
	scene.add( heli );
	scene.add(heliFlying.spr);
	heli.position.y = 80;
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

export const move = () => {
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
		if (Math.abs(heli.position.x) >= character.mesh.position.x + 200){
			flyOn();
		}
}

let flyOffDirection;

export const flyOff = () => {
	flyNormal = false;
	if (Math.random() < .5){
		flyOffDirection = 'left';
	} else flyOffDirection = 'right';
}

export const flyOn = () => {
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
export let helipart2 = [];
export let heliPartVelocityY = [];
export let heliPartVelocityX = [];
export let pickUps = [];

export const blowUp = () => {
	let geometry = new THREE.PlaneGeometry( 15, 10, 32 );
	let material = new THREE.MeshBasicMaterial( {color: 0x0000ff, side: THREE.DoubleSide} );
	let part1 = new THREE.Mesh( geometry, material );
	scene.add( part1 );
	part1.position.x = heli.position.x + heli.geometry.parameters.width / 4;
	part1.position.y = heli.position.y;
	helipart1.push(part1);
	heliPartVelocityX.push(1);
	heliPartVelocityY.push(1);
	
	geometry = new THREE.PlaneGeometry( 15, 10, 32 );
	material = new THREE.MeshBasicMaterial( {color: 0x0000ff, side: THREE.DoubleSide} );
	let part2 = new THREE.Mesh( geometry, material );
	scene.add( part2 );
	part2.position.x = heli.position.x - heli.geometry.parameters.width / 4;
	part2.position.y = heli.position.y;
	helipart2.push(part2);

	if (heliCount % 3 == 0){
		let dropInfo = getDropInfo();
		geometry = new THREE.PlaneGeometry( 4, 4, 32 );
		material = new THREE.MeshBasicMaterial( {color: dropInfo.color, side: THREE.DoubleSide} );
		let drop = new THREE.Mesh( geometry, material );
		scene.add( drop );
		drop.position.x = heli.position.x;
		drop.position.y = heli.position.y;
		dropInfo.mesh = drop;
		pickUps.push(dropInfo);
	}

	scene.remove(heli);
	scene.remove(heliFlying);
	setTimeout(spawn, 1000);
	// spawn();
}

const getDropInfo = () => {
	let dropInfo = akimboMac10s;
	if (Math.random() < .30){
		dropInfo = rpg;
	} else if (Math.random() < .60){
		dropInfo = shotgun;
	}
	return dropInfo;
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
	reloadTime: 500,
	shotSound: null,
	hitSound: null,
	pickupSound: null
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
	reloadTime: 2000,
	shotSound: null,
	hitSound: null,
	pickupSound: null
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
	reloadTime: 150,
	shotSound: null,
	hitSound: null,
	pickupSound: null
}