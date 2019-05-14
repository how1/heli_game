import * as THREE from 'three';
import "../styles/components/loader.scss";
import { playerHealth, getMousePos, listener, mute, playSound } from "../app.js";


(function(){var script=document.createElement('script');script.onload=function(){var stats=new Stats();document.body.appendChild(stats.dom);requestAnimationFrame(function loop(){stats.update();requestAnimationFrame(loop)});};script.src='//rawgit.com/mrdoob/stats.js/master/build/stats.min.js';document.head.appendChild(script);})()

export let scene = new THREE.Scene();
export let renderer = new THREE.WebGLRenderer();

let height = window.innerHeight - 4;
let width = height * 1.5;
// width = window.innerWidth;
// height = window.innerHeight;
renderer.setSize( width, height );
document.body.appendChild( renderer.domElement );

export let camera = new THREE.PerspectiveCamera( 45, width / height, 0.1, 1000 );
scene.add( camera );

camera.position.z = 100;

window.addEventListener('resize', () => {
	height = window.innerHeight - 5;
	width = height * 1.5;
	renderer.setSize(width, height);
	camera.aspect = width/height;
	camera.updateProjectionMatrix();
});

export let objects = [];

export let character;
export let arm;
export let rocket;

let maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

//Buttons
let buttonGeom = new THREE.PlaneGeometry(50, 10);
let titleGeom = new THREE.PlaneGeometry(50, 50);
let tick = require('../sounds/tick.wav');
let backButtonUpTex = getTexture(require('../pics/backButtonUp.png'));
let backButtonDownTex = getTexture(require('../pics/backButtonDown.png'));
let backButtonUpHoverTex = getTexture(require('../pics/backButtonUpHover.png'));
let resumeButtonUpTex = getTexture(require('../pics/resumeButtonUp.png'));
let resumeButtonDownTex = getTexture(require('../pics/resumeButtonDown.png'));
let resumeButtonUpHoverTex = getTexture(require('../pics/resumeButtonUpHover.png'));
let restartButtonUpTex = getTexture(require('../pics/restartButtonUp.png'));
let restartButtonUpHoverTex = getTexture(require('../pics/restartButtonUpHover.png'));
let restartButtonDownTex = getTexture(require('../pics/restartButtonDown.png'));
let mainMenuButtonUpTex = getTexture(require('../pics/mainMenuButtonUp.png'));
let mainMenuButtonUpHoverTex = getTexture(require('../pics/mainMenuButtonUpHover.png'));
let mainMenuButtonDownTex = getTexture(require('../pics/mainMenuButtonDown.png'));
let instructionsUpTex = getTexture(require('../pics/instructionsButtonUp.png'));
let instructionsUpHoverTex = getTexture(require('../pics/instructionsButtonUpHover.png'));
let instructionsDownTex = getTexture(require('../pics/instructionsButtonDown.png'));
let startGameUpTex = getTexture(require('../pics/startGameButtonUp.png'));
let startGameUpHoverTex = getTexture(require('../pics/startGameButtonUpHover.png'));
let startGameDownTex = getTexture(require('../pics/startGameButtonDown.png'));
let creditsUpTex = getTexture(require('../pics/creditsButtonUp.png'));
let creditsUpHoverTex = getTexture(require('../pics/creditsButtonUpHover.png'));
let creditsDownTex = getTexture(require('../pics/creditsButtonDown.png'));

export let buttons = [
	new Button(backButtonUpTex, backButtonDownTex, backButtonUpHoverTex, tick, 0,-36,0),
	new Button(resumeButtonUpTex, resumeButtonDownTex, resumeButtonUpHoverTex, tick, 0,-36,0),
	new Button(mainMenuButtonUpTex, mainMenuButtonDownTex, mainMenuButtonUpHoverTex, tick, 0,-36,0),
	new Button(restartButtonUpTex, restartButtonDownTex, restartButtonUpHoverTex, tick, 0,-36,0),
	new Button(instructionsUpTex, instructionsDownTex, instructionsUpHoverTex, tick, 30,0,3),
	new Button(startGameUpTex, startGameDownTex, startGameUpHoverTex, tick, 30,11,3),
	new Button(creditsUpTex, creditsDownTex, creditsUpHoverTex, tick, 30,-11,3),
];
// export let resumeButton;
// export let mainMenuButton;
// export let restartButton;
// export let pauseBackground;
// export let backButton = new Button(backButtonUpTex, backButtonDownTex, backButtonUpHoverTex, tick, 0,-36,0);


// export let instructionsButton;
// export let startGameButton;
// export let creditsButton;

