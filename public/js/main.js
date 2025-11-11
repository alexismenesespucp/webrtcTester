import WebRTC from './webRTC.js';

let webRTC = new WebRTC();

let start_connection = () => {
  
    let controller = new WebSocket("wss://qhali-care.com/webrtc/ws/");
    
    webRTC.updateUsername(document.getElementById("username").value);
 
    controller.onopen=()=>{
      controller.send(JSON.stringify({
        username : webRTC.user,
        typedata: "login" 
      }));
    };
    window.controller = controller;

  controller.onmessage = (m)=>{
    console.log(m.data)
  };
  controller.onclose = ()=>{
    console.log("closed");
  };
  webRTC.updateSocket(controller);
  webRTC.addStreamFromMadeCall(placingvideo);

}

document.getElementById("connect").onclick = start_connection;

function placingvideo(stream){
  document.getElementById("remotevideo2").srcObject=stream;
}
