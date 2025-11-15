// https://github.com/mixxxdj/mixxx/wiki/midi%20scripting
// Example MIDI Msg : status 0x94 (ch 5, opcode 0x9), ctrl 0x03, val 0x01

var MixstreamPro = {};

// Pitch slider Pot components for 14-bit precision
MixstreamPro.pitchSlider1 = new components.Pot({
    midi: [0xB2, 0x1F],
    group: '[Channel1]',
    inKey: 'rate',
    inValueScale: function(value) {
        // Invert: 0 -> 1, 1 -> 0
        return 1 - (value / 16384);
    },
});

MixstreamPro.pitchSlider2 = new components.Pot({
    midi: [0xB3, 0x1F],
    group: '[Channel2]',
    inKey: 'rate',
    inValueScale: function(value) {
        // Invert: 0 -> 1, 1 -> 0
        return 1 - (value / 16384);
    },
});

MixstreamPro.init = function(id, debugging) {
    // Init Callbacks
    // VuMeters
    engine.makeConnection("[Master]", "VuMeterL", MixstreamPro.vuCallback);
    engine.makeConnection("[Master]", "VuMeterR", MixstreamPro.vuCallback);
    // TrackLoaded
    engine.makeConnection("[Channel1]", "track_loaded", MixstreamPro.track_loaded1);
    engine.makeConnection("[Channel2]", "track_loaded", MixstreamPro.track_loaded2);
    // TrackPlaying
    engine.makeConnection("[Channel1]", "play_indicator", MixstreamPro.play_indicator1);
    engine.makeConnection("[Channel2]", "play_indicator", MixstreamPro.play_indicator2);

    // Init LEDs
    LEDs_Init()
}

