/**
 * Grid Lines Animation - P5 Sketch
 * A grid-based animation system using animated lines with effects similar to the main grid layer
 * Features: center scaling, wave patterns, radial effects, and musical timing integration
 */

let gridLines = [];
let animationTime = 0;
let gridWidth, gridHeight, cellSize;

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  // Initialize grid parameters
  gridWidth = 20;
  gridHeight = 15;
  cellSize = min(width / (gridWidth + 2), height / (gridHeight + 2));
  
  // Initialize grid lines
  initializeGridLines();
  
  console.log('Grid Lines Animation setup complete');
}

function draw() {
  // Expose parameters for MIDI control
  const speed = p5Param('speed', 1.0, { min: 0.1, max: 5.0, label: 'Animation Speed' });
  const intensity = p5Param('intensity', 0.8, { min: 0.1, max: 2.0, label: 'Effect Intensity' });
  const radius = p5Param('radius', 0.7, { min: 0.1, max: 1.5, label: 'Center Radius' });
  const curveType = p5Param('curve', 0, { min: 0, max: 3, label: 'Curve Type' });
  const animationType = p5Param('animation', 0, { min: 0, max: 3, label: 'Animation Type' });
  const lineThickness = p5Param('thickness', 2, { min: 1, max: 8, label: 'Line Thickness' });
  const colorHue = p5Param('colorHue', 180, { min: 0, max: 360, label: 'Color Hue' });
  const colorSaturation = p5Param('colorSat', 80, { min: 0, max: 100, label: 'Color Saturation' });
  const colorBrightness = p5Param('colorBright', 100, { min: 0, max: 100, label: 'Color Brightness' });
  
  // Interactive effect parameters (replacing mouse controls)
  const addLines = p5Param('addLines', 0, { min: 0, max: 1, step: 1, label: 'Add Lines Trigger' });
  const lineCount = p5Param('lineCount', 5, { min: 1, max: 20, label: 'Lines to Add' });
  const customLineLength = p5Param('lineLength', 100, { min: 50, max: 300, label: 'Custom Line Length' });
  const resetGrid = p5Param('resetGrid', 0, { min: 0, max: 1, step: 1, label: 'Reset Grid Trigger' });
  const randomizeGrid = p5Param('randomizeGrid', 0, { min: 0, max: 1, step: 1, label: 'Randomize Grid Trigger' });
  
  // Update animation time
  animationTime += 0.016 * speed; // Assuming 60fps
  
  // Semi-transparent background for trails
  background(0, 15);
  
  // Set color mode and stroke properties
  colorMode(HSB);
  strokeWeight(lineThickness);
  
  // Calculate center of grid
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Update and draw grid lines
  updateAndDrawGridLines(
    speed, intensity, radius, curveType, animationType,
    colorHue, colorSaturation, colorBrightness,
    centerX, centerY
  );
  
  // Handle MIDI-controlled interactive effects
  handleMIDIInteractions(addLines, lineCount, customLineLength, resetGrid, randomizeGrid);
  
  // Draw center indicator
  drawCenterIndicator(centerX, centerY);
  
  // Draw info text
  drawInfoText();
}

function initializeGridLines() {
  gridLines = [];
  
  // Create vertical lines with structured offsets
  for (let i = 0; i <= gridWidth; i++) {
    const x = (i - gridWidth / 2) * cellSize;
    // Use position-based offset for more structured feel
    const offset = (i / gridWidth) * TWO_PI;
    gridLines.push({
      type: 'vertical',
      x: x,
      y: 0,
      originalX: x,
      originalY: 0,
      length: gridHeight * cellSize,
      offset: offset
    });
  }
  
  // Create horizontal lines with structured offsets
  for (let j = 0; j <= gridHeight; j++) {
    const y = (j - gridHeight / 2) * cellSize;
    // Use position-based offset for more structured feel
    const offset = (j / gridHeight) * TWO_PI;
    gridLines.push({
      type: 'horizontal',
      x: 0,
      y: y,
      originalX: 0,
      originalY: y,
      length: gridWidth * cellSize,
      offset: offset
    });
  }
}

