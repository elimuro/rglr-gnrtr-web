function setup() {
  createCanvas(windowWidth, windowHeight);
  console.log('P5 sketch setup complete, canvas size:', width, 'x', height);
}

function draw() {
  // Semi-transparent black background for trails

  background(0, 20);
  
  // Expose parameters using p5Param helper
  const size = p5Param('ballSize', 80, { min: 20, max: 200, label: 'Ball Size' });
  const speed = p5Param('speed', 1, { min: 0.1, max: 5, label: 'Animation Speed' });
  const hue = p5Param('color', 180, { min: 0, max: 360, label: 'Color Hue' });
  
  // Simple bright circle that should be very visible
  fill(255, 0, 0); // Bright red
  stroke(255, 255, 0); // Yellow stroke
  strokeWeight(4);
  
  const x = width/2 + cos(frameCount * 0.02 * speed) * 150;
  const y = height/2 + sin(frameCount * 0.02 * speed) * 150;
  
  circle(x, y, size);
  
  // Static elements for debugging
  fill(0, 255, 0); // Bright green
  noStroke();
  circle(width/2, height/2, 30);
  
  // Text
  fill(255, 255, 0); // Yellow
  textSize(32);
  textAlign(CENTER);
  text('P5 LAYER WORKING!', width/2, height/2 + 150);
  text('Frame: ' + frameCount, width/2, height/2 + 200);
}