function LEDs_Init() {
    // Turn ON all LEDs
    engine.beginTimer(1000, function() {
        midi.sendShortMsg(0x90, 0x75, 0x7f);
    }, 1);

    // Turn OFF all LEDs
    engine.beginTimer(3000, function() {
        midi.sendShortMsg(0x90, 0x75, 0x00);
    }, 1);

    // Turn ON some LEDs DECK1
    engine.beginTimer(4000, function() {
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
    engine.beginTimer(5000, function() {
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
    engine.beginTimer(6000, function() {
        midi.sendShortMsg(0x90, 13, 0x01);
        midi.sendShortMsg(0x91, 13, 0x01);
        midi.sendShortMsg(0x94, 0, 0x01);
        midi.sendShortMsg(0x94, 1, 0x01);
        midi.sendShortMsg(0x94, 2, 0x01);
        midi.sendShortMsg(0x94, 3, 0x01);
    }, 1);
}

// Turn OFF ALL LEDs at SHUTDOWN
MixstreamPro.shutdown = function() {
    // turn off all LEDs Deck1 / Deck2
    midi.sendShortMsg(0x90, 0x75, 0x00);
}

// Init VU Meter variables
MixstreamPro.prevVuLevelL = 0;
MixstreamPro.prevVuLevelR = 0;
MixstreamPro.maxVuLevel = 85

// VuMeter Callback functions
MixstreamPro.vuCallback = function(value, group, control) {
    // Top LED lights up at 0x66
    var level = (value * 70)
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

    } else

    if (group == '[Master]' && control == 'VuMeterR') {
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
MixstreamPro.Play_Aux_1 = function(channel, control, value, status, group) {
    if (value === 127) {
        if (MixstreamPro.WIFI == true) {
            engine.setValue("[Auxiliary1]", "master", 1)
                // engine.setValue("[Auxiliary1]", "pregain", 1)

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
                //  engine.setValue("[Auxiliary1]", "pregain", 1)
            MixstreamPro.WIFI = true
        }
    }
    if (value === 0) { return }
}

// Init Aux Volume Timer
MixstreamPro.AUX_volume = 0

MixstreamPro.play_indicator1 = function(channel, control, value, status, group) {
    engine.setValue("[Auxiliary1]", "orientation", 2)
}

MixstreamPro.play_indicator2 = function(channel, control, value, status, group) {
    engine.setValue("[Auxiliary1]", "orientation", 0)
}

MixstreamPro.jogWheelTicksPerRevolution = 894;
MixstreamPro.jogSensitivity = 0.05;
MixstreamPro.previousJogValue1 = 0
MixstreamPro.previousJogValue2 = 0

MixstreamPro.WheelTouch = function (channel, control, value, status, group) {
    var deckNumber = script.deckFromGroup(group)

if((MixstreamPro.slipenabledToggle1 == true && deckNumber == 1) || (MixstreamPro.slipenabledToggle2 == true && deckNumber == 2)){
    if (value === 0x7F) {    // If WheelTouch
        var alpha = 1.0/8;
        var beta = alpha/32;
        engine.scratchEnable(deckNumber, 8000, 33+1/3, alpha, beta);
    } else {    // If button up
        engine.scratchDisable(deckNumber);
    }
  }
}

// JogWheel Deck1
MixstreamPro.JogLSB_1 = function(channel, control, value, status, group) {
   // LSB not used, use on 7 Bits
    return 
};

MixstreamPro.JogMSB_1 = function(channel, control, value, status, group) {
        var MSB = value;
        var POS = engine.getValue(group, "playposition")
        var deckNumber = script.deckFromGroup(group);

        switch(true) {
            case POS <= 0:
                 engine.setValue(group, "playposition", 1)
              break;
            case POS >= 1 :
                 engine.setValue(group, "playposition", 0)
              break;
          }

        if (engine.isScratching(deckNumber)) {
            if (MSB >= MixstreamPro.previousJogValue1) {
                engine.scratchTick(deckNumber, MSB/2); // Scratch!
                MixstreamPro.previousJogValue1 = value;
            }
            else 
                {
                engine.scratchTick(deckNumber, -MSB/2); // Reverse Scratch!
                MixstreamPro.previousJogValue1 = value;
                }
        } 
        else // Jog
        {
            if (MSB >= MixstreamPro.previousJogValue1) {
                engine.setValue(group, "jog", MSB * MixstreamPro.jogSensitivity);
                MixstreamPro.previousJogValue1 = value;
            }
        else 
            {
            engine.setValue(group, "jog", -MSB * MixstreamPro.jogSensitivity);
            MixstreamPro.previousJogValue1 = value;
            }   
        }
};

// JogWheel Deck2
MixstreamPro.JogLSB_2 = function(channel, control, value, status, group) {
    // LSB not used, use on 7 Bits
     return
 };
 
 MixstreamPro.JogMSB_2 = function(channel, control, value, status, group) {
        var MSB = value;
        var POS = engine.getValue(group, "playposition")
        var deckNumber = script.deckFromGroup(group);

        switch(true) {
            case POS <= 0:
                 engine.setValue(group, "playposition", 1)
              break;
            case POS >= 1 :
                 engine.setValue(group, "playposition", 0)
              break;
          }

        if (engine.isScratching(deckNumber)) {
            if (MSB >= MixstreamPro.previousJogValue1) {
                engine.scratchTick(deckNumber, MSB/2); // Scratch!
                MixstreamPro.previousJogValue1 = value;
            }
        else 
            {
            engine.scratchTick(deckNumber, -MSB/2); // Reverse Scratch!
            MixstreamPro.previousJogValue1 = value;
            }
        } 
        else // Jog
        {
            if (MSB >= MixstreamPro.previousJogValue1) {
                engine.setValue(group, "jog", MSB * MixstreamPro.jogSensitivity);
                MixstreamPro.previousJogValue1 = value;
            }
        else 
            {
            engine.setValue(group, "jog", -MSB * MixstreamPro.jogSensitivity);
            MixstreamPro.previousJogValue1 = value;
            }   
        }
 };

// Init Hotcue variables
MixstreamPro.blinktimer4 = 0
MixstreamPro.hotcuevalue1 = 0
MixstreamPro.LEDblink4 = true

// TrackLoaded Callback functions
MixstreamPro.track_loaded1 = function(channel, control, value, status, group) {
    //print(trackloaded == true ? 'Track 2 Loaded' : 'Track 2 Not Loaded')
    // engine.setValue("[Channel1]", "eject", 1)
    MixstreamPro.Hotcue_Toggle1 = true
    MixstreamPro.AutoloopToggle1 = false
    MixstreamPro.BeatloopRollToggle1 = false

    // AUX1 channel SPOTIFY Helper
    if (engine.getValue("[Channel1]", "track_loaded") !== true && engine.getValue("[Channel2]", "track_loaded") !== true) {
        midi.sendShortMsg(status, 0x0E, 0x7f);
        midi.sendShortMsg(status, 0x0F, 0x7f);
        midi.sendShortMsg(status, 0x10, 0x7f);
        midi.sendShortMsg(status, 0x11, 0x7f);
        midi.sendShortMsg(status, 0x12, 0x7f);
    } else
    if (engine.getValue("[Channel1]", "track_loaded") == true && engine.getValue("[Channel2]", "play_indicator") !== 1) {
        engine.setValue("[Auxiliary1]", "orientation", 2)
    } else
    if (engine.getValue("[Channel1]", "track_loaded") == true && engine.getValue("[Channel2]", "play_indicator") == 1) {
        engine.setValue("[Auxiliary1]", "orientation", 0)
    }

    var hotcues_enabled1 = 0
    var hotcue_Led1 = 14
        MixstreamPro.hotcuevalue1 = 0

    midi.sendShortMsg(0x92, 11, 0x01) // 0x0B
    midi.sendShortMsg(0x92, 12, 0x01) // 0x0C
    midi.sendShortMsg(0x92, 13, 0x01) // 0x0D
    midi.sendShortMsg(0x92, 14, 0x01) // 0x0E

    for (var i = 1; i <= 4; i++) {
        midi.sendShortMsg(0x92, (hotcue_Led1 + i), 0x01) // ?? or 0x00
        if (MixstreamPro.blinktimer4 !== 0) {
            engine.stopTimer(MixstreamPro.blinktimer4);
            //Reset timer
            MixstreamPro.blinktimer4 = 0;
        }
    }

    for (var i = 1; i <= 8; i++) {
        hotcues_enabled1 += engine.getValue("[Channel1]", "hotcue_" + i + "_enabled")
        if (hotcues_enabled1 !== 0 && i < 5 && hotcues_enabled1 !== MixstreamPro.hotcuevalue1) {
            midi.sendShortMsg(0x92, hotcue_Led1 + hotcues_enabled1, 0x7f)
            MixstreamPro.hotcuevalue1 = hotcues_enabled1
        }

        if (hotcues_enabled1 !== 0 && i > 4 && hotcues_enabled1 !== MixstreamPro.hotcuevalue1) {
            midi.sendShortMsg(0x92, (hotcue_Led1 + hotcues_enabled1) - 4, 0x7f)
            MixstreamPro.hotcuevalue1 = hotcues_enabled1
        }
    }

    if (MixstreamPro.hotcuevalue1 > 4) {
        MixstreamPro.blinktimer4 = engine.beginTimer(500, function() {
            if (MixstreamPro.LEDblink4 == true) {
                midi.sendShortMsg(0x92, 0x0B, 0x7f) // 0x0B= 11
                MixstreamPro.LEDblink4 = false
            } else {
                midi.sendShortMsg(0x92, 0x0B, 0x01) 
                MixstreamPro.LEDblink4 = true
            }
        });
    }

    if (MixstreamPro.hotcuevalue1 < 4) {
        midi.sendShortMsg(0x92, 0x0B, 0x7f)
    }

    if (MixstreamPro.hotcuevalue1 == 0) {
        midi.sendShortMsg(0x92, 0x0B, 0x01)
        return MixstreamPro.hotcuevalue1
    }

    MixstreamPro.previousJogValue1 = 0
    engine.setValue("[Channel1]", "beatloop_activate", false)
    engine.setValue("[Channel1]", "beatloop_size", 8)

}

MixstreamPro.blinktimer5 = 0
MixstreamPro.hotcuevalue2 = 0
MixstreamPro.LEDblink5 = true

MixstreamPro.track_loaded2 = function(channel, control, value, status, group) {
    //print(trackloaded == true ? 'Track 1 Loaded' : 'Track 1 Not Loaded')
    MixstreamPro.Hotcue_Toggle2 = true
    MixstreamPro.AutoloopToggle2 = false
    MixstreamPro.BeatloopRollToggle2 = false

    // AUX1 channel SPOTIFY Helper
    if (engine.getValue("[Channel1]", "track_loaded") !== true && engine.getValue("[Channel2]", "track_loaded") !== true) {
        midi.sendShortMsg(status, 0x0E, 0x7f);
        midi.sendShortMsg(status, 0x0F, 0x7f);
        midi.sendShortMsg(status, 0x10, 0x7f);
        midi.sendShortMsg(status, 0x11, 0x7f);
        midi.sendShortMsg(status, 0x12, 0x7f);
    } else
    if (engine.getValue("[Channel2]", "track_loaded") == true && engine.getValue("[Channel1]", "play_indicator") !== 1) {
        engine.setValue("[Auxiliary1]", "orientation", 0)
    } else
    if (engine.getValue("[Channel1]", "track_loaded") == true && engine.getValue("[Channel1]", "play_indicator") == 1) {
        engine.setValue("[Auxiliary1]", "orientation", 2)
    }

    var hotcues_enabled2 = 0
    var hotcue_Led2 = 14
    MixstreamPro.hotcuevalue2 = 0

    midi.sendShortMsg(0x93, 11, 0x01)
    midi.sendShortMsg(0x93, 12, 0x01)
    midi.sendShortMsg(0x93, 13, 0x01)
    midi.sendShortMsg(0x93, 14, 0x01)

    for (var i = 1; i <= 4; i++) {
        midi.sendShortMsg(0x93, (hotcue_Led2 + i), 0x01) 
        if (MixstreamPro.blinktimer5 !== 0) {
            engine.stopTimer(MixstreamPro.blinktimer5);
            //Reset timer
            MixstreamPro.blinktimer5 = 0;
        }
    }

    for (var i = 1; i <= 8; i++) {
        hotcues_enabled2 += engine.getValue("[Channel2]", "hotcue_" + i + "_enabled")
        if (hotcues_enabled2 !== 0 && i < 5 && hotcues_enabled2 !== MixstreamPro.hotcuevalue2) {
            midi.sendShortMsg(0x93, hotcue_Led2 + hotcues_enabled2, 0x7f)
            MixstreamPro.hotcuevalue2 = hotcues_enabled2
        }

        if (hotcues_enabled2 !== 0 && i > 4 && hotcues_enabled2 !== MixstreamPro.hotcuevalue2) {
            midi.sendShortMsg(0x93, (hotcue_Led2 + hotcues_enabled2) - 4, 0x7f)
            MixstreamPro.hotcuevalue2 = hotcues_enabled2
        }
    }

    if (MixstreamPro.hotcuevalue2 > 4) {
        MixstreamPro.blinktimer5 = engine.beginTimer(500, function() {
            if (MixstreamPro.LEDblink5 == true) {
                midi.sendShortMsg(0x93, 0x0B, 0x7f)
                MixstreamPro.LEDblink5 = false
            } else {
                midi.sendShortMsg(0x93, 0x0B, 0x01) 
                MixstreamPro.LEDblink5 = true
            }
        });
    }

    if (MixstreamPro.hotcuevalue2 < 4) {
        midi.sendShortMsg(0x93, 0x0B, 0x7f)
    }

    if (MixstreamPro.hotcuevalue2 == 0) {
        midi.sendShortMsg(0x93, 0x0B, 0x01)
        return MixstreamPro.hotcuevalue2
    }

    MixstreamPro.previousJogValue2 = 0
    engine.setValue("[Channel2]", "beatloop_activate", false)
    engine.setValue("[Channel2]", "beatloop_size", 8)
}

// TOGGLE slipenabled buttons
MixstreamPro.slipenabledToggle1 = false

MixstreamPro.slip_enabled_toggle1 = function(channel, control, value, status, group) {
    if (value === 127) {
        if (MixstreamPro.slipenabledToggle1 == false) {
            engine.setValue("[Channel1]", "slip_enabled", true);
            midi.sendShortMsg(status, 0x23, 0x7f);
            MixstreamPro.slipenabledToggle1 = true
        } else
        if (MixstreamPro.slipenabledToggle1 == true) {
            engine.setValue("[Channel1]", "slip_enabled", false);
            midi.sendShortMsg(status, 0x23, 0x01);
            MixstreamPro.slipenabledToggle1 = false
        }    
    } else
    if (value === 0) { return }
}

MixstreamPro.slipenabledToggle2 = false

MixstreamPro.slip_enabled_toggle2 = function(channel, control, value, status, group) {
    if (value === 127) {
        if (MixstreamPro.slipenabledToggle2 == false) {
            engine.setValue("[Channel2]", "slip_enabled", true);
            midi.sendShortMsg(status, 0x23, 0x7f);
            MixstreamPro.slipenabledToggle2= true
        } else
        if (MixstreamPro.slipenabledToggle2 == true) {
            engine.setValue("[Channel2]", "slip_enabled", false);
            midi.sendShortMsg(status, 0x23, 0x01);
            MixstreamPro.slipenabledToggle2 = false
        }    
    } else
    if (value === 0) { return }
}

// TOGGLE HOTCUE buttons
MixstreamPro.Hotcue_Toggle1 = true

MixstreamPro.cue_goto_toggle1 = function(channel, control, value, status, group) {
    var PlayStatus = engine.getValue("[Channel1]", "play_indicator")
    var trackloaded = engine.getValue("[Channel1]", "track_loaded") 

    var hotcues_enabled1 = 0
    var hotcue_Led1 = 14
        MixstreamPro.hotcuevalue1 = 0

        midi.sendShortMsg(status, 0x0C, 0x01);

    if (value === 127 && PlayStatus == false && trackloaded == true) {
        if (MixstreamPro.Hotcue_Toggle1 == true) {
            MixstreamPro.Hotcue_Toggle1 = false

            for (var i = 1; i <= 4; i++) {
            midi.sendShortMsg(0x92, (hotcue_Led1 + i), 0x01)
            }
      
        } else
        if (MixstreamPro.Hotcue_Toggle1 == false) {
            midi.sendShortMsg(status, 0x0B, 0x7f);
            MixstreamPro.Hotcue_Toggle1 = true

            for (var i = 1; i <= 8; i++) {
                hotcues_enabled1 += engine.getValue("[Channel1]", "hotcue_" + i + "_enabled")
                if (hotcues_enabled1 !== 0 && i < 5 && hotcues_enabled1 !== MixstreamPro.hotcuevalue1) {
                    midi.sendShortMsg(0x92, hotcue_Led1 + hotcues_enabled1, 0x7f)
                    MixstreamPro.hotcuevalue1 = hotcues_enabled1
                }
        
                if (hotcues_enabled1 !== 0 && i > 4 && hotcues_enabled1 !== MixstreamPro.hotcuevalue1) {
                    midi.sendShortMsg(0x92, (hotcue_Led1 + hotcues_enabled1) - 4, 0x7f)
                    MixstreamPro.hotcuevalue1 = hotcues_enabled1
                }
            }
        }
    } else
    if (value === 0) { return }
}

MixstreamPro.Hotcue_Toggle2= true

MixstreamPro.cue_goto_toggle2 = function(channel, control, value, status, group) {
    var PlayStatus = engine.getValue("[Channel2]", "play_indicator")
    var trackloaded = engine.getValue("[Channel2]", "track_loaded") 

    var hotcues_enabled2 = 0
    var hotcue_Led2 = 14
        MixstreamPro.hotcuevalue2 = 0

        midi.sendShortMsg(status, 0x0C, 0x01);

    if (value === 127 && PlayStatus == false && trackloaded == true) {
        if (MixstreamPro.Hotcue_Toggle2 == true) {
            MixstreamPro.Hotcue_Toggle2 = false
    
            for (var i = 1; i <= 4; i++) {
            midi.sendShortMsg(0x93, (hotcue_Led2 + i), 0x01) 
            }

        } else
        if (MixstreamPro.Hotcue_Toggle2 == false) {
            midi.sendShortMsg(status, 0x0B, 0x7f);
            MixstreamPro.Hotcue_Toggle2 = true

            for (var i = 1; i <= 8; i++) {
                hotcues_enabled2 += engine.getValue("[Channel2]", "hotcue_" + i + "_enabled")
                if (hotcues_enabled2 !== 0 && i < 5 && hotcues_enabled2 !== MixstreamPro.hotcuevalue2) {
                    midi.sendShortMsg(0x93, hotcue_Led2 + hotcues_enabled2, 0x7f)
                    MixstreamPro.hotcuevalue2 = hotcues_enabled2
                }
        
                if (hotcues_enabled2 !== 0 && i > 4 && hotcues_enabled2 !== MixstreamPro.hotcuevalue2) {
                    midi.sendShortMsg(0x93, (hotcue_Led2 + hotcues_enabled2) - 4, 0x7f)
                    MixstreamPro.hotcuevalue2 = hotcues_enabled2
                }
            }
        }
    } else
    if (value === 0) { return }
}

// TOGGLE SAVED loop buttons
MixstreamPro.reloop_toggle1 = function(channel, control, value, status, group) {
        var LoopIn = engine.getValue("[Channel1]","loop_start_position")
        var PlayStatus = engine.getValue("[Channel1]", "play_indicator")

if(LoopIn != -1){
    if (value === 127 && engine.getValue("[Channel1]", "track_loaded") == true && PlayStatus == true) {
        if (engine.getValue("[Channel1]", "loop_enabled") === 0) {
            script.triggerControl("[Channel1]", "reloop_toggle");

            midi.sendShortMsg(status, 0x0C, 0x7f);

            midi.sendShortMsg(status, 0x0B, 0x01);
            midi.sendShortMsg(status, 0x0D, 0x01);
            midi.sendShortMsg(status, 0x0E, 0x01);
            midi.sendShortMsg(status, 0x0F, 0x01);
            midi.sendShortMsg(status, 0x10, 0x01);
            midi.sendShortMsg(status, 0x11, 0x01);
            midi.sendShortMsg(status, 0x12, 0x01);

            MixstreamPro.Hotcue_Toggle1 = false
        } else {
            script.triggerControl("[Channel1]", "reloop_toggle");
            midi.sendShortMsg(status, 0x0C, 0x01);
        }
    } else
    if (value === 0) { return }
  }
}

MixstreamPro.reloop_toggle2 = function(channel, control, value, status, group) {
    var LoopIn = engine.getValue("[Channel2]","loop_start_position")
    var PlayStatus = engine.getValue("[Channel2]", "play_indicator")
    
if(LoopIn != -1){    
    if (value === 127 && engine.getValue("[Channel2]", "track_loaded") == true && PlayStatus == true) {
        if (engine.getValue("[Channel2]", "loop_enabled") === 0) {
            script.triggerControl("[Channel2]", "reloop_toggle");
            midi.sendShortMsg(status, 0x0C, 0x7f);

            midi.sendShortMsg(status, 0x0B, 0x01);
            midi.sendShortMsg(status, 0x0D, 0x01);
            midi.sendShortMsg(status, 0x0E, 0x01);
            midi.sendShortMsg(status, 0x0F, 0x01);
            midi.sendShortMsg(status, 0x10, 0x01);
            midi.sendShortMsg(status, 0x11, 0x01);
            midi.sendShortMsg(status, 0x12, 0x01);

            MixstreamPro.Hotcue_Toggle2 = false
        } else {
            script.triggerControl("[Channel2]", "reloop_toggle");
            midi.sendShortMsg(status, 0x0C, 0x01);
        }
    } else
    if (value === 0) { return }
  }
}

// TOGGLE AUTO loop buttons
MixstreamPro.AutoloopToggle1 = false

MixstreamPro.Autoloop1 = function(channel, control, value, status, group) {
    var PlayStatus = engine.getValue("[Channel1]", "play_indicator")

    if (value === 127 && PlayStatus == true) {
        if (MixstreamPro.AutoloopToggle1 == false) {
            MixstreamPro.AutoloopToggle1 = true
            
            engine.setValue("[Channel1]", "beatloop_activate", true)
            engine.setValue("[Channel1]", "beatloop_size", 4)
            midi.sendShortMsg(status, 0x0E, 0x7f);

            midi.sendShortMsg(status, 0x0B, 0x01);
            midi.sendShortMsg(status, 0x0C, 0x01);
            midi.sendShortMsg(status, 0x0D, 0x01);
            midi.sendShortMsg(status, 0x0F, 0x01);
            midi.sendShortMsg(status, 0x10, 0x01);
            midi.sendShortMsg(status, 0x11, 0x01);
            midi.sendShortMsg(status, 0x12, 0x7f);

            MixstreamPro.Hotcue_Toggle1 = false

        } else
        if (MixstreamPro.AutoloopToggle1 == true) {
            MixstreamPro.AutoloopToggle1 = false
            midi.sendShortMsg(status, 0x0E, 0x01);
            midi.sendShortMsg(status, 0x0F, 0x01);
            midi.sendShortMsg(status, 0x10, 0x01);
            midi.sendShortMsg(status, 0x11, 0x01);
            midi.sendShortMsg(status, 0x12, 0x01);

            script.triggerControl(group, "reloop_toggle"); // Stop Auto Loop
            engine.setValue("[Channel1]", "beatloop_activate", false)

            engine.setValue("[Channel1]", "loop_remove", true)

            MixstreamPro.Hotcue_Toggle1 = true
        }
    } else
    if (value === 0) { return }
}

MixstreamPro.AutoloopToggle2 = false

MixstreamPro.Autoloop2 = function(channel, control, value, status, group) {
    var PlayStatus = engine.getValue("[Channel2]", "play_indicator")

    if (value === 127 && PlayStatus == true) {
        if (MixstreamPro.AutoloopToggle2 == false) {
            MixstreamPro.AutoloopToggle2 = true

            engine.setValue("[Channel2]", "beatloop_activate", true)
            engine.setValue("[Channel2]", "beatloop_size", 4)

            midi.sendShortMsg(status, 0x0E, 0x7f);

            midi.sendShortMsg(status, 0x0B, 0x01);
            midi.sendShortMsg(status, 0x0C, 0x01);
            midi.sendShortMsg(status, 0x0D, 0x01);
            midi.sendShortMsg(status, 0x0F, 0x01);
            midi.sendShortMsg(status, 0x10, 0x01);
            midi.sendShortMsg(status, 0x11, 0x01);
            midi.sendShortMsg(status, 0x12, 0x7f);

            MixstreamPro.Hotcue_Toggle2 = false

        } else
        if (MixstreamPro.AutoloopToggle2 == true) {
            MixstreamPro.AutoloopToggle2 = false
            midi.sendShortMsg(status, 0x0E, 0x01);
            midi.sendShortMsg(status, 0x0F, 0x01);
            midi.sendShortMsg(status, 0x10, 0x01);
            midi.sendShortMsg(status, 0x11, 0x01);
            midi.sendShortMsg(status, 0x12, 0x01);

            script.triggerControl(group, "reloop_toggle"); // Stop Auto Loop
            engine.setValue("[Channel2]", "beatloop_activate", false)

            engine.setValue("[Channel2]", "loop_remove", true)

            MixstreamPro.Hotcue_Toggle2 = true
        }
    } else
    if (value === 0) {return }
}

// TOGGLE AUTOLOOP ROLL buttons
MixstreamPro.BeatloopRollToggle1 = false

MixstreamPro.BeatloopRoll1 = function(channel, control, value, status, group) {
    var PlayStatus = engine.getValue("[Channel1]", "play_indicator")
    engine.setValue("[Channel1]", "beatloop_size", 4)

    if (value === 127 && PlayStatus == 1) {
        if (MixstreamPro.BeatloopRollToggle1 == false) {
            MixstreamPro.BeatloopRollToggle1 = true

            engine.setValue("[Channel1]", "beatloop_activate", true)
            //script.triggerControl(group, "reloop_toggle");

            midi.sendShortMsg(status, 0x0D, 0x7f);

            midi.sendShortMsg(status, 0x0B, 0x01);
            midi.sendShortMsg(status, 0x0C, 0x01);
            midi.sendShortMsg(status, 0x0E, 0x01);
            midi.sendShortMsg(status, 0x0F, 0x01);
            midi.sendShortMsg(status, 0x10, 0x01);
            midi.sendShortMsg(status, 0x11, 0x01);
            midi.sendShortMsg(status, 0x12, 0x7f);

            MixstreamPro.Hotcue_Toggle1 = false
            MixstreamPro.AutoloopToggle1 = false

        } else
        if (MixstreamPro.BeatloopRollToggle1 == true) {
            MixstreamPro.BeatloopRollToggle1 = false
            midi.sendShortMsg(status, 0x0D, 0x01);
            midi.sendShortMsg(status, 0x0F, 0x01);
            midi.sendShortMsg(status, 0x10, 0x01);
            midi.sendShortMsg(status, 0x11, 0x01);
            midi.sendShortMsg(status, 0x12, 0x01);

            script.triggerControl(group, "reloop_toggle");

            engine.setValue("[Channel1]", "loop_remove", true)
        }
    } else
    if (value === 0) { return }
}

MixstreamPro.BeatloopRollToggle2 = false

MixstreamPro.BeatloopRoll2 = function(channel, control, value, status, group) {
    var PlayStatus = engine.getValue("[Channel2]", "play_indicator")
    engine.setValue("[Channel2]", "beatloop_size", 4)

    if (value === 127 && PlayStatus == 1) {
        if (MixstreamPro.BeatloopRollToggle2 == false) {
            MixstreamPro.BeatloopRollToggle2 = true

            engine.setValue("[Channel2]", "beatloop_activate", true)
            //script.triggerControl(group, "reloop_toggle");

            midi.sendShortMsg(status, 0x0D, 0x7f);

            midi.sendShortMsg(status, 0x0B, 0x01);
            midi.sendShortMsg(status, 0x0C, 0x01);
            midi.sendShortMsg(status, 0x0E, 0x01);
            midi.sendShortMsg(status, 0x0F, 0x01);
            midi.sendShortMsg(status, 0x10, 0x01);
            midi.sendShortMsg(status, 0x11, 0x01);
            midi.sendShortMsg(status, 0x12, 0x7f);

            MixstreamPro.Hotcue_Toggle2 = false
            MixstreamPro.AutoloopToggle2 = false

        } else
        if (MixstreamPro.BeatloopRollToggle2 == true) {
            MixstreamPro.BeatloopRollToggle2 = false
            midi.sendShortMsg(status, 0x0D, 0x01);
            midi.sendShortMsg(status, 0x0F, 0x01);
            midi.sendShortMsg(status, 0x10, 0x01);
            midi.sendShortMsg(status, 0x11, 0x01);
            midi.sendShortMsg(status, 0x12, 0x01);

            script.triggerControl(group, "reloop_toggle");

            engine.setValue("[Channel2]", "loop_remove", true)
        }
    } else
    if (value === 0) { return }
}

// SHIFT buttons 4 Pads
MixstreamPro.shift = false

MixstreamPro.shiftButton = function(channel, control, value, status, group) {
    // Note that there is no 'if (value === 127)' 
    // Therefore, MixstreamPro.shift will only be true while the shift button is held down
    MixstreamPro.shift = !MixstreamPro.shift; // '!' inverts a boolean (true/false) value
}

// Hot Cue
MixstreamPro.Deck1_Pad1 = function(channel, control, value, status, group) {
    var PlayStatus = engine.getValue(group, "play_indicator")

    if (value === 127 && MixstreamPro.Hotcue_Toggle1 == true && MixstreamPro.AutoloopToggle1 == false && PlayStatus == false) {
        // only when Hot Cue button is active
        // only do stuff when the button is pressed, not when it is released
        if (MixstreamPro.shift) {
            // do something when this button and the shift button are both pressed
            engine.setValue("[Channel1]", "hotcue_5_gotoandstop", 1);
        } else {
            // do something else when this button is pressed but the shift button is not pressed
            engine.setValue("[Channel1]", "hotcue_1_gotoandstop", 1);
        }
    } else
    if (value === 0) { 
        //midi.sendShortMsg(status, 0x0F, 0x01);
        return }

    // Autoloop 1 / 0.5 - 0.25 beats
    if (value === 127 && MixstreamPro.AutoloopToggle1 == true && PlayStatus == 1) {
        // Delete loop_end
            midi.sendShortMsg(status, 0x0F, 0x7f);
            midi.sendShortMsg(status, 0x10, 0x01);
            midi.sendShortMsg(status, 0x11, 0x01);
            midi.sendShortMsg(status, 0x12, 0x01);

            //engine.setValue(group, "loop_end_position", -1);

        if (MixstreamPro.shift) {
            engine.setValue("[Channel1]", "beatloop_size", 1/4)
        } else 
            {engine.setValue("[Channel1]", "beatloop_size", 1/2)}

        var loopSize = engine.getValue("[Channel1]", "beatloop_size")

        engine.setValue("[Channel1]", "beatloop_" + loopSize + "_activate", true)
        engine.setValue("[Channel1]", "beatloop_activate", true)
        script.triggerControl(group, "reloop_toggle")
    } else
    if (value === 0) { 
        midi.sendShortMsg(status, 0x0F, 0x01);
        return }

    // AutoloopRoll 0.25 beats
    if (value === 127 && MixstreamPro.BeatloopRollToggle1 == true && PlayStatus == 1) {
            midi.sendShortMsg(status, 0x0F, 0x7f);
            midi.sendShortMsg(status, 0x10, 0x01);
            midi.sendShortMsg(status, 0x11, 0x01);
            midi.sendShortMsg(status, 0x12, 0x01);

        engine.setValue(group, "loop_end_position", -1);
        engine.setValue("[Channel1]", "beatloop_size", 0.25)

        var loopSize = engine.getValue("[Channel1]", "beatloop_size")

        engine.setValue("[Channel1]", "beatlooproll_" + loopSize + "_activate", true)
        engine.setValue("[Channel1]", "beatlooproll_activate", true)
        script.triggerControl(group, "reloop_toggle");
    } else
    if (value === 0) { 
        midi.sendShortMsg(status, 0x0F, 0x01);
        return }

    //if (value === 0) { return }
}

MixstreamPro.Deck1_Pad2 = function(channel, control, value, status, group) {
    var PlayStatus = engine.getValue(group, "play_indicator")

    if (value === 127 && MixstreamPro.Hotcue_Toggle1 == true && MixstreamPro.AutoloopToggle1 == false && PlayStatus == false) {
        if (MixstreamPro.shift) {
            engine.setValue("[Channel1]", "hotcue_6_gotoandstop", 1);
        } else {
            engine.setValue("[Channel1]", "hotcue_2_gotoandstop", 1);
        }
    } else
    if (value === 0) { 
       // midi.sendShortMsg(status, 0x10, 0x01);
        return }

    // Autoloop 2 beats
    if (value === 127 && MixstreamPro.AutoloopToggle1 == true && PlayStatus == 1) {
        midi.sendShortMsg(status, 0x0F, 0x01);
        midi.sendShortMsg(status, 0x10, 0x7f);
        midi.sendShortMsg(status, 0x11, 0x01);
        midi.sendShortMsg(status, 0x12, 0x01);

        //engine.setValue(group, "loop_end_position", -1);
        engine.setValue("[Channel1]", "beatloop_size", 2)

        var loopSize = engine.getValue("[Channel1]", "beatloop_size")

        engine.setValue("[Channel1]", "beatloop_" + loopSize + "_activate", true)
        engine.setValue("[Channel1]", "beatloop_activate", true)
        script.triggerControl(group, "reloop_toggle");
    } else
    if (value === 0) { 
        midi.sendShortMsg(status, 0x10, 0x01);
        return }

    // AutoloopRoll 0.5 beats
    if (value === 127 && MixstreamPro.BeatloopRollToggle1 == true && PlayStatus == 1) {
        midi.sendShortMsg(status, 0x0F, 0x01);
        midi.sendShortMsg(status, 0x10, 0x7f);
        midi.sendShortMsg(status, 0x11, 0x01);
        midi.sendShortMsg(status, 0x12, 0x01);
        
        engine.setValue(group, "loop_end_position", -1);
        engine.setValue("[Channel1]", "beatloop_size", 0.5)

        var loopSize = engine.getValue("[Channel1]", "beatloop_size")

        engine.setValue("[Channel1]", "beatlooproll_" + loopSize + "_activate", true)
        engine.setValue("[Channel1]", "beatlooproll_activate", true)
        script.triggerControl(group, "reloop_toggle");
    }else
    if (value === 0) { 
        midi.sendShortMsg(status, 0x10, 0x01);
        return }

    //if (value === 0) { return }
}

MixstreamPro.Deck1_Pad3 = function(channel, control, value, status, group) {
    var PlayStatus = engine.getValue(group, "play_indicator")

    if (value === 127 && MixstreamPro.Hotcue_Toggle1 == true && MixstreamPro.AutoloopToggle1 == false && PlayStatus == false) {
        if (MixstreamPro.shift) {
            engine.setValue("[Channel1]", "hotcue_7_gotoandstop", 1);
        } else {
            engine.setValue("[Channel1]", "hotcue_3_gotoandstop", 1);
        }
    } else
    if (value === 0) { 
        //midi.sendShortMsg(status, 0x11, 0x01);
        return }

    // Autoloop 4 beats
    if (value === 127 && MixstreamPro.AutoloopToggle1 == true && PlayStatus == 1) {
        midi.sendShortMsg(status, 0x0F, 0x01);
        midi.sendShortMsg(status, 0x10, 0x01);
        midi.sendShortMsg(status, 0x11, 0x7f);
        midi.sendShortMsg(status, 0x12, 0x01);

        //engine.setValue(group, "loop_end_position", -1);
        engine.setValue("[Channel1]", "beatloop_size", 4)

        var loopSize = engine.getValue("[Channel1]", "beatloop_size")

        engine.setValue("[Channel1]", "beatloop_" + loopSize + "_activate", true)
        engine.setValue("[Channel1]", "beatloop_activate", true)
        script.triggerControl(group, "reloop_toggle");
    } else
    if (value === 0) { 
        midi.sendShortMsg(status, 0x11, 0x01);
        return }

    // AutoloopRoll 1 beats
    if (value === 127 && MixstreamPro.BeatloopRollToggle1 == true && PlayStatus == 1) {
        midi.sendShortMsg(status, 0x0F, 0x01);
        midi.sendShortMsg(status, 0x10, 0x01);
        midi.sendShortMsg(status, 0x11, 0x7f);
        midi.sendShortMsg(status, 0x12, 0x01);
        
        engine.setValue(group, "loop_end_position", -1);
        engine.setValue("[Channel1]", "beatloop_size", 1)

        var loopSize = engine.getValue("[Channel1]", "beatloop_size")

        engine.setValue("[Channel1]", "beatlooproll_" + loopSize + "_activate", true)
        engine.setValue("[Channel1]", "beatlooproll_activate", true)
        script.triggerControl(group, "reloop_toggle");
    } else
    if (value === 0) { 
        midi.sendShortMsg(status, 0x11, 0x01);
        return }

    //if (value === 0) { return }
}

MixstreamPro.Deck1_Pad4 = function(channel, control, value, status, group) {
    var PlayStatus = engine.getValue(group, "play_indicator")

    if (value === 127 && MixstreamPro.Hotcue_Toggle1 == true && MixstreamPro.AutoloopToggle1 == false && PlayStatus == false) {
        if (MixstreamPro.shift) {
            engine.setValue("[Channel1]", "hotcue_8_gotoandstop", 1);
        } else {
            engine.setValue("[Channel1]", "hotcue_4_gotoandstop", 1);
        }
    } else
    if (value === 0) { 
        //midi.sendShortMsg(status, 0x12, 0x01);
        return }

    // Autoloop 8 beats
    if (value === 127 && MixstreamPro.AutoloopToggle1 == true && PlayStatus == 1) {
        midi.sendShortMsg(status, 0x0F, 0x01);
        midi.sendShortMsg(status, 0x10, 0x01);
        midi.sendShortMsg(status, 0x11, 0x01);
        midi.sendShortMsg(status, 0x12, 0x7f);

        //engine.setValue(group, "loop_end_position", -1);
        engine.setValue("[Channel1]", "beatloop_size", 8)

        var loopSize = engine.getValue("[Channel1]", "beatloop_size")

        engine.setValue("[Channel1]", "beatloop_" + loopSize + "_activate", true)
        engine.setValue("[Channel1]", "beatloop_activate", true)
        script.triggerControl(group, "reloop_toggle");
    } else
    if (value === 0) { 
        midi.sendShortMsg(status, 0x12, 0x01);
        return }

    // AutoloopRoll 2 beats
    if (value === 127 && MixstreamPro.BeatloopRollToggle1 == true && PlayStatus == 1) {
        midi.sendShortMsg(status, 0x0F, 0x01);
        midi.sendShortMsg(status, 0x10, 0x01);
        midi.sendShortMsg(status, 0x11, 0x01);
        midi.sendShortMsg(status, 0x12, 0x7f);
        
        engine.setValue(group, "loop_end_position", -1);
        engine.setValue("[Channel1]", "beatloop_size", 2)

        var loopSize = engine.getValue("[Channel1]", "beatloop_size")

        engine.setValue("[Channel1]", "beatlooproll_" + loopSize + "_activate", true)
        engine.setValue("[Channel1]", "beatlooproll_activate", true)
        script.triggerControl(group, "reloop_toggle");
    }else
    if (value === 0) { 
        midi.sendShortMsg(status, 0x12, 0x01);
        return }

    //if (value === 0) { return }
}

MixstreamPro.Deck2_Pad1 = function(channel, control, value, status, group) {
    var PlayStatus = engine.getValue(group, "play_indicator")

    if (value === 127 && MixstreamPro.Hotcue_Toggle2 == true && MixstreamPro.AutoloopToggle2 == false && PlayStatus == false) {
        if (MixstreamPro.shift) {
            engine.setValue("[Channel2]", "hotcue_5_gotoandstop", 1);
        } else {
            engine.setValue("[Channel2]", "hotcue_1_gotoandstop", 1);
        }
    } else
    if (value === 0) { 
        //midi.sendShortMsg(status, 0x0F, 0x01);
        return }

    // Autoloop 1, 0.5 - 0.25 beats
    if (value === 127 && MixstreamPro.AutoloopToggle2 == true && PlayStatus == 1) {
        // Delete loop_end
        midi.sendShortMsg(status, 0x0F, 0x7f);
        midi.sendShortMsg(status, 0x10, 0x01);
        midi.sendShortMsg(status, 0x11, 0x01);
        midi.sendShortMsg(status, 0x12, 0x01);

        //engine.setValue(group, "loop_end_position", -1);

        if (MixstreamPro.shift) {
            engine.setValue("[Channel2]", "beatloop_size", 1/4)
        } else 
            {engine.setValue("[Channel2]", "beatloop_size", 1/2)}

        var loopSize = engine.getValue("[Channel2]", "beatloop_size")

        engine.setValue("[Channel2]", "beatloop_" + loopSize + "_activate", true)
        engine.setValue("[Channel2]", "beatloop_activate", true)
        script.triggerControl(group, "reloop_toggle");
    } else
    if (value === 0) { 
        midi.sendShortMsg(status, 0x0F, 0x01);
        return }

    // AutoloopRoll 0.125 beats
    if (value === 127 && MixstreamPro.BeatloopRollToggle2 == true && PlayStatus == 1) {
        midi.sendShortMsg(status, 0x0F, 0x7f);
        midi.sendShortMsg(status, 0x10, 0x01);
        midi.sendShortMsg(status, 0x11, 0x01);
        midi.sendShortMsg(status, 0x12, 0x01);
        
        engine.setValue(group, "loop_end_position", -1);
        engine.setValue("[Channel2]", "beatloop_size", 0.125)

        var loopSize = engine.getValue("[Channel2]", "beatloop_size")

        engine.setValue("[Channel2]", "beatlooproll_" + loopSize + "_activate", true)
        engine.setValue("[Channel2]", "beatlooproll_activate", true)
        script.triggerControl(group, "reloop_toggle");
    } else
    if (value === 0) { 
        midi.sendShortMsg(status, 0x0F, 0x01);
        return }

    //if (value === 0) { return }
}

MixstreamPro.Deck2_Pad2 = function(channel, control, value, status, group) {
    var PlayStatus = engine.getValue(group, "play_indicator")

    if (value === 127 && MixstreamPro.Hotcue_Toggle2 == true && MixstreamPro.AutoloopToggle2 == false && PlayStatus == false) {
        if (MixstreamPro.shift) {
            engine.setValue("[Channel2]", "hotcue_6_gotoandstop", 1);
        } else {
            engine.setValue("[Channel2]", "hotcue_2_gotoandstop", 1);
        }
    } else
    if (value === 0) { 
        //midi.sendShortMsg(status, 0x10, 0x01);
        return }

    // Autoloop 2 beats
    if (value === 127 && MixstreamPro.AutoloopToggle2 == true && PlayStatus == 1) {
        midi.sendShortMsg(status, 0x0F, 0x01);
        midi.sendShortMsg(status, 0x10, 0x7f);
        midi.sendShortMsg(status, 0x11, 0x01);
        midi.sendShortMsg(status, 0x12, 0x01);

        //engine.setValue(group, "loop_end_position", -1);
        engine.setValue("[Channel2]", "beatloop_size", 2)

        var loopSize = engine.getValue("[Channel2]", "beatloop_size")

        engine.setValue("[Channel2]", "beatloop_" + loopSize + "_activate", true)
        engine.setValue("[Channel2]", "beatloop_activate", true)
        script.triggerControl(group, "reloop_toggle");
    } else
    if (value === 0) { 
        midi.sendShortMsg(status, 0x10, 0x01);
        return }

    // AutoloopRoll 0.25 beats
    if (value === 127 && MixstreamPro.BeatloopRollToggle2 == true && PlayStatus == 1) {
        midi.sendShortMsg(status, 0x0F, 0x01);
        midi.sendShortMsg(status, 0x10, 0x7f);
        midi.sendShortMsg(status, 0x11, 0x01);
        midi.sendShortMsg(status, 0x12, 0x01);
        
        engine.setValue(group, "loop_end_position", -1);
        engine.setValue("[Channel2]", "beatloop_size", 0.25)

        var loopSize = engine.getValue("[Channel2]", "beatloop_size")

        engine.setValue("[Channel2]", "beatlooproll_" + loopSize + "_activate", true)
        engine.setValue("[Channel2]", "beatlooproll_activate", true)
        script.triggerControl(group, "reloop_toggle");
    } else
    if (value === 0) { 
        midi.sendShortMsg(status, 0x10, 0x01);
        return }

    //if (value === 0) { return }
}

MixstreamPro.Deck2_Pad3 = function(channel, control, value, status, group) {
    var PlayStatus = engine.getValue(group, "play_indicator")

    if (value === 127 && MixstreamPro.Hotcue_Toggle2 == true && MixstreamPro.AutoloopToggle2 == false && PlayStatus == false) {
        if (MixstreamPro.shift) {
            engine.setValue("[Channel2]", "hotcue_7_gotoandstop", 1);
        } else {
            engine.setValue("[Channel2]", "hotcue_3_gotoandstop", 1);
        }
    } else
    if (value === 0) { 
        //midi.sendShortMsg(status, 0x11, 0x01);
        return }

    // Autoloop 4 beats
    if (value === 127 && MixstreamPro.AutoloopToggle2 == true && PlayStatus == 1) {
        midi.sendShortMsg(status, 0x0F, 0x01);
        midi.sendShortMsg(status, 0x10, 0x01);
        midi.sendShortMsg(status, 0x11, 0x7f);
        midi.sendShortMsg(status, 0x12, 0x01);

        //engine.setValue(group, "loop_end_position", -1);
        engine.setValue("[Channel2]", "beatloop_size", 4)

        var loopSize = engine.getValue("[Channel2]", "beatloop_size")

        engine.setValue("[Channel2]", "beatloop_" + loopSize + "_activate", true)
        engine.setValue("[Channel2]", "beatloop_activate", true)
        script.triggerControl(group, "reloop_toggle");
    } else
    if (value === 0) { 
        midi.sendShortMsg(status, 0x11, 0x01);
        return }

    // AutoloopRoll 0.5 beats
    if (value === 127 && MixstreamPro.BeatloopRollToggle2 == true && PlayStatus == 1) {
        midi.sendShortMsg(status, 0x0F, 0x01);
        midi.sendShortMsg(status, 0x10, 0x01);
        midi.sendShortMsg(status, 0x11, 0x7f);
        midi.sendShortMsg(status, 0x12, 0x01);
       
        engine.setValue(group, "loop_end_position", -1);
        engine.setValue("[Channel2]", "beatloop_size", 0.5)

        var loopSize = engine.getValue("[Channel2]", "beatloop_size")

        engine.setValue("[Channel2]", "beatlooproll_" + loopSize + "_activate", true)
        engine.setValue("[Channel2]", "beatlooproll_activate", true)
        script.triggerControl(group, "reloop_toggle");
    } else
    if (value === 0) { 
        midi.sendShortMsg(status, 0x11, 0x01);
        return }

    //if (value === 0) { return }
}

MixstreamPro.Deck2_Pad4 = function(channel, control, value, status, group) {
    var PlayStatus = engine.getValue(group, "play_indicator")

    if (value === 127 && MixstreamPro.Hotcue_Toggle2 == true && MixstreamPro.AutoloopToggle2 == false && PlayStatus == false) {
        if (MixstreamPro.shift) {
            engine.setValue("[Channel2]", "hotcue_8_gotoandstop", 1);
        } else {
            engine.setValue("[Channel2]", "hotcue_4_gotoandstop", 1);
        }
    } else
    if (value === 0) { 
        //midi.sendShortMsg(status, 0x12, 0x01);
        return }
    
    // Autoloop 8 beats
    if (value === 127 && MixstreamPro.AutoloopToggle2 == true && PlayStatus == 1) {
        midi.sendShortMsg(status, 0x0F, 0x01);
        midi.sendShortMsg(status, 0x10, 0x01);
        midi.sendShortMsg(status, 0x11, 0x01);
        midi.sendShortMsg(status, 0x12, 0x7f);

        //engine.setValue(group, "loop_end_position", -1);
        engine.setValue("[Channel2]", "beatloop_size", 8)

        var loopSize = engine.getValue("[Channel2]", "beatloop_size")

        engine.setValue("[Channel2]", "beatloop_" + loopSize + "_activate", true)
        engine.setValue("[Channel2]", "beatloop_activate", true)
        script.triggerControl(group, "reloop_toggle");
    } else
    if (value === 0) { 
        midi.sendShortMsg(status, 0x12, 0x01);
        return }

    // AutoloopRoll 1 beats
    if (value === 127 && MixstreamPro.BeatloopRollToggle2 == true && PlayStatus == 1) {
        midi.sendShortMsg(status, 0x0F, 0x01);
        midi.sendShortMsg(status, 0x10, 0x01);
        midi.sendShortMsg(status, 0x11, 0x01);
        midi.sendShortMsg(status, 0x12, 0x7f);
        
        engine.setValue(group, "loop_end_position", -1);
        engine.setValue("[Channel2]", "beatloop_size", 1)

        var loopSize = engine.getValue("[Channel2]", "beatloop_size")

        engine.setValue("[Channel2]", "beatlooproll_" + loopSize + "_activate", true)
        engine.setValue("[Channel2]", "beatlooproll_activate", true)
        script.triggerControl(group, "reloop_toggle");
    } else
    if (value === 0) { 
        midi.sendShortMsg(status, 0x12, 0x01);
        return }

    //if (value === 0) { return }
}

// TOGGLE EFFECT Switch : HOLD / ON
MixstreamPro.EffectToggleSwitch = function(channel, control, value, status, group) {
    if (channel === 4 && value === 1 && MixstreamPro.toggle1 == false || channel === 4 && value === 2 && MixstreamPro.toggle1 == false) {
        engine.setValue("[EffectRack1_EffectUnit1_Effect1]", "enabled", 1);
    } else {
        //value === 0
        engine.setValue("[EffectRack1_EffectUnit1_Effect1]", "enabled", 0);
    }

    if (channel === 5 && value === 1 && MixstreamPro.toggle1 == false || channel === 5 && value === 2 && MixstreamPro.toggle1 == false) {
        engine.setValue("[EffectRack1_EffectUnit2_Effect1]", "enabled", 1);
    } else {
        //value === 0
        engine.setValue("[EffectRack1_EffectUnit2_Effect1]", "enabled", 0);
    }

    if (channel === 4 && value === 1 && MixstreamPro.toggle2 == false || channel === 4 && value === 2 && MixstreamPro.toggle2 == false) {
        engine.setValue("[EffectRack1_EffectUnit1_Effect2]", "enabled", 1);
    } else {
        //value === 0
        engine.setValue("[EffectRack1_EffectUnit1_Effect2]", "enabled", 0);
    }

    if (channel === 5 && value === 1 && MixstreamPro.toggle2 == false || channel === 5 && value === 2 && MixstreamPro.toggle2 == false) {
        engine.setValue("[EffectRack1_EffectUnit2_Effect2]", "enabled", 1);
    } else {
        //value === 0
        engine.setValue("[EffectRack1_EffectUnit2_Effect2]", "enabled", 0);
    }

    if (channel === 4 && value === 1 && MixstreamPro.toggle3 == false || channel === 4 && value === 2 && MixstreamPro.toggle3 == false) {
        engine.setValue("[EffectRack1_EffectUnit1_Effect3]", "enabled", 1);
    } else {
        //value === 0
        engine.setValue("[EffectRack1_EffectUnit1_Effect3]", "enabled", 0);
    }

    if (channel === 5 && value === 1 && MixstreamPro.toggle3 == false || channel === 5 && value === 2 && MixstreamPro.toggle3 == false) {
        engine.setValue("[EffectRack1_EffectUnit2_Effect3]", "enabled", 1);
    } else {
        //value === 0
        engine.setValue("[EffectRack1_EffectUnit2_Effect3]", "enabled", 0);
    }

// Quick Effect FILTER to MOOG FILTER
    if (channel === 4 && value === 1 && MixstreamPro.toggle4 == false || channel === 4 && value === 2 && MixstreamPro.toggle4 == false) {
        // engine.setValue("[EffectRack1_EffectUnit1_Effect3]", "enabled", 1);
        // engine.setParameter("[QuickEffectRack1_[Channel1]]", "super1", 0.5);
    } else {
        
       // engine.setParameter("[QuickEffectRack1_[Channel1]]", "super1", 0.5);
    }

    if (channel === 5 && value === 1 && MixstreamPro.toggle4 == false || channel === 5 && value === 2 && MixstreamPro.toggle4 == false) {
        // engine.setParameter("[QuickEffectRack1_[Channel2]]", "super1", 0.5);
    } else {
      
        // engine.setParameter("[QuickEffectRack1_[Channel2]]", "super1", 0.5);
    }
}

// TOGGLE EFFECT buttons 
MixstreamPro.toggle1 = true
MixstreamPro.blinktimer1 = 0

MixstreamPro.Effectbutton1 = function(channel, control, value, status, group) {
    if (value === 127) {
        MixstreamPro.LEDblink1 = true
        if (MixstreamPro.toggle1 == true) {
            //midi.sendShortMsg(status, 0x00, 0x7f);
            MixstreamPro.blinktimer1 = engine.beginTimer(500, function() {
                if (MixstreamPro.LEDblink1 == true) {
                    midi.sendShortMsg(0x94, 0x00, 0x7F)
                    MixstreamPro.LEDblink1 = false
                } else {
                    midi.sendShortMsg(0x94, 0x00, 0x01)
                    MixstreamPro.LEDblink1 = true
                }
            });
            MixstreamPro.toggle1 = false
        } else
        if (MixstreamPro.toggle1 == false) {
            if (MixstreamPro.blinktimer1 !== 0) {
                engine.stopTimer(MixstreamPro.blinktimer1);
                //reset
                MixstreamPro.blinktimer1 = 0;
            }
            midi.sendShortMsg(0x94, 0x00, 0x01);
            MixstreamPro.toggle1 = true
        }
    } else
    if (value === 0) { return }
}

MixstreamPro.toggle2 = true
MixstreamPro.blinktimer2 = 0

MixstreamPro.Effectbutton2 = function(channel, control, value, status, group) {
    if (value === 127) {
        MixstreamPro.LEDblink2 = true
        if (MixstreamPro.toggle2 == true) {
            //midi.sendShortMsg(status, 0x01, 0x7f);
            MixstreamPro.blinktimer2 = engine.beginTimer(500, function() {
                if (MixstreamPro.LEDblink2 == true) {
                    midi.sendShortMsg(0x94, 0x01, 0x7F)
                    MixstreamPro.LEDblink2 = false
                } else {
                    midi.sendShortMsg(0x94, 0x01, 0x01)
                    MixstreamPro.LEDblink2 = true
                }
            });
            MixstreamPro.toggle2 = false
        } else
        if (MixstreamPro.toggle2 == false) {
            if (MixstreamPro.blinktimer2 !== 0) {
                engine.stopTimer(MixstreamPro.blinktimer2);
                //Reset
                MixstreamPro.blinktimer2 = 0;
            }

            midi.sendShortMsg(0x94, 0x01, 0x01);
            MixstreamPro.toggle2 = true
        }
    } else
    if (value === 0) { return }
}

MixstreamPro.toggle3 = true
MixstreamPro.blinktimer3 = 0

MixstreamPro.Effectbutton3 = function(channel, control, value, status, group) {
    if (value === 127) {
        MixstreamPro.LEDblink3 = true
        if (MixstreamPro.toggle3 == true) {
            //midi.sendShortMsg(status, 0x02, 0x7f);
            MixstreamPro.blinktimer3 = engine.beginTimer(500, function() {
                if (MixstreamPro.LEDblink3 == true) {
                    midi.sendShortMsg(0x94, 0x02, 0x7F)
                    MixstreamPro.LEDblink3 = false
                } else {
                    midi.sendShortMsg(0x94, 0x02, 0x01)
                    MixstreamPro.LEDblink3 = true
                }
            });
            MixstreamPro.toggle3 = false
        } else
        if (MixstreamPro.toggle3 == false) {
            if (MixstreamPro.blinktimer3 !== 0) {
                engine.stopTimer(MixstreamPro.blinktimer3);
                //Reset
                MixstreamPro.blinktimer3 = 0;
            }

            midi.sendShortMsg(0x94, 0x02, 0x01);
            MixstreamPro.toggle3 = true
        }
    } else
    if (value === 0) { return }
}

MixstreamPro.toggle4 = true
MixstreamPro.blinktimer4 = 0

MixstreamPro.Effectbutton4 = function(channel, control, value, status, group) {
    if (value === 127) {
        MixstreamPro.LEDblink4 = true
        if (MixstreamPro.toggle4 == true) {
            //midi.sendShortMsg(status, 0x02, 0x7f);
            MixstreamPro.blinktimer4 = engine.beginTimer(500, function() {
                if (MixstreamPro.LEDblink4 == true) {
                    midi.sendShortMsg(0x94, 0x03, 0x7F)
                    MixstreamPro.LEDblink4 = false
                } else {
                    midi.sendShortMsg(0x94, 0x03, 0x01)
                    MixstreamPro.LEDblink4 = true
                }
            });
            MixstreamPro.toggle4 = false
        } else
        if (MixstreamPro.toggle4 == false) {
            if (MixstreamPro.blinktimer4 !== 0) {
                engine.stopTimer(MixstreamPro.blinktimer4);
                //Reset
                MixstreamPro.blinktimer4 = 0;
            }

            midi.sendShortMsg(0x94, 0x03, 0x01);
            MixstreamPro.toggle4 = true
        }
    } else
    if (value === 0) { return }
}