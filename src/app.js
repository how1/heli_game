import * as THREE from 'three';

import { bodies, camera, renderer, scene, init, character, objects } from "./physics/Initialize.js";
import { checkCollisions, checkBoundingBoxes, checkBulletCollision } from "./physics/checkForCollision.js";
import { spawn, rotateAboutPoint, move, heli, flyOff, dodge, 
    blowUp, helipart1, helipart2, heliPartVelocityX, heliPartVelocityY, pickUps,
    shotgun, akimboMac10s, rpg } from "./physics/spawn.js";
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
let xSpeed = .5;
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
    size: 1,
    speed: .5,
    ammo: -10,
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

const start = () => {
    heliHealth = HELIHEALTHMAX;
    heliCount = 0;
    playerHealth = PLAYERHEALTHMAX;
    character.position.x = 0;
}

start();

document.addEventListener("keydown", onDocumentKeyDown, false);
function onDocumentKeyDown(event) {
    let keyCode = event.which;
    if (keyCode == 38) { // jump
        //Allows jump only if on ground
    	if (Math.abs(yVelocity) == 0){
            yVelocity = ySpeed;
            gravity = GRAVITATION;
        }
        //
        keyEvents[0] = 1;
    } else if (keyCode == 40) { //down
        //No ducking yet
    } else if (keyCode == 37) { //left
        //Move left
        xVelocity = -xSpeed;
        //
        keyEvents[2] = 1;
    } else if (keyCode == 39) { //right
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
        } else xVelocity = 0;
        //
    } else if (keyCode == 39) {
        //See above
        keyEvents[3] = 0;
        if (keyEvents[2]){
        	xVelocity = -xSpeed;
        } else xVelocity = 0;
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
    let geometry = new THREE.PlaneGeometry( 1, 1, 32 );
    let material = new THREE.MeshBasicMaterial( {color: 0xccffcc, side: THREE.DoubleSide} );
    let square = new THREE.Mesh( geometry, material );
    scene.add( square );
    square.position.x = heli.position.x;
    square.position.y = heli.position.y;
    let tmpHeliPos = new THREE.Vector3(heli.position.x, heli.position.y, 0);
    let bulletVelocity = tmpHeliPos.sub(character.position).normalize().negate();
    let bullet = {
        velocity: bulletVelocity.multiplyScalar(bulletSpeed),
        mesh: square
    }
    heliBullets.push(bullet);
}

const shootBullet = () => {
    if (equippedWeapon.name != standardGun.name){
        equippedWeapon.ammo--;
        updateWeaponInfo();
        if (equippedWeapon.ammo == 1){
            equippedWeapon = standardGun;
            //clearInterval(shoot);
            //shoot = setInterval(shootBullet, equippedWeapon.reloadTime);
        }
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
    let geometry = new THREE.PlaneGeometry( equippedWeapon.size, equippedWeapon.size, 32 );
    let material = new THREE.MeshBasicMaterial( {color: equippedWeapon.color, side: THREE.FrontSide} );
    let square = new THREE.Mesh( geometry, material );
    scene.add( square );
    playSound(equippedWeapon.shotSound);
    square.position.x = character.position.x;
    square.position.y = character.position.y;
    let tmpCharPos = new THREE.Vector3(character.position.x, character.position.y, 0);
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
        let tmpCharPos2 = new THREE.Vector3(character.position.x - offset, character.position.y, 0);
        let bulletVelocity2 = tmpCharPos2.sub(tmpPos).normalize().negate();
        
        let bullet2 = {
            velocity: bulletVelocity2.multiplyScalar(equippedWeapon.speed),
            mesh: square2,
            damage: equippedWeapon.damage
        }
        square2.position.x = character.position.x - offset;
        square2.position.y = character.position.y;
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
            let tmpCharPos2 = new THREE.Vector3(character.position.x, character.position.y, 0);
            let bulletVelocity2 = tmpCharPos2.sub(tmpPos).normalize().negate();
            
            let bullet2 = {
                velocity: bulletVelocity2.multiplyScalar(equippedWeapon.speed),
                mesh: square2,
                damage: equippedWeapon.damage
            }
            square2.position.x = character.position.x;
            square2.position.y = character.position.y;
            bullets.push(bullet2);
        }
    }
}

let rpgPickup = './sounds/rpg.wav'
let akimboPickup = './sounds/akimboMac10s.wav';
let shotgunPickup = './sounds/shotgun.wav';
let shotgunBlast = './sounds/shotgunBlast.wav';
let explosion = './sounds/explosion.wav';
let metalHit = './sounds/metalHit.wav';
let gunshot = './sounds/gunshot.wav';
let rpgBlast = './sounds/rpgBlast.wav';
let rpgHit = './sounds/explosion.wav';

