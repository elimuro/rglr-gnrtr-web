#pragma once

#include "ofMain.h"
#include "ofxGui.h"
#include "ofxPanel.h"
#include "ofxGui.h"
#include "ofxOsc.h"

#define PORT 12345


class ofApp : public ofBaseApp{

	public:
		void setup();
		void update();
		void draw();
        void exit();
        void points();
    
    //diamond
        void diamond();
    //ellipses
        void ellipse();
        void ellipse_neg();
    
        void ellipse_BL();
        void ellipse_BR();
        void ellipse_TL();
        void ellipse_TR();

        void ellipse_neg_BL();
        void ellipse_neg_BR();
        void ellipse_neg_TL();
        void ellipse_neg_TR();
    
        void ellipse_semi_neg_LEFT();
        void ellipse_semi_neg_RIGHT();
        void ellipse_semi_neg_UP();
        void ellipse_semi_neg_DOWN();
    
        void ellipse_semi_LEFT();
        void ellipse_semi_RIGHT();
        void ellipse_semi_UP();
        void ellipse_semi_DOWN();
    
    
    //rectangles
        void Rect();
        void longRect_V();
        void longRect_H();
        void rect_TL();
        void rect_TR();
        void rect_BL();
        void rect_BR();
    
        void rect_angled_TOP();
        void rect_angled_BOTTOM();
        void rect_angled_LEFT();
        void rect_angled_RIGHT();




    
    
    //triangles
        void triangle_UP();
        void triangle_DOWN();
        void triangle_LEFT();
        void triangle_RIGHT();

        void triangle_TL();
        void triangle_BL();
        void triangle_TR();
        void triangle_BR();
    
        void triangle_split_UP();
        void triangle_split_DOWN();
        void triangle_split_LEFT();
        void triangle_split_RIGHT();
    
        void triangle_IN_V();
        void triangle_IN_H();
    
        void triangle_neg_IN_DOWN();
        void triangle_neg_IN_UP();
        void triangle_neg_IN_RIGHT();
        void triangle_neg_IN_LEFT();
    
    
    void triangle_neg_DOWN();
    void triangle_neg_UP();
    void triangle_neg_RIGHT();
    void triangle_neg_LEFT();
    
    
        void triangle_bottom_LEFT();
        void triangle_bottom_DOWN();
        void triangle_bottom_RIGHT();
        void triangle_bottom_UP();

        void triangle_edge_BOTTOM();
        void triangle_edge_TOP();
        void triangle_edge_LEFT();
        void triangle_edge_RIGHT();
    
    


		void keyPressed(int key);
        void keyReleased(int key);


    
    
    //variables
    
    
    int animate;
    
    int v2;
    
    //bool guiToggle;
    
    int rand;
    int rand2[100];
    int randFinal = 0;

    int clocking[6];
    int MSEC[60];
    
    int aniStyle[20];
    int increment;
    


    ofImage logo;

    
    ///use this instead in the future
    ofPoint pt[16];

    ofPoint pt1;
    ofPoint pt1_25;
    ofPoint pt1_50;
    ofPoint pt1_75;
    
    ofPoint pt2;
    ofPoint pt2_25;
    ofPoint pt2_50;
    ofPoint pt2_75;

    ofPoint pt3;
    ofPoint pt3_25;
    ofPoint pt3_50;
    ofPoint pt3_75;
    
    ofPoint pt4;
    ofPoint pt4_25;
    ofPoint pt4_50;
    ofPoint pt4_75;
    
    
    int mSecond;
    int second;
    int minute;
    int hour;
    int day;
    int year;

    bool hideCursor;
    
    ofEasyCam cam;
    ofEasyCam camStatic;

    ofFbo fbo;
    ofFbo fboStatic;
    
    ofSpherePrimitive sphere;
    ofBoxPrimitive box;
    ofConePrimitive cone;
    

    int aniSin;
    int aniCos;

    ////
    
    float startTime; // store when we start time timer
    float endTime; // when do want to stop the timer
    bool  bTimerReached; // used as a trigger when we hit the timer
  
    
    ///
    
    string originalFileExtension;

    //enables sending gui data to main app
    //shared_ptr<GuiApp> gui;

    
    
    ////GUui
    
    
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
    
    ofxGuiGroup utility;
    ofxToggle accToggle, guiToggle;


    
    
};
