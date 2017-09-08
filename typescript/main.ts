/// <reference path="config.ts" />
/// <reference path="keys.ts" />
/// <reference path="collisions.ts" />
/// <reference path="entities.ts" />
/// <reference path="rooms.ts" />
/// <reference path="music.ts" />
/// <reference path="sfx.ts" />
/// <reference path="ui.ts" />
/// <reference path="title.ts" />

var balls : Ball[] = [new Ball()];

var mouseDown = 0;
listen('mousedown', e => ++mouseDown);
listen('mouseup', e => --mouseDown);

class Player extends GameEntity {
    get lasing() : boolean { return mouseDown>0 || gamepad.right.x != 0 || gamepad.right.y != 0; }
    laserTo : Line[] = [new Line(this.x, this.y, this.x, this.y)]
    lastLaser : vector = {x: 0, y: 0}
    nextLaser : vector = {x: 0, y: 0}
    currentLaserStep : number = 0;
    moveTime : number;
    _moving : boolean = false;
    stunTimer : Timer = new Timer(0, 0.05, 0.05, false,);
    _life : number;
    lifeMax : number = 5;
    hasShield : boolean = false;
    shieldSteps : number = 0;
    hasCannon : boolean = false;
    usingGamepad : boolean = false;

    get life() : number { return this._life; }
    set life(val) { this._life = Math.min(Math.max(val,0),this.lifeMax); }

    get shieldCharged() : boolean { return this.shieldSteps > 50; }

    set moving(value : boolean) {
        if (value && !this._moving) {
            this.moveTime = performance.now();
        }
        this._moving = value;
    }

    constructor() {
        super();
        this.reset();
        listen('mousemove', e=> {
            this.usingGamepad = false;
            var rect = canvas.getBoundingClientRect();
            this.nextLaser.x = (e.clientX - rect.left)/rect.width*gridSize;
            this.nextLaser.y = (e.clientY - rect.top)/rect.width*gridSize;
            this.lastLaser.x = this.laserTo[0].x2;
            this.lastLaser.y = this.laserTo[0].y2;
            this.currentLaserStep = 0;
        })
    }

    reset() {
        this.stunTimer.duration = 0;
        this.hasCannon = false;
        this.hasShield = false;
        this.shieldSteps = 0;
        this.life = this.lifeMax;
    }

    onOutOfBounds(dir : number) {
        rooms.transition(dir);
    }

    updateGamepad() {
        if (gamepad.right.x != 0 || gamepad.right.y != 0) {
            this.usingGamepad = true;
            this.nextLaser.x = this.x + gamepad.right.x*gridSize/2
            this.nextLaser.y = this.y + gamepad.right.y*gridSize/2
            this.lastLaser.x = this.laserTo[0].x2;
            this.lastLaser.y = this.laserTo[0].y2;
            this.currentLaserStep = 0;
        }
    }

    update() {
        if (this.stunTimer.check()) {
            this.velocity = directions(0.1/physicsStepsPerLoop);
            this.moving = (this.velocity.x != 0 || this.velocity.y != 0);
        } else {
            this.moving = false;
        }
        var before = [this.x,this.y];
        this.tryMove(this.velocity.x, this.velocity.y);
        var dist = magnitude(this.x-before[0],this.y-before[1]);
        if (this.hasShield) {
            var charged = this.shieldCharged
            this.shieldSteps += dist;
            if (!charged && this.shieldCharged) {
                getItem();
            }
        }

        rooms.activeRoom.touchesItem(this);

        this.currentLaserStep = Math.min(this.currentLaserStep+1,physicsStepsPerLoop);
        var frac = this.currentLaserStep/physicsStepsPerLoop/(this.usingGamepad ? 4 : 1);
        this.laserTo = [new Line(this.x, this.y, this.lastLaser.x * (1-frac) + this.nextLaser.x*frac, this.lastLaser.y * (1-frac) + this.nextLaser.y*frac)];
        this.laserTo[0] = this.laserTo[0].capped(gridSize/2)
        if (this.hasCannon) {
            this.laserTo.push(this.laserTo[0].rot90());
            this.laserTo.push(this.laserTo[0].rot180());
            this.laserTo.push(this.laserTo[0].rot270());
        }
    }

