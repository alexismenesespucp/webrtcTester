const express = require("express");
const wss = require("ws");
const app = express();

const wsServer = new wss.Server({ noServer: true });
let ws_clients = {};

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept,Authorization, access_token"
  );
  next();
});

app.post("/action", (req, res) => {
  wsServer.clients.forEach(function each(client) {
    client.send(JSON.stringify(req.body));
  });
  res.send("Correctly Received");
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(express.static("public", { dotfiles: "allow" }));

wsServer.on("connection", (ws) => {
  ws.on("message", function incoming(data) {
    let received_data = "";
    
    received_data = safelyParseJSON(data);
    //console.log(received_data);
    if (received_data !== "") {
      try {
        process_message(this, received_data);
      } catch (e) {
        console.log("Error Processing the message", e);
      }
    }
  });
  //End of Message
  ws.on("close", (code, reason) => {
    switch (reason) {
      case "Duplicated ID":
      case "Room doesn't exist":
      case "Room Password incorrect":
        console.log("The user could not connect");
        break;
      default:
        delete ws_clients[ws.username];
          for (let name of ws_clients) {
            if (
              ws_clients[name] !== ws &&
              ws_clients[name].readyState === wss.OPEN
            )
              ws_clients[name].send(
                JSON.stringify({
                  typedata: "disconnectUser",
                  user: ws.username,
                })
              );
          }
        
        console.log(
          "The user " + ws.username + " from room " + ws.room + " disconnected."
        );
        break;
    }
  });
});

const server = app.listen(10080);

server.on("upgrade", (request, socket, head) => {
    wsServer.handleUpgrade(request, socket, head, (socket) => {
      wsServer.emit("connection", socket, request);
    });
  });
  
  function safelyParseJSON(json) {
    let parsed = "";
  
    try {
      parsed = JSON.parse(json);
    } catch (e) {
      console.log("there is an error on JSON");
    }
  
    return parsed;
  }
  
  async function process_message(ws, data) {
    let server_response = {};
    //console.log(data.typedata);
    switch (data.typedata) {
      case "login":
        login_check(ws, data);
        break;
      case "join":
        server_response = {};
        server_response.typedata = data.typedata;
        server_response.result = "ok";
        server_response.users = [];
            for (let name of ws_clients) {
              if (
                ws_clients[name] !== ws &&
                ws_clients[name].readyState === wss.OPEN
              ) {
                server_response.users.push(name);
              }
            }
          
        
        ws.send(JSON.stringify(server_response));
        break;
      case "webrtc":
            if (
              ws_clients[data.destiny] !== ws &&
              ws_clients[data.destiny].readyState === wss.OPEN
            ) {
              ws_clients[data.destiny].send(JSON.stringify(data));
            }
          
        break;
  
      case "action_take":
              if (
                ws_clients[data.destiny] !== ws &&
                ws_clients[data.destiny].readyState === wss.OPEN
              ) {
                ws_clients[data.destiny].send(JSON.stringify(data));
              }
            

      break;
      
      default:
              if (
                ws_clients[data.destiny] !== ws &&
                ws_clients[data.destiny].readyState === wss.OPEN
              ) {
                ws_clients[data.destiny].send(JSON.stringify(data));
              }

      break;
    }
  }
  
  function login_check(ws, data) {
    let server_response = {};
    server_response.typedata = data.typedata;
  
    if (data.username in ws_clients) {
      server_response.result =
        "Your username was taken by someone else, please, chose another one.";
      ws.send(JSON.stringify(server_response));
      ws.close(1000, "Duplicated ID");
      return 0;
    }
    
    server_response.result = "ok";
    ws_clients[data.username] = ws;
    ws.username = data.username;
    ws.typeuser = data.typeuser;
    console.log("the user :" + data.username  + " is connected to the room : " + data.room);

      ws.send(JSON.stringify(server_response));
    
    //console.log(ws_clients);

  }
  
  Array.prototype.remove = function () {
    var what,
      a = arguments,
      L = a.length,
      ax;
    while (L && this.length) {
      what = a[--L];
      while ((ax = this.indexOf(what)) !== -1) {
        this.splice(ax, 1);
      }
    }
    return this;
  };
