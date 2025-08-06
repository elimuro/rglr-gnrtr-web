# Scene Management Fix - Missing Animation Parameters

## Overview
The scene management system is missing several animation parameters in both the export and import functions, causing animation settings to not be retained when saving and loading scenes.

## Issues Found

### Missing Parameters in Export/Import:
1. `centerScalingAnimation` - Missing from export/import
2. `enableSizeAnimation` - Missing from export/import
3. Division parameters - Missing from import function

### Missing Division Parameters in Import:
- `movementDivision`
- `rotationDivision` 
- `scaleDivision`
- `shapeCyclingDivision`
- `morphingDivision`
- `centerScalingDivision`

## Required Changes

### Step 1: Fix Export Function (StateManager.js - around line 530)

**File:** `src/core/StateManager.js`

**Current Code:**
```javascript
// Center scaling animation parameters
centerScalingEnabled: this.state.centerScalingEnabled,
centerScalingIntensity: this.state.centerScalingIntensity,
centerScalingCurve: this.state.centerScalingCurve,
centerScalingRadius: this.state.centerScalingRadius,
centerScalingDirection: this.state.centerScalingDirection,
centerScalingAnimationSpeed: this.state.centerScalingAnimationSpeed,
centerScalingAnimationType: this.state.centerScalingAnimationType
```

**Should Be:**
```javascript
// Center scaling animation parameters
centerScalingEnabled: this.state.centerScalingEnabled,
centerScalingIntensity: this.state.centerScalingIntensity,
centerScalingCurve: this.state.centerScalingCurve,
centerScalingRadius: this.state.centerScalingRadius,
centerScalingDirection: this.state.centerScalingDirection,
centerScalingAnimation: this.state.centerScalingAnimation,
centerScalingAnimationSpeed: this.state.centerScalingAnimationSpeed,
centerScalingAnimationType: this.state.centerScalingAnimationType,

// Additional animation parameters
enableSizeAnimation: this.state.enableSizeAnimation
```

### Step 2: Add Division Parameters to Import Function (StateManager.js - after line 633)

**File:** `src/core/StateManager.js`

**Current Code:**
```javascript
addInterpolation('scaleAmplitude', settings.scaleAmplitude, currentState.scaleAmplitude);

// Shape cycling parameters
addInterpolation('shapeCyclingSpeed', settings.shapeCyclingSpeed, currentState.shapeCyclingSpeed);
```

**Should Be:**
```javascript
addInterpolation('scaleAmplitude', settings.scaleAmplitude, currentState.scaleAmplitude);

// Division parameters
addInterpolation('movementDivision', settings.movementDivision, currentState.movementDivision);
addInterpolation('rotationDivision', settings.rotationDivision, currentState.rotationDivision);
addInterpolation('scaleDivision', settings.scaleDivision, currentState.scaleDivision);
addInterpolation('shapeCyclingDivision', settings.shapeCyclingDivision, currentState.shapeCyclingDivision);
addInterpolation('morphingDivision', settings.morphingDivision, currentState.morphingDivision);
addInterpolation('centerScalingDivision', settings.centerScalingDivision, currentState.centerScalingDivision);

// Shape cycling parameters
addInterpolation('shapeCyclingSpeed', settings.shapeCyclingSpeed, currentState.shapeCyclingSpeed);
```

### Step 3: Add Missing Parameters to Import Function (StateManager.js - after line 725)

**File:** `src/core/StateManager.js`

**Current Code:**
```javascript
addInterpolation('centerScalingDirection', settings.centerScalingDirection, currentState.centerScalingDirection);
addInterpolation('centerScalingAnimationSpeed', settings.centerScalingAnimationSpeed, currentState.centerScalingAnimationSpeed);
addInterpolation('centerScalingAnimationType', settings.centerScalingAnimationType, currentState.centerScalingAnimationType);

// Sphere distortion parameter
addInterpolation('sphereDistortionStrength', settings.sphereDistortionStrength, currentState.sphereDistortionStrength);
```

**Should Be:**
```javascript
addInterpolation('centerScalingDirection', settings.centerScalingDirection, currentState.centerScalingDirection);
addInterpolation('centerScalingAnimation', settings.centerScalingAnimation, currentState.centerScalingAnimation);
addInterpolation('centerScalingAnimationSpeed', settings.centerScalingAnimationSpeed, currentState.centerScalingAnimationSpeed);
addInterpolation('centerScalingAnimationType', settings.centerScalingAnimationType, currentState.centerScalingAnimationType);

// Additional animation parameters
addInterpolation('enableSizeAnimation', settings.enableSizeAnimation, currentState.enableSizeAnimation);

// Sphere distortion parameter
addInterpolation('sphereDistortionStrength', settings.sphereDistortionStrength, currentState.sphereDistortionStrength);
```

## Summary of Changes

### Export Function Changes:
- ✅ Add `centerScalingAnimation: this.state.centerScalingAnimation,`
- ✅ Add `enableSizeAnimation: this.state.enableSizeAnimation`

### Import Function Changes:
- ✅ Add division parameters section (6 parameters)
- ✅ Add `centerScalingAnimation` parameter
- ✅ Add `enableSizeAnimation` parameter

## Testing

After making these changes, test the scene management by:

1. **Save a scene** with various animation settings enabled
2. **Load a different scene** 
3. **Load the original scene** - all animation parameters should be restored correctly

## Parameters That Will Now Be Saved/Loaded

### Animation Toggles:
- `enableMovementAnimation`
- `enableRotationAnimation` 
- `enableScaleAnimation`
- `enableShapeCycling`
- `centerScalingEnabled`
- `centerScalingAnimation`
- `enableSizeAnimation`

### Animation Parameters:
- `movementAmplitude`
- `rotationAmplitude`
- `scaleAmplitude`
- `shapeCyclingSpeed`
- `centerScalingIntensity`
- `centerScalingAnimationSpeed`
- `centerScalingAnimationType`

### Timing Divisions:
- `movementDivision`
- `rotationDivision`
- `scaleDivision`
- `shapeCyclingDivision`
- `morphingDivision`
- `centerScalingDivision`

### Other Animation Settings:
- `shapeCyclingPattern`
- `shapeCyclingDirection`
- `shapeCyclingSync`
- `shapeCyclingIntensity`
- `shapeCyclingTrigger`
- `centerScalingCurve`
- `centerScalingRadius`
- `centerScalingDirection`

## Notes

- The `animationSpeed` and `animationType` parameters are obsolete and should NOT be added
- Audio and MIDI parameters are handled separately and don't need to be included in scene files
- All changes are in the `StateManager.js` file only
- No changes needed to scene files themselves - they will automatically include the new parameters when saved

## Verification

After implementing these changes, verify that:
1. All animation toggles are saved/loaded correctly
2. All timing divisions are saved/loaded correctly  
3. All animation parameters are saved/loaded correctly
4. Scene files contain the new parameters when saved
5. Loading scenes restores all animation settings properly 