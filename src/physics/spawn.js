import { camera, renderer, scene, init, character, objects, heliFlying, 
	crashedHeli, updateSprite, rocketTex, rocket, getCrashedHeli, getExplosion, getMaterial, heliGrappled, listener } from "./Initialize.js";
import { heliCount, gameSpeed, gameStatus, playSound, mute, setHeliShooting } from "../app.js";
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
    if (keyCode == 56){
		heliFlying.spr.position.x = heli.position.x;
		heliFlying.spr.position.y = heli.position.y;
		updateSprite(heliFlying);
    	scene.add(heliFlying.spr);
    }
};

let blowUpSfx = [];

const getSound = (src, audioObj, loop) => {

    // load a sound and set it as the Audio object's buffer
    var audioLoader = new THREE.AudioLoader();
    audioLoader.load( src, function(buffer){
        audioObj.setBuffer( buffer );
        if (!loop)
            audioObj.setLoop( false );
        else sound.setLoop(true);
        audioObj.setVolume( 0.5 );
    });
    return audioObj;
}

export const spawn = () => {
	blowUpSfx.push(getSound(crash, new THREE.Audio(listener)));
	blowUpSfx.push(getSound(explosionSound, new THREE.Audio(listener)));
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
	heli.position.y = 100;
	scene.add( heli );
	heliFlying.spr.position.x = heli.position.x;
	heliFlying.spr.position.y = heli.position.y;
	updateSprite(heliFlying);
	scene.add(heliFlying.spr);
}

let heliHeight = 15;
let heliMaxSpeed = 1;
export let flyNormal = true;
let findMode = true;
let dodgeMode = false;
let dodgeDirection = -50;
let gravity = 0.002;
let boost = 0.2;
let velocityVector = new THREE.Vector3();
velocityVector.clampLength(-heliMaxSpeed, heliMaxSpeed);
let forceVector = new THREE.Vector3(0,0,0);
let maxRotation = 20;
let margin = 20;
let tiltRate = .05;
let v1 = new THREE.Vector3();
let targetPosition;

const brake = () => {
	if (THREE.Math.radToDeg(heli.rotation.z) < 0){ //if tilted right
			heli.rotation.z += tiltRate * gameSpeed; //tilt left towards zero tilt
			if (heli.rotation.z > 15) heli.rotation.z = 0;
	}		
	else if (THREE.Math.radToDeg(heli.rotation.z) > 0){ //if tilted left
		heli.rotation.z -= tiltRate * gameSpeed; //tilt right towards zero tilt
		if (heli.rotation.z < 0) heli.rotation.z = 0;
	}
	
	if (velocityVector.x > 0){ //if going right
		velocityVector.x += -boost*.1;
	}
	else if (velocityVector.x < 0){
		velocityVector.x += boost*.1;
	}
}

const accelerate = (direction, multiplier) => {
	if (direction == 'left'){
		velocityVector.x += -boost * multiplier;
	} else if (direction =='right') {
		velocityVector.x += boost * multiplier;
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

let drag = .1;

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
				accelerate('left', .1);
			} else if (targetPosition - margin/4 > heli.position.x){
				tiltRight();
				accelerate('right', .1);
			}
		} else {
			//if within margin
			if (Math.abs(heli.position.x - targetPosition) < margin){
				brake();
			} else findMode = true;
		}
		v1.copy( forceVector ).applyQuaternion( heli.quaternion );
		velocityVector.add(v1);
		if (velocityVector.length() > heliMaxSpeed) velocityVector.normalize().multiplyScalar(heliMaxSpeed);
		heli.position.add(velocityVector.multiplyScalar(gameSpeed));
		// if (velocityVector.length() > 1){
		// 	console.log('somethings aint good', velocityVector, heli.position);
		// }
		// console.log(heli.position);
	

	} else {
		if (velocityVector.y > -heliMaxSpeed)
			velocityVector.y += -gravity;
		if (heli.position.y < heliHeight && velocityVector.y < 0) {
			if (velocityVector.y < heliMaxSpeed)
				forceVector.y = boost;
		}
		if (flyOffDirection == 'left'){
			tiltLeft();
			accelerate('left', .1);
		} else {
			tiltRight();
			accelerate('right', .1);
		}
		v1.copy( forceVector ).applyQuaternion( heli.quaternion );
		velocityVector.add(v1);
		//drag
		// velocityVector.add(velocityVector.normalize().negate().multiplyScalar(drag * (velocityVector.length * velocityVector.length)));
		//
		if (velocityVector.length() > heliMaxSpeed) velocityVector.normalize().multiplyScalar(heliMaxSpeed);
		heli.position.add(velocityVector.multiplyScalar(gameSpeed));
		if (velocityVector.length() > 1){
			// console.log('somethings aint good', velocityVector, heli.position);
		}
	
	}

	
}

