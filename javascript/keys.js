var keys = {};
listen('keydown', function (e) { keys[e.which] = true; });
listen('keyup', function (e) { delete keys[e.which]; });
var lastPause = performance.now();
var Gamepads = (function () {
    function Gamepads() {
        this.x = 0;
        this.y = 0;
        this.right = { x: 0, y: 0 };
        this.pause = false;
        var gp = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads : []);
        for (var i = 0; i < gp.length; i++) {
            if (gp[i] != null && gp[i].id.substr(0, 8) == "Xbox 360") {
                var get = function (axis) { return Math.abs(gp[i].axes[axis]) > 0.2 ? gp[i].axes[axis] : 0; };
                this.x += get(0);
                this.y += get(1);
                this.right.x += get(2);
                this.right.y += get(3);
                this.pause |= ((gp[i].buttons[9].pressed || gp[i].buttons[0].pressed) && (performance.now() - lastPause) > 200); // TYPESCRIPT Y U NO |=
            }
        }
        //this.right = unitVector(this.right);
        if (this.pause) {
            lastPause = performance.now();
            pausePressed();
        }
    }
    return Gamepads;
}());
var gamepad;
function updateGamepads() {
    gamepad = new Gamepads();
    requestAnimationFrame(updateGamepads);
}
updateGamepads();
function directions(magnitude) {
    if (magnitude === void 0) { magnitude = 1; }
    var input = {
        x: magnitude * (keys[39] || keys[68] || 0) - magnitude * (keys[37] || keys[65] || keys[81] || 0) + magnitude * gamepad.x,
        y: magnitude * (keys[40] || keys[83] || 0) - magnitude * (keys[38] || keys[87] || keys[90] || 0) + magnitude * gamepad.y
    };
    if (input.x != 0 && input.y != 0) {
        input.x *= 0.71;
        input.y *= 0.71;
    }
    return input;
}
