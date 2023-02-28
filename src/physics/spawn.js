import { camera, renderer, scene, init, character, objects, heliFlying, 
	crashedHeli, updateSprite, rocketTex, rocket, getCrashedHeli, getGrappledHeli, 
	getExplosion, getMaterial, heliGrappled, getParachute } from "./Initialize.js";
import { heliCount, gameSpeed, gameStatus, playSound, mute, setHeliShooting, listener, hoverSound } from "../app.js";
import * as THREE from 'three';

export let heli;
export let spawnMute = false;
let crash = require('../sounds/crash.ogg');
let hover = require('../sounds/hover.ogg');
// let fadeIn = require('../sounds/fadeIn.ogg');
// let fadeOut = require('../sounds/fadeOut.ogg');

export const muteSpawn = () => {
	spawnMute = true;
}

export const setSpawnSound = () => {
	spawnMute = mute;
}

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
	hoverSound.play();
	if (spawnMute)
		hoverSound.setVolume(0);
	let geometry = new THREE.PlaneGeometry( 30, 10, 32 );
	let material = new THREE.MeshBasicMaterial( {color: 0x000000, side: THREE.FrontSide} );
	heli = new THREE.Mesh( geometry, material );
	material.transparent = true;
	material.opacity = 0;
	heli.position.y = 80;
	scene.add( heli );
	heliFlying.spr.position.x = heli.position.x;
	heliFlying.spr.position.y = heli.position.y;
	updateSprite(heliFlying);
	scene.add(heliFlying.spr);

	if (heliCount % 8 == 0){
		if (heliCount == 0) pickUps = [];
        let drop = getDropInfo();
        pickUps.push(drop);
        scene.add(drop.dropMesh);
        drop.dropMesh.position.x = 219.5;
        drop.dropMesh.position.y = 50;
        drop.dropMesh.position.z = 2;
    }
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
	if (THREE.MathUtils.radToDeg(heli.rotation.z) < 0){ //if tilted right
			heli.rotation.z += tiltRate * gameSpeed; //tilt left towards zero tilt
			if (heli.rotation.z > 15) heli.rotation.z = 0;
	}		
	else if (THREE.MathUtils.radToDeg(heli.rotation.z) > 0){ //if tilted left
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
	if (THREE.MathUtils.radToDeg(heli.rotation.z) < maxRotation)
		heli.rotation.z += tiltRate * gameSpeed;
}