// let buttonGeom = new THREE.PlaneGeometry(50, 10);
// let titleGeom = new THREE.PlaneGeometry(50, 50);
// let instructionsUpTex = getTexture(require('../pics/instructionsButtonUp.png'));
// let instructionsDownTex = getTexture(require('../pics/instructionsButtonDown.png'));
// let startGameUpTex = getTexture(require('../pics/startGameButtonUp.png'));
// let startGameDownTex = getTexture(require('../pics/startGameButtonDown.png'));
// let creditsUpTex = getTexture(require('../pics/creditsButtonUp.png'));
// let creditsDownTex = getTexture(require('../pics/creditsButtonDown.png'));
//

export const resetJumping = () => {
	jumpingNewVal = 0;
}

export const changeJumpingDir = (dir) => {
	if (dir == 'left')
		jump('left');
	else jump('right');
}

export let bgImage;

//Sprite Sheets

export let heliFlying;
export let crashedHeliSpr;
let explosionSpr
export let explosion;
let bulletHitSpr;
let standingLeft;
let standingRight;
export let leftFoot;
export let rightFoot;
let jumpingRight;
let jumpingLeft;
let jumpingNewVal = 0;

//

//Misc textures

export let armTex;
export let armTex2;
export let armTex3;
export let armTexLeft;
export let armTex2Left;
export let armTex3Left;

export let rocketTex;
export let rocketTex2;

//

