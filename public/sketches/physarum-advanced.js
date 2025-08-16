/**
 * Physarum Advanced - P5 Sketch
 * Enhanced emergent system with 36 Points techniques
 * Features: dynamic parameter variation, complex emergent behaviors, and advanced trail interactions
 * Based on Sage Jenson's 36 Points implementation
 */

let agents = [];
let trailMap = [];
let diffusionMap = [];
let delayedTrailMap = [];
let canvasWidth, canvasHeight;
let animationTime = 0;

// Advanced Physarum parameters with 36 Points techniques
let params = {
  // Base parameters (like classic algorithm)
  baseSensorDistance: 15,
  baseSensorAngle: 0.5,
  baseRotationAngle: 0.3,
  baseMoveDistance: 2,
  
  // Dynamic parameter variation coefficients
  sensorDistanceCoeff: [1.0, 0.5, 0.8],    // [p1, p2, p3]
  sensorAngleCoeff: [0.5, 0.3, 0.6],       // [p4, p5, p6]
  rotationAngleCoeff: [0.3, 0.2, 0.4],     // [p7, p8, p9]
  moveDistanceCoeff: [2.0, 1.0, 0.7],      // [p10, p11, p12]
  
  // Position offsets for trail sensing
  absoluteOffset: 0,                         // p13
  relativeOffset: 0,                         // p14
  
  // Trail parameters
  trailDeposit: 0.1,
  trailDecay: 0.95,
  trailDiffusion: 0.5,
  trailDelay: 0.8,
  
  // Agent parameters
  agentCount: 3000, // Reduced for better performance
  agentSize: 1,
  respawnProbability: 0.01,
  
  // Color and visual parameters
  colorHue: 200,
  colorSaturation: 80,
  colorBrightness: 100,
  trailOpacity: 0.8,
  
  // Emergent behavior parameters
  velocityEffect: 0.0,
  headingVariation: 0.0,
  centerAttraction: 0.0
};

// Multiple behavior presets (like 36 Points)
let presets = {
  classic: {
    name: "Classic Physarum",
    sensorDistanceCoeff: [15, 0, 1],
    sensorAngleCoeff: [0.5, 0, 1],
    rotationAngleCoeff: [0.3, 0, 1],
    moveDistanceCoeff: [2, 0, 1]
  },
  branching: {
    name: "Branching Networks",
    sensorDistanceCoeff: [20, -5, 0.8],
    sensorAngleCoeff: [0.8, -0.3, 0.6],
    rotationAngleCoeff: [0.5, -0.2, 0.4],
    moveDistanceCoeff: [3, -1, 0.7]
  },
  swirling: {
    name: "Swirling Patterns",
    sensorDistanceCoeff: [12, 8, 0.5],
    sensorAngleCoeff: [0.3, 0.7, 0.8],
    rotationAngleCoeff: [0.2, 0.6, 0.9],
    moveDistanceCoeff: [1.5, 2.5, 0.6]
  },
  chaotic: {
    name: "Chaotic Movement",
    sensorDistanceCoeff: [10, 10, 0.3],
    sensorAngleCoeff: [0.2, 1.3, 0.4],
    rotationAngleCoeff: [0.1, 0.9, 0.5],
    moveDistanceCoeff: [1, 4, 0.3]
  }
};

let currentPreset = 'classic';

function setup() {
  createCanvas(windowWidth, windowHeight);
  canvasWidth = width;
  canvasHeight = height;
  
  // Initialize trail maps
  initializeTrailMaps();
  
  // Initialize agents
  initializeAgents();
  
  // Apply initial preset
  applyPreset(currentPreset);
  
  console.log('Physarum Advanced setup complete');
}

