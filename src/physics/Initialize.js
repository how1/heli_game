import * as THREE from 'three';

import "../styles/components/loader.scss";
import { playerHealth, getMousePos, mute, playSound, gameStatus, displayWeaponInfo, updateWeaponInfo,
 displayScore, listener, highscore, heliCount, setCookie, checkCookie, submitScore, getScores } from "../app.js";


(function(){var script=document.createElement('script');script.onload=function(){var stats=new Stats();document.body.appendChild(stats.dom);requestAnimationFrame(function loop(){stats.update();requestAnimationFrame(loop)});};script.src='//rawgit.com/mrdoob/stats.js/master/build/stats.min.js';document.head.appendChild(script);})()

export let scene = new THREE.Scene();
export let renderer = new THREE.WebGLRenderer();

export let height = window.innerHeight - 4;
export let width = height * 1.5;
// let width = window.innerWidth;
// let height = window.innerHeight;
renderer.setSize( width, height );
document.body.appendChild( renderer.domElement );

renderer.domElement.id = 'canvas';
renderer.domElement.style.margin='auto';

export let camera = new THREE.PerspectiveCamera( 45, width / height, 0.1, 1000 );
scene.add( camera );

camera.position.z = 100;

export let windowOffset = ((window.innerWidth) - (window.innerHeight - 4) * 1.5) / 2;

window.addEventListener('resize', () => {
	windowOffset = ((window.innerWidth) - (window.innerHeight - 4) * 1.5) / 2;
	height = window.innerHeight - 4;
	width = height * 1.5;
	renderer.setSize(width, height);
	camera.aspect = width/height;
	camera.updateProjectionMatrix();
	if (gameStatus == 'play'){
		displayWeaponInfo();
		updateWeaponInfo();
		displayScore();
	}
});

export let hashedScore;

export let objects = [];

export let character;
let characterMesh;
export let arm;
export let rocket;

let maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

// const getTexture = (path) => {
// 	let tex = new THREE.TextureLoader().load(path.toString());
// 	tex.anisotropy = maxAnisotropy;
// 	return tex;
// }

export let textureLoadingProgress = 0;
let arrProgress = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];

const getTexture = (path, index) => {
	let tex = new THREE.TextureLoader().load(path.toString(), function(){
		arrProgress[index] = 1;
	});
	tex.generateMipmaps = false;
	return tex;
}


const getMesh = (geom, mat) => {
	return new THREE.Mesh(geom, mat);
}

export const getMaterial = (image) => {
	image.anisotropy = maxAnisotropy;
	let mat = new THREE.MeshBasicMaterial({map: image, side: THREE.FrontSide});
	mat.transparent = true;
	mat.opacity = 1;
	return mat;
}


//Neon Signs
let bigGeom = new THREE.PlaneGeometry(4,16,32);
let cokeGeom = new THREE.PlaneGeometry(4,16,32);
let neonGeom = new THREE.PlaneGeometry(4,16,32);
let scrollGeom = new THREE.PlaneGeometry(4,16,32);
let sideGeom = new THREE.PlaneGeometry(4,16,32);
let sushiGeom = new THREE.PlaneGeometry(18,6,32);
let faceGeom = new THREE.PlaneGeometry(8,8,32);
let hotelGeom = new THREE.PlaneGeometry(40, 20,32);

const Sign = function(images, x, y) {
	this.images = images;
	this.val = 0;
	this.x = x;
	this.y = y;
	this.updateProp = function(){
		let pos = this.images[this.val].position;
		scene.remove(this.images[this.val]);
		this.val++;
		if (this.val == this.images.length){
			this.val = 0;
		}
		this.images[this.val].position.copy(pos);
		scene.add(this.images[this.val]);
	}
}

const bannerBig = (x, y) => {return new Sign([
	getMesh(bigGeom, getMaterial(getTexture(require('../pics/props/banner-big/banner-big-1.png').default))),
	getMesh(bigGeom, getMaterial(getTexture(require('../pics/props/banner-big/banner-big-2.png').default))),
	getMesh(bigGeom, getMaterial(getTexture(require('../pics/props/banner-big/banner-big-3.png').default))),
	getMesh(bigGeom, getMaterial(getTexture(require('../pics/props/banner-big/banner-big-4.png').default)))
	], x, y);}

const bannerCoke = (x, y) => {return new Sign([
	getMesh(cokeGeom, getMaterial(getTexture(require('../pics/props/banner-coke/banner-coke-1.png').default))),
	getMesh(cokeGeom, getMaterial(getTexture(require('../pics/props/banner-coke/banner-coke-2.png').default))),
	getMesh(cokeGeom, getMaterial(getTexture(require('../pics/props/banner-coke/banner-coke-3.png').default)))
	], x, y);}