const getSound = (src, audioObj, loop) => {
    // create an AudioListener and add it to the camera
    var listener = new THREE.AudioListener();
    camera.add( listener );

    // create a global audio source
    var sound = new THREE.Audio( listener );

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

//Character Sounds
let footstepsFile = require('../sounds/footsteps.wav');
let footsteps;
//

const spriteSheet = (sprite, x, y, d, scaleX, scaleY, type) => {
	let sheet = {
		xOffset: x,
		yOffset: y,
		newVal: 0,
		mat: null,
		spr: null,
		tex: null,
		type: null,
	}
	sheet.tex = sprite;
	sheet.tex.repeat.set( 1/d, 1);
	sheet.tex.needsUpdate = true;
	sheet.tex.wrapS = sheet.tex.wrapT - THREE.repeatWrapping;
	sheet.mat = new THREE.SpriteMaterial({map: sheet.tex});
	sheet.mat.transparent = true;
	sheet.opacity = 1;
	if (type)
		sheet.type = type;

	sheet.spr = new THREE.Sprite(sheet.mat);
	sheet.spr.scale.set( scaleX, scaleY, 1);
	return sheet;
}

let walkingArrayRight = [0.016, .111, .211, .308, .398, .488, .578];
let walkingArrayLeft = [.897, .802, .702, .602, .512, .422, .332];
let standingArrayRight = [.67, .76, .85, .6];
let standingArrayLeft = [.06, .15, .24, .15];
let jumpingArrayLeft = [.33, .21];
let jumpingArrayRight = [.58, .7];
let heliArray = [.217, -0.014, .47, .111, .59, .34];
let explosionArray = [ 0, .083, .165, .25, .335, .42, .51, .60, .695, .78, .87];
let bulletHitArray = [ 0, .18, .38, .58, .78];
// let explosionArray = [ 0, .083, .083, .083, .165, .165, .165, .2, .2, .2, .2];


export const updateBackground = () => {
	// let pos = character.mesh.position;
	farBackground.position.x = character.mesh.position.x;
}

export const updateSprite = (sprite, crashed) => {
	if (sprite == rightFoot){
		if (sprite.newVal == 7){
			sprite.newVal = 0;
			sprite.tex.offset.x = walkingArrayRight[sprite.newVal];
			sprite.newVal++;
		} else {
			sprite.tex.offset.x = walkingArrayRight[sprite.newVal];
			sprite.newVal++;
		}
	} else if (sprite == leftFoot){
		if (sprite.newVal == 7){
			sprite.newVal = 0;
			sprite.tex.offset.x = walkingArrayLeft[sprite.newVal];
			sprite.newVal++;
		} else {
			sprite.tex.offset.x = walkingArrayLeft[sprite.newVal];
			sprite.newVal += 1;
		}
	} else if (sprite == standingRight){
		if (sprite.newVal > 2){
			sprite.newVal = 1;
			sprite.tex.offset.x = standingArrayRight[sprite.newVal];
			sprite.newVal = 0;
		} else {
			sprite.tex.offset.x = standingArrayRight[sprite.newVal];
			sprite.newVal++;
		}
	} else if (sprite == standingLeft){
		if (sprite.newVal > 2){
			sprite.newVal = 1;
			sprite.tex.offset.x = standingArrayLeft[sprite.newVal];
			sprite.newVal = 0;
		} else {
			sprite.tex.offset.x = standingArrayLeft[sprite.newVal];
			sprite.newVal++;
		}
	} else if (sprite == jumpingRight){
		if (jumpingNewVal > 1){
			jumpingNewVal = 0;
			sprite.tex.offset.x = jumpingArrayRight[jumpingNewVal];
		} else {
			sprite.tex.offset.x = jumpingArrayRight[jumpingNewVal];
			jumpingNewVal++;
		}
	} else if (sprite == jumpingLeft){
		if (jumpingNewVal > 1){
			jumpingNewVal = 0;
			sprite.tex.offset.x = jumpingArrayLeft[jumpingNewVal];
		} else {
			sprite.tex.offset.x = jumpingArrayLeft[jumpingNewVal];
			jumpingNewVal++;
		}
	} else if (crashed == 'crashed') {
		if (sprite.newVal == 6){
			sprite.newVal = 0;
			sprite.tex.offset.x = heliArray[sprite.newVal];
			sprite.newVal++;
		} else {
			sprite.tex.offset.x = heliArray[sprite.newVal];
			sprite.newVal++;
		}
	} else if (sprite == heliFlying){
		if (sprite.newVal == 6){
			sprite.newVal = 0;
			sprite.tex.offset.x = heliArray[sprite.newVal];
			sprite.newVal++;
		} else {
			sprite.tex.offset.x = heliArray[sprite.newVal];
			sprite.newVal++;
		}
	} else if (crashed == 'explosion'){
		if (sprite.newVal == 12){
			// sprite.newVal = 0;
			// sprite.tex.offset.x = explosionArray[sprite.newVal];
			scene.remove(sprite.spr);
			return 'done';
			// sprite.newVal++;
		} else {
			sprite.tex.offset.x = explosionArray[sprite.newVal];
			sprite.newVal++;
		}
	} else if (crashed == 'bullet'){
		if (sprite.newVal == 5){
			// sprite.newVal = 0;
			// sprite.tex.offset.x = explosionArray[sprite.newVal];
			scene.remove(sprite.spr);
			return 'done';
			// sprite.newVal++;
		} else {
			sprite.tex.offset.x = bulletHitArray[sprite.newVal];
			sprite.newVal++;
		}
	}

}

//For arm sprite
export const getMaterial = (image) => {
	image.anisotropy = maxAnisotropy;
	let mat = new THREE.MeshBasicMaterial({map: image, side: THREE.FrontSide});
	mat.transparent = true;
	mat.opacity = 1;
	return mat;
}

//Background
// let foreground;
let mdForeground;
let background;
let farBackground;

export const getCrashedHeli = () => {
	return new spriteSheet(crashedHeliSpr, 0, 1, 8, 40, 20);
}

export const getExplosion = (scale) => {
	return new spriteSheet(explosionSpr, 0, 1, 12, scale, scale, 'explosion');
}

export const getBulletHit = (scale) => {
	return new spriteSheet(bulletHitSpr, 0, 1, 5, scale, scale, 'bulletHit');
}

const getBackgroundMesh = (tex, zPos, yPos, geom, repeat) => {
	tex.anisotropy = maxAnisotropy;
	tex.wrapS = THREE.RepeatWrapping;
	tex.repeat.set( repeat , 1 );
	let mat = new THREE.MeshBasicMaterial({map: tex, side: THREE.FrontSide });
	mat.transparent = true;
	mat.opacity = 1;
	// let bgGeom = new THREE.PlaneGeometry(192* 10, 108, 32);
	let mesh = new THREE.Mesh(geom, mat);
	mesh.position.z = zPos;
	mesh.position.y = yPos;
	scene.add(mesh);
	return mesh;
}

const getTexture = (path) => {
	let tex = new THREE.TextureLoader().load(path.toString());
	tex.anisotropy = maxAnisotropy;
	return tex;
}

let titleTex = getTexture(require('../pics/title.png'));

export const mainMenu = () => {
	camera.position.x = 0;
	scene.remove.apply(scene, scene.children);
	character = null;
	//Background
	let bgGeom = new THREE.PlaneGeometry(192 * 10, 108, 32);
	let bgGeom1 = new THREE.PlaneGeometry(384 * 10, 216, 32);
	let bgGeom2 = new THREE.PlaneGeometry(800, 390, 32);
	mdForeground = getBackgroundMesh( getTexture(require('../pics/buildings/near-buildings-bg.png')) , -50, -10, bgGeom, 10 );
	background = getBackgroundMesh( getTexture( require('../pics/buildings/buildings-bg.png')) , -300, -50, bgGeom1, 10 );
	farBackground = getBackgroundMesh( getTexture( require('../pics/buildings/skyline-d.png')), -301, 10, bgGeom2, 1 );
	let tintGeom = new THREE.PlaneGeometry(1000, 1000, 32);
	let tintMat = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.FrontSide});
	tintMat.transparent = true;
	tintMat.opacity = .15;
	let tintMesh = new THREE.Mesh(tintGeom, tintMat);
	scene.add(tintMesh);
	tintMesh.position.z = 4;

	// let test = new THREE.MeshBasicMaterial({color: 0xff0000, side: THREE.FrontSide});

	instructionsButton = new THREE.Mesh(buttonGeom, getMaterial(instructionsUpTex));
	startGameButton = new THREE.Mesh(buttonGeom, getMaterial(startGameUpTex));
	creditsButton = new THREE.Mesh(buttonGeom, getMaterial(creditsUpTex));
	let title = new THREE.Mesh(titleGeom, getMaterial(titleTex));
	// instructionsButton = new THREE.Mesh(buttonGeom, test);
	// startGameButton = new THREE.Mesh(buttonGeom, test);
	// creditsButton = new THREE.Mesh(buttonGeom, test);

	scene.add(instructionsButton);
	scene.add(startGameButton);
	scene.add(creditsButton);
	scene.add(title);

	title.position.x = -30;
	title.position.z = 4;
}