function draw() {
  // Expose parameters for MIDI control
  const speed = p5Param('speed', 1.0, { min: 0.1, max: 3.0, label: 'Simulation Speed' });
  const presetSelect = p5Param('preset', 0, { min: 0, max: 3, step: 1, label: 'Behavior Preset' });
  const agentCount = p5Param('agentCount', 3000, { min: 1000, max: 8000, step: 500, label: 'Agent Count' });
  const trailDep = p5Param('trailDep', 0.1, { min: 0.01, max: 0.3, label: 'Trail Deposit' });
  const trailDec = p5Param('trailDec', 0.95, { min: 0.8, max: 0.99, label: 'Trail Decay' });
  const trailDiff = p5Param('trailDiff', 0.5, { min: 0.1, max: 0.9, label: 'Trail Diffusion' });
  const colorHue = p5Param('colorHue', 200, { min: 0, max: 360, label: 'Color Hue' });
  const colorSat = p5Param('colorSat', 80, { min: 0, max: 100, label: 'Color Saturation' });
  const colorBright = p5Param('colorBright', 100, { min: 0, max: 100, label: 'Color Brightness' });
  const velocityEffect = p5Param('velocityEffect', 0.0, { min: -0.5, max: 0.5, label: 'Velocity Effect' });
  const headingVar = p5Param('headingVar', 0.0, { min: 0.0, max: 1.0, label: 'Heading Variation' });
  const centerAttract = p5Param('centerAttract', 0.0, { min: 0.0, max: 0.1, label: 'Center Attraction' });
  const resetSim = p5Param('resetSim', 0, { min: 0, max: 1, step: 1, label: 'Reset Simulation' });
  const addAgents = p5Param('addAgents', 0, { min: 0, max: 1, step: 1, label: 'Add Agents' });
  const performanceMode = p5Param('perfMode', 0, { min: 0, max: 2, step: 1, label: 'Performance Mode' });
  
  // Update parameters
  params.trailDeposit = trailDep;
  params.trailDecay = trailDec;
  params.trailDiffusion = trailDiff;
  params.colorHue = colorHue;
  params.colorSaturation = colorSat;
  params.colorBrightness = colorBright;
  params.velocityEffect = velocityEffect;
  params.headingVariation = headingVar;
  params.centerAttraction = centerAttract;
  
  // Handle preset selection
  if (presetSelect > 0.5) {
    cyclePreset();
  }
  
  // Handle reset
  if (resetSim > 0.5) {
    resetSimulation();
  }
  
  // Handle adding agents
  if (addAgents > 0.5) {
    addRandomAgents(200);
  }
  
  // Update animation time
  animationTime += 0.016 * speed;
  
  // Semi-transparent background for trails
  background(0, 15);
  
  // Update and draw trail map (with performance mode)
  if (performanceMode < 2) { // Skip updates in ultra-performance mode
    updateTrailMap();
    drawAdvancedTrailMap();
  }
  
  // Update and draw agents (with performance mode)
  if (performanceMode === 0) { // Full quality
    updateAdvancedAgents();
    drawAgents();
  } else if (performanceMode === 1) { // Medium quality
    if (frameCount % 2 === 0) { // Update every other frame
      updateAdvancedAgents();
      drawAgents();
    }
  } else { // Ultra performance
    if (frameCount % 4 === 0) { // Update every 4th frame
      updateAdvancedAgents();
      drawAgents();
    }
  }
  
  // Draw info text
  drawAdvancedInfoText();
}

function initializeTrailMaps() {
  trailMap = [];
  diffusionMap = [];
  delayedTrailMap = [];
  
  for (let y = 0; y < canvasHeight; y++) {
    trailMap[y] = [];
    diffusionMap[y] = [];
    delayedTrailMap[y] = [];
    for (let x = 0; x < canvasWidth; x++) {
      trailMap[y][x] = 0;
      diffusionMap[y][x] = 0;
      delayedTrailMap[y][x] = 0;
    }
  }
}

function initializeAgents() {
  agents = [];
  
  for (let i = 0; i < params.agentCount; i++) {
    agents.push({
      x: random(canvasWidth),
      y: random(canvasHeight),
      heading: random(TWO_PI),
      velocity: createVector(0, 0),
      life: random(100, 300),
      energy: random(0.5, 1.0)
    });
  }
}

function updateTrailMap() {
  // Update delayed trail map
  for (let y = 0; y < canvasHeight; y++) {
    for (let x = 0; x < canvasWidth; x++) {
      delayedTrailMap[y][x] = delayedTrailMap[y][x] * params.trailDelay + 
                               trailMap[y][x] * (1 - params.trailDelay);
    }
  }
  
  // Apply diffusion and decay
  for (let y = 0; y < canvasHeight; y++) {
    for (let x = 0; x < canvasWidth; x++) {
      let sum = 0;
      let count = 0;
      
      // 3x3 diffusion kernel
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          let nx = (x + dx + canvasWidth) % canvasWidth;
          let ny = (y + dy + canvasHeight) % canvasHeight;
          sum += trailMap[ny][nx];
          count++;
        }
      }
      
      diffusionMap[y][x] = (sum / count) * params.trailDiffusion;
    }
  }
  
  // Apply decay and update trail map
  for (let y = 0; y < canvasHeight; y++) {
    for (let x = 0; x < canvasWidth; x++) {
      trailMap[y][x] = diffusionMap[y][x] * params.trailDecay;
    }
  }
}