const tiltRight = () => {
	if (THREE.MathUtils.radToDeg(heli.rotation.z) > -maxRotation)
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

// heliFlyoff = setInterval(flyOff, 20000);
// dodger = setTimeout( function() {
//     dodge();
// heliDodging = setInterval(dodge, 5000)
// }, 3000);
let dodgeInterval = 5000;
let dodgeDelta = -5000;
let dodgeOldTime = Date.now();
let flyoffOldTime = Date.now();
let flyoffInterval = 20000;
let flyoffDelta = 0;

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
    dodgeDelta = curTime - dodgeOldTime;
    flyoffDelta = curTime - flyoffOldTime;
    if (delta > interval){
        oldTime = curTime - (delta % interval);
        updateSprite(heliFlying);
    }
  	if (dodgeDelta > dodgeInterval) {
  		dodge();
  		dodgeOldTime = Date.now();
  	}
  	if (flyoffDelta > flyoffInterval) {
  		flyOff();
  		flyoffOldTime = Date.now();
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
	flyNormal = false;
	if (Math.random() < .5){
		flyOffDirection = 'left';
	} else flyOffDirection = 'right';
}

export const flyOn = () => {
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
export let pickUpsParachutes = [];

export let slowSound;
export let grappled = false;

export const blowUp = () => {
	setHeliShooting(false);
	if (hoverSound.isPlaying) hoverSound.stop();
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
	if (grappled){
		let grappledMesh = getGrappledHeli();
		grappledMesh.spr.position.copy(heli.position);
		grappledMesh.spr.material.rotation = heli.rotation.z;
		scene.add(grappledMesh.spr);
		crashedHelis.push(grappledMesh);
		scene.remove(heli);
		scene.remove(heliFlying.spr);
	} else {
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
	}
	heliPartVelocityX.push(1);
	heliPartVelocityY.push(.0005);

	if (heliCount % 3 == 0 && gameStatus == 'play'){
		let dropInfo = getDropInfo();
		scene.add(dropInfo.dropMesh);
		dropInfo.dropMesh.position.x = heli.position.x;
		dropInfo.dropMesh.position.y = heli.position.y;
		dropInfo.dropMesh.position.z = 2;
		pickUps.unshift(dropInfo);
		// let parachute = getParachute();
		// parachute.spr.position.copy(dropInfo.dropMesh.position);
		// pickUpsParachutes.unshift(parachute);
		// scene.add(parachute.spr);
	}
	if (gameStatus == 'play'){
		spawn();
	}
	grappled = false;
}

export const pullDownHeli = () => {
	grappled = true;
}


export const getDropInfo = () => {
	let random = Math.random();
	let dropInfo;
	let chance = 1/8;
	if (random < chance){
		dropInfo = getRpg();
	} else if (random < chance * 2){
		dropInfo = getShotgun();
	} else if (random < chance * 3){
		dropInfo = getHealthpack();
	} else if (random < chance * 4){
		dropInfo = getAkimbo();
	} else if (random < chance * 5){
		dropInfo = getHeatSeekers();
	} else if (random < chance * 6) {
		dropInfo = new Flamethrower();
	} else if (random < chance * 7) {
		dropInfo = getGrappleCannon();
	} else {//if (random < chance * 8) {
		//dropInfo = getBulletTime();
		dropInfo = getShield();
	}
	return dropInfo;
}

let bulletMat = getMaterial(new THREE.TextureLoader().load(require('../pics/bullet.png').default));
let bullet2Mat = getMaterial(new THREE.TextureLoader().load(require('../pics/bullet2.png').default));
let seekerTex = getMaterial(new THREE.TextureLoader().load(require('../pics/seekerTex.png').default));

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
		let mat = getMaterial(getTexture(require('../pics/akimboDrop.png').default));
		mesh = new THREE.Mesh(dropGeom, mat);
	} else if (gun == 'rpg'){
		let mat = getMaterial(getTexture(require('../pics/rpgDrop.png').default));
		mesh = new THREE.Mesh(dropGeom, mat);
	} else if (gun == 'shotgun'){
		let mat = getMaterial(getTexture(require('../pics/shotgunDrop.png').default));
		mesh = new THREE.Mesh(dropGeom, mat);
	} else if (gun == 'standardGun'){
		let mat = getMaterial(getTexture(require('../pics/standardDrop.png').default));
		mesh = new THREE.Mesh(dropGeom, mat);
	} else if (gun == 'healthpack'){
		let mat = getMaterial(getTexture(require('../pics/healthpackDrop.png').default));
		mesh = new THREE.Mesh(dropGeom, mat);
	} else if (gun == 'flamethrower'){
		let mat = getMaterial(getTexture(require('../pics/flamethrowerDrop.png').default));
		mesh = new THREE.Mesh(dropGeom, mat);
	} else if (gun == 'heatSeekers'){
		let mat = getMaterial(getTexture(require('../pics/heatSeekersDrop.png').default));
		mesh = new THREE.Mesh(dropGeom, mat);
	} else if (gun == 'grappleCannon'){
		let mat = getMaterial(getTexture(require('../pics/grappleCannonDrop.png').default));
		mesh = new THREE.Mesh(dropGeom, mat);
	} else if (gun == 'bulletTime') {
		let mat = getMaterial(getTexture(require('../pics/bulletTimeDrop.png').default));
		mesh = new THREE.Mesh(dropGeom, mat);
	} else if (gun == 'shield') {
		let mat = getMaterial(getTexture(require('../pics/shieldDrop.png').default));
		mesh = new THREE.Mesh(dropGeom, mat);
	}
	mesh.transparent = true;
	mesh.opacity = 1;
	mesh.position.z = 2;
	return mesh;
}


