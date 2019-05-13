import * as THREE from 'three';

import { bodies, camera, renderer, scene, init, character, objects, 
    moveCharacter, walk, stand, jump, updateSprite, 
    arm, armTex, armTex2, armTex3, armTexLeft, armTex2Left, armTex3Left, leftFoot, rightFoot, 
    rocket, rocketTex, rocketTex2, changeJumpingDir, getExplosion, getBulletHit, updateBackground,
    startGameButton, instructionsButton, creditsButton, mainMenu, buttonHover, instructions, backButton } from "./physics/Initialize.js";
import { checkCollisions, checkBoundingBoxes, checkBulletCollision, checkHeliBulletCollision, checkMenuCollision } from "./physics/checkForCollision.js";
import { spawn, rotateAboutPoint, move, heli, flyOff, dodge, 
    blowUp, helipart1, helipart2, heliPartVelocityX, heliPartVelocityY, pickUps,
    shotgun, akimboMac10s, rpg, flyNormal, getBulletMesh, crashedHelis, explosions, volume, slowSound } from "./physics/spawn.js";
import 'normalize.css';
import './styles/styles.scss';

mainMenu();

let ySpeed = 1;
let xSpeed = .3;
let gravity = 0;
let bulletSpeed = .5;
const GRAVITATION = 0.028;
const BOUNDS = 500;
const DRAG = 0.028;
let hasContactedGround = false;
const HELIHEALTHMAX = 20;
let heliHealth = 20;
export let gameStatus = "play";
let standardGun = {
    color: 0x00ff00,
    material: new THREE.MeshBasicMaterial({color: 0x00ff00, side: THREE.FrontSide}),
    name: 'standardGun',
    size: 1.1,
    speed: .5,
    ammo: -10,
    fullAmmoMax: -10,
    damage: 1,
    velocity: 0,
    mesh: null,
    reloadTime: 250,
    shotSound: null,
    hitSound: null,
    pickupSound: null,
    getBullet: function() {return getBulletMesh('0x00ff00', 1.1)}
}
let equippedWeapon = standardGun;

export let heliCount = 0;
export let playerHealth = 8;
const PLAYERHEALTHMAX = 8;
let mute = false;


let xVelocity = 0;
let yVelocity = 0;

//Key events array saves which keys are currently held down
//This allows user to release a key and have the other key that is being held down be used
let keyEvents = [];

let bullets = [];
let heliBullets = [];

let mouse = {
    clientX: 0,
    clientY: 0
};

let song = require('./sounds/gameplayMusic.wav');
let menuSong = require('./sounds/menuMusic.wav');

let heliShooting;
let heliFlyoff;
let heliDodging;
let dodger;

let music;

const start = () => {
    scene.remove.apply(scene, scene.children);
    init();
    menuMusic.stop();
    // slowSound.stop();
    character.mesh.position.y = 120;
    character.mesh.position.x = 0;
    playSound(explosion);
    spawn();
    gameStatus = 'play'
    rpg.mesh = rocket;
    gameSpeed = 1;
    scene.remove(deathPlane);
    heliHealth = HELIHEALTHMAX;
    heliCount = 0;
    playerHealth = PLAYERHEALTHMAX;
    moveCharacter(0, character.mesh.position.y);
    if (!mute){
        music = playSound(song);
        console.log(music);
    }
    heliShooting = setInterval(shootHeliBullet, 500);
    heliFlyoff = setInterval(flyOff, 20000);
    dodger = setTimeout( function() {
        dodge();
    heliDodging = setInterval(dodge, 5000)
    }, 3000);
}

gameStatus = 'ready';

let walkInterval;
let walkingLeft = false;
let walkingRight = false;
let jumping = false;
let walkTime = 500;