export const pause = () => {
    let pauseGeom = new THREE.PlaneGeometry( 60, 60, 32);
    let pauseMat = new THREE.MeshBasicMaterial({color: 0x000000, side: THREE.FrontSide});
    pauseMat.transparent = true;
    pauseMat.opacity = .6;
    pauseBackground = new THREE.Mesh(pauseGeom, pauseMat);
    scene.add(pauseBackground);

    let buttonGeom = new THREE.PlaneGeometry(50, 10);
    resumeButton = new THREE.Mesh(buttonGeom, getMaterial(getTexture(require('../pics/resumeButtonUp.png'))));
    resumeButton.position.y = 11;
    scene.add(resumeButton);

    restartButton = new THREE.Mesh(buttonGeom, getMaterial(getTexture(require('../pics/restartButtonUp.png'))));
    scene.add(restartButton);

    mainMenuButton = new THREE.Mesh(buttonGeom, getMaterial(getTexture(require('../pics/mainMenuButtonUp.png'))));
    mainMenuButton.position.y = -11;
    scene.add(mainMenuButton);

    restartButton.position.x = character.mesh.position.x;
    mainMenuButton.position.x = character.mesh.position.x;
    pauseBackground.position.x = character.mesh.position.x;
    resumeButton.position.x = character.mesh.position.x;
    resumeButton.position.z = 4;
    pauseBackground.position.z = 3.8;
    restartButton.position.z =  4;
    mainMenuButton.position.z = 4;
}

export const resume = () => {
	scene.remove(resumeButton);
	scene.remove(pauseBackground);
	scene.remove(mainMenuButton);
	scene.remove(restartButton);
}

let arrowKeysFile = require('../pics/arrowKeys.png');
let arrowKeysImage;


export const showGameOverButtons = () => {
    restartButton = new THREE.Mesh(buttonGeom, getMaterial(getTexture(require('../pics/restartButtonUp.png'))));
    scene.add(restartButton);

    mainMenuButton = new THREE.Mesh(buttonGeom, getMaterial(getTexture(require('../pics/mainMenuButtonUp.png'))));
    scene.add(mainMenuButton);

    mainMenuButton.position.y = -7;
    restartButton.position.y = -7;
    restartButton.position.x = character.mesh.position.x - 23;
    mainMenuButton.position.x = character.mesh.position.x + 23;
    restartButton.position.z =  4;
    mainMenuButton.position.z = 4;
}