function updateAndDrawGridLines(speed, intensity, radius, curveType, animationType, 
                               colorHue, colorSat, colorBright, centerX, centerY) {
  
  for (let gridLine of gridLines) {
    // Calculate center scaling effect
    const centerScaling = calculateCenterScaling(
      gridLine, gridWidth, gridHeight, cellSize, 
      animationTime, speed, intensity, radius, curveType, animationType
    );
    
    // Apply scaling to line properties
    const scaledLength = gridLine.length * centerScaling;
    // More subtle, structured offset
    const scaledOffset = centerScaling * intensity * 20; // Reduced from 50 to 20
    
    // Calculate line start and end points
    let startX, startY, endX, endY;
    
    if (gridLine.type === 'vertical') {
      startX = centerX + gridLine.originalX + scaledOffset;
      startY = centerY - scaledLength / 2;
      endX = centerX + gridLine.originalX + scaledOffset;
      endY = centerY + scaledLength / 2;
    } else { // horizontal
      startX = centerX - scaledLength / 2;
      startY = centerY + gridLine.originalY + scaledOffset;
      endX = centerX + scaledLength / 2;
      endY = centerY + gridLine.originalY + scaledOffset;
    }
    
    // Calculate color based on scaling and position - more subtle
    const colorVariation = map(centerScaling, 0.7, 1.4, -15, 15); // Reduced from -30,30 to -15,15
    const finalHue = (colorHue + colorVariation) % 360;
    const finalSat = constrain(colorSat + (centerScaling - 1) * 10, 0, 100); // Reduced from 20 to 10
    const finalBright = constrain(colorBright + (centerScaling - 1) * 15, 0, 100); // Reduced from 30 to 15
    
    // Set stroke color with alpha based on scaling - more subtle
    const alpha = map(centerScaling, 0.7, 1.4, 150, 255); // Increased minimum from 100 to 150
    stroke(finalHue, finalSat, finalBright, alpha);
    
    // Draw the line
    line(startX, startY, endX, endY);
    
    // Add glow effect for intense scaling - more subtle
    if (centerScaling > 1.25) { // Increased threshold from 1.2 to 1.25
      strokeWeight(1);
      stroke(finalHue, finalSat, finalBright, alpha * 0.2); // Reduced from 0.3 to 0.2
      line(startX, startY, endX, endY);
      strokeWeight(2);
    }
  }
}

function calculateCenterScaling(gridLine, gridWidth, gridHeight, cellSize, 
                               animationTime, speed, intensity, radius, curveType, animationType) {
  
  // Calculate distance from center
  const centerX = (gridWidth - 1) / 2;
  const centerY = (gridHeight - 1) / 2;
  
  // Get line position in grid coordinates
  let gridX, gridY;
  if (gridLine.type === 'vertical') {
    gridX = (gridLine.originalX / cellSize) + centerX;
    gridY = centerY;
  } else {
    gridX = centerX;
    gridY = (gridLine.originalY / cellSize) + centerY;
  }
  
  const distanceFromCenter = Math.sqrt(
    Math.pow((gridX - centerX) * cellSize, 2) + 
    Math.pow((gridY - centerY) * cellSize, 2)
  );
  
  // Normalize distance to 0-1 range based on radius
  const maxDistance = Math.sqrt(
    Math.pow(centerX * cellSize, 2) + 
    Math.pow(centerY * cellSize, 2)
  ) * radius;
  
  const normalizedDistance = maxDistance > 0 ? 
    Math.min(distanceFromCenter / maxDistance, 1.0) : 0;
  
  // Apply curve function
  let curveFactor;
  switch (Math.floor(curveType)) {
    case 0: // Linear
      curveFactor = normalizedDistance;
      break;
    case 1: // Exponential
      curveFactor = Math.pow(normalizedDistance, 2);
      break;
    case 2: // Logarithmic
      curveFactor = normalizedDistance > 0 ? 
        Math.log(normalizedDistance + 1) / Math.log(2) : 0;
      break;
    case 3: // Sine wave
      curveFactor = Math.sin(normalizedDistance * Math.PI);
      break;
    default:
      curveFactor = normalizedDistance;
  }
  
  // Apply animation based on type
  let animationOffset = 0;
  const time = animationTime * speed;
  
  switch (Math.floor(animationType)) {
    case 0: // Structured Wave
      // More organized wave pattern based on grid position
      const wave1 = Math.sin(time + gridX * 0.2) * 0.3;
      const wave2 = Math.sin(time * 0.5 + gridY * 0.15) * 0.2;
      animationOffset = wave1 + wave2;
      break;
      
    case 1: // Radial Pulse
      // Cleaner radial pattern
      const radialDistance = Math.sqrt(gridX * gridX + gridY * gridY);
      const radialWave = Math.sin(time * 2 + radialDistance * 0.3) * 0.4;
      animationOffset = radialWave;
      break;
      
    case 2: // Spiral Effect
      // More organized spiral
      const angle = Math.atan2(gridY - centerY, gridX - centerX);
      const spiralWave = Math.sin(time * 1.5 + angle * 2 + distanceFromCenter * 0.1) * 0.3;
      animationOffset = spiralWave;
      break;
      
    case 3: // Structured Pattern
      // Organized pattern instead of chaos
      const pattern1 = Math.sin(time + gridX * 0.25) * 0.2;
      const pattern2 = Math.cos(time * 0.6 + gridY * 0.2) * 0.2;
      animationOffset = pattern1 + pattern2;
      break;
      
    default:
      // Simple, clean wave
      animationOffset = Math.sin(time + gridX * 0.2 + gridY * 0.15) * 0.25;
  }
  
  // Calculate final scaling factor - more structured and subtle
  const baseScaling = 1.0 - curveFactor * 0.3; // Reduced from 0.5 to 0.3 for subtler effect
  const animatedScaling = baseScaling + animationOffset * intensity * 0.2; // Reduced from 0.3 to 0.2
  
  return constrain(animatedScaling, 0.7, 1.4); // Tighter range: 0.7 to 1.4 instead of 0.5 to 1.8
}