document.addEventListener("keydown", onDocumentKeyDown, false);
function onDocumentKeyDown(event) {
    let keyCode = event.which;
    if (keyCode == 38) { // jump
        //Allows jump only if on ground
    	if (Math.abs(yVelocity) == 0){
            yVelocity = ySpeed;
            gravity = GRAVITATION;
            walkingRight = false;
            walkingLeft = false;
            if (!jumping){
                jumping = true;
                jump(standDir);
            }
        }
        //
        keyEvents[0] = 1;
    } else if (keyCode == 40) { //down
        //No ducking yet
    } else if (keyCode == 37) { //left
        if (!walkingLeft && yVelocity == 0){
            walkingLeft = true;
            walkingRight = false;
            jumping = false;
            walk('left');
        } else if (jumping){
            changeJumpingDir('left');
        }
        //Move left
        xVelocity = -xSpeed;
        //
        keyEvents[2] = 1;
    } else if (keyCode == 39) { //right
        if (!walkingRight && yVelocity == 0){
            walkingRight = true;
            walkingLeft = false;
            jumping = false;
            walk('right');
        } else if (jumping){
            changeJumpingDir('right');
        }
        //Move right
        xVelocity = xSpeed;
        //
		keyEvents[3] = 1;
    } else if (keyCode == 77) {
        mute = !mute;
        if (music.isPlaying) 
            music.pause();
        else music.play();
    }
};

document.addEventListener("keyup", onDocumentKeyUp, false);
function onDocumentKeyUp(event) {
    var keyCode = event.which;
    if (keyCode == 38) {
        //Stop jumping when released
    	keyEvents[0] = 0;
        //
    } else if (keyCode == 40) {
        //No ducking mechanics right now            
    } else if (keyCode == 37) {
        //If release left, and right is pressed, go right. otherwise stop
        keyEvents[2] = 0;
        if (keyEvents[3]){
        	xVelocity = xSpeed;
            if (yVelocity == 0){
                jumping = false;
                walkingRight = true;
                walkingLeft = false;
                walk('right');
            } else if (jumping) {
                changeJumpingDir('right');
            }
        } else{
            walkingRight = false;
            walkingLeft = false;
            if (yVelocity == 0){
                jumping = false;
                stand('left');
            } else if (!jumping) {
                jumping = true;
                jump('left');
            } else if (jumping){
                changeJumpingDir('left');
            }
            xVelocity = 0;
        }
        //
    } else if (keyCode == 39) {
        //See above
        keyEvents[3] = 0;
        if (keyEvents[2]){
        	xVelocity = -xSpeed;
            if (yVelocity == 0){
                jumping = false;
                walkingRight = false;
                walkingLeft = true;
                walk('left');
            } else if (jumping) {
                changeJumpingDir('left');
            }
        } else {
            walkingRight = false;
            walkingLeft = false;
            if (yVelocity == 0){
                jumping = false;
                stand('right');
            }
            else if (!jumping) {
                jumping = true;
                jump('right');
            } else if (jumping){
                changeJumpingDir('right');
            }
            xVelocity = 0;
        }
        //
    }
};

let hovering = false;
let hovering2 = false;
let hovering3 = false;
let hovering4 = false;

document.addEventListener("mousemove", function(event){
    getMouseCoords(event);
    if (gameStatus == 'ready'){
        getMousePos();
        if (onMainMenu) {
            if (checkMenuCollision(pos, startGameButton)){
                if (!hovering)
                    playSound(tick);
                hovering = true;
                buttonHover('startGameButton', 'down');
            } else {
                buttonHover('startGameButton', 'up');
                hovering = false;
            }
            if (checkMenuCollision(pos, instructionsButton)){
                if (!hovering2)
                    playSound(tick);
                hovering2 = true;
                buttonHover('instructionsButton', 'down');
            } else {
                buttonHover('instructionsButton', 'up');
                hovering2 = false;
            }
            if (checkMenuCollision(pos, creditsButton)){
                if (!hovering3)
                    playSound(tick);
                hovering3 = true;
                buttonHover('creditsButton', 'down');
            } else {
                buttonHover('creditsButton', 'up');
                hovering3 = false;
            }
        }
        if (instructionsMenu)
            if (checkMenuCollision(pos, backButton)){
                if (!hovering4)
                    playSound(tick);
                hovering4 = true;
                buttonHover('backButton', 'down');
            } else {
                buttonHover('backButton', 'up');
                hovering4 = false;
            }
    }
});

const getMouseCoords = (event) => {
    mouse.clientX = event.clientX;
    mouse.clientY = event.clientY;
}

let shoot;
let reloaded = true;
let mouseDown = false;
let instructionsMenu = false;
let onMainMenu = true;

