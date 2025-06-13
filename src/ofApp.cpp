#include "ofApp.h"

//--------------------------------------------------------------
void ofApp::setup(){
    
    /// v1 is Scale
    ofEnableAlphaBlending();
    ofSetVerticalSync(true);
    ofEnableAntiAliasing();
    camStatic.enableOrtho();
    ofSetCircleResolution(30);

    //FBO Setup
    fbo.begin();
    ofClear(255, 255, 255, 255);
    fbo.end();
    
    fboStatic.begin();
    ofClear(255, 255, 255, 255);
    fboStatic.end();
    
    // v2 is debug circle radius
    v2 = 5;
    
    
    /// set up logo and data paths
    ofSetDataPathRoot("../Resources/");
    logo.load("rglr_logo.png");
    system("mkdir RGLR_patterns");
    
    guiToggle = true;
    
    //timer stuff
    bTimerReached = false;
    startTime = ofGetElapsedTimeMillis();  // get the start time
    endTime = 1000; // in milliseconds
    
    
    
    ////// GUI App
    receiver.setup(PORT);
    
    
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
    
    
    
    gui.add(utility.setup());
    utility.setName("Uitls");
    utility.add(guiToggle.setup("Gui", false));
    utility.add(accToggle.setup("XYZ", false));


    
    
}

//--------------------------------------------------------------
void ofApp::update(){
    
    
    pt1 = ofPoint(0,0);
    pt1_25 = ofPoint(v1*0.25,0);
    pt1_50 = ofPoint(v1*0.5,0);
    pt1_75 = ofPoint(v1*0.75,0);
    
    pt2 = ofPoint(v1,0);
    pt2_25 = ofPoint(v1,v1*0.25);
    pt2_50 = ofPoint(v1,v1*0.5);
    pt2_75 = ofPoint(v1,v1*0.75);
    
    pt3 = ofPoint(v1,v1);
    pt3_25 = ofPoint(v1*0.75, v1);
    pt3_50 = ofPoint(v1*0.5, v1);
    pt3_75 = ofPoint(v1*0.25, v1);
    
    pt4 = ofPoint(0,v1);
    pt4_25 = ofPoint(0, v1*0.75);
    pt4_50 = ofPoint(0, v1*0.5);
    pt4_75 = ofPoint(0, v1*0.25);
    
    
    if (reset){
        
        inner_R = ofLerpDegrees(inner_R, 0, 0.1);
        outer_R = ofLerpDegrees(outer_R, 0, 0.15);
        globalX = ofLerp(globalX,240, 0.1);
        globalY = ofLerp(globalY,10, 0.1);
        
        gridX = ofLerp(gridX,13, 0.1);
        gridY = ofLerp(gridY,10, 0.1);
        v1 = ofLerp(v1,70, 0.1);
    }
    
    
    /// Time Variables
    second = ofGetSeconds();
    minute = ofGetMinutes();
    hour = ofGetHours();
    day = ofGetDay();
    year = ofGetYear()-2000;
    
    
    ///hide and show cursor
    if ( hideCursor == true){
        ofHideCursor();
    }else{
        ofShowCursor();
    }
    
    
    
    
    ////NEW adding sin and cos fo animation
    
  //  aniSin = ofMap(gui->sine, 0, 2, 0, 60 );
   // aniCos = ofMap(gui->coSine, 0, 2, 0, 60 );

    
    
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
        
        
        ///XYZ
        
        
        else if(msg.getAddress() == "/utility/accToggle")
        {
            accToggle = msg.getArgAsInt(0);
        }
        else if(msg.getAddress() == "/utility/guiToggle")
        {
            guiToggle = msg.getArgAsInt(0);
        }
        
        
        if ( accToggle){
            
            if (msg.getAddress() == "/accxyz")
            {
                rotateX = msg.getArgAsFloat(0);
                rotateY = msg.getArgAsFloat(1);
                //v1 = msg.getArgAsFloat(2);

            }
        }
        
        
        string msg_string = msg.getAddress();
        cout << msg_string << endl;
    }
    
    ///////OSC DATA LOOP END

    //v1 = v1*100;
    
}

//--------------------------------------------------------------

