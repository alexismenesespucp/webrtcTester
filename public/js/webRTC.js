window.RTCPeerConnection = window.RTCPeerConnection ||
window.webkitRTCPeerConnection ||
window.mozRTCPeerConnection ||
						window.msRTCPeerConnection;

//Define RTC Ice Candidate
window.RTCIceCandidate = window.RTCIceCandidate ||
window.webkitRTCIceCandidate ||
window.mozRTCIceCandidate ||
					  window.msRTCIceCandidate;

//Define RTC Sessio	n Description
window.RTCSessionDescription =  window.RTCSessionDescription ||
	 window.webkitRTCSessionDescription ||
	 window.mozRTCSessionDescription ||
									 window.msRTCSessionDescription;

export default class WebRTC{
	constructor(){
		this.socket = "";
		this.user = "default";
		this.conections_rtc = {};
		this.channels_rtc = {};
		this.remote_streams = {};
		this.processdatachannel = (data,channel,webrtc) => console.log(data);
		this.local_stream=[];
		this.addstreamfrommadecall = stream => console.log(stream);
		this.addstreamfromreceivedcall = stream => console.log(stream);
		this.media_configuration = { video: true, audio: true };
		this.updateonopencaller = (data,webrtc) => console.log(data);
		this.updateonopenreceiver = (data,webrtc) => console.log(data);

	}

	updateSocket = socket => this.socket = socket;

	updateUsername = user => this.user = user;
	updateRoom = room => this.room = room;
	updatePasswd = passwd => this.passwd = passwd;

	addLocalStream = stream => this.local_stream.push(stream);

	updateProcessDataChannel = callback => this.processdatachannel = callback;

	addStreamFromMadeCall = callback => this.addstreamfrommadecall = callback;
	addStreamFromReceivedCall = callback => this.addstreamfromreceivedcall = callback;

	updateOnOpenCaller = callback => this.updateonopencaller = callback;
	updateOnOpenReceiver = callback => this.updateonopenreceiver = callback;

	disconnectUser = (user) => {
		this.conections_rtc[user].close();
		delete this.conections_rtc[user];
		delete this.channels_rtc[user];
		delete this.remote_streams[user];
	}

	make_call = (data,num=0,processDataChannel=console.log) => {
		let webrtc = this;
		let rtc_configuration = {
			iceServers: [{ 
					urls: 'turn:qhali-care.com:3478',
					username: 'webrtc',
      				credential: 'verysecret'
			}],
		};
		let RTCSender = new window.RTCPeerConnection(rtc_configuration);
		webrtc.conections_rtc[data.destination] = RTCSender;
		RTCSender.onicecandidate = function (evt) {
			if (!evt.candidate) return;
			webrtc.onIceCandidate(evt,{user:data.destination});
		};
		RTCSender.onaddstream =  (evt) => { 
			webrtc.remote_streams[data.destination] = evt.stream;
			webrtc.addstreamfrommadecall(evt.stream,data.place)
		};
		let channel = RTCSender.createDataChannel("RobotInstrucctions");
		//processDataChannel(data,channel,webrtc);
		
		webrtc.channels_rtc[data.destination] = channel;
		channel.onopen =  () => {
			webrtc.updateonopencaller(channel,webrtc);
		};		
		channel.onclose = function () {
			console.log(data.destination);
			console.log("Closing caller ...");
		};				  	
		
		channel.onmessage = (event)=>{
			webrtc.processdatachannel(event.data,channel,webrtc);
		}
		
		RTCSender.addStream(webrtc.local_stream[num]);//streamに追加
		RTCSender.createOffer().then( (desc) =>{
			RTCSender.setLocalDescription(new RTCSessionDescription(desc)).then(()=>{
			let offer_information = {
				typedata : "offer_call",
				user : webrtc.user, //username
				sdp : desc,
				destiny : data.destination,
			};   
			webrtc.socket.send(JSON.stringify(offer_information));
			});
		}).catch(function (err) {
			console.log("An error occurred! " + err);
		})


	}

	answer_call = (data) =>{
		this.conections_rtc[data.user].setRemoteDescription(
			new RTCSessionDescription(data.sdp)
		);
	}

	receive_call = (data,num=0,processDataChannel= console.log) => {
		let webrtc = this;
		
		let rtc_configuration = {
			iceServers: [{ 
					urls: 'turn:qhali-care.com:3478',
					username: 'webrtc',
      				credential: 'verysecret'
			}],
		};
		let RTCReceiver= new window.RTCPeerConnection(rtc_configuration);
		webrtc.conections_rtc[data.user]= RTCReceiver;

		//RTCReceiver.ondatachannel = (event)=> processDataChannel(event);
		RTCReceiver.ondatachannel = (event) =>{
			webrtc.channels_rtc[data.user] = event.channel;
			webrtc.channels_rtc[data.user].onmessage = (event) =>{
				webrtc.processdatachannel(event.data,webrtc.channels_rtc[data.user],webrtc);
			}
			webrtc.channels_rtc[data.user].onopen = () => {
				webrtc.updateonopenreceiver(webrtc.channels_rtc[data.user],webrtc);
			};				
		    webrtc.channels_rtc[data.user].onclose =  ()=> {
				console.log(data.user);
				console.log("Closing receiver ...");
			 };				
			
		}
		
		RTCReceiver.onicecandidate = (evt) => {
			if (!evt.candidate) return;
			this.onIceCandidate(evt,data);
		};
	  
		RTCReceiver.onaddstream = (evt) => {
			webrtc.remote_streams[data.user] = evt.stream;
			webrtc.addstreamfromreceivedcall(evt.stream,data.place)
		};
		
		RTCReceiver.setRemoteDescription(new RTCSessionDescription(data.sdp))
		.then( ()=> {
				RTCReceiver.addStream(webrtc.local_stream[num]);
				console.log("sending stream:",webrtc.local_stream[num]);		
				RTCReceiver.createAnswer()
				.then(function (sdp) {
					RTCReceiver.setLocalDescription(
						new RTCSessionDescription(sdp)
					)
					.then(() => {
						let answer_information = {
							typedata: "answer_call",
							user : webrtc.user,
							sdp : sdp,
							destiny : data.user,
						};				
						webrtc.socket.send(JSON.stringify(answer_information));
					});
				});	
			})
			.catch(function (err) {
				console.log("An error occurred! " + err);
			});

	}

	onIceCandidate = (evt,data) => {
		if (evt.candidate) {
		  let candidate_information = {
			typedata : "icecandidate_request",
			user : this.user,
			icecandidate : evt.candidate,
			destiny : data.user,
		  };
		  this.socket.send(JSON.stringify(candidate_information));
		}
	}

	ice_candidate = (data) => {
		if(this.conections_rtc[data.user])
		this.conections_rtc[data.user].addIceCandidate(
			new RTCIceCandidate(data.icecandidate)
		);
	}
}