document.addEventListener("mousedown", function(event){
    mouseDown = true;
    if (gameStatus == 'play'){
        if (reloaded){
            shootBullet();
            shoot = setInterval(shootBullet, equippedWeapon.reloadTime);
        }
    } else if (gameStatus == 'gameOver') {
        text2.style.display = 'none';
        start();
        gameStatus = 'play';
        for (var i = 0; i < heliBullets.length; i++) {
            scene.remove(heliBullets[i].mesh);
        }
        heliBullets = [];
        displayHealthBar();
        healthBar.position.y = 30;
        healthBarPosition = healthBar.position.y;

    } else if (gameStatus == 'ready'){
        console.log('ready');
        console.log(pos);
        if (checkMenuCollision(pos, startGameButton)){
            onMainMenu = false;
            start();
        } else if (checkMenuCollision(pos, instructionsButton)){
            onMainMenu = false;
            instructionsMenu = true;
            instructions();
        } else if (checkMenuCollision(pos, creditsButton)){
            console.log('credits');
        } else if (checkMenuCollision(pos, backButton)){
            instructionsMenu = false;
            onMainMenu = true;
            mainMenu();
        }
    }
});

document.addEventListener("mouseup", function(event){
    mouseDown = false;
    clearInterval(shoot);
});

const shootHeliBullet = () => {
    if (flyNormal){
        let square = getBulletMesh('heli', 1);
        scene.add( square );
        if (!mute){
            playSound(gunshot, false, 1, volume);
        }
        square.position.x = heli.position.x;
        square.position.y = heli.position.y;
        let tmpHeliPos = new THREE.Vector3(heli.position.x, heli.position.y, 0);
        let bulletVelocity = tmpHeliPos.sub(character.mesh.position).normalize().negate();
        let bullet = {
            velocity: bulletVelocity.multiplyScalar(bulletSpeed),
            mesh: square,
        }
        heliBullets.push(bullet);
    }
}

let vec = new THREE.Vector3(); 
let pos = new THREE.Vector3();
let shotThisFrame = 2;

export const getMousePos = () => {
    vec.set(
    ( mouse.clientX / window.innerWidth ) * 2 - 1,
    - ( mouse.clientY / window.innerHeight ) * 2 + 1,
    0.5 );
    vec.unproject( camera );
    vec.sub( camera.position ).normalize();
    var distance = - camera.position.z / vec.z;
    pos.copy( camera.position ).add( vec.multiplyScalar( distance ) );
}