const bannerNeon = (x, y) => {return new Sign([
	getMesh(neonGeom, getMaterial(getTexture(require('../pics/props/banner-neon/banner-neon-1.png').default))),
	getMesh(neonGeom, getMaterial(getTexture(require('../pics/props/banner-neon/banner-neon-2.png').default))),
	getMesh(neonGeom, getMaterial(getTexture(require('../pics/props/banner-neon/banner-neon-3.png').default))),
	getMesh(neonGeom, getMaterial(getTexture(require('../pics/props/banner-neon/banner-neon-4.png').default)))
	], x, y);}

const bannerScroll = (x, y) => {return new Sign([
	getMesh(scrollGeom, getMaterial(getTexture(require('../pics/props/banner-scroll/banner-scroll-1.png').default))),
	getMesh(scrollGeom, getMaterial(getTexture(require('../pics/props/banner-scroll/banner-scroll-2.png').default))),
	getMesh(scrollGeom, getMaterial(getTexture(require('../pics/props/banner-scroll/banner-scroll-3.png').default))),
	getMesh(scrollGeom, getMaterial(getTexture(require('../pics/props/banner-scroll/banner-scroll-4.png').default)))
	], x, y);}

const bannerSide = (x, y) => {return new Sign([
	getMesh(sideGeom, getMaterial(getTexture(require('../pics/props/banner-side/banner-side-1.png').default))),
	getMesh(sideGeom, getMaterial(getTexture(require('../pics/props/banner-side/banner-side-2.png').default))),
	getMesh(sideGeom, getMaterial(getTexture(require('../pics/props/banner-side/banner-side-3.png').default))),
	getMesh(sideGeom, getMaterial(getTexture(require('../pics/props/banner-side/banner-side-4.png').default)))
	], x, y);}

const bannerSushi = (x, y) => {return new Sign( [
	getMesh(sushiGeom, getMaterial(getTexture(require('../pics/props/banner-sushi/banner-sushi-1.png').default))),
	getMesh(sushiGeom, getMaterial(getTexture(require('../pics/props/banner-sushi/banner-sushi-2.png').default))),
	getMesh(sushiGeom, getMaterial(getTexture(require('../pics/props/banner-sushi/banner-sushi-3.png').default)))
	], x, y);}

const monitorFace = (x, y) => {return new Sign([
	getMesh(faceGeom, getMaterial(getTexture(require('../pics/props/monitorface/monitor-face-1.png').default))),
	getMesh(faceGeom, getMaterial(getTexture(require('../pics/props/monitorface/monitor-face-2.png').default))),
	getMesh(faceGeom, getMaterial(getTexture(require('../pics/props/monitorface/monitor-face-3.png').default))),
	getMesh(faceGeom, getMaterial(getTexture(require('../pics/props/monitorface/monitor-face-4.png').default)))
	], x, y);}

let hotelSign = getMesh(hotelGeom, getMaterial(getTexture(require('../pics/props/hotel-sign.png').default)));

const getAircon = () => {
	let geom = new THREE.PlaneGeometry(8,8,32);
	let mesh = getMesh(geom, getMaterial(getTexture(require('../pics/buildings/airConditioner.png').default)));
	let obj = getMesh(new THREE.PlaneGeometry(7, 7, 23), new THREE.MeshBasicMaterial({color:0x000000, side: THREE.FrontSide}));
	obj.material.opacity = 0;
	let ac = {
		mesh: mesh,
		obj: obj
	}
	return ac;
}

let props = [
bannerBig(-75, -10),
bannerCoke(25, -24),
bannerScroll(-50, -25),
bannerSushi(48, -50),
bannerSide(100, -24),
monitorFace(220, -15),
monitorFace(-40, -35),
bannerSide(50, -15),
bannerSushi(80, -50),
bannerScroll(150, -35),
bannerCoke(-170, -10),
bannerBig(200, -30),
bannerSushi(18, -13)
];

// let props = [
// bannerSushi(130, -13)
// ];

// let props = [];

