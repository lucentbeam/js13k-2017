/// <reference path="entities.ts" />

class Room {
    walls : number[] = Array(gridSize*gridSize);
    exits : Room[] = Array(4);
    items : {} = {};
    artifact : Item = undefined;
    numConnections : number;
    explored : boolean = false;
    spotted : boolean = false;
    entities : EntityList = new EntityList();
    exitRoom : boolean = false;
    exitOpened : boolean = false;
    exitRoomTimer : Timer = new Timer(20,20,20,false);
    exitRoomSpawnTimer : Timer = new Timer(1,.5,1.5);
    manager : RoomCollection;
    get validConnections() : boolean[] {
        return [this.y != 0, this.x != mapSize-1, this.y != mapSize-1, this.x != 0];
    }
    get numValidConnections() : number {
        var vc = this.validConnections;
        return 1*(+vc[0])+1*(+vc[1])+1*(+vc[2])+1*(+vc[3]);
    }
    get trapRoom() : boolean {
        return this.exits.filter(v => { return v !== undefined}).length == 1 || this.exitRoom || this.artifact != undefined;
    }
    get cleared() : boolean {
        return this.entities.members.length === 0;
    }
    getGrowthDir() : number {
        var choice = Math.floor(Math.random()*4)
        while (!this.validConnections[choice]) {
            choice = Math.floor(Math.random()*4);
        }
        return [0,1,2,3][choice];
    }
    constructor(public x : number, public y : number) {
        for (var y = 0; y < gridSize; y++) {
            for (var x = 0; x < gridSize; x++) {
                var edge = y == 0 || y == gridSize-1 || x == 0 || x == gridSize-1;
                this.walls[y*gridSize + x] = edge ? 1 : 0;
            }
        }
        this.exits.forEach((room,index) => {
            if (room) {
                this.addDoor(index,room);
            }
        })
        this.numConnections = randomElement([1,1,1,1,2,2,2,3,])
    }
    addDoor(dir : number, to : Room) {
        this.freeDoor(dir, true);
        this.exits[dir] = to;
    }
    freeDoor(dir : number, addBlocks : boolean = false) {
        if (dir == 0 || dir == 2) { // north
            this.walls.splice(dir ? gridSize*gridSize-12 : 8,4,0,0,0,0);
            if (addBlocks) {
                this.walls.splice(dir ? gridSize*gridSize-11-gridSize*3 : 9+gridSize*3,2,4,4);
            }
        } else {
            for (var i = 0; i < 4; i++) {
                var p = gridSize*(8+i) + (dir == 1 ? gridSize-1 : 0);
                this.walls[p]=0;
                if (addBlocks) {
                    this.walls[p+3*(dir == 1 ? -1 : 1)]= i == 0 || i == 3 ? 0 : 4;
                }
            }
        }
    }
    blockDoor(dir : number) {
        if (!this.exits[dir]) { return; }
        if (dir == 0 || dir == 2) { // north
            this.walls.splice(dir ? gridSize*gridSize-12 : 8,4,5,5,5,5);
        } else {
            for (var i = 0; i < 4; i++) {
                var p = gridSize*(8+i) + (dir == 1 ? gridSize-1 : 0);
                this.walls[p]=6;
            }
        }
    }
    setAsExitRoom() {
        for (var y = 1; y < gridSize-1; y++) {
            for (var x = 1; x < gridSize-1; x++) {
                this.walls[y*gridSize + x] = 0;
            }
        }
        this.items = {};
        this.exitRoom = true;
        var wallSet = [[9,9,7],[9,10,7],[10,9,7],[10,10,7],
                        [9,8,4],[10,8,4],[9,11,4],[10,11,4],
                        [8,9,4],[8,10,4],[11,9,4],[11,10,4],
                        [8,7,5],[9,7,5],[10,7,5],[11,7,5],
                        [8,12,5],[9,12,5],[10,12,5],[11,12,5],
                        [7,8,6],[7,9,6],[7,10,6],[7,11,6],
                        [12,8,6],[12,9,6],[12,10,6],[12,11,6]
                      ]
        wallSet.forEach(pos => {
            this.walls[this.index(pos[0],pos[1])] = pos[2];
        })
        this.entities = new EntityList();
        for (var i = 0; i < 6; i++) {
            this.addExitMonster();
        }
    }
    addExitMonster() {
        var loc = randomElement([[2,2],[18,18],[2,18],[18,2]])
        var m = this.entities.addMember(Math.random() > 0.1 ? new GameEntity() : new MiniBoss());
        m.x = loc[0]; m.y = loc[1];
    }
    generateBlocks() {
        var wallSet = randomElement([[[6,6],[13,6],[6,13],[13,13]],
            [[5,10],[6,9],[7,10],[12,9],[13,10],[14,9]],
            [[1,7],[2,7],[3,7],[4,7],[5,7],[18,12],[17,12],[16,12],[15,12],[14,12]],
            [[3,3],[4,4],[16,3],[15,4],[3,16],[4,15],[16,16],[15,15]]
        ]);
        wallSet.forEach(pos => {
            this.walls[this.index(pos[0],pos[1])] = 4
        })
        var n_hearts = Math.min(randInt(wallSet.length*2/3),Math.floor(wallSet.length/4));
        while (n_hearts > 0) {
            var wall = randomElement(wallSet);
            this.items[this.index(wall[0],wall[1])] = new Heart(this.x, this.y);
            wallSet.splice(wallSet.indexOf(wall),1);
            n_hearts--;
        }
    }
    generateMonsters() {
        var n = this.artifact ? 1 : randRange(3,6) + (this.trapRoom ? 4 : 0);
        while (n > 0) {
            var x = randRange(2,gridSize-2);
            var y = randRange(2,gridSize-2);
            var monster = this.artifact ? new MiniBoss() : new GameEntity();
            if (!this.collides(x, y, monster.width/2, monster)) {
                this.entities.addMember(monster);
                monster.x = x;
                monster.y = y;
                n--;
            }
        }
    }
    dropArtifact(location : GameEntity) {
        if (!this.artifact) { return; }
        artyDrop();
        this.items[this.index(location.x, location.y)] = this.artifact;
    }
    draw(dx : number = 0, dy : number = 0, showItems : boolean = true) {
        this.walls.forEach((value, index) => {
            var x = (index % gridSize);
            var y = Math.floor(index / gridSize);
            if (value) {
                if (value >4 && value < 7) {
                    drawSprite(wallStopSprites[value-5], x + dx, y + dy);
                } else if (value === 7) {
                    drawSprite(warpSprites[0+Math.floor((genericTimer*4+x+y) % 2)], x + dx, y + dy);
                } else {
                    drawSprite(value == 1 ? wallSprites[0] : wallSprites[4-value], x + dx, y + dy);
                }
            } else if (showItems && index in this.items) {
                drawSprite(this.items[index].sprite, x, y, true);
            }
        });
        if (this.exitRoom && !this.exitOpened && !rooms.inTransition) {
            font(14)
            fill("#FFFFFF");
            text(""+(Math.floor(this.exitRoomTimer.remaining)), 0.5, 0.225);
        }
    }
    update(player : GameEntity) {
        if (this.exitRoom) {
            if (this.exitRoomSpawnTimer.check()) {
                this.addExitMonster();
            }
            if (!this.exitOpened && this.exitRoomTimer.check()) {
                this.walls.forEach((w,index) => {
                    if (w == 5 || w == 6) {
                        this.walls[index] = 0;
                    }
                })
                for (var i = 0; i < 4; i++) {
                    this.blockDoor(i);
                }
                this.exitOpened = true;
            }
        }
        this.entities.update(this,player);
        if (this.entities.members.length == 0 && this.trapRoom) {
            for (var i = 0; i < 4; i++) {
                if (this.exits[i]) { this.freeDoor(i); }
            }
        }
    }
    onEnter() {
        this.exitRoomTimer.reset();
        this.exitRoomSpawnTimer.reset();
        if (this.trapRoom) {
            for (var i = 0; i < 4; i++) {
                this.blockDoor(i);
                doors();
            }
        }
    }
    outOfBounds(x : number, y : number, width : number) : number {
        if (y-width < 0) { 
            return 0;
        }
        if (x+width > gridSize) {
            return 1;
        }
        if (y+width > gridSize) {
            return 2;
        }
        if (x-width < 0) {
            return 3;
        }
        return -1;
    }
    blocks(x : number, y : number) {
        return this.at(x,y) !== 0;
    }
    at (x: number, y : number) {
        return this.walls[this.index(x,y)];
    }
    index(x: number, y : number) {
        return Math.floor(y)*gridSize+Math.floor(x);
    }
    touchesItem(player : GameEntity) {
        var x = player.x; var y = player.y; var halfWidth = player.width/2;
        for (var i = -halfWidth; i <= halfWidth; i+=2*halfWidth) {
            for (var j = -halfWidth; j <= halfWidth; j+=2*halfWidth) {
                var index = this.index(x+i,y+j);
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
    }
    collides(x : number, y : number, halfWidth : number, thing : GameEntity) {
        var isBall = thing instanceof Ball;
        for (var i = -halfWidth; i <= halfWidth; i+=2*halfWidth) {
            for (var j = -halfWidth; j <= halfWidth; j+=2*halfWidth) {
                var idx = this.index(x+i,y+j);
                if (this.blocks(x+i,y+j)) {
                    if (isBall && this.walls[idx] == 2) {
                        this.walls[idx] = 0;
                    } else if (isBall && this.walls[idx] > 2 && this.walls[idx] < 5) {
                        this.walls[idx]--;
                    } else if (this.walls[idx] == 7 && thing instanceof Player) {
                        gamewon = true;
                    }
                    return true;
                }
            }
        }
        return false;
    }
}

class DummyRoom extends Room {
    constructor(x : number, y: number) {
        super(x,y);
        this.numConnections = 0;
    }
}

function connect(r1 : Room, r2 : Room) {
    var dx = r2.x-r1.x;
    var dy = r2.y-r1.y;
    var dir = dx > 0 ? 1 : dx < 0 ? 3 : dy < 0 ? 0 : 2;
    r1.addDoor(dir, r2);
    r2.addDoor((dir+2) % 4, r1);
}

class RoomCollection {
    rooms : Room[] = [];
    get activeRoom() : Room {
        return this._activeRoom;
    }
    set activeRoom(value) {
        value.explored = true;
        value.spotted = true;
        value.exits.forEach(exit => {
            if (exit) { exit.spotted = true; };
        })
        this._activeRoom = value;
    }
    _activeRoom : Room;
    nextRoom : Room;
    transitionTimer : Timer = new Timer(1);
    warpTimer : Timer = new Timer(1.75);
    inTransition : boolean = false;
    warping : boolean = false;
    lastColor : string;
    nextColor : string;
    vx : number = 0;
    vy : number = 0;
    dir : number = 0;
    map : Room[][] = [];
    artifacts : Item[] = [];
    drawEntities : boolean = true;
    lastRootChord : number = rootChord;
    nextRootChord : number = rootChord;
    constructor() {
        this.reset();
    }
    reset() {
        this.generateArtifacts();
        this.clearMap();
        var x = Math.floor(mapSize/2);
        var y = x;
        this.add(x,y);
        this.map[x][y].numConnections++;
        this.spawnMap();
        this.activeRoom = this.map[x][y];
        this.activeRoom.entities = new EntityList();
    }
    generateArtifacts() {
        //this.artifacts = [new Cannon(Math.floor(mapSize/2),Math.floor(mapSize/2)-1) ];
        
        this.artifacts = [ new Shield(randInt(mapSize), randInt(Math.floor(mapSize/4))), new Cannon(randInt(Math.floor(mapSize/3)), randRange(Math.floor(mapSize*2/3),mapSize)), new Ring(randRange(Math.floor(mapSize*2/3),mapSize),randRange(Math.floor(mapSize*2/3),mapSize))];
    }
    add(x : number, y : number) {
        this.map[x][y] = new Room(x,y);
        this.map[x][y].manager = this;
        this.rooms.push(this.map[x][y]);
    }
    onTransitionEnd(dir : number, pushIn? : boolean) : void {}
    update() : boolean {
        if (this.inTransition) {
            if (this.nextRoom && this.transitionTimer.fraction === 1.0) {
                this.activeRoom = this.nextRoom;
                this.activeRoom.entities.members.forEach(entity => entity.refreshTimers());
                this.nextRoom = undefined;
                this.inTransition = false;
                this.onTransitionEnd(this.dir, true);
                this.activeRoom.onEnter();
            } else if (!this.nextRoom && this.warpTimer.fraction === 1.0) {
                this.inTransition = false;
                this.onTransitionEnd(this.dir, true);
                this.activeRoom.onEnter();
            }
            rootChord = this.lastRootChord*(1-this.warpTimer.fraction)+this.nextRootChord*this.warpTimer.fraction;
            return true;
        }
        return false;
    }
    updateEntities(player : GameEntity) : void {
        this.activeRoom.update(player);
    }
    draw() {
        if (this.inTransition && this.nextRoom) {
            var frac = this.transitionTimer.fraction;
            this.activeRoom.draw(this.vx*frac*gridSize,this.vy*frac*gridSize, false);
            this.nextRoom.draw(this.vx*(frac-1)*gridSize,this.vy*(frac-1)*gridSize, false);
        } else if (this.inTransition) {
            var time = this.warpTimer.progress;

            this.activeRoom.draw();

            this.drawEntities = time < .5;

            if (time > .5) {
                if (this.warping) {
                    this.spawnDimension();
                    this.warping = false;
                }
                overlay(this.lastColor,(1-this.warpTimer.fraction));

                font(12);
                var text = "DIMENSION WARP";
                fill(multiply("#FFFFFF",this.warpTimer.fraction));
                for (var i = 0; i < text.length; i++) {
                    context.fillText(text.substr(i,1),gridSize*pixelsPerWorldUnit/5+pixelsPerWorldUnit*(i+Math.random()*0.15),gridSize*pixelsPerWorldUnit/2+pixelsPerWorldUnit*(Math.random()-0.25));
                }
            }
            if (this.drawEntities) {
                this.activeRoom.entities.draw();
            }
            
            overlay("#FFFFFF",time <.5 ? 0.0 : (1-(time-.5)/.5));
        } else {
            this.activeRoom.draw();
            this.activeRoom.entities.draw();
        }
    }
    drawMap() {
        overlay("#000000",0.55);
        context.fillRect(4*pixelsPerWorldUnit,3*pixelsPerWorldUnit,(gridSize-8)*pixelsPerWorldUnit,(gridSize-6)*pixelsPerWorldUnit);
        font(14);
        fill(bg);
        context.fillText("-  M  A  P  -",gridSize*pixelsPerWorldUnit/2,gridSize*pixelsPerWorldUnit/4+1*scale);
        var drawSize = (gridSize-10)*pixelsPerWorldUnit/mapSize;
        for (var y = 0; y < mapSize; y++) { // draw map grid
            for (var x = 0; x < mapSize; x++) {
                fill("#252525");
                context.fillRect(5*pixelsPerWorldUnit+drawSize*x,6*pixelsPerWorldUnit+drawSize*y,drawSize-scale,drawSize-scale);
            }
        }
        this.rooms.forEach(room => { // draw exits
            if (!room.explored) {return;}
            var exits = room.exits;
            fill(room.explored ? bg : multiply(bg,0.5));
            for (var i = 0; i < 4; i++) {
                if (!exits[i]) { continue; }
                var dx = (room.x+exits[i].x)/2;
                var dy = (room.y+exits[i].y)/2;
                context.fillRect(5*pixelsPerWorldUnit+drawSize*(dx+0.35)-scale/2,6*pixelsPerWorldUnit+drawSize*(dy+0.35)-scale/2,drawSize*0.3,drawSize*0.3);
            }
        })
        this.rooms.forEach(room => { // draw rooms
            if (!room.spotted) {return;}
            fill(room.explored ? bg : multiply(bg,0.5));
            context.fillRect(5*pixelsPerWorldUnit+drawSize*room.x,6*pixelsPerWorldUnit+drawSize*room.y,drawSize-scale,drawSize-scale);
            if (room == this.activeRoom && (genericTimer % 1) > 0.5) {
                fill("#FFFFFF");
                context.fillRect(5*pixelsPerWorldUnit+drawSize*(room.x+0.25),6*pixelsPerWorldUnit+drawSize*(room.y+0.25),drawSize*0.5-scale,drawSize*0.5-scale);
            }
        })
        for (var y = 0; y < mapSize; y++) { // draw artifact locations
            for (var x = 0; x < mapSize; x++) {
                this.artifacts.forEach( artifact => {
                    if ( artifact.at(x,y)) {
                        context.drawImage(artifact.sprite,5*pixelsPerWorldUnit+drawSize*(x+0.1),6*pixelsPerWorldUnit+drawSize*(y+0.1),drawSize*0.8-scale,drawSize*0.8-scale);
                    }
                })
                if (this.artifacts.length === 0 && x === mapCenter && y === mapCenter) {
                    context.drawImage(exitSprite,5*pixelsPerWorldUnit+drawSize*(x+0.1),6*pixelsPerWorldUnit+drawSize*(y+0.1),drawSize*0.8-scale,drawSize*0.8-scale);
                }
            }
        }
    }
    transition(dir : number) {
        this.dir = dir;
        this.inTransition = true;
        this.drawEntities = false;
        this.vx = [0, -1, 0, 1][dir];
        this.vy = [1, 0, -1, 0][dir];
        this.nextRoom = this.activeRoom.exits[dir];
        this.transitionTimer.reset();
    }
    teleport(dir : number, color : string) {
        this.dir = dir;
        this.drawEntities = true;
        this.nextColor = color;
        this.warping = true;
        this.warpTimer.reset();
        this.inTransition = true;
        
        var c = 0;
        for (var i = 0; i < 3; i++) {
            c += parseInt(color[i*2+1],16)/3
        }
        this.lastRootChord = rootChord;
        this.nextRootChord = chords[Math.floor(c-8)];
    }
    spawnDimension() {
        this.lastColor = bg;
        bg = multiply(this.nextColor, 0.8);
        this.clearMap();
        this.add(this.activeRoom.x,this.activeRoom.y);
        this.grow(this.rooms[0], this.dir)
        this.spawnMap();
        this.activeRoom = this.rooms[1];
    }
    checkForExit() {
        if (this.artifacts.length === 0) {
            this.rooms.forEach((room, index) => {
                if (room.x == mapCenter && room.y == mapCenter) {
                    room.setAsExitRoom();
                }
            })
        }
    }
    get availableConnections() : number {
        var n = 0;
        this.rooms.forEach(value => {n += value.numConnections; });
        return n;
    }
    grow(room : Room, dir : number) {
        var dx = [0, 1, 0, -1][dir];
        var dy = [-1, 0, 1, 0][dir];
        dx += room.x;
        dy += room.y;
        if (!this.hasAt(dx,dy)) {
            this.add(dx,dy);
        }
        connect(room, this.map[dx][dy]);
    }
    hasAt(x : number, y : number) {
        return !(this.map[x][y] instanceof DummyRoom)
    }
    spawnMap() {
        while (this.availableConnections > 0) {
            this.rooms.forEach(value => {
                if (value.numConnections > 0) {
                    var dir = value.getGrowthDir();
                    value.numConnections--;
                    var dx = [0, 1, 0, -1][dir];
                    var dy = [-1, 0, 1, 0][dir];
                    if (!this.hasAt(value.x+dx,value.y+dy) || Math.random() < 0.5) {
                        this.grow(value, dir);
                    }
                }
            })
        }
        this.rooms.forEach(room => {
            room.generateBlocks(); // and hearts!
            this.artifacts.forEach( artifact => {
                if ( artifact.at(room.x,room.y)) {
                    room.artifact = artifact;
                }
            })
            room.generateMonsters();
        });
        this.checkForExit();
    }
    acquireItem(item) {
        var n = this.artifacts.indexOf(item);
        if (n === -1) { return; }
        this.artifacts.splice(n,1);
        this.checkForExit();
        if (this.artifacts.length == 0) {
            showEndDialogue = true;
        }
    }
    clearMap() {
        this.rooms = [];
        this.map = [];
        for (var i = 0; i < mapSize; i++) {
            this.map[i] = [];
            for (var j = 0; j < mapSize; j++) {
                this.map[i].push(new DummyRoom(j,i));
            }
        }
    }
}

var rooms : RoomCollection = new RoomCollection();