export const instructions = () => {
	scene.remove.apply(scene, scene.children);

	//Background
	let bgGeom = new THREE.PlaneGeometry(192 * 10, 108, 32);
	let bgGeom1 = new THREE.PlaneGeometry(384 * 10, 216, 32);
	let bgGeom2 = new THREE.PlaneGeometry(800, 390, 32);
	mdForeground = getBackgroundMesh( getTexture(require('../pics/buildings/near-buildings-bg.png')) , -50, -10, bgGeom, 10 );
	background = getBackgroundMesh( getTexture( require('../pics/buildings/buildings-bg.png')) , -300, -50, bgGeom1, 10 );
	farBackground = getBackgroundMesh( getTexture( require('../pics/buildings/skyline-d.png')), -301, 10, bgGeom2, 1 );
	let tintGeom = new THREE.PlaneGeometry(1000, 1000, 32);
	let tintMat = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.FrontSide});
	tintMat.transparent = true;
	tintMat.opacity = .15;
	let tintMesh = new THREE.Mesh(tintGeom, tintMat);
	scene.add(tintMesh);
	tintMesh.position.z = 5;
	//

	let arrowKeysImageGeom = new THREE.PlaneGeometry( 60, 60, 32);
	let arrowKeysImageTex = getTexture(arrowKeysFile);
	let arrowKeysMat = getMaterial(arrowKeysImageTex);
	let arrowKeysImage = new THREE.Mesh(arrowKeysImageGeom, arrowKeysMat);
	console.log(arrowKeysImage);
	scene.add(arrowKeysImage);
	// arrowKeysImage.position.x = -20;

	backButton = new THREE.Mesh(buttonGeom, getMaterial(getTexture(require('../pics/backButtonUp.png'))));
	backButton.position.y = -36;
	scene.add(backButton);
}


export const credits = () => {
	scene.remove.apply(scene, scene.children);
	//Background
	let bgGeom = new THREE.PlaneGeometry(192 * 10, 108, 32);
	let bgGeom1 = new THREE.PlaneGeometry(384 * 10, 216, 32);
	let bgGeom2 = new THREE.PlaneGeometry(800, 390, 32);
	mdForeground = getBackgroundMesh( getTexture(require('../pics/buildings/near-buildings-bg.png')) , -50, -10, bgGeom, 10 );
	background = getBackgroundMesh( getTexture( require('../pics/buildings/buildings-bg.png')) , -300, -50, bgGeom1, 10 );
	farBackground = getBackgroundMesh( getTexture( require('../pics/buildings/skyline-d.png')), -301, 10, bgGeom2, 1 );
	let tintGeom = new THREE.PlaneGeometry(1000, 1000, 32);
	let tintMat = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.FrontSide});
	tintMat.transparent = true;
	tintMat.opacity = .15;
	let tintMesh = new THREE.Mesh(tintGeom, tintMat);
	scene.add(tintMesh);
	tintMesh.position.z = 4;
	//
	let creditsGeom = new THREE.PlaneGeometry(60,60,32);
	let creditsTex = getTexture(require('../pics/credits.png'));
	let creditsMat = getMaterial(creditsTex);
	let credits = new THREE.Mesh(creditsGeom, creditsMat);
	scene.add(credits);

	scene.add(backButton.upMesh);
	backButton.positionButton();

}

function Button(up, high, down, tick, x, y, z) {
	this.upMesh = new THREE.Mesh(buttonGeom, new THREE.MeshBasicMaterial({color: 0xff0000, side: THREE.FrontSide})); //getMaterial(up));
	this.upHighMesh = new THREE.Mesh(buttonGeom, new THREE.MeshBasicMaterial({color: 0xffff00, side: THREE.FrontSide}));//getMaterial(high));
	this.downMesh = new THREE.Mesh(buttonGeom, new THREE.MeshBasicMaterial({color: 0xff00ff, side: THREE.FrontSide}));//getMaterial(down));
	this.currentMesh = this.upMesh;
	this.highlighted = false;
	this.down = false;
	this.sound = tick;
	this.x = x;
	this.y = y;
	this.z = z;
	this.unhighlight = function(){
		console.log('unhighlight');
		if (this.highlighted){
			scene.add(this.upMesh);
			scene.remove(this.upHighMesh);
			this.currentMesh = this.upHighMesh;
			this.positionButton();
			this.highlighted = false;
		}
	};
	this.repositionButton = function(x,y,z) {
		this.x = x;
		this.y = y;
		this.z = z;
	};
	this.highlight = function(mute) {
		if (!this.highlighted){
			console.log('highlight');
			scene.add(this.upHighMesh);
			scene.remove(this.upMesh);
			if (!mute){
				playSound(this.sound, new THREE.Audio(listener));
			}
			this.currentMesh = this.upMesh;
			this.positionButton();  
			this.highlighted = true;
		}
	};
	this.mouseDown = function(){
		console.log('back button down');
		if (!this.down){
			scene.add(this.downMesh);
			scene.remove(this.upMesh);
			this.currentMesh = this.upMesh;
			this.positionButton();
			this.down = true;
		}
	};
	this.mouseUp = function(mute){
		console.log('back button up');
		if (this.down){
			playSound(tick);
			// scene.add(this.upMesh);
			// scene.remove(this.downMesh);
			// this.currentMesh = this.downMesh;
			// this.positionButton();
			// this.down = true;
		}
	};
	this.positionButton = function() {
		this.currentMesh.position.x = this.x;
		this.currentMesh.position.y = this.y;
		this.currentMesh.position.z = this.z;
	};
}


