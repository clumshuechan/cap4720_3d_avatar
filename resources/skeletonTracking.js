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

function getAverageForPoseParts(poseParts) {
  let avgPosePart = {
    pos: [0, 0, 0],
    rot: {
      fromVector: poseParts[0].rot.fromVector,
      toVector: [0, 0, 0]
    }
  };

  for (let i = 0; i < poseParts.length; ++i) {
    avgPosePart.pos[0] += poseParts[i].pos[0] / poseParts.length;
    avgPosePart.pos[1] += poseParts[i].pos[1] / poseParts.length;
    avgPosePart.pos[2] += poseParts[i].pos[2] / poseParts.length;

    avgPosePart.rot.toVector[0] += poseParts[i].rot.toVector[0] / poseParts.length;
    avgPosePart.rot.toVector[1] += poseParts[i].rot.toVector[1] / poseParts.length;
    avgPosePart.rot.toVector[2] += poseParts[i].rot.toVector[2] / poseParts.length;
  }

  return avgPosePart;
}

let trackedPoseQueue = [];

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
  canvasCtx.drawImage(
      results.image, 0, 0, canvasElement.width, canvasElement.height);

  canvasCtx.globalCompositeOperation = 'source-over';

  // calculate joints

  // left arm
  let leftBicepVector = calcVector(landmarkToPoint(results.poseWorldLandmarks[11]), landmarkToPoint(results.poseWorldLandmarks[13]));
  let leftForearmVector = calcVector(landmarkToPoint(results.poseWorldLandmarks[13]), landmarkToPoint(results.poseWorldLandmarks[15]));
  let leftHandVector = calcVector(landmarkToPoint(results.poseWorldLandmarks[15]), landmarkToPoint(results.poseWorldLandmarks[19]));

  let leftBicep = {
      pos: landmarkToPoint(results.poseWorldLandmarks[11]),
      rot: { fromVector: [0, 1, 0], toVector: leftBicepVector }
  };

  let leftForearm = {
      pos: landmarkToPoint(results.poseWorldLandmarks[13]),
      rot: { fromVector: leftBicepVector, toVector: leftForearmVector }
  };

  let leftHand = {
      pos: landmarkToPoint(results.poseWorldLandmarks[15]),
      rot: { fromVector: leftForearmVector, toVector: leftHandVector }
  };

  // right arm
  let rightBicepVector = calcVector(landmarkToPoint(results.poseWorldLandmarks[12]), landmarkToPoint(results.poseWorldLandmarks[14]));
  let rightForearmVector = calcVector(landmarkToPoint(results.poseWorldLandmarks[14]), landmarkToPoint(results.poseWorldLandmarks[16]));
  let rightHandVector = calcVector(landmarkToPoint(results.poseWorldLandmarks[16]), landmarkToPoint(results.poseWorldLandmarks[20]));

  let rightBicep = {
      pos: landmarkToPoint(results.poseWorldLandmarks[12]),
      rot: { fromVector: [0, 1, 0], toVector: rightBicepVector }
  };

  let rightForearm = {
      pos: landmarkToPoint(results.poseWorldLandmarks[14]),
      rot: { fromVector: rightBicepVector, toVector: rightForearmVector }
  };

  let rightHand = {
      pos: landmarkToPoint(results.poseWorldLandmarks[16]),
      rot: { fromVector: rightForearmVector, toVector: rightHandVector }
  };

  // left leg
  let leftThighVector = calcVector(landmarkToPoint(results.poseWorldLandmarks[23]), landmarkToPoint(results.poseWorldLandmarks[25]));
  let leftCalfVector = calcVector(landmarkToPoint(results.poseWorldLandmarks[25]), landmarkToPoint(results.poseWorldLandmarks[27]));
  let leftFootVector = calcVector(landmarkToPoint(results.poseWorldLandmarks[27]), landmarkToPoint(results.poseWorldLandmarks[31]));

  let leftThigh = {
      pos: landmarkToPoint(results.poseWorldLandmarks[23]),
      rot: { fromVector: [0, 1, 0], toVector: leftThighVector }
  };

  let leftCalf = {
      pos: landmarkToPoint(results.poseWorldLandmarks[25]),
      rot: { fromVector: leftThighVector, toVector: leftCalfVector }
  };

  let leftFoot = {
      pos: landmarkToPoint(results.poseWorldLandmarks[27]),
      rot: { fromVector: leftCalfVector, toVector: leftFootVector }
  };

  // right leg
  let rightThighVector = calcVector(landmarkToPoint(results.poseWorldLandmarks[24]), landmarkToPoint(results.poseWorldLandmarks[26]));
  let rightCalfVector = calcVector(landmarkToPoint(results.poseWorldLandmarks[26]), landmarkToPoint(results.poseWorldLandmarks[28]));
  let rightFootVector = calcVector(landmarkToPoint(results.poseWorldLandmarks[28]), landmarkToPoint(results.poseWorldLandmarks[32]));

  let rightThigh = {
      pos: landmarkToPoint(results.poseWorldLandmarks[24]),
      rot: { fromVector: [0, 1, 0], toVector: rightThighVector }
  };

  let rightCalf = {
      pos: landmarkToPoint(results.poseWorldLandmarks[26]),
      rot: { fromVector: rightThighVector, toVector: rightCalfVector }
  };

  let rightFoot = {
      pos: landmarkToPoint(results.poseWorldLandmarks[28]),
      rot: { fromVector: rightCalfVector, toVector: rightFootVector }
  };

  // neck
  let neckPoint = averagePoints(landmarkToPoint(results.poseWorldLandmarks[11]), landmarkToPoint(results.poseWorldLandmarks[12]));
  let neckVector = calcVector(neckPoint, landmarkToPoint(results.poseWorldLandmarks[0]));
  let neck = {
      pos: neckPoint,
      rot: { fromVector: [0, 1, 0], toVector: neckVector }
  };

  // chest
  let bodyVector = calcVector([0, 0, 0], [neckPoint[0], neckPoint[1], -neckPoint[2]]);
  let body = {
    pos: [0, 0, 0],
    rot: { fromVector: [0, 1, 0], toVector: bodyVector }
  };

  // reference point
  let feetMidpoint = averagePoints(landmarkToPoint(results.poseWorldLandmarks[27]), landmarkToPoint(results.poseWorldLandmarks[28]));

  // package joint data to be sent to renderer
  let singleTrackedPose = {
    leftBicep: leftBicep,
    leftForearm: leftForearm,
    leftHand: leftHand,
    rightBicep: rightBicep,
    rightForearm: rightForearm,
    rightHand: rightHand,
    leftThigh: leftThigh,
    leftCalf: leftCalf,
    leftFoot: leftFoot,
    rightThigh: rightThigh,
    rightCalf: rightCalf,
    rightFoot: rightFoot,
    neck: neck,
    body: body
  };

  if (trackedPoseQueue.length == 5) {
    trackedPoseQueue.shift();
  }

  trackedPoseQueue.push(singleTrackedPose);

  if (trackedPoseQueue.length == 5) {
    let denoisedTrackedPose = {
      feetMidpoint: feetMidpoint
    };

    for (const part in singleTrackedPose) {
      let poseParts = []
      for (let i = 0; i < trackedPoseQueue.length; ++i) {
        poseParts.push(trackedPoseQueue[i][part]);
      }

      let avgPosePart = getAverageForPoseParts(poseParts);
      denoisedTrackedPose[part] = avgPosePart;
    }

    trackedPose = denoisedTrackedPose;
  }

  // document.getElementById('debug_info').innerHTML = `Left Bicep Rotation: ${leftBicep.rot[0].toFixed(2)} ${leftBicep.rot[1].toFixed(2)} ${leftBicep.rot[2].toFixed(2)}`;

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
