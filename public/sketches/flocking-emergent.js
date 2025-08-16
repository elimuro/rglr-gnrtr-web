/**
 * Flocking Emergent - P5 Sketch
 * A flocking simulation demonstrating emergent behavior through simple rules
 * Features: separation, alignment, cohesion, and obstacle avoidance
 * Based on Craig Reynolds' Boids algorithm
 */

let boids = [];
let obstacles = [];
let canvasWidth, canvasHeight;
let animationTime = 0;

// Flocking parameters
let params = {
  // Flocking behavior weights
  separationWeight: 1.5,
  alignmentWeight: 1.0,
  cohesionWeight: 1.0,
  obstacleAvoidanceWeight: 2.0,
  
  // Perception ranges
  separationRadius: 25,
  alignmentRadius: 50,
  cohesionRadius: 50,
  obstacleRadius: 30,
  
  // Movement parameters
  maxSpeed: 4,
  maxForce: 0.2,
  boidSize: 3,
  
  // Visual parameters
  colorHue: 120,
  colorSaturation: 80,
  colorBrightness: 100,
  trailOpacity: 0.9,
  
  // Obstacle parameters
  obstacleCount: 8,
  obstacleSize: 40
};

function setup() {
  createCanvas(windowWidth, windowHeight);
  canvasWidth = width;
  canvasHeight = height;
  
  // Initialize boids
  initializeBoids();
  
  // Initialize obstacles
  initializeObstacles();
  
  console.log('Flocking Emergent setup complete');
}

function draw() {
  // Expose parameters for MIDI control
  const speed = p5Param('speed', 1.0, { min: 0.1, max: 3.0, label: 'Simulation Speed' });
  const boidCount = p5Param('boidCount', 150, { min: 50, max: 300, step: 10, label: 'Boid Count' });
  const separationWeight = p5Param('separation', 1.5, { min: 0.0, max: 3.0, label: 'Separation Weight' });
  const alignmentWeight = p5Param('alignment', 1.0, { min: 0.0, max: 3.0, label: 'Alignment Weight' });
  const cohesionWeight = p5Param('cohesion', 1.0, { min: 0.0, max: 3.0, label: 'Cohesion Weight' });
  const obstacleWeight = p5Param('obstacle', 2.0, { min: 0.0, max: 5.0, label: 'Obstacle Avoidance' });
  const colorHue = p5Param('colorHue', 120, { min: 0, max: 360, label: 'Color Hue' });
  const colorSat = p5Param('colorSat', 80, { min: 0, max: 100, label: 'Color Saturation' });
  const colorBright = p5Param('colorBright', 100, { min: 0, max: 100, label: 'Color Brightness' });
  const resetSim = p5Param('resetSim', 0, { min: 0, max: 1, step: 1, label: 'Reset Simulation' });
  const addBoids = p5Param('addBoids', 0, { min: 0, max: 1, step: 1, label: 'Add Boids' });
  const performanceMode = p5Param('perfMode', 0, { min: 0, max: 2, step: 1, label: 'Performance Mode' });
  
  // Update parameters
  params.separationWeight = separationWeight;
  params.alignmentWeight = alignmentWeight;
  params.cohesionWeight = cohesionWeight;
  params.obstacleAvoidanceWeight = obstacleWeight;
  params.colorHue = colorHue;
  params.colorSaturation = colorSat;
  params.colorBrightness = colorBright;
  
  // Handle reset
  if (resetSim > 0.5) {
    resetSimulation();
  }
  
  // Handle adding boids
  if (addBoids > 0.5) {
    addRandomBoids(20);
  }
  
  // Update animation time
  animationTime += 0.016 * speed;
  
  // Semi-transparent background for trails
  background(0, 20);
  
  // Update and draw boids (with performance mode)
  if (performanceMode === 0) { // Full quality
    updateBoids();
    drawBoids();
  } else if (performanceMode === 1) { // Medium quality
    if (frameCount % 2 === 0) { // Update every other frame
      updateBoids();
      drawBoids();
    }
  } else { // Ultra performance
    if (frameCount % 4 === 0) { // Update every 4th frame
      updateBoids();
      drawBoids();
    }
  }
  
  // Draw obstacles
  drawObstacles();
  
  // Draw info text
  drawInfoText();
}

function initializeBoids() {
  boids = [];
  
  for (let i = 0; i < 100; i++) { // Reduced for better performance
    boids.push({
      position: createVector(random(canvasWidth), random(canvasHeight)),
      velocity: createVector(random(-2, 2), random(-2, 2)),
      acceleration: createVector(0, 0),
      life: random(100, 200)
    });
  }
}

function initializeObstacles() {
  obstacles = [];
  
  for (let i = 0; i < params.obstacleCount; i++) {
    obstacles.push({
      x: random(canvasWidth),
      y: random(canvasHeight),
      size: params.obstacleSize
    });
  }
}

