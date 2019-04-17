import * as THREE from 'three';
import { camera, renderer, scene, init, character, objects } from "./Initialize.js";

export const checkCollisions = (objects, character) => {
	let collisions = [];
	for (let i = 0; i < objects.length; i++) {
		let col = checkBoundingBoxes(objects[i], character);
		if (col != 'none'){
		collisions.push(col);
		}
	}
	return collisions;
}

export const checkBoundingBoxes = (a, b) => {
	let r1 = {
		x: a.position.x - a.geometry.parameters.width/2,
		y: a.position.y - a.geometry.parameters.height/2,
		w: a.geometry.parameters.width,
		h: a.geometry.parameters.height
	};
	let r2 = {
		x: b.position.x - b.geometry.parameters.width/2,
		y: b.position.y - b.geometry.parameters.height/2,
		w: b.geometry.parameters.width,
		h: b.geometry.parameters.height
	};

	let dx=(r1.x+r1.w/2)-(r2.x+r2.w/2);
    let dy=(r1.y+r1.h/2)-(r2.y+r2.h/2);
    let width=(r1.w+r2.w)/2;
    let height=(r1.h+r2.h)/2;
    let crossWidth=width*dy;
    let crossHeight=height*dx;
    let collision='none';
    //
    if(Math.abs(dx)<=width && Math.abs(dy)<=height){
        if(crossWidth>crossHeight){
           	if (crossWidth > (-crossHeight)){
           		collision = 'bottom';
           	} else {
           		collision = 'right';
           	}
       } else {
            if (crossWidth > (-crossHeight)){
            	collision = 'left';
            } else {
            	collision = 'top';
            }
        }
    }
    return collision;

	// let aP = a.position;
	// let bP = b.position;
	// let aWidth = a.geometry.parameters.width;
	// let aHeight = a.geometry.parameters.height;
	// let bWidth = b.geometry.parameters.width;
	// let bHeight = b.geometry.parameters.height;
	// let aXmin = aP.x - aWidth/2;
	// let aXmax = aP.x + aWidth/2;
	// let aYmin = aP.y - aHeight/2;
	// let aYmax = aP.y + aHeight/2;
	// let bXmin = bP.x - bWidth/2;
	// let bXmax = bP.x + bWidth/2;
	// let bYmin = bP.y - bHeight/2;
	// let bYmax = bP.y + bHeight/2;

	// if (aXmin < bXmax && aYmin < bYmax){ //bottom left corner a, top right b

	// } else if (aXmin < bXmax && aYmax > bYmin){
		
	// }

	// if (aXmin > bXmax) return false; // a is left of b
	// if (aXmax < bXmin) return false; // a is right of b
	// if (aYmax < bYmin) return false; // a is below 
	// if (aYmin > bYmax) return false; // a is above



	// return true; // boxes overlap
}

export const collisionResolution = (direction, pos, xVel, yVel) => {
	let div = .9;
	while (checkBoundingBoxes != 'none' && div > 0){
		pos -= xVel;
		pos -= yVel;
		pos += xVel * div;
		pos += yVel * div;
		div -= .1;
	}
}

export const checkBulletCollision = (a, b) => {
	let aP = a.position;
	let bP = b.position;
	let aWidth = a.geometry.parameters.width;
	let aHeight = a.geometry.parameters.height;
	let bWidth = b.geometry.parameters.width;
	let bHeight = b.geometry.parameters.height;
	let aXmin = aP.x - aWidth/2;
	let aXmax = aP.x + aWidth/2;
	let aYmin = aP.y - aHeight/2;
	let aYmax = aP.y + aHeight/2;
	let bXmin = bP.x - bWidth/2;
	let bXmax = bP.x + bWidth/2;
	let bYmin = bP.y - bHeight/2;
	let bYmax = bP.y + bHeight/2;

	if (aXmin > bXmax) return false; // a is left of b
	if (aXmax < bXmin) return false; // a is right of b
	if (aYmax < bYmin) return false; // a is below 
	if (aYmin > bYmax) return false; // a is above

	return true; // boxes overlap
}