void ofApp::draw(){
    
    
    ofSeedRandom(mouseX*1000);
    
    //// Inversion & Colour Logic
    if (bgToggle == TRUE){
        ofBackground(255);
        //        gui->fillcolour = 0;
        
    }else{
        ofBackground(0);
        //gui->fillcolour = 255;
        //if(gui->colourON == true){
        //gui->fillcolour = gui->fillcolour;
        //}
    }
    
    
    /////timer
    float barWidth = 60;
    
    // update the timer this frame
    float timer = ofGetElapsedTimeMillis() - startTime;
    
    if(timer >= endTime && !bTimerReached) {
        bTimerReached = true;
        ofMessage msg("Timer Reached");
        ofSendMessage(msg);
    }
    
    // get the percentage of the timer
    float pct = ofMap(timer, 0.0, endTime, 0.0, 1.0, true);
    
    if ( bTimerReached == true){
        bTimerReached = false;                     // reset the timer
        startTime = ofGetElapsedTimeMillis();  // get the start time
        endTime = 1000; // in milliseconds
    }
    
    mSecond = barWidth*pct;
    
    fbo.allocate(ofGetWidth(), ofGetHeight());
    fbo.begin();
    ofClear(255);
    
    ofPushMatrix();
    ofRotate(outer_R);
    
    ///this builds the grid structure
    for (int i = 0; i < gridX; i++){
        for (int j = 0; j < gridY; j++){
            
            ofPushMatrix();/// translate
            
            //translates shapes onto grid
            ofTranslate(globalX + i*v1, globalY + j*v1);
            
            
            //generate randomly on the grid
            randFinal = ofRandom(space) - rand2[i];
            
            //generate Animation
            
            if (animation == true ){
                
                ofSetFrameRate(speed);
                
                if ( animationType == 0){
                    
                    //Noise wave
                    randFinal =  ofNoise(i*animationVal, ofGetElapsedTimef())*space;
                    
                }
                
                if ( animationType == 1){
                    
                    int sinRand;
                    sinRand = sin(ofGetElapsedTimef()*i*j)*space;
                    int sinClamp;
                    sinClamp = ofMap(sinRand,-1 ,1, 0, i);
                    randFinal = ofClamp(sinClamp, 0, j);
                    
                }
                
                
                if ( animationType == 2){
                    ///Trippy
                    randFinal = ofMap(sin(ofGetElapsedTimef()*animationVal/i), -1, 1, 0, 60)*j;
                    
                }
                if (animationType == 3){
                    //crazy
                    randFinal = ofMap(sin(ofGetElapsedTimef()*animationVal/i*j), -1, 1, 0, 60);
                }
                if (animationType == 4){
                    randFinal = ofMap(sin(ofGetElapsedTimef()*animationVal/i*j), -1, 1, 0, 60)*space;
                }
                if (animationType == 5){
                    //close
                    randFinal = ofMap(sin(ofGetElapsedTimef()*space/j+i), -1, 1, 0, 60);
                }
                if (animationType == 6){
                    randFinal = ofMap(sin(ofGetElapsedTimef()*animationVal/j), -1, 1, 0, 60);
                }
                
                if (animationType == 7){
                    int sinRand;
                    sinRand = sin(ofGetElapsedTimef()*i/j)*space;
                    int sinClamp;
                    randFinal = ofMap(sinRand,-1 ,1, 0, 60)/i;
                }
                
                if ( animationType == 7){
                    int sinRand;
                    sinRand = sin(ofGetElapsedTimef()/i/j)*space;
                    int sinClamp;
                    randFinal = ofMap(sinRand,-1 ,1, 0, 60)/i;
                }
                if ( animationType == 8){
                    randFinal = ofMap(sin(ofGetElapsedTimef()*space/j), -1, 1, 0, 60);
                }
                if ( animationType == 9){
                    randFinal = ofMap(sin(ofGetElapsedTimef()*animationVal/j), -1, 1, 0, 60);
                }
                if ( animationType == 10){
                    int sinRand;
                    sinRand = sin(ofGetElapsedTimef()/i/j)*space;
                    randFinal = ofMap(sinRand,-1 ,1, i, j);
                }
                if ( animationType == 11){
                    //Noise wave
                    randFinal =  sin(i*animationVal*ofGetElapsedTimef())*space;
                }
                if ( animationType == 12){
                    
                    ////NEW adding sin and cos fo animation

                    
                   // randFinal = sin(aniSin/aniCos);
                }
                
                
                
                
            }
            
            ofPushMatrix(); //inner R
            ofRotate(inner_R);
            
            ///////Ellipses
            
            if( ellipses ){
                
                if( randFinal == 0){
                    ellipse();
                }
                if( randFinal == 1){
                    ellipse_neg();      }
                
                if(randFinal == 2){
                    ellipse_TL();
                }
                if(randFinal == 3){
                    ellipse_TR();
                }
                if(randFinal == 4){
                    ellipse_BR();
                }
                if(randFinal == 5){
                    ellipse_BL();
                }
                
                
                if(randFinal == 6){
                    ellipse_neg_TL();
                }
                if(randFinal == 7){
                    ellipse_neg_TR();
                }
                
                ///---------///check function to make sure drawing is correct
                if(randFinal == 8){
                    ellipse_neg_BR();
                }
                if(randFinal == 9){
                    ellipse_neg_BL();
                }
                
                
                
                if(randFinal == 10){
                    ellipse_semi_UP();
                }
                if(randFinal == 11){
                    ellipse_semi_RIGHT();
                }
                if(randFinal == 12){
                    ellipse_semi_DOWN();
                }
                if(randFinal == 13){
                    ellipse_semi_LEFT();
                }
                
                
                
                if( randFinal == 14){
                    ellipse_semi_neg_UP();     }
                if( randFinal == 15){
                    ellipse_semi_neg_RIGHT();     }
                if( randFinal == 16){
                    ellipse_semi_neg_DOWN();     }
                if( randFinal == 17){
                    ellipse_semi_neg_LEFT();     }
                
                
                
                
            }//ellipses
            
            
            ////RECTANGLES
            
            if( quadrilaterals){
                
                if( randFinal == 18){
                    diamond();       }
                
                if( randFinal == 19){
                    Rect();}
                if(randFinal == 20){
                    longRect_H();}
                if(randFinal == 21){
                    longRect_V();}
                
                
                if( randFinal == 22){
                    rect_TL();            }
                
                if( randFinal == 23){
                    rect_TR();            }
                if( randFinal == 24){
                    rect_BR();            }
                
                if( randFinal == 25){
                    rect_BL();            }
                
                
                if( randFinal == 26){
                    rect_angled_TOP();}
                if( randFinal == 27){
                    rect_angled_RIGHT();}
                if( randFinal == 28){
                    rect_angled_BOTTOM();}
                if( randFinal == 29){
                    rect_angled_LEFT();}
                
            }//quads
            
            
            ///TRIANGLES
            
            if ( triangles ){
                
                if(randFinal == 30){
                    triangle_UP();
                }
                if(randFinal == 31){
                    triangle_RIGHT();
                }
                if(randFinal == 32){
                    triangle_DOWN();
                }
                if(randFinal == 33){
                    triangle_LEFT();
                }
                
                if(randFinal == 34){
                    triangle_TL();
                }
                if(randFinal == 35){
                    triangle_TR();
                }
                if(randFinal == 36){
                    triangle_BR();
                }
                if(randFinal == 37){
                    triangle_BL();
                }
                
                if(randFinal == 38){
                    triangle_split_UP();
                }
                if(randFinal == 39){
                    triangle_split_RIGHT();
                }
                if(randFinal == 40){
                    triangle_split_DOWN();
                }
                if(randFinal == 41){
                    triangle_split_LEFT();
                }
                
                
                if( randFinal == 42){
                    triangle_IN_V();
                }
                if( randFinal == 43){
                    triangle_IN_H();
                }
                
                if( randFinal == 44){
                    triangle_neg_IN_DOWN();
                    
                }
                if( randFinal == 45){
                    triangle_neg_IN_LEFT();
                }
                if( randFinal == 46){
                    triangle_neg_IN_UP();
                    
                }
                if( randFinal == 47){
                    triangle_neg_IN_RIGHT();
                }
                if( randFinal == 48){
                    triangle_bottom_UP();}
                if( randFinal == 49){
                    triangle_bottom_RIGHT();
                }
                if( randFinal == 50){
                    triangle_bottom_DOWN();
                }
                if( randFinal == 51){
                    triangle_bottom_LEFT();
                }
                if( randFinal == 52){
                    triangle_edge_TOP();
                }
                if( randFinal == 53){
                    triangle_edge_RIGHT();
                }
                if( randFinal == 54){
                    triangle_edge_BOTTOM();
                }
                if( randFinal == 55){
                    triangle_edge_LEFT();
                }
                
                
                if( randFinal == 56){
                    triangle_neg_UP();
                }
                if( randFinal == 57){
                    triangle_edge_RIGHT();
                }
                if( randFinal == 58){
                    triangle_neg_DOWN();
                }
                if( randFinal == 59){
                    triangle_edge_LEFT();
                }
                
            }//triangles
            
            
            ofPopMatrix();/// inner R
            
            
            ofPopMatrix();///grid translate
            
        } // j
    } // i
    
    ofPopMatrix();//outer R
    
    if (grid){
        points();
    }
    
    fbo.end();
    
    if (ThreeD){ //////////////////////3D BEGIN
        
        
        cam.begin();
        cam.setDistance(camDistance);
        
        ofPushMatrix(); /// primitives
        
        ofRotateZ(ofGetElapsedTimef()*rotateX);
        ofRotateY(ofGetElapsedTimef()*rotateY);
        ofSetColor(fillcolour);
        
        if (shapeSelector == 0){
            
            sphere.mapTexCoordsFromTexture(fbo.getTexture());
            fbo.getTexture().bind();
            sphere.setRadius(100);
            sphere.draw();
            
        }else if (shapeSelector == 1){
            
            box.mapTexCoordsFromTexture(fbo.getTexture());
            fbo.getTexture().bind();
            box.draw();
        }else if (shapeSelector == 2){
            
            cone.mapTexCoordsFromTexture(fbo.getTexture());
            fbo.getTexture().bind();
            cone.draw();
            
        }
        
        ofPopMatrix(); ///Primitives
        cam.end();
        
        
    }/// ThreeD
    
    else{
        
        camStatic.begin();
        
        fboStatic.allocate(ofGetWidth(), ofGetHeight());
        fboStatic.begin();
        fboStatic.clear();
        
        if (debug){
            
            ofSetColor(0,255,255);
            
            
            string  info  = "timer: "+ofToString(timer)+"\n";
            info += "millis: "+ofToString(mSecond)+"\n";
            info += "seconds: "+ofToString(second)+"\n";
            info += "minute: "+ofToString(minute)+"\n";
            info += "hour: "+ofToString(hour)+"\n";
            info += "day: "+ofToString(day)+"\n";
            info += "year: "+ofToString(year)+"\n";
            info += "array posistion: "+ofToString(randFinal)+"\n";
            info += "increment: "+ofToString(increment)+"\n";
            ofDrawBitmapString(info, 17, 570);
            
            
            ofNoFill();
            
            for (int i = 0; i < 10; i++){
                float sinVal = sin(ofGetElapsedTimef() + i*animationVal );
                
                ofPushMatrix();
                ofTranslate(17, 17);
                
                ofDrawCircle(5+10*i, ofMap(sinVal, -1, 1, 110,190), 2);
                ofPopMatrix();
                
            }
        }
        

        fboStatic.end();
        camStatic.end();
        
        fboStatic.draw(0,0);
        fbo.draw(0,0);
        
    }
    
    if (guiToggle){
        
    gui.draw();
        
    };

}


