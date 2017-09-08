/// <reference path="config.ts" />
var audioContext = new (window.AudioContext || window.webkitAudioContext)();
var rootChord = 440;
var chords = [311.13, 349.23, 392, 440, 523.25, 659.25];
var Instrument = (function () {
    function Instrument(type, volume) {
        this.type = type;
        this.volume = volume;
    }
    Instrument.prototype.play = function (note, duration) {
        var osc = audioContext.createOscillator();
        var gain = audioContext.createGain();
        osc.type = this.type;
        osc.start(audioContext.currentTime);
        osc.connect(gain);
        gain.gain.setValueAtTime(zeroGain, audioContext.currentTime);
        gain.connect(audioContext.destination);
        osc.frequency.setValueAtTime(calcNote(rootChord, note), audioContext.currentTime);
        var volumeScale = paused ? 0.4 : 1.0;
        gain.gain.setValueAtTime(this.volume * globalMusicVolume * volumeScale, audioContext.currentTime);
        gain.gain.setValueAtTime(this.volume * globalMusicVolume * volumeScale, audioContext.currentTime + duration * 2 / 3);
        gain.gain.exponentialRampToValueAtTime(zeroGain, audioContext.currentTime + duration);
        gain.connect(audioContext.destination);
        osc.stop(audioContext.currentTime + duration);
    };
    return Instrument;
}());
var Sequence = (function () {
    function Sequence(length, sequence, rootNote, type, volume) {
        if (rootNote === void 0) { rootNote = 0; }
        if (type === void 0) { type = 'sine'; }
        if (volume === void 0) { volume = 1.0; }
        this.length = length;
        this.sequence = sequence;
        this.rootNote = rootNote;
        this.instrument = new Instrument(type, volume);
    }
    Sequence.prototype.update = function (position, duration) {
        if (position % this.length !== 0) {
            return;
        }
        var num = Math.floor(position / this.length) % this.sequence.length;
        var note = this.sequence[num];
        if (note === "-" || note === "_") {
            return;
        }
        var i = 1;
        while (this.sequence[num + i] === "-") {
            i++;
        }
        this.instrument.play(this.rootNote + parseInt(note, 16), duration * this.length * i);
    };
    return Sequence;
}());
var Song = (function () {
    function Song(bpm, sequences) {
        var _this = this;
        this.bpm = bpm;
        this.sequences = sequences;
        this.position = 0;
        this.length = 0;
        sequences.forEach(function (seq) {
            _this.length = Math.max(_this.length, seq.sequence.length * seq.length);
        });
    }
    Song.prototype.update = function () {
        var _this = this;
        this.sequences.forEach(function (seq) {
            seq.update(_this.position, 60 / _this.bpm);
        });
        this.position++;
        this.position %= this.length;
        this.playing = setTimeout(function () { return _this.update(); }, 60000 / this.bpm);
    };
    Song.prototype.play = function () {
        var _this = this;
        this.playing = setTimeout(function () { return _this.update(); }, 60000 / this.bpm);
    };
    Song.prototype.stop = function () {
        clearTimeout(this.playing);
        this.position = 0;
    };
    return Song;
}());
var dungeonTheme = new Song(60 * 4, [
    new Sequence(2, "0_43--__0_65--__", -12, 'square', 0.15),
    new Sequence(1, "ccccccccaaaaffff", -36, 'sine'),
    new Sequence(1, "777777775555aaaa", -24, 'sine', 0.8),
    new Sequence(1, repeat("_", 96) + "03C--bcbc5-6-3----" + repeat("_", 14) + "03C--bcbc3-4-0----" + repeat("_", 14), 0, "triangle", 0.35),
    new Sequence(1, repeat("_", 32) + "03C" + repeat("_", 29), -12, 'sawtooth', 0.4),
]);
var titleTheme = new Song(60 * 4, [
    new Sequence(4, "2-__0-__", -36, 'triangle', 0.6),
    new Sequence(2, "c7c7c7c7a5a5a5a5", -24, 'sine', 0.3),
    new Sequence(1, repeat("_", 32) + "____237---__________230---______", 12, 'square', 0.1)
]);
