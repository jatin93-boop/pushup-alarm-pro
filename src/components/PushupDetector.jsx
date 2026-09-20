import React, { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import * as poseDetection from '@tensorflow-models/pose-detection';
import { ExerciseStateTracker } from '../utils/poseAnalyzer';
import { Camera, CameraOff, RefreshCw, CheckCircle2 } from 'lucide-react';

const PushupDetector = ({ exerciseType = 'pushups', targetReps = 10, currentReps = 0, onRepComplete, onGoalReached }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const trackerRef = useRef(new ExerciseStateTracker(exerciseType));
  const animationFrameRef = useRef(null);
  const detectorRef = useRef(null);

  const [isLoadingModel, setIsLoadingModel] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [feedback, setFeedback] = useState(`Initializing ${exerciseType.toUpperCase()} Detector...`);
  const [angle, setAngle] = useState(180);
  const [depthPercent, setDepthPercent] = useState(0);

  // Re-initialize tracker when exerciseType changes
  useEffect(() => {
    if (trackerRef.current) {
      trackerRef.current.reset(exerciseType);
    }
  }, [exerciseType]);

  // Initialize TFJS MoveNet
  useEffect(() => {
    let isMounted = true;

    async function initDetector() {
      try {
        setIsLoadingModel(true);
        setFeedback('Loading AI Pose Engine...');
        
        await tf.ready();
        await tf.setBackend('webgl');

        const detector = await poseDetection.createDetector(
          poseDetection.SupportedModels.MoveNet,
          { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
        );

        if (isMounted) {
          detectorRef.current = detector;
          setIsLoadingModel(false);
          setFeedback(`AI Ready for ${exerciseType.replace('_', ' ').toUpperCase()}. Start camera or tap manual.`);
          startCamera();
        }
      } catch (err) {
        if (isMounted) {
          setIsLoadingModel(false);
          setCameraError('AI detector fallback enabled. You can count reps via camera or manual tap.');
          setFeedback('Manual Counter Mode active');
        }
      }
    }

    initDetector();

    return () => {
      isMounted = false;
      stopCamera();
      if (detectorRef.current) {
        detectorRef.current.dispose();
      }
    };
  }, [exerciseType]);

  useEffect(() => {
    if (trackerRef.current) {
      trackerRef.current.repCount = currentReps;
    }
  }, [currentReps]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setCameraActive(true);
          setFeedback(`Position body for ${exerciseType.replace('_', ' ').toUpperCase()}`);
          detectFrame();
        };
      }
    } catch (err) {
      setCameraActive(false);
      setCameraError('Camera unavailable. Use Manual Rep Button below.');
    }
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const detectFrame = async () => {
    if (!videoRef.current || videoRef.current.readyState < 2) {
      animationFrameRef.current = requestAnimationFrame(detectFrame);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (canvas) {
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
    }

    try {
      if (detectorRef.current && video) {
        const poses = await detectorRef.current.estimatePoses(video);
        if (poses && poses.length > 0) {
          const keypoints = poses[0].keypoints;
          drawPoseCanvas(keypoints, canvas);
          
          const result = trackerRef.current.processFrame(keypoints);
          setFeedback(result.feedback);
          setAngle(result.angle);
          setDepthPercent(result.depthPercentage);

          if (result.isRepCompleted) {
            onRepComplete(trackerRef.current.repCount);
            if (trackerRef.current.repCount >= targetReps) {
              onGoalReached();
            }
          }
        }
      }
    } catch (e) {}

    animationFrameRef.current = requestAnimationFrame(detectFrame);
  };

  const drawPoseCanvas = (keypoints, canvas) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const kpMap = {};
    keypoints.forEach(kp => { kpMap[kp.name] = kp; });

    const adjacentPairs = [
      ['left_shoulder', 'right_shoulder'],
      ['left_shoulder', 'left_elbow'],
      ['left_elbow', 'left_wrist'],
      ['right_shoulder', 'right_elbow'],
      ['right_elbow', 'right_wrist'],
      ['left_shoulder', 'left_hip'],
      ['right_shoulder', 'right_hip'],
      ['left_hip', 'left_knee'],
      ['left_knee', 'left_ankle'],
      ['right_hip', 'right_knee'],
      ['right_knee', 'right_ankle']
    ];

    ctx.lineWidth = 4;
    ctx.strokeStyle = '#00f0ff';

    adjacentPairs.forEach(([p1Name, p2Name]) => {
      const p1 = kpMap[p1Name];
      const p2 = kpMap[p2Name];
      if (p1 && p2 && p1.score > 0.3 && p2.score > 0.3) {
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    });

    keypoints.forEach(kp => {
      if (kp.score > 0.3) {
        ctx.beginPath();
        ctx.arc(kp.x, kp.y, 7, 0, 2 * Math.PI);
        ctx.fillStyle = '#00ff88';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
      }
    });
  };

  const handleManualRep = () => {
    const nextReps = currentReps + 1;
    trackerRef.current.repCount = nextReps;
    onRepComplete(nextReps);
    if (nextReps >= targetReps) {
      onGoalReached();
    }
  };

  return (
    <div className="pushup-detector-card">
      <div className="detector-video-wrapper">
        <video ref={videoRef} playsInline muted className={`detector-video ${cameraActive ? 'active' : 'inactive'}`} />
        <canvas ref={canvasRef} className="detector-canvas" />

        {isLoadingModel && (
          <div className="detector-overlay loading-overlay">
            <RefreshCw className="spin-icon" size={40} />
            <p>Loading AI Pose Engine for {exerciseType.replace('_', ' ').toUpperCase()}...</p>
          </div>
        )}

        {!isLoadingModel && !cameraActive && (
          <div className="detector-overlay error-overlay">
            <CameraOff size={48} className="icon-alert" />
            <p>{cameraError || 'Camera inactive'}</p>
            <button className="btn btn-primary" onClick={startCamera}>
              <Camera size={18} /> Enable Camera
            </button>
          </div>
        )}

        <div className="hud-rep-counter">
          <div className="hud-big-num">
            {currentReps} <span className="hud-total">/ {targetReps}</span>
          </div>
          <div className="hud-label">{exerciseType.replace('_', ' ').toUpperCase()}</div>
        </div>

        <div className="hud-angle-badge">
          Joint Angle: {angle}°
        </div>
      </div>

      <div className="detector-feedback-bar">
        <div className="feedback-text">{feedback}</div>
        <div className="depth-progress-container">
          <div className="depth-label">{exerciseType === 'plank' ? 'Hold Progress' : 'Rep Depth'}</div>
          <div className="depth-bar-track">
            <div className="depth-bar-fill" style={{ width: `${depthPercent}%` }} />
          </div>
        </div>
      </div>

      <div className="detector-controls">
        {!cameraActive ? (
          <button className="btn btn-outline" onClick={startCamera}>
            <Camera size={16} /> Connect Camera
          </button>
        ) : (
          <button className="btn btn-outline" onClick={stopCamera}>
            <CameraOff size={16} /> Pause Camera
          </button>
        )}

        <button className="btn btn-manual-rep" onClick={handleManualRep}>
          <CheckCircle2 size={18} /> +1 Rep (Manual Tap)
        </button>
      </div>
    </div>
  );
};

export default PushupDetector;