//Buttons
let buttonGeom = new THREE.PlaneGeometry(50, 10);
let titleGeom = new THREE.PlaneGeometry(50, 50);
let tick = require('../sounds/tick.ogg');
let backButtonUpTex = getTexture(require('../pics/backButtonUp.png').default);
let backButtonDownTex = getTexture(require('../pics/backButtonDown.png').default);
let backButtonUpHoverTex = getTexture(require('../pics/backButtonUpHover.png').default);
let resumeButtonUpTex = getTexture(require('../pics/resumeButtonUp.png').default);
let resumeButtonDownTex = getTexture(require('../pics/resumeButtonDown.png').default);
let resumeButtonUpHoverTex = getTexture(require('../pics/resumeButtonUpHover.png').default);
let restartButtonUpTex = getTexture(require('../pics/restartButtonUp.png').default);
let restartButtonUpHoverTex = getTexture(require('../pics/restartButtonUpHover.png').default);
let restartButtonDownTex = getTexture(require('../pics/restartButtonDown.png').default);
let mainMenuButtonUpTex = getTexture(require('../pics/mainMenuButtonUp.png').default);
let mainMenuButtonUpHoverTex = getTexture(require('../pics/mainMenuButtonUpHover.png').default);
let mainMenuButtonDownTex = getTexture(require('../pics/mainMenuButtonDown.png').default);
let instructionsUpTex = getTexture(require('../pics/instructionsButtonUp.png').default);
let instructionsUpHoverTex = getTexture(require('../pics/instructionsButtonUpHover.png').default);
let instructionsDownTex = getTexture(require('../pics/instructionsButtonDown.png').default);
let startGameUpTex = getTexture(require('../pics/startGameButtonUp.png').default);
let startGameUpHoverTex = getTexture(require('../pics/startGameButtonUpHover.png').default);
let startGameDownTex = getTexture(require('../pics/startGameButtonDown.png').default);
let creditsUpTex = getTexture(require('../pics/creditsButtonUp.png').default);
let creditsUpHoverTex = getTexture(require('../pics/creditsButtonUpHover.png').default);
let creditsDownTex = getTexture(require('../pics/creditsButtonDown.png').default);
let hsUpTex = getTexture(require('../pics/hsButtonUp.png').default);
let hsUpHoverTex = getTexture(require('../pics/hsButtonUpHover.png').default);
let hsDownTex = getTexture(require('../pics/hsButtonDown.png').default);

export let buttons = [
	new Button(backButtonUpTex, backButtonDownTex, backButtonUpHoverTex, tick, 0,-36,3),
	new Button(resumeButtonUpTex, resumeButtonDownTex, resumeButtonUpHoverTex, tick, 0, 11,3),
	new Button(mainMenuButtonUpTex, mainMenuButtonDownTex, mainMenuButtonUpHoverTex, tick, 0,-7,3),
	new Button(restartButtonUpTex, restartButtonDownTex, restartButtonUpHoverTex, tick, 0,-7,3),
	new Button(instructionsUpTex, instructionsDownTex, instructionsUpHoverTex, tick, 30, 5 ,3),
	new Button(startGameUpTex, startGameDownTex, startGameUpHoverTex, tick, 30, 15 ,3),
	new Button(creditsUpTex, creditsDownTex, creditsUpHoverTex, tick, 30,-5,3),
	new Button(hsUpTex, hsDownTex, hsUpHoverTex, tick, 30, -15, 3 )
];

export let backButton = buttons[0];
export let resumeButton = buttons[1];
export let mainMenuButton = buttons[2];
export let restartButton = buttons[3];
export let instructionsButton = buttons[4];
export let startGameButton = buttons[5];
export let creditsButton = buttons[6];
export let highscoresButton = buttons[7];

export let mainMenuButtons = [startGameButton, instructionsButton, creditsButton, highscoresButton];
export let gameOverButtons = [restartButton, mainMenuButton];
export let pauseButtons = [resumeButton, restartButton, mainMenuButton];

export let pauseBackground;
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
export let heliGrappled;
export let heliGrappledSpr;
export let crashedHeliSpr;
export let parachuteTex = getTexture(require('../pics/parachute.png').default);
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

    // load a sound and set it as the Audio object's buffer
    var audioLoader = new THREE.AudioLoader();
    audioLoader.load( src, function(buffer){
        audioObj.setBuffer( buffer );
        if (!loop)
            audioObj.setLoop( false );
        else audioObj.setLoop(true);
        audioObj.setVolume( 0.5 );
    });
    return audioObj;
}

//Character Sounds
// let footstepsFile = require('../sounds/footsteps.ogg');
// let footsteps;
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
		name: null
	}
	sheet.tex = sprite;
	sheet.tex.repeat.set( 1/d, 1);
	sheet.tex.needsUpdate = true;
	sheet.tex.wrapS = sheet.tex.wrapT - THREE.RepeatWrapping;
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
let parachuteArray = [0.018, .0489, .0801, .1114, .1423, .1730, .2043, .2352, .2667, .3061, .3454, .3829, .422, .4621, .5050, 
	.5530, .6132, .6685, .7156, .7587, .7992, .8327, .8589, .888, .9131, .9374];