export const buttonHighlight = (button, dir) => {
	if (dir == 'up') {
		if (button == 'startGameButton'){
			startGameButton.material.map = getTexture(require('../pics/startGameButtonUpHover.png'));
			startGameButton.material.needsUpdate = true;
		} else if (button == 'instructionsButton'){
			instructionsButton.material.map = getTexture(require('../pics/instructionsButtonUpHover.png'));
			instructionsButton.material.needsUpdate = true;
		} else if (button == 'creditsButton'){
			creditsButton.material.map = getTexture(require('../pics/creditsButtonUpHover.png'));
			creditsButton.material.needsUpdate = true;
		} else if (button == 'backButton'){
			backButton.material.map = getTexture(require('../pics/backButtonUpHover.png'));
			creditsButton.material.needsUpdate = true;
		} else if (button == 'resumeButton'){
			resumeButton.material.map = getTexture(require('../pics/resumeButtonUpHover.png'));
			resumeButton.material.needsUpdate = true;
		} else if (button == 'restartButton'){
			restartButton.material.map = getTexture(require('../pics/restartButtonUpHover.png'));
			restartButton.material.needsUpdate = true;
		} else if (button == 'mainMenuButton'){
			mainMenuButton.material.map = getTexture(require('../pics/mainMenuButtonUpHover.png'));
			mainMenuButton.material.needsUpdate = true;
		}

	} else {
		if (button == 'startGameButton'){
			startGameButton.material.map = getTexture(require('../pics/startGameButtonUp.png'));
			startGameButton.material.needsUpdate = true;
		} else if (button == 'instructionsButton'){
			instructionsButton.material.map = getTexture(require('../pics/instructionsButtonUp.png'));
			instructionsButton.material.needsUpdate = true;
		} else if (button == 'creditsButton'){
			creditsButton.material.map = getTexture(require('../pics/creditsButtonUp.png'));
			creditsButton.material.needsUpdate = true;
		} else if (button == 'backButton'){
			backButton.material.map = getTexture(require('../pics/backButtonUp.png'));
			backButton.material.needsUpdate = true;
		} else if (button == 'resumeButton'){
			resumeButton.material.map = getTexture(require('../pics/resumeButtonUp.png'));
			resumeButton.material.needsUpdate = true;
		} else if (button == 'restartButton'){
			restartButton.material.map = getTexture(require('../pics/restartButtonUp.png'));
			restartButton.material.needsUpdate = true;
		} else if (button == 'mainMenuButton'){
			mainMenuButton.material.map = getTexture(require('../pics/mainMenuButtonUp.png'));
			mainMenuButton.material.needsUpdate = true;
		}
	}
}

export const buttonHover = (button, dir) => {
	if (dir == 'up') {
		if (button == 'startGameButton'){
			startGameButton.material.map = startGameUpTex;
			startGameButton.material.needsUpdate = true;
		} else if (button == 'instructionsButton'){
			instructionsButton.material.map = instructionsUpTex ;
			instructionsButton.material.needsUpdate = true;
		} else if (button == 'creditsButton'){
			creditsButton.material.map = creditsUpTex ;
			creditsButton.material.needsUpdate = true;
		} else if (button == 'backButton'){
			backButton.material.map = backButtonUpTex;
			creditsButton.material.needsUpdate = true;
		} else if (button == 'resumeButton'){
			resumeButton.material.map = resumeButtonUpTex;
			resumeButton.material.needsUpdate = true;
		} else if (button == 'restartButton'){
			restartButton.material.map = restartButtonUpTex;
			restartButton.material.needsUpdate = true;
		} else if (button == 'mainMenuButton'){
			mainMenuButton.material.map = mainMenuButtonUpTex;
			mainMenuButton.material.needsUpdate = true;
		}

	} else {
		if (button == 'startGameButton'){
			startGameButton.material.map = startGameDownTex;
			startGameButton.material.needsUpdate = true;
		} else if (button == 'instructionsButton'){
			instructionsButton.material.map = instructionsDownTex;
			instructionsButton.material.needsUpdate = true;
		} else if (button == 'creditsButton'){
			creditsButton.material.map = creditsDownTex;
			creditsButton.material.needsUpdate = true;
		} else if (button == 'backButton'){
			backButton.material.map = backButtonDownTex;
			backButton.material.needsUpdate = true;
		} else if (button == 'resumeButton'){
			resumeButton.material.map = resumeButtonDownTex;
			resumeButton.material.needsUpdate = true;
		} else if (button == 'restartButton'){
			restartButton.material.map = restartButtonDownTex;
			restartButton.material.needsUpdate = true;
		} else if (button == 'mainMenuButton'){
			mainMenuButton.material.map = mainMenuButtonDownTex;
			mainMenuButton.material.needsUpdate = true;
		}
	}
}

