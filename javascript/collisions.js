var Line = (function () {
    function Line(x1, y1, x2, y2) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
    }
    Object.defineProperty(Line.prototype, "length", {
        get: function () {
            return magnitude(this.x2 - this.x1, this.y2 - this.y1);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Line.prototype, "direction", {
        get: function () {
            return {
                x: (this.x2 - this.x1) / this.length,
                y: (this.y2 - this.y1) / this.length
            };
        },
        enumerable: true,
        configurable: true
    });
    Line.prototype.capped = function (dist) {
        if (this.length < dist) {
            return this;
        }
        else {
            return new Line(this.x1, this.y1, this.x1 + this.direction.x * dist, this.y1 + this.direction.y * dist);
        }
    };
    Line.prototype.rot90 = function () {
        return new Line(this.x1, this.y1, this.x1 + (this.y2 - this.y1), this.y1 - (this.x2 - this.x1));
    };
    Line.prototype.rot180 = function () {
        return new Line(this.x1, this.y1, this.x1 - (this.x2 - this.x1), this.y1 - (this.y2 - this.y1));
    };
    Line.prototype.rot270 = function () {
        return this.rot90().rot180();
    };
    return Line;
}());
var Collision = (function () {
    function Collision(x, y, referencePoint) {
        this.x = x;
        this.y = y;
        var dx = referencePoint.x - x;
        var dy = referencePoint.y - y;
        this.distance = magnitude(dx, dy);
        this.direction = { x: 0, y: 0 };
        if (this.distance !== 0) {
            this.direction = { x: dx / this.distance, y: dy / this.distance };
        }
    }
    return Collision;
}());
function unitVector(v) {
    var d = magnitudeVector(v);
    if (d == 0) {
        return { x: 0, y: 0 };
    }
    return { x: v.x / d, y: v.y / d };
}
function magnitudeVector(v) {
    return magnitude(v.x, v.y);
}
function magnitude(x, y) {
    return Math.sqrt(x * x + y * y);
}
function getNearestPoint(line, point) {
    var v1 = [point.x - line.x1, point.y - line.y1];
    var projection = line.direction.x * v1[0] + line.direction.y * v1[1];
    projection = Math.min(Math.max(projection, 0), line.length);
    return new Collision(line.x1 + line.direction.x * projection, line.y1 + line.direction.y * projection, point);
}
