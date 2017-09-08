/// <reference path="sfx.ts" />

class GameEntity {
    width : number = 0.4;
    x : number = gridSize/2;
    y : number = gridSize/2;
    velocity : vector = { x: 0, y: 0 };
    isBall : boolean = false;
    imageList : HTMLCanvasElement[] = enemySprites;
    fps : number = 1.2;
    frameOffset : number = Math.random();
    dying : boolean = false;

    // ai stuff
    aiTimer : Timer = new Timer(0.5,0.5,1);
    maxSpeed : number = 0.05;

    shotTimer : Timer = new Timer(2.5,1.5,3.5);

    get speed() : number { return magnitudeVector(this.velocity); }
    set speed(val : number) {
        var current = this.speed;
        this.velocity.x *= val/current;
        this.velocity.y *= val/current;
    }
    refreshTimers() {
        this.aiTimer.reset();
        this.shotTimer.reset();
    }
    update() : void {
        if (this.aiTimer.check()) {
            this.randomizeVelocity();
        }
        this.tryMove(this.velocity.x/physicsStepsPerLoop, this.velocity.y/physicsStepsPerLoop);
    }
    shooting(player : GameEntity) : Bullet[] {
        if (this.shotTimer.check()) {
            return [new Bullet(player, this)]
        }
        return []
    }
    draw() : void {
        drawSprite(this.imageList[Math.floor(((genericTimer*this.fps+this.frameOffset) % 1.0)*this.imageList.length)], this.x-0.5, this.y-0.5);
    }
    tryMove(dx : number, dy : number) {
        var xTrial = this.x+dx;
        var yTrial = this.y;
        var dir : number = rooms.activeRoom.outOfBounds(xTrial, yTrial, this.width/2);
        if (~dir) {
            this.onOutOfBounds(dir)
            return;
        }
        if (rooms.activeRoom.collides(xTrial, yTrial, this.width/2, this)) {
            this.onHitWall(true);
            xTrial = this.x;
        } else {
            this.x = xTrial;
        }
        yTrial = this.y + dy;
        dir = rooms.activeRoom.outOfBounds(xTrial, yTrial, this.width/2);
        if (~dir) {
            this.onOutOfBounds(dir)
            return;
        }
        if (rooms.activeRoom.collides(xTrial, yTrial, this.width/2, this)) {
            this.onHitWall(false);
        } else {
            this.y = yTrial;
        }
    }
    randomizeVelocity() {
        this.velocity.x = Math.random()-0.5;
        this.velocity.y = Math.random()-0.5;
        this.speed = this.maxSpeed;
    }
    onOutOfBounds(dir : number) {
        this.onHitWall(dir % 2 == 1);
     }
    
    onHitWall(horizontal : boolean) {
        if (horizontal) {
            this.velocity.x *= -1;
        } else {
            this.velocity.y *= -1;
        }
    }
    onHitByBall() { this.dying = true; monsterHit(); }
    onHitPlayer(collision : Collision) {}
}

class Bullet extends GameEntity {
    baseX : number;
    baseY : number;
    aliveFor : number = 0;
    constructor(toward : vector, from : vector) {
        super();
        this.width = 0.15;
        this.imageList = [bulletSprite];
        this.velocity.x = toward.x - from.x;
        this.velocity.y = toward.y - from.y;
        this.maxSpeed = 0.15;
        this.speed = this.maxSpeed;
        this.baseX = from.x;
        this.baseY = from.y;
        this.onHitByBall = this.onHitWall = this.onOutOfBounds = this.onHitPlayer = this.die;
    }
    get x() { return this.baseX + this.getOffsetX(); }
    set x(val) { this.baseX = val-this.getOffsetX(); }
    get y() { return this.baseY + this.getOffsetY(); }
    set y(val) { this.baseY = val-this.getOffsetY(); }

    getOffsetX() { return 0; }
    getOffsetY() { return 0; }
    
    update() : void {
        this.aliveFor += 0.016/physicsStepsPerLoop;
        this.tryMove(this.velocity.x/physicsStepsPerLoop, this.velocity.y/physicsStepsPerLoop);
    }
    die() { this.dying = true;}
    shooting() { return []; }
}

class EntityList {
    members : Array<GameEntity> = new Array();
    addMember(member: GameEntity) : GameEntity {
        if (this.members.indexOf(member) === -1) { this.members.push(member) };
        return member;
    }
    removeMember(member: GameEntity) : void {
        if (this.members.indexOf(member) !== -1) { this.members.slice(this.members.indexOf(member)); };
    }
    update(room : Room, player : GameEntity) : void {
        this.members.forEach(member => member.update());

        this.members.forEach(member => {
            if (member.dying && member instanceof MiniBoss) {
                room.dropArtifact(member);
            }
        })
        this.members = this.members.filter(entity => { return !entity.dying});
        
        this.members.forEach(entity => {
            var bullets = entity.shooting(player);
            bullets.forEach(bullet => {
                this.addMember(bullet);
            })
            if (entity instanceof Bullet) {
                var collision = new Collision(entity.x, entity.y, player);
                if (collision.distance < entity.width/2+player.width/2) {
                    collision.direction = entity.velocity;
                    entity.onHitPlayer(collision);
                    player.onHitPlayer(collision);
                }
            }
        });
    }
    draw() : void {
        this.members.forEach(member => { member.draw(); });
    }
}