//-TRIANGLES-----------------------------------------------------

void ofApp::triangle_UP(){
    
    
    //pointer to gui v1
    int v1 = v1;
    ofSetColor(fillcolour);
    
    ofDrawTriangle(0,v1, v1/2 ,0, v1, v1);
    
}

//--------------------------------------------------------------

void ofApp::triangle_DOWN(){
    
    
    
    
    ofPolyline poly;
    poly.addVertex(pt1);
    poly.addVertex(pt2);
    poly.addVertex(pt3_50);
    
    ofPath path;
    path.setFillColor(fillcolour);
    
    for( int i = 0; i < poly.getVertices().size(); i++) {
        if(i == 0) {
            path.newSubPath();
            path.moveTo(poly.getVertices()[i] );
        } else {
            path.lineTo( poly.getVertices()[i] );
        }
    }
    
    path.close();
    path.draw();
    
}
//--------------------------------------------------------------

void ofApp::triangle_LEFT(){
    
    
    
    ofPolyline poly;
    poly.addVertex(pt2);
    poly.addVertex(pt3);
    poly.addVertex(pt4_50);
    
    ofPath path;
    path.setFillColor(fillcolour);
    
    for( int i = 0; i < poly.getVertices().size(); i++) {
        if(i == 0) {
            path.newSubPath();
            path.moveTo(poly.getVertices()[i] );
        } else {
            path.lineTo( poly.getVertices()[i] );
        }
    }
    path.close();
    path.draw();
    
}
//--------------------------------------------------------------

void ofApp::triangle_RIGHT(){
    
    ///ofScale(1, -1, 1);
    
    
    ofPolyline poly;
    poly.addVertex(pt1);
    poly.addVertex(pt4);
    poly.addVertex(pt2_50);
    
    ofPath path;
    path.setFillColor(fillcolour);
    
    for( int i = 0; i < poly.getVertices().size(); i++) {
        if(i == 0) {
            path.newSubPath();
            path.moveTo(poly.getVertices()[i] );
        } else {
            path.lineTo( poly.getVertices()[i] );
        }
    }
    path.close();
    path.draw();
    
}
//--------------------------------------------------------------

void ofApp::triangle_TL(){
    
    ofPolyline poly;
    poly.addVertex(pt1);
    poly.addVertex(pt2);
    poly.addVertex(pt4);
    ofPath path;
    path.setFillColor(fillcolour);
    
    for( int i = 0; i < poly.getVertices().size(); i++) {
        if(i == 0) {
            path.newSubPath();
            path.moveTo(poly.getVertices()[i] );
        } else {
            path.lineTo( poly.getVertices()[i] );
        }
    }
    
    path.close();
    path.draw();
    
}
//--------------------------------------------------------------

void ofApp::triangle_BL(){
    
    ofPolyline poly;
    poly.addVertex(pt1);
    poly.addVertex(pt4);
    poly.addVertex(pt3);
    ofPath path;
    path.setFillColor(fillcolour);
    
    for( int i = 0; i < poly.getVertices().size(); i++) {
        if(i == 0) {
            path.newSubPath();
            path.moveTo(poly.getVertices()[i] );
        } else {
            path.lineTo( poly.getVertices()[i] );
        }
    }
    
    path.close();
    path.draw();
    
}
//--------------------------------------------------------------

void ofApp::triangle_BR(){
    
    ofPolyline poly;
    poly.addVertex(pt2);
    poly.addVertex(pt3);
    poly.addVertex(pt4);
    ofPath path;
    path.setFillColor(fillcolour);
    
    for( int i = 0; i < poly.getVertices().size(); i++) {
        if(i == 0) {
            path.newSubPath();
            path.moveTo(poly.getVertices()[i] );
        } else {
            path.lineTo( poly.getVertices()[i] );
        }
    }
    
    path.close();
    path.draw();
    
}
//--------------------------------------------------------------

void ofApp::triangle_TR(){
    
    
    
    ofPolyline poly;
    poly.addVertex(pt1);
    poly.addVertex(pt2);
    poly.addVertex(pt3);
    ofPath path;
    path.setFillColor(fillcolour);
    
    for( int i = 0; i < poly.getVertices().size(); i++) {
        if(i == 0) {
            path.newSubPath();
            path.moveTo(poly.getVertices()[i] );
        } else {
            path.lineTo( poly.getVertices()[i] );
        }
    }
    
    path.close();
    path.draw();
    
}
//RECTANGLES-------------------------------------------------------


void ofApp::Rect(){
    
    //pointer to gui v1
    ofSetColor(fillcolour);
    ofDrawRectangle(0, 0, v1, v1);
    
}
void ofApp::longRect_V(){
    
    ofPolyline poly;
    poly.addVertex(pt1_25);
    poly.addVertex(pt1_75);
    poly.addVertex(pt3_25);
    poly.addVertex(pt3_75);
    
    ofPath path;
    path.setFillColor(fillcolour);
    
    for( int i = 0; i < poly.getVertices().size(); i++) {
        if(i == 0) {
            path.newSubPath();
            path.moveTo(poly.getVertices()[i] );
        } else {
            path.lineTo( poly.getVertices()[i] );
        }
    }
    
    path.close();
    path.draw();
    
}

//--------------------------------------------------------------

void ofApp::longRect_H(){
    
    
    
    ofPolyline poly;
    poly.addVertex(pt4_75);
    poly.addVertex(pt2_25);
    poly.addVertex(pt2_75);
    poly.addVertex(pt4_25);
    
    ofPath path;
    path.setFillColor(fillcolour);
    
    for( int i = 0; i < poly.getVertices().size(); i++) {
        if(i == 0) {
            path.newSubPath();
            path.moveTo(poly.getVertices()[i] );
        } else {
            path.lineTo( poly.getVertices()[i] );
        }
    }
    
    path.close();
    path.draw();
    
}