function updateBoids() {
  for (let boid of boids) {
    // Calculate flocking forces
    let separation = calculateSeparation(boid);
    let alignment = calculateAlignment(boid);
    let cohesion = calculateCohesion(boid);
    let obstacleAvoidance = calculateObstacleAvoidance(boid);
    
    // Apply forces
    separation.mult(params.separationWeight);
    alignment.mult(params.alignmentWeight);
    cohesion.mult(params.cohesionWeight);
    obstacleAvoidance.mult(params.obstacleAvoidanceWeight);
    
    boid.acceleration.add(separation);
    boid.acceleration.add(alignment);
    boid.acceleration.add(cohesion);
    boid.acceleration.add(obstacleAvoidance);
    
    // Update velocity and position
    boid.velocity.add(boid.acceleration);
    boid.velocity.limit(params.maxSpeed);
    boid.position.add(boid.velocity);
    
    // Reset acceleration
    boid.acceleration.mult(0);
    
    // Wrap around edges
    if (boid.position.x < 0) boid.position.x = canvasWidth;
    if (boid.position.x > canvasWidth) boid.position.x = 0;
    if (boid.position.y < 0) boid.position.y = canvasHeight;
    if (boid.position.y > canvasHeight) boid.position.y = 0;
    
    // Life cycle
    boid.life--;
    if (boid.life <= 0) {
      boid.position = createVector(random(canvasWidth), random(canvasHeight));
      boid.velocity = createVector(random(-2, 2), random(-2, 2));
      boid.life = random(100, 200);
    }
  }
}

function calculateSeparation(boid) {
  let steering = createVector(0, 0);
  let count = 0;
  
  for (let other of boids) {
    let distance = p5.Vector.dist(boid.position, other.position);
    if (distance > 0 && distance < params.separationRadius) {
      let diff = p5.Vector.sub(boid.position, other.position);
      diff.normalize();
      diff.div(distance);
      steering.add(diff);
      count++;
    }
  }
  
  if (count > 0) {
    steering.div(count);
    steering.normalize();
    steering.mult(params.maxSpeed);
    steering.sub(boid.velocity);
    steering.limit(params.maxForce);
  }
  
  return steering;
}

function calculateAlignment(boid) {
  let steering = createVector(0, 0);
  let count = 0;
  
  for (let other of boids) {
    let distance = p5.Vector.dist(boid.position, other.position);
    if (distance > 0 && distance < params.alignmentRadius) {
      steering.add(other.velocity);
      count++;
    }
  }
  
  if (count > 0) {
    steering.div(count);
    steering.normalize();
    steering.mult(params.maxSpeed);
    steering.sub(boid.velocity);
    steering.limit(params.maxForce);
  }
  
  return steering;
}

function calculateCohesion(boid) {
  let steering = createVector(0, 0);
  let count = 0;
  
  for (let other of boids) {
    let distance = p5.Vector.dist(boid.position, other.position);
    if (distance > 0 && distance < params.cohesionRadius) {
      steering.add(other.position);
      count++;
    }
  }
  
  if (count > 0) {
    steering.div(count);
    steering.sub(boid.position);
    steering.normalize();
    steering.mult(params.maxSpeed);
    steering.sub(boid.velocity);
    steering.limit(params.maxForce);
  }
  
  return steering;
}

function calculateObstacleAvoidance(boid) {
  let steering = createVector(0, 0);
  
  for (let obstacle of obstacles) {
    let distance = dist(boid.position.x, boid.position.y, obstacle.x, obstacle.y);
    if (distance < params.obstacleRadius) {
      let diff = p5.Vector.sub(boid.position, createVector(obstacle.x, obstacle.y));
      diff.normalize();
      diff.div(distance);
      steering.add(diff);
    }
  }
  
  if (steering.mag() > 0) {
    steering.normalize();
    steering.mult(params.maxSpeed);
    steering.sub(boid.velocity);
    steering.limit(params.maxForce);
  }
  
  return steering;
}

function drawBoids() {
  for (let boid of boids) {
    // Calculate color based on velocity
    let speed = boid.velocity.mag();
    let hue = params.colorHue + speed * 20;
    let sat = params.colorSaturation + speed * 10;
    let bright = params.colorBrightness;
    
    // Convert HSB to RGB
    let rgb = hsbToRgb(hue % 360, sat, bright);
    
    // Draw boid with direction
    push();
    translate(boid.position.x, boid.position.y);
    rotate(boid.velocity.heading());
    
    // Draw trail
    stroke(rgb.r, rgb.g, rgb.b, 100);
    strokeWeight(1);
    line(-params.boidSize * 2, 0, 0, 0);
    
    // Draw boid body
    fill(rgb.r, rgb.g, rgb.b);
    noStroke();
    triangle(params.boidSize, 0, -params.boidSize, -params.boidSize/2, -params.boidSize, params.boidSize/2);
    
    pop();
  }
}

function drawObstacles() {
  fill(100, 50);
  stroke(150);
  strokeWeight(2);
  
  for (let obstacle of obstacles) {
    ellipse(obstacle.x, obstacle.y, obstacle.size);
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

function resetSimulation() {
  initializeBoids();
  initializeObstacles();
  animationTime = 0;
}

function addRandomBoids(count) {
  for (let i = 0; i < count; i++) {
    boids.push({
      position: createVector(random(canvasWidth), random(canvasHeight)),
      velocity: createVector(random(-2, 2), random(-2, 2)),
      acceleration: createVector(0, 0),
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
    `Boids: ${boids.length}`,
    `FPS: ${floor(frameRate())}`,
    `Time: ${floor(animationTime)}`,
    `Separation: ${params.separationWeight.toFixed(1)}`,
    `Alignment: ${params.alignmentWeight.toFixed(1)}`,
    `Cohesion: ${params.cohesionWeight.toFixed(1)}`,
    `Obstacle Avoidance: ${params.obstacleAvoidanceWeight.toFixed(1)}`
  ];
  
  for (let i = 0; i < info.length; i++) {
    text(info[i], 10, 10 + i * 20);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  canvasWidth = width;
  canvasHeight = height;
}