standardGun.shotSound = gunshot;
standardGun.hitSound = metalHit;
shotgun.shotSound = shotgunBlast;
shotgun.hitSound = metalHit;
shotgun.pickupSound = shotgunPickup;
akimboMac10s.shotSound = gunshot;
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

playSound(explosion);

function sound (src) {
    this.sound = document.createElement("audio");
    this.sound.src = src;
    this.sound.setAttribute("preload", "auto");
    this.sound.setAttribute("controls", "none");
    this.sound.style.display = "none";
    document.body.appendChild(this.sound);
    //this.sound.play();
}

let heliDodging;
let heliShooting = setInterval(shootHeliBullet, 500);
let heliFlyoff = setInterval(flyOff, 20000);
let dodger = setTimeout( function() {
    dodge();
    heliDodging = setInterval(dodge, 5000)
}, 3000);

let text2;

const gameOver = () => {
    text2 = document.createElement('div');
    text2.style.position = 'absolute';
    //text2.style.zIndex = 1;    // if you still don't see the label, try uncommenting this
    text2.style.width = 100;
    text2.style.height = 100;
    text2.style.backgroundColor = "blue";
    text2.innerHTML = "GAME OVER";
    text2.style.top = 200 + 'px';
    text2.style.left = window.innerWidth/2 + 'px';
    document.body.appendChild(text2);
    blowUp();

}

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
    healthBar.position.x = character.position.x + 70;
    healthBarBackground.position.y = 30;
    healthBarBackground.position.x = character.position.x + 70;


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
                helipart1[i].rotation.z += Math.PI / 100;
                helipart2[i].rotation.z += Math.PI / 50;
                heliPartVelocityY[i] -= GRAVITATION;
                if (heliPartVelocityX[i] > 0)
                    heliPartVelocityX[i] -= 0.001;
                helipart1[i].position.y += heliPartVelocityY[i];
                helipart2[i].position.y += heliPartVelocityY[i];
                helipart1[i].position.x += heliPartVelocityX[i]/3;
                helipart2[i].position.x -= heliPartVelocityX[i];
            }
        }
        
    }
}

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
            pickUps[i].mesh.position.y += pickUps[i].velocity;
        }
        if (checkBulletCollision(character, pickUps[i].mesh)){
            equippedWeapon = pickUps[i];
            playSound(equippedWeapon.pickupSound);
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
    //Blow up heli animation
    heliPartAnimation();
    //
    //Healthbar
    healthBarBackground.position.x = character.position.x + 70;  
    healthBar.position.x = character.position.x + 70;
    //

    camera.position.x = character.position.x;
    //Move Helicopter
    move();
    //
    
    for (var i = 0; i < heliBullets.length; i++) {
        //Move bullets
        heliBullets[i].mesh.position.x += heliBullets[i].velocity.x;
        heliBullets[i].mesh.position.y += heliBullets[i].velocity.y;
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
        if (checkBulletCollision(heliBullets[i].mesh, character)){
            scene.remove(heliBullets[i].mesh);
            heliBullets.splice(i, 1);
            playerHealth--;
            displayHealthBar();
            if (playerHealth == 0){
                gameOver();
                gameStatus = "game_over";
            }
        }
    }
    //
    //Character bullet collision detection
    for (var i = 0; i < bullets.length; i++) {
        //move bullets
        bullets[i].mesh.position.x += bullets[i].velocity.x;
        bullets[i].mesh.position.y += bullets[i].velocity.y;
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
        if (checkBulletCollision(heli, bullets[i].mesh)){
            heliHealth -= bullets[i].damage;
            playSound(equippedWeapon.hitSound);
            scene.remove(bullets[i].mesh);
            bullets.splice(i, 1);
            if(heliHealth <= 0){
                playSound(explosion);
                blowUp();
                heliHealth = HELIHEALTHMAX;
                updateWeaponInfo;
                equippedWeapon = standardGun;
                heliCount++;
                displayScore();
            }
        }
    }
    //
    //Collisions come back as t,b,l,r or none
    let collisions = checkCollisions(objects, character);
    //
    //Temporary gravity allows gravity if in contact with wall
    let gravityThisTurn = gravity;
    //
    //Preserves users ability to move left and right after contacting a wall in mid air.
    let tmpXVel = xVelocity;
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
            if (yVelocity > -1){
                yVelocity += -gravityThisTurn;
            }
    }
    //
    //Final movement of character
    character.position.x += tmpXVel;
    character.position.y += yVelocity;
    //
};

const render = () => {
	renderer.render( scene, camera );
};

const GameLoop = () => {
    requestAnimationFrame( GameLoop );
    if (gameStatus == 'play'){
    	update();
    	render();
    }
};

GameLoop();


