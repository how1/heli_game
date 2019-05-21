import * as THREE from 'three';

import { bodies, camera, renderer, scene, init, character, objects, 
    moveCharacter, walk, stand, jump, updateSprite, 
    arm, armTex, armTex2, armTex3, armTexLeft, armTex2Left, armTex3Left, leftFoot, rightFoot, 
    rocket, rocketTex, rocketTex2, changeJumpingDir, getExplosion, getBulletHit, updateBackground,
    startGameButton, instructionsButton, creditsButton, mainMenu, buttonHover, instructions, 
    backButton, credits, resumeButton, restartButton, mainMenuButton, pause, resume, 
    showGameOverButtons, buttonHighlight, buttons, mainMenuButtons, pauseButtons, gameOverButtons,
     width, height, windowOffset, updateProps, heliFlying, heliGrappled, getCrashedHeli, restart, 
     startScreen, pressEnter, highscoreText, newHighscore} from "./physics/Initialize.js";
import { checkCollisions, checkBoundingBoxes, checkBulletCollision, checkHeliBulletCollision,
 checkMenuCollision } from "./physics/checkForCollision.js";
import { spawn, rotateAboutPoint, move, heli, flyOff, dodge, 
    blowUp, helipart1, helipart2, heliPartVelocityX, heliPartVelocityY, pickUps,
    shotgun, akimboMac10s, rpg, flyNormal, getBulletMesh, crashedHelis, explosions, volume, slowSound, 
    getDropIconMesh, healthpack, Gun, standardGun, flamethrower, heatSeekers, grappleCannon, 
    pullDownHeli, grappled, muteSpawn, setSpawnSound } from "./physics/spawn.js";
import 'normalize.css';
import './styles/styles.scss';

