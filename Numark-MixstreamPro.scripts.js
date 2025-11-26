// https://github.com/mixxxdj/mixxx/wiki/midi%20scripting
// Example MIDI Msg : status 0x94 (ch 5, opcode 0x9), ctrl 0x03, val 0x01

var MixstreamPro = {};

MixstreamPro.settings = {
    stutterPlayOnShiftPlay: true,
    hotCueWhilePlaying: true,
    enableVUMeter: false, // Produces a lot of MIDI traffic that makes it difficult to debug
};

// Pad configurations for each mode (Hotcue, Autoloop, BeatloopRoll)
MixstreamPro.padConfigs = {
    1: { hotcue: [1, 5], autoloopBank1: 4, autoloopBank2: 0.25, beatloopRollBank1: 0.125, beatloopRollBank2: 0.5, midiLED: 0x0F },
    2: { hotcue: [2, 6], autoloopBank1: 8, autoloopBank2: 0.5, beatloopRollBank1: 0.1667, beatloopRollBank2: 0.6667, midiLED: 0x10 },
    3: { hotcue: [3, 7], autoloopBank1: 16, autoloopBank2: 1, beatloopRollBank1: 0.25, beatloopRollBank2: 1, midiLED: 0x11 },
    4: { hotcue: [4, 8], autoloopBank1: 32, autoloopBank2: 2, beatloopRollBank1: 0.3333, beatloopRollBank2: 2, midiLED: 0x12 }
};

// TOGGLE EFFECT buttons - Effect state data
// Blink timer holds the engine timer ID, LEDblink tracks current LED state, midiCC is the CC number for the effect butto
MixstreamPro.effectStates = {
    1: { toggle: false, blinktimer: 0, LEDblink: true, midiCC: 0x00 },
    2: { toggle: false, blinktimer: 0, LEDblink: true, midiCC: 0x01 },
    3: { toggle: false, blinktimer: 0, LEDblink: true, midiCC: 0x02 },
    4: { toggle: false, blinktimer: 0, LEDblink: true, midiCC: 0x03 }
}

// Track toggle switch state for each channel (4 = Unit1, 5 = Unit2)
MixstreamPro.toggleSwitchState = {
    4: false,  // Channel 4 toggle state
    5: false   // Channel 5 toggle state
}

// Init Hotcue variables - Deck state containers
MixstreamPro.deck = {
    1: {
        blinktimer: 0,
        LEDblink: true,
        midiStatus: 0x92,
        channel: "[Channel1]",
        auxChannel: "[Auxiliary2]",
        padModes: {
            hotcue: 0,
            savedloop: 0,
            autoloop: 0,
            roll: 0,
            sampler: 0,
        },
        slipenabledToggle: false,
        previousJogValue: 0
    },
    2: {
        blinktimer: 0,
        LEDblink: true,
        midiStatus: 0x93,
        channel: "[Channel2]",
        auxChannel: "[Auxiliary1]",
        padModes: {
            hotcue: 0,
            savedloop: 0,
            autoloop: 0,
            roll: 0,
            sampler: 0,
        },
        slipenabledToggle: false,
        previousJogValue: 0
    }
};

// Pitch slider Pot components for 14-bit precision
MixstreamPro.pitchSlider1 = new components.Pot({
    midi: [0xB2, 0x1F],
    group: '[Channel1]',
    inKey: 'rate'
});