export const init = () => {
	character = {
		mesh: null,
		texture: null,
		sheet: null
	}
	//Background
	let bgGeom = new THREE.PlaneGeometry(192 * 10, 108, 32);
	let bgGeom1 = new THREE.PlaneGeometry(384 * 10, 216, 32);
	let bgGeom2 = new THREE.PlaneGeometry(800, 390, 32);
	mdForeground = getBackgroundMesh( getTexture(require('../pics/buildings/near-buildings-bg.png')) , -50, -10, bgGeom, 10 );
	background = getBackgroundMesh( getTexture( require('../pics/buildings/buildings-bg.png')) , -300, -50, bgGeom1, 10 );
	farBackground = getBackgroundMesh( getTexture( require('../pics/buildings/skyline-d.png')), -301, 10, bgGeom2, 1 );
	let tintGeom = new THREE.PlaneGeometry(1000, 1000, 32);
	let tintMat = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.FrontSide});
	tintMat.transparent = true;
	tintMat.opacity = .15;
	let tintMesh = new THREE.Mesh(tintGeom, tintMat);
	scene.add(tintMesh);
	tintMesh.position.z = 10;

	// farBackground2 = getBackgroundMesh( getTexture( require('../pics/skyline-b')), -400.1, 40, false );
	//

	//Character sprites
	standingRight = new spriteSheet( getTexture(require('../pics/roboWalkingLarge.png')) , 0, 1, 11, 10, 10);
	standingLeft = new spriteSheet( getTexture(require('../pics/roboWalkingLarge2.png')) , 0, 1, 11, 10, 10);
	rightFoot = new spriteSheet( getTexture(require('../pics/roboWalkingLarge.png')) , 0, 1, 11, 10, 10);
	leftFoot = new spriteSheet( getTexture(require('../pics/roboWalkingLarge2.png')) , 0, 1, 11, 10, 10);
	jumpingRight = new spriteSheet( getTexture(require('../pics/roboJumping.png')) , 0,1,11,10,10);
	jumpingLeft = new spriteSheet( getTexture(require('../pics/roboJumping2.png')) , 0,1,11,10,10);
	//
	
	//Heli sprites
	heliFlying = new spriteSheet( getTexture(require('../pics/heli5.png')) , 0, 1, 8, 40, 20);
	crashedHeliSpr = getTexture( require('../pics/crashedHeli.png' ));
	//

	//Arms
	armTex = getMaterial(new THREE.TextureLoader().load(require('../pics/roboArm.png')));
	armTex3 = getMaterial(new THREE.TextureLoader().load(require('../pics/roboArm3.png')));
	armTex2 = getMaterial(new THREE.TextureLoader().load(require('../pics/roboArm2.png')));

	armTexLeft = getMaterial(new THREE.TextureLoader().load(require('../pics/roboArmLeft.png')));
	armTex3Left = getMaterial(new THREE.TextureLoader().load(require('../pics/roboArm3Left.png')));
	armTex2Left = getMaterial(new THREE.TextureLoader().load(require('../pics/roboArm2Left.png')));

	let materials = [
		new THREE.MeshBasicMaterial({color: 0x000000, side: THREE.FrontSide}),
		new THREE.MeshBasicMaterial({color: 0x000000, side: THREE.FrontSide}),
		new THREE.MeshBasicMaterial({color: 0x000000, side: THREE.FrontSide}),
		armTex,
		new THREE.MeshBasicMaterial({color: 0x000000, side: THREE.FrontSide}),
		new THREE.MeshBasicMaterial({color: 0x000000, side: THREE.FrontSide})
	];

	for (var i = 0; i < materials.length; i++) {
		materials[i].transparent = true;
		materials[i].opacity = 0;
	}
	materials[3].opacity = 1;
	arm = new THREE.Mesh( new THREE.BoxGeometry( 1.5, 0, 5 ), materials );// 12px * 50px, 4.16:1
	arm.up = new THREE.Vector3(0,0,-1);
	scene.add( arm );
	//

	//Rockets
	rocketTex = getMaterial(new THREE.TextureLoader().load(require('../pics/rocketTex.png')));
	rocketTex.anisotropy = maxAnisotropy;
	rocketTex2 = getMaterial(new THREE.TextureLoader().load(require('../pics/rocketTex2.png')));
	rocketTex2.anisotropy = maxAnisotropy;
	let geometry = new THREE.PlaneGeometry(4, 4, 32);
	rocket = new THREE.Mesh(geometry, rocketTex);
	//

	//Explosion
	explosionSpr = getTexture( require('../pics/explosion.png' ));
	//

	//Bullet hit explosion
	bulletHitSpr = getTexture( require('../pics/bulletHit.png' ));
	//


	const directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
	directionalLight.position.set( 1, 1, 0 );
	scene.add(directionalLight);

	const ambientLight = new THREE.AmbientLight( 0xcccccc, 1 );
	scene.add(ambientLight);

	//Character mesh
	character.sheet = jumpingRight;
	character.texture = character.sheet.spr;
	scene.add( character.texture );
	let geometry2 = new THREE.PlaneGeometry( 3.5, 7, 32);
	let material2 = new THREE.MeshBasicMaterial( {color: 0x000000, side: THREE.FrontSide} );
	material2.transparent = true;
	material2.opacity = 0;
	character.mesh = new THREE.Mesh( geometry2, material2);
	scene.add(character.mesh);
	//


	//Floor
	let sceneryX = [0,-50,50,100,150,200];
	let sceneryY = [-50, -40, -35,-40,-50, -40];

	for (var i = 0; i < sceneryX.length; i++) {
		let geometry = new THREE.PlaneGeometry( 50, 20, 32 );
		let floorTex;
		if (Math.random() < .5){
			floorTex = new THREE.TextureLoader().load(require('../pics/buildings/building1.png'));
		} else {
			floorTex = new THREE.TextureLoader().load(require('../pics/buildings/building2.png'));
		}
		if (Math.random() < .5){
			let railingTex = new THREE.TextureLoader().load(require('../pics/rail.png'));
			let material = new THREE.MeshBasicMaterial( {map: railingTex, side: THREE.FrontSide} );
			material.transparent = true;
			material.opacity = 1;
			let rail = new THREE.Mesh( geometry, material );
			scene.add( rail );
			rail.position.x = sceneryX[i];
			rail.position.y = sceneryY[i] + geometry.parameters.height;
			rail.position.z = -.1;
			// objects.push(rail);
		}
		let material = new THREE.MeshBasicMaterial( {map: floorTex, side: THREE.FrontSide} );
		material.transparent = true;
		material.opacity = 1;
		let ground = new THREE.Mesh( geometry, material );
		scene.add( ground );
		ground.position.x = sceneryX[i];
		ground.position.y = sceneryY[i];
		objects.push(ground);
	}
	//
	//Footsteps sound
	footsteps = getSound(footstepsFile, new THREE.Audio(listener) , true);
	//

}

