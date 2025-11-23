// https://github.com/mixxxdj/mixxx/wiki/midi%20scripting
// Example MIDI Msg : status 0x94 (ch 5, opcode 0x9), ctrl 0x03, val 0x01

var MixstreamPro = {};

MixstreamPro.settings = {
    stutterPlayOnShiftPlay: true,
    hotCueWhilePlaying: true,
};

// Init Hotcue variables - Deck state containers
MixstreamPro.deck = {
    1: {
        blinktimer: 0,
        hotcuevalue: 0,
        LEDblink: true,
        midiStatus: 0x92,
        channel: "[Channel1]",
        auxChannel: "[Auxiliary2]",
        Hotcue_Toggle: true,
        AutoloopToggle: false,
        BeatloopRollToggle: false,
        slipenabledToggle: false,
        previousJogValue: 0
    },
    2: {
        blinktimer: 0,
        hotcuevalue: 0,
        LEDblink: true,
        midiStatus: 0x93,
        channel: "[Channel2]",
        auxChannel: "[Auxiliary1]",
        Hotcue_Toggle: true,
        AutoloopToggle: false,
        BeatloopRollToggle: false,
        slipenabledToggle: false,
        previousJogValue: 0
    }
};

// Pitch slider Pot components for 14-bit precision
MixstreamPro.pitchSlider1 = new components.Pot({
    midi: [0xB2, 0x1F],
    group: '[Channel1]',
    inKey: 'rate',
    inValueScale: function (value) {
        // Invert: 0 -> 1, 1 -> 0
        return 1 - (value / 16384);
    },
});

MixstreamPro.pitchSlider2 = new components.Pot({
    midi: [0xB3, 0x1F],
    group: '[Channel2]',
    inKey: 'rate',
    inValueScale: function (value) {
        // Invert: 0 -> 1, 1 -> 0
        return 1 - (value / 16384);
    },
});

MixstreamPro.init = function (id, debugging) {
    // Init Callbacks
    // VuMeters
    engine.makeConnection("[Master]", "VuMeterL", MixstreamPro.vuCallback);
    engine.makeConnection("[Master]", "VuMeterR", MixstreamPro.vuCallback);
    // TrackLoaded
    engine.makeConnection("[Channel1]", "track_loaded", MixstreamPro.trackLoadedCallback);
    engine.makeConnection("[Channel2]", "track_loaded", MixstreamPro.trackLoadedCallback);
    // TrackPlaying
    engine.makeConnection("[Channel1]", "play_indicator", MixstreamPro.playIndicatorCallback11);
    engine.makeConnection("[Channel2]", "play_indicator", MixstreamPro.playIndicatorCallback12);

    // Init LEDs
    initLEDs()
}

function initLEDs() {
    // Turn ON all LEDs
    engine.beginTimer(1000, function () {
        midi.sendShortMsg(0x90, 0x75, 0x7f);
    }, 1);

    // Turn OFF all LEDs
    engine.beginTimer(3000, function () {
        midi.sendShortMsg(0x90, 0x75, 0x00);
    }, 1);

    // Turn ON some LEDs DECK1
    engine.beginTimer(4000, function () {
        midi.sendShortMsg(0x92, 8, 0x01);
        midi.sendShortMsg(0x92, 9, 0x01);
        midi.sendShortMsg(0x92, 10, 0x01);
        midi.sendShortMsg(0x92, 11, 0x01);
        midi.sendShortMsg(0x92, 12, 0x01);
        midi.sendShortMsg(0x92, 13, 0x01);
        midi.sendShortMsg(0x92, 14, 0x01);
        //midi.sendShortMsg(0x92, 15, 0x7f);
        //midi.sendShortMsg(0x92, 16, 0x7f);
        //midi.sendShortMsg(0x92, 17, 0x7f);
        //midi.sendShortMsg(0x92, 18, 0x7f);
        midi.sendShortMsg(0x92, 35, 0x01);
    }, 1);

    // Turn ON some LEDs DECK2
    engine.beginTimer(5000, function () {
        midi.sendShortMsg(0x93, 8, 0x01);
        midi.sendShortMsg(0x93, 9, 0x01);
        midi.sendShortMsg(0x93, 10, 0x01);
        midi.sendShortMsg(0x93, 11, 0x01);
        midi.sendShortMsg(0x93, 12, 0x01);
        midi.sendShortMsg(0x93, 13, 0x01);
        midi.sendShortMsg(0x93, 14, 0x01);
        //midi.sendShortMsg(0x93, 15, 0x7f);
        //midi.sendShortMsg(0x93, 16, 0x7f);
        //midi.sendShortMsg(0x93, 17, 0x7f);
        //midi.sendShortMsg(0x93, 18, 0x7f);
        midi.sendShortMsg(0x93, 35, 0x01);
    }, 1);

    // Turn ON FX LEDs
    engine.beginTimer(6000, function () {
        midi.sendShortMsg(0x90, 13, 0x01);
        midi.sendShortMsg(0x91, 13, 0x01);
        midi.sendShortMsg(0x94, 0, 0x01);
        midi.sendShortMsg(0x94, 1, 0x01);
        midi.sendShortMsg(0x94, 2, 0x01);
        midi.sendShortMsg(0x94, 3, 0x01);
    }, 1);
}

