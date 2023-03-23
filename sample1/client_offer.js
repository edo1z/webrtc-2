const configuration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};
const pc = new RTCPeerConnection(configuration);

const startButton = document.getElementById("startButton");
const candidates = [];

pc.onicecandidate = async ({ candidate }) => {
  if (candidate) {
    await fetch("/message/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "iceCandidate", candidate }),
    });
  }
};

startButton.addEventListener("click", async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  stream.getTracks().forEach((track) => pc.addTrack(track, stream));
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  await fetch("/message/answer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "offer", sdp: offer.sdp }),
  });
});

async function pollMessages() {
  try {
    const response = await fetch("/message/offer");
    const msg = await response.json();
    if (msg.type) {
      if (msg.type === "answer") {
        console.log("got answer", msg);
        await pc.setRemoteDescription(new RTCSessionDescription(msg));
      } else if (msg.type === "iceCandidate") {
        candidates.push(msg.candidate);
      }
    }
  } catch (error) {
    if (!(error instanceof SyntaxError)) {
      throw error;
    }
  }
  setTimeout(pollMessages, 1000);
}

async function addIceCandidate() {
  if (candidates.length > 0 && pc.remoteDescription) {
    const candidate = candidates.shift();
    console.log("adding ice candidate", candidate);
    await pc.addIceCandidate(new RTCIceCandidate(candidate));
  }
  setTimeout(pollMessages, 1000);
}

addIceCandidate();
pollMessages();
