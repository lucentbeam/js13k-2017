var State = (function () {
    function State(update_fn) {
        this.update = update_fn;
    }
    State.prototype.update = function () { return false; };
    return State;
}());
var StateManager = (function () {
    function StateManager() {
        this.activeStates = [];
        this.availableStates = {};
    }
    StateManager.prototype.activate = function (name) {
        if (this.availableStates[name]) {
            this.activeStates.unshift(this.availableStates[name]);
        }
    };
    StateManager.prototype.update = function () {
        if (!this.activeStates[0].update()) {
            this.activeStates.shift();
        }
    };
    return StateManager;
}());
var states = new StateManager();