// Turn OFF ALL LEDs at SHUTDOWN
MixstreamPro.shutdown = function () {
    // turn off all LEDs Deck1 / Deck2
    midi.sendShortMsg(0x90, 0x75, 0x00);
}

// Init VU Meter variables
MixstreamPro.prevVuLevelL = 0;
MixstreamPro.prevVuLevelR = 0;
MixstreamPro.maxVuLevel = 85

// VuMeter Callback functions
MixstreamPro.vuCallback = function (value, group, control) {
    // Top LED lights up at 0x66
    let level = (value * 70)
    level = Math.ceil(level)

    if (group == '[Master]' && control == 'VuMeterL') {
        midi.sendShortMsg(0xBF, 0x20, 0x00);
        if (engine.getValue(group, "PeakIndicatorL")) {
            level = MixstreamPro.maxVuLevel;
        }

        if (MixstreamPro.prevVuLevelL !== level) {
            midi.sendShortMsg(0xBF, 0x20, level);
            MixstreamPro.prevVuLevelL = level;
        }

    } else if (group == '[Master]' && control == 'VuMeterR') {
            midi.sendShortMsg(0xBF, 0x21, 0x00);
            if (engine.getValue(group, "PeakIndicatorR")) {
                level = MixstreamPro.maxVuLevel
            }

            if (MixstreamPro.prevVuLevelR !== level) {
                midi.sendShortMsg(0xBF, 0x21, level);
                MixstreamPro.prevVuLevelR = level;
            }
        }
}

MixstreamPro.WIFI = true

// TOGGLE AUX 1 Button
MixstreamPro.playAux1 = function (channel, control, value, status, group) {
    if (value === 127) {
        if (MixstreamPro.WIFI == true) {
            engine.setValue("[Auxiliary1]", "master", 1)
            engine.setValue("[Auxiliary1]", "pregain", 0.1)

            if (engine.getValue("[Channel1]", "play_indicator") == 1) {
                engine.setValue("[Auxiliary1]", "orientation", 2)

            } else
                if (engine.getValue("[Channel2]", "play_indicator") == 1) {
                    engine.setValue("[Auxiliary1]", "orientation", 0)
                }

            MixstreamPro.WIFI = false
        } else
            if (MixstreamPro.WIFI == false) {
                engine.setValue("[Auxiliary1]", "master", 0)
                 engine.setValue("[Auxiliary1]", "pregain", 0)
                MixstreamPro.WIFI = true
            }
    }
    if (value === 0) { return }
}

MixstreamPro.shift = false

MixstreamPro.shiftButton = function (channel, control, value, status, group) {
    // Note that there is no 'if (value === 127)' 
    // Therefore, MixstreamPro.shift will only be true while the shift button is held down
    MixstreamPro.shift = !MixstreamPro.shift; // '!' inverts a boolean (true/false) value
}

// Press and hold Shift and then press this button to “stutter-play” the track from the initial cue point.
MixstreamPro.play = function (channel, control, value, status, group) {
    let deckNum = script.deckFromGroup(group);
    let playStatus = engine.getValue(group, "play_indicator")

    if (value === 0x00) {
        if (MixstreamPro.shift) {
            if (MixstreamPro.settings.stutterPlayOnShiftPlay) {
                engine.setValue(group, "cue_gotoandplay", 1);
            } else {
                // A setting is added here for ptraxs preferred behaviour
                playStatus === 1 ? engine.brake(deckNum, true, 0.7) : engine.softStart(deckNum, true, 3);
            }
        } else {
            playStatus === 1 ? engine.setValue(group, "play", 0) : engine.setValue(group, "play", 1);
        }
    }
}

