const http=require("http");
const app = require("express")();
app.get('/',(req,res)=>{
    res.sendFile(__dirname+"/index.html")
})
app.listen(9091,()=>console.log("Listening on http port 9091"))


const webSocketServer = require("websocket").server

const httpServer = http.createServer();
httpServer.listen(9090,()=>console.log("Listening ... on 9090 "))
const clients = {}
const games = {}
const wsServer = new webSocketServer({
    "httpServer" : httpServer
})
wsServer.on("request", request =>{
    //connect
    const connection = request.accept(null,request.origin)
    connection.on("open",()=>console.log("opened!"))
    connection.on("close",()=>console.log("closed!"))
    connection.on("message",message=>{
        const result =  JSON.parse(message.utf8Data)
        if(result.method === "create")
        {
           const clientId = result.clientId;
           const gameId = guid();
           games[gameId]={
               "id":gameId,
               "balls":100, 
               "clients":[],
               "state":{}
           }
           const payLoad = {
               "method":"create",
               "game": games[gameId]
           }
          const con = clients[clientId].connection;
          con.send(JSON.stringify(payLoad))
        }
        if(result.method === "join")
        {
            const clientId = result.clientId;
            const gameId = result.gameId;
            const game= games[gameId];
            if(game.clients.length >=3)
            {
                //sorry max players reach
                return;
            }
            const color ={"0":"Red","1":"Green","2":"Blue"}[game.clients.length] 
            game.clients.push({
                "clientId":clientId,
                "color":color
            })
            if(game.clients.length === 3) updateGameState()
            const payLoad = {
                "method": "join",
                "game": game
            }

            game.clients.forEach(c => {
                clients[c.clientId].connection.send(JSON.stringify(payLoad))     
            });
        }
        if(result.method === "play")
        {
            const gameId = result.gameId;
            const ballId= result.ballId;
            const color = result.color
            let state = games[gameId].state;
            state[ballId] = color;
            games[gameId].state = state
        }
    })
    //generate a new clientId
    const clientId = guid();
    clients[clientId]= {
        "connection" : connection
    }
    const payLoad = {
        "method": "connect",
        "clientId": clientId
    }
    //send back the client connect
    connection.send(JSON.stringify(payLoad))
})
const guid = ()=> {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
  }
function updateGameState() {
    for (const g of Object.keys(games)) {
        const game = games[g]
        const payLoad = {
            "method": "update",
            "game": game
        }
        games[g].clients.forEach(c=>{
            clients[c.clientId].connection.send(JSON.stringify(payLoad))
        })
        setTimeout(updateGameState, 500);
    }
}