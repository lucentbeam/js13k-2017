/// <reference path="entities.ts" />
var Room = (function () {
    function Room(x, y) {
        var _this = this;
        this.x = x;
        this.y = y;
        this.walls = Array(gridSize * gridSize);
        this.exits = Array(4);
        this.items = {};
        this.artifact = undefined;
        this.explored = false;
        this.spotted = false;
        this.entities = new EntityList();
        this.exitRoom = false;
        this.exitOpened = false;
        this.exitRoomTimer = new Timer(20, 20, 20, false);
        this.exitRoomSpawnTimer = new Timer(1, .5, 1.5);
        for (var y = 0; y < gridSize; y++) {
            for (var x = 0; x < gridSize; x++) {
                var edge = y == 0 || y == gridSize - 1 || x == 0 || x == gridSize - 1;
                this.walls[y * gridSize + x] = edge ? 1 : 0;
            }
        }
        this.exits.forEach(function (room, index) {
            if (room) {
                _this.addDoor(index, room);
            }
        });
        this.numConnections = randomElement([1, 1, 1, 1, 2, 2, 2, 3,]);
    }
    Object.defineProperty(Room.prototype, "validConnections", {
        get: function () {
            return [this.y != 0, this.x != mapSize - 1, this.y != mapSize - 1, this.x != 0];
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Room.prototype, "numValidConnections", {
        get: function () {
            var vc = this.validConnections;
            return 1 * (+vc[0]) + 1 * (+vc[1]) + 1 * (+vc[2]) + 1 * (+vc[3]);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Room.prototype, "trapRoom", {
        get: function () {
            return this.exits.filter(function (v) { return v !== undefined; }).length == 1 || this.exitRoom || this.artifact != undefined;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Room.prototype, "cleared", {
        get: function () {
            return this.entities.members.length === 0;
        },
        enumerable: true,
        configurable: true
    });
    Room.prototype.getGrowthDir = function () {
        var choice = Math.floor(Math.random() * 4);
        while (!this.validConnections[choice]) {
            choice = Math.floor(Math.random() * 4);
        }
        return [0, 1, 2, 3][choice];
    };
    Room.prototype.addDoor = function (dir, to) {
        this.freeDoor(dir, true);
        this.exits[dir] = to;
    };
    Room.prototype.freeDoor = function (dir, addBlocks) {
        if (addBlocks === void 0) { addBlocks = false; }
        if (dir == 0 || dir == 2) {
            this.walls.splice(dir ? gridSize * gridSize - 12 : 8, 4, 0, 0, 0, 0);
            if (addBlocks) {
                this.walls.splice(dir ? gridSize * gridSize - 11 - gridSize * 3 : 9 + gridSize * 3, 2, 4, 4);
            }
        }
        else {
            for (var i = 0; i < 4; i++) {
                var p = gridSize * (8 + i) + (dir == 1 ? gridSize - 1 : 0);
                this.walls[p] = 0;
                if (addBlocks) {
                    this.walls[p + 3 * (dir == 1 ? -1 : 1)] = i == 0 || i == 3 ? 0 : 4;
                }
            }
        }
    };
    Room.prototype.blockDoor = function (dir) {
        if (!this.exits[dir]) {
            return;
        }
        if (dir == 0 || dir == 2) {
            this.walls.splice(dir ? gridSize * gridSize - 12 : 8, 4, 5, 5, 5, 5);
        }
        else {
            for (var i = 0; i < 4; i++) {
                var p = gridSize * (8 + i) + (dir == 1 ? gridSize - 1 : 0);
                this.walls[p] = 6;
            }
        }
    };
    Room.prototype.setAsExitRoom = function () {
        var _this = this;
        for (var y = 1; y < gridSize - 1; y++) {
            for (var x = 1; x < gridSize - 1; x++) {
                this.walls[y * gridSize + x] = 0;
            }
        }
        this.items = {};
        this.exitRoom = true;
        var wallSet = [[9, 9, 7], [9, 10, 7], [10, 9, 7], [10, 10, 7],
            [9, 8, 4], [10, 8, 4], [9, 11, 4], [10, 11, 4],
            [8, 9, 4], [8, 10, 4], [11, 9, 4], [11, 10, 4],
            [8, 7, 5], [9, 7, 5], [10, 7, 5], [11, 7, 5],
            [8, 12, 5], [9, 12, 5], [10, 12, 5], [11, 12, 5],
            [7, 8, 6], [7, 9, 6], [7, 10, 6], [7, 11, 6],
            [12, 8, 6], [12, 9, 6], [12, 10, 6], [12, 11, 6]
        ];
        wallSet.forEach(function (pos) {
            _this.walls[_this.index(pos[0], pos[1])] = pos[2];
        });
        this.entities = new EntityList();
        for (var i = 0; i < 6; i++) {
            this.addExitMonster();
        }
    };
    Room.prototype.addExitMonster = function () {
        var loc = randomElement([[2, 2], [18, 18], [2, 18], [18, 2]]);
        var m = this.entities.addMember(Math.random() > 0.1 ? new GameEntity() : new MiniBoss());
        m.x = loc[0];
        m.y = loc[1];
    };
    Room.prototype.generateBlocks = function () {
        var _this = this;
        var wallSet = randomElement([[[6, 6], [13, 6], [6, 13], [13, 13]],
            [[5, 10], [6, 9], [7, 10], [12, 9], [13, 10], [14, 9]],
            [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [18, 12], [17, 12], [16, 12], [15, 12], [14, 12]],
            [[3, 3], [4, 4], [16, 3], [15, 4], [3, 16], [4, 15], [16, 16], [15, 15]]
        ]);
        wallSet.forEach(function (pos) {
            _this.walls[_this.index(pos[0], pos[1])] = 4;
        });
        var n_hearts = Math.min(randInt(wallSet.length * 2 / 3), Math.floor(wallSet.length / 4));
        while (n_hearts > 0) {
            var wall = randomElement(wallSet);
            this.items[this.index(wall[0], wall[1])] = new Heart(this.x, this.y);
            wallSet.splice(wallSet.indexOf(wall), 1);
            n_hearts--;
        }
    };
    Room.prototype.generateMonsters = function () {
        var n = this.artifact ? 1 : randRange(3, 6) + (this.trapRoom ? 4 : 0);
        while (n > 0) {
            var x = randRange(2, gridSize - 2);
            var y = randRange(2, gridSize - 2);
            var monster = this.artifact ? new MiniBoss() : new GameEntity();
            if (!this.collides(x, y, monster.width / 2, monster)) {
                this.entities.addMember(monster);
                monster.x = x;
                monster.y = y;
                n--;
            }
        }
    };
    Room.prototype.dropArtifact = function (location) {
        if (!this.artifact) {
            return;
        }
        artyDrop();
        this.items[this.index(location.x, location.y)] = this.artifact;
    };
    Room.prototype.draw = function (dx, dy, showItems) {
        var _this = this;
        if (dx === void 0) { dx = 0; }
        if (dy === void 0) { dy = 0; }
        if (showItems === void 0) { showItems = true; }
        this.walls.forEach(function (value, index) {
            var x = (index % gridSize);
            var y = Math.floor(index / gridSize);
            if (value) {
                if (value > 4 && value < 7) {
                    drawSprite(wallStopSprites[value - 5], x + dx, y + dy);
                }
                else if (value === 7) {
                    drawSprite(warpSprites[0 + Math.floor((genericTimer * 4 + x + y) % 2)], x + dx, y + dy);
                }
                else {
                    drawSprite(value == 1 ? wallSprites[0] : wallSprites[4 - value], x + dx, y + dy);
                }
            }
            else if (showItems && index in _this.items) {
                drawSprite(_this.items[index].sprite, x, y, true);
            }
        });
        if (this.exitRoom && !this.exitOpened && !rooms.inTransition) {
            font(14);
            fill("#FFFFFF");
            text("" + (Math.floor(this.exitRoomTimer.remaining)), 0.5, 0.225);
        }
    };
    Room.prototype.update = function (player) {
        var _this = this;
        if (this.exitRoom) {
            if (this.exitRoomSpawnTimer.check()) {
                this.addExitMonster();
            }
            if (!this.exitOpened && this.exitRoomTimer.check()) {
                this.walls.forEach(function (w, index) {
                    if (w == 5 || w == 6) {
                        _this.walls[index] = 0;
                    }
                });
                for (var i = 0; i < 4; i++) {
                    this.blockDoor(i);
                }
                this.exitOpened = true;
            }
        }
        this.entities.update(this, player);
        if (this.entities.members.length == 0 && this.trapRoom) {
            for (var i = 0; i < 4; i++) {
                if (this.exits[i]) {
                    this.freeDoor(i);
                }
            }
        }
    };
    Room.prototype.onEnter = function () {
        this.exitRoomTimer.reset();
        this.exitRoomSpawnTimer.reset();
        if (this.trapRoom) {
            for (var i = 0; i < 4; i++) {
                this.blockDoor(i);
                doors();
            }
        }
    };
    Room.prototype.outOfBounds = function (x, y, width) {
        if (y - width < 0) {
            return 0;
        }
        if (x + width > gridSize) {
            return 1;
        }
        if (y + width > gridSize) {
            return 2;
        }
        if (x - width < 0) {
            return 3;
        }
        return -1;
    };
    Room.prototype.blocks = function (x, y) {
        return this.at(x, y) !== 0;
    };
    Room.prototype.at = function (x, y) {
        return this.walls[this.index(x, y)];
    };
    Room.prototype.index = function (x, y) {
        return Math.floor(y) * gridSize + Math.floor(x);
    };
    Room.prototype.touchesItem = function (player) {
        var x = player.x;
        var y = player.y;
        var halfWidth = player.width / 2;
        for (var i = -halfWidth; i <= halfWidth; i += 2 * halfWidth) {
            for (var j = -halfWidth; j <= halfWidth; j += 2 * halfWidth) {
                var index = this.index(x + i, y + j);
                if (index in this.items) {
                    var item = this.items[index];
                    if (!(item instanceof Heart)) {
                        acquireItem(item);
                        this.manager.acquireItem(item);
                    }
                    delete this.items[index];
                    getItem();
                    item.got(player);
                }
            }
        }
    };
    Room.prototype.collides = function (x, y, halfWidth, thing) {
        var isBall = thing instanceof Ball;
        for (var i = -halfWidth; i <= halfWidth; i += 2 * halfWidth) {
            for (var j = -halfWidth; j <= halfWidth; j += 2 * halfWidth) {
                var idx = this.index(x + i, y + j);
                if (this.blocks(x + i, y + j)) {
                    if (isBall && this.walls[idx] == 2) {
                        this.walls[idx] = 0;
                    }
                    else if (isBall && this.walls[idx] > 2 && this.walls[idx] < 5) {
                        this.walls[idx]--;
                    }
                    else if (this.walls[idx] == 7 && thing instanceof Player) {
                        gamewon = true;
                    }
                    return true;
                }
            }
        }
        return false;
    };
    return Room;
}());
var DummyRoom = (function (_super) {
    __extends(DummyRoom, _super);
    function DummyRoom(x, y) {
        var _this = _super.call(this, x, y) || this;
        _this.numConnections = 0;
        return _this;
    }
    return DummyRoom;
}(Room));
function connect(r1, r2) {
    var dx = r2.x - r1.x;
    var dy = r2.y - r1.y;
    var dir = dx > 0 ? 1 : dx < 0 ? 3 : dy < 0 ? 0 : 2;
    r1.addDoor(dir, r2);
    r2.addDoor((dir + 2) % 4, r1);
}
var RoomCollection = (function () {
    function RoomCollection() {
        this.rooms = [];
        this.transitionTimer = new Timer(1);
        this.warpTimer = new Timer(1.75);
        this.inTransition = false;
        this.warping = false;
        this.vx = 0;
        this.vy = 0;
        this.dir = 0;
        this.map = [];
        this.artifacts = [];
        this.drawEntities = true;
        this.lastRootChord = rootChord;
        this.nextRootChord = rootChord;
        this.reset();
    }
    Object.defineProperty(RoomCollection.prototype, "activeRoom", {
        get: function () {
            return this._activeRoom;
        },
        set: function (value) {
            value.explored = true;
            value.spotted = true;
            value.exits.forEach(function (exit) {
                if (exit) {
                    exit.spotted = true;
                }
                ;
            });
            this._activeRoom = value;
        },
        enumerable: true,
        configurable: true
    });
    RoomCollection.prototype.reset = function () {
        this.generateArtifacts();
        this.clearMap();
        var x = Math.floor(mapSize / 2);
        var y = x;
        this.add(x, y);
        this.map[x][y].numConnections++;
        this.spawnMap();
        this.activeRoom = this.map[x][y];
        this.activeRoom.entities = new EntityList();
    };
    RoomCollection.prototype.generateArtifacts = function () {
        //this.artifacts = [new Cannon(Math.floor(mapSize/2),Math.floor(mapSize/2)-1) ];
        this.artifacts = [new Shield(randInt(mapSize), randInt(Math.floor(mapSize / 4))), new Cannon(randInt(Math.floor(mapSize / 3)), randRange(Math.floor(mapSize * 2 / 3), mapSize)), new Ring(randRange(Math.floor(mapSize * 2 / 3), mapSize), randRange(Math.floor(mapSize * 2 / 3), mapSize))];
    };
    RoomCollection.prototype.add = function (x, y) {
        this.map[x][y] = new Room(x, y);
        this.map[x][y].manager = this;
        this.rooms.push(this.map[x][y]);
    };
    RoomCollection.prototype.onTransitionEnd = function (dir, pushIn) { };
    RoomCollection.prototype.update = function () {
        if (this.inTransition) {
            if (this.nextRoom && this.transitionTimer.fraction === 1.0) {
                this.activeRoom = this.nextRoom;
                this.activeRoom.entities.members.forEach(function (entity) { return entity.refreshTimers(); });
                this.nextRoom = undefined;
                this.inTransition = false;
                this.onTransitionEnd(this.dir, true);
                this.activeRoom.onEnter();
            }
            else if (!this.nextRoom && this.warpTimer.fraction === 1.0) {
                this.inTransition = false;
                this.onTransitionEnd(this.dir, true);
                this.activeRoom.onEnter();
            }
            rootChord = this.lastRootChord * (1 - this.warpTimer.fraction) + this.nextRootChord * this.warpTimer.fraction;
            return true;
        }
        return false;
    };
    RoomCollection.prototype.updateEntities = function (player) {
        this.activeRoom.update(player);
    };
    RoomCollection.prototype.draw = function () {
        if (this.inTransition && this.nextRoom) {
            var frac = this.transitionTimer.fraction;
            this.activeRoom.draw(this.vx * frac * gridSize, this.vy * frac * gridSize, false);
            this.nextRoom.draw(this.vx * (frac - 1) * gridSize, this.vy * (frac - 1) * gridSize, false);
        }
        else if (this.inTransition) {
            var time = this.warpTimer.progress;
            this.activeRoom.draw();
            this.drawEntities = time < .5;
            if (time > .5) {
                if (this.warping) {
                    this.spawnDimension();
                    this.warping = false;
                }
                overlay(this.lastColor, (1 - this.warpTimer.fraction));
                font(12);
                var text = "DIMENSION WARP";
                fill(multiply("#FFFFFF", this.warpTimer.fraction));
                for (var i = 0; i < text.length; i++) {
                    context.fillText(text.substr(i, 1), gridSize * pixelsPerWorldUnit / 5 + pixelsPerWorldUnit * (i + Math.random() * 0.15), gridSize * pixelsPerWorldUnit / 2 + pixelsPerWorldUnit * (Math.random() - 0.25));
                }
            }
            if (this.drawEntities) {
                this.activeRoom.entities.draw();
            }
            overlay("#FFFFFF", time < .5 ? 0.0 : (1 - (time - .5) / .5));
        }
        else {
            this.activeRoom.draw();
            this.activeRoom.entities.draw();
        }
    };
    RoomCollection.prototype.drawMap = function () {
        var _this = this;
        overlay("#000000", 0.55);
        context.fillRect(4 * pixelsPerWorldUnit, 3 * pixelsPerWorldUnit, (gridSize - 8) * pixelsPerWorldUnit, (gridSize - 6) * pixelsPerWorldUnit);
        font(14);
        fill(bg);
        context.fillText("-  M  A  P  -", gridSize * pixelsPerWorldUnit / 2, gridSize * pixelsPerWorldUnit / 4 + 1 * scale);
        var drawSize = (gridSize - 10) * pixelsPerWorldUnit / mapSize;
        for (var y = 0; y < mapSize; y++) {
            for (var x = 0; x < mapSize; x++) {
                fill("#252525");
                context.fillRect(5 * pixelsPerWorldUnit + drawSize * x, 6 * pixelsPerWorldUnit + drawSize * y, drawSize - scale, drawSize - scale);
            }
        }
        this.rooms.forEach(function (room) {
            if (!room.explored) {
                return;
            }
            var exits = room.exits;
            fill(room.explored ? bg : multiply(bg, 0.5));
            for (var i = 0; i < 4; i++) {
                if (!exits[i]) {
                    continue;
                }
                var dx = (room.x + exits[i].x) / 2;
                var dy = (room.y + exits[i].y) / 2;
                context.fillRect(5 * pixelsPerWorldUnit + drawSize * (dx + 0.35) - scale / 2, 6 * pixelsPerWorldUnit + drawSize * (dy + 0.35) - scale / 2, drawSize * 0.3, drawSize * 0.3);
            }
        });
        this.rooms.forEach(function (room) {
            if (!room.spotted) {
                return;
            }
            fill(room.explored ? bg : multiply(bg, 0.5));
            context.fillRect(5 * pixelsPerWorldUnit + drawSize * room.x, 6 * pixelsPerWorldUnit + drawSize * room.y, drawSize - scale, drawSize - scale);
            if (room == _this.activeRoom && (genericTimer % 1) > 0.5) {
                fill("#FFFFFF");
                context.fillRect(5 * pixelsPerWorldUnit + drawSize * (room.x + 0.25), 6 * pixelsPerWorldUnit + drawSize * (room.y + 0.25), drawSize * 0.5 - scale, drawSize * 0.5 - scale);
            }
        });
        for (var y = 0; y < mapSize; y++) {
            for (var x = 0; x < mapSize; x++) {
                this.artifacts.forEach(function (artifact) {
                    if (artifact.at(x, y)) {
                        context.drawImage(artifact.sprite, 5 * pixelsPerWorldUnit + drawSize * (x + 0.1), 6 * pixelsPerWorldUnit + drawSize * (y + 0.1), drawSize * 0.8 - scale, drawSize * 0.8 - scale);
                    }
                });
                if (this.artifacts.length === 0 && x === mapCenter && y === mapCenter) {
                    context.drawImage(exitSprite, 5 * pixelsPerWorldUnit + drawSize * (x + 0.1), 6 * pixelsPerWorldUnit + drawSize * (y + 0.1), drawSize * 0.8 - scale, drawSize * 0.8 - scale);
                }
            }
        }
    };
    RoomCollection.prototype.transition = function (dir) {
        this.dir = dir;
        this.inTransition = true;
        this.drawEntities = false;
        this.vx = [0, -1, 0, 1][dir];
        this.vy = [1, 0, -1, 0][dir];
        this.nextRoom = this.activeRoom.exits[dir];
        this.transitionTimer.reset();
    };
    RoomCollection.prototype.teleport = function (dir, color) {
        this.dir = dir;
        this.drawEntities = true;
        this.nextColor = color;
        this.warping = true;
        this.warpTimer.reset();
        this.inTransition = true;
        var c = 0;
        for (var i = 0; i < 3; i++) {
            c += parseInt(color[i * 2 + 1], 16) / 3;
        }
        this.lastRootChord = rootChord;
        this.nextRootChord = chords[Math.floor(c - 8)];
    };
    RoomCollection.prototype.spawnDimension = function () {
        this.lastColor = bg;
        bg = multiply(this.nextColor, 0.8);
        this.clearMap();
        this.add(this.activeRoom.x, this.activeRoom.y);
        this.grow(this.rooms[0], this.dir);
        this.spawnMap();
        this.activeRoom = this.rooms[1];
    };
    RoomCollection.prototype.checkForExit = function () {
        if (this.artifacts.length === 0) {
            this.rooms.forEach(function (room, index) {
                if (room.x == mapCenter && room.y == mapCenter) {
                    room.setAsExitRoom();
                }
            });
        }
    };
    Object.defineProperty(RoomCollection.prototype, "availableConnections", {
        get: function () {
            var n = 0;
            this.rooms.forEach(function (value) { n += value.numConnections; });
            return n;
        },
        enumerable: true,
        configurable: true
    });
    RoomCollection.prototype.grow = function (room, dir) {
        var dx = [0, 1, 0, -1][dir];
        var dy = [-1, 0, 1, 0][dir];
        dx += room.x;
        dy += room.y;
        if (!this.hasAt(dx, dy)) {
            this.add(dx, dy);
        }
        connect(room, this.map[dx][dy]);
    };
    RoomCollection.prototype.hasAt = function (x, y) {
        return !(this.map[x][y] instanceof DummyRoom);
    };
    RoomCollection.prototype.spawnMap = function () {
        var _this = this;
        while (this.availableConnections > 0) {
            this.rooms.forEach(function (value) {
                if (value.numConnections > 0) {
                    var dir = value.getGrowthDir();
                    value.numConnections--;
                    var dx = [0, 1, 0, -1][dir];
                    var dy = [-1, 0, 1, 0][dir];
                    if (!_this.hasAt(value.x + dx, value.y + dy) || Math.random() < 0.5) {
                        _this.grow(value, dir);
                    }
                }
            });
        }
        this.rooms.forEach(function (room) {
            // check if boss room
            room.generateBlocks(); // and hearts!
            // place artifacts
            _this.artifacts.forEach(function (artifact) {
                if (artifact.at(room.x, room.y)) {
                    room.artifact = artifact;
                }
            });
            room.generateMonsters();
            // add bonus items
        });
        this.checkForExit();
    };
    RoomCollection.prototype.acquireItem = function (item) {
        var n = this.artifacts.indexOf(item);
        if (n === -1) {
            return;
        }
        this.artifacts.splice(n, 1);
        this.checkForExit();
        if (this.artifacts.length == 0) {
            showEndDialogue = true;
        }
    };
    RoomCollection.prototype.clearMap = function () {
        this.rooms = [];
        this.map = [];
        for (var i = 0; i < mapSize; i++) {
            this.map[i] = [];
            for (var j = 0; j < mapSize; j++) {
                this.map[i].push(new DummyRoom(j, i));
            }
        }
    };
    return RoomCollection;
}());
var rooms = new RoomCollection();