export const getQueueToFly = () => {
	if (!flyNormal)
		if (heli.position.distanceTo(character.mesh.position) > 85){
			flyOn();
		}
}

let flyOffDirection;

export const flyOff = () => {
	console.log('fly off');
	flyNormal = false;
	if (Math.random() < .5){
		flyOffDirection = 'left';
	} else flyOffDirection = 'right';
}

export const flyOn = () => {
	console.log('fly on');
	if (flyOffDirection == 'left'){
		heli.position.x = character.mesh.position.x + 85;
	} else {
		heli.position.x = character.mesh.position.x - 85;
	}
	flyNormal = true;

}

export const dodge = () => {
	if (flyNormal){
		if (dodgeMode) {
			dodgeMode = false;
		} else {
			if (Math.random() < .5){
				dodgeDirection = -20;
			} else dodgeDirection = 20;
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
export let grappled = false;

export const blowUp = () => {
	setHeliShooting(false);
	hoverSound.stop();
	if (gameStatus == 'gameOver' && !spawnMute)
		slowSound = playSound(crash, new THREE.Audio(listener));
	else if (!spawnMute) {
		blowUpSfx[0].play().onEnded(blowUpSfx.shift());
		blowUpSfx[0].play().onEnded(blowUpSfx.shift());
	}
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
	if (grappled){
		scene.add(heliGrappled.spr);
		crashedHelis.push(heliGrappled);
		scene.remove(heli);
	} else {
		scene.add(crashed.spr);
		scene.add(explosion.spr);
		crashedHelis.push(crashed);
		explosions.push(explosion);
		explosion.spr.position.x = heli.position.x + 4;
		explosion.spr.position.y = heli.position.y;
		scene.remove(heli);
		scene.remove(heliFlying.spr);
	}
	heliPartVelocityX.push(1);
	heliPartVelocityY.push(.0005);

	if (heliCount % 3 == 0 && gameStatus == 'play'){
		let dropInfo = getDropInfo();
		scene.add(dropInfo.dropMesh);
		dropInfo.dropMesh.position.x = heli.position.x;
		dropInfo.dropMesh.position.y = heli.position.y;
		dropInfo.dropMesh.position.z = 2;
		pickUps.push(dropInfo);
	}
	if (gameStatus == 'play'){
		spawn();
	}
	grappled = false;
}

export const pullDownHeli = (bullet) => {
	grappled = true;
}

const getDropInfo = () => {
	let random = Math.random();
	let dropInfo;
	if (random < .2){
		dropInfo = getRpg();
	} else if (random < .4){
		dropInfo = getShotgun();
	} else if (random < .5){
		dropInfo = getHealthpack();
	} else if (random < .6){
		dropInfo = getAkimbo();
	} else if (random < .7){
		dropInfo = getHeatSeekers();
	} else if (random < .8) {
		dropInfo = new Flamethrower();
	} else if (random < .9) {
		dropInfo = getGrappleCannon();
	}
	return dropInfo;
}

let bulletMat = getMaterial(new THREE.TextureLoader().load(require('../pics/bullet.png')));
let bullet2Mat = getMaterial(new THREE.TextureLoader().load(require('../pics/bullet2.png')));
let seekerTex = getMaterial(new THREE.TextureLoader().load(require('../pics/seekerTex.png')));

export const getBulletMesh = (color, s) => {
	let size = s;
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
	} else if (color == 'heatSeekers'){
		let geometry = new THREE.PlaneGeometry(3.5, 3.5, 32);
		mesh = new THREE.Mesh(geometry, seekerTex);
		mesh.transparent = true;
		mesh.opacity = 1;
		mesh.position.z = .1;
	} else if (color == 'grappleCannon') {
		mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size, 32), bullet2Mat);
		mesh.position.z = .1;
	}else {
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
	if (gun == 'akimboMac10s'){
		let mat = getMaterial(getTexture(require('../pics/akimboDrop.png')));
		mesh = new THREE.Mesh(dropGeom, mat);
	} else if (gun == 'rpg'){
		let mat = getMaterial(getTexture(require('../pics/rpgDrop.png')));
		mesh = new THREE.Mesh(dropGeom, mat);
	} else if (gun == 'shotgun'){
		let mat = getMaterial(getTexture(require('../pics/shotgunDrop.png')));
		mesh = new THREE.Mesh(dropGeom, mat);
	} else if (gun == 'standardGun'){
		let mat = getMaterial(getTexture(require('../pics/standardDrop.png')));
		mesh = new THREE.Mesh(dropGeom, mat);
	} else if (gun == 'healthpack'){
		let mat = getMaterial(getTexture(require('../pics/healthpackDrop.png')));
		mesh = new THREE.Mesh(dropGeom, mat);
	} else if (gun == 'flamethrower'){
		let mat = getMaterial(getTexture(require('../pics/flamethrowerDrop.png')));
		mesh = new THREE.Mesh(dropGeom, mat);
	} else if (gun == 'heatSeekers'){
		let mat = getMaterial(getTexture(require('../pics/heatSeekersDrop.png')));
		mesh = new THREE.Mesh(dropGeom, mat);
	} else if (gun == 'grappleCannon'){
		let mat = getMaterial(getTexture(require('../pics/grappleCannonDrop.png')));
		mesh = new THREE.Mesh(dropGeom, mat);
	}
	mesh.transparent = true;
	mesh.opacity = 1;
	mesh.position.z = 2;
	return mesh;
}


let rpgPickup = require('../sounds/rpg.wav');
let akimboPickup = require('../sounds/akimbomac10s.wav');
let shotgunPickup = require('../sounds/shotgun.wav');
let shotgunBlast = require('../sounds/shotgunBlast.wav');
let explosionSound = require('../sounds/explosion.wav');
let metalHit = require('../sounds/metalHit.wav');
let gunshot = require('../sounds/gunshot.wav');
let gunshot2 = require('../sounds/gunshot2.wav');
let akimboMac10sShot = require('../sounds/akimbomac10sShot.wav');
let rpgBlast = require('../sounds/rpgBlast.wav');
let rpgHit = require('../sounds/explosion.wav');
let ouch = require('../sounds/ouch.wav');
let healthpackPickup = require('../sounds/healthpackPickup.wav');
let flamethrowerPickup = require('../sounds/flamethrowerPickup.wav');
let flamethrowerShot = require('../sounds/flamethrowerShot.wav');
let heatSeekersPickup = require('../sounds/heatSeekingMissilesPickup.wav');
let grappleCannonPickup = require('../sounds/grappleCannonPickup.wav');
let grappleShot = require('../sounds/grappleShot.wav');

export const Gun = function (color, name, size, speed, ammo, fullAmmoMax, damage, velocity, reloadTime, shotSound, hitSound, pickupSound) {
	this.color = color;
	this.name = name;
	this.size = size;
	this.dropMesh = getDropIconMesh(name, 6);
	this.mesh = null;
	this.speed = speed;
	this.ammo = ammo;
	this.fullAmmoMax = fullAmmoMax;
	this.damage = damage;
	this.velocity = velocity;
	this.reloadTime = reloadTime;
	this.shotSound = shotSound;
	this.hitSound = hitSound;
	this.pickupSound = pickupSound;
	this.getBullet = function() {return getBulletMesh(this.name, this.size);};
	this.getDropIcon = function(name, scale) { return getDropIconMesh(name, scale);}
}

let getShotgun = () => { return new Gun(
	0xff0000, //color
	'shotgun',//name
	1.2,//size
	.8,//speed
	15,//ammo
	15,//ammomax
	1,// damage
	0,//vel
	1700,//reload time
	shotgunBlast,
	metalHit,
	shotgunPickup
);} 

export let getGrappleCannon = () => {
	return new Gun(0x000000, 'grappleCannon', 1.5, .7, 1,1, 30, 0, 5000, grappleShot, metalHit, grappleCannonPickup);
}
export let getRpg = () => {return new Gun(0xff0000, 'rpg', 1.6, .7,   6,  6,  10,    0,     7000, rpgBlast, rpgHit, rpgPickup);}
export let getAkimbo = () => {return new Gun(0xff0000, 'akimboMac10s', 1.2, .8,   50,  50,  1,    0,  550, akimboMac10sShot, metalHit, akimboPickup);}
export let getHealthpack = () => {return new Gun(0x000000, 'healthpack', 1.2, .5, 1,1,1,0,1, null, null, healthpackPickup);}
export let getStandard = () => {return new Gun(0x000000, 'standardGun', 1.2, .8, -1, -1, 1, 0, 600, gunshot2, metalHit, null);}
export let getHeatSeekers = () => {return new Gun(0x000000, 'heatSeekers', 1.6, .45, 3, 3, 10, 0, 7000, rpgBlast, rpgHit, heatSeekersPickup);}

export let rpg = getRpg();
export let akimboMac10s = getAkimbo();
export let shotgun = getShotgun();
export let standardGun = getStandard();
export let healthpack = getHealthpack();
export let heatSeekers = getHeatSeekers();
export let grappleCannon = getGrappleCannon();


// export let antiMatterDevice = {
// 	color = 0x0000ff;
// 	name = 'antiMatterDevice';
// 	mesh = getDropIconMesh('antiMatterDevice'; 6);
// 	size = 2;
// 	speed = .35;
// 	ammo = 1;
// 	fullAmmoMax = 1;
// 	damage = 50;
// 	velocity = 0;
// 	reloadTime = 20000;
// 	shotSound = null;
// 	hitSound = null;
// 	pickupSound = null;
// 	getBullet = function() { return getBulletMesh('0x0000ff';2);};
// 	getDropIcon = function(name; scale) { return getDropIconMesh(name; scale);}
// }

export const Flamethrower = function () {
	this.color = 0x0000ff;
	this.name = 'flamethrower';
	this.mesh = getDropIconMesh('flamethrower', 6);
	this.size = 2;
	this.flames = [];
	this.speed = .5;
	this.ammo = 100;
	this.fullAmmoMax = 100;
	this.damage = .1;
	this.velocity = 0;
	this.reloadTime = 200;
	this.shotSound = flamethrowerShot;
	this.hitSound = metalHit;
	this.pickupSound = flamethrowerPickup;
	this.getBullet = function() { return new Flame();};
	this.getDropIcon = function(name, scale) { return getDropIconMesh(name, scale);};
	this.getFlame = function() { return new Flame();};
}
export const Flame = function () {
	this.maxSize = 50;
	this.lifeSpan = 60;
	this.opacity = 1;
	this.speed = 2;
	this.size = 1;
	this.mesh = getFlameMesh();
	this.velocityVector = new THREE.Vector3();
}

export const getFlameMesh = () => {
	let mesh = new THREE.Mesh(new THREE.PlaneGeometry(1,1,32), getMaterial(getTexture(require('../pics/flame.png'))));
	mesh.transparent = true;
	mesh.opacity = 1;
	return mesh;
}

export let flamethrower = new Flamethrower();
