class Line {
    get length() : number {
        return magnitude(this.x2-this.x1, this.y2-this.y1);
    }
    get direction() : vector {
        return {
            x: (this.x2-this.x1)/this.length,
            y: (this.y2-this.y1)/this.length
        }
    }
    constructor(public x1 : number, public y1 : number, public x2 : number, public y2 : number) { }
    capped(dist : number) {
        if (this.length < dist) {
            return this;
        } else {
            return new Line(this.x1, this.y1, this.x1+this.direction.x*dist, this.y1+this.direction.y*dist)
        }
    }
    rot90() : Line {
        return new Line(this.x1, this.y1, this.x1+(this.y2-this.y1), this.y1-(this.x2-this.x1));
    }
    rot180() : Line {
        return new Line(this.x1, this.y1, this.x1-(this.x2-this.x1), this.y1-(this.y2-this.y1));
    }
    rot270() : Line {
        return this.rot90().rot180();
    }
}

class Collision {
    distance : number;
    direction : vector;
    constructor(public x : number, public y : number, referencePoint : vector) {
        var dx = referencePoint.x-x;
        var dy = referencePoint.y-y;
        this.distance = magnitude(dx,dy);
        this.direction = {x : 0, y: 0}
        if (this.distance !== 0) {
            this.direction = {x: dx/this.distance, y: dy/this.distance};
        }
    }
}

function unitVector(v : vector) : vector {
    var d = magnitudeVector(v);
    if (d == 0) {
        return {x: 0, y: 0};
    }
    return {x: v.x/d, y: v.y/d}
}

function magnitudeVector(v : vector) : number {
    return magnitude(v.x,v.y);
}

function magnitude(x : number, y : number ) : number {
    return Math.sqrt(x*x+y*y);
}

function getNearestPoint(line : Line, point : vector) : Collision {
    var v1 = [point.x-line.x1, point.y-line.y1];
    var projection = line.direction.x*v1[0] + line.direction.y*v1[1];
    projection = Math.min(Math.max(projection, 0), line.length);
    return new Collision(line.x1 + line.direction.x*projection, line.y1 + line.direction.y*projection, point);
}