MixstreamPro.pitchSlider2 = new components.Pot({
    midi: [0xB3, 0x1F],
    group: '[Channel2]',
    inKey: 'rate'
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
    let enableVUMeter = MixstreamPro.settings.enableVUMeter;

    if (group == '[Master]' && control == 'VuMeterL') {
        enableVUMeter ? midi.sendShortMsg(0xBF, 0x20, 0x00) : null;
        if (engine.getValue(group, "PeakIndicatorL")) {
            level = MixstreamPro.maxVuLevel;
        }

        if (MixstreamPro.prevVuLevelL !== level) {
            enableVUMeter ? midi.sendShortMsg(0xBF, 0x20, level) : null;
            MixstreamPro.prevVuLevelL = level;
        }

    } else if (group == '[Master]' && control == 'VuMeterR') {
        enableVUMeter ? midi.sendShortMsg(0xBF, 0x21, 0x00) : null;
        if (engine.getValue(group, "PeakIndicatorR")) {
            level = MixstreamPro.maxVuLevel
        }

        if (MixstreamPro.prevVuLevelR !== level) {
            enableVUMeter ? midi.sendShortMsg(0xBF, 0x21, level) : null;
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
MixstreamPro.trackLoadedCallback = function (value, group, control) {
    let deckNum = script.deckFromGroup(group);
    if (!deckNum || deckNum < 1 || deckNum > 2) {
        print("Warning: Invalid deck number in trackLoadedCallback: " + deckNum + " from group: " + group);
        return;
    }
    let deckState = MixstreamPro.deck[deckNum];
    let otherDeckNum = deckNum === 1 ? 2 : 1;
    let otherChannel = MixstreamPro.deck[otherDeckNum].channel;

    // AUX channel SPOTIFY Helper
    if (!engine.getValue(group, "track_loaded") && !engine.getValue(otherChannel, "track_loaded")) {
        midi.sendShortMsg(deckState.midiStatus, 0x0E, 0x7f);
        midi.sendShortMsg(deckState.midiStatus, 0x0F, 0x7f);
        midi.sendShortMsg(deckState.midiStatus, 0x10, 0x7f);
        midi.sendShortMsg(deckState.midiStatus, 0x11, 0x7f);
        midi.sendShortMsg(deckState.midiStatus, 0x12, 0x7f);
    } else if (engine.getValue(group, "track_loaded") && !engine.getValue(otherChannel, "play_indicator")) {
        engine.setValue(deckState.auxChannel, "orientation", deckNum === 1 ? 2 : 0);
    } else if (engine.getValue(group, "track_loaded") && engine.getValue(otherChannel, "play_indicator")) {
        engine.setValue(deckState.auxChannel, "orientation", deckNum === 1 ? 0 : 2);
    }

    midi.sendShortMsg(deckState.midiStatus, 11, 0x01);
    midi.sendShortMsg(deckState.midiStatus, 12, 0x01);
    midi.sendShortMsg(deckState.midiStatus, 13, 0x01);
    midi.sendShortMsg(deckState.midiStatus, 14, 0x01);

    deckState.previousJogValue = 0;
}

// Generic slip_enabled_toggle function for both decks
MixstreamPro.toggleScratch = function (channel, control, value, status, group) {
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

// Toggle mode configurations: defines which toggle, LED address, and other toggles to reset
MixstreamPro.padModeConfigs = {
    hotcue: {
        ledAddress: 0x0B,
        requiresTrack: true,
        onActivate: function (group, deckState) {
            for (let i = 1; i <= 4; i++) {
                hotcueNum = i + (deckState.padModes.hotcue === 1 ? 0 : 4);
                if (engine.getValue(group, "hotcue_" + hotcueNum + "_type") && engine.getValue(group, "hotcue_" + hotcueNum + "_status")) {
                    midi.sendShortMsg(deckState.midiStatus, (14 + i), 0x7f);
                }
            }
        },
        onDeactivate: function (group, deckState) { }
    },
    savedloop: {
        ledAddress: 0x0C,
        requiresTrack: true,
        onActivate: function (group, deckState) {
            script.triggerControl(group, "reloop_toggle");
        },
        onDeactivate: function (group, deckState) {
            script.triggerControl(group, "reloop_toggle");
        }
    },
    autoloop: {
        ledAddress: 0x0E,
        requiresTrack: false,
        onActivate: function (group, deckState) { },
        onDeactivate: function (group, deckState) { },
    },
    roll: {
        ledAddress: 0x0D,
        requiresTrack: false,
        onActivate: function (group, deckState) { },
        onDeactivate: function (group, deckState) { }
    },
    sampler: {
        ledAddress: 0x0D,
        requiresTrack: false,
        onActivate: function (group, deckState) {
            let samplerBank = deckState.padModes.sampler;
            for (let i = 1; i <= 4; i++) {
                let sample = i + (4 * (samplerBank - 1));
                if (engine.getValue("[Sampler" + sample + "]", "track_loaded")) {
                    // Turn on LED for loaded sampler
                    midi.sendShortMsg(deckState.midiStatus, (14 + i), 0x7f);
                }
            }
        },
        onDeactivate: function (group, deckState) { }
    }
};

// Generic toggle handler for mode switching
MixstreamPro.genericToggle = function (channel, control, value, status, group, configKey) {
    if (value === 0) { return }

    let deckNum = script.deckFromGroup(group);
    let deckState = MixstreamPro.deck[deckNum];
    let padModes = MixstreamPro.deck[deckNum].padModes;
    let config = MixstreamPro.padModeConfigs[configKey];

    if (value === 127 && (!config.requiresTrack || engine.getValue(group, "track_loaded"))) {
        midi.sendShortMsg(deckState.midiStatus, 15, 0x01);
        midi.sendShortMsg(deckState.midiStatus, 16, 0x01);
        midi.sendShortMsg(deckState.midiStatus, 17, 0x01);
        midi.sendShortMsg(deckState.midiStatus, 18, 0x01);

        let currentValue = padModes[configKey];
        let isActive = currentValue !== 0 && currentValue !== false;

        if (!isActive) {
            // Reset other toggles
            Object.keys(padModes).forEach(toggleName => {
                padModes[toggleName] = 0;
            });
        }
        if (currentValue === 0 || currentValue === 2) {
            // Activate this mode, set to 1
            padModes[configKey] = 1;

            // // Turn off other mode LEDs
            Object.keys(MixstreamPro.padModeConfigs).forEach(key => {
                midi.sendShortMsg(status, MixstreamPro.padModeConfigs[key].ledAddress, 0x00);
            });

            if (deckState.blinktimer) {
                engine.stopTimer(deckState.blinktimer);
                deckState.blinktimer = 0;
            }

            // Turn on the LED for this mode
            midi.sendShortMsg(status, config.ledAddress, 0x7f);
            config.onActivate(group, deckState);
        } else if (currentValue === 1) {
            // Toggle to state 2
            padModes[configKey] = 2;

            // It makes no sense to have the LED tracked in the deckstate for the padmode config but whatever
            midi.sendShortMsg(status, config.ledAddress, 0x01);
            deckState.blinktimer = engine.beginTimer(500, function () {
                if (deckState.LEDblink) {
                    midi.sendShortMsg(status, config.ledAddress, 0x7F);
                    deckState.LEDblink = false;
                } else {
                    midi.sendShortMsg(status, config.ledAddress, 0x01);
                    deckState.LEDblink = true;
                }
            });

            config.onActivate(group, deckState);
        } else {
            // Run mode-specific deactivation
            config.onDeactivate(group, deckState);
        }
    }
}

// Mode toggle wrappers for each control
MixstreamPro.toggleHotCueOrStems = function (channel, control, value, status, group) {
    MixstreamPro.genericToggle(channel, control, value, status, group, "hotcue");
}

MixstreamPro.toggleSavedLoop = function (channel, control, value, status, group) {
    MixstreamPro.genericToggle(channel, control, value, status, group, "savedloop");
}

MixstreamPro.toggleAutoloop = function (channel, control, value, status, group) {
    MixstreamPro.genericToggle(channel, control, value, status, group, "autoloop");
}

MixstreamPro.toggleRollOrSampler = function (channel, control, value, status, group) {
    if (MixstreamPro.shift) {
        MixstreamPro.genericToggle(channel, control, value, status, group, "sampler");
    } else {
        MixstreamPro.genericToggle(channel, control, value, status, group, "roll");
    }
}

MixstreamPro.performancePad = function (channel, control, value, status, group) {

    let deckNum = script.deckFromGroup(group);
    let deckState = MixstreamPro.deck[deckNum];
    let PlayStatus = engine.getValue(group, "play_indicator");
    let padNumber = control - 14; // Pads start at control 15 (0x0F), so Pad1=15, Pad2=16, etc.

    let config = MixstreamPro.padConfigs[padNumber];

    // HOTCUE MODE
    if (deckState.padModes.hotcue && (MixstreamPro.settings.hotCueWhilePlaying || !PlayStatus)) {
        let hotcueNum = deckState.padModes.hotcue === 1 ? config.hotcue[0] : config.hotcue[1];
        if (value === 127) {
            if (MixstreamPro.shift) {
                engine.setValue(group, "hotcue_" + hotcueNum + "_clear", 1);
            } else {
                engine.setValue(group, "hotcue_" + hotcueNum + "_activate", 1);
            }
        } else if (value === 0) {
            engine.setValue(group, "hotcue_" + hotcueNum + "_activate", 0);
        }
    }

    // SAVED LOOP MODE in the works

    // AUTOLOOP MODE
    if (value === 127 && deckState.padModes.autoloop) {
        // Send LED feedback
        for (let i = 1; i <= 4; i++) {
            let ledMsg = (i === padNumber) ? 0x7f : 0x01;
            midi.sendShortMsg(status, (14 + i), ledMsg);
        }

        let loopSize = deckState.padModes.autoloop === 1 ? config.autoloopBank1 : config.autoloopBank2;
        engine.setValue(group, "beatloop_" + loopSize + "_toggle", true);
    }

    // BEATLOOPROLL MODE
    if (deckState.padModes.roll) {
        let loopSize = deckState.padModes.roll === 1 ? config.beatloopRollBank1 : config.beatloopRollBank2;
        engine.setValue(group, "beatloop_size", loopSize);
        if (value === 127) {
            // Send LED feedback
            engine.setValue(group, "beatlooproll_activate", true);
            midi.sendShortMsg(status, (14 + padNumber), 0x7f); ``
        } else if (value === 0) {
            engine.setValue(group, "beatlooproll_activate", false);
            midi.sendShortMsg(status, (14 + padNumber), 0x01);
        }
    }

    // SAMPLER MODE
    if (value === 127 && deckState.padModes.sampler) {
        let sample = padNumber + (4 * (deckState.padModes.sampler - 1));
        engine.setValue("[Sampler" + sample + "]", "cue_gotoandplay", 1);
    }
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