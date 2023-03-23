const signalingServer = new WebSocket("ws://localhost:3001");
const configuration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};
const rtcPeerConnections = {};
let stream = null;

signalingServer.onmessage = (message) => {
  console.log("Received message:", message.data);
  const msgData = JSON.parse(message.data);
  const peerID = msgData.peerID;

  if (!rtcPeerConnections[peerID] && stream) {
    rtcPeerConnections[peerID] = new RTCPeerConnection(configuration);
    rtcPeerConnections[peerID].onicecandidate = (event) => {
      if (event.candidate) {
        signalingServer.send(
          JSON.stringify({
            type: "iceCandidate",
            candidate: event.candidate,
            peerID: peerID,
          })
        );
      }
    };
    rtcPeerConnections[peerID].ontrack = (event) => {
      console.log("Received remote stream from", peerID);
    };
    rtcPeerConnections[peerID].addTrack(stream.getTracks()[0], stream);
  }

  if (msgData.type === "offer") {
    rtcPeerConnections[peerID]
      .setRemoteDescription(new RTCSessionDescription(msgData.sdp))
      .then(() => rtcPeerConnections[peerID].createAnswer())
      .then((answer) => {
        rtcPeerConnections[peerID].setLocalDescription(answer);
        return answer;
      })
      .then((answer) => {
        signalingServer.send(
          JSON.stringify({ type: "answer", sdp: answer, peerID: peerID })
        );
      })
      .catch((error) => console.error("Error handling offer:", error));
  } else if (msgData.type === "answer") {
    rtcPeerConnections[peerID]
      .setRemoteDescription(new RTCSessionDescription(msgData.sdp))
      .catch((error) => console.error("Error handling answer:", error));
  } else if (msgData.type === "iceCandidate") {
    rtcPeerConnections[peerID]
      .addIceCandidate(new RTCIceCandidate(msgData.candidate))
      .catch((error) => console.error("Error handling ICE candidate:", error));
  }
};

signalingServer.onopen = () => {
  console.log("Connected to signaling server");
  signalingServer.send(JSON.stringify({ type: "join" }));

  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then((_stream) => {
      console.log("getUserMedia!");
      strema = _stream;
    })
    .catch((error) => console.error("Error getting user media:", error));
};