let parachuteOffset = 0.019;
// let parachuteDownOffset = 0.04;


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
	} else if (crashed == 'crashed' || crashed == 'grappled') {
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
	} else if (crashed == 'parachuteDown'){
		if (sprite.newVal < 9) sprite.newVal = 9;
		if (sprite.newVal == 26){
			scene.remove(sprite.spr);
			return 'done';
		} else {
			sprite.tex.offset.x = parachuteArray[sprite.newVal] - parachuteOffset;
			sprite.newVal++;
		}
	} else if (crashed == 'parachuteFalling'){
		if (sprite.newVal == 9){
			sprite.newVal = 0;
			sprite.tex.offset.x = parachuteArray[sprite.newVal] - parachuteOffset;
			sprite.newVal++;
		} else {
			sprite.tex.offset.x = parachuteArray[sprite.newVal] - parachuteOffset;
			sprite.newVal++;
		}
	} 

}

//Background
// let foreground;
let mdForeground;
let background;
let farBackground;
let tintMesh;

export const getCrashedHeli = () => {
	let spr = new spriteSheet(crashedHeliSpr, 0, 1, 8, 40, 20);
	spr.name = 'crashed';
	return spr;
}

export const getGrappledHeli = () => {
	let spr = new spriteSheet( heliGrappledSpr , 0, 1, 8, 40, 20);
	spr.name = 'grappled';
	return spr;
}

export const getExplosion = (scale) => {
	return new spriteSheet(explosionSpr, 0, 1, 12, scale, scale, 'explosion');
}

export const getBulletHit = (scale) => {
	return new spriteSheet(bulletHitSpr, 0, 1, 5, scale, scale, 'bulletHit');
}

export const getParachute = (scale) => {
	let p = new spriteSheet( parachuteTex, 0, 1, 26, 12, 15);
	p.name = 'parachuteFalling';
	return p;
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
	// scene.add(mesh);
	return mesh;
}

let titleTex = getTexture(require('../pics/title.png').default);
let title = new THREE.Mesh(titleGeom, getMaterial(titleTex));
export let highscoreText;

export const mainMenu = () => {
	camera.position.x = 0;
	scene.remove.apply(scene, scene.children);
	character = null;
	//Background
	scene.add(mdForeground);
	scene.add(background);
	scene.add(farBackground);
	scene.add(tintMesh);
	tintMesh.position.z = 4;

	instructionsButton.getMesh();
	startGameButton.getMesh();
	creditsButton.getMesh();
	highscoresButton.getMesh();
	title.position.x = -30;
	title.position.y = 0;
	title.position.z = 4;
	scene.add(title);

	if (highscoreText)
        highscoreText.style.display = 'none';
    highscoreText = document.createElement('div');
    highscoreText.id = 'highscore';
    highscoreText.style.position = 'absolute';
    highscoreText.style.width = 'auto';
    highscoreText.style.height = 5 + '%';
    highscoreText.style.fontSize = window.innerHeight / 22 + 'px';
    highscoreText.style.backgroundColor = 'rgba(255,0,0,.5)';
    highscoreText.style.borderRadius = window.innerHeight/20 + 'px';
    highscoreText.style.paddingLeft = window.innerHeight/78 + 'px';
    highscoreText.style.paddingRight = window.innerHeight/78 + 'px';
    highscoreText.innerHTML = "Highscore: " + highscore;
    highscoreText.style.top = window.innerHeight / 23 + 'px';
    highscoreText.style.left = window.innerWidth - windowOffset - window.innerHeight/2 + 'px';
    document.body.appendChild(highscoreText);

}

export const pause = () => {
	if (gameStatus == 'play'){
	    let pauseGeom = new THREE.PlaneGeometry( 60, 60, 32);
	    let pauseMat = new THREE.MeshBasicMaterial({color: 0x000000, side: THREE.FrontSide});
	    pauseMat.transparent = true;
	    pauseMat.opacity = .6;
	    pauseBackground = new THREE.Mesh(pauseGeom, pauseMat);
	    scene.add(pauseBackground);

	    resumeButton.getMesh(character.mesh.position.x, 11, 3);
	    restartButton.getMesh(character.mesh.position.x, 0, 3);
		mainMenuButton.getMesh(character.mesh.position.x, -11, 3);
	    
	    pauseBackground.position.x = character.mesh.position.x;
	}
}

export let updateProps = () => {
	for (var i = 0; i < props.length; i++) {
		props[i].updateProp();
	}
}