const shootBullet = () => {
    shotThisFrame = 0;
    if (equippedWeapon.name != standardGun.name){
        equippedWeapon.ammo--;
        updateWeaponInfo();
    }
    //Reload
    reloaded = false;
    setTimeout(function(){reloaded = true;}, equippedWeapon.reloadTime);

    if (!mute) playSound(equippedWeapon.shotSound);

    getMousePos();

    if (equippedWeapon.name == rpg.name) {
        // console.log(rocket);
        let rocketMesh = equippedWeapon.getBullet();
        scene.add(rocketMesh);
        rocketMesh.position.x = arm.position.x;
        rocketMesh.position.y = arm.position.y;
        // rocket.lookAt(pos);
        let tmpCharPos = new THREE.Vector3();
        tmpCharPos.copy(arm.position);
        tmpCharPos.z = 0;
        let bulletVelocity = tmpCharPos.sub(pos).normalize().negate();
        let degrees = bulletVelocity.angleTo(new THREE.Vector3(1,0,0));
        rocketMesh.rotation.z = degrees;
        let bullet = {
            velocity: bulletVelocity.multiplyScalar(equippedWeapon.speed),
            mesh: rocketMesh,
            damage:equippedWeapon.damage,
            sound: equippedWeapon.hitSound
        }
        bullets.push(bullet);
    } else {
        let tmpCharPos = new THREE.Vector3();
        tmpCharPos.copy(arm.position);
        tmpCharPos.z = 0;
        let bulletVelocity = tmpCharPos.sub(pos).normalize().negate();
        let newBullet = equippedWeapon.getBullet();
        scene.add(newBullet);
        newBullet.position.x = arm.position.x;
        newBullet.position.y = arm.position.y;
        let bullet = {
            velocity: bulletVelocity.multiplyScalar(equippedWeapon.speed),
            mesh: newBullet,
            damage:equippedWeapon.damage,
            sound:equippedWeapon.hitSound
        }
        bullets.push(bullet);
    }

    if (equippedWeapon.name == 'akimboMac10s'){
        let square2 = equippedWeapon.getBullet();
        scene.add(square2);
        if (!mute)
            playSound(equippedWeapon.shotSound);
        let tmpPos = new THREE.Vector3();
        tmpPos.copy(pos);
        let offset = 2;
        tmpPos.x += offset;
        // let tmpCharPos2 = new THREE.Vector3(character.mesh.position.x - offset, character.mesh.position.y, 0);
        let tmpCharPos2 = new THREE.Vector3();
        tmpCharPos2.copy(arm.position);
        tmpCharPos2.x -= offset;
        let bulletVelocity2 = tmpCharPos2.sub(tmpPos).normalize().negate();
        
        let bullet2 = {
            velocity: bulletVelocity2.multiplyScalar(equippedWeapon.speed),
            mesh: square2,
            damage: equippedWeapon.damage,
            sound: equippedWeapon.hitSound
        }
        square2.position.x = arm.position.x - offset;
        square2.position.y = arm.position.y;
        bullets.push(bullet2);
    } else if (equippedWeapon.name == 'shotgun'){
        for (var i = 0; i < 4; i++) {
            let square2 = equippedWeapon.getBullet();
            scene.add(square2);
            let tmpPos = new THREE.Vector3(0);
            tmpPos.copy(pos);
            let offset = 0;
            if (i == 0) offset = -2;
            else if (i == 1) offset = -4;
            else if (i == 2) offset = 2;
            else if (i == 3) offset = 4;
            tmpPos.x += offset;
            let tmpCharPos2 = new THREE.Vector3(arm.position.x, arm.position.y, 0);
            let bulletVelocity2 = tmpCharPos2.sub(tmpPos).normalize().negate();
            
            let bullet2 = {
                velocity: bulletVelocity2.multiplyScalar(equippedWeapon.speed),
                mesh: square2,
                damage: equippedWeapon.damage,
                sound: equippedWeapon.hitSound
            }
            square2.position.x = arm.position.x;
            square2.position.y = arm.position.y;
            bullets.push(bullet2);
        }
    }


    if (equippedWeapon.ammo == 0){
        equippedWeapon = standardGun;
        updateWeaponInfo();
        //clearInterval(shoot);
        //shoot = setInterval(shootBullet, equippedWeapon.reloadTime);
    }
}

let rpgPickup = require('./sounds/rpg.wav');
let akimboPickup = require('./sounds/akimboMac10s.wav');
let shotgunPickup = require('./sounds/shotgun.wav');
let shotgunBlast = require('./sounds/shotgunBlast.wav');
let explosion = require('./sounds/explosion.wav');
let metalHit = require('./sounds/metalHit.wav');
let gunshot = require('./sounds/gunshot.wav');
let gunshot2 = require('./sounds/gunshot2.wav');
let akimboMac10sShot = require('./sounds/akimbomac10sShot.wav');
let rpgBlast = require('./sounds/rpgBlast.wav');
let rpgHit = require('./sounds/explosion.wav');
let ouch = require('./sounds/ouch.wav');
export let hover = require('./sounds/hover.wav');
export let fadeIn = require('./sounds/fadeIn.wav');
export let fadeOut = require('./sounds/fadeOut.wav');
let tick = require('./sounds/tick.wav');

standardGun.shotSound = gunshot2;
standardGun.hitSound = metalHit;
shotgun.shotSound = shotgunBlast;
shotgun.hitSound = metalHit;
shotgun.pickupSound = shotgunPickup;
akimboMac10s.shotSound = akimboMac10sShot;
akimboMac10s.hitSound = metalHit;
akimboMac10s.pickupSound = akimboPickup;
rpg.shotSound = rpgBlast;
rpg.hitSound = rpgHit;
rpg.pickupSound = rpgPickup;

