/**
 * Physarum Emergent - P5 Sketch
 * An emergent system inspired by Physarum polycephalum behavior
 * Features: agent-based movement, trail deposition, diffusion, and organic pattern formation
 * Based on the algorithm described by Jeff Jones and enhanced with 36 Points techniques
 */

let agents = [];
let trailMap = [];
let diffusionMap = [];
let canvasWidth, canvasHeight;
let animationTime = 0;

// Physarum algorithm parameters
let params = {
  // Basic movement parameters
  sensorDistance: 15,
  sensorAngle: 0.5,
  rotationAngle: 0.3,
  moveDistance: 2,
  
  // Trail parameters
  trailDeposit: 0.1,
  trailDecay: 0.95,
  trailDiffusion: 0.5,
  
  // Agent parameters
  agentCount: 2000, // Reduced for better performance
  agentSize: 1,
  
  // Color and visual parameters
  colorHue: 200,
  colorSaturation: 80,
  colorBrightness: 100,
  trailOpacity: 0.8
};

function setup() {
  createCanvas(windowWidth, windowHeight);
  canvasWidth = width;
  canvasHeight = height;
  
  // Initialize trail maps
  initializeTrailMaps();
  
  // Initialize agents
  initializeAgents();
  
  console.log('Physarum Emergent setup complete');
}

function draw() {
  // Expose parameters for MIDI control
  const speed = p5Param('speed', 1.0, { min: 0.1, max: 3.0, label: 'Simulation Speed' });
  const agentCount = p5Param('agentCount', 2000, { min: 500, max: 5000, step: 100, label: 'Agent Count' });
  const sensorDist = p5Param('sensorDist', 15, { min: 5, max: 30, label: 'Sensor Distance' });
  const sensorAng = p5Param('sensorAng', 0.5, { min: 0.1, max: 1.5, label: 'Sensor Angle' });
  const rotationAng = p5Param('rotationAng', 0.3, { min: 0.1, max: 1.0, label: 'Rotation Angle' });
  const moveDist = p5Param('moveDist', 2, { min: 0.5, max: 5.0, label: 'Move Distance' });
  const trailDep = p5Param('trailDep', 0.1, { min: 0.01, max: 0.3, label: 'Trail Deposit' });
  const trailDec = p5Param('trailDec', 0.95, { min: 0.8, max: 0.99, label: 'Trail Decay' });
  const trailDiff = p5Param('trailDiff', 0.5, { min: 0.1, max: 0.9, label: 'Trail Diffusion' });
  const colorHue = p5Param('colorHue', 200, { min: 0, max: 360, label: 'Color Hue' });
  const colorSat = p5Param('colorSat', 80, { min: 0, max: 100, label: 'Color Saturation' });
  const colorBright = p5Param('colorBright', 100, { min: 0, max: 100, label: 'Color Brightness' });
  const resetSim = p5Param('resetSim', 0, { min: 0, max: 1, step: 1, label: 'Reset Simulation' });
  const addAgents = p5Param('addAgents', 0, { min: 0, max: 1, step: 1, label: 'Add Agents' });
  const performanceMode = p5Param('perfMode', 0, { min: 0, max: 2, step: 1, label: 'Performance Mode' });
  
  // Update parameters
  params.sensorDistance = sensorDist;
  params.sensorAngle = sensorAng;
  params.rotationAngle = rotationAng;
  params.moveDistance = moveDist;
  params.trailDeposit = trailDep;
  params.trailDecay = trailDec;
  params.trailDiffusion = trailDiff;
  params.colorHue = colorHue;
  params.colorSaturation = colorSat;
  params.colorBrightness = colorBright;
  
  // Handle reset
  if (resetSim > 0.5) {
    resetSimulation();
  }
  
  // Handle adding agents
  if (addAgents > 0.5) {
    addRandomAgents(100);
  }
  
  // Update animation time
  animationTime += 0.016 * speed;
  
  // Semi-transparent background for trails
  background(0, 20);
  
  // Update and draw trail map (with performance mode)
  if (performanceMode < 2) { // Skip updates in ultra-performance mode
    updateTrailMap();
    drawTrailMap();
  }
  
  // Update and draw agents (with performance mode)
  if (performanceMode === 0) { // Full quality
    updateAgents();
    drawAgents();
  } else if (performanceMode === 1) { // Medium quality
    if (frameCount % 2 === 0) { // Update every other frame
      updateAgents();
      drawAgents();
    }
  } else { // Ultra performance
    if (frameCount % 4 === 0) { // Update every 4th frame
      updateAgents();
      drawAgents();
    }
  }
  
  // Draw info text
  drawInfoText();
}

