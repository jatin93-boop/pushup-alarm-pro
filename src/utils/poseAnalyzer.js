// Multi-Exercise Pose Analysis Engine (Push-ups, Squats, Jumping Jacks, Planks)

export function calculateAngle(p1, p2, p3) {
  if (!p1 || !p2 || !p3) return 180;
  
  const radians = Math.atan2(p3.y - p2.y, p3.x - p2.x) - Math.atan2(p1.y - p2.y, p1.x - p2.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);

  if (angle > 180.0) {
    angle = 360.0 - angle;
  }
  return angle;
}

export class ExerciseStateTracker {
  constructor(exerciseType = 'pushups') {
    this.exerciseType = exerciseType;
    this.state = 'UP';
    this.repCount = 0;
    this.minAngleThisRep = 180;
    this.lastRepTime = 0;
    this.plankStartTime = null;
    this.plankHoldSeconds = 0;
  }

  reset(exerciseType = 'pushups') {
    this.exerciseType = exerciseType;
    this.state = 'UP';
    this.repCount = 0;
    this.minAngleThisRep = 180;
    this.lastRepTime = 0;
    this.plankStartTime = null;
    this.plankHoldSeconds = 0;
  }

  processFrame(keypoints) {
    if (!keypoints || keypoints.length === 0) {
      return {
        state: this.state,
        repCount: this.repCount,
        feedback: 'Position camera to view full body clearly',
        angle: 180,
        isRepCompleted: false,
        depthPercentage: 0
      };
    }

    const kpMap = {};
    keypoints.forEach(kp => {
      const name = kp.name || kp.part;
      if (name) kpMap[name] = kp;
    });

    switch (this.exerciseType) {
      case 'squats':
        return this.processSquat(kpMap);
      case 'jumping_jacks':
        return this.processJumpingJack(kpMap);
      case 'plank':
        return this.processPlank(kpMap);
      case 'pushups':
      default:
        return this.processPushup(kpMap);
    }
  }

  // PUSH-UPS
  processPushup(kpMap) {
    const lShoulder = kpMap['left_shoulder'], lElbow = kpMap['left_elbow'], lWrist = kpMap['left_wrist'];
    const rShoulder = kpMap['right_shoulder'], rElbow = kpMap['right_elbow'], rWrist = kpMap['right_wrist'];

    let leftAngle = calculateAngle(lShoulder, lElbow, lWrist);
    let rightAngle = calculateAngle(rShoulder, rElbow, rWrist);

    let currentAngle = (lShoulder && rShoulder) ? (leftAngle + rightAngle) / 2 : (leftAngle || rightAngle || 180);
    const depthPercentage = Math.min(100, Math.max(0, Math.round(((160 - currentAngle) / (160 - 90)) * 100)));

    let isRepCompleted = false;
    let feedback = 'Start Pushup (Lower Chest)';
    const now = Date.now();

    if (currentAngle > 150) {
      if ((this.state === 'GOING_UP' || this.state === 'DOWN') && this.minAngleThisRep <= 105 && (now - this.lastRepTime) > 800) {
        this.repCount++;
        isRepCompleted = true;
        this.lastRepTime = now;
        feedback = '🔥 GREAT PUSH-UP!';
      }
      this.state = 'UP';
      this.minAngleThisRep = 180;
    } else if (currentAngle <= 150 && currentAngle > 100) {
      if (currentAngle < this.minAngleThisRep) this.minAngleThisRep = currentAngle;
      this.state = 'GOING_DOWN';
      feedback = 'GO LOWER...';
    } else if (currentAngle <= 100) {
      if (currentAngle < this.minAngleThisRep) this.minAngleThisRep = currentAngle;
      this.state = 'DOWN';
      feedback = 'GOOD DEPTH! PUSH UP!';
    }

    if (this.state === 'DOWN' && currentAngle > 105) {
      this.state = 'GOING_UP';
      feedback = 'PUSH ALL THE WAY UP!';
    }

    return {
      state: this.state,
      repCount: this.repCount,
      feedback,
      angle: Math.round(currentAngle),
      isRepCompleted,
      depthPercentage
    };
  }