export const playSound = (src, loop, speed, volume) => {
    // create an AudioListener and add it to the camera
    var listener = new THREE.AudioListener();
    camera.add( listener );

    // create a global audio source
    var sound = new THREE.Audio( listener );

    // load a sound and set it as the Audio object's buffer
    var audioLoader = new THREE.AudioLoader();
    audioLoader.load( src, function(buffer){
        sound.setBuffer( buffer );
        if (!loop)
            sound.setLoop( false );
        else sound.setLoop(true);
        if (speed == 'slow')
            sound.setPlaybackRate(.1);
        if (volume)
            sound.setVolume( volume );
        else sound.setVolume( 0.5 );
        sound.play();
    });
    return sound;
}

// playSound(explosion);
let menuMusic = playSound(menuSong, true);


function sound (src) {
    this.sound = document.createElement("audio");
    this.sound.src = src;
    this.sound.setAttribute("preload", "auto");
    this.sound.setAttribute("controls", "none");
    this.sound.style.display = "none";
    document.body.appendChild(this.sound);
    //this.sound.play();
}

let text2;
let deathPlane;

const gameOver = () => {
    text2 = document.createElement('div');
    text2.style.position = 'absolute';
    //text2.style.zIndex = 1;    // if you still don't see the label, try uncommenting this
    text2.style.width = 100;
    text2.style.height = 100;
    text2.style.backgroundColor = "blue";
    // if (gameStatus == 'ready') text2.innerHTML = 'Click to Start';
    // else text2.innerHTML = "GAME OVER";
    text2.style.top = 200 + 'px';
    text2.style.left = window.innerWidth/2 + 'px';
    document.body.appendChild(text2);
    clearInterval(heliShooting);
    if (gameStatus == 'gameOver'){
        let geometry = new THREE.PlaneGeometry( 1000, 1000, 32 );
        let material = new THREE.MeshBasicMaterial( {color: 0xff0000, side: THREE.FrontSide} );
        let deathPlane = new THREE.Mesh( geometry, material );
        material.transparent = true;
        material.opacity = .4;
        deathPlane.position.z = 1;
        scene.add( deathPlane );
        blowUp();
    } 

}

gameOver();

let text;

const displayScore = () => {
    text = document.createElement('div');
    text.style.position = 'absolute';
    //text.style.zIndex = 1;    // if you still don't see the label, try uncommenting this
    text.style.width = 100;
    text.style.height = 100;
    text.style.backgroundColor = "green";
    text.innerHTML = "Heli's: " + heliCount;
    text.style.top = 20 + 'px';
    text.style.left = window.innerWidth/2 + 200 + 'px';
    document.body.appendChild(text);
}

displayScore();

let weaponText;

const updateWeaponInfo = () => {
    if (equippedWeapon.name != standardGun.name)
        weaponText.innerHTML = equippedWeapon.name + " x " + equippedWeapon.ammo;
    else 
        weaponText.innerHTML = equippedWeapon.name + " x " + "INF";
}

const displayWeaponInfo = () => {
    weaponText = document.createElement('div');
    weaponText.style.position = 'absolute';
    //weaponText.style.zIndex = 1;    // if you still don't see the label, try uncommenting this
    weaponText.style.width = 100;
    weaponText.style.height = 100;
    weaponText.style.backgroundColor = "green";
    weaponText.style.top = 20 + 'px';
    weaponText.style.left = window.innerWidth/2 + 300 + 'px';
    updateWeaponInfo();
    document.body.appendChild(weaponText);
}

displayWeaponInfo();

let healthBar;
let healthBarBackground;
let healthBarPosition;

let geometry = new THREE.PlaneGeometry( 1, playerHealth, 32 );
let material = new THREE.MeshBasicMaterial( {color: 0xffffff, side: THREE.DoubleSide} );
healthBarBackground = new THREE.Mesh( geometry, material );
scene.add( healthBarBackground ); 
geometry = new THREE.PlaneGeometry( 1, playerHealth, 32 );
material = new THREE.MeshBasicMaterial( {color: 0xff0000, side: THREE.DoubleSide} );
healthBar = new THREE.Mesh( geometry, material );
scene.add( healthBar );
healthBar.position.y = 30;
healthBarBackground.position.y = 30;
healthBarPosition = healthBar.position.y;
healthBar.position.x = 30;
healthBarBackground.position.x = 30;

