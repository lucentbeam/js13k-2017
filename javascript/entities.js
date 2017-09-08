/// <reference path="sfx.ts" />
var GameEntity = (function () {
    function GameEntity() {
        this.width = 0.4;
        this.x = gridSize / 2;
        this.y = gridSize / 2;
        this.velocity = { x: 0, y: 0 };
        this.isBall = false;
        this.imageList = enemySprites;
        this.fps = 1.2;
        this.frameOffset = Math.random();
        this.dying = false;
        // ai stuff
        this.aiTimer = new Timer(0.5, 0.5, 1);
        this.maxSpeed = 0.05;
        this.shotTimer = new Timer(2.5, 1.5, 3.5);
    }
    Object.defineProperty(GameEntity.prototype, "speed", {
        get: function () { return magnitudeVector(this.velocity); },
        set: function (val) {
            var current = this.speed;
            this.velocity.x *= val / current;
            this.velocity.y *= val / current;
        },
        enumerable: true,
        configurable: true
    });
    GameEntity.prototype.refreshTimers = function () {
        this.aiTimer.reset();
        this.shotTimer.reset();
    };
    GameEntity.prototype.update = function () {
        if (this.aiTimer.check()) {
            this.randomizeVelocity();
        }
        this.tryMove(this.velocity.x / physicsStepsPerLoop, this.velocity.y / physicsStepsPerLoop);
    };
    GameEntity.prototype.shooting = function (player) {
        if (this.shotTimer.check()) {
            return [new Bullet(player, this)];
        }
        return [];
    };
    GameEntity.prototype.draw = function () {
        drawSprite(this.imageList[Math.floor(((genericTimer * this.fps + this.frameOffset) % 1.0) * this.imageList.length)], this.x - 0.5, this.y - 0.5);
    };
    GameEntity.prototype.tryMove = function (dx, dy) {
        var xTrial = this.x + dx;
        var yTrial = this.y;
        var dir = rooms.activeRoom.outOfBounds(xTrial, yTrial, this.width / 2);
        if (~dir) {
            this.onOutOfBounds(dir);
            return;
        }
        if (rooms.activeRoom.collides(xTrial, yTrial, this.width / 2, this)) {
            this.onHitWall(true);
            xTrial = this.x;
        }
        else {
            this.x = xTrial;
        }
        yTrial = this.y + dy;
        dir = rooms.activeRoom.outOfBounds(xTrial, yTrial, this.width / 2);
        if (~dir) {
            this.onOutOfBounds(dir);
            return;
        }
        if (rooms.activeRoom.collides(xTrial, yTrial, this.width / 2, this)) {
            this.onHitWall(false);
        }
        else {
            this.y = yTrial;
        }
    };
    GameEntity.prototype.randomizeVelocity = function () {
        this.velocity.x = Math.random() - 0.5;
        this.velocity.y = Math.random() - 0.5;
        this.speed = this.maxSpeed;
    };
    GameEntity.prototype.onOutOfBounds = function (dir) {
        this.onHitWall(dir % 2 == 1);
    };
    GameEntity.prototype.onHitWall = function (horizontal) {
        if (horizontal) {
            this.velocity.x *= -1;
        }
        else {
            this.velocity.y *= -1;
        }
    };
    GameEntity.prototype.onHitByBall = function () { this.dying = true; monsterHit(); };
    GameEntity.prototype.onHitPlayer = function (collision) { };
    return GameEntity;
}());
var Bullet = (function (_super) {
    __extends(Bullet, _super);
    function Bullet(toward, from) {
        var _this = _super.call(this) || this;
        _this.aliveFor = 0;
        _this.width = 0.15;
        _this.imageList = [bulletSprite];
        _this.velocity.x = toward.x - from.x;
        _this.velocity.y = toward.y - from.y;
        _this.maxSpeed = 0.15;
        _this.speed = _this.maxSpeed;
        _this.baseX = from.x;
        _this.baseY = from.y;
        _this.onHitByBall = _this.onHitWall = _this.onOutOfBounds = _this.onHitPlayer = _this.die;
        return _this;
    }
    Object.defineProperty(Bullet.prototype, "x", {
        get: function () { return this.baseX + this.getOffsetX(); },
        set: function (val) { this.baseX = val - this.getOffsetX(); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Bullet.prototype, "y", {
        get: function () { return this.baseY + this.getOffsetY(); },
        set: function (val) { this.baseY = val - this.getOffsetY(); },
        enumerable: true,
        configurable: true
    });
    Bullet.prototype.getOffsetX = function () { return 0; };
    Bullet.prototype.getOffsetY = function () { return 0; };
    Bullet.prototype.update = function () {
        this.aliveFor += 0.016 / physicsStepsPerLoop;
        this.tryMove(this.velocity.x / physicsStepsPerLoop, this.velocity.y / physicsStepsPerLoop);
    };
    Bullet.prototype.die = function () { this.dying = true; };
    Bullet.prototype.shooting = function () { return []; };
    return Bullet;
}(GameEntity));
var EntityList = (function () {
    function EntityList() {
        this.members = new Array();
    }
    EntityList.prototype.addMember = function (member) {
        if (this.members.indexOf(member) === -1) {
            this.members.push(member);
        }
        ;
        return member;
    };
    EntityList.prototype.removeMember = function (member) {
        if (this.members.indexOf(member) !== -1) {
            this.members.slice(this.members.indexOf(member));
        }
        ;
    };
    EntityList.prototype.update = function (room, player) {
        var _this = this;
        this.members.forEach(function (member) { return member.update(); });
        this.members.forEach(function (member) {
            if (member.dying && member instanceof MiniBoss) {
                room.dropArtifact(member);
            }
        });
        this.members = this.members.filter(function (entity) { return !entity.dying; });
        this.members.forEach(function (entity) {
            var bullets = entity.shooting(player);
            bullets.forEach(function (bullet) {
                _this.addMember(bullet);
            });
            if (entity instanceof Bullet) {
                var collision = new Collision(entity.x, entity.y, player);
                if (collision.distance < entity.width / 2 + player.width / 2) {
                    collision.direction = entity.velocity;
                    entity.onHitPlayer(collision);
                    player.onHitPlayer(collision);
                }
            }
        });
    };
    EntityList.prototype.draw = function () {
        this.members.forEach(function (member) { member.draw(); });
    };
    return EntityList;
}());
var MiniBoss = (function (_super) {
    __extends(MiniBoss, _super);
    function MiniBoss() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.width = 0.8;
        _this.imageList = [bigEnemySprite];
        _this.maxSpeed = 0.025;
        _this.life = 4;
        return _this;
    }
    MiniBoss.prototype.draw = function () {
        drawSprite(this.imageList[Math.floor(((genericTimer * this.fps + this.frameOffset) % 1.0) * this.imageList.length)], this.x - 1, this.y - 1);
    };
    MiniBoss.prototype.randomizeVelocity = function () {
        this.velocity.x = Math.random() - 0.5;
        this.velocity.y = Math.random() - 0.5;
        this.speed = this.maxSpeed;
    };
    MiniBoss.prototype.onHitByBall = function () { this.life--; bossHit(); if (this.life <= 0) {
        this.dying = true;
    } };
    MiniBoss.prototype.shooting = function (player) {
        var bullets = [];
        if (this.shotTimer.check()) {
            var dir = unitVector({ x: player.x - this.x, y: player.y - this.y });
            bullets.push(this.makeBullet(player, dir, 2));
            bullets.push(this.makeBullet(player, dir, 0));
            bullets.push(this.makeBullet(player, dir, -2));
        }
        return bullets;
    };
    MiniBoss.prototype.makeBullet = function (player, toward, magn) {
        var point = { x: player.x + toward.y * magn, y: player.y - toward.x * magn };
        var bullet = new Bullet(point, this);
        bullet.getOffsetX = function () {
            return -Math.sin(bullet.aliveFor * 5) * unitVector(bullet.velocity).y;
        };
        bullet.getOffsetY = function () {
            return Math.sin(bullet.aliveFor * 5) * unitVector(bullet.velocity).x;
        };
        return bullet;
    };
    return MiniBoss;
}(GameEntity));
var Ball = (function (_super) {
    __extends(Ball, _super);
    function Ball() {
        var _this = _super.call(this) || this;
        _this.currentColor = "#FFFFFF";
        _this.isBall = true;
        _this.maxSpeed = 0.15;
        _this.randomizeVelocity();
        return _this;
    }
    Object.defineProperty(Ball.prototype, "activated", {
        get: function () {
            return rooms.activeRoom.cleared;
        },
        enumerable: true,
        configurable: true
    });
    Ball.prototype.onHitWall = function (horizontal) {
        _super.prototype.onHitWall.call(this, horizontal);
        ballBomp();
    };
    Ball.prototype.update = function () {
        this.tryMove(this.velocity.x / physicsStepsPerLoop, this.velocity.y / physicsStepsPerLoop);
        if (this.speed > this.maxSpeed) {
            var f = 0.1 / physicsStepsPerLoop;
            this.speed = this.speed * (1 - f) + this.maxSpeed * f;
        }
        this.currentColor = this.activated ? getRandomColor("#", "89abcd") : "#FFFFFF";
    };
    Ball.prototype.onOutOfBounds = function (dir) {
        if (this.activated) {
            rooms.teleport(dir, this.currentColor);
            warpSound();
        }
        else {
            this.onHitWall(dir % 2 !== 0);
        }
    };
    Ball.prototype.checkHit = function (player) {
        var _this = this;
        if (!player.lasing) {
            return;
        }
        player.laserTo.forEach(function (line) {
            if (_this.evaluateCollision(getNearestPoint(line, { x: _this.x, y: _this.y }), _this.width)) {
                laserHit();
            }
        });
    };
    Ball.prototype.evaluateCollision = function (collision, threshold) {
        var penetration = threshold - collision.distance;
        if (penetration > 0) {
            var velocityTowardProjection = this.velocity.x * collision.direction.x + this.velocity.y * collision.direction.y;
            if (velocityTowardProjection < 0) {
                this.velocity.x -= 2 * velocityTowardProjection * collision.direction.x;
                this.velocity.y -= 2 * velocityTowardProjection * collision.direction.y;
            }
            var dx = collision.direction.x * penetration;
            var dy = collision.direction.y * penetration;
            this.velocity.x += dx;
            this.velocity.y += dy;
            this.tryMove(dx, dy);
            return true;
        }
        return false;
    };
    Ball.prototype.checkHits = function (entities) {
        var _this = this;
        entities.members.forEach(function (entity) {
            if (_this.evaluateCollision(new Collision(entity.x, entity.y, _this), _this.width + entity.width)) {
                entity.onHitByBall();
                if (entity instanceof Bullet) {
                    bulletHit();
                }
            }
        });
    };
    Ball.prototype.draw = function () {
        circle(rooms.inTransition ? rooms.nextColor : this.currentColor, this.x, this.y, this.width * 0.8);
        if (rooms.inTransition) {
            context.lineWidth = 10;
            context.strokeStyle = rooms.nextColor;
            context.beginPath();
            context.arc(this.x * pixelsPerWorldUnit, this.y * pixelsPerWorldUnit, this.width * 0.8 * pixelsPerWorldUnit * 30 * easeOutQuad(rooms.warpTimer.progress / .5), 0, 2 * Math.PI);
            context.stroke();
        }
    };
    return Ball;
}(GameEntity));