export const resume = () => {
	scene.remove(resumeButton.currentMesh);
	scene.remove(resumeButton.upMesh);
	scene.remove(resumeButton.upHighMesh);
	scene.remove(resumeButton.downMesh);
	scene.remove(pauseBackground);
	scene.remove(mainMenuButton.currentMesh);
	scene.remove(mainMenuButton.upMesh);
	scene.remove(mainMenuButton.upHighMesh);
	scene.remove(mainMenuButton.downMesh);
	scene.remove(restartButton.currentMesh);
	scene.remove(restartButton.upMesh);
	scene.remove(restartButton.downMesh);
	scene.remove(restartButton.upHighMesh);
}

let arrowKeysFile = require('../pics/instructions.png').default;
let arrowKeysImage;

export let newHighscore;
let inputBar;
let submitButton;
let header;

export const showGameOverButtons = () => {
    restartButton.getMesh(character.mesh.position.x - 23, -7, 3);
    mainMenuButton.getMesh(character.mesh.position.x + 23, -7, 3);
    if (heliCount > highscore){
    	setCookie('data', heliCount, 60);
    	checkCookie('data');
	    if (newHighscore)
	        document.body.removeChild(document.getElementById('highscoreDiv'));
	    newHighscore = document.createElement('div');
	    inputBar = document.createElement('input');
	    submitButton = document.createElement('button');
	    header = document.createElement('h3');
	    inputBar.type = 'text';
	    inputBar.name = 'submit';
	    inputBar.id = 'nameInput';
	    header.id = 'header';
	    inputBar.placeholder = 'Your Name';
	    inputBar.maxLength = 15;
	    submitButton.innerHTML = 'Submit Highscore &#x1F30E';
	    submitButton.id = 'submitButton';
	    newHighscore.id = 'highscoreDiv';
	    newHighscore.style.position = 'absolute';
	    //newHighscore.style.zIndex = 1;    // if you still don't see the label, try uncommenting this
	    newHighscore.style.width = window.innerHeight/25 + '%';
	    newHighscore.style.backgroundColor = 'rgba(255,0,0,.5)';
	    newHighscore.style.borderRadius = window.innerHeight/20 + 'px';
	    newHighscore.style.paddingLeft = window.innerHeight/78 + 'px';
	    newHighscore.style.paddingRight = window.innerHeight/78 + 'px';
	    header.innerHTML = "New Highscore!: " + heliCount;
	    newHighscore.style.top = 2 + 'px';
	    newHighscore.style.left = window.innerWidth - windowOffset - window.innerHeight/1.025 + 'px';
	    document.body.appendChild(newHighscore);
	    newHighscore.appendChild(header);
	    newHighscore.appendChild(inputBar);
	    newHighscore.appendChild(submitButton);
	   	submitButton.addEventListener('click', function(){
	   		let name = encodeHTML(document.getElementById('nameInput').value);
	   		if (name.length > 0){
				submitScore(name, heliCount);
				submitButton.style.display = 'none';
				inputBar.style.display = 'none';
				// header.style.margin: 'auto';
				let header2 = document.createElement('h4');
				header2.id = 'submittedMessage';
				header2.innerHTML = "Thank You, Score Submitted";
				newHighscore.appendChild(header2);
	   		} else alert('Name must be more than 0 characters');
	   		// alert('Thank you! Your highscore has been submitted');
	   	});

    }
}

