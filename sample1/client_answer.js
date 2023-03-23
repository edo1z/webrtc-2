const audio = document.getElementById("remoteAudio");
const playButton = document.getElementById("playButton");
playButton.addEventListener("click", () => {
  audio.play();
});

const pc = new RTCPeerConnection({
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
});
const candidates = [];

pc.ontrack = (event) => {
  console.log("ontrack", event);
  if (event.streams && event.streams[0]) {
    console.log("got stream!!!", event.streams[0]);
    audio.srcObject = event.streams[0];
    // audio.play();
  }
};

pc.onicecandidate = async (event) => {
  if (event.candidate) {
    const res = await fetch("/message/offer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "iceCandidate",
        candidate: event.candidate,
      }),
    });
  }
};

async function pollMessages() {
  try {
    const res = await fetch("/message/answer");
    const msg = await res.json();
    if (msg.type) {
      if (msg.type === "offer") {
        console.log("got offer", msg);
        await pc.setRemoteDescription(new RTCSessionDescription(msg));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        const res = await fetch("/message/offer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "answer", sdp: answer.sdp }),
        });
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