function getCookie(cname) {
  var name = cname + "=";
  var decodedCookie = decodeURIComponent(document.cookie);
  var ca = decodedCookie.split(';');
  for(var i = 0; i <ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

export function setCookie(cname, cvalue, exdays) {
  var d = new Date();
  d.setTime(d.getTime() + (exdays*24*60*60*1000));
  var expires = "expires="+ d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

export let highscore = 0;

export const setHighscore = (score) => {
    highscore = score;
}

function checkCookie() {
  let hs = getCookie("highscore");
  if (!hs) {
      setCookie("highscore", 0, 365);
  } else highscore = hs;
}

checkCookie();

export let gameStatus = "notReady";
export let listener;
let audioContext;

mainMenu();
let startTintMeshGeom = new THREE.PlaneGeometry(300,300,32);
let startTintMeshMat = new THREE.MeshBasicMaterial({color:0x000000, side: THREE.FrontSide});
let startTintMesh = new THREE.Mesh(startTintMeshGeom, startTintMeshMat);
startTintMesh.material.transparent= true;
startTintMesh.material.opacity = .7;
startTintMesh.position.z = 15;
scene.add(startTintMesh);
// document.body.style.backgroundColor = 'white';
// renderer.domElement.style.display = 'none';

const playGame = () => {
    // playGameButton.style.display = 'none';
    // document.body.style.backgroundColor = 'black';
    // renderer.domElement.style.display = 'inline';
    init();
    gameStatus = 'ready';
    menuMusic.play();

    explosionStart = new THREE.Audio(listener);
    let explLoader = new THREE.AudioLoader();
    explLoader.load(explosion, function(buffer){
        explosionStart.setBuffer(buffer);
        explosionStart.setLoop(false);
        explosionStart.setVolume(0.5);
    });
    onMainMenu = true;
    mainMenu();
}

let onMainMenu = false;

// startScreen();

let ySpeed = 1;
let xSpeed = .3;
let gravity = 0;
let bulletSpeed = .5;
const GRAVITATION = 0.028;
const BOUNDS = 500;
const DRAG = 0.028;
let hasContactedGround = false;
const HELIHEALTHMAX = 30;
let heliHealth = 30;

let equippedWeapons = [];

export let heliCount = 0;
export let playerHealth = 8;
const PLAYERHEALTHMAX = 8;
export let mute = false;


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

let music;
let explosionStart;
let menuMusic;
export let hoverSound;

let heliShooting = false;
let heliFlyoff;
let heliDodging;
let dodger;


const start = () => {
    xVelocity = 0;
    equippedWeapons = [];
    equippedWeapons.push(standardGun);
    displayWeaponInfo();
    
    displayScore();
    scene.remove.apply(scene, scene.children);
    restart();
    menuMusic.stop();
    healthBarInit();
    displayReloadBar();
    updateWeaponIcon();
    // slowSound.stop();
    character.mesh.position.y = 80;
    character.mesh.position.x = 0;
    spawn();
    gameStatus = 'play'
    rpg.mesh = rocket;
    gameSpeed = 1;
    scene.remove(deathPlane);
    heliHealth = HELIHEALTHMAX;
    heliCount = 0;
    displayScore();
    playerHealth = PLAYERHEALTHMAX;
    displayHealthBar();
    moveCharacter(0, character.mesh.position.y);
    // music = playSound(song, new THREE.Audio(listener));
    // console.log(music);
    // music.play();
    setTimeout(function(){music.play();}, 500);
    if (mute){
        console.log('mute');
        music.setVolume(0);
    } else {
        // explosionStart.play();
        playSound(explosion, new THREE.Audio(listener));
    }
    heliFlyoff = setInterval(flyOff, 20000);
    dodger = setTimeout( function() {
        dodge();
    heliDodging = setInterval(dodge, 5000)
    }, 3000);
}

let walkInterval;
let walkingLeft = false;
let walkingRight = false;
let jumping = false;
let walkTime = 500;

document.addEventListener("keydown", onDocumentKeyDown, false);
function onDocumentKeyDown(event) {
    let keyCode = event.which;
    // if (gameStatus == 'startScreen') {
    //     if (keyCode == 13){
    //         gameStatus = 'ready';
    //         music = new THREE.Audio(listener);
    //         let musicLoader = new THREE.AudioLoader();
    //         musicLoader.load(song, function(buffer){
    //             music.setBuffer( buffer );
    //             music.setLoop(true);
    //             music.setVolume(0.5);
    //         });
    //         music.play();
    //         music.stop();

    //         explosionStart = new THREE.Audio(listener);
    //         let explLoader = new THREE.AudioLoader();
    //         explLoader.load(explosion, function(buffer){
    //             explosionStart.setBuffer(buffer);
    //             explosionStart.setLoop(false);
    //             explosionStart.setVolume(0.5);
    //         });
    //         // playSound(explosion);
    //         menuMusic = playSound(menuSong, new THREE.Audio(listener), true, 'fast', .5);
    //         menuMusic.pause();
    //     }
    // } else {
        if (keyCode == 77) {
            mute = !mute;
            setSpawnSound();
            if (gameStatus != 'notReady'){
                if (music.getVolume() > 0) 
                    music.setVolume(0);
                else music.setVolume(.7);
                if (menuMusic.getVolume() > 0)
                    menuMusic.setVolume(0);
                else menuMusic.setVolume(.5);
                if (hoverSound.getVolume() > 0)
                    hoverSound.setVolume(0);
                else hoverSound.setVolume(.5);
            }
        } else if (keyCode == 27){
            if (gameStatus == 'play' || gameStatus == 'pause'){
                if (gameStatus == 'play') {
                    pause();
                    gameStatus = 'pause';
                    // music.pause();
                } else {
                    gameStatus = 'play';
                    // music.play();
                    resume();
                }
            }
        } 
    // }
    if (gameStatus == 'play'){
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
        } else if (keyCode == 16){
            changeWeapon();
        }
    }
};

document.addEventListener("keyup", onDocumentKeyUp, false);
function onDocumentKeyUp(event) {
    var keyCode = event.which;
    if (gameStatus == 'play'){
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
    }
};

renderer.domElement.onmousemove = function(event){
    getMouseCoords(event);
}

renderer.domElement.addEventListener("mousemove", function(event){
    // getMouseCoords(event);
    if (gameStatus != 'play' && gameStatus != 'startScreen'){
        getMousePos();
        if (onMainMenu) {
            for (var i = 0; i < mainMenuButtons.length; i++) {
                let button = mainMenuButtons[i];
                if (checkMenuCollision(pos, button.currentMesh)){
                    if (!button.highlighted){
                        button.highlight();
                    }
                } else if (button.highlighted) button.unhighlight();
            }
        } else if (instructionsMenu || onCredits) {
            if (checkMenuCollision(pos, backButton.currentMesh)){
                backButton.highlight(mute);
            } else if (backButton.highlighted) {
                backButton.unhighlight();
            }
        } else if (gameStatus == 'pause' || gameStatus == 'gameOver'){
            if (gameStatus == 'pause'){
                if (checkMenuCollision(pos, resumeButton.currentMesh)){
                    if (!resumeButton.highlighted) {
                        resumeButton.highlight();
                    } 
                } else if (resumeButton.highlighted) {
                    resumeButton.unhighlight();
                }
            }
            for (var i = 1; i < pauseButtons.length; i++) {
                let button = pauseButtons[i];
                if (checkMenuCollision(pos, button.currentMesh)){
                    if (!button.highlighted){
                        button.highlight();
                    }
                } else if (button.highlighted) button.unhighlight();
            }
        }
    }
});

const getMouseCoords = (event) => {
    mouse.clientX = event.clientX;
    mouse.clientY = event.clientY;
    mouse.clientX -= windowOffset;
}

export const getMousePos = () => {
    let targetZ;
    if (gameStatus == 'play'){
        targetZ = 0;
    } else targetZ = 3;
    vec.set(
    ( mouse.clientX / renderer.domElement.width ) * 2 - 1,
    - ( mouse.clientY / renderer.domElement.height ) * 2 + 1,
    0.5 );
    vec.unproject( camera );
    vec.sub( camera.position ).normalize();
    let distance = ( targetZ - camera.position.z ) / vec.z;
    pos.copy( camera.position ).add( vec.multiplyScalar( distance ) );
}

let shoot;
let reloaded = true;
let mouseDown = false;
let instructionsMenu = false;
let onCredits = false;

let musicStart = false;

document.addEventListener("mousedown", function(event){
    mouseDown = true;
    if (gameStatus != 'play'){
        getMousePos();
        if (onMainMenu) {
            for (var i = 0; i < mainMenuButtons.length; i++) {
                let button = mainMenuButtons[i];
                if (checkMenuCollision(pos, button.currentMesh)){
                    if (!button.down){
                        button.mouseDown();
                    }
                } else button.mouseUp();
            }
        } else if (instructionsMenu || onCredits) {
            if (checkMenuCollision(pos, backButton.currentMesh)){
                backButton.mouseDown();
            } else {
                backButton.mouseUp();
            }
        } else if (gameStatus == 'pause' || gameStatus == 'gameOver'){
            if (gameStatus == 'pause'){
                if (checkMenuCollision(pos, resumeButton.currentMesh)){
                    resumeButton.mouseDown();
                } else {
                    resumeButton.mouseUp();
                }
            }
            for (var i = 1; i < pauseButtons.length; i++) {
                let button = pauseButtons[i];
                if (checkMenuCollision(pos, button.currentMesh)){
                    if (!button.down){
                        button.mouseDown();
                    }
                } else button.mouseUp();
            }
        }
    }
});

document.addEventListener("mouseup", function(event){
    mouseDown = false;
    if (gameStatus == 'ready'){
        if (checkMenuCollision(pos, startGameButton.currentMesh)){
            startGameButton.mouseUp();
            onMainMenu = false;
            start();
        } else if (checkMenuCollision(pos, instructionsButton.currentMesh)){
            instructionsButton.mouseUp();
            onMainMenu = false;
            instructionsMenu = true;
            if (!mute)
                playSound(tick, new THREE.Audio(listener));
            instructions();
        } else if (checkMenuCollision(pos, creditsButton.currentMesh)){
            onMainMenu = false;
            if (!mute)
                playSound(tick, new THREE.Audio(listener));
            onCredits = true;
            credits();
        } else if (checkMenuCollision(pos, backButton.currentMesh)){
            backButton.mouseUp();
            if (!mute)
                playSound(tick, new THREE.Audio(listener));
            instructionsMenu = false;
            onCredits = false;
            onMainMenu = true;
            mainMenu();
        }
    } else if (instructionsMenu || onCredits) {
        // if (checkMenuCollision(pos, backButton.currentMesh)){
        //     onMainMenu = true;
        //     if (!mute) playSound(tick, new THREE.Audio(listener));
        //     instructionsMenu = false;
        //     onCredits = false;
        //     mainMenu();
        // }
    } else if (gameStatus == 'pause' || gameStatus == 'gameOver') {
        if (checkMenuCollision(pos, resumeButton.currentMesh)){
            resume();
            // music.play();
            if (!mute)
                playSound(tick, new THREE.Audio(listener));
            gameStatus = 'play';
        } else if (checkMenuCollision(pos, restartButton.currentMesh)){
            bullets = [];
            heliBullets = [];
            music.stop();
            gameStatus = 'play';
            start();
        } else if (checkMenuCollision(pos, mainMenuButton.currentMesh)){
            if (!mute)
                playSound(tick, new THREE.Audio(listener));
            music.stop();
            hoverSound.stop();
            heliBullets = [];
            gameStatus = 'ready';
            instructionsMenu = false;
            menuMusic.play();
            onCredits = false;
            onMainMenu = true;
            weaponText.style.display = 'none';
            text.style.display = 'none';
            mainMenu();
        }
    }
    for (var i = 0; i < buttons.length; i++) {
        buttons[i].highlighted = false;
    }
});

const shootHeliBullet = () => {
    // if (flyNormal){
        let square = getBulletMesh('heli', 1.2);
        scene.add( square );
        if (!mute){
            playSound(gunshot, new THREE.Audio(listener), false, 1, volume);
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
    // }
}

let vec = new THREE.Vector3(); 
let pos = new THREE.Vector3();
let shotThisFrame = 2;

const shootBullet = () => {
    shotThisFrame = 0;
    if (equippedWeapons[0].name != standardGun.name){
        equippedWeapons[0].ammo--;
        
        updateWeaponInfo();
    }
    //Reload
    reloaded = false;
    setTimeout(function(){reloaded = true;}, equippedWeapons[0].reloadTime);

    if (!mute) playSound(equippedWeapons[0].shotSound, new THREE.Audio(listener));

    getMousePos();
    if (equippedWeapons[0].name == flamethrower.name){
        let flame = equippedWeapons[0].getBullet();
        scene.add(flame.mesh);
        flame.mesh.position.x = arm.position.x;
        flame.mesh.position.y = arm.position.y;
        let tmpCharPos = new THREE.Vector3();
        tmpCharPos.copy(arm.position);
        tmpCharPos.z = 0;
        let bulletVelocity = tmpCharPos.sub(pos).normalize().negate();
        let bullet = {
            velocity: bulletVelocity.multiplyScalar(flame.speed),
            mesh: flame.mesh,
            damage:equippedWeapons[0].damage,
            sound: equippedWeapons[0].hitSound,
            flame,
            strikes: 0
        }
        bullets.push(bullet);
    } else if (equippedWeapons[0].name == rpg.name) {
        let rocketMesh = equippedWeapons[0].getBullet();
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
            velocity: bulletVelocity.multiplyScalar(equippedWeapons[0].speed),
            mesh: rocketMesh,
            damage:equippedWeapons[0].damage,
            sound: equippedWeapons[0].hitSound
        }
        bullets.push(bullet);
    } else if (equippedWeapons[0].name == heatSeekers.name) {
        let rocketMesh = equippedWeapons[0].getBullet();
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
            velocity: bulletVelocity.multiplyScalar(equippedWeapons[0].speed),
            mesh: rocketMesh,
            damage:equippedWeapons[0].damage,
            sound: equippedWeapons[0].hitSound,
            alpha: 0,
            name: 'seeker',
            speed: .45
        }
        // bullet.velocity.clampLength(0, equippedWeapons[0].speed);
        bullets.push(bullet);
    } else {
        let tmpCharPos = new THREE.Vector3();
        tmpCharPos.copy(arm.position);
        tmpCharPos.z = 0;
        let bulletVelocity = tmpCharPos.sub(pos).normalize().negate();
        let newBullet = equippedWeapons[0].getBullet();
        scene.add(newBullet);
        newBullet.position.x = arm.position.x;
        newBullet.position.y = arm.position.y;
        let bullet;
        if (equippedWeapons[0].name == grappleCannon.name){
            bullet = {
                velocity: bulletVelocity.multiplyScalar(equippedWeapons[0].speed),
                mesh: newBullet,
                damage:equippedWeapons[0].damage,
                sound:equippedWeapons[0].hitSound,
                name: 'grapple',
                line: null
            }
        } else {
            bullet = {
                velocity: bulletVelocity.multiplyScalar(equippedWeapons[0].speed),
                mesh: newBullet,
                damage:equippedWeapons[0].damage,
                sound:equippedWeapons[0].hitSound
            }
        }
        bullets.push(bullet);
    }

    if (equippedWeapons[0].name == 'akimboMac10s'){
        let square2 = equippedWeapons[0].getBullet();
        scene.add(square2);
        if (!mute)
            playSound(equippedWeapons[0].shotSound, new THREE.Audio(listener));
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
            velocity: bulletVelocity2.multiplyScalar(equippedWeapons[0].speed),
            mesh: square2,
            damage: equippedWeapons[0].damage,
            sound: equippedWeapons[0].hitSound
        }
        square2.position.x = arm.position.x - offset;
        square2.position.y = arm.position.y;
        bullets.push(bullet2);
    } else if (equippedWeapons[0].name == 'shotgun'){
        for (var i = 0; i < 4; i++) {
            let square2 = equippedWeapons[0].getBullet();
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
                velocity: bulletVelocity2.multiplyScalar(equippedWeapons[0].speed),
                mesh: square2,
                damage: equippedWeapons[0].damage,
                sound: equippedWeapons[0].hitSound
            }
            square2.position.x = arm.position.x;
            square2.position.y = arm.position.y;
            bullets.push(bullet2);
        }
    }


    if (equippedWeapons[0].ammo == 0){
        equippedWeapons.shift();
        updateWeaponIcon();
        updateWeaponInfo();
        //clearInterval(shoot);
        //shoot = setInterval(shootBullet, equippedWeapons[0].reloadTime);
    }
}

