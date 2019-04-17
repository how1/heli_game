import * as THREE from 'three';

import { bodies, camera, renderer, scene, init, character, objects } from "./physics/Initialize.js";
import { checkCollisions, checkBoundingBoxes, checkBulletCollision } from "./physics/checkForCollision.js";
import { spawn, rotateAboutPoint, move, heli, flyOff, dodge, blowUp, helipart1, helipart2, heliPartVelocityX, heliPartVelocityY } from "./physics/spawn.js";
import 'normalize.css';
import './styles/styles.scss';

init();
spawn();

let ySpeed = 1;
let xSpeed = .5;
let gravity = 0;
let bulletSpeed = .5;
let bulletInterval = 250;
const GRAVITATION = 0.028;
const BOUNDS = 500;
const DRAG = 0.028;
let hasContactedGround = false;
const HELIHEALTHMAX = 10;
let heliHealth = 10;
let gameStatus = "play";

let heliCount = 0;
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

document.addEventListener("mousedown", function(event){
    if (gameStatus == 'play'){
        shootBullet();
        shoot = setInterval(shootBullet, bulletInterval);
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
        origin: heli.position,
        velocity: bulletVelocity.multiplyScalar(bulletSpeed),
        mesh: square
    }
    heliBullets.push(bullet);
}

const shootBullet = () => {
    var vec = new THREE.Vector3(); // create once and reuse
    var pos = new THREE.Vector3(); // create once and reuse
    vec.set(
        ( mouse.clientX / window.innerWidth ) * 2 - 1,
        - ( mouse.clientY / window.innerHeight ) * 2 + 1,
        0.5 );
    vec.unproject( camera );
    vec.sub( camera.position ).normalize();
    var distance = - camera.position.z / vec.z;
    pos.copy( camera.position ).add( vec.multiplyScalar( distance ) );
    let geometry = new THREE.PlaneGeometry( 1, 1, 32 );
    let material = new THREE.MeshBasicMaterial( {color: 0x00ff00, side: THREE.DoubleSide} );
    let square = new THREE.Mesh( geometry, material );
    scene.add( square );
    square.position.x = character.position.x;
    square.position.y = character.position.y;
    let tmpCharPos = new THREE.Vector3(character.position.x, character.position.y, 0);
    let bulletVelocity = tmpCharPos.sub(pos).normalize().negate();
    let bullet = {
        origin: character.position,
        velocity: bulletVelocity.multiplyScalar(bulletSpeed),
        mesh: square
    }
    bullets.push(bullet);
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
    }
    let geometry = new THREE.PlaneGeometry( 1, playerHealth, 32 );
    let material = new THREE.MeshBasicMaterial( {color: 0xff0000, side: THREE.DoubleSide} );
    healthBar = new THREE.Mesh( geometry, material );
    if (playerHealth > 0){
        scene.add( healthBar );
    }
    healthBarPosition -= .5;
    healthBar.position.y = healthBarPosition;
    healthBar.position.x = character.position.x + 70;

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
    heliPartAnimation();
    healthBarBackground.position.x = character.position.x + 70;  
    healthBar.position.x = character.position.x + 70;
    camera.position.x = character.position.x;
    move();
    for (var i = 0; i < heliBullets.length; i++) {
        heliBullets[i].mesh.position.x += heliBullets[i].velocity.x;
        heliBullets[i].mesh.position.y += heliBullets[i].velocity.y;
        if (Math.abs(heliBullets[i].mesh.position.x) > BOUNDS){
            heliBullets[i].mesh = null;
            heliBullets.splice(i, 1);
        }
        for (var j = 0; j < objects.length; j++) {
            if (checkBulletCollision(objects[j], heliBullets[i].mesh)){
                scene.remove(heliBullets[i].mesh);
                heliBullets.splice(i, 1);
            }
        }
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
    for (var i = 0; i < bullets.length; i++) {
        bullets[i].mesh.position.x += bullets[i].velocity.x;
        bullets[i].mesh.position.y += bullets[i].velocity.y;
        if (Math.abs(bullets[i].mesh.position.x) > BOUNDS){
            bullets[i].mesh = null;
            bullets.splice(i, 1);
        }
        if (checkCollisions(objects, bullets[i].mesh).length != 0){
            scene.remove(bullets[i].mesh);
            bullets.splice(i, 1);
        }
        if (checkBulletCollision(heli, bullets[i].mesh)){
            scene.remove(bullets[i].mesh);
            bullets.splice(i, 1);
            heliHealth--;
            if(heliHealth == 0){
                blowUp();
                heliHealth = HELIHEALTHMAX;
                heliCount++;
                displayScore();
            }
        }
    }

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