export const moveCharacter = (x, y) => {
	character.mesh.position.x = x;
	character.mesh.position.y = y;

	// character.texture.position.x = character.mesh.position.x;
	// character.texture.position.y = character.mesh.position.y;
}

export const walk = (dir) => {
	if (footsteps.isPlaying == false && !mute){
		footsteps.play();
	}
	if (dir == 'left'){
		scene.remove(character.texture);
		character.sheet = leftFoot;
		character.sheet.newVal = 0;
		character.texture = character.sheet.spr;
	} else if (dir == 'right'){
		scene.remove(character.texture);
		character.sheet = rightFoot;
		character.sheet.newVal = 0;
		character.texture = character.sheet.spr;
	}
	updateSprite();
	character.texture.position.x = character.mesh.position.x;
	character.texture.position.y = character.mesh.position.y;
	scene.add(character.texture);

}

export const stand = (dir) => {
	footsteps.pause();
	scene.remove(character.texture);
	if (dir == 'right') {
		character.sheet = standingRight;
		character.texture = character.sheet.spr;
	}
	else if (dir == 'left') {
		character.sheet = standingLeft;
		character.texture = character.sheet.spr;
	}
	character.texture.position.x = character.mesh.position.x;
	character.texture.position.y = character.mesh.position.y;
	updateSprite();
	scene.add(character.texture);
}

export const jump = (dir) => {
	footsteps.pause();
	getMousePos();
	jumpingNewVal = 0
	scene.remove(character.texture);
	if (dir == 'right') {
		character.sheet = jumpingRight;
		character.texture = character.sheet.spr;
	}
	else if (dir == 'left') {
		character.sheet = jumpingLeft;
		character.texture = character.sheet.spr;
	}
	character.texture.position.x = character.mesh.position.x;
	character.texture.position.y = character.mesh.position.y;
	updateSprite();
	scene.add(character.texture);
}