export const displayHealthBar = () => {
    if (healthBar){
        scene.remove(healthBar);
        scene.remove(healthBarBackground);
    }
    let geometry = new THREE.PlaneGeometry( 1, PLAYERHEALTHMAX, 32 );
    let material = new THREE.MeshBasicMaterial( {color: 0xffffff, side: THREE.DoubleSide} );
    healthBarBackground = new THREE.Mesh( geometry, material );
    scene.add( healthBarBackground ); 
    geometry = new THREE.PlaneGeometry( 1, playerHealth, 32 );
    material = new THREE.MeshBasicMaterial( {color: 0xff0000, side: THREE.DoubleSide} );
    healthBar = new THREE.Mesh( geometry, material );
    if (playerHealth > 0){
        scene.add( healthBar );
    }
    healthBarPosition -= .5;
    healthBar.position.y = healthBarPosition;
    healthBar.position.x = character.mesh.position.x + 30;
    healthBarBackground.position.y = 30;
    healthBarBackground.position.x = character.mesh.position.x + 30;

}

let blowUpFps = 10;
let blowUpCurTime;
let blowUpOldTime = Date.now();
let blowUpInterval = 1000/blowUpFps;
let blowUpDelta;
let fallingSpeed = 0.01;

const heliPartAnimation = () => {
    blowUpCurTime = Date.now();
    blowUpDelta = blowUpCurTime - blowUpOldTime;
    if (helipart1){
        for (var i = 0; i < helipart1.length; i++) {
            if (blowUpDelta > blowUpInterval){
                blowUpOldTime = blowUpCurTime - (blowUpDelta % blowUpInterval);
                updateSprite(crashedHelis[i], 'crashed');
                updateSprite(explosions[i], 'explosion');
            }
            crashedHelis[i].spr.position.x = helipart1[i].position.x;
            crashedHelis[i].spr.position.y = helipart1[i].position.y;
            crashedHelis[i].spr.material.rotation = helipart1[i].rotation.z;
            if (helipart1[i].position.y < -100){
                scene.remove(helipart1[i]);
                scene.remove(crashedHelis[i]);
                helipart1.splice[i, 1];
                heliPartVelocityX.splice[i, 1];
                heliPartVelocityY.splice[i, 1];
            } else {
                let rotationSpeed = .1;
                if (gameSpeed != 1){
                    rotationSpeed = gameSpeed * 6;
                }
                helipart1[i].rotation.z -= Math.PI / 100 * rotationSpeed;
                heliPartVelocityY[i] -= fallingSpeed;
                if (heliPartVelocityX[i] > 0)
                    heliPartVelocityX[i] -= 0.001;
                helipart1[i].position.y += heliPartVelocityY[i] * gameSpeed;
                helipart1[i].position.x += heliPartVelocityX[i]/3 * gameSpeed;
            }
        }
    }

}

export const pointArm = () => {
    //Arm pointing
    if (standDir == 'left'){
        arm.position.x = character.mesh.position.x - 2.4;
        arm.position.y = character.mesh.position.y + 1.6;
        arm.lookAt(pos);
        let v1 = new THREE.Vector3();
        let armMove = new THREE.Vector3(0,0,2.5);
        v1.copy( armMove ).applyQuaternion( arm.quaternion );
        arm.position.add(v1);
        if (shotThisFrame < 5) arm.material[3] = armTex2Left;
        else if (shotThisFrame < 10) arm.material[3] = armTex3Left;
        else arm.material[3] = armTexLeft;
        shotThisFrame++;
    } else {
        arm.position.x = character.mesh.position.x + 2.4;
        arm.position.y = character.mesh.position.y + 1.6;
        arm.lookAt(pos);
        let v1 = new THREE.Vector3();
        let armMove = new THREE.Vector3(0,0,2.5);
        v1.copy( armMove ).applyQuaternion( arm.quaternion );
        arm.position.add(v1);
        if (shotThisFrame < 5) arm.material[3] = armTex2;
        else if (shotThisFrame < 10) arm.material[3] = armTex3;
        else arm.material[3] = armTex;
        shotThisFrame++;
    }
    //
}

export let gameSpeed = 1;
let frameCounter = 0;
let fps = 15;
let curTime;
let oldTime = Date.now();
let interval = 1000/fps;
let delta;
let standDir = 'right';
let rpgExplosions = [];