    draw() {
        context.globalCompositeOperation = "source-over";
        context.lineWidth = 1+Math.random()*Math.random()*20;
        if (this.lasing) {
            context.strokeStyle = getRandomColor("#");
            this.laserTo.forEach(line => {
                context.beginPath();
                context.moveTo(line.x1*pixelsPerWorldUnit, line.y1*pixelsPerWorldUnit);
                context.lineTo(line.x2*pixelsPerWorldUnit, line.y2*pixelsPerWorldUnit);
                context.stroke();
            })
        }
        if (this.hasShield && this.shieldCharged) {
            context.strokeStyle = multiply(bg, 0.7+Math.random()*0.3);
            context.lineWidth = 3+Math.random()*Math.random()*8;
            context.beginPath();
            context.arc(this.x*pixelsPerWorldUnit,this.y*pixelsPerWorldUnit,this.width*pixelsPerWorldUnit*1.5,0,2*Math.PI);
            context.stroke();
        }
        var heroSprite = !this._moving ? heroSprites[0] : (performance.now() - this.moveTime) % 500 < 250 ? heroSprites[1] : heroSprites[2]
        drawSprite(heroSprite, this.x-0.5, this.y-0.5, true);
    }

    onHitPlayer(collision : Collision) {
        if (this.hasShield && this.shieldCharged) {
            this.shieldSteps = 0;
        } else {
            this.velocity = collision.direction;
            this.speed = 0.4/physicsStepsPerLoop;
            this.stunTimer.reset();
            this.life--;
            playerHit();
        }
    }
}

var player : Player = new Player();

var bg = getRandomColor("#","89abcd")

rooms.onTransitionEnd = (dir : number, pushIn? : boolean) => {
    var offset = pushIn ? 1.5 : 0.5;
    balls.forEach(ball => {
        player.x = ball.x = [gridSize/2,offset,gridSize/2,gridSize-offset][dir]
        player.y = ball.y = [gridSize-offset,gridSize/2,offset,gridSize/2][dir];
        var rand = 0.8+Math.random()*0.4;
        ball.velocity.x = [randomElement([-1,1])*rand, 0.5, randomElement([-1,1])*rand, -0.5][dir] / 2; // need to include some variation for gemini ball!
        ball.velocity.y = [-0.5, randomElement([-1,1])*rand, 0.5, randomElement([-1,1])*rand][dir] / 2;
    });
}

function drawPlayerLife() {
    for (var i = 0; i < player.lifeMax; i++) {
        context.globalCompositeOperation = "source-over";
        context.drawImage(heartSprites[i < player.life ? 0 : 1],0.25*pixelsPerWorldUnit+5*scale*i,0.25*pixelsPerWorldUnit,scale*4, scale*4);
    }
}

splitBall = () => {
    balls.push(new Ball());
    balls[1].x = balls[0].x;
    balls[1].y = balls[1].y;
    balls.forEach(ball => {
        ball.width /= 2;
        ball.maxSpeed *= 1.8;
    })

}

function reset() {
    title.reset();
    rooms.reset();
    player.reset();
    balls = [new Ball()];
    gameover = gamewon = paused = false;
}

function Render() {
    genericTimer += 0.016;

    requestAnimationFrame(Render);
    if (title.update()) {
        title.draw();
        return;
    }
    overlay(bg,1);

    rooms.draw();
    var i = 0;
    rooms.update();
    player.updateGamepad();
    while (!paused && !rooms.inTransition && i < physicsStepsPerLoop && !showDialogue && !showEndDialogue && !gameover && !gamewon) {
        player.update();
        balls.forEach(ball => {
            ball.update();
            ball.checkHit(player);
            ball.checkHits(rooms.activeRoom.entities);
        })
        rooms.updateEntities(player);
        i++;
    }

    if (!rooms.inTransition || rooms.drawEntities) {
        balls.forEach(ball => {
            ball.draw();
        })
        player.draw();
    }
    if (showDialogue) {
        drawDialogue();
    } else if (showEndDialogue) {
        drawEndDialogue();
    } else if (paused && !rooms.inTransition && !gameover && !gamewon) {
        rooms.drawMap();
    }
    drawPlayerLife();
    musicToggle.draw();
    sfx.draw();
    gameover = player.life == 0;
    if (gameover || gamewon) {
        dungeonTheme.stop();
        overlay("#000000",0.5);
        font(18);
        fill(bg);
        if (gameover) {
            text("GAME OVER", 0.5, 0.5);
            font(7);
            text("[ confirm to continue ]", 0.5, 0.55);
        } else if (gamewon) {
            font(10);
            ["\"I escaped the", "Hyperdimensional Maze","and all I got was","this lousy winscreen\""].forEach((l,i) => {
                text(l, 0.5,(7+i*2)*0.05)
            })
        }
        if (paused) {
            reset();
        }
    }
}

Render();