MixstreamPro.playIndicatorCallback1 = function (channel, control, value, status, group) {
    engine.setValue("[Auxiliary1]", "orientation", 2)
}

MixstreamPro.playIndicatorCallback2 = function (channel, control, value, status, group) {
    engine.setValue("[Auxiliary1]", "orientation", 0)
}

MixstreamPro.jogWheelTicksPerRevolution = 894;
MixstreamPro.jogSensitivity = 0.05;

MixstreamPro.WheelTouch = function (channel, control, value, status, group) {
    let deckNumber = script.deckFromGroup(group);
    let deckState = MixstreamPro.deck[deckNumber];

    if (deckState.slipenabledToggle) {
        if (value === 0x7F) {    // If WheelTouch
            let alpha = 1.0 / 8;
            let beta = alpha / 32;
            engine.scratchEnable(deckNumber, 8000, 33 + 1 / 3, alpha, beta);
        } else {    // If button up
            engine.scratchDisable(deckNumber);
        }
    }
}

// Generic JogWheel MSB handler for both decks
MixstreamPro.JogMSB = function (channel, control, value, status, group) {
    let MSB = value;
    let POS = engine.getValue(group, "playposition");
    let deckNumber = script.deckFromGroup(group);
    let deckState = MixstreamPro.deck[deckNumber];

    switch (true) {
        case POS <= 0:
            engine.setValue(group, "playposition", 1);
            break;
        case POS >= 1:
            engine.setValue(group, "playposition", 0);
            break;
    }

    if (engine.isScratching(deckNumber)) {
        if (MSB >= deckState.previousJogValue) {
            engine.scratchTick(deckNumber, MSB / 2); // Scratch!
            deckState.previousJogValue = value;
        }
        else {
            engine.scratchTick(deckNumber, -MSB / 2); // Reverse Scratch!
            deckState.previousJogValue = value;
        }
    }
    else // Jog
    {
        if (MSB >= deckState.previousJogValue) {
            engine.setValue(group, "jog", MSB * MixstreamPro.jogSensitivity);
            deckState.previousJogValue = value;
        }
        else {
            engine.setValue(group, "jog", -MSB * MixstreamPro.jogSensitivity);
            deckState.previousJogValue = value;
        }
    }
};

MixstreamPro.JogLSB = function (channel, control, value, status, group) {
    // LSB not used, use on 7 Bits
    return
};

