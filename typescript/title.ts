/// <reference path="rooms.ts" />
/// <reference path="keys.ts" />

var bg_colors = "00111223"
var lastInput = performance.now();
class Title {

    running : boolean;
    game : boolean;
    info : boolean;
    backgroundTransition : Timer = new Timer(6);
    currentColor : string = getRandomColor("#",bg_colors);
    nextColor : string = getRandomColor("#",bg_colors);
    room : DummyRoom = new DummyRoom(0,0);

    constructor() {
        this.reset();
        this.info = true;
        this.game = false;
    }
    reset() {
        this.running = true;
        titleTheme.play();
        dungeonTheme.stop();
        this.game = true;
        this.info = false;
    }
    update() : boolean {
        if (!this.running) { return false; }
        if (!this.info && directions().x != 0 && (performance.now()-lastInput) > 200) {
            this.game = !this.game;
            lastInput = performance.now();
        }
        if (paused) {
            paused = false;
            if (this.game) {
                this.running = false;
                titleTheme.stop();
                dungeonTheme.play();
                return true;
            } else {
                this.info = !this.info;
            }
        }
        if (this.backgroundTransition.check()) {
            this.currentColor = this.nextColor;
            this.nextColor = getRandomColor("#",bg_colors);
        }
        return this.running;
    }

    draw() {
        overlay("#000000",1)
        overlay(this.currentColor,1-this.backgroundTransition.fraction);
        overlay(this.nextColor,this.backgroundTransition.fraction);
        var pulseFraction = 0.1 + Math.abs((genericTimer % 3)/3 - 0.5)*1.8;
        var pulseColor = multiply("#CCCCCC", pulseFraction )
        if (this.info) {
            this.room.draw()
            drawPlayerLife();
            fill("#999999");
            font(6);
            text("^ LIFE",0.125,0.1);
            text("AUDIO ^",0.85,0.1);

            context.textAlign = "left";
            text("MOVE:     wasd / zqsd / arrows /", 0.219, 0.26)
            text("left analogue (Xbox 360)", 0.39, 0.3)

            text("CANNON:     mouse click /", 0.17, 0.38)
            text("right analogue (Xbox 360)", 0.39, 0.42)

            text("MAP/CONFIRM:     spacebar / A (Xbox 360) /", 0.07, 0.5)
            text("pause (Xbox 360)", 0.39, 0.54)

            context.textAlign = "center"
            text("Benjamin Hanken ( @lucentbeam_ )",0.5,0.76);
            text("js13k 2017", 0.5, 0.83)

            context.globalAlpha = pulseFraction
            font(3)
            text("[ CONFIRM TO CONTINUE ]", 0.5, 0.9);
            context.globalAlpha = 1;

            fill("#CCCCCC");
            font(12);
            text("- CONTROLS -",0.5,0.18);
            text("- CREDITS -",0.5,0.68)

        } else {
            alphaWrap(pulseFraction, () => { drawSprite(titleSprites[1],8,11.5) });

            drawSprite(titleSprites[0],2.5,8.6,true); // the hero should source-over; ze is not of that dimension
            
            alphaWrap(Math.max(pulseFraction-0.1,0), () => {
                drawSprite(titleSprites[2],8,13.8);
                drawSprite(titleSprites[2],11.8,14.1);
        
                drawSprite(titleSprites[3],1.5,11.1);
                drawSprite(titleSprites[3],4.2,13.1);
        
                context.save();
                context.scale(-1,1);
                drawSprite(titleSprites[3],-16.8,13.3);
                drawSprite(titleSprites[3],-19.2,11.6);
                context.restore();
        
                var dots = [[22,65],[26,64],[40,63],[44,62],[85,57],[90,57],[113,63],[117,64],[131,72],[136,74]]
                dots.forEach(dot => drawDot(dot[0],dot[1]));

                if (this.game) {
                    fill("#999999");
                    font(3)
                    text("COLLECT ALL ARTIFACTS", 0.35, 0.45);
                }
            });
    
            fill("#CCCCCC");
            font(16);
            text("- TRAPPED -",0.5,0.12);
            font(11);
            text("HYPERDIMENSIONAL MAZE",0.5,0.2825);
            text("PLAY",0.35,0.9);
            text("INFO",0.75,0.9);
    
            font(8);
            fill("#777777");
            text("IN THE", 0.5, 0.195)
            circle(getRandomColor("#","ABCDEF"),4+(this.game ? 0 : 8),17.5,0.45);
        }
        musicToggle.draw();
        sfx.draw();
    }
}

var title = new Title();