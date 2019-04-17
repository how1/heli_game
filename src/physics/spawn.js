import { camera, renderer, scene, init, character, objects } from "./Initialize.js";
import { heliCount } from "../app.js";
import * as THREE from 'three';

export let heli;
let targetPosition;

export const spawn = () => {
	let geometry = new THREE.PlaneGeometry( 30, 10, 32 );
	let material = new THREE.MeshBasicMaterial( {color: 0x0000ff, side: THREE.DoubleSide} );
	heli = new THREE.Mesh( geometry, material );
	scene.add( heli );
	heli.position.y = 100;
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
let heliAcceleration = 0.01;
let heliMaxSpeed = 1.2;
let centered = 0;
let heliVelocityX = 0;
let heliVelocityY = 0;
let beginDodge = true;
let flyNormal = true;
let dodgeMode = false;
let dodgeDirection = -50;

export const move = (direction) => {
	getQueueToFly();
	if (flyNormal){
		targetPosition = character.position.x;
		if (dodgeMode){
			targetPosition = character.position.x + dodgeDirection;
		}
		if (Math.abs(targetPosition - heli.position.x) > heli.geometry.parameters.width/2){
			if (heliVelocityX < heliMaxSpeed)
				heliVelocityX += heliAcceleration;
		} else {
			if (heliVelocityX > 0) {
				heliVelocityX -= heliAcceleration;
			}
			if (heliVelocityX < 0) heliVelocityX = 0;
		}
		if (Math.abs(heli.position.y - heliHeight) > 10){
			if (Math.abs(heliVelocityY) < heliMaxSpeed){
				heliVelocityY += heliAcceleration;
			}
		} else {
			if (heliVelocityY > 0) {
				heliVelocityY -= heliAcceleration;
			}
			if (heliVelocityY < 0) heliVelocityY = 0;
		}
	} else {
		heliVelocityX += heliAcceleration*5;
	}
	let tmpPos = new THREE.Vector3(heli.position.x, heli.position.y, 0);
	let tmpCharPos = new THREE.Vector3(); 
	tmpCharPos.copy(character.position);
	tmpCharPos.y += heliHeight;
	tmpCharPos.x = targetPosition;
	let velVector = tmpPos.sub(tmpCharPos).normalize().negate();
	velVector.multiply(new THREE.Vector3(heliVelocityX, heliVelocityY, 0));
	heli.position.x += velVector.x;
	heli.position.y += velVector.y;
	
}

export const getQueueToFly = () => {
	if (heli.position.x >= character.position.x + 200)
		flyOn();
}

export const flyOff = () => {
	flyNormal = false;
	targetPosition = character.position.x + 250;
}

export const flyOn = () => {
	heli.position.x = character.position.x - 250;
	heliVelocityX = heliMaxSpeed;
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
	spawn();
}

const getDropInfo = () => {
	let dropInfo = {
		color: 0x00ff00,
		powerUp: 'akimboMac10',
		size: 1,
		speed: .5,
		ammo: 50,
		damage: 1,
		velocity: 0,
		mesh: null
	}
	if (Math.random() < .30){
		dropInfo.color = 0xcccc00;
		dropInfo.powerUp = 'RPG';
		dropInfo.ammo = 6;
		dropInfo.damage = 7;
		dropInfo.size = 1.5;
		dropInfo.speed = .2;
	} else if (Math.random() < .60){
		dropInfo.color = 0xcccc00;
		dropInfo.powerUp = 'Shotgun';
		dropInfo.ammo = 15;
		dropInfo.damage = 1;
		dropInfo.size = 1;
		dropInfo.speed = .5;
	}
	return dropInfo;
}