// Generic track loaded callback - works for both decks
MixstreamPro.trackLoadedCallback = function (channel, control, value, status, group) {
    let deckNum = script.deckFromGroup(group);
    if (!deckNum || deckNum < 1 || deckNum > 2) {
        print("Warning: Invalid deck number in trackLoadedCallback: " + deckNum + " from group: " + group);
        return;
    }
    let deckState = MixstreamPro.deck[deckNum];
    let otherDeckNum = deckNum === 1 ? 2 : 1;
    let otherChannel = MixstreamPro.deck[otherDeckNum].channel;

    // Reset toggles
    deckState.Hotcue_Toggle = true;
    deckState.AutoloopToggle = false;
    deckState.BeatloopRollToggle = false;

    // AUX channel SPOTIFY Helper
    if (!engine.getValue(group, "track_loaded") && !engine.getValue(otherChannel, "track_loaded")) {
        midi.sendShortMsg(status, 0x0E, 0x7f);
        midi.sendShortMsg(status, 0x0F, 0x7f);
        midi.sendShortMsg(status, 0x10, 0x7f);
        midi.sendShortMsg(status, 0x11, 0x7f);
        midi.sendShortMsg(status, 0x12, 0x7f);
    } else if (engine.getValue(group, "track_loaded") && !engine.getValue(otherChannel, "play_indicator")) {
        engine.setValue(deckState.auxChannel, "orientation", deckNum === 1 ? 2 : 0);
    } else if (engine.getValue(group, "track_loaded") && engine.getValue(otherChannel, "play_indicator")) {
        engine.setValue(deckState.auxChannel, "orientation", deckNum === 1 ? 0 : 2);
    }

    let hotcues_enabled = 0;
    let hotcue_Led = 14;
    deckState.hotcuevalue = 0;

    // Send initial LED messages
    midi.sendShortMsg(deckState.midiStatus, 11, 0x01);
    midi.sendShortMsg(deckState.midiStatus, 12, 0x01);
    midi.sendShortMsg(deckState.midiStatus, 13, 0x01);
    midi.sendShortMsg(deckState.midiStatus, 14, 0x01);

    // Reset hotcue LEDs
    for (let i = 1; i <= 4; i++) {
        midi.sendShortMsg(deckState.midiStatus, (hotcue_Led + i), 0x01);
        if (deckState.blinktimer !== 0) {
            engine.stopTimer(deckState.blinktimer);
            deckState.blinktimer = 0;
        }
    }

    // Check enabled hotcues
    for (let i = 1; i <= 8; i++) {
        hotcues_enabled += engine.getValue(group, "hotcue_" + i + "_enabled");
        if (hotcues_enabled !== 0 && i < 5 && hotcues_enabled !== deckState.hotcuevalue) {
            midi.sendShortMsg(deckState.midiStatus, hotcue_Led + hotcues_enabled, 0x7f);
            deckState.hotcuevalue = hotcues_enabled;
        }

        if (hotcues_enabled !== 0 && i > 4 && hotcues_enabled !== deckState.hotcuevalue) {
            midi.sendShortMsg(deckState.midiStatus, (hotcue_Led + hotcues_enabled) - 4, 0x7f);
            deckState.hotcuevalue = hotcues_enabled;
        }
    }

    // Handle blinking for hotcues > 4
    if (deckState.hotcuevalue > 4) {
        let midiStatus = deckState.midiStatus;
        let deckStateRef = deckState;
        deckState.blinktimer = engine.beginTimer(500, function () {
            if (deckStateRef.LEDblink) {
                midi.sendShortMsg(midiStatus, 0x0B, 0x7f);
                deckStateRef.LEDblink = false;
            } else {
                midi.sendShortMsg(midiStatus, 0x0B, 0x01);
                deckStateRef.LEDblink = true;
            }
        });
    }

    if (deckState.hotcuevalue < 4) {
        midi.sendShortMsg(deckState.midiStatus, 0x0B, 0x7f);
    }

    if (deckState.hotcuevalue === 0) {
        midi.sendShortMsg(deckState.midiStatus, 0x0B, 0x01);
        return deckState.hotcuevalue;
    }

    deckState.previousJogValue = 0;
    engine.setValue(group, "beatloop_activate", false);
    engine.setValue(group, "beatloop_size", 8);
}

// Generic slip_enabled_toggle function for both decks
MixstreamPro.scratchToggle = function (channel, control, value, status, group) {
    if (value === 0) { return }
    
    if (value === 127) {
        let deckNum = script.deckFromGroup(group);
        let deckState = MixstreamPro.deck[deckNum];
        
        if (!deckState.slipenabledToggle) {
            engine.setValue(group, "slip_enabled", true);
            midi.sendShortMsg(status, 0x23, 0x7f);
            deckState.slipenabledToggle = true;
        } else {
            engine.setValue(group, "slip_enabled", false);
            midi.sendShortMsg(status, 0x23, 0x01);
            deckState.slipenabledToggle = false;
        }
    }
}

