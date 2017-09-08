class UI {
    activeFrame : number = 0;
    constructor(public x : number, public rootFrame : number) {
        this.activeFrame = rootFrame;
        listen('click', e=> {
            var rect = canvas.getBoundingClientRect();
            var x = (e.clientX - rect.left)/rect.width*gridSize;
            var y = (e.clientY - rect.top)/rect.width*gridSize;
            if (x > this.x && x < this.x+1 && y < 1) {
                this.toggle();
            }
        })
    }
    toggle() {
        if (this.activeFrame === this.rootFrame) {
            this.activeFrame = this.rootFrame+1
            this.off();
        } else {
            this.activeFrame = this.rootFrame;
            this.on();
        }
    }
    draw() {
        drawSprite(uiSprites[this.activeFrame],this.x, 0, true, 0.7);
    }
    off() {}
    on() {}
}

var musicToggle = new UI(gridSize-2, 0);
musicToggle.off = () => globalMusicVolume = 0.001;
musicToggle.on = () => globalMusicVolume = 0.5;

var sfx = new UI(gridSize-1, 2);
sfx.on = () => globalSFXVolume = 1.0;
sfx.off = () => globalSFXVolume = 0.001;