function encodeHTML(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

export const instructions = () => {
	scene.remove.apply(scene, scene.children);

	//Background
	scene.add(mdForeground);
	scene.add(background);
	scene.add(farBackground);
	scene.add(tintMesh);
	tintMesh.position.z = 5;
	//

	let arrowKeysImageGeom = new THREE.PlaneGeometry( 70, 70, 32);
	let arrowKeysImageTex = getTexture(arrowKeysFile);
	let arrowKeysMat = getMaterial(arrowKeysImageTex);
	let arrowKeysImage = new THREE.Mesh(arrowKeysImageGeom, arrowKeysMat);
	arrowKeysImage.position.y = 5;
	scene.add(arrowKeysImage);
	// arrowKeysImage.position.x = -20;

	backButton.getMesh();
}


export const credits = () => {
	scene.remove.apply(scene, scene.children);
	//Background
	scene.add(mdForeground);
	scene.add(background);
	scene.add(farBackground);
	scene.add(tintMesh);
	tintMesh.position.z = 4;
	//
	let creditsGeom = new THREE.PlaneGeometry(60,60,32);
	let creditsTex = getTexture(require('../pics/credits.png').default);
	let creditsMat = getMaterial(creditsTex);
	let credits = new THREE.Mesh(creditsGeom, creditsMat);
	scene.add(credits);

	backButton.getMesh();

}

export const highscores = () => {
	scene.remove.apply(scene, scene.children);
	//Background
	scene.add(mdForeground);
	scene.add(background);
	scene.add(farBackground);
	scene.add(tintMesh);
	tintMesh.position.z = 4;
	//

	getScores();

	backButton.getMesh();
}

// let upMat = getMaterial(getTexture(require('../pics/backButtonUp.png').default));
// let upMat = getMaterial(getTexture(require('../pics/backButtonUp.png').default));
// let upMat = getMaterial(getTexture(require('../pics/backButtonUp.png').default));

function Button(up, down, high, tick, x, y, z) {
	this.getMaterial = function(image){
		image.anisotropy = maxAnisotropy;
		let mat = new THREE.MeshBasicMaterial({map: image, side: THREE.FrontSide});
		mat.transparent = true;
		mat.opacity = 1;
		return mat;
	}
	this.position = new THREE.Vector3(x,y,z);
	this.upMesh = new THREE.Mesh(buttonGeom, this.getMaterial(up));
	this.upHighMesh = new THREE.Mesh(buttonGeom, this.getMaterial(high));
	this.downMesh = new THREE.Mesh(buttonGeom, this.getMaterial(down));
	this.currentMesh = this.upMesh;
	this.highlighted = false;
	this.currentMesh.position.copy(this.position);
	this.upHighMesh.position.copy(this.position);
	this.downMesh.position.copy(this.downMesh);
	this.down = false;
	this.sound = tick;
	this.unhighlight = function(){
		if (this.highlighted){
			scene.add(this.upMesh);
			this.upMesh.position.copy(this.position);
			scene.remove(this.upHighMesh);
			this.currentMesh = this.upHighMesh;
			this.positionButton();
			this.highlighted = false;
		}
	};
	this.repositionButton = function(pos) {
		this.position = pos;
		this.positionButton();
	};
	this.highlight = function() {
		if (!this.highlighted){
			scene.add(this.upHighMesh);
			this.upHighMesh.position.copy(this.position);
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
		if (!this.down){
			scene.add(this.downMesh);
			this.downMesh.position.copy(this.position);
			scene.remove(this.upHighMesh);
			this.currentMesh = this.downMesh;
			this.positionButton();
			this.down = true;
		}
	};
	this.returnToUp = function(){
		scene.remove(this.currentMesh);
		scene.remove(this.upHighMesh);
		scene.add(this.upMesh);
		this.down = false;
		this.highlighted = false;
	}
	this.mouseUp = function(){
		this.highlighted = false;
		this.down = false;
		// console.log('back button up');
		// if (this.down){
		// 	playSound(tick);
		// 	// scene.add(this.upMesh);
		// 	// scene.remove(this.downMesh);
		// 	// this.currentMesh = this.downMesh;
		// 	// this.positionButton();
		// 	// this.down = true;
		// }
	};
	this.positionButton = function() {
		this.currentMesh.position.copy(this.position);
		this.upMesh.position.copy(this.position);
		this.downMesh.position.copy(this.position);
		this.upHighMesh.position.copy(this.position);
	};
	this.getMesh = function(x,y,z) {
		if (x != undefined && y != undefined)
			this.position = new THREE.Vector3(x, y, z);
		this.positionButton();
		let mesh;
		if (this.highlighted && !this.down) mesh = this.upHighMesh;
		else if (!this.highlighted) mesh = this.upMesh;
		else if (this.down) mesh = this.downMesh;
		// if (x) mesh.position.x = x;
		// if (y) mesh.position.y = y;
		// if (z) mesh.position.z = z;
		this.currentMesh = mesh;
		scene.add(this.currentMesh);
	};
}

export let pressEnter;

//Background
let bgGeom = new THREE.PlaneGeometry(192 * 10, 108, 32);
let bgGeom1 = new THREE.PlaneGeometry(384 * 10, 216, 32);
let bgGeom2 = new THREE.PlaneGeometry(800, 390, 32);
mdForeground = getBackgroundMesh( getTexture(require('../pics/buildings/near-buildings-bg.png').default) , -50, -10, bgGeom, 10 );
background = getBackgroundMesh( getTexture( require('../pics/buildings/buildings-bg.png').default) , -300, -50, bgGeom1, 10 );
farBackground = getBackgroundMesh( getTexture( require('../pics/buildings/skyline-d.png').default), -301, 10, bgGeom2, 1 );
let tintGeom = new THREE.PlaneGeometry(1000, 1000, 32);
let tintMat = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.FrontSide});
tintMat.transparent = true;
tintMat.opacity = .15;
tintMesh = new THREE.Mesh(tintGeom, tintMat);
tintMesh.position.z = 10;