  // SQUATS (Hip-Knee-Ankle angle)
  processSquat(kpMap) {
    const lHip = kpMap['left_hip'], lKnee = kpMap['left_knee'], lAnkle = kpMap['left_ankle'];
    const rHip = kpMap['right_hip'], rKnee = kpMap['right_knee'], rAnkle = kpMap['right_ankle'];

    let lAngle = calculateAngle(lHip, lKnee, lAnkle);
    let rAngle = calculateAngle(rHip, rKnee, rAnkle);
    let currentAngle = (lHip && rHip) ? (lAngle + rAngle) / 2 : (lAngle || rAngle || 180);

    const depthPercentage = Math.min(100, Math.max(0, Math.round(((170 - currentAngle) / (170 - 90)) * 100)));
    let isRepCompleted = false;
    let feedback = 'Start Squat (Lower Hips)';
    const now = Date.now();

    if (currentAngle > 155) {
      if ((this.state === 'GOING_UP' || this.state === 'DOWN') && this.minAngleThisRep <= 105 && (now - this.lastRepTime) > 800) {
        this.repCount++;
        isRepCompleted = true;
        this.lastRepTime = now;
        feedback = '💥 EXCELLENT SQUAT!';
      }
      this.state = 'UP';
      this.minAngleThisRep = 180;
    } else if (currentAngle <= 155 && currentAngle > 105) {
      if (currentAngle < this.minAngleThisRep) this.minAngleThisRep = currentAngle;
      this.state = 'GOING_DOWN';
      feedback = 'SQUAT DEEPER...';
    } else if (currentAngle <= 105) {
      if (currentAngle < this.minAngleThisRep) this.minAngleThisRep = currentAngle;
      this.state = 'DOWN';
      feedback = 'PARALLEL DEPTH! DRIVE UP!';
    }

    return {
      state: this.state,
      repCount: this.repCount,
      feedback,
      angle: Math.round(currentAngle),
      isRepCompleted,
      depthPercentage
    };
  }

  // JUMPING JACKS (Wrists above shoulders & leg spread)
  processJumpingJack(kpMap) {
    const lWrist = kpMap['left_wrist'], rWrist = kpMap['right_wrist'];
    const lShoulder = kpMap['left_shoulder'], rShoulder = kpMap['right_shoulder'];

    let handsUp = false;
    if (lWrist && rWrist && lShoulder && rShoulder) {
      handsUp = lWrist.y < lShoulder.y && rWrist.y < rShoulder.y;
    }

    let isRepCompleted = false;
    let feedback = 'Jump & Raise Hands Above Head';
    const now = Date.now();

    if (handsUp) {
      if (this.state === 'DOWN' && (now - this.lastRepTime) > 500) {
        this.repCount++;
        isRepCompleted = true;
        this.lastRepTime = now;
        feedback = '⚡ GREAT JACK!';
      }
      this.state = 'UP';
    } else {
      this.state = 'DOWN';
    }

    return {
      state: this.state,
      repCount: this.repCount,
      feedback: handsUp ? 'HANDS HIGH!' : 'JUMP OUT & HANDS UP',
      angle: handsUp ? 180 : 90,
      isRepCompleted,
      depthPercentage: handsUp ? 100 : 20
    };
  }

  // PLANK HOLD (Body straight + hold timer)
  processPlank(kpMap) {
    const lShoulder = kpMap['left_shoulder'], lHip = kpMap['left_hip'], lAnkle = kpMap['left_ankle'];
    let currentAngle = calculateAngle(lShoulder, lHip, lAnkle);

    const isAligned = currentAngle > 140;
    let feedback = 'Hold Plank Position (Straight Spine)';
    let isRepCompleted = false;

    if (isAligned) {
      if (!this.plankStartTime) this.plankStartTime = Date.now();
      const elapsed = Math.floor((Date.now() - this.plankStartTime) / 1000);
      
      if (elapsed > this.plankHoldSeconds) {
        this.plankHoldSeconds = elapsed;
        this.repCount = this.plankHoldSeconds;
        isRepCompleted = true;
      }
      feedback = `🔥 HOLDING PLANK (${this.plankHoldSeconds}s)`;
    } else {
      this.plankStartTime = null;
      feedback = 'ALIGN SPINE & HIPS!';
    }

    return {
      state: isAligned ? 'HOLD' : 'ALIGN',
      repCount: this.repCount,
      feedback,
      angle: Math.round(currentAngle),
      isRepCompleted,
      depthPercentage: Math.min(100, Math.round((this.plankHoldSeconds / 30) * 100))
    };
  }
}
