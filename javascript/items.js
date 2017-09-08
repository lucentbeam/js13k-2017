/// <reference path="config.ts" />
var __extends = (this && window.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var Item = (function () {
    function Item(x, y) {
        this.x = x;
        this.y = y;
        this.description = [];
    }
    Item.prototype.at = function (x, y) { return this.x == x && this.y == y; };
    Item.prototype.got = function (player) { };
    return Item;
}());
var Shield = (function (_super) {
    __extends(Shield, _super);
    function Shield() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.sprite = shieldSprite;
        _this.name = "SHIELD GENERATOR";
        _this.description = ["This small generator produces a", "shield that can absorb enemy attacks.", "Move around to charge it up!"];
        return _this;
    }
    Shield.prototype.got = function (player) { player.hasShield = true; player.shieldSteps = 0; };
    return Shield;
}(Item));
var Ring = (function (_super) {
    __extends(Ring, _super);
    function Ring() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.sprite = ringSprite;
        _this.name = "GEMINI RING";
        _this.description = ["This ring splits the hyperdimensional", "sphere into a smaller and faster pair.", "Wild times ahead!"];
        return _this;
    }
    Ring.prototype.got = function (player) { splitBall(); };
    return Ring;
}(Item));
var Cannon = (function (_super) {
    __extends(Cannon, _super);
    function Cannon() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.sprite = cannonSprite;
        _this.name = "HYPER CANNON";
        _this.description = ["This powerful cannon has twice as", "many dimensions as your old one.", "Come get some!"];
        return _this;
    }
    Cannon.prototype.got = function (player) { player.hasCannon = true; };
    return Cannon;
}(Item));
var Heart = (function (_super) {
    __extends(Heart, _super);
    function Heart() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.sprite = heartSprites[0];
        return _this;
    }
    Heart.prototype.got = function (player) { player.life++; };
    return Heart;
}(Item));
var lastItem;
function acquireItem(item) {
    lastItem = item;
    showDialogue = true;
}
function drawDialogue() {
    overlay("#000000", 0.55);
    context.fillRect(3.5 * pixelsPerWorldUnit, 5.75 * pixelsPerWorldUnit, (gridSize - 7) * pixelsPerWorldUnit, (gridSize - 13.75) * pixelsPerWorldUnit);
    context.font = "" + (pixelsPerWorldUnit) + "px Garamond";
    fill(bg);
    context.textAlign = "left";
    context.fillText(lastItem.name, 4.25 * pixelsPerWorldUnit, 7.25 * pixelsPerWorldUnit);
    context.font = "" + (5.5 * scale) + "px Garamond";
    lastItem.description.forEach(function (line, index) {
        context.fillText(line, 4.25 * pixelsPerWorldUnit, (9 + index) * pixelsPerWorldUnit);
    });
    drawSprite(lastItem.sprite, gridSize - 5.25, 6.4, true);
    context.fillRect(4.25 * pixelsPerWorldUnit, 7.75 * pixelsPerWorldUnit, (gridSize - 8.8) * pixelsPerWorldUnit, 0.5 * scale);
}
function drawEndDialogue() {
    overlay("#000000", 0.55);
    context.fillRect(3.5 * pixelsPerWorldUnit, 7.25 * pixelsPerWorldUnit, (gridSize - 7) * pixelsPerWorldUnit, (gridSize - 16.9) * pixelsPerWorldUnit);
    context.font = "" + (pixelsPerWorldUnit) + "px Garamond";
    fill(bg);
    context.textAlign = "center";
    context.fillText("-     EXIT ACTIVATED     -", (gridSize / 2) * pixelsPerWorldUnit, (gridSize / 2 - 0.9) * pixelsPerWorldUnit);
    context.fillRect(4.45 * pixelsPerWorldUnit, 7.75 * pixelsPerWorldUnit, (gridSize - 8.8) * pixelsPerWorldUnit, 0.5 * scale);
    context.fillRect(4.45 * pixelsPerWorldUnit, 9.75 * pixelsPerWorldUnit, (gridSize - 8.8) * pixelsPerWorldUnit, 0.5 * scale);
}
