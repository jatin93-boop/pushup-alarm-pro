import React, { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import * as poseDetection from '@tensorflow-models/pose-detection';
import { PushupStateTracker } from '../utils/poseAnalyzer';
import { Camera, CameraOff, RefreshCw, CheckCircle2, AlertTriangle, Play } from 'lucide-react';

const PushupDetector = ({ targetReps = 10, currentReps = 0, onRepComplete, onGoalReached }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const trackerRef = useRef(new PushupStateTracker());
  const animationFrameRef = useRef(null);
  const detectorRef = useRef(null);

  const [isLoadingModel, setIsLoadingModel] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [feedback, setFeedback] = useState('Initializing Push-Up Detector...');
  const [elbowAngle, setElbowAngle] = useState(180);
  const [depthPercent, setDepthPercent] = useState(0);
  const [detectorStatus, setDetectorStatus] = useState('loading'); // 'loading', 'ready', 'error'

  // Initialize TFJS and MoveNet pose detector
  useEffect(() => {
    let isMounted = true;

    async function initDetector() {
      try {
        setIsLoadingModel(true);
        setDetectorStatus('loading');
        setFeedback('Loading AI Pose Detector...');
        
        await tf.ready();
        await tf.setBackend('webgl');

        const detectorConfig = {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
          enableSmoothing: true
        };

        const detector = await poseDetection.createDetector(
          poseDetection.SupportedModels.MoveNet,
          detectorConfig
        );

        if (isMounted) {
          detectorRef.current = detector;
          setIsLoadingModel(false);
          setDetectorStatus('ready');
          setFeedback('Pose AI Ready. Start webcam or use Manual Counter.');
          startCamera();
        }
      } catch (err) {
        console.error('Failed to load Pose Detector model:', err);
        if (isMounted) {
          setIsLoadingModel(false);
          setDetectorStatus('error');
          setCameraError('AI detector fallback enabled. You can count pushups via camera or manual tap.');
          setFeedback('AI model load fallback active');
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
  }, []);

  // Sync external currentReps with state tracker if updated externally
  useEffect(() => {
    if (trackerRef.current) {
      trackerRef.current.repCount = currentReps;
    }
  }, [currentReps]);

  // Start webcam feed
  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setCameraActive(true);
          setFeedback('Get into push-up position in frame');
          detectFrame();
        };
      }
    } catch (err) {
      console.warn('Camera access error:', err);
      setCameraActive(false);
      setCameraError('Webcam access was denied or not found. You can still count push-ups manually!');
      setFeedback('Camera unavailable - Use Manual Rep Button below');
    }
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Detection Loop
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
          
          // Draw Pose Overlay on Canvas
          drawPoseCanvas(keypoints, canvas, video);

          // Process push-up logic
          const result = trackerRef.current.processFrame(keypoints);
          
          setFeedback(result.feedback);
          setElbowAngle(result.elbowAngle);
          setDepthPercent(result.depthPercentage);

          if (result.isRepCompleted) {
            onRepComplete(trackerRef.current.repCount);
            if (trackerRef.current.repCount >= targetReps) {
              onGoalReached();
            }
          }
        }
      }
    } catch (e) {
      console.error('Frame pose estimation error:', e);
    }

    animationFrameRef.current = requestAnimationFrame(detectFrame);
  };

  // Draw skeleton overlay with keypoint nodes & skeleton lines
  const drawPoseCanvas = (keypoints, canvas, video) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Keypoint map
    const kpMap = {};
    keypoints.forEach(kp => {
      kpMap[kp.name] = kp;
    });

    // Skeleton connection pairs
    const adjacentPairs = [
      ['left_shoulder', 'right_shoulder'],
      ['left_shoulder', 'left_elbow'],
      ['left_elbow', 'left_wrist'],
      ['right_shoulder', 'right_elbow'],
      ['right_elbow', 'right_wrist'],
      ['left_shoulder', 'left_hip'],
      ['right_shoulder', 'right_hip']
    ];

    // Draw connecting skeleton lines
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#00f0ff'; // Cyber Cyan glow line

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

    // Draw Joint Keypoint Circles
    keypoints.forEach(kp => {
      if (kp.score > 0.3) {
        const isArmJoint = ['left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow', 'left_wrist', 'right_wrist'].includes(kp.name);
        
        ctx.beginPath();
        ctx.arc(kp.x, kp.y, isArmJoint ? 8 : 5, 0, 2 * Math.PI);
        ctx.fillStyle = isArmJoint ? '#00ff88' : '#ff0055';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
      }
    });
  };

  // Manual Pushup Increment for testing or fallback
  const handleManualRep = () => {
    const nextReps = currentReps + 1;
    trackerRef.current.repCount = nextReps;
    setFeedback(`Manual rep recorded! (${nextReps}/${targetReps})`);
    onRepComplete(nextReps);
    if (nextReps >= targetReps) {
      onGoalReached();
    }
  };

  return (
    <div className="pushup-detector-card">
      <div className="detector-video-wrapper">
        <video 
          ref={videoRef} 
          playsInline 
          muted 
          className={`detector-video ${cameraActive ? 'active' : 'inactive'}`} 
        />
        <canvas ref={canvasRef} className="detector-canvas" />

        {/* Loading Overlay */}
        {isLoadingModel && (
          <div className="detector-overlay loading-overlay">
            <RefreshCw className="spin-icon" size={40} />
            <p>Loading Pushup AI Detector...</p>
          </div>
        )}

        {/* Camera Error / Inactive State */}
        {!isLoadingModel && !cameraActive && (
          <div className="detector-overlay error-overlay">
            <CameraOff size={48} className="icon-alert" />
            <p>{cameraError || 'Camera inactive'}</p>
            <button className="btn btn-primary" onClick={startCamera}>
              <Camera size={18} /> Enable Camera
            </button>
          </div>
        )}

        {/* Live HUD rep count display on top of camera stream */}
        <div className="hud-rep-counter">
          <div className="hud-big-num">
            {currentReps} <span className="hud-total">/ {targetReps}</span>
          </div>
          <div className="hud-label">PUSH-UPS DONE</div>
        </div>

        {/* Live Arm Angle Indicator */}
        <div className="hud-angle-badge">
          Elbow Angle: {elbowAngle}°
        </div>
      </div>

      {/* Realtime Feedback Bar */}
      <div className="detector-feedback-bar">
        <div className="feedback-text">{feedback}</div>
        <div className="depth-progress-container">
          <div className="depth-label">Pushup Depth</div>
          <div className="depth-bar-track">
            <div 
              className="depth-bar-fill" 
              style={{ width: `${depthPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Controls & Manual Counter fallback */}
      <div className="detector-controls">
        {!cameraActive ? (
          <button className="btn btn-outline" onClick={startCamera}>
            <Camera size={16} /> Try Reconnecting Camera
          </button>
        ) : (
          <button className="btn btn-outline" onClick={stopCamera}>
            <CameraOff size={16} /> Pause Camera
          </button>
        )}

        <button className="btn btn-manual-rep" onClick={handleManualRep}>
          <CheckCircle2 size={18} /> +1 Pushup (Manual Tap)
        </button>
      </div>
    </div>
  );
};

export default PushupDetector;
