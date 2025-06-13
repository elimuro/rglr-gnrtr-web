//
//  GuiApp.cpp
//
//  Created by Elliot Bell on 2018-05-25.
//
//

#include "GuiApp.h"
#include "ofApp.h"
#include "ofxOsc.h"

void GuiApp::setup(){
    
    ofEnableAntiAliasing();

    
    receiver.setup(PORT);
    
    ofSetVerticalSync(true);
    
    gui.setup();
    gui.setPosition(10, 60);
    gui.setName("Parameters");
    gui.add(placeHolder.setup("placeholder", false));
    
    gui.add(threeD.setup());
    threeD.setName("3D");
    threeD.add(ThreeD.setup("3D toggle", false));
    threeD.add(shapeSelector.setup("Shape Selector",0, 0, 2));
    threeD.add(camDistance.setup("camera Distance",300, 0, 1000));
    threeD.add(rotateX.setup("Rotate Y",0.01, 0, 1));
    threeD.add(rotateY.setup("Rotate X",0.01, 0, 1));
    
    gui.add(shapes.setup());
    shapes.setName("Shapes");
    shapes.add(grid.setup("Show Grid", false));
    shapes.add(ellipses.setup("Show Ellipses", true));
    shapes.add(quadrilaterals.setup("Show Quadrilaterals", true));
    shapes.add(triangles.setup("Show Triangles", true));
    
    gui.add(control.setup());
    control.setName("control");
    control.add(v1.setup("Scale",70, 0, 150));
    control.add(outer_R.setup("Outer Rotation",0, -180, 180));
    control.add(inner_R.setup("Interior Rotation",0, -180, 180));
    control.add(gridX.setup("Grid X Size",20, 0, 100));
    control.add(gridY.setup("Grid Y Size",20, 0, 100));
    control.add(globalX.setup("X Position",0, -1000, 1000));
    control.add(globalY.setup("Y Position",0, -800, 800));
    control.add(space.setup("Variation / Space",60, 0, 200));
    control.add(reset.setup("Hold to Reset", false));
    control.add(speed.setup("Frame Rate",60, 10, 60));
    control.add(debug.setup("Show Debug", false));
    

    gui.add(animations.setup());
    animations.setName("animation");
    animations.add(animation.setup("Animation", false));
    animations.add(animationType.setup("Animation Type",0, 0, 20));
    animations.add(animationVal.setup("Animation Variable",0.01, 0, 2));
    animations.add(sine.setup("sine",0.01, 0, 2));
    animations.add(coSine.setup("cosine",0.01, 0, 2));



    

    
    gui.add(Clock.setup());
    Clock.setName("Clock");
    Clock.add(Counter.setup("Show Clock", false));

    
    
    
    gui.add(colors.setup());
    colors.setName("Colours");
    colors.add(colourON.setup("Colour on", true));
    colors.add(fillcolour.set("Colour", ofColor()));
    colors.add(bgToggle.setup("Invert", false));




}

void GuiApp::update(){
    
    
///////OSC DATA LOOP
    
    while (receiver.hasWaitingMessages())
    {
        ofxOscMessage msg;
        receiver.getNextMessage(msg);
        
        
        ///OSC Control


        if(msg.getAddress() == "/control/gridSize")
        {
            
            gridX = msg.getArgAsInt(0);
            gridY = msg.getArgAsInt(1);
            
        }
        else if(msg.getAddress() == "/control/globalXY")
            
        {
            globalX = msg.getArgAsInt(0);
            globalY = msg.getArgAsInt(1);
        }
    
        else if(msg.getAddress() == "/control/Scale")
        {
          v1 = msg.getArgAsInt(0);
        }
        
        else if(msg.getAddress() == "/control/inner_R")
        {
            inner_R = msg.getArgAsInt(0);
        }
        else if(msg.getAddress() == "/control/outer_R")
        {
            outer_R = msg.getArgAsInt(0);
            
        }
        else if(msg.getAddress() == "/control/grid")
        {
            grid = msg.getArgAsInt(0);
        }
        else if(msg.getAddress() == "/control/speed")
        {
            speed = msg.getArgAsInt(0);
        }
        else if(msg.getAddress() == "/control/reset")
        {
            reset = msg.getArgAsInt(0);
        }
        
        
        
    ///OSC shapes
        
        else if(msg.getAddress() == "/shapes/ellipses")
        {
            ellipses= msg.getArgAsInt(0);
        }
        else if(msg.getAddress() == "/shapes/quadrilaterals")
        {
           quadrilaterals = msg.getArgAsInt(0);
        }
        else if(msg.getAddress() == "/shapes/triangles")
        {
            triangles = msg.getArgAsInt(0);
        }
        
        else if(msg.getAddress() == "/shapes/space")
        {
            space = msg.getArgAsInt(0);
        }
     
        
        /// 3D
        
        else if(msg.getAddress() == "/3D/ThreeD")
        {
            ThreeD = msg.getArgAsInt(0);
        }
  
        else if(msg.getAddress() == "/3D/shapeSelector")
        {
            shapeSelector = msg.getArgAsInt(0);
        }
        else if(msg.getAddress() == "/3D/camDistance")
        {
            camDistance = msg.getArgAsFloat(0);
        }
        else if(msg.getAddress() == "/3D/rotations")
            
        {
            rotateX = msg.getArgAsFloat(0);
            rotateY = msg.getArgAsFloat(1);
        }
        

        
        /// Animation

        
        else if(msg.getAddress() == "/animation/animation")
        {
            animation = msg.getArgAsInt(0);
        }
        
        else if(msg.getAddress() == "/animation/animationType")
        {
            animationType = msg.getArgAsInt(0);
        }
        else if(msg.getAddress() == "/animation/animationVal")
        {
            animationVal = msg.getArgAsFloat(0);
        }
        
        else if(msg.getAddress() == "/animation/sine")
        {
            sine = msg.getArgAsFloat(0);
        }
        else if(msg.getAddress() == "/animation/coSine")
        {
            coSine = msg.getArgAsFloat(0);
        }
        
        
        
        ///Colour
        

        else if(msg.getAddress() == "/colour/fillcolour")
        {
            fillcolour = msg.getArgAsRgbaColor(0);
        }

        
        
        string msg_string = msg.getAddress();
        cout << msg_string << endl;
    }
    
///////OSC DATA LOOP END
    


}

void GuiApp::draw(){
    
    /// show frame rate in the window
    ofSetWindowTitle(ofToString(ofGetFrameRate()));
    ofBackground(0);
    
    gui.draw();
   // colors.draw();

    
}
