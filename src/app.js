import * as THREE from 'three';

import { bodies, camera, renderer, scene, init, character, objects, moveCharacter, walk, stand, jump } from "./physics/Initialize.js";
import { checkCollisions, checkBoundingBoxes, checkBulletCollision, checkHeliBulletCollision } from "./physics/checkForCollision.js";
import { spawn, rotateAboutPoint, move, heli, flyOff, dodge, 
    blowUp, helipart1, helipart2, heliPartVelocityX, heliPartVelocityY, pickUps,
    shotgun, akimboMac10s, rpg, flyNormal } from "./physics/spawn.js";
import 'normalize.css';
import './styles/styles.scss';
// import rpgSound from './sounds/rpg.wav';

init();
spawn();

// let listener = new THREE.AudioListener();
// camera.add( listener );

// // create a global audio source
// let sound = new THREE.Audio( listener );

// // load a sound and set it as the Audio object's buffer
// let audioLoader = new THREE.AudioLoader();
// audioLoader.load( rpgSound, function( buffer ) {
//     sound.setBuffer( buffer );
//     sound.setLoop( false );
//     sound.setVolume( 0.5 );
//     sound.play();
// });

// import rpgFX from './sounds/camera.jpg';

// let rpgSound = new Audio(require('./sounds/rpg.wav'));
// rpgSound.play();

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
let gameStatus = "play";
let standardGun = {
    color: 0x00ff00,
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
    pickupSound: null
}
let equippedWeapon = standardGun;

export let heliCount = 0;
export let playerHealth = 8;
const PLAYERHEALTHMAX = 8;

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

let song = require('./sounds/clubbedtodeath.wav');
let music = new sound(song);

let heliShooting;
let heliFlyoff;
let heliDodging;
let dodger;

const start = () => {
    gameSpeed = 1;
    scene.remove(deathPlane);
    heliHealth = HELIHEALTHMAX;
    heliCount = 0;
    playerHealth = PLAYERHEALTHMAX;
    moveCharacter(0, character.mesh.position.y);
    // music.sound.play();
    heliShooting = setInterval(shootHeliBullet, 500);
    heliFlyoff = setInterval(flyOff, 20000);
    dodger = setTimeout( function() {
        dodge();
    heliDodging = setInterval(dodge, 5000)
    }, 3000);
}

gameStatus = 'ready';

let walkInterval;
let walking = false;
let walkTime = 500;

document.addEventListener("keydown", onDocumentKeyDown, false);
function onDocumentKeyDown(event) {
    let keyCode = event.which;
    if (keyCode == 38) { // jump
        //Allows jump only if on ground
    	if (Math.abs(yVelocity) == 0){
            yVelocity = ySpeed;
            gravity = GRAVITATION;
            console.log('clear');
            clearInterval(walkInterval);
            walking = false;
            jump();
        }
        //
        keyEvents[0] = 1;
    } else if (keyCode == 40) { //down
        //No ducking yet
    } else if (keyCode == 37) { //left
        if (!walking){
            console.log('qwer');
            walking = true;
            walkInterval = setInterval(walk, walkTime);
        }
        //Move left
        xVelocity = -xSpeed;
        //
        keyEvents[2] = 1;
    } else if (keyCode == 39) { //right
        if (!walking){
            walking = true;
            walkInterval = setInterval(walk, walkTime);
        }
        //Move right
        xVelocity = xSpeed;
        //
		keyEvents[3] = 1;
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
        } else{
            walking = false;
            console.log('clear2');
            clearInterval(walkInterval);
            xVelocity = 0;
        }
        //
    } else if (keyCode == 39) {
        //See above

        keyEvents[3] = 0;
        if (keyEvents[2]){
        	xVelocity = -xSpeed;
        } else {
            walking = false;
            console.log('clear43');
            clearInterval(walkInterval);
            xVelocity = 0;
        }
        //
    }
};


document.addEventListener("mousemove", function(event){
    getMouseCoords(event);
});

const getMouseCoords = (event) => {
    mouse.clientX = event.clientX;
    mouse.clientY = event.clientY;
}

let shoot;
let reloaded = true;
let mouseDown = false;

document.addEventListener("mousedown", function(event){
    mouseDown = true;
    if (gameStatus == 'play'){
        if (reloaded){
            shootBullet();
            shoot = setInterval(shootBullet, equippedWeapon.reloadTime);
        }
    } else {
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

    }
});

document.addEventListener("mouseup", function(event){
    mouseDown = false;
    clearInterval(shoot);
});

