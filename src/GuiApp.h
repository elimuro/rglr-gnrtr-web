//
//  GuiApp.h
//  example_ofxGui
//
//  Created by Elliot Bell on 2018-05-25.
//
//
#pragma once

#include "ofMain.h"
#include "ofxGui.h"
#include "ofxOsc.h"


#define PORT 12345


class GuiApp: public ofBaseApp {
public:
    void setup();
    void update();
    void draw();
    void clear();
    
    
    ofxOscReceiver receiver;
 
    

    
    ofParameter<float> soundSensitivity;


    
    ofxPanel gui;
    ofxToggle placeHolder;

    
    ofxGuiGroup threeD;
    ofxToggle ThreeD;
    ofxIntSlider shapeSelector;
    ofxFloatSlider camDistance,rotateX, rotateY;
    
    ofxGuiGroup animations;
    ofxToggle animation;
    ofxIntSlider animationType;
    ofxFloatSlider animationVal, sine, coSine;

    ofxGuiGroup shapes;
    ofxToggle grid, ellipses, quadrilaterals, triangles;

    ofxGuiGroup control;
    ofxIntSlider v1,speed, globalX, globalY, outer_R, inner_R, gridX, gridY, space;
    //ofxButton reset;
    ofxToggle debug, reset;
    
    ofxGuiGroup Clock;
    ofxToggle Counter;

    ofxGuiGroup colors;
    ofxToggle colourON, bgToggle;
    ofParameter<ofColor> fillcolour;

    


    
    
    
    
};

