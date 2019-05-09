import * as THREE from 'three';
import "../styles/components/loader.scss";
import { playerHealth, getMousePos } from "../app.js";



(function(){var script=document.createElement('script');script.onload=function(){var stats=new Stats();document.body.appendChild(stats.dom);requestAnimationFrame(function loop(){stats.update();requestAnimationFrame(loop)});};script.src='//rawgit.com/mrdoob/stats.js/master/build/stats.min.js';document.head.appendChild(script);})()

export let scene = new THREE.Scene();
export let renderer = new THREE.WebGLRenderer();

let width = window.innerWidth - 10;
let height = window.innerHeight - 10;
renderer.setSize( width, height );
document.body.appendChild( renderer.domElement );

export let camera = new THREE.PerspectiveCamera( 45, width / height, 0.1, 1000 );
scene.add( camera );

camera.position.z = 100;

// window.addEventListener('resize', () => {
// 	width = window.innerWidth - 10;
// 	height = window.innerHeight - 10;
// 	renderer.setSize(width, height);
// 	camera.aspect = width/height;
// 	camera.updateProjectionMatrix();
// });

export let objects = [];

export let character;
export let arm;
export let rocket;

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

const getSound = (src, loop) => {
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
        sound.setVolume( 0.5 );
    });
    return sound;
}

//Character Sounds
let footstepsFile = require('../sounds/footsteps.wav');
let footsteps = getSound(footstepsFile, true);
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
	let pos = character.mesh.position;

	farBackground.position.x = character.mesh.position;
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
	image.anisotropy = renderer.getMaxAnisotropy();
	let mat = new THREE.MeshBasicMaterial({map: image, side: THREE.FrontSide});
	mat.transparent = true;
	mat.opacity = 1;
	return mat;
}

//Background
let foreground;
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

const getBackgroundMesh = (tex, zPos, yPos) => {
	tex.anisotropy = renderer.getMaxAnisotropy();
	tex.wrapS = THREE.RepeatWrapping;
	tex.repeat.set(10,1);
	let mat = new THREE.MeshBasicMaterial({map: tex, side: THREE.FrontSide });
	mat.transparent = true;
	mat.opacity = 1;
	let bgGeom = new THREE.PlaneGeometry(192* 10, 108, 32);
	let mesh = new THREE.Mesh(bgGeom, mat);
	mesh.position.z = zPos;
	mesh.position.y = yPos;
	scene.add(mesh);
	return mesh;
}

