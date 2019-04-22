import { camera, renderer, scene, init, character, objects } from "./Initialize.js";
import { heliCount } from "../app.js";
import * as THREE from 'three';

export let heli;

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
// let heliAcceleration = 0.01;
let heliMaxSpeed = 1.2;
// let centered = 0;
// let heliVelocityX = 0;
// let heliVelocityY = 0;
// let beginDodge = true;
let flyNormal = true;
let dodgeMode = false;
let dodgeDirection = -50;
let gravity = 0.002;
let boost = 0.1;
let velocityVector = new THREE.Vector3();
let forceVector = new THREE.Vector3(0,0,0);
let maxRotation = 20;
let margin = 20;
let tiltRate = .05;
// let gravityVector = new THREE.Vector3(0, -gravity, 0);
let v1 = new THREE.Vector3();
let targetPosition;

const brake = () => {
	if (THREE.Math.radToDeg(heli.rotation.z) < 0){ //if tilted right
			heli.rotation.z += tiltRate; //tilt left towards zero tilt
			if (heli.rotation.z > 0) heli.rotation.z = 0;
	}		
	else if (THREE.Math.radToDeg(heli.rotation.z) > 0){ //if tilted left
		heli.rotation.z -= tiltRate; //tilt right towards zero tilt
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
	// forceVector.y = boost;
	if (THREE.Math.radToDeg(heli.rotation.z) < maxRotation)
		heli.rotation.z += tiltRate;
}

const tiltRight = () => {
	// forceVector.y = boost;
	if (THREE.Math.radToDeg(heli.rotation.z) > -maxRotation)
		heli.rotation.z -= tiltRate;
}

export const move = () => {
	getQueueToFly();
	forceVector.y = 0;
	if (flyNormal){
		targetPosition = character.position.x;
		if (dodgeMode){
			targetPosition = character.position.x + dodgeDirection;
		}
		if (velocityVector.y > -heliMaxSpeed)
			velocityVector.y += -gravity;
		if (heli.position.y < heliHeight && velocityVector.y < 0) {
			console.log('up');
			if (velocityVector.y < heliMaxSpeed)
				forceVector.y = boost;
		}
		// console.log(heli.position);

		//if within margin
		if (Math.abs(heli.position.x - targetPosition) < margin){
			brake();
		} else if (targetPosition + margin/2 < heli.position.x){
			tiltLeft();
			accelerate('left', 5);
		} else if (targetPosition - margin/2 > heli.position.x){
			tiltRight();
			accelerate('right', 5);
		}
		v1.copy( forceVector ).applyQuaternion( heli.quaternion );
		velocityVector.add(v1);
		heli.position.add(velocityVector);

		// if (character.position.x > heli.position.x){
		// 	console.log(THREE.Math.radToDeg(heli.rotation.z));
		// 	tiltRight();
		// } else if (character.position.x < heli.position.x){
		// 	tiltLeft();
		// 	console.log(THREE.Math.radToDeg(heli.rotation.z));
			
		// } 
		// else if (Math.abs(THREE.Math.radToDeg(heli.rotation.z)) > maxRotation) 
		// 	forceVector.y = boost;
		// v1.copy( forceVector ).applyQuaternion( heli.quaternion );
		// velocityVector.add(v1);
		// if (Math.abs(THREE.Math.radToDeg(heli.rotation.z)) > 0){
		// 	velocityVector.y = 0;
		// }
		// // if (Math.abs(velocityVector.x) > heliMaxSpeed){
		// // 	if (velocityVector.x < 0){
		// // 		velocityVector.x = -heliMaxSpeed;
		// // 	} else
		// // 		velocityVector.x = heliMaxSpeed;
		// // }

		// heli.position.add(velocityVector);
		// console.log(heli.rotation.z);
	

	} else {
		if (velocityVector.y > -heliMaxSpeed)
			velocityVector.y += -gravity;
		if (heli.position.y < heliHeight && velocityVector.y < 0) {
			console.log('up');
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
		heli.position.add(velocityVector);
	}



	// if (flyNormal){
	// 	targetPosition = character.position.x;
	// 	if (dodgeMode){
	// 		targetPosition = character.position.x + dodgeDirection;
	// 	}
	// 	if (Math.abs(targetPosition - heli.position.x) > heli.geometry.parameters.width/2){
	// 		if (heliVelocityX < heliMaxSpeed){
	// 			heliVelocityX += heliAcceleration;
	// 			// heli.rotation.z = Math.PI / 10;
	// 		}
	// 	} else {
	// 		if (heliVelocityX > 0) {
	// 			// heli.rotation.z = -Math.PI / 10;
	// 			heliVelocityX -= heliAcceleration;
	// 		}
	// 		if (heliVelocityX <= 0) {
	// 			heli.rotation.z = Math.PI;
	// 			heliVelocityX = 0;
	// 		}
	// 	}
	// 	if (Math.abs(heli.position.y - heliHeight) > 10){
	// 		if (Math.abs(heliVelocityY) < heliMaxSpeed){
	// 			heliVelocityY += heliAcceleration;
	// 		}
	// 	} else {
	// 		if (heliVelocityY > 0) {
	// 			heliVelocityY -= heliAcceleration;
	// 		}
	// 		if (heliVelocityY < 0) heliVelocityY = 0;
	// 	}
	// } else {
	// 	heliVelocityX += heliAcceleration*5;
	// }
	// let tmpPos = new THREE.Vector3(heli.position.x, heli.position.y, 0);
	// let tmpCharPos = new THREE.Vector3(); 
	// tmpCharPos.copy(character.position);
	// tmpCharPos.y += heliHeight;
	// tmpCharPos.x = targetPosition;
	// let velVector = tmpPos.sub(tmpCharPos).normalize().negate();
	// velVector.multiply(new THREE.Vector3(heliVelocityX, heliVelocityY, 0));
	// heli.position.x += velVector.x;
	// heli.position.y += velVector.y;
	
}

export const getQueueToFly = () => {
	if (!flyNormal)
		if (Math.abs(heli.position.x) >= character.position.x + 100){
			console.log('flyon');
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
		heli.position.x = character.position.x + 250;
	} else {
		heli.position.x = character.position.x - 250;
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
	spawn();
}

const getDropInfo = () => {
	let dropInfo = {
		color: 0x0000ff,
		name: 'akimboMac10',
		size: 1,
		speed: .5,
		ammo: 50,
		damage: 1,
		velocity: 0,
		mesh: null,
		reloadTime: 250
	}
	if (Math.random() < .30){
		dropInfo.color = 0xffff00;
		dropInfo.name = 'RPG';
		dropInfo.ammo = 6;
		dropInfo.damage = 7;
		dropInfo.size = 1.5;
		dropInfo.speed = .4;
		dropInfo.reloadTime = 2000;
	} else if (Math.random() < .60){
		dropInfo.color = 0xff0000;
		dropInfo.name = 'shotgun';
		dropInfo.ammo = 15;
		dropInfo.damage = 1;
		dropInfo.size = 1;
		dropInfo.speed = .5;
		dropInfo.reloadTime = 500;
	}
	return dropInfo;
}