// Generic HOTCUE toggle function for both decks
MixstreamPro.hotCueOrStemsToggle = function (channel, control, value, status, group) {
    if (value === 0) { return }
    
    let deckNum = script.deckFromGroup(group);
    let deckState = MixstreamPro.deck[deckNum];
    let PlayStatus = engine.getValue(group, "play_indicator");
    let trackloaded = engine.getValue(group, "track_loaded");

    let hotcues_enabled = 0;
    let hotcue_Led = 14;
    deckState.hotcuevalue = 0;

    midi.sendShortMsg(status, 0x0C, 0x01);

    if (value === 127 && !PlayStatus && trackloaded) {
        if (deckState.Hotcue_Toggle) {
            deckState.Hotcue_Toggle = false;

            for (let i = 1; i <= 4; i++) {
                midi.sendShortMsg(deckState.midiStatus, (hotcue_Led + i), 0x01);
            }
        } else {
            midi.sendShortMsg(status, 0x0B, 0x7f);
            deckState.Hotcue_Toggle = true;

            for (let i = 1; i <= 8; i++) {
                hotcues_enabled += engine.getValue(group, "hotcue_" + i + "_enabled");
                if (hotcues_enabled !== 0 && i < 5 && hotcues_enabled !== deckState.hotcuevalue) {
                    midi.sendShortMsg(deckState.midiStatus, hotcue_Led + hotcues_enabled, 0x7f);
                    deckState.hotcuevalue = hotcues_enabled;
                }

                if (hotcues_enabled !== 0 && i > 4 && hotcues_enabled !== deckState.hotcuevalue) {
                    midi.sendShortMsg(deckState.midiStatus, (hotcue_Led + hotcues_enabled) - 4, 0x7f);
                    deckState.hotcuevalue = hotcues_enabled;
                }
            }
        }
    }
}

// Generic SAVED loop function for both decks
MixstreamPro.savedLoopToggle = function (channel, control, value, status, group) {
    if (value === 0) { return }
    
    let deckNum = script.deckFromGroup(group);
    let deckState = MixstreamPro.deck[deckNum];
    let LoopIn = engine.getValue(group, "loop_start_position");
    let PlayStatus = engine.getValue(group, "play_indicator");

    if (LoopIn !== -1) {
        if (value === 127 && engine.getValue(group, "track_loaded") && PlayStatus) {
            if (!engine.getValue(group, "loop_enabled")) {
                script.triggerControl(group, "reloop_toggle");
                midi.sendShortMsg(status, 0x0C, 0x7f);

                midi.sendShortMsg(status, 0x0B, 0x01);
                midi.sendShortMsg(status, 0x0D, 0x01);
                midi.sendShortMsg(status, 0x0E, 0x01);
                midi.sendShortMsg(status, 0x0F, 0x01);
                midi.sendShortMsg(status, 0x10, 0x01);
                midi.sendShortMsg(status, 0x11, 0x01);
                midi.sendShortMsg(status, 0x12, 0x01);

                deckState.Hotcue_Toggle = false;
            } else {
                script.triggerControl(group, "reloop_toggle");
                midi.sendShortMsg(status, 0x0C, 0x01);
            }
        }
    }
}

// Generic AUTO loop button function for both decks
MixstreamPro.autoLoopToggle = function (channel, control, value, status, group) {
    if (value === 0) { return }
    
    let deckNum = script.deckFromGroup(group);
    let deckState = MixstreamPro.deck[deckNum];
    let PlayStatus = engine.getValue(group, "play_indicator");

    if (value === 127 && PlayStatus) {
        if (!deckState.AutoloopToggle) {
            deckState.AutoloopToggle = true;

            engine.setValue(group, "beatloop_activate", true);
            engine.setValue(group, "beatloop_size", 4);
            midi.sendShortMsg(status, 0x0E, 0x7f);

            midi.sendShortMsg(status, 0x0B, 0x01);
            midi.sendShortMsg(status, 0x0C, 0x01);
            midi.sendShortMsg(status, 0x0D, 0x01);
            midi.sendShortMsg(status, 0x0F, 0x01);
            midi.sendShortMsg(status, 0x10, 0x01);
            midi.sendShortMsg(status, 0x11, 0x01);
            midi.sendShortMsg(status, 0x12, 0x7f);

            deckState.Hotcue_Toggle = false;
        } else {
            deckState.AutoloopToggle = false;
            midi.sendShortMsg(status, 0x0E, 0x01);
            midi.sendShortMsg(status, 0x0F, 0x01);
            midi.sendShortMsg(status, 0x10, 0x01);
            midi.sendShortMsg(status, 0x11, 0x01);
            midi.sendShortMsg(status, 0x12, 0x01);

            script.triggerControl(group, "reloop_toggle");
            engine.setValue(group, "beatloop_activate", false);
            engine.setValue(group, "loop_remove", true);

            deckState.Hotcue_Toggle = true;
        }
    }
}

