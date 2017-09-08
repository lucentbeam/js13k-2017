class State {
    constructor(update_fn) {
        this.update = update_fn;
    }
    update() : boolean { return false; }
}

class StateManager {
    activeStates : State[] = [];
    availableStates : { [name: string] : State } = {};

    activate(name: string) { 
        if (this.availableStates[name]) {
            this.activeStates.unshift(this.availableStates[name]);
        }
    }

    update() {
        if (!this.activeStates[0].update()) {
            this.activeStates.shift();
        }
    }
}

var states : StateManager = new StateManager();