void ofApp::rect_BL(){
    
    
    ofPolyline poly;
    poly.addVertex(pt1);
    poly.addVertex(pt2);
    poly.addVertex(pt3);
    poly.addVertex(pt3_50);
    poly.addVertex(v1*0.5, v1*0.5);
    poly.addVertex(pt4_50);
    poly.addVertex(pt1);
    
    ofPath path;
    path.setFillColor(fillcolour);
    
    for( int i = 0; i < poly.getVertices().size(); i++) {
        if(i == 0) {
            path.newSubPath();
            path.moveTo(poly.getVertices()[i] );
        } else {
            path.lineTo( poly.getVertices()[i] );
        }
    }
    
    path.close();
    path.draw();
    
}

void ofApp::rect_BR(){
    

    ofPolyline poly;
    poly.addVertex(pt2);
    poly.addVertex(pt1);
    poly.addVertex(pt4);
    poly.addVertex(pt3_50);
    poly.addVertex(v1*0.5, v1*0.5);
    poly.addVertex(pt2_50);
    poly.addVertex(pt2);
    
    ofPath path;
    path.setFillColor(fillcolour);
    
    for( int i = 0; i < poly.getVertices().size(); i++) {
        if(i == 0) {
            path.newSubPath();
            path.moveTo(poly.getVertices()[i] );
        } else {
            path.lineTo( poly.getVertices()[i] );
        }
    }
    
    path.close();
    path.draw();
    
}
void ofApp::rect_TR(){
    

    ofPolyline poly;
    poly.addVertex(pt1);
    poly.addVertex(pt4);
    poly.addVertex(pt3);
    poly.addVertex(pt2_50);
    poly.addVertex(v1*0.5,v1*0.5);
    poly.addVertex(pt1_50);
    poly.addVertex(pt1);
    
    ofPath path;
    path.setFillColor(fillcolour);
    
    for( int i = 0; i < poly.getVertices().size(); i++) {
        if(i == 0) {
            path.newSubPath();
            path.moveTo(poly.getVertices()[i] );
        } else {
            path.lineTo( poly.getVertices()[i] );
        }
    }
    
    path.close();
    path.draw();
    
}

void ofApp::rect_TL(){
    
    

    
    ofPolyline poly;
    poly.addVertex(pt2);
    poly.addVertex(pt3);
    poly.addVertex(pt4);
    poly.addVertex(pt4_50);
    poly.addVertex(v1*0.5, v1*0.5);
    poly.addVertex(pt1_50);
    poly.addVertex(pt2);
    
    ofPath path;
    path.setFillColor(fillcolour);
    
    for( int i = 0; i < poly.getVertices().size(); i++) {
        if(i == 0) {
            path.newSubPath();
            path.moveTo(poly.getVertices()[i] );
        } else {
            path.lineTo( poly.getVertices()[i] );
        }
    }
    
    path.close();
    path.draw();
    
}

//ELLIPSES--------------------------------------------------------------

void ofApp::ellipse(){
    

    
    ofSetColor(fillcolour);
    ofDrawEllipse(v1/2, v1/2,v1, v1);
}
//--------------------------------------------------------------

void ofApp::ellipse_BR(){
    
    ofPolyline poly;
    poly.addVertex(pt1);
    poly.bezierTo(v1/2, 0, v1, v1/2, v1,v1);
    poly.addVertex(pt4);
    
    ofPath path;
    path.setFillColor(fillcolour);
    
    for( int i = 0; i < poly.getVertices().size(); i++) {
        if(i == 0) {
            path.newSubPath();
            path.moveTo(poly.getVertices()[i] );
        } else {
            path.lineTo( poly.getVertices()[i] );
        }
    }
    
    path.close();
    path.draw();
    
}

//--------------------------------------------------------------

void ofApp::ellipse_BL(){
    

    
    ofPolyline poly;
    poly.addVertex(pt1);
    poly.bezierTo(0,v1/2,v1/2,v1, v1,v1);
    poly.addVertex(pt4);
    
    ofPath path;
    path.setFillColor(fillcolour);
    
    for( int i = 0; i < poly.getVertices().size(); i++) {
        if(i == 0) {
            path.newSubPath();
            path.moveTo(poly.getVertices()[i] );
        } else {
            path.lineTo( poly.getVertices()[i] );
        }
    }
    
    path.close();
    path.draw();
    
}

//--------------------------------------------------------------

void ofApp::ellipse_TR(){
    

    
    ofPolyline poly;
    poly.addVertex(pt1);
    poly.bezierTo(0,v1/2,v1/2,v1,v1, v1);
    poly.addVertex(pt2);
    
    ofPath path;
    path.setFillColor(fillcolour);
    
    for( int i = 0; i < poly.getVertices().size(); i++) {
        if(i == 0) {
            path.newSubPath();
            path.moveTo(poly.getVertices()[i] );
        } else {
            path.lineTo( poly.getVertices()[i] );
        }
    }
    
    path.close();
    path.draw();
    
}

//--------------------------------------------------------------

void ofApp::ellipse_TL(){

    
    ofPolyline poly;
    poly.addVertex(pt4);
    poly.bezierTo(v1/2,v1, v1, v1/2, v1, 0);
    poly.addVertex(pt1);
    
    ofPath path;
    path.setFillColor(fillcolour);
    
    for( int i = 0; i < poly.getVertices().size(); i++) {
        if(i == 0) {
            path.newSubPath();
            path.moveTo(poly.getVertices()[i] );
        } else {
            path.lineTo( poly.getVertices()[i] );
        }
    }
    
    path.close();
    path.draw();
    
}
//NEGATIVE ELLIPSES--------------------------------------------------------------




void ofApp::ellipse_neg_BL(){
    
    

    
    ofPolyline poly;
    poly.addVertex(pt4);
    poly.bezierTo(v1/2,v1, v1, v1/2, v1, 0);
    poly.addVertex(pt3);
    
    ofPath path;
    path.setFillColor(fillcolour);
    
    for( int i = 0; i < poly.getVertices().size(); i++) {
        if(i == 0) {
            path.newSubPath();
            path.moveTo(poly.getVertices()[i] );
        } else {
            path.lineTo( poly.getVertices()[i] );
        }
    }
    
    path.close();
    path.draw();
    
}

//--------------------------------------------------------------
void ofApp::ellipse_neg_BR(){
    
    ////////----fix this one STIL
    

    ofPolyline poly;
    //    poly.addVertex(pt3);
    //    poly.bezierTo(v1, v1/2, v1, v1/2, v1, 0);
    //    poly.addVertex(pt4);
    //
    
    //        poly.addVertex(pt2);
    //        poly.bezierTo(v1, v1/2, v1, v1/2, v1, 0);
    //        poly.addVertex(pt4);
    ofPath path;
    path.setFillColor(fillcolour);
    
    for( int i = 0; i < poly.getVertices().size(); i++) {
        if(i == 0) {
            path.newSubPath();
            path.moveTo(poly.getVertices()[i] );
        } else {
            path.lineTo( poly.getVertices()[i] );
        }
    }
    
    path.close();
    path.draw();
    
    
}
//--------------------------------------------------------------
void ofApp::ellipse_neg_TL(){
    
    

    
    ofPolyline poly;
    poly.addVertex(pt4);
    poly.bezierTo(0, v1/2, v1/2, 0, v1, 0);
    poly.addVertex(pt1);
    
    ofPath path;
    path.setFillColor(fillcolour);
    
    for( int i = 0; i < poly.getVertices().size(); i++) {
        if(i == 0) {
            path.newSubPath();
            path.moveTo(poly.getVertices()[i] );
        } else {
            path.lineTo( poly.getVertices()[i] );
        }
    }
    
    path.close();
    path.draw();
    
    
}
//--------------------------------------------------------------
void ofApp::ellipse_neg_TR(){
    
    

    
    ofPolyline poly;
    poly.addVertex(pt1);
    poly.bezierTo(v1/2, 0, v1, v1/2, v1, v1);
    poly.addVertex(pt2);
    
    ofPath path;
    path.setFillColor(fillcolour);
    
    for( int i = 0; i < poly.getVertices().size(); i++) {
        if(i == 0) {
            path.newSubPath();
            path.moveTo(poly.getVertices()[i] );
        } else {
            path.lineTo( poly.getVertices()[i] );
        }
    }
    
    path.close();
    path.draw();
    
    
}