function drawAdvancedTrailMap() {
  loadPixels();
  
  for (let y = 0; y < canvasHeight; y++) {
    for (let x = 0; x < canvasWidth; x++) {
      let index = (y * canvasWidth + x) * 4;
      let trailValue = trailMap[y][x];
      let delayedValue = delayedTrailMap[y][x];
      
      if (trailValue > 0.01) {
        let intensity = map(trailValue, 0, 1, 0, 255);
        let changeIntensity = abs(trailValue - delayedValue);
        
        // Dynamic color based on trail change
        let hue = params.colorHue + changeIntensity * 50;
        let sat = params.colorSaturation + changeIntensity * 20;
        let bright = params.colorBrightness;
        
        // Convert HSB to RGB
        let rgb = hsbToRgb(hue % 360, sat, bright);
        
        pixels[index] = rgb.r * (intensity / 255);
        pixels[index + 1] = rgb.g * (intensity / 255);
        pixels[index + 2] = rgb.b * (intensity / 255);
        pixels[index + 3] = intensity * params.trailOpacity;
      }
    }
  }
  
  updatePixels();
}

function updateAdvancedAgents() {
  for (let agent of agents) {
    // Get trail value at current position with offsets
    let currentTrailValue = getTrailValueWithOffsets(agent.x, agent.y, agent.heading);
    
    // Dynamic parameters based on trail value (36 Points technique)
    let sensorDistance = getDynamicParameter(params.sensorDistanceCoeff, currentTrailValue);
    let sensorAngle = getDynamicParameter(params.sensorAngleCoeff, currentTrailValue);
    let rotationAngle = getDynamicParameter(params.rotationAngleCoeff, currentTrailValue);
    let moveDistance = getDynamicParameter(params.moveDistanceCoeff, currentTrailValue);
    
    // Sensing phase - look at three positions
    let ahead = getTrailValue(
      agent.x + cos(agent.heading) * sensorDistance,
      agent.y + sin(agent.heading) * sensorDistance
    );
    
    let left = getTrailValue(
      agent.x + cos(agent.heading - sensorAngle) * sensorDistance,
      agent.y + sin(agent.heading - sensorAngle) * sensorDistance
    );
    
    let right = getTrailValue(
      agent.x + cos(agent.heading + sensorAngle) * sensorDistance,
      agent.y + sin(agent.heading + sensorAngle) * sensorDistance
    );
    
    // Decision making with enhanced logic
    if (left > ahead && left > right) {
      agent.heading -= rotationAngle;
    } else if (right > ahead && right > left) {
      agent.heading += rotationAngle;
    } else if (ahead < left && ahead < right) {
      // Random choice when straight ahead is lowest
      agent.heading += random([-1, 1]) * rotationAngle;
    }
    
    // Apply heading variation based on trail value
    if (params.headingVariation > 0) {
      agent.heading += random(-params.headingVariation, params.headingVariation) * currentTrailValue;
    }
    
    // Center attraction effect
    if (params.centerAttraction > 0) {
      let centerX = canvasWidth / 2;
      let centerY = canvasHeight / 2;
      let toCenter = atan2(centerY - agent.y, centerX - agent.x);
      let angleDiff = toCenter - agent.heading;
      agent.heading += angleDiff * params.centerAttraction * 0.01;
    }
    
    // Velocity effect (inertia)
    if (params.velocityEffect !== 0) {
      agent.velocity.x += cos(agent.heading) * moveDistance;
      agent.velocity.y += sin(agent.heading) * moveDistance;
      agent.velocity.mult(1 + params.velocityEffect);
      
      agent.x += agent.velocity.x;
      agent.y += agent.velocity.y;
    } else {
      // Standard movement
      agent.x += cos(agent.heading) * moveDistance;
      agent.y += sin(agent.heading) * moveDistance;
    }
    
    // Wrap around edges
    agent.x = (agent.x + canvasWidth) % canvasWidth;
    agent.y = (agent.y + canvasHeight) % canvasHeight;
    
    // Trail deposition
    let x = floor(agent.x);
    let y = floor(agent.y);
    if (x >= 0 && x < canvasWidth && y >= 0 && y < canvasHeight) {
      trailMap[y][x] += params.trailDeposit * agent.energy;
      trailMap[y][x] = min(trailMap[y][x], 1.0);
    }
    
    // Life cycle and respawn
    agent.life--;
    agent.energy *= 0.999; // Gradual energy loss
    
    if (agent.life <= 0 || agent.energy < 0.1 || random() < params.respawnProbability) {
      // Respawn at random position
      agent.x = random(canvasWidth);
      agent.y = random(canvasHeight);
      agent.heading = random(TWO_PI);
      agent.life = random(100, 300);
      agent.energy = random(0.5, 1.0);
      agent.velocity = createVector(0, 0);
    }
  }
}