let rpgPickup = require('../sounds/rpg.ogg');
let akimboPickup = require('../sounds/akimbomac10s.ogg');
let shotgunPickup = require('../sounds/shotgun.ogg');
let shotgunBlast = require('../sounds/shotgunBlast.ogg');
let explosionSound = require('../sounds/explosion.ogg');
let metalHit = require('../sounds/metalHit.ogg');
let gunshot = require('../sounds/gunshot.ogg');
let gunshot2 = require('../sounds/gunshot2.ogg');
let akimboMac10sShot = require('../sounds/akimbomac10sShot.ogg');
let rpgBlast = require('../sounds/rpgBlast.ogg');
let rpgHit = require('../sounds/explosion.ogg');
let ouch = require('../sounds/ouch.ogg');
let healthpackPickup = require('../sounds/healthpackPickup.ogg');
let flamethrowerPickup = require('../sounds/flamethrowerPickup.ogg');
let flamethrowerShot = require('../sounds/flamethrowerShot.ogg');
let heatSeekersPickup = require('../sounds/heatSeekingMissilesPickup.ogg');
let grappleCannonPickup = require('../sounds/grappleCannonPickup.ogg');
let grappleShot = require('../sounds/grappleShot.ogg');
let bulletTimePickup = require('../sounds/bulletTimePickup.ogg');
let shieldPickup = require('../sounds/shieldPickup.ogg');

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
	return new Gun(0x000000, 'grappleCannon', 1.5, .7, 2, 2, 30, 0, 25000, grappleShot, metalHit, grappleCannonPickup);
}
export let getRpg = () => {return new Gun(0xff0000, 'rpg', 1.6, 1,   8,  8,  10,    0,     4000, rpgBlast, rpgHit, rpgPickup);}
export let getAkimbo = () => {return new Gun(0xff0000, 'akimboMac10s', 1.2, .8,   50,  50,  1,    0,  550, akimboMac10sShot, metalHit, akimboPickup);}
export let getHealthpack = () => {return new Gun(0x000000, 'healthpack', 1.2, .5, 1, 1, 1, 0, 1, null, null, healthpackPickup);}
export let getStandard = () => {return new Gun(0x000000, 'standardGun', 1.2, .8, -1, -1, 1, 0, 600, gunshot2, metalHit, null);}
export let getHeatSeekers = () => {return new Gun(0x000000, 'heatSeekers', 1.6, .45, 6, 6, 10, 0, 7000, rpgBlast, rpgHit, heatSeekersPickup);}
export let getBulletTime = () => {return new Gun(0x000000, 'bulletTime', 1.6, .45, 3, 3, 10, 0, 15000, rpgBlast, rpgHit, bulletTimePickup);}
export let getShield = () => {return new Gun(0x000000, 'shield', 1.6, .45, 3, 3, 10, 0, 20000, rpgBlast, rpgHit, shieldPickup);}

export let rpg = getRpg();
export let akimboMac10s = getAkimbo();
export let shotgun = getShotgun();
export let standardGun = getStandard();
export let healthpack = getHealthpack();
export let heatSeekers = getHeatSeekers();
export let grappleCannon = getGrappleCannon();
export let bulletTime = getBulletTime();
export let shield = getShield();


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
	this.dropMesh = getDropIconMesh(this.name, 6);
	this.mesh;
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
	this.lifeSpan = 35;
	this.opacity = 1;
	this.speed = 1;
	this.size = 1;
	this.mesh = getFlameMesh();
	this.velocityVector = new THREE.Vector3();
}

export const getFlameMesh = () => {
	let mesh = new THREE.Mesh(new THREE.PlaneGeometry(1,1,32), getMaterial(getTexture(require('../pics/flame.png').default)));
	mesh.transparent = true;
	mesh.opacity = 1;
	return mesh;
}

export let flamethrower = new Flamethrower();