function initializeTrailMaps() {
  trailMap = [];
  diffusionMap = [];
  
  for (let y = 0; y < canvasHeight; y++) {
    trailMap[y] = [];
    diffusionMap[y] = [];
    for (let x = 0; x < canvasWidth; x++) {
      trailMap[y][x] = 0;
      diffusionMap[y][x] = 0;
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
      life: random(100, 200)
    });
  }
}

function updateTrailMap() {
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

function drawTrailMap() {
  loadPixels();
  
  for (let y = 0; y < canvasHeight; y++) {
    for (let x = 0; x < canvasWidth; x++) {
      let index = (y * canvasWidth + x) * 4;
      let trailValue = trailMap[y][x];
      
      if (trailValue > 0.01) {
        let intensity = map(trailValue, 0, 1, 0, 255);
        let hue = params.colorHue;
        let sat = params.colorSaturation;
        let bright = params.colorBrightness;
        
        // Convert HSB to RGB
        let rgb = hsbToRgb(hue, sat, bright);
        
        pixels[index] = rgb.r * (intensity / 255);
        pixels[index + 1] = rgb.g * (intensity / 255);
        pixels[index + 2] = rgb.b * (intensity / 255);
        pixels[index + 3] = intensity * params.trailOpacity;
      }
    }
  }
  
  updatePixels();
}

function updateAgents() {
  for (let agent of agents) {
    // Sensing phase - look at three positions
    let ahead = getTrailValue(
      agent.x + cos(agent.heading) * params.sensorDistance,
      agent.y + sin(agent.heading) * params.sensorDistance
    );
    
    let left = getTrailValue(
      agent.x + cos(agent.heading - params.sensorAngle) * params.sensorDistance,
      agent.y + sin(agent.heading - params.sensorAngle) * params.sensorDistance
    );
    
    let right = getTrailValue(
      agent.x + cos(agent.heading + params.sensorAngle) * params.sensorDistance,
      agent.y + sin(agent.heading + params.sensorAngle) * params.sensorDistance
    );
    
    // Decision making
    if (left > ahead && left > right) {
      agent.heading -= params.rotationAngle;
    } else if (right > ahead && right > left) {
      agent.heading += params.rotationAngle;
    } else if (ahead < left && ahead < right) {
      // Random choice when straight ahead is lowest
      agent.heading += random([-1, 1]) * params.rotationAngle;
    }
    
    // Movement
    agent.x += cos(agent.heading) * params.moveDistance;
    agent.y += sin(agent.heading) * params.moveDistance;
    
    // Wrap around edges
    agent.x = (agent.x + canvasWidth) % canvasWidth;
    agent.y = (agent.y + canvasHeight) % canvasHeight;
    
    // Trail deposition
    let x = floor(agent.x);
    let y = floor(agent.y);
    if (x >= 0 && x < canvasWidth && y >= 0 && y < canvasHeight) {
      trailMap[y][x] += params.trailDeposit;
      trailMap[y][x] = min(trailMap[y][x], 1.0);
    }
    
    // Life cycle
    agent.life--;
    if (agent.life <= 0) {
      // Respawn at random position
      agent.x = random(canvasWidth);
      agent.y = random(canvasHeight);
      agent.heading = random(TWO_PI);
      agent.life = random(100, 200);
    }
  }
}

function drawAgents() {
  stroke(255, 100);
  strokeWeight(params.agentSize);
  
  for (let agent of agents) {
    point(agent.x, agent.y);
  }
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
      life: random(100, 200)
    });
  }
}

function drawInfoText() {
  fill(255);
  noStroke();
  textSize(12);
  textAlign(LEFT, TOP);
  
  let info = [
    `Agents: ${agents.length}`,
    `FPS: ${floor(frameRate())}`,
    `Time: ${floor(animationTime)}`,
    `Trail Decay: ${params.trailDecay.toFixed(2)}`,
    `Trail Diffusion: ${params.trailDiffusion.toFixed(2)}`
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
