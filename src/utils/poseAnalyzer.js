// Push-up pose analysis math engine (Angle calculations & pushup state machine)

/**
 * Calculates angle between three 2D points A (e.g. shoulder), B (e.g. elbow vertex), C (e.g. wrist)
 * @returns angle in degrees (0 to 180)
 */
export function calculateAngle(p1, p2, p3) {
  if (!p1 || !p2 || !p3) return 180;
  
  const radians = Math.atan2(p3.y - p2.y, p3.x - p2.x) - Math.atan2(p1.y - p2.y, p1.x - p2.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);

  if (angle > 180.0) {
    angle = 360.0 - angle;
  }
  return angle;
}

/**
 * Push-up State Tracker
 */
export class PushupStateTracker {
  constructor() {
    this.state = 'UP'; // 'UP', 'GOING_DOWN', 'DOWN', 'GOING_UP'
    this.repCount = 0;
    this.minElbowAngleThisRep = 180;
    this.lastRepTime = 0;
  }

  reset() {
    this.state = 'UP';
    this.repCount = 0;
    this.minElbowAngleThisRep = 180;
    this.lastRepTime = 0;
  }

  /**
   * Process incoming keypoints from TFJS MoveNet/PoseDetection or keypoint object
   * Keypoints array usually contains objects with { name / bodyPart, x, y, score }
   */
  processFrame(keypoints) {
    if (!keypoints || keypoints.length === 0) {
      return {
        state: this.state,
        repCount: this.repCount,
        feedback: 'Position camera to view upper body clearly',
        elbowAngle: 180,
        isRepCompleted: false,
        depthPercentage: 0
      };
    }

    // Keypoint map helper
    const kpMap = {};
    keypoints.forEach(kp => {
      const name = kp.name || kp.part;
      if (name) {
        kpMap[name] = kp;
      }
    });

    const leftShoulder = kpMap['left_shoulder'];
    const leftElbow = kpMap['left_elbow'];
    const leftWrist = kpMap['left_wrist'];
    
    const rightShoulder = kpMap['right_shoulder'];
    const rightElbow = kpMap['right_elbow'];
    const rightWrist = kpMap['right_wrist'];

    let leftAngle = 180;
    let rightAngle = 180;
    let validSideCount = 0;

    if (leftShoulder && leftElbow && leftWrist && (leftShoulder.score || 1) > 0.3 && (leftElbow.score || 1) > 0.3) {
      leftAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
      validSideCount++;
    }

    if (rightShoulder && rightElbow && rightWrist && (rightShoulder.score || 1) > 0.3 && (rightElbow.score || 1) > 0.3) {
      rightAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
      validSideCount++;
    }

    // Average angle of visible arms
    let currentAngle = 180;
    if (validSideCount === 2) {
      currentAngle = (leftAngle + rightAngle) / 2;
    } else if (leftShoulder && leftElbow && leftWrist) {
      currentAngle = leftAngle;
    } else if (rightShoulder && rightElbow && rightWrist) {
      currentAngle = rightAngle;
    }

    // Depth percentage (180 deg = 0%, 90 deg = 100%)
    const depthPercentage = Math.min(100, Math.max(0, Math.round(((160 - currentAngle) / (160 - 90)) * 100)));

    let isRepCompleted = false;
    let feedback = 'Get Ready (Arms Extended)';

    const now = Date.now();

    // State Transitions
    // 1. UP state: Arms straight (> 150 deg)
    if (currentAngle > 150) {
      if (this.state === 'GOING_UP' || this.state === 'DOWN') {
        // Must have reached a low enough angle during the rep (< 100 deg)
        if (this.minElbowAngleThisRep <= 105 && (now - this.lastRepTime) > 800) {
          this.repCount++;
          isRepCompleted = true;
          this.lastRepTime = now;
          feedback = '🔥 GREAT REP!';
        }
      }
      this.state = 'UP';
      this.minElbowAngleThisRep = 180;
      if (!isRepCompleted) feedback = 'START PUSHUP (LOWER CHEST)';
    } 
    // 2. GOING DOWN: Angle dropping
    else if (currentAngle <= 150 && currentAngle > 100) {
      if (currentAngle < this.minElbowAngleThisRep) {
        this.minElbowAngleThisRep = currentAngle;
      }

      if (this.state === 'UP') {
        this.state = 'GOING_DOWN';
      }
      feedback = 'GO LOWER...';
    } 
    // 3. DOWN state: Elbow angle <= 100 deg (Chest near ground)
    else if (currentAngle <= 100) {
      if (currentAngle < this.minElbowAngleThisRep) {
        this.minElbowAngleThisRep = currentAngle;
      }
      this.state = 'DOWN';
      feedback = 'GOOD DEPTH! NOW PUSH UP!';
    }

    if (this.state === 'DOWN' && currentAngle > 105) {
      this.state = 'GOING_UP';
      feedback = 'PUSH ALL THE WAY UP!';
    }

    return {
      state: this.state,
      repCount: this.repCount,
      feedback,
      elbowAngle: Math.round(currentAngle),
      isRepCompleted,
      depthPercentage
    };
  }
}
