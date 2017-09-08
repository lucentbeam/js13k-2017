
// global variables
var canvas : HTMLCanvasElement = <HTMLCanvasElement>document.getElementById("game");
var context : CanvasRenderingContext2D = canvas.getContext("2d");
var scale : number = canvas.width / 160;
var pixelsPerWorldUnit : number = scale*8;
var gridSize = 160/8;
var physicsStepsPerLoop = 20;
var mapSize = 7;
var mapCenter = Math.floor(mapSize/2);
var globalMusicVolume = 0.5;
var zeroGain = 0.00001; // Low number for gain AudioNode. Another way for zero gains is not eating enough protein (bro)
var splitBall; // to be overriden in main
var gameover = false;
var gamewon = false;
var genericTimer = 0.0;
var showDialogue : boolean = false;
var showEndDialogue : boolean = false;
var paused = false;

// various utility functions
var listen = document.addEventListener;
var randomElement = lst => { return lst[Math.floor(Math.random()*lst.length)]; };
var randInt = num => { return Math.floor(Math.random()*num); };
var randRange = (bottom,top) => { return bottom+Math.floor(Math.random()*(top-bottom)); };

var repeat = (s,n) => {
    var base = s;
    for (var i = 0; i < n-1; i++) {
        s += base;
    }
    return s;
}

function calcNote(root, steps) {
    return root*Math.pow(1.059463094359,steps);
}

function pausePressed() {
    if (showDialogue) {
        showDialogue = false;
        if (showEndDialogue) {
            artyDrop();
        }
        return;
    } else if (showEndDialogue) {
        showEndDialogue = false;
        return;
    }
    paused = !paused
}

listen('keydown', e => {if (e.which == 32) {
    pausePressed();
}});

// canvas utility functions
context.imageSmoothingEnabled = false;
var fill = color => context.fillStyle = color
var font = sz => { context.font = ""+(sz*scale)+"px Palatino"; context.textAlign = "center"; }
var text = (str, x, y) => context.fillText(str,gridSize*x*pixelsPerWorldUnit,gridSize*y*pixelsPerWorldUnit);

var alphaWrap = (a,f) => {
    context.globalAlpha = a;
    f();
    context.globalAlpha = 1;
}

function drawSprite(sprite,x,y,over=false,s=1) {
    context.globalCompositeOperation = over ? "source-over" : "luminosity"
    var sz = [sprite.width/8, sprite.height/8]
    var offset = [(1-s)*sz[0]/2,(1-s)*sz[1]/2]
    context.drawImage(sprite, (x+offset[0])*pixelsPerWorldUnit, (y+offset[1])*pixelsPerWorldUnit, pixelsPerWorldUnit*sz[0]*s, pixelsPerWorldUnit*sz[1]*s);
}

function drawDot(x,y) {
    context.globalCompositeOperation = "luminosity"
    fill("#999999");
    context.fillRect(x*scale,y*scale,scale,scale);
}

function multiply(color : string, frac : number) {
    var out = "#";
    for (var i = 0; i < 3; i++) {
        var n = Math.floor(Math.min(parseInt("0x"+color[1+2*i]+color[2+2*i])*frac,255));
        out += (n < 16 ? "0" : "") + n.toString(16);
    }
    return out;
}

var imageSizes : {} = {
    64: 0,
    128: 1,
    2340: 2,
    360: 3,
    224: 4,
    270: 5
}
var imageCodes : any[][] = [[8,8,false],[8,16,true],[90,26,false],[45,8,false],[16,14,false],[15,18,false]] // width, height, mirrored?

function makeImage(code : string) : HTMLCanvasElement {
    var config = imageCodes[imageSizes[code.length]]
    var data : ImageData = context.createImageData(config[0],config[1]);
    for(var i=0; i < data.data.length; i++) {
        var index = Math.floor(i/4);
        var value = parseInt(code[index],16)*16;
        data.data[i]= (i+1)%4 == 0 ? value == 0 ? 0 : 255 : value;
    }
    var c = document.createElement("canvas");
    c.width = config[0] * (config[2] ? 2 : 1);
    c.height = config[1];
    var ctx = c.getContext("2d");
    if (config[2]) {
        ctx.putImageData(data,0,0);
        ctx.scale(-1,1);
        ctx.drawImage(c,-16,0);
        ctx.scale(1,1);
    }
    ctx.putImageData(data,0,0);
    return c;
}

function getRandomColor(color, choices="56789ABCDEF") {
    color += randomElement(choices);
    if (color.length < 7) {
        return getRandomColor(color,choices);
    }
    return color;
}

function clamp(val, min, max) {
    return Math.min(Math.max(val,min),max);
}

function overlay(color, alpha) {
    context.globalCompositeOperation = "source-over";
    context.globalAlpha = clamp(alpha,0,1);
    fill(color);
    context.fillRect(0,0,1024,1024);
    context.globalAlpha = 1;
}

function circle(color, x, y, width) {
    fill(color);
    context.globalCompositeOperation = "source-over";
    context.beginPath();
    context.arc(x*pixelsPerWorldUnit, y*pixelsPerWorldUnit, width*pixelsPerWorldUnit, 0, 2 * Math.PI);
    context.fill();
}

class Timer {
    time : number;
    constructor(public duration : number, public durationMin : number = duration, public durationMax : number = duration, public autoReset : boolean = true) {
        this.reset();
    }

    reset() {
        this.time = genericTimer;
        this.duration = randRange(this.durationMin,this.durationMax);
    }

    get progress() {
        return genericTimer-this.time;
    }

    check() : boolean {
        if (this.progress > this.duration) {
            if (this.autoReset) { this.reset(); }
            return true;
        }
        return false;
    }

    get remaining() : number { return this.duration * (1-this.fraction) }
    get fraction() : number { return Math.min((genericTimer-this.time)/this.duration, 1.0); }
}

function easeOutQuad(t) { return t*(2-t) }