const changeWeapon = () => {
    let tmp = equippedWeapons.shift();
    equippedWeapons.push(tmp);
    updateWeaponInfo();
    updateWeaponIcon();
}

const addWeapon = (pickup) => {
    let inArsenal = false;
    for (var i = 0; i < equippedWeapons.length; i++) {
        if (equippedWeapons[i].name == pickup.name) {
            equippedWeapons[i].ammo += equippedWeapons[i].fullAmmoMax;
            inArsenal = true;
            updateWeaponInfo();
        }
    }
    if (!inArsenal)
        equippedWeapons.push(pickup);
}

let rpgPickup = require('./sounds/rpg.mp3');
let akimboPickup = require('./sounds/akimbomac10s.mp3');
let shotgunPickup = require('./sounds/shotgun.mp3');
let shotgunBlast = require('./sounds/shotgunBlast.mp3');
let explosion = require('./sounds/explosion.mp3');
let metalHit = require('./sounds/metalHit.mp3');
let gunshot = require('./sounds/gunshot.mp3');
let gunshot2 = require('./sounds/gunshot2.mp3');
let akimboMac10sShot = require('./sounds/akimbomac10sShot.mp3');
let rpgBlast = require('./sounds/rpgBlast.mp3');
let rpgHit = require('./sounds/explosion.mp3');
let ouch = require('./sounds/ouch2.mp3');
let healthpackPickup = require('./sounds/healthpackPickup.mp3');
let flamethrowerPickup = require('./sounds/flamethrowerPickup.mp3');
let song = require('./sounds/gameplayMusic.mp3');
let menuSong = require('./sounds/menuMusic.mp3');
export let hover = require('./sounds/hover.mp3');
// export let fadeIn = require('./sounds/fadeIn.mp3');
// export let fadeOut = require('./sounds/fadeOut.mp3');
let tick = require('./sounds/tick.mp3');



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
healthpack.pickupSound = healthpackPickup;