export const startScreen = () => {
	scene.add(mdForeground);
	scene.add(background);
	scene.add(farBackground);
	title.position.x = 0;
	title.position.y = 10;
	title.position.z = 4;
	scene.add(title);
	let pressEnterGeom = new THREE.PlaneGeometry(60, 10, 32);
	let pressEnterMat = getMaterial(getTexture(require('../pics/pressEnter.png').default));
	pressEnter = getMesh(pressEnterGeom, pressEnterMat);
	pressEnter.position.y = -25;
	scene.add(pressEnter);
	scene.add(tintMesh);

}


export const restart = () => {
	character = {
		mesh: null,
		texture: null,
		sheet: null
	}
	scene.remove.apply(scene, scene.children);
	scene.add(mdForeground);
	scene.add(background);
	scene.add(farBackground);
	scene.add(tintMesh);
	scene.add( arm );
	character.sheet = jumpingRight;
	character.texture = character.sheet.spr;
	character.mesh = characterMesh;
	scene.add( character.texture );
	scene.add( character.mesh );

	for (var i = 0; i < props.length; i++) {
		scene.add(props[i].images[0]);
	}
	for (var i = 0; i < sceneryObjects.length; i++) {
		scene.add(sceneryObjects[i]);
	}
	for (var i = 0; i < railings.length; i++) {
		scene.add(railings[i]);
	}
}

let sceneryObjects = [];
let railings = [];