void ofApp::ellipse_semi_neg_UP(){
    
    

    
    ofPolyline poly;
    poly.addVertex(pt1);
    poly.bezierTo(0, v1*0.75, v1 , v1*0.75, v1, 0);
    poly.addVertex(pt3);
    poly.addVertex(pt4);
    
    
    ofPath path;
    path.setFillColor(fillcolour);
    
    for( int i = 0; i < poly.getVertices().size(); i++) {
        if(i == 0) {
            path.newSubPath();
            path.moveTo(poly.getVertices()[i] );
        } else {
            path.lineTo( poly.getVertices()[i] );
        }
    }
    
    path.close();
    path.draw();
    
    
    
}

void ofApp::ellipse_semi_neg_DOWN(){

    ofPolyline poly;
    poly.addVertex(pt4);
    poly.bezierTo(0, v1*0.25, v1 , v1*0.25, v1, v1);
    poly.addVertex(pt2);
    poly.addVertex(pt1);
    
    
    ofPath path;
    path.setFillColor(fillcolour);
    
    for( int i = 0; i < poly.getVertices().size(); i++) {
        if(i == 0) {
            path.newSubPath();
            path.moveTo(poly.getVertices()[i] );
        } else {
            path.lineTo( poly.getVertices()[i] );
        }
    }
    
    path.close();
    path.draw();
    
}
void ofApp::ellipse_semi_neg_LEFT(){
    

    ofPolyline poly;
    poly.addVertex(pt2);
    poly.bezierTo(v1*0.25, 0, v1*0.25, v1, v1, v1);
    poly.addVertex(pt4);
    poly.addVertex(pt1);
    
    
    ofPath path;
    path.setFillColor(fillcolour);
    
    for( int i = 0; i < poly.getVertices().size(); i++) {
        if(i == 0) {
            path.newSubPath();
            path.moveTo(poly.getVertices()[i] );
        } else {
            path.lineTo( poly.getVertices()[i] );
        }
    }
    
    path.close();
    path.draw();
    
    
}
void ofApp::ellipse_semi_neg_RIGHT(){
    
    
    
    ofPolyline poly;
    poly.addVertex(pt1);
    poly.bezierTo(v1*0.75, 0, v1*0.75, v1, 0, v1);
    poly.addVertex(pt4);
    poly.addVertex(pt3);
    poly.addVertex(pt2);
    
    
    ofPath path;
    path.setFillColor(fillcolour);
    
    for( int i = 0; i < poly.getVertices().size(); i++) {
        if(i == 0) {
            path.newSubPath();
            path.moveTo(poly.getVertices()[i] );
        } else {
            path.lineTo( poly.getVertices()[i] );
        }
    }
    path.close();
    path.draw();
    
    
}



//----TRIANGLE SPLIT---------------------------------------------------------

void ofApp::triangle_split_UP(){
    

    
    ofPolyline poly;
    poly.addVertex(pt1);
    poly.addVertex(pt4);
    poly.addVertex(pt1_50);
    poly.addVertex(pt3);
    poly.addVertex(pt2);
    
    ofPath path;
    path.setFillColor(fillcolour);
    
    for( int i = 0; i < poly.getVertices().size(); i++) {
        if(i == 0) {
            path.newSubPath();
            path.moveTo(poly.getVertices()[i] );
        } else {
            path.lineTo( poly.getVertices()[i] );
        }
    }
    
    path.close();
    path.draw();
    
    
}
//--------------------------------------------------------------

void ofApp::triangle_split_DOWN(){
    

    ofPolyline poly;
    poly.addVertex(pt1);
    poly.addVertex(pt4);
    poly.addVertex(pt3);
    poly.addVertex(pt2);
    poly.addVertex(pt3_50);
    
    ofPath path;
    path.setFillColor(fillcolour);
    
    for( int i = 0; i < poly.getVertices().size(); i++) {
        if(i == 0) {
            path.newSubPath();
            path.moveTo(poly.getVertices()[i] );
        } else {
            path.lineTo( poly.getVertices()[i] );
        }
    }
    
    path.close();
    path.draw();
    
}

//--------------------------------------------------------------

void ofApp::triangle_split_LEFT(){
    
    ofPolyline poly;
    poly.addVertex(pt1);
    poly.addVertex(pt2);
    poly.addVertex(pt4_50);
    poly.addVertex(pt3);
    poly.addVertex(pt4);
    
    ofPath path;
    path.setFillColor(fillcolour);
    
    for( int i = 0; i < poly.getVertices().size(); i++) {
        if(i == 0) {
            path.newSubPath();
            path.moveTo(poly.getVertices()[i] );
        } else {
            path.lineTo( poly.getVertices()[i] );
        }
    }
    
    path.close();
    path.draw();
    
}

//--------------------------------------------------------------

void ofApp::triangle_split_RIGHT(){
    
    ofPolyline poly;
    poly.addVertex(pt1);
    poly.addVertex(pt2);
    poly.addVertex(pt3);
    poly.addVertex(pt4);
    poly.addVertex(pt2_50);
    
    ofPath path;
    path.setFillColor(fillcolour);
    
    for( int i = 0; i < poly.getVertices().size(); i++) {
        if(i == 0) {
            path.newSubPath();
            path.moveTo(poly.getVertices()[i] );
        } else {
            path.lineTo( poly.getVertices()[i] );
        }
    }
    
    path.close();
    path.draw();
    
}



//--ELLIPSE-SEMI------------------------------------------------------------

void ofApp::ellipse_semi_RIGHT(){
    

    
    ofPolyline poly;
    poly.addVertex(pt1);
    poly.bezierTo(v1*0.75, 0, v1*0.75, v1, 0, v1);
    //poly.addVertex(pt4_75);
    
    ofPath path;
    path.setFillColor(fillcolour);
    
    for( int i = 0; i < poly.getVertices().size(); i++) {
        if(i == 0) {
            path.newSubPath();
            path.moveTo(poly.getVertices()[i] );
        } else {
            path.lineTo( poly.getVertices()[i] );
        }
    }
    
    path.close();
    path.draw();
    
}
//--------------------------------------------------------------

void ofApp::ellipse_semi_LEFT(){
    

    ofPolyline poly;
    poly.addVertex(pt2);
    poly.bezierTo(v1*0.25, 0, v1*0.25, v1, v1, v1);
    //poly.addVertex(pt4_75);
    
    ofPath path;
    path.setFillColor(fillcolour);
    
    for( int i = 0; i < poly.getVertices().size(); i++) {
        if(i == 0) {
            path.newSubPath();
            path.moveTo(poly.getVertices()[i] );
        } else {
            path.lineTo( poly.getVertices()[i] );
        }
    }
    
    path.close();
    path.draw();
    
}
//--------------------------------------------------------------