/**
 * Handle MIDI-controlled interactive effects
 */
function handleMIDIInteractions(addLines, lineCount, customLineLength, resetGrid, randomizeGrid) {
  // Add lines when triggered
  if (addLines > 0.5) {
    addStructuredLines(lineCount, customLineLength);
    // Reset trigger to prevent continuous adding
    // Note: In a real implementation, you'd need to reset the MIDI parameter
  }
  
  // Reset grid when triggered
  if (resetGrid > 0.5) {
    initializeGridLines();
    // Reset trigger to prevent continuous resetting
  }
  
  // Randomize grid dimensions when triggered
  if (randomizeGrid > 0.5) {
    randomizeGridDimensions();
    // Reset trigger to prevent continuous randomizing
  }
}

/**
 * Add structured lines based on MIDI parameters
 */
function addStructuredLines(count, length) {
  for (let i = 0; i < count; i++) {
    // Create lines in a structured pattern around the center
    const angle = (i / count) * TWO_PI;
    const radius = 100 + (i % 3) * 50; // Varying distances
    
    const x = cos(angle) * radius;
    const y = sin(angle) * radius;
    
    // Determine line type based on position
    const type = Math.abs(x) > Math.abs(y) ? 'vertical' : 'horizontal';
    
    const newLine = {
      type: type,
      x: x,
      y: y,
      originalX: x,
      originalY: y,
      length: length,
      offset: (type === 'vertical' ? x : y) * 0.01
    };
    
    gridLines.push(newLine);
  }
}

/**
 * Randomize grid dimensions
 */
function randomizeGridDimensions() {
  gridWidth = floor(random(10, 30));
  gridHeight = floor(random(8, 20));
  cellSize = min(width / (gridWidth + 2), height / (gridHeight + 2));
  initializeGridLines();
}

function drawCenterIndicator(centerX, centerY) {
  // Draw center point
  fill(255, 255, 0, 150);
  noStroke();
  circle(centerX, centerY, 8);
  
  // Draw center cross
  stroke(255, 255, 0, 100);
  strokeWeight(1);
  line(centerX - 20, centerY, centerX + 20, centerY);
  line(centerX, centerY - 20, centerX, centerY + 20);
}

function drawInfoText() {
  // Draw parameter info
  fill(255, 255, 255, 200);
  noStroke();
  textSize(12);
  textAlign(LEFT);
  text(`Grid: ${gridWidth}x${gridHeight} | Cell: ${floor(cellSize)}px | Time: ${animationTime.toFixed(1)}`, 10, 20);
  text(`Speed: ${p5Param('speed').toFixed(2)} | Intensity: ${p5Param('intensity').toFixed(2)} | Radius: ${p5Param('radius').toFixed(2)}`, 10, 35);
  text(`Curve: ${p5Param('curve')} | Animation: ${p5Param('animation')} | Lines: ${gridLines.length}`, 10, 50);
  text(`MIDI: Add[${p5Param('addLines')}] Count[${p5Param('lineCount')}] Reset[${p5Param('resetGrid')}]`, 10, 65);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  
  // Recalculate cell size and reinitialize grid
  cellSize = min(width / (gridWidth + 2), height / (gridHeight + 2));
  initializeGridLines();
}

// Note: All interactive effects are now controlled via MIDI parameters
// - addLines: Trigger to add new lines (0-1, step: 1)
// - lineCount: Number of lines to add (1-20)
// - lineLength: Length of custom lines (50-300)
// - resetGrid: Trigger to reset the grid (0-1, step: 1)
// - randomizeGrid: Trigger to randomize grid dimensions (0-1, step: 1)