function getTrailValueWithOffsets(x, y, heading) {
  // Apply absolute and relative offsets
  let offsetX = x + params.absoluteOffset;
  let offsetY = y + params.relativeOffset * cos(heading);
  
  return getTrailValue(offsetX, offsetY);
}

function getDynamicParameter(coefficients, trailValue) {
  // Apply formula: param = p1 + p2 * x^p3
  let [p1, p2, p3] = coefficients;
  let clampedTrail = constrain(trailValue, 0, 1);
  return p1 + p2 * Math.pow(clampedTrail, p3);
}

function getTrailValue(x, y) {
  let ix = floor(x);
  let iy = floor(y);
  
  // Wrap around edges
  ix = (ix + canvasWidth) % canvasWidth;
  iy = (iy + canvasHeight) % canvasHeight;
  
  if (ix >= 0 && ix < canvasWidth && iy >= 0 && iy < canvasHeight) {
    return trailMap[iy][ix];
  }
  return 0;
}

function drawAgents() {
  for (let agent of agents) {
    // Color based on energy
    let alpha = map(agent.energy, 0, 1, 50, 200);
    stroke(255, alpha);
    strokeWeight(params.agentSize);
    point(agent.x, agent.y);
  }
}

function hsbToRgb(h, s, v) {
  let c = v * s / 100;
  let x = c * (1 - abs((h / 60) % 2 - 1));
  let m = v - c;
  
  let r, g, b;
  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }
  
  return {
    r: (r + m) * 255 / 100,
    g: (g + m) * 255 / 100,
    b: (b + m) * 255 / 100
  };
}

function applyPreset(presetName) {
  let preset = presets[presetName];
  if (preset) {
    params.sensorDistanceCoeff = preset.sensorDistanceCoeff;
    params.sensorAngleCoeff = preset.sensorAngleCoeff;
    params.rotationAngleCoeff = preset.rotationAngleCoeff;
    params.moveDistanceCoeff = preset.moveDistanceCoeff;
    currentPreset = presetName;
  }
}

function cyclePreset() {
  let presetNames = Object.keys(presets);
  let currentIndex = presetNames.indexOf(currentPreset);
  let nextIndex = (currentIndex + 1) % presetNames.length;
  applyPreset(presetNames[nextIndex]);
}

function resetSimulation() {
  initializeTrailMaps();
  initializeAgents();
  animationTime = 0;
}

function addRandomAgents(count) {
  for (let i = 0; i < count; i++) {
    agents.push({
      x: random(canvasWidth),
      y: random(canvasHeight),
      heading: random(TWO_PI),
      velocity: createVector(0, 0),
      life: random(100, 300),
      energy: random(0.5, 1.0)
    });
  }
}

function drawAdvancedInfoText() {
  fill(255);
  noStroke();
  textSize(12);
  textAlign(LEFT, TOP);
  
  let info = [
    `Preset: ${presets[currentPreset].name}`,
    `Agents: ${agents.length}`,
    `FPS: ${floor(frameRate())}`,
    `Time: ${floor(animationTime)}`,
    `Trail Decay: ${params.trailDecay.toFixed(2)}`,
    `Velocity Effect: ${params.velocityEffect.toFixed(3)}`,
    `Heading Variation: ${params.headingVariation.toFixed(3)}`
  ];
  
  for (let i = 0; i < info.length; i++) {
    text(info[i], 10, 10 + i * 20);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  canvasWidth = width;
  canvasHeight = height;
  initializeTrailMaps();
}