void ofApp::ellipse_semi_UP(){
    

    
    ofPolyline poly;
    poly.addVertex(pt4);
    poly.bezierTo(0, v1*0.25, v1 , v1*0.25, v1, v1);
    //poly.addVertex(pt4_75);
    
    ofPath path;
    path.setFillColor(fillcolour);
    
    for( int i = 0; i < poly.getVertices().size(); i++) {
        if(i == 0) {
            path.newSubPath();
            path.moveTo(poly.getVertices()[i] );
        } else {
            path.lineTo( poly.getVertices()[i] );
        }
    }
    
    path.close();
    path.draw();
    
}
//--------------------------------------------------------------

void ofApp::ellipse_semi_DOWN(){

    
    ofPolyline poly;
    poly.addVertex(pt1);
    poly.bezierTo(0, v1*0.75, v1 , v1*0.75, v1, 0);
    //poly.addVertex(pt4_75);
    
    ofPath path;
    path.setFillColor(fillcolour);
    
    for( int i = 0; i < poly.getVertices().size(); i++) {
        if(i == 0) {
            path.newSubPath();
            path.moveTo(poly.getVertices()[i] );
        } else {
            path.lineTo( poly.getVertices()[i] );
        }
    }
    
    path.close();
    path.draw();
    
    
}

//--------TRIANGLE  IN ------------------------------------------------------

void ofApp::triangle_IN_V(){
    
    ofPolyline poly;
    poly.addVertex(pt1);
    poly.addVertex(pt2);
    poly.addVertex(pt4);
    poly.addVertex(pt3);
    
    ofPath path;
    path.setFillColor(fillcolour);
    
    for( int i = 0; i < poly.getVertices().size(); i++) {
        if(i == 0) {
            path.newSubPath();
            path.moveTo(poly.getVertices()[i] );
        } else {
            path.lineTo( poly.getVertices()[i] );
        }
    }
    
    path.close();
    path.draw();
    
    
}
//--------------------------------------------------------------

void ofApp::triangle_IN_H(){
    
    ofPolyline poly;
    poly.addVertex(pt1);
    poly.addVertex(pt3);
    poly.addVertex(pt2);
    poly.addVertex(pt4);
    
    ofPath path;
    path.setFillColor(fillcolour);
    
    for( int i = 0; i < poly.getVertices().size(); i++) {
        if(i == 0) {
            path.newSubPath();
            path.moveTo(poly.getVertices()[i] );
        } else {
            path.lineTo( poly.getVertices()[i] );
        }
    }
    
    path.close();
    path.draw();
    
}
//--------------------------------------------------------------

void ofApp::triangle_neg_IN_DOWN(){

    
    ofPolyline poly;
    poly.addVertex(pt4);
    poly.addVertex(pt3);
    poly.addVertex(pt2);
    poly.addVertex(pt1_75);
    poly.addVertex(v1*0.5,v1*0.5);
    poly.addVertex(pt1_25);
    poly.addVertex(pt1);
    
    
    
    ofPath path;
    path.setFillColor(fillcolour);
    
    for( int i = 0; i < poly.getVertices().size(); i++) {
        if(i == 0) {
            path.newSubPath();
            path.moveTo(poly.getVertices()[i] );
        } else {
            path.lineTo( poly.getVertices()[i] );
        }
    }
    
    path.close();
    path.draw();
    
}

//--------------------------------------------------------------

void ofApp::triangle_neg_IN_UP(){
    

    
    ofPolyline poly;
    poly.addVertex(pt1);
    poly.addVertex(pt2);
    poly.addVertex(pt3);
    poly.addVertex(pt3_25);
    poly.addVertex(v1*0.5,v1*0.5);
    poly.addVertex(pt3_75);
    poly.addVertex(pt4);
    
    
    
    ofPath path;
    path.setFillColor(fillcolour);
    
    for( int i = 0; i < poly.getVertices().size(); i++) {
        if(i == 0) {
            path.newSubPath();
            path.moveTo(poly.getVertices()[i] );
        } else {
            path.lineTo( poly.getVertices()[i] );
        }
    }
    
    path.close();
    path.draw();
    
}
//--------------------------------------------------------------

void ofApp::triangle_neg_IN_RIGHT(){
    

    ofPolyline poly;
    poly.addVertex(pt1);
    poly.addVertex(pt2);
    poly.addVertex(pt3);
    poly.addVertex(pt4);
    poly.addVertex(pt4_25);
    poly.addVertex(v1*0.5,v1*0.5);
    poly.addVertex(pt4_75);
    //poly.addVertex(pt4);
    
    
    
    ofPath path;
    path.setFillColor(fillcolour);
    
    for( int i = 0; i < poly.getVertices().size(); i++) {
        if(i == 0) {
            path.newSubPath();
            path.moveTo(poly.getVertices()[i] );
        } else {
            path.lineTo( poly.getVertices()[i] );
        }
    }
    
    path.close();
    path.draw();
    
}
//--------------------------------------------------------------

void ofApp::triangle_neg_IN_LEFT(){
    

    ofPolyline poly;
    poly.addVertex(pt1);
    poly.addVertex(pt2);
    poly.addVertex(pt2_25);
    poly.addVertex(v1*0.5,v1*0.5);
    poly.addVertex(pt2_75);
    poly.addVertex(pt3);
    poly.addVertex(pt4);
    
    ofPath path;
    path.setFillColor(fillcolour);
    
    for( int i = 0; i < poly.getVertices().size(); i++) {
        if(i == 0) {
            path.newSubPath();
            path.moveTo(poly.getVertices()[i] );
        } else {
            path.lineTo( poly.getVertices()[i] );
        }
    }
    
    path.close();
    path.draw();
    
}
//--------------------------------------------------------------
void ofApp::ellipse_neg(){
    
    ofPolyline poly;
    
    //two bezier
    
    poly.addVertex(pt2_50);
    poly.addVertex(pt2);
    poly.addVertex(pt1);
    poly.addVertex(pt4);
    poly.addVertex(pt3);
    poly.addVertex(pt2_50);
    poly.bezierTo(v1, v1+v1*0.16, 0 , v1+v1*0.16, 0, v1*0.5);
    poly.bezierTo(0, 0-v1*0.16, v1 , 0-v1*0.16, v1, v1*0.5);
    
    
    
    ofPath path;
    path.setFillColor(fillcolour);
    
    for( int i = 0; i < poly.getVertices().size(); i++) {
        if(i == 0) {
            path.newSubPath();
            path.moveTo(poly.getVertices()[i] );
        } else {
            path.lineTo( poly.getVertices()[i] );
        }
    }
    
    path.close();
    path.draw();
    
}

void ofApp::diamond(){
    
    ofPolyline poly;
    
    poly.addVertex(pt2_50);
    poly.addVertex(pt2);
    poly.addVertex(pt1);
    poly.addVertex(pt4);
    poly.addVertex(pt3);
    poly.addVertex(pt2_50);
    poly.addVertex(pt3_50);
    poly.addVertex(pt4_50);
    poly.addVertex(pt1_50);
    poly.addVertex(pt2_50);
    
    ofPath path;
    path.setFillColor(fillcolour);
    
    for( int i = 0; i < poly.getVertices().size(); i++) {
        if(i == 0) {
            path.newSubPath();
            path.moveTo(poly.getVertices()[i] );
        } else {
            path.lineTo( poly.getVertices()[i] );
        }
    }
    path.close();
    path.draw();
    
    
    
    
    
}

