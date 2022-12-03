const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');
const landmarkContainer = document.getElementsByClassName('landmark-grid-container')[0];
const grid = new LandmarkGrid(landmarkContainer);

function vectorMagnitude(v) {
  return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
}

function calcVector(src, end) {
  return [end[0] - src[0], end[1] - src[1], end[2] - src[2]];
}

function normalizeVector(v) {
  m = vectorMagnitude(v);
  return [v[0] / m, v[1] / m, v[2] / m];
}

function vectorRotation(v1, v2) {
  v1 = normalizeVector(v1);
  v2 = normalizeVector(v2);

  // take cross product to get axis of rotation
  let axis = math.cross(v1, v2);

  // get cos of the vectors
  let cos = math.dot(v1, v2); // normally you'd divide by len(v1) * len(v2), but lengths are normalized

  // compute angle with inverse cosine
  let angle = math.acos(cos);

  return {"axis": axis, "angle": angle};
}

function landmarkToPoint(landmark) {
  return [landmark.x, landmark.y, landmark.z];
}

function averagePoints(p1, p2) {
  return [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2, (p1[2] + p2[2]) / 2];
}

// rotation from an up vector to vector made from given points
function absoluteRotation(src, end) {
  up = [0, 1, 0];
  vec = calcVector(src, end);
  //return vectorRotation(up, vec); // may be backwards
  return normalizeVector(vec);
}

