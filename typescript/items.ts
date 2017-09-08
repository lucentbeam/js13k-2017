/// <reference path="config.ts" />

class Item
{
    name : string;
    description : string[] = [];
    sprite : HTMLCanvasElement;
    constructor(public x : number, public y: number) {}
    at(x : number, y : number) { return this.x == x && this.y == y }
    got(player : Player) {}
}

class Shield extends Item
{
    sprite : HTMLCanvasElement = shieldSprite;
    name = "SHIELD GENERATOR";
    description = ["This small generator produces a", "shield that can absorb enemy attacks.", "Move around to charge it up!"];
    got(player : Player) { player.hasShield = true; player.shieldSteps = 0; }
}

class Ring extends Item
{
    sprite : HTMLCanvasElement = ringSprite;
    name = "GEMINI RING";
    description = ["This ring splits the hyperdimensional", "sphere into a smaller and faster pair.", "Wild times ahead!"];
    got(player : Player) { splitBall(); }
}

class Cannon extends Item
{
    sprite : HTMLCanvasElement = cannonSprite;
    name = "HYPER CANNON";
    description = ["This powerful cannon has twice as", "many dimensions as your old one.", "Come get some!"];
    got(player : Player) { player.hasCannon = true; }
}

class Heart extends Item
{
    sprite : HTMLCanvasElement = heartSprites[0];
    got(player : Player) { player.life++; }
}

var lastItem : Item;

function acquireItem(item : Item) {
    lastItem = item;
    showDialogue = true;
}

function drawDialogue() {
    overlay("#000000",0.55);
    context.fillRect(3.5*pixelsPerWorldUnit,5.75*pixelsPerWorldUnit,(gridSize-7)*pixelsPerWorldUnit,(gridSize-13.75)*pixelsPerWorldUnit);
    context.font = ""+(pixelsPerWorldUnit)+"px Garamond";
    fill(bg);
    context.textAlign = "left";
    context.fillText(lastItem.name, 4.25*pixelsPerWorldUnit, 7.25*pixelsPerWorldUnit);
    context.font = ""+(5.5*scale)+"px Garamond";
    lastItem.description.forEach((line, index) => {
        context.fillText(line, 4.25*pixelsPerWorldUnit, (9+index)*pixelsPerWorldUnit);
    })

    drawSprite(lastItem.sprite, gridSize-5.25, 6.4, true);
    context.fillRect(4.25*pixelsPerWorldUnit,7.75*pixelsPerWorldUnit,(gridSize-8.8)*pixelsPerWorldUnit,0.5*scale);
}

function drawEndDialogue() {
    overlay("#000000",0.55);
    context.fillRect(3.5*pixelsPerWorldUnit,7.25*pixelsPerWorldUnit,(gridSize-7)*pixelsPerWorldUnit,(gridSize-16.9)*pixelsPerWorldUnit);
    context.font = ""+(pixelsPerWorldUnit)+"px Garamond";
    fill(bg);
    context.textAlign = "center";
    context.fillText("-     EXIT ACTIVATED     -", (gridSize/2)*pixelsPerWorldUnit, (gridSize/2-0.9)*pixelsPerWorldUnit);
    context.fillRect(4.45*pixelsPerWorldUnit,7.75*pixelsPerWorldUnit,(gridSize-8.8)*pixelsPerWorldUnit,0.5*scale);
    context.fillRect(4.45*pixelsPerWorldUnit,9.75*pixelsPerWorldUnit,(gridSize-8.8)*pixelsPerWorldUnit,0.5*scale);
}