const update = () => {
    //Character sprite animation fps
    curTime = Date.now();
    delta = curTime - oldTime;
    if (delta > interval){
        oldTime = curTime - (delta % interval);
        updateSprite(character.sheet);
        for (var i = 0; i < rpgExplosions.length; i++) {
            if (rpgExplosions[i].type == 'explosion')
                updateSprite(rpgExplosions[i], 'explosion');
            else
                updateSprite(rpgExplosions[i], 'bullet');
            // if (updateSprite(rpgExplosions[i]) == 'done'){
            //     rpgExplosions.splice(i, 1);
            // }
        }
    }
    //Background
    updateBackground();
    //
    //Mouse vector info
    getMousePos();
    //
    //Background
    // bgImage.position.x = character.mesh.position.x;
    //
    //Pickups
    for (var i = 0; i < pickUps.length; i++) {
        let stopFalling = false;
        for (var j = 0; j < objects.length; j++) {
            if (checkBulletCollision(objects[j], pickUps[i].mesh)){
                stopFalling = true;
            }
        }
        if (!stopFalling){
            pickUps[i].velocity -= GRAVITATION/4;
            pickUps[i].mesh.position.y += pickUps[i].velocity * gameSpeed;
        }
        if (checkBulletCollision(character.mesh, pickUps[i].mesh)){
            equippedWeapon = pickUps[i];
            if (!mute)
                playSound(equippedWeapon.pickupSound);
            equippedWeapon.ammo = equippedWeapon.fullAmmoMax;
            updateWeaponInfo();
            if (mouseDown){
                shootBullet();
                clearInterval(shoot);  
                shoot = setInterval(shootBullet, equippedWeapon.reloadTime);
            }
            scene.remove(pickUps[i].mesh);
            pickUps.splice(i, 1);
        }
    }
    //
    //
    //Healthbar
    healthBarBackground.position.x = character.mesh.position.x + 30;  
    healthBar.position.x = character.mesh.position.x + 30;
    //

    camera.position.x = character.mesh.position.x;
    //Move Helicopter
    move();
    //
    //Helicopter bullets
    for (var i = 0; i < heliBullets.length; i++) {
        //Move bullets
        heliBullets[i].mesh.position.x += heliBullets[i].velocity.x * gameSpeed;
        heliBullets[i].mesh.position.y += heliBullets[i].velocity.y * gameSpeed;
        //remove them when out of screen
        if (Math.abs(heliBullets[i].mesh.position.x) > BOUNDS){
            heliBullets[i].mesh = null;
            heliBullets.splice(i, 1);
        }
        //check for collision with ground
        for (var j = 0; j < objects.length; j++) {
            if (checkBulletCollision(objects[j], heliBullets[i].mesh)){
                scene.remove(heliBullets[i].mesh);
                heliBullets.splice(i, 1);
            }
        }
        //check for collision with character
        if (checkBulletCollision(heliBullets[i].mesh, character.mesh)){
            scene.remove(heliBullets[i].mesh);
            heliBullets.splice(i, 1);
            playerHealth -= 1;
            if (!mute)
                playSound(ouch);
            displayHealthBar();
            if (playerHealth == 0){
                gameStatus = "gameOver";
                gameOver();
                if (!mute)
                    playSound(explosion);
                updateWeaponInfo();
                equippedWeapon = standardGun;
                music.stop();
                gameSpeed = .01;
            }
        }
    }
    //
    //Character bullet collision detection
    for (var i = 0; i < bullets.length; i++) {
        //move bullets
        bullets[i].mesh.position.x += bullets[i].velocity.x * gameSpeed;
        bullets[i].mesh.position.y += bullets[i].velocity.y * gameSpeed;
        //remove when out of bounds
        if (Math.abs(bullets[i].mesh.position.x) > BOUNDS){
            bullets[i].mesh = null;
            bullets.splice(i, 1);
        }
        //check for collision with objects
        if (checkCollisions(objects, bullets[i].mesh).length != 0){
            scene.remove(bullets[i].mesh);
            bullets.splice(i, 1);
        }
        //check for collision with heli
        if (checkHeliBulletCollision(bullets[i].mesh)){
            heliHealth -= bullets[i].damage;
            let expl;
            if (bullets[i].sound == explosion)
                expl = getExplosion(10, 10);
            else expl = getBulletHit(6, 6);
            expl.spr.position.x = bullets[i].mesh.position.x;
            expl.spr.position.y = bullets[i].mesh.position.y;
            scene.add(expl.spr);
            rpgExplosions.push(expl);
            if (!mute)
                playSound(bullets[i].sound);
            if(heliHealth <= 0){
                if (!mute && bullets[i].sound != explosion);
                    playSound(explosion);
                blowUp();
                bullets = [];
                heliHealth = HELIHEALTHMAX;
                heliCount++;
                displayScore();
            }
            scene.remove(bullets[i].mesh);
            bullets.splice(i, 1);
        }
    }

    if (xVelocity > 0) standDir = 'right';
    else if (xVelocity < 0) standDir = 'left';

    pointArm();

    //
    //Collisions come back as t,b,l,r or none
    let collisions = checkCollisions(objects, character.mesh);
    //
    //Temporary gravity allows gravity if in contact with wall
    let gravityThisTurn = gravity;
    //
    //Preserves users ability to move left and right after contacting a wall in mid air.
    let tmpXVel = xVelocity;
    //
    //Sprites
    character.texture.position.x = character.mesh.position.x;
    character.texture.position.y = character.mesh.position.y;
    //
    //Character movement collisions
    if (character.mesh.position.y < -50){
        playerHealth = 0;
        gameStatus = "gameOver";
        gameOver();
        if (!mute)
            playSound(explosion);
        updateWeaponInfo();
        equippedWeapon = standardGun;
        music.stop();
        gameSpeed = .01;
        character.mesh.position.y = 100;
        character.mesh.position.x = 0;
    }
    for (var i = 0; i < collisions.length; i++) {
        if (collisions[i] == 'top'){
            //Enables continuous jumping
            if (keyEvents[0]){
                yVelocity = ySpeed;
                jumping = true;
                if (!jumping)
                    jump(standDir);
            }
            //

            //Stops Gravity if hitting floor
            if (yVelocity < 0){
                yVelocity = 0;
                if (xVelocity > 0){
                    jumping = false;
                    walkingRight = true;
                    walkingLeft = false;
                    walk('right');
                } else if (xVelocity < 0) {
                    jumping = false;
                    walkingLeft = true;
                    walkingRight = false;
                    walk('left');
                } else {
                    if (keyEvents[1] && !jumping){
                        jumping = true;
                        jump(standDir);
                    }
                }
            } else if (xVelocity == 0 && yVelocity == 0) {
                jumping = false;
                stand(standDir);
            }
            gravityThisTurn = 0;
            //
        } 
        if (collisions[i] == 'bottom'){
            //Enables bouncing off ceiling
            yVelocity = -yVelocity;
            //

            //Enables terminal velocity of falling
            if (yVelocity > -1){
                yVelocity += -gravityThisTurn;
            }
            //
        } 
        if (collisions[i] == 'left'){
            //Use of temporary velocity preserves users lateral 
            //movement while jumping and hitting wall
            if (tmpXVel > 0){
                tmpXVel = 0;
            }
            //Enables falling while in contact with wall
            if (yVelocity > -1){
                yVelocity += -gravityThisTurn;
            }
            //
        }
        if (collisions[i] == 'right'){
            //See above same as left
            if (tmpXVel < 0){
                tmpXVel = 0;
            }
            //
            //See above same as left
            if (yVelocity > -1){
                yVelocity += -gravityThisTurn;
            }
            //
        } 
    }
    //Enables falling when not in contact with and objects
    if (collisions.length == 0){
            gravityThisTurn = GRAVITATION;
            walkingRight = false;
            walkingLeft = false;
            // jumping = true;
            // if (!jumping)
            //     jump(standDir);
            if (yVelocity > -1){
                yVelocity += -gravityThisTurn;
            }
    }
    //
    //Final movement of character
    moveCharacter(character.mesh.position.x += tmpXVel * gameSpeed, 
        character.mesh.position.y += yVelocity * gameSpeed);
    //
};

const render = () => {
	renderer.render( scene, camera );
};

const GameLoop = () => {
    window.requestAnimationFrame( GameLoop );
    if (gameStatus == 'play'){
    	update();
    }
    //Blow up heli animation
    heliPartAnimation();
    render();
};

GameLoop();


