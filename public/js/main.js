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
    process_message(m.data);
  };
  controller.onclose = ()=>{
    console.log("closed");
  };
  webRTC.updateSocket(controller);
  webRTC.addStreamFromMadeCall(placingvideo);
}

let login = (data)=>{
    if (data.result === "ok") {
        webRTC.socket.send(JSON.stringify({
            typedata: "join",
            username: webRTC.user,
          }));
        startStreaming();
    } else {
        console.log(data.result);
      }
}

let make_call = () => {
  webRTC.make_call({destination:document.getElementById("destination").value});
}

document.getElementById("call").onclick = make_call;

let messageAction = {
    login: (data) => login(data),
    answer_call : (data) => webRTC.answer_call(data),
    offer_call:(data)=>webRTC.receive_call(data),
    icecandidate_request : (data) => webRTC.ice_candidate(data),
    join : (data) => addPreviousConnections(data),
    new_user : (data) => addConnectionOptions(data),
    disconnected_user : (data) => removeConnectionOptions(data)
}


function process_message(data,signaling) {
    let received_data = safelyParseJSON(data);
    if (received_data !== "") {
        if(received_data.typedata in messageAction)
            messageAction[received_data.typedata](received_data,signaling);
        else
            console.log(received_data);
    }
    else{
      console.log(data);
    }
}

function addPreviousConnections(data){
console.log(data);
}

function addConnectionOptions(data) {
  console.log(data);
}

function removeConnectionOptions(data){
  console.log(data);
}




document.getElementById("connect").onclick = start_connection;

function placingvideo(stream){
  document.getElementById("receivedVideo").srcObject=stream;
}

let startStreaming = ()=>{//音声を取得
    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    .then(function(stream) {
      webRTC.addLocalStream(stream);
      document.getElementById("localvideo").srcObject = stream;
    })
    .catch(function(err) {
        console.log(err);
    });
}

function safelyParseJSON(json) {
    let parsed = "";
  
    try {
      parsed = JSON.parse(json);
    } catch (e) {
      console.log("there is an error on JSON");
    }
  
    return parsed;
}