let audioLoader = new THREE.AudioLoader();
// loadingManager.onLoad = function() {
//     playGame();
//     console.log('audio loaded');
// }
// loadingManager.onProgress = function() {
//     console.log('1 loaded');
// }

// export let explosionSounds = [];
// export let gunshot2Sounds = [];
// export let metalHitSounds = [];
// export let gunshotSounds = [];
// export let rpgBlastSounds = [];
// export let mac10Sounds = [];
// export let musicSounds = [];
// export let pickupSounds = [];

let loadingBar;
let prog = 0;
let prog2 = 0;
let prog3 = 0;

let loadingPercentage = document.createElement('div');
loadingPercentage.id = 'loading';
loadingPercentage.innerHTML = 'Loading ' + (prog + prog2 + prog3) * 100 + "%";
loadingPercentage.style.top = window.innerHeight / 2 + 30 + 'px';
loadingPercentage.style.left = window.innerWidth / 2 - 125 + 'px';
let playGameButton = document.createElement('button');

export let loadSounds = () => {
    document.body.appendChild(loadingPercentage);
    playGameButton.style.display = 'none';
    let geom = new THREE.PlaneGeometry(40, 4, 32);
    geom.translate( 40 / 2, 0, 0 );
    let mat = new THREE.MeshBasicMaterial({color: 0xff0000, side: THREE.FrontSide});
    loadingBar = new THREE.Mesh(geom, mat);
    loadingBar.position.x -= 20;
    loadingBar.position.z = 20;
    loadingBar.scale.set(0, 1, 1);
    scene.add(loadingBar);

    listener = new THREE.AudioListener();
    camera.add( listener );

    hoverSound = new THREE.Audio(listener);
    let hoverLoader = new THREE.AudioLoader();
    hoverLoader.load(hover,
        function(buffer){
            hoverSound.setBuffer( buffer );
            hoverSound.setLoop( true );
            hoverSound.setVolume( 0.5 );
        }, function ( xhr ) {
            prog3 = (xhr.loaded / xhr.total) / 3;
            console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
    });

    menuMusic = new THREE.Audio(listener);
    let menuMusicLoader = new THREE.AudioLoader();
    menuMusicLoader.load(menuSong, 
        function(buffer){
            menuMusic.setBuffer( buffer );
            menuMusic.setLoop(true);
            menuMusic.setVolume(0.5);
        }, function ( xhr ) {
            prog2 = (xhr.loaded / xhr.total) / 3;
            console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
    });
      

    music = new THREE.Audio(listener);
    let musicLoader = new THREE.AudioLoader();
    musicLoader.load(song, 
        function(buffer){
            music.setBuffer( buffer );
            music.setLoop(true);
            music.setVolume(0.5);
            loadingPercentage.style.display = 'none';
            playGame();
        }, function ( xhr ) {
            prog = (xhr.loaded / xhr.total) / 3;
            console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
            loadingBar.scale.set(prog + prog2 + prog3, 1, 1);
            loadingPercentage.innerHTML = 'Loading ' + Math.trunc((prog + prog2 + prog3) * 100) + "%";
    });  
    // for (var i = 0; i < ; i++) {
    //      }
}

