// Mediapipe Pose CJS browser global compatibility shim
import '@mediapipe/pose/pose.js';

export const Pose = typeof window !== 'undefined' && window.Pose ? window.Pose : globalThis.Pose;
export default typeof window !== 'undefined' && window.Pose ? window.Pose : globalThis.Pose;