void ofApp::triangle_bottom_UP(){
    
    ofPolyline poly;
    
    poly.addVertex(pt1_25);
    poly.addVertex(pt4_50);
    poly.addVertex(pt2_50);
    poly.addVertex(pt1_75);
    poly.addVertex(pt2);
    poly.addVertex(pt3);
    poly.addVertex(pt4);
    poly.addVertex(pt1);
    
    ofPath path;
    path.setFillColor(fillcolour);
    
    for( int i = 0; i < poly.getVertices().size(); i++) {
        if(i == 0) {
            path.newSubPath();
            path.moveTo(poly.getVertices()[i] );
        } else {
            path.lineTo( poly.getVertices()[i] );
        }
    }
    path.close();
    path.draw();
    
    
    
    
    
    
}
void ofApp::triangle_bottom_DOWN(){
    
    ofPolyline poly;
    
    
    poly.addVertex(pt3_75);
    poly.addVertex(pt4_50);
    poly.addVertex(pt2_50);
    poly.addVertex(pt3_25);
    poly.addVertex(pt3);
    poly.addVertex(pt2);
    poly.addVertex(pt1);
    poly.addVertex(pt4);
    
    
    ofPath path;
    path.setFillColor(fillcolour);
    
    for( int i = 0; i < poly.getVertices().size(); i++) {
        if(i == 0) {
            path.newSubPath();
            path.moveTo(poly.getVertices()[i] );
        } else {
            path.lineTo( poly.getVertices()[i] );
        }
    }
    path.close();
    path.draw();
    
    
    
    
    
}void ofApp::triangle_bottom_RIGHT(){
    
    ofPolyline poly;
    
    
    poly.addVertex(pt2_25);
    poly.addVertex(pt1_50);
    poly.addVertex(pt3_50);
    poly.addVertex(pt2_75);
    poly.addVertex(pt3);
    poly.addVertex(pt4);
    poly.addVertex(pt1);
    poly.addVertex(pt2);
    
    ofPath path;
    path.setFillColor(fillcolour);
    
    for( int i = 0; i < poly.getVertices().size(); i++) {
        if(i == 0) {
            path.newSubPath();
            path.moveTo(poly.getVertices()[i] );
        } else {
            path.lineTo( poly.getVertices()[i] );
        }
    }
    path.close();
    path.draw();
    
    
    
    
}void ofApp::triangle_bottom_LEFT(){
    
    ofPolyline poly;
    
    poly.addVertex(pt4_75);
    poly.addVertex(pt1_50);
    poly.addVertex(pt3_50);
    poly.addVertex(pt4_25);
    poly.addVertex(pt4);
    poly.addVertex(pt3);
    poly.addVertex(pt2);
    poly.addVertex(pt1);
    
    ofPath path;
    path.setFillColor(fillcolour);
    
    for( int i = 0; i < poly.getVertices().size(); i++) {
        if(i == 0) {
            path.newSubPath();
            path.moveTo(poly.getVertices()[i] );
        } else {
            path.lineTo( poly.getVertices()[i] );
        }
    }
    path.close();
    path.draw();
    
    
    
    
    
}







//--------------------------------------------------------------


void ofApp::rect_angled_TOP(){
    
    ofPolyline poly;
    
    
    poly.addVertex(pt4_50);
    poly.addVertex(pt4);
    poly.addVertex(pt3);
    poly.addVertex(pt2);
    
    
    ofPath path;
    path.setFillColor(fillcolour);
    
    for( int i = 0; i < poly.getVertices().size(); i++) {
        if(i == 0) {
            path.newSubPath();
            path.moveTo(poly.getVertices()[i] );
        } else {
            path.lineTo( poly.getVertices()[i] );
        }
    }
    path.close();
    path.draw();
    
    
}

void ofApp::rect_angled_BOTTOM(){
    
    ofPolyline poly;
    
    poly.addVertex(pt2_50);
    poly.addVertex(pt2);
    poly.addVertex(pt1);
    poly.addVertex(pt4);
    
    
    ofPath path;
    path.setFillColor(fillcolour);
    
    for( int i = 0; i < poly.getVertices().size(); i++) {
        if(i == 0) {
            path.newSubPath();
            path.moveTo(poly.getVertices()[i] );
        } else {
            path.lineTo( poly.getVertices()[i] );
        }
    }
    path.close();
    path.draw();
    
    
}
void ofApp::rect_angled_LEFT(){
    
    ofPolyline poly;
    
    poly.addVertex(pt1);
    poly.addVertex(pt3_50);
    poly.addVertex(pt3);
    poly.addVertex(pt2);
    
    ofPath path;
    path.setFillColor(fillcolour);
    
    for( int i = 0; i < poly.getVertices().size(); i++) {
        if(i == 0) {
            path.newSubPath();
            path.moveTo(poly.getVertices()[i] );
        } else {
            path.lineTo( poly.getVertices()[i] );
        }
    }
    path.close();
    path.draw();
    
    
}
void ofApp::rect_angled_RIGHT(){
    
    ofPolyline poly;
    
    poly.addVertex(pt1_50);
    poly.addVertex(pt3);
    poly.addVertex(pt4);
    poly.addVertex(pt1);
    
    ofPath path;
    path.setFillColor(fillcolour);
    
    for( int i = 0; i < poly.getVertices().size(); i++) {
        if(i == 0) {
            path.newSubPath();
            path.moveTo(poly.getVertices()[i] );
        } else {
            path.lineTo( poly.getVertices()[i] );
        }
    }
    path.close();
    path.draw();
    
    
}


//--------------------------------------------------------------
void ofApp::triangle_edge_BOTTOM(){
    
    ofPolyline poly;
    
    poly.addVertex(pt4_50);
    poly.addVertex(pt3_50);
    poly.addVertex(pt2_50);
    poly.addVertex(pt3);
    poly.addVertex(pt4);
    
    ofPath path;
    path.setFillColor(fillcolour);
    
    for( int i = 0; i < poly.getVertices().size(); i++) {
        if(i == 0) {
            path.newSubPath();
            path.moveTo(poly.getVertices()[i] );
        } else {
            path.lineTo( poly.getVertices()[i] );
        }
    }
    path.close();
    path.draw();
    
    
}

//--------------------------------------------------------------
void ofApp::triangle_edge_TOP(){
    
    ofPolyline poly;
    
    poly.addVertex(pt4_50);
    poly.addVertex(pt1_50);
    poly.addVertex(pt2_50);
    poly.addVertex(pt2);
    poly.addVertex(pt1);
    
    ofPath path;
    path.setFillColor(fillcolour);
    
    for( int i = 0; i < poly.getVertices().size(); i++) {
        if(i == 0) {
            path.newSubPath();
            path.moveTo(poly.getVertices()[i] );
        } else {
            path.lineTo( poly.getVertices()[i] );
        }
    }
    path.close();
    path.draw();
    
    
}
//--------------------------------------------------------------

