var globalSFXVolume = 1.0;
var Noise = (function () {
    function Noise(frequency, duration, gainEnvelope) {
        this.duration = duration;
        this.gainEnvelope = gainEnvelope;
        var bufferLength = audioContext.sampleRate / frequency;
        this.node = audioContext.createBufferSource();
        var buffer = audioContext.createBuffer(1, bufferLength, audioContext.sampleRate), data = buffer.getChannelData(0);
        for (var i = 0; i < bufferLength; i++) {
            data[i] = Math.random();
        }
        this.node.buffer = buffer;
        this.node.loop = true;
        this.gain = audioContext.createGain();
        this.node.start(audioContext.currentTime);
        this.node.connect(this.gain);
        this.gain.gain.setValueAtTime(zeroGain, audioContext.currentTime);
        this.gain.connect(audioContext.destination);
    }
    Noise.prototype.play = function () {
        this.gain.gain.setValueAtTime(globalSFXVolume, audioContext.currentTime);
        for (var i = 0; i < this.gainEnvelope.length; i++) {
            this.gain.gain.exponentialRampToValueAtTime(this.gainEnvelope[i][0] * globalSFXVolume, audioContext.currentTime + this.duration * this.gainEnvelope[i][1]);
        }
        this.gain.gain.exponentialRampToValueAtTime(zeroGain, audioContext.currentTime + this.duration);
    };
    return Noise;
}());
var Sound = (function () {
    function Sound(type, duration, frequencyEnvelope, gainEnvelope, baseFreq, bend) {
        if (baseFreq === void 0) { baseFreq = 440; }
        if (bend === void 0) { bend = true; }
        this.duration = duration;
        this.frequencyEnvelope = frequencyEnvelope;
        this.gainEnvelope = gainEnvelope;
        this.baseFreq = baseFreq;
        this.bend = bend;
        this.osc;
        this.osc = audioContext.createOscillator();
        this.gain = audioContext.createGain();
        this.osc.type = type;
        this.osc.start(audioContext.currentTime);
        this.osc.connect(this.gain);
        this.gain.gain.setValueAtTime(zeroGain, audioContext.currentTime);
        this.gain.connect(audioContext.destination);
    }
    Sound.prototype.play = function () {
        this.osc.frequency.setValueAtTime(calcNote(this.baseFreq, this.frequencyEnvelope[0][0]), audioContext.currentTime);
        for (var i = 0; i < this.frequencyEnvelope.length; i++) {
            if (this.bend) {
                this.osc.frequency.exponentialRampToValueAtTime(calcNote(this.baseFreq, this.frequencyEnvelope[i][0]), audioContext.currentTime + this.duration * this.frequencyEnvelope[i][1]);
            }
            else {
                this.osc.frequency.setValueAtTime(calcNote(this.baseFreq, this.frequencyEnvelope[i][0]), audioContext.currentTime + this.duration * this.frequencyEnvelope[i][1]);
            }
        }
        this.gain.gain.setValueAtTime(globalSFXVolume, audioContext.currentTime);
        for (var i = 0; i < this.gainEnvelope.length; i++) {
            this.gain.gain.exponentialRampToValueAtTime(this.gainEnvelope[i][0] * globalSFXVolume, audioContext.currentTime + this.duration * this.gainEnvelope[i][1]);
        }
        this.gain.gain.exponentialRampToValueAtTime(zeroGain, audioContext.currentTime + this.duration);
    };
    return Sound;
}());
var registeredSounds = {
    'ballBomp': new Sound('triangle', 0.7, [[0, 0], [12, 0.2], [0, 0.4], [12, 0.6], [0, 0.8], [12, 1.0]], [[1.0, 0.0]], 240),
    'laserHit': new Sound('sawtooth', 0.2, [[0, 0]], [[0.1, 0], [0.1, 0.7], [1.0, 0.8]], 540),
    'bulletHit': new Sound('square', 0.2, [[0, 0]], [[1.0, 0]], 540),
    'monsterHit': new Sound('square', 0.5, [[0, 0], [24, 0.3], [0, 0.8]], [[1.0, 0.0]], 30),
    'artyDrop': new Sound('sine', 1, [[12, 0], [24, 0.2], [12, 0.35], [24, 0.5]], [[0.5, 0.0], [1.0, 0.5], [1.0, 0.6]], 440, false),
    'item1': new Sound('sine', 0.2, [[12, 0], [12, 0.49], [24, 0.5], [24, 1.0]], [[1.0, 0], [0.01, 0.49], [1.0, 0.5]], 440),
    'item2': new Sound('sine', 0.2, [[19, 0], [19, 0.49], [31, 0.5], [31, 1.0]], [[1.0, 0], [0.01, 0.49], [1.0, 0.5]], 440),
    'warp1': new Sound('square', 2.0, [[0, 0], [7, 0.25], [12, 0.5]], [[1.0, 0.0], [0.01, 0.24], [1.0, 0.25], [0.01, 0.49], [1.0, 0.5], [1.0, 0.55]], 40),
    'warp2': new Sound('sawtooth', 1.5, [[24, 0], [31, 0.33], [36, 0.66]], [[1.0, 0.0], [0.01, 0.32], [1.0, 0.33], [0.01, 0.65], [1.0, 0.66]], 40),
    'bossHit1': new Sound('square', 1.0, [[12, 0]], [[1.0, 0.0], [0.3, 0.5]], 50),
    'bossHit2': new Sound('sawtooth', 1.0, [[48, 0], [0, 1.0]], [[1.0, 0.0], [0.3, 0.5]], 50),
    'close1': new Noise(60, 0.1, [[1.0, 0.0], [1.0, 0.9]]),
    'close2': new Noise(30, 0.4, [[1.0, 0.0], [0.5, 0.3], [0.5, 0.8]]),
    'playerHit': new Noise(440, 0.4, [[1.0, 0.0], [0.5, 0.5]])
};
function playSound(snd) {
    return function () { return registeredSounds[snd].play(); };
}
var ballBomp = playSound('ballBomp');
var laserHit = playSound('laserHit');
var bulletHit = playSound('bulletHit');
var monsterHit = playSound('monsterHit');
var artyDrop = playSound('artyDrop');
var playerHit = playSound('playerHit');
function getItem() {
    playSound('item1')();
    playSound('item2')();
}
function warpSound() {
    playSound('warp1')();
    playSound('warp2')();
}
function bossHit() {
    playSound('bossHit1')();
    playSound('bossHit2')();
}
function doors() {
    playSound('close1')();
    playSound('close2')();
}