class MiniBoss extends GameEntity {
    width : number = 0.8;
    imageList : HTMLCanvasElement[] = [bigEnemySprite];
    maxSpeed : number = 0.025;
    life : number = 4;
    draw() : void {
        drawSprite(this.imageList[Math.floor(((genericTimer*this.fps+this.frameOffset) % 1.0)*this.imageList.length)], this.x-1, this.y-1);
    }

    randomizeVelocity() {
        this.velocity.x = Math.random()-0.5;
        this.velocity.y = Math.random()-0.5;
        this.speed = this.maxSpeed;
    }
    onHitByBall() { this.life--; bossHit(); if (this.life <= 0) { this.dying = true; } }
    shooting(player : GameEntity) : Bullet[] {
        var bullets = [];
        if (this.shotTimer.check()) {
            var dir = unitVector({x:player.x-this.x,y:player.y-this.y});
            bullets.push(this.makeBullet(player,dir,2));
            bullets.push(this.makeBullet(player,dir,0));
            bullets.push(this.makeBullet(player,dir,-2));
        }
        return bullets;
    }
    makeBullet(player : GameEntity, toward : vector, magn : number) {
        var point = {x: player.x+toward.y*magn, y: player.y-toward.x*magn};
        var bullet = new Bullet(point, this);
        bullet.getOffsetX = () => {
            return -Math.sin(bullet.aliveFor*5)*unitVector(bullet.velocity).y;
        }
        bullet.getOffsetY = () => {
            return Math.sin(bullet.aliveFor*5)*unitVector(bullet.velocity).x;
        }
        return bullet;
    }
}


class Ball extends GameEntity {
    currentColor : string = "#FFFFFF";

    get activated() : boolean {
        return rooms.activeRoom.cleared;
    }

    constructor() {
        super();
        this.isBall = true;
        this.maxSpeed = 0.15;
        this.randomizeVelocity();
    }

    onHitWall(horizontal : boolean) {
        super.onHitWall(horizontal);
        ballBomp();
    }

    update() {
        this.tryMove(this.velocity.x/physicsStepsPerLoop, this.velocity.y/physicsStepsPerLoop);
        if (this.speed > this.maxSpeed) {
            var f = 0.1/physicsStepsPerLoop;
            this.speed = this.speed*(1-f)+this.maxSpeed*f;
        }
        this.currentColor = this.activated ? getRandomColor("#","89abcd") : "#FFFFFF";
    }

    onOutOfBounds(dir : number) {
        if (this.activated) {
            rooms.teleport(dir, this.currentColor)
            warpSound();
         } else {
            this.onHitWall(dir % 2 !== 0);
         }
    }

    checkHit(player : Player) {
        if (!player.lasing) { return; }
        player.laserTo.forEach(line => {
            if (this.evaluateCollision(getNearestPoint(line, {x: this.x, y: this.y}),this.width)) {
                laserHit();
            }
        })
    }

    evaluateCollision(collision : Collision, threshold : number) : boolean {
        var penetration = threshold - collision.distance;
        if (penetration > 0) {
            var velocityTowardProjection = this.velocity.x*collision.direction.x+this.velocity.y*collision.direction.y;
            if (velocityTowardProjection < 0) {
                this.velocity.x -= 2*velocityTowardProjection*collision.direction.x;
                this.velocity.y -= 2*velocityTowardProjection*collision.direction.y;
            }
            var dx = collision.direction.x*penetration;
            var dy = collision.direction.y*penetration;
            this.velocity.x += dx;
            this.velocity.y += dy;
            this.tryMove(dx,dy);
            return true;
        }
        return false;
    }

    checkHits(entities : EntityList) {
        entities.members.forEach(entity => {
            if (this.evaluateCollision(new Collision(entity.x, entity.y, this),this.width+entity.width)) {
                entity.onHitByBall();
                if (entity instanceof Bullet) {
                    bulletHit();
                }
            }
        })
    }

    draw() {
        circle(rooms.inTransition ? rooms.nextColor : this.currentColor, this.x, this.y, this.width*0.8);
        if (rooms.inTransition) {
            context.lineWidth = 10;
            context.strokeStyle = rooms.nextColor;
            context.beginPath();
            context.arc(this.x*pixelsPerWorldUnit, this.y*pixelsPerWorldUnit, this.width*0.8*pixelsPerWorldUnit*30*easeOutQuad(rooms.warpTimer.progress/.5), 0, 2 * Math.PI);
            context.stroke();
        }
    }
}