var UI = (function () {
    function UI(x, rootFrame) {
        var _this = this;
        this.x = x;
        this.rootFrame = rootFrame;
        this.activeFrame = 0;
        this.activeFrame = rootFrame;
        listen('click', function (e) {
            var rect = canvas.getBoundingClientRect();
            var x = (e.clientX - rect.left) / rect.width * gridSize;
            var y = (e.clientY - rect.top) / rect.width * gridSize;
            if (x > _this.x && x < _this.x + 1 && y < 1) {
                _this.toggle();
            }
        });
    }
    UI.prototype.toggle = function () {
        if (this.activeFrame === this.rootFrame) {
            this.activeFrame = this.rootFrame + 1;
            this.off();
        }
        else {
            this.activeFrame = this.rootFrame;
            this.on();
        }
    };
    UI.prototype.draw = function () {
        drawSprite(uiSprites[this.activeFrame], this.x, 0, true, 0.7);
    };
    UI.prototype.off = function () { };
    UI.prototype.on = function () { };
    return UI;
}());
var musicToggle = new UI(gridSize - 2, 0);
musicToggle.off = function () { return globalMusicVolume = 0.001; };
musicToggle.on = function () { return globalMusicVolume = 0.5; };
var sfx = new UI(gridSize - 1, 2);
sfx.on = function () { return globalSFXVolume = 1.0; };
sfx.off = function () { return globalSFXVolume = 0.001; };