export const playSound = (src, audioObj, loop, speed, vol) => {
    if (!vol) vol = .5; 
    // create an AudioListener and add it to the camera

    // create a global audio source

    // load a sound and set it as the Audio object's buffer
    // var audioLoader = new THREE.AudioLoader();
    audioLoader.load( src, function(buffer){
        audioObj.setBuffer( buffer );
        if (!loop) {
            audioObj.setLoop( false );
        }
        else { 
            audioObj.setLoop(true);
        }
        if (speed == 'slow') {
            audioObj.setPlaybackRate(.1);
        }
        if (mute) {
            audioObj.setVolume( 0 );
        } else {
            audioObj.setVolume( vol );
        }
        audioObj.play();
    });
    return audioObj
}



// var r = confirm("Enable Audio?");
// if (r == true) {
//     playGame();
// } else {
//     mute = true;
//     muteSpawn();
//     playGame();
// }

// let btnBg = document.createElement('img');
// btnBg.id = 'btnBg';
// btnBg.src = require('./pics/littleTitle.png');
playGameButton.id = 'playGameButton';
// playGameButton.style.position = 'absolute';
playGameButton.style.width = 250 + 'px';
playGameButton.style.height = 60 + 'px';
playGameButton.style.position = 'absolute';
playGameButton.innerHTML = 'Play &#x25B6;';
playGameButton.style.borderRadius = 10 + 'px';
playGameButton.style.top = window.innerHeight / 2 - 30 + 'px';
playGameButton.style.left = window.innerWidth / 2 - 125 + 'px';
playGameButton.onclick = loadSounds;
document.body.appendChild(playGameButton);
// playGameButton.appendChild(btnBg);


// function sound (src) {
//     this.sound = document.createElement("audio");
//     this.sound.src = src;
//     this.sound.setAttribute("preload", "auto");
//     this.sound.setAttribute("controls", "none");
//     this.sound.style.display = "none";
//     document.body.appendChild(this.sound);
//     //this.sound.play();
// }

let text2;
let deathPlane;
let gameOverImage = new THREE.TextureLoader().load(require('./pics/gameOver.png'));

const gameOver = () => {
    if (gameStatus == 'gameOver'){
        // character.texture.rotation.z = Math.PI / 2;
        let geometry = new THREE.PlaneGeometry( 1000, 1000, 32 );
        let material = new THREE.MeshBasicMaterial( {color: 0xff0000, side: THREE.FrontSide} );
        let deathPlane = new THREE.Mesh( geometry, material );
        material.transparent = true;
        material.opacity = .4;
        deathPlane.position.z = 1;
        scene.add( deathPlane );
        blowUp();
    } 
    let geom = new THREE.PlaneGeometry(100, 30, 32);
    let mat = new THREE.MeshBasicMaterial({map: gameOverImage, side: THREE.FrontSide});
    mat.transparent = true;
    mat.opacity = 1;
    let mesh = new THREE.Mesh(geom, mat);
    mesh.position.x = character.mesh.position.x;
    mesh.position.z = 4;
    scene.add(mesh);

    showGameOverButtons();

}

export const setHeliShooting = (x) => {
    heliShooting = x;
}

// gameOver();

let reloadBar;
let reloadBarPositionX = 45;
let reloadBarPositionY = -30;

const displayReloadBar = () => {
    let geom = new THREE.PlaneGeometry(10,2, 32);
    geom.translate( 10 / 2, 0, 0 );
    let mat = new THREE.MeshBasicMaterial({color: 0xffcc00, side: THREE.FrontSide});
    reloadBar = new THREE.Mesh(geom, mat);
    reloadBar.position.x = reloadBarPositionX;
    reloadBar.position.y = reloadBarPositionY;
    reloadBar.position.z = 4;
    scene.add(reloadBar);
}

const updateReloadBar = (percent) => {
    if (percent > 1) percent = 1;
    reloadBar.scale.set(percent,1,1);
}

let text;

const updateScore = () => {
    text.innerHTML = "Choppers x " + heliCount;
}


export const displayScore = () => {
    if (text)
        text.style.display = 'none';
    text = document.createElement('div');
    text.style.position = 'absolute';
    //text.style.zIndex = 1;    // if you still don't see the label, try uncommenting this
    text.style.width = window.innerHeight / 4;
    text.style.height = window.innerHeight / 4;
    text.style.fontSize = window.innerHeight / 20 + 'px';
    text.style.backgroundColor = 'rgba(255,0,0,.5)';
    text.style.borderRadius = window.innerHeight/20 + 'px';
    text.style.paddingLeft = window.innerHeight/78 + 'px';
    text.style.paddingRight = window.innerHeight/78 + 'px';
    text.innerHTML = "Choppers x " + heliCount;
    text.style.top = window.innerHeight / 23 + 'px';
    text.style.left = window.innerWidth - windowOffset - window.innerHeight/2.7 + 'px';
    document.body.appendChild(text);
}