// Generic AUTOLOOP ROLL button function for both decks
MixstreamPro.rollOrSamplerToggle = function (channel, control, value, status, group) {
    if (value === 0) { return }
    
    let deckNum = script.deckFromGroup(group);
    let deckState = MixstreamPro.deck[deckNum];
    let PlayStatus = engine.getValue(group, "play_indicator");
    
    engine.setValue(group, "beatloop_size", 4);

    if (value === 127 && PlayStatus === 1) {
        if (!deckState.BeatloopRollToggle) {
            deckState.BeatloopRollToggle = true;

            engine.setValue(group, "beatloop_activate", true);

            midi.sendShortMsg(status, 0x0D, 0x7f);

            midi.sendShortMsg(status, 0x0B, 0x01);
            midi.sendShortMsg(status, 0x0C, 0x01);
            midi.sendShortMsg(status, 0x0E, 0x01);
            midi.sendShortMsg(status, 0x0F, 0x01);
            midi.sendShortMsg(status, 0x10, 0x01);
            midi.sendShortMsg(status, 0x11, 0x01);
            midi.sendShortMsg(status, 0x12, 0x7f);

            deckState.Hotcue_Toggle = false;
            deckState.AutoloopToggle = false;
        } else {
            deckState.BeatloopRollToggle = false;
            midi.sendShortMsg(status, 0x0D, 0x01);
            midi.sendShortMsg(status, 0x0F, 0x01);
            midi.sendShortMsg(status, 0x10, 0x01);
            midi.sendShortMsg(status, 0x11, 0x01);
            midi.sendShortMsg(status, 0x12, 0x01);

            script.triggerControl(group, "reloop_toggle");
            engine.setValue(group, "loop_remove", true);
        }
    }
}

MixstreamPro.performancePad = function (channel, control, value, status, group) {
    if (value === 0) { return }
    
    let deckNum = script.deckFromGroup(group);
    let deckState = MixstreamPro.deck[deckNum];
    let PlayStatus = engine.getValue(group, "play_indicator");
    let padNumber = control - 14; // Pads start at control 15 (0x0F), so Pad1=15, Pad2=16, etc.
    
    // Pad configurations for each mode (Hotcue, Autoloop, BeatloopRoll)
    let padConfigs = {
        1: { hotcue: [1, 5], autoloop: 0.5, autoloopShift: 0.25, beatloopRoll: 0.25, midiLED: 0x0F },
        2: { hotcue: [2, 6], autoloop: 2, autoloopShift: 2, beatloopRoll: 0.5, midiLED: 0x10 },
        3: { hotcue: [3, 7], autoloop: 4, autoloopShift: 4, beatloopRoll: 1, midiLED: 0x11 },
        4: { hotcue: [4, 8], autoloop: 8, autoloopShift: 8, beatloopRoll: 2, midiLED: 0x12 }
    };
    
    let config = padConfigs[padNumber];
    
    // HOTCUE MODE
    if (value === 127 && deckState.Hotcue_Toggle && !deckState.AutoloopToggle && !PlayStatus) {
        let hotcueNum = MixstreamPro.shift ? config.hotcue[1] : config.hotcue[0];
        engine.setValue(group, "hotcue_" + hotcueNum + "_gotoandstop", 1);
    }
    
    // AUTOLOOP MODE
    if (value === 127 && deckState.AutoloopToggle && PlayStatus) {
        // Send LED feedback
        for (let i = 1; i <= 4; i++) {
            let ledMsg = (i === padNumber) ? 0x7f : 0x01;
            midi.sendShortMsg(status, (14 + i), ledMsg);
        }
        
        let loopSize = MixstreamPro.shift ? config.autoloopShift : config.autoloop;
        engine.setValue(group, "beatloop_size", loopSize);
        
        let loopSizeValue = engine.getValue(group, "beatloop_size");
        engine.setValue(group, "beatloop_" + loopSizeValue + "_activate", true);
        engine.setValue(group, "beatloop_activate", true);
        script.triggerControl(group, "reloop_toggle");
    }
    
    // BEATLOOPROLL MODE
    if (value === 127 && deckState.BeatloopRollToggle && PlayStatus) {
        // Send LED feedback
        for (let i = 1; i <= 4; i++) {
            let ledMsg = (i === padNumber) ? 0x7f : 0x01;
            midi.sendShortMsg(status, (14 + i), ledMsg);
        }
        
        engine.setValue(group, "loop_end_position", -1);
        engine.setValue(group, "beatloop_size", config.beatloopRoll);
        
        let loopSizeValue = engine.getValue(group, "beatloop_size");
        engine.setValue(group, "beatlooproll_" + loopSizeValue + "_activate", true);
        engine.setValue(group, "beatlooproll_activate", true);
        script.triggerControl(group, "reloop_toggle");
    }
}

