let flock;

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  flock = new Flock();
  
  // Add an initial set of boids into the system
  for (let i = 0; i < 100; i++) {
    let b = new Boid(width / 2, height / 2);
    flock.addBoid(b);
  }
}

function draw() {
  // Expose parameters for MIDI control
  let rglrspeed = p5Param('speed', 3, { min: 1, max: 10, label: 'Max Speed' });
  let rglrforce = p5Param('force', 0.5, { min: 0.1, max: 2.0, label: 'Steering Force' });
  let separationWeight = p5Param('separation', 1.5, { min: 0, max: 3, label: 'Separation Weight' });
  let alignmentWeight = p5Param('alignment', 1.0, { min: 0, max: 3, label: 'Alignment Weight' });
  let cohesionWeight = p5Param('cohesion', 1.0, { min: 0, max: 3, label: 'Cohesion Weight' });
  let boidCount = p5Param('count', 100, { min: 10, max: 300, label: 'Boid Count' });
  
  background(0);
  
  // Adjust flock size based on parameter
  flock.adjustSize(Math.floor(boidCount));
  
  // Pass parameters to flock for rendering
  flock.run(rglrspeed, rglrforce, separationWeight, alignmentWeight, cohesionWeight);
}

// On mouse drag, add a new boid to the flock
function mouseDragged() {
  flock.addBoid(new Boid(mouseX, mouseY));
}

// Handle window resize
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// Flock class to manage the array of all the boids
class Flock {
  constructor() {
    // Initialize the array of boids
    this.boids = [];
  }

  run(maxSpeed, maxForce, sepWeight, alignWeight, cohWeight) {
    for (let boid of this.boids) {
      // Update boid parameters and pass the entire list of boids
      boid.updateParameters(maxSpeed, maxForce);
      boid.run(this.boids, sepWeight, alignWeight, cohWeight);
    }
  }

  addBoid(b) {
    this.boids.push(b);
  }
  
  // Adjust flock size based on parameter
  adjustSize(targetCount) {
    while (this.boids.length < targetCount) {
      this.addBoid(new Boid(random(width), random(height)));
    }
    while (this.boids.length > targetCount) {
      this.boids.pop();
    }
  }
}

class Boid {
  constructor(x, y) {
    this.acceleration = createVector(0, 0);
    this.velocity = createVector(random(-1, 1), random(-1, 1));
    this.position = createVector(x, y);
    this.size = 3.0;

    // Default values - will be updated by parameters
    this.maxSpeed = 3;
    this.maxForce = 0.5;
    
    colorMode(HSB);
    this.color = color(random(360), 80, 100);
  }
  
  // Update parameters from MIDI controls
  updateParameters(maxSpeed, maxForce) {
    this.maxSpeed = maxSpeed;
    this.maxForce = maxForce;
  }

  run(boids, sepWeight, alignWeight, cohWeight) {
    this.flock(boids, sepWeight, alignWeight, cohWeight);
    this.update();
    this.borders();
    this.render();
  }

  applyForce(force) {
    // We could add mass here if we want: A = F / M
    this.acceleration.add(force);
  }

  // We accumulate a new acceleration each time based on three rules
  flock(boids, sepWeight, alignWeight, cohWeight) {
    let separation = this.separate(boids);
    let alignment = this.align(boids);
    let cohesion = this.cohesion(boids);

    // Apply MIDI-controlled weights to these forces
    separation.mult(sepWeight);
    alignment.mult(alignWeight);
    cohesion.mult(cohWeight);

    // Add the force vectors to acceleration
    this.applyForce(separation);
    this.applyForce(alignment);
    this.applyForce(cohesion);
  }

  // Method to update location
  update() {
    // Update velocity
    this.velocity.add(this.acceleration);

    // Limit speed using MIDI-controlled maxSpeed
    this.velocity.limit(this.maxSpeed);
    this.position.add(this.velocity);

    // Reset acceleration to 0 each cycle
    this.acceleration.mult(0);
  }

  // A method that calculates and applies a steering force towards a target
  seek(target) {
    let desired = p5.Vector.sub(target, this.position);
    desired.normalize();
    desired.mult(this.maxSpeed);

    let steer = p5.Vector.sub(desired, this.velocity);
    steer.limit(this.maxForce); // Use MIDI-controlled maxForce
    return steer;
  }

  render() {
    // Draw a triangle rotated in the direction of velocity
    let theta = this.velocity.heading() + radians(90);
    fill(this.color);
    stroke(255, 100);
    strokeWeight(1);
    push();
    translate(this.position.x, this.position.y);
    rotate(theta);
    beginShape();
    vertex(0, -this.size * 2);
    vertex(-this.size, this.size * 2);
    vertex(this.size, this.size * 2);
    endShape(CLOSE);
    pop();
  }

  // Wraparound
  borders() {
    if (this.position.x < -this.size) {
      this.position.x = width + this.size;
    }
    if (this.position.y < -this.size) {
      this.position.y = height + this.size;
    }
    if (this.position.x > width + this.size) {
      this.position.x = -this.size;
    }
    if (this.position.y > height + this.size) {
      this.position.y = -this.size;
    }
  }

  // Separation - steer away from nearby boids
  separate(boids) {
    let desiredSeparation = 25.0;
    let steer = createVector(0, 0);
    let count = 0;

    for (let boid of boids) {
      let distanceToNeighbor = p5.Vector.dist(this.position, boid.position);

      if (distanceToNeighbor > 0 && distanceToNeighbor < desiredSeparation) {
        let diff = p5.Vector.sub(this.position, boid.position);
        diff.normalize();
        diff.div(distanceToNeighbor); // Scale by distance
        steer.add(diff);
        count++;
      }
    }

    if (count > 0) {
      steer.div(count);
    }

    if (steer.mag() > 0) {
      steer.normalize();
      steer.mult(this.maxSpeed);
      steer.sub(this.velocity);
      steer.limit(this.maxForce);
    }
    return steer;
  }

  // Alignment - steer towards average heading of neighbors
  align(boids) {
    let neighborDistance = 50;
    let sum = createVector(0, 0);
    let count = 0;
    
    for (let boid of boids) {
      let d = p5.Vector.dist(this.position, boid.position);
      if (d > 0 && d < neighborDistance) {
        sum.add(boid.velocity);
        count++;
      }
    }
    
    if (count > 0) {
      sum.div(count);
      sum.normalize();
      sum.mult(this.maxSpeed);
      let steer = p5.Vector.sub(sum, this.velocity);
      steer.limit(this.maxForce);
      return steer;
    } else {
      return createVector(0, 0);
    }
  }

  // Cohesion - steer towards average position of neighbors
  cohesion(boids) {
    let neighborDistance = 50;
    let sum = createVector(0, 0);
    let count = 0;
    
    for (let boid of boids) {
      let d = p5.Vector.dist(this.position, boid.position);
      if (d > 0 && d < neighborDistance) {
        sum.add(boid.position);
        count++;
      }
    }
    
    if (count > 0) {
      sum.div(count);
      return this.seek(sum);
    } else {
      return createVector(0, 0);
    }
  }
}