export const init = () => {
	character = {
		mesh: null,
		texture: null,
		sheet: null
	}


	//Background
	scene.add(mdForeground);
	scene.add(background);
	scene.add(farBackground);
	scene.add(tintMesh);
//
	// farBackground2 = getBackgroundMesh( getTexture( require('../pics/skyline-b')), -400.1, 40, false );
	//

	//Character sprites
	standingRight = new spriteSheet( getTexture(require('../pics/roboWalkingLarge.png').default) , 0, 1, 11, 10, 10);
	standingLeft = new spriteSheet( getTexture(require('../pics/roboWalkingLarge2.png').default) , 0, 1, 11, 10, 10);
	rightFoot = new spriteSheet( getTexture(require('../pics/roboWalkingLarge.png').default) , 0, 1, 11, 10, 10);
	leftFoot = new spriteSheet( getTexture(require('../pics/roboWalkingLarge2.png').default) , 0, 1, 11, 10, 10);
	jumpingRight = new spriteSheet( getTexture(require('../pics/roboJumping.png').default) , 0,1,11,10,10);
	jumpingLeft = new spriteSheet( getTexture(require('../pics/roboJumping2.png').default) , 0,1,11,10,10);
	//
	
	//Heli sprites
	heliFlying = new spriteSheet( getTexture(require('../pics/heli5.png').default) , 0, 1, 8, 40, 20, 'heliFlying');
	heliGrappled = new spriteSheet( getTexture(require('../pics/heli5.png').default) , 0, 1, 8, 40, 20, 'heliGrappled');
	heliGrappledSpr = getTexture(require('../pics/heli5.png').default);
	crashedHeliSpr = getTexture( require('../pics/crashedHeli.png').default);
	//

	//Arms
	armTex = getMaterial(new THREE.TextureLoader().load(require('../pics/roboArm.png').default));
	armTex3 = getMaterial(new THREE.TextureLoader().load(require('../pics/roboArm3.png').default));
	armTex2 = getMaterial(new THREE.TextureLoader().load(require('../pics/roboArm2.png').default));

	armTexLeft = getMaterial(new THREE.TextureLoader().load(require('../pics/roboArmLeft.png').default));
	armTex3Left = getMaterial(new THREE.TextureLoader().load(require('../pics/roboArm3Left.png').default));
	armTex2Left = getMaterial(new THREE.TextureLoader().load(require('../pics/roboArm2Left.png').default));

	let materials = [
		new THREE.MeshBasicMaterial({color: 0x000000, side: THREE.DoubleSide}),
		new THREE.MeshBasicMaterial({color: 0x000000, side: THREE.DoubleSide}),
		new THREE.MeshBasicMaterial({color: 0x000000, side: THREE.DoubleSide}),
		armTex,
		new THREE.MeshBasicMaterial({color: 0x000000, side: THREE.DoubleSide}),
		new THREE.MeshBasicMaterial({color: 0x000000, side: THREE.DoubleSide})
	];

	for (var i = 0; i < materials.length; i++) {
		materials[i].transparent = true;
		materials[i].opacity = 0;
	}
	materials[3].opacity = 1;
	arm = new THREE.Mesh( new THREE.BoxGeometry( 1.5, 0, 5 ), materials );// 12px * 50px, 4.16:1
	arm.up = new THREE.Vector3(0,0,-1);
	//

	//Rockets
	rocketTex = getMaterial(new THREE.TextureLoader().load(require('../pics/rocketTex.png').default));
	rocketTex.anisotropy = maxAnisotropy;
	rocketTex2 = getMaterial(new THREE.TextureLoader().load(require('../pics/rocketTex2.png').default));
	rocketTex2.anisotropy = maxAnisotropy;
	let geometry = new THREE.PlaneGeometry(4, 4, 32);
	rocket = new THREE.Mesh(geometry, rocketTex);
	//

	//Explosion
	explosionSpr = getTexture( require('../pics/Explosion.png' ));
	//

	//Bullet hit explosion
	bulletHitSpr = getTexture( require('../pics/bulletHit.png' ));
	//



	// const directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
	// directionalLight.position.set( 1, 1, 0 );
	// scene.add(directionalLight);

	// const ambientLight = new THREE.AmbientLight( 0xcccccc, 1 );
	// scene.add(ambientLight);

	//Character mesh
	character.sheet = jumpingRight;
	character.texture = character.sheet.spr;
	let geometry2 = new THREE.PlaneGeometry( 3.5, 7, 32);
	let material2 = new THREE.MeshBasicMaterial( {color: 0x000000, side: THREE.FrontSide} );
	material2.transparent = true;
	material2.opacity = 0;
	characterMesh =  new THREE.Mesh( geometry2, material2);
	character.mesh = characterMesh;
	//


	//Floor
	let sceneryX = [-50, -0,   50, 100 , 150,  200];
	let sceneryY = [-35, -45, -25, -35,  -45,  -38];
	//-50,  0, 50, 100,150,200 
	//-30,-40,-25, -30,-40,-30
	//   10  15   5    10  10
	// let airCon = getAircon();
	// airCon.mesh.position.x = airCon.obj.position.x = 20;
	// airCon.mesh.position.y = airCon.obj.position.y = -18;
	// airCon.mesh.position.z = 1;
	// scene.add(airCon.mesh);
	// // scene.add(airCon.obj);
	// objects.push(airCon.obj);

	for (var i = 0; i < sceneryX.length; i++) {
		let geometry = new THREE.PlaneGeometry( 50, 40, 32 );
		let floorTex;
		if (Math.random() < .5){
			floorTex = new THREE.TextureLoader().load(require('../pics/buildings/building1.png').default);
		} else {
			floorTex = new THREE.TextureLoader().load(require('../pics/buildings/building2.png').default);
		}
		if (Math.random() < .5){
			let railingTex = new THREE.TextureLoader().load(require('../pics/rail.png').default);
			let material = new THREE.MeshBasicMaterial( {map: railingTex, side: THREE.FrontSide} );
			material.transparent = true;
			material.opacity = 1;
			let rail = new THREE.Mesh( geometry, material );
			scene.add( rail );
			rail.position.x = sceneryX[i];
			rail.position.y = sceneryY[i] + geometry.parameters.height;
			rail.position.z = -.1;
			railings.push(rail);
			// objects.push(rail);
		}
		let material = new THREE.MeshBasicMaterial( {map: floorTex, side: THREE.FrontSide} );
		material.transparent = true;
		material.opacity = 1;
		let ground = new THREE.Mesh( geometry, material );
		ground.position.x = sceneryX[i];
		ground.position.y = sceneryY[i];
		objects.push(ground);
		sceneryObjects.push(ground);
	}
	for (var i = 0; i < props.length; i++) {
		let mesh = props[i].images[0];
		mesh.position.x = props[i].x;
		mesh.position.y = props[i].y;
		mesh.position.z = 1;
		objects.push(mesh);

	}
	scene.add(hotelSign);
	hotelSign.position.x = 180;
	hotelSign.position.y = -15;
	hotelSign.position.z = -.05;
	//
	//Footsteps sound
	// footsteps = getSound(footstepsFile, new THREE.Audio(listener) , false);
	//

}

export const moveCharacter = (x, y) => {
	character.mesh.position.x = x;
	character.mesh.position.y = y;

	// character.texture.position.x = character.mesh.position.x;
	// character.texture.position.y = character.mesh.position.y;
}

export const walk = (dir) => {
	// if (footsteps.isPlaying == false && !mute){
	// 	footsteps.play();
	// }
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
	// footsteps.pause();
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
	// footsteps.pause();
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