let weaponText;
let weaponIcon;
let weaponIconPositionX = 40;

const updateWeaponIcon = () => {
    if (weaponIcon)
        scene.remove(weaponIcon);
    weaponIcon = equippedWeapons[0].getDropIcon(equippedWeapons[0].name, 8);
    weaponIcon.position.x = character.mesh.position.x + weaponIconPositionX;
    weaponIcon.position.y = -33;
    weaponIcon.position.z = 3.9;
    scene.add(weaponIcon);
}

export const updateWeaponInfo = () => {
    if (equippedWeapons[0].name != standardGun.name)
        weaponText.innerHTML = " x " + equippedWeapons[0].ammo;
    else 
        weaponText.innerHTML = " x " + "INF";
}

export const displayWeaponInfo = () => {
    if (weaponText)
        weaponText.style.display = 'none';
    weaponText = document.createElement('div');
    weaponText.style.position = 'absolute';
    //weaponText.style.zIndex = 1;    // if you still don't see the label, try uncommenting this
    weaponText.style.width = window.innerHeight/4;
    weaponText.style.height = window.innerHeight/4;
    weaponText.style.fontSize = window.innerHeight/20 + 'px';
    weaponText.style.backgroundColor = 'rgba(255, 0, 0, .5)';
    weaponText.style.borderRadius = window.innerHeight/20 + 'px';
    weaponText.style.paddingLeft = window.innerHeight/78 + 'px';
    weaponText.style.paddingRight = window.innerHeight/78 + 'px';
    weaponText.style.top = window.innerHeight / 1.12 + 'px';
    weaponText.style.left = window.innerWidth - windowOffset - window.innerHeight/5.5 + 'px';
    updateWeaponInfo();
    
    document.body.appendChild(weaponText);
}

let healthBar;
let healthBarBackground;
let healthLogo;
let healthBarPosition;
let healthBarPositionX = 52;
let healthBarPositionY = 22;

const healthBarInit = () => {
    let geometry = new THREE.PlaneGeometry( 1.5, PLAYERHEALTHMAX * 1.5, 32 );
    let material = new THREE.MeshBasicMaterial( {color: 0xffffff, side: THREE.FrontSide} );
    healthBarBackground = new THREE.Mesh( geometry, material );
    scene.add( healthBarBackground ); 
   
    geometry = new THREE.PlaneGeometry( 1.5, PLAYERHEALTHMAX * 1.5, 32 );
    geometry.translate(0, PLAYERHEALTHMAX * 1.5 / 2, 0);
    material = new THREE.MeshBasicMaterial( {color: 0xff0000, side: THREE.FrontSide} );
    healthBar = new THREE.Mesh( geometry, material );
    scene.add(healthBar);
    
    geometry = new THREE.PlaneGeometry( 6, 6, 32 );
    material = new THREE.MeshBasicMaterial( {map: new THREE.TextureLoader().load(require('./pics/heart.png'))
        , side: THREE.FrontSide} );
    material.transparent = true;
    material.opacity = 1;
    healthLogo = new THREE.Mesh( geometry, material );
    scene.add( healthLogo );
    
    healthBar.scale.set(1, playerHealth/PLAYERHEALTHMAX, 1);
    healthBar.position.y = healthBarPositionY - healthBar.geometry.parameters.height/2;
    healthBarBackground.position.y = healthBarPositionY;
    healthBarPosition = healthBar.position.y;
    healthBar.position.x = healthBarPositionX;
    healthBarBackground.position.x = healthBarPositionX;
    healthLogo.position.y = healthBarPositionY - 8;
    healthLogo.position.x = character.mesh.position.x + healthBarPositionX + .1;
    healthBar.position.z = 10;
    healthBarBackground.position.z = 9.99;
    healthLogo.position.z = 10;
}

export const displayHealthBar = () => {

    healthBar.scale.set(1, playerHealth/PLAYERHEALTHMAX, 1);
    // healthBarPosition -= .5;
    healthBar.position.y = healthBarPosition;
    healthBar.position.x = character.mesh.position.x + healthBarPositionX;
    healthBarBackground.position.y = healthBarPositionY;
    healthBarBackground.position.x = character.mesh.position.x + healthBarPositionX;

}

let blowUpFps = 10;
let blowUpCurTime;
let blowUpOldTime = Date.now();
let blowUpInterval = 1000/blowUpFps;
let blowUpDelta;
let fallingSpeed = 0.01;

let line;