const shootHeliBullet = () => {
    if (flyNormal){
        let geometry = new THREE.PlaneGeometry( 1.1, 1.1, 32 );
        let material = new THREE.MeshBasicMaterial( {color: 0xccffcc, side: THREE.FrontSide} );
        let square = new THREE.Mesh( geometry, material );
        scene.add( square );
        playSound(gunshot);
        square.position.x = heli.position.x;
        square.position.y = heli.position.y;
        let tmpHeliPos = new THREE.Vector3(heli.position.x, heli.position.y, 0);
        let bulletVelocity = tmpHeliPos.sub(character.mesh.position).normalize().negate();
        let bullet = {
            velocity: bulletVelocity.multiplyScalar(bulletSpeed),
            mesh: square
        }
        heliBullets.push(bullet);
    }
}

const shootBullet = () => {
    if (equippedWeapon.name != standardGun.name){
        equippedWeapon.ammo--;
        console.log(equippedWeapon.ammo);
        updateWeaponInfo();
    }
    //Reload
    reloaded = false;
    setTimeout(function(){reloaded = true;}, equippedWeapon.reloadTime);
    //
    var vec = new THREE.Vector3(); 
    var pos = new THREE.Vector3();
    vec.set(
        ( mouse.clientX / window.innerWidth ) * 2 - 1,
        - ( mouse.clientY / window.innerHeight ) * 2 + 1,
        0.5 );
    vec.unproject( camera );
    vec.sub( camera.position ).normalize();
    var distance = - camera.position.z / vec.z;
    pos.copy( camera.position ).add( vec.multiplyScalar( distance ) );
    let yDimension = equippedWeapon.size;
    if (equippedWeapon.name == 'rpg') yDimension = equippedWeapon.size * 2;
    let geometry = new THREE.PlaneGeometry( equippedWeapon.size, yDimension, 32 );
    let material = new THREE.MeshBasicMaterial( {color: equippedWeapon.color, side: THREE.FrontSide} );
    let square = new THREE.Mesh( geometry, material );
    scene.add( square );
    if (equippedWeapon.name == 'rpg') {
      
    };
    playSound(equippedWeapon.shotSound);
    square.position.x = character.mesh.position.x;
    square.position.y = character.mesh.position.y;
    let tmpCharPos = new THREE.Vector3(character.mesh.position.x, character.mesh.position.y, 0);
    let bulletVelocity = tmpCharPos.sub(pos).normalize().negate();
    let bullet = {
        velocity: bulletVelocity.multiplyScalar(equippedWeapon.speed),
        mesh: square,
        damage:equippedWeapon.damage
    }
    bullets.push(bullet);
    if (equippedWeapon.name == 'akimboMac10s'){
        let square2 = new THREE.Mesh( geometry, material );
        scene.add(square2);
        playSound(equippedWeapon.shotSound);
        let tmpPos = new THREE.Vector3(0);
        tmpPos.copy(pos);
        let offset = 2;
        tmpPos.x += offset;
        let tmpCharPos2 = new THREE.Vector3(character.mesh.position.x - offset, character.mesh.position.y, 0);
        let bulletVelocity2 = tmpCharPos2.sub(tmpPos).normalize().negate();
        
        let bullet2 = {
            velocity: bulletVelocity2.multiplyScalar(equippedWeapon.speed),
            mesh: square2,
            damage: equippedWeapon.damage
        }
        square2.position.x = character.mesh.position.x - offset;
        square2.position.y = character.mesh.position.y;
        bullets.push(bullet2);
    } else if (equippedWeapon.name == 'shotgun'){
        for (var i = 0; i < 4; i++) {
            let square2 = new THREE.Mesh( geometry, material );
            scene.add(square2);
            let tmpPos = new THREE.Vector3(0);
            tmpPos.copy(pos);
            let offset = 0;
            if (i == 0) offset = -2;
            else if (i == 1) offset = -4;
            else if (i == 2) offset = 2;
            else if (i == 3) offset = 4;
            tmpPos.x += offset;
            let tmpCharPos2 = new THREE.Vector3(character.mesh.position.x, character.mesh.position.y, 0);
            let bulletVelocity2 = tmpCharPos2.sub(tmpPos).normalize().negate();
            
            let bullet2 = {
                velocity: bulletVelocity2.multiplyScalar(equippedWeapon.speed),
                mesh: square2,
                damage: equippedWeapon.damage
            }
            square2.position.x = character.mesh.position.x;
            square2.position.y = character.mesh.position.y;
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

const playSound = (src) => {
    // create an AudioListener and add it to the camera
    var listener = new THREE.AudioListener();
    camera.add( listener );

    // create a global audio source
    var sound = new THREE.Audio( listener );

    // load a sound and set it as the Audio object's buffer
    var audioLoader = new THREE.AudioLoader();
    audioLoader.load( src, function(buffer){
        sound.setBuffer( buffer );
        sound.setLoop( false );
        sound.setVolume( 0.5 );
        sound.play();
    });
}

// playSound(explosion);

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
    if (gameStatus == 'ready') text2.innerHTML = 'Click to Start';
    else text2.innerHTML = "GAME OVER";
    text2.style.top = 200 + 'px';
    text2.style.left = window.innerWidth/2 + 'px';
    document.body.appendChild(text2);
    clearInterval(heliShooting);
    if (gameStatus == 'play'){
        let geometry = new THREE.PlaneGeometry( 1000, 1000, 32 );
        let material = new THREE.MeshBasicMaterial( {color: 0xff0000, side: THREE.FrontSide} );
        let deathPlane = new THREE.Mesh( geometry, material );
        material.transparent = true;
        material.opacity = .4;
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
healthBar.position.x = 70;
healthBarBackground.position.x = 70;

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
    healthBar.position.x = character.mesh.position.x + 70;
    healthBarBackground.position.y = 30;
    healthBarBackground.position.x = character.mesh.position.x + 70;

}

const heliPartAnimation = () => {
    if (helipart1.length > 0 && helipart2.length > 0){
        for (var i = 0; i < helipart1.length; i++) {
            if (helipart1[i].position.y < -100){
                scene.remove(helipart1[i]);
                scene.remove(helipart2[i]);
                helipart1.splice[i, 1];
                helipart2.splice[i, 1];
                heliPartVelocityX.splice[i, 1];
                heliPartVelocityY.splice[i, 1];
            } else {
                let rotationSpeed = 1;
                if (gameSpeed != 1){
                    rotationSpeed = gameSpeed * 6;
                }
                helipart1[i].rotation.z += Math.PI / 100 * rotationSpeed;
                helipart2[i].rotation.z += Math.PI / 50 * rotationSpeed;
                heliPartVelocityY[i] -= GRAVITATION;
                if (heliPartVelocityX[i] > 0)
                    heliPartVelocityX[i] -= 0.001;
                helipart1[i].position.y += heliPartVelocityY[i] * gameSpeed;
                helipart2[i].position.y += heliPartVelocityY[i] * gameSpeed;
                helipart1[i].position.x += heliPartVelocityX[i]/3 * gameSpeed;
                helipart2[i].position.x -= heliPartVelocityX[i] * gameSpeed;
            }
        }
        
    }
}

export let gameSpeed = 1;

const update = () => {
    //displayWeaponInfo();
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
    healthBarBackground.position.x = character.mesh.position.x + 70;  
    healthBar.position.x = character.mesh.position.x + 70;
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
            playerHealth--;
            playSound(ouch);
            displayHealthBar();
            if (playerHealth == 0){
                gameOver();
                playSound(explosion);
                updateWeaponInfo();
                equippedWeapon = standardGun;
                music.sound.pause();
                gameStatus = "game_over";
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
            playSound(equippedWeapon.hitSound);
            scene.remove(bullets[i].mesh);
            bullets.splice(i, 1);
            if(heliHealth <= 0){
                playSound(explosion);
                blowUp();
                heliHealth = HELIHEALTHMAX;
                heliCount++;
                displayScore();
            }
        }
    }
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
    character.texture.position.y = character.mesh.position.y
     + (Math.abs(character.texture.geometry.parameters.height 
        - character.mesh.geometry.parameters.height)/2);
    //
    for (var i = 0; i < collisions.length; i++) {
        if (collisions[i] == 'top'){
            //Enables continuous jumping
            if (keyEvents[0]){
                yVelocity = ySpeed;
            }
            //

            //Stops Gravity if hitting floor
            if (yVelocity < 0){
                yVelocity = 0;
                if (Math.abs(xVelocity) > 0){
                    walking = true;
                    walkInterval = setInterval(walk, walkTime);
                } else {
                    clearInterval(walkInterval);
                    walking = false;
                    stand();
                }
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
            clearInterval(walkInterval);
            walking = false;
            jump();
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
    requestAnimationFrame( GameLoop );
    if (gameStatus == 'play'){
    	update();
    }
    //Blow up heli animation
    heliPartAnimation();
    render();
};

GameLoop();