void ofApp::triangle_edge_LEFT(){
    
    ofPolyline poly;
    
    poly.addVertex(pt4_50);
    poly.addVertex(pt1_50);
    poly.addVertex(pt1);
    poly.addVertex(pt4);
    poly.addVertex(pt3_50);
    
    ofPath path;
    path.setFillColor(fillcolour);
    
    for( int i = 0; i < poly.getVertices().size(); i++) {
        if(i == 0) {
            path.newSubPath();
            path.moveTo(poly.getVertices()[i] );
        } else {
            path.lineTo( poly.getVertices()[i] );
        }
    }
    path.close();
    path.draw();
    
    
}


//--------------------------------------------------------------

void ofApp::triangle_edge_RIGHT(){
    
    ofPolyline poly;
    
    poly.addVertex(pt1_50);
    poly.addVertex(pt2_50);
    poly.addVertex(pt3_50);
    poly.addVertex(pt3);
    poly.addVertex(pt2);
    
    ofPath path;
    path.setFillColor(fillcolour);
    
    for( int i = 0; i < poly.getVertices().size(); i++) {
        if(i == 0) {
            path.newSubPath();
            path.moveTo(poly.getVertices()[i] );
        } else {
            path.lineTo( poly.getVertices()[i] );
        }
    }
    path.close();
    path.draw();
    
    
}
//--------------------------------------------------------------

//--------------------------------------------------------------

void ofApp::triangle_neg_DOWN(){
    
    
    ofPolyline poly;
    poly.addVertex(pt4);
    poly.addVertex(pt3);
    poly.addVertex(pt2);
    poly.addVertex(v1*0.5,v1*0.5);
    poly.addVertex(pt1);
    
    
    
    ofPath path;
    path.setFillColor(fillcolour);
    
    for( int i = 0; i < poly.getVertices().size(); i++) {
        if(i == 0) {
            path.newSubPath();
            path.moveTo(poly.getVertices()[i] );
        } else {
            path.lineTo( poly.getVertices()[i] );
        }
    }
    
    path.close();
    path.draw();
    
}

//--------------------------------------------------------------

void ofApp::triangle_neg_UP(){
    
    
    
    ofPolyline poly;
    poly.addVertex(pt1);
    poly.addVertex(pt2);
    poly.addVertex(pt3);
    poly.addVertex(v1*0.5,v1*0.5);
    poly.addVertex(pt4);
    
    
    
    ofPath path;
    path.setFillColor(fillcolour);
    
    for( int i = 0; i < poly.getVertices().size(); i++) {
        if(i == 0) {
            path.newSubPath();
            path.moveTo(poly.getVertices()[i] );
        } else {
            path.lineTo( poly.getVertices()[i] );
        }
    }
    
    path.close();
    path.draw();
    
}
//--------------------------------------------------------------

void ofApp::triangle_neg_RIGHT(){

    
    ofPolyline poly;
    poly.addVertex(pt1);
    poly.addVertex(pt2);
    poly.addVertex(pt3);
    poly.addVertex(pt4);
    poly.addVertex(v1*0.5,v1*0.5);
    //poly.addVertex(pt4);
    
    
    
    ofPath path;
    path.setFillColor(fillcolour);
    
    for( int i = 0; i < poly.getVertices().size(); i++) {
        if(i == 0) {
            path.newSubPath();
            path.moveTo(poly.getVertices()[i] );
        } else {
            path.lineTo( poly.getVertices()[i] );
        }
    }
    
    path.close();
    path.draw();
    
}
//--------------------------------------------------------------

void ofApp::triangle_neg_LEFT(){
    

    ofPolyline poly;
    poly.addVertex(pt1);
    poly.addVertex(pt2);
    poly.addVertex(v1*0.5,v1*0.5);
    poly.addVertex(pt3);
    poly.addVertex(pt4);
    
    ofPath path;
    path.setFillColor(fillcolour);
    
    for( int i = 0; i < poly.getVertices().size(); i++) {
        if(i == 0) {
            path.newSubPath();
            path.moveTo(poly.getVertices()[i] );
        } else {
            path.lineTo( poly.getVertices()[i] );
        }
    }
    
    path.close();
    path.draw();
    
}


//--------------------------------------------------------------
//--------------------------------------------------------------
//--------------------------------------------------------------
//--------------------------------------------------------------
//--------------------------------------------------------------
//--------------------------------------------------------------
//--------------------------------------------------------------
//--------------------------------------------------------------
//--------------------------------------------------------------
//--------------------------------------------------------------


void ofApp::points(){
    
    ofPushMatrix();
    
    
    for (int i = 0; i < gridX; i++){
        for (int j = 0; j < gridY; j++){
            ofPushMatrix();
            
            ///this is the padding + the spacinng between objects
            //translates shapes onto grid
            ofTranslate(globalX + i*v1, globalY + j*v1);
            
            
            ofSetColor(0,255,255);
            ofDrawEllipse(pt1, v2, v2);
            ofDrawEllipse(pt1_25, v2, v2);
            ofDrawEllipse(pt1_50, v2, v2);
            ofDrawEllipse(pt1_75, v2, v2);
            
            ofDrawEllipse(pt2, v2, v2);
            ofDrawEllipse(pt2_25, v2, v2);
            ofDrawEllipse(pt2_50, v2, v2);
            ofDrawEllipse(pt2_75, v2, v2);
            
            ofDrawEllipse(pt3, v2, v2);
            ofDrawEllipse(pt3_25, v2, v2);
            ofDrawEllipse(pt3_50, v2, v2);
            ofDrawEllipse(pt3_75, v2, v2);
            
            ofDrawEllipse(pt4, v2, v2);
            ofDrawEllipse(pt4_25, v2, v2);
            ofDrawEllipse(pt4_50, v2, v2);
            ofDrawEllipse(pt4_75, v2, v2);
            
            ofPopMatrix();
        }
    }
    
    ofPopMatrix();
    
    
}







//--------------------------------------------------------------
void ofApp::keyPressed(int key){
    
    
    if( key == 's' ){
        guiToggle = false;
        // ofBeginSaveScreenAsSVG("RGLR_PATTERN_"+ofGetTimestampString()+".svg", false);
        ofBeginSaveScreenAsSVG("RGLR_patterns/RGLR_PATTERN_" + ofGetTimestampString() + ".svg", false);
        ofSetFrameRate(1);  // so it doesn't generate tons of pages
    }
    if( key == 'p' ){
        guiToggle = false;
        // ofBeginSaveScreenAsPDF("RGLR_PATTERN_"+ofGetTimestampString()+".pdf", false);
        ofBeginSaveScreenAsPDF("RGLR_patterns/RGLR_PATTERN_" + ofGetTimestampString() + ".pdf", false);
        ofSetFrameRate(1);  // so it doesn't generate tons of pages
    }
    if( key == 'g' ){
        guiToggle = !guiToggle;
    }
    if( key == ' ' ){
        bgToggle = !bgToggle;
    }
    
    if( key == 'h' ){
        hideCursor = !hideCursor;
    }
    
}

//--------------------------------------------------------------
void ofApp::keyReleased(int key){
    
    if( key == 'p' ){
        ofEndSaveScreenAsPDF();
        ofSetFrameRate(60);
        guiToggle = true;
    }
    if( key == 's' ){
        ofEndSaveScreenAsSVG();
        ofSetFrameRate(60);
        guiToggle = true;
    }
}

void ofApp::exit(){
    
    system("mv RGLR_patterns ~/Desktop/RGLR_patterns ");
    
        fbo.clear();
        fboStatic.clear();
    
}