const heliPartAnimation = () => {
    blowUpCurTime = Date.now();
    blowUpDelta = blowUpCurTime - blowUpOldTime;
    if (helipart1){
        for (var i = 0; i < helipart1.length; i++) {
            if (blowUpDelta > blowUpInterval){
                blowUpOldTime = blowUpCurTime - (blowUpDelta % blowUpInterval);
                if (crashedHelis[i].name == 'grappled'){
                    updateSprite(crashedHelis[i], 'grappled');
                } else{
                    updateSprite(crashedHelis[i], 'crashed');
                    updateSprite(explosions[i], 'explosion');
                }
            }
            if (crashedHelis[i].name == 'grappled'){
                if (crashedHelis[i].spr.position.y < -15){
                    scene.remove(line);
                    line = null;
                    scene.remove(crashedHelis[i].spr);
                    if (!mute) playSound(explosion, new THREE.Audio(listener));
                    let crashed = getCrashedHeli();
                    let expl = getExplosion(40,40);
                    scene.add(crashed.spr);
                    scene.add(expl.spr);
                    crashedHelis[i] = crashed;
                    explosions.push(expl);
                    crashedHelis[i].spr.position.x = helipart1[i].position.x;
                    crashedHelis[i].spr.position.y = helipart1[i].position.y;
                    crashedHelis[i].spr.material.rotation = helipart1[i].rotation.z;
                    expl.spr.position.x = helipart1[i].position.x + 4;
                    expl.spr.position.y = helipart1[i].position.y;
                } else {
                    if (line) scene.remove(line);
                    let lineMat = new THREE.LineBasicMaterial({color: 0xffffff});
                    let lineGeom = new THREE.Geometry();
                    lineGeom.vertices.push(character.mesh.position);
                    lineGeom.vertices.push(crashedHelis[i].spr.position);
                    line = new THREE.Line(lineGeom, lineMat);
                    scene.add(line);
                }
            }
            crashedHelis[i].spr.position.x = helipart1[i].position.x;
            crashedHelis[i].spr.position.y = helipart1[i].position.y;
            crashedHelis[i].spr.material.rotation = helipart1[i].rotation.z;
            if (helipart1[i].position.y < -100){
                scene.remove(helipart1[i]);
                scene.remove(crashedHelis[i].spr);
                // if (crashedHelis[i].name == 'grappled') {
                //     scene.remove(line);
                //     line = null;
                // }
                crashedHelis.splice[i, 1];
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

// const pressEnterOpacity = () => {
//     if (gameStatus == 'startScreen'){
//         console.log(pressEnter.material.opacity);
//         if (upOpacity){
//             pressEnter.material.opacity += .02;
//             if (pressEnter.material.opacity > 1){
//                 upOpacity = false;
//             }
//         }
//         else {
//             pressEnter.material.opacity -= .02;
//             if (pressEnter.material.opacity < .5){
//                 upOpacity = true;
//             }
//         }
//     }
// }

export let gameSpeed = 1;
let frameCounter = 0;
let fps = 15;
let curTime;
let oldTime = Date.now();
let interval = 1000/fps;
let delta;
let standDir = 'right';
let rpgExplosions = [];
let heliShootingFPS = 1500;
let heliReloadDelta = 0;

let reloadDelta = 0;

let clock = new THREE.Clock();
let delta2 = clock.start();

let signsFps = 24;
let curTime2;
let oldTime2 = Date.now();
let signsInterval = 1000/signsFps;
let signsDelta;

let upOpacity = false;

const update = () => {
    delta2 = clock.getDelta();
    //Character sprite animation fps
    curTime = Date.now();
    delta = curTime - oldTime;
    curTime2 = Date.now();
    signsDelta = curTime2 - oldTime2;

    reloadDelta += delta;
    heliReloadDelta += delta;

    if (signsDelta > signsInterval){
        oldTime2 = curTime2 - (signsDelta % signsInterval);
        updateProps();
    }
    if (heliReloadDelta > heliShootingFPS && heliShooting){
        shootHeliBullet();
        heliReloadDelta = 0;
    }
    if (reloadDelta > equippedWeapons[0].reloadTime && mouseDown){
        shootBullet();
        reloadDelta = 0;
    }
    updateReloadBar(reloadDelta / equippedWeapons[0].reloadTime);
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
            if (checkBulletCollision(objects[j], pickUps[i].dropMesh)){
                stopFalling = true;
            }
        }
        if (!stopFalling){
            pickUps[i].velocity -= GRAVITATION/4;
            pickUps[i].dropMesh.position.y += pickUps[i].velocity * gameSpeed;
        }
        if (checkBulletCollision(character.mesh, pickUps[i].dropMesh)){
            if (pickUps[i].name == 'healthpack'){
                if (!mute) playSound(pickUps[i].pickupSound, new THREE.Audio(listener), false, 1, 1);
                playerHealth += 3;
                if (playerHealth > PLAYERHEALTHMAX) playerHealth = PLAYERHEALTHMAX;
                displayHealthBar();
            } else {
                addWeapon(pickUps[i]);
                // equippedWeapons[0] = pickUps[i];
                if (!mute)
                    playSound(pickUps[i].pickupSound, new THREE.Audio(listener), false, 1, 1);
                // equippedWeapons[0].ammo = equippedWeapons[0].fullAmmoMax;
                // if (mouseDown){
                //     shootBullet();
                //     // clearInterval(shoot);  
                //     // shoot = setInterval(shootBullet, equippedWeapons[0].reloadTime);
                // }
            }
            scene.remove(pickUps[i].dropMesh);
            pickUps.splice(i, 1);
        }
    }
    //
    //
    //Healthbar
    healthBarBackground.position.x = character.mesh.position.x + healthBarPositionX;  
    healthBar.position.x = character.mesh.position.x + healthBarPositionX;
    healthLogo.position.x = character.mesh.position.x + healthBarPositionX + .1;
    //

    //Reload Bar, Weapon info
    reloadBar.position.x = character.mesh.position.x + reloadBarPositionX;
    weaponIcon.position.x = character.mesh.position.x + weaponIconPositionX;
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
        if (Math.abs(heliBullets[i].mesh.position.x) > BOUNDS || Math.abs(heliBullets[i].mesh.position.y) > BOUNDS){
            // heliBullets[i].mesh = null;
            heliBullets.splice(i, 1);
            scene.remove(heliBullets[i].mesh);
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
                playSound(ouch, new THREE.Audio(listener));
            displayHealthBar();
            if (playerHealth == 0){
                gameStatus = "gameOver";
                gameOver();
                if (!mute)
                    playSound(explosion, new THREE.Audio(listener));
                
                updateWeaponInfo();
                equippedWeapons[0] = standardGun;
                music.stop();
                gameSpeed = .01;
            }
        }
    }
    //
    //Character bullet collision detection
    for (var i = 0; i < bullets.length; i++) {
        //flamethrower particle system
        if (bullets[i].flame){
            let flame = bullets[i].flame;
            if (flame.size < flame.maxSize)
                flame.size *= 1.1;
            flame.mesh.material.opacity -= .016;
            bullets[i].velocity.multiplyScalar(.99);
            flame.lifeSpan--;
            if (flame.lifeSpan == 0){
                scene.remove(bullets[i].mesh);
                bullets.splice(i, 1);
                continue;
            }
            bullets[i].flame.mesh.scale.set(flame.size, flame.size, 1);
        } else if (bullets[i].name == 'seeker'){
            let tmpRocketPos = new THREE.Vector3();
            tmpRocketPos.copy(bullets[i].mesh.position);
            let tmpHeliPos = new THREE.Vector3();
            tmpHeliPos.copy(heli.position);
            let newVec = new THREE.Vector3();
            newVec = tmpRocketPos.sub(tmpHeliPos).normalize().negate();
            newVec.multiplyScalar(bullets[i].speed);
            bullets[i].velocity.lerp(newVec, bullets[i].alpha += delta2/200);
            let degrees = bullets[i].velocity.angleTo(new THREE.Vector3(1,0,0));
            bullets[i].mesh.rotation.z = degrees;
        }
        //move bullets
        bullets[i].mesh.position.x += bullets[i].velocity.x * gameSpeed;
        bullets[i].mesh.position.y += bullets[i].velocity.y * gameSpeed;

        if (bullets[i].name == 'grapple'){
            if (bullets[i].line) scene.remove(bullets[i].line);
            if (bullets[i].mesh.position.distanceTo(character.mesh.position) < 100){
                let lineMat = new THREE.LineBasicMaterial({color: 0xffffff});
                let lineGeom = new THREE.Geometry();
                lineGeom.vertices.push(character.mesh.position);
                lineGeom.vertices.push(bullets[i].mesh.position);
                bullets[i].line = new THREE.Line(lineGeom, lineMat);
                scene.add(bullets[i].line);
            }
        }

        //remove when out of bounds
        if (Math.abs(bullets[i].mesh.position.x) > BOUNDS || Math.abs(bullets[i].mesh.position.y) > BOUNDS){
            scene.remove(bullets[i].mesh);
            if (bullets[i].name == 'grapple'){
                scene.remove(bullets[i].line);
            }
            bullets.splice(i, 1);
            continue;
        }
        //check for collision with objects
        if (checkCollisions(objects, bullets[i].mesh).length != 0){
            scene.remove(bullets[i].mesh);
            if (bullets[i].name == 'grapple'){
                scene.remove(bullets[i].line);
            }
            bullets.splice(i, 1);
            continue;
        }
        //check for collision with heli
        if (heliHealth > 0){
            if (checkHeliBulletCollision(bullets[i].mesh)){
                let expl;
                if (bullets[i].sound == explosion){
                    heliHealth -= bullets[i].damage;
                    expl = getExplosion(10, 10);
                } else {
                    if (bullets[i].flame){
                        bullets[i].strikes++;
                        if (bullets[i].strikes % 10 == 0){
                            heliHealth -= bullets[i].damage * 10;
                            expl = getBulletHit(6, 6);
                            expl.spr.position.x = bullets[i].mesh.position.x;
                            expl.spr.position.y = bullets[i].mesh.position.y;
                            scene.add(expl.spr);
                            rpgExplosions.push(expl);
                            if (!mute)
                                playSound(bullets[i].sound, new THREE.Audio(listener));
                        }
                    } else {
                        heliHealth -= bullets[i].damage;
                        expl = getBulletHit(6, 6);
                        expl.spr.position.x = bullets[i].mesh.position.x;
                        expl.spr.position.y = bullets[i].mesh.position.y;
                        scene.add(expl.spr);
                        rpgExplosions.push(expl);
                        if (!mute)
                            playSound(bullets[i].sound, new THREE.Audio(listener));
                    } 

                }
                if(heliHealth <= 0){
                    // if (!mute && bullets[i].sound != explosion);
                        // playSound(explosion, new THREE.Audio(listener));
                    heliHealth = HELIHEALTHMAX;
                    if (bullets[i].name == 'grapple'){
                        scene.remove(bullets[i].line);
                        pullDownHeli();
                    }
                    heliCount++;
                    blowUp();
                    // bullets = [];
                    updateScore();
                }
                if (!bullets[i].flame) {
                    scene.remove(bullets[i].mesh);
                    bullets.splice(i, 1);
                }
            }
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
            playSound(explosion, new THREE.Audio(listener));
        
        updateWeaponInfo();
        equippedWeapons[0] = standardGun;
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
            jumping = true;
            if (!jumping)
                jump(standDir);
            if (yVelocity > -1){
                yVelocity += -gravityThisTurn;
            }
    }
    //
    //Final movement of character
    if (gameStatus == 'play')
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
    if (gameStatus != 'gameOver'){
        if (newHighscore)
            newHighscore.style.display = 'none';
    }
    if (!onMainMenu || gameStatus != 'ready') {
        if (highscoreText)
            highscoreText.style.display = 'none';
    }
    // pressEnterOpacity();
    //Blow up heli animation
    heliPartAnimation();
    render();
};

GameLoop();