// Track toggle switch state for each channel (4 = Unit1, 5 = Unit2)
MixstreamPro.toggleSwitchState = {
    4: false,  // Channel 4 toggle state
    5: false   // Channel 5 toggle state
}

MixstreamPro.effectToggleSwitch = function (channel, control, value, status, group) {
    // Get effect number based on channel (assuming 4 effects controlled by this)
    // Check enabled states from effectStates
    
    // Determine if toggle is ON (value 1 or 2)
    let toggleIsOn = (value === 1 || value === 2);
    MixstreamPro.toggleSwitchState[channel] = toggleIsOn;
    
    if (channel === 4) {
        for (let i = 1; i <= 3; i++) {
            let effectKey = "[EffectRack1_EffectUnit1_Effect" + i + "]";
            let shouldEnable = toggleIsOn && MixstreamPro.effectStates[i].toggle ? 1 : 0;
            engine.setValue(effectKey, "enabled", shouldEnable);
        }
    }
    
    if (channel === 5) {
        for (let i = 1; i <= 3; i++) {
            let effectKey = "[EffectRack1_EffectUnit2_Effect" + i + "]";
            let shouldEnable = toggleIsOn && MixstreamPro.effectStates[i].toggle ? 1 : 0;
            engine.setValue(effectKey, "enabled", shouldEnable);
        }
    }
}

// TOGGLE EFFECT buttons - Effect state data
MixstreamPro.effectStates = {
    1: { toggle: false, blinktimer: 0, LEDblink: true, midiCC: 0x00 },
    2: { toggle: false, blinktimer: 0, LEDblink: true, midiCC: 0x01 },
    3: { toggle: false, blinktimer: 0, LEDblink: true, midiCC: 0x02 },
    4: { toggle: false, blinktimer: 0, LEDblink: true, midiCC: 0x03 }
}

// Generic Effect button handler - maps CC -> effect and toggles effect enabled + LED
MixstreamPro.effectButton = function (channel, control, value, status, group) {
    if (value === 0) { return }

    let effectNum = control + 1; // CC 0 -> effect 1
    let effectState = MixstreamPro.effectStates[effectNum];

    if (value === 127) {
        // If currently disabled -> enable and start blinking
        if (!effectState.toggle) {
            // Ensure any previous timer is stopped
            if (effectState.blinktimer !== 0) {
                try { engine.stopTimer(effectState.blinktimer); } catch (e) { }
                effectState.blinktimer = 0;
            }

            effectState.toggle = true; // now enabled
            effectState.LEDblink = true;
            let effectStateRef = effectState;
            let midiCC = effectState.midiCC;
            effectState.blinktimer = engine.beginTimer(500, function () {
                if (effectStateRef.LEDblink) {
                    midi.sendShortMsg(0x94, midiCC, 0x7F);
                    effectStateRef.LEDblink = false;
                } else {
                    midi.sendShortMsg(0x94, midiCC, 0x01);
                    effectStateRef.LEDblink = true;
                }
            });
        } else {
            // Currently enabled -> disable and stop blinking
            effectState.toggle = false;

            if (effectState.blinktimer !== 0) {
                try { engine.stopTimer(effectState.blinktimer); } catch (e) { }
                effectState.blinktimer = 0;
            }

            // Ensure LED shows off state
            midi.sendShortMsg(0x94, effectState.midiCC, 0x01);
        }
        
        // After toggling the effect button, trigger the toggle switches to re-evaluate
        // This ensures the effect is applied/removed based on current toggle switch state
        let channel4Value = MixstreamPro.toggleSwitchState[4] ? 1 : 0;
        let channel5Value = MixstreamPro.toggleSwitchState[5] ? 1 : 0;
        MixstreamPro.effectToggleSwitch(4, null, channel4Value, null, null);
        MixstreamPro.effectToggleSwitch(5, null, channel5Value, null, null);
    }
}