function onResults(results) {
  if (!results.poseLandmarks) {
    grid.updateLandmarks([]);
    return;
  }

  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  /*
  canvasCtx.drawImage(results.segmentationMask, 0, 0,
                      canvasElement.width, canvasElement.height);
  */

  // Only overwrite existing pixels.
  canvasCtx.globalCompositeOperation = 'source-in';
  canvasCtx.fillStyle = '#00FF00';
  canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);

  // Only overwrite missing pixels.
  canvasCtx.globalCompositeOperation = 'destination-atop';
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

  canvasCtx.globalCompositeOperation = 'source-over';

  let rightHand = {
    'pos': landmarkToPoint(results.poseWorldLandmarks[16]),
    'rot': absoluteRotation(landmarkToPoint(results.poseWorldLandmarks[14]), landmarkToPoint(results.poseWorldLandmarks[16])),
  };
  let leftHand = {
    'pos': landmarkToPoint(results.poseWorldLandmarks[15]),
    'rot': absoluteRotation(landmarkToPoint(results.poseWorldLandmarks[13]), landmarkToPoint(results.poseWorldLandmarks[15])),
  };
  let leftElbow = {
    'pos': landmarkToPoint(results.poseWorldLandmarks[13]),
    'rot': absoluteRotation(landmarkToPoint(results.poseWorldLandmarks[13]), landmarkToPoint(results.poseWorldLandmarks[15])),
  }
  let rightElbow = {
    'pos': landmarkToPoint(results.poseWorldLandmarks[14]),
    'rot': absoluteRotation(landmarkToPoint(results.poseWorldLandmarks[14]), landmarkToPoint(results.poseWorldLandmarks[16])),
  }
  let leftShoulder = {
    'pos': landmarkToPoint(results.poseWorldLandmarks[11]),
    'rot': absoluteRotation(landmarkToPoint(results.poseWorldLandmarks[11]), landmarkToPoint(results.poseWorldLandmarks[13])),
  }
  let rightShoulder = {
    'pos': landmarkToPoint(results.poseWorldLandmarks[12]),
    'rot': absoluteRotation(landmarkToPoint(results.poseWorldLandmarks[12]), landmarkToPoint(results.poseWorldLandmarks[14])),
  }
  let rightFoot = {
    'pos': landmarkToPoint(results.poseWorldLandmarks[28]),
    'rot': absoluteRotation(landmarkToPoint(results.poseWorldLandmarks[26]), landmarkToPoint(results.poseWorldLandmarks[28])),
  };
  let leftFoot = {
    'pos': landmarkToPoint(results.poseWorldLandmarks[27]),
    'rot': absoluteRotation(landmarkToPoint(results.poseWorldLandmarks[25]), landmarkToPoint(results.poseWorldLandmarks[27])),
  };
  let rightKnee = {
    'pos': landmarkToPoint(results.poseWorldLandmarks[26]),
    'rot': absoluteRotation(landmarkToPoint(results.poseWorldLandmarks[26]), landmarkToPoint(results.poseWorldLandmarks[28])),
  };
  let leftKnee = {
    'pos': landmarkToPoint(results.poseWorldLandmarks[25]),
    'rot': absoluteRotation(landmarkToPoint(results.poseWorldLandmarks[25]), landmarkToPoint(results.poseWorldLandmarks[27])),
  };
  let rightHip = {
    'pos': landmarkToPoint(results.poseWorldLandmarks[24]),
    'rot': absoluteRotation(landmarkToPoint(results.poseWorldLandmarks[24]), landmarkToPoint(results.poseWorldLandmarks[26])),
  };
  let leftHip = {
    'pos': landmarkToPoint(results.poseWorldLandmarks[23]),
    'rot': absoluteRotation(landmarkToPoint(results.poseWorldLandmarks[23]), landmarkToPoint(results.poseWorldLandmarks[25])),
  };
  let neckPoint = averagePoints(landmarkToPoint(results.poseWorldLandmarks[11]), landmarkToPoint(results.poseWorldLandmarks[12]));
  let hipPoint = averagePoints(landmarkToPoint(results.poseWorldLandmarks[23]), landmarkToPoint(results.poseWorldLandmarks[24]));
  let chestPoint = averagePoints(neckPoint, hipPoint);
  let nosePoint = averagePoints(landmarkToPoint(results.poseWorldLandmarks[1]), landmarkToPoint(results.poseWorldLandmarks[4]));
  let headPoint = averagePoints(neckPoint, nosePoint);
  let torso = {
    'pos': hipPoint,
    'rot': absoluteRotation(hipPoint, neckPoint),
  };
  let chest = {
    'pos': chestPoint,
    'rot': torso['rot'],
  }
  let neck = {
    'pos': neckPoint,
    'rot': absoluteRotation(neckPoint, nosePoint),
  };
  let head = {
    'pos': headPoint,
    'rot': neck['rot'] //absoluteRotation(landmarkToPoint(results.poseWorldLandmarks[0]), headPoint),
  };

  trackedPose = {
    rightHand: rightHand,
    leftHand: leftHand,
    rightFoot: rightFoot,
    leftFoot: leftFoot,
    rightElbow: rightElbow,
    leftElbow: leftElbow,
    rightShoulder: rightShoulder,
    leftShoulder: leftShoulder,
    rightHip: rightHip,
    leftHip: leftHip,
    rightKnee: rightKnee,
    leftKnee: leftKnee,
    head: head,
    torso: torso,
    neck: neck,
    chest: chest,
    feetMidpoint: averagePoints(landmarkToPoint(results.poseWorldLandmarks[27]), landmarkToPoint(results.poseWorldLandmarks[28]))
  }

  trackedPose['feetMidpoint'][1] = Math.max(results.poseWorldLandmarks[27].y, results.poseWorldLandmarks[28].y);

  //document.getElementById('debug_info').innerHTML = JSON.stringify(trackedPose);

  drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS,
                 {color: '#00FF00', lineWidth: 4});
  drawLandmarks(canvasCtx, results.poseLandmarks,
                {color: '#FF0000', lineWidth: 2});
  canvasCtx.restore();

  grid.updateLandmarks(results.poseWorldLandmarks);
}

const pose = new Pose({locateFile: (file) => {
  return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
}});
pose.setOptions({
  modelComplexity: 1,
  smoothLandmarks: true,
  enableSegmentation: true,
  smoothSegmentation: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});
pose.onResults(onResults);

const webcam = new Camera(videoElement, {
  onFrame: async () => {
    await pose.send({image: videoElement});
  },
  width: 1280,
  height: 720
});
webcam.start();