export const init = () => {
	character = {
		mesh: null,
		texture: null,
		sheet: null
	}
	//Background
	let bgGeom = new THREE.PlaneGeometry(192* 10, 108, 32);
	let foregroundTex = new THREE.TextureLoader().load(require('../pics/layers/foreground.png'));
	let mdForegroundTex = new THREE.TextureLoader().load(require('../pics/layers/buildings.png'));
	let backgroundTex = new THREE.TextureLoader().load(require('../pics/layers/far-buildings.png'));
	let farBackgroundTex = new THREE.TextureLoader().load(require('../pics/layers/bg.png'));
	foreground = getBackgroundMesh( foregroundTex, -20, -20 );
	mdForeground = getBackgroundMesh( mdForegroundTex, -250, 20 );
	background = getBackgroundMesh( backgroundTex, -370, 40 );
	farBackground = getBackgroundMesh( farBackgroundTex, -400, 40 );
	//

	//Character sprites
	let standingRightSpr = new THREE.TextureLoader().load(require('../pics/roboWalkingLarge.png'));
	standingRightSpr.anisotropy = renderer.getMaxAnisotropy();
	standingRight = new spriteSheet(standingRightSpr, 0, 1, 11, 10, 10);
	let standingLeftSpr = new THREE.TextureLoader().load(require('../pics/roboWalkingLarge2.png'));
	standingLeftSpr.anisotropy = renderer.getMaxAnisotropy();
	standingLeft = new spriteSheet(standingLeftSpr, 0, 1, 11, 10, 10);
	let rightFootSpr = new THREE.TextureLoader().load(require('../pics/roboWalkingLarge.png'));
	rightFootSpr.anisotropy = renderer.getMaxAnisotropy();
	rightFoot = new spriteSheet(rightFootSpr, 0, 1, 11, 10, 10);
	let leftFootSpr = new THREE.TextureLoader().load(require('../pics/roboWalkingLarge2.png'));
	leftFootSpr.anisotropy = renderer.getMaxAnisotropy();
	leftFoot = new spriteSheet(leftFootSpr, 0, 1, 11, 10, 10);
	let jumpingRightSpr = new THREE.TextureLoader().load(require('../pics/roboJumping.png'));
	jumpingRightSpr.anisotropy = renderer.getMaxAnisotropy();
	jumpingRight = new spriteSheet(jumpingRightSpr, 0,1,11,10,10);
	let jumpingLeftSpr = new THREE.TextureLoader().load(require('../pics/roboJumping2.png'));
	jumpingLeftSpr.anisotropy = renderer.getMaxAnisotropy();
	jumpingLeft = new spriteSheet(jumpingLeftSpr, 0,1,11,10,10);
	//
	
	//Heli sprites
	let heliFlyingSpr = new THREE.TextureLoader().load(require('../pics/heli5.png'));
	heliFlyingSpr.anisotropy = renderer.getMaxAnisotropy();
	heliFlying = new spriteSheet(heliFlyingSpr, 0, 1, 8, 40, 20);

	crashedHeliSpr = new THREE.TextureLoader().load(require('../pics/crashedHeli.png'));
	heliFlyingSpr.anisotropy = renderer.getMaxAnisotropy();
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
	// arm = new THREE.Mesh( new THREE.BoxGeometry( 1.5, 0, 6.25 ), materials );// 12px * 50px, 4.16:1
	arm.up = new THREE.Vector3(0,0,-1);
	scene.add( arm );
	console.log(arm);
	//

	//Rockets
	rocketTex = getMaterial(new THREE.TextureLoader().load(require('../pics/rocketTex.png')));
	rocketTex.anisotropy = renderer.getMaxAnisotropy();
	rocketTex2 = getMaterial(new THREE.TextureLoader().load(require('../pics/rocketTex2.png')));
	rocketTex2.anisotropy = renderer.getMaxAnisotropy();
	let geometry = new THREE.PlaneGeometry(4, 4, 32);
	rocket = new THREE.Mesh(geometry, rocketTex);
	// rocket.up = new THREE.Vector3(0,0,-1);
	//

	//Explosion
	explosionSpr = new THREE.TextureLoader().load(require('../pics/explosion.png'));
	explosionSpr.anisotropy = renderer.getMaxAnisotropy();
	//

	//Bullet hit explosion
	bulletHitSpr = new THREE.TextureLoader().load(require('../pics/bulletHit.png'));
	bulletHitSpr.anisotropy = renderer.getMaxAnisotropy();
	//


	const directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
	directionalLight.position.set( 1, 1, 0 );
	scene.add(directionalLight);

	const ambientLight = new THREE.AmbientLight( 0xcccccc, 1 );
	scene.add(ambientLight);

	//Character mesh
	character.sheet = standingRight;
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
		let floorTex = new THREE.TextureLoader().load(require('../pics/floor.png'));
		floorTex.wrapS = THREE.RepeatWrapping;
		floorTex.wrapT = THREE.RepeatWrapping;
		floorTex.repeat.set( 4, 2 );
		let material = new THREE.MeshBasicMaterial( {map: floorTex, side: THREE.DoubleSide} );
		let ground = new THREE.Mesh( geometry, material );
		scene.add( ground );
		ground.position.x = sceneryX[i];
		ground.position.y = sceneryY[i];
		objects.push(ground);
	}
	//

}

export const moveCharacter = (x, y) => {
	character.mesh.position.x = x;
	character.mesh.position.y = y;

	// character.texture.position.x = character.mesh.position.x;
	// character.texture.position.y = character.mesh.position.y;
}

export const walk = (dir) => {
	footsteps.play();
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