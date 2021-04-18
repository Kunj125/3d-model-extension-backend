const Database = require("@replit/database")
const db = new Database()
const WebSocket = require("ws");
const { decode, encode } = require("msgpack-lite");
const { genHash } = require("./libs/hashing");

global.wsClients = {};

// Delete expired rooms
setInterval(async () => {
    let keys = await db.list();
    keys.forEach(async k => {
        let room = await db.get(k);
        if((Date.now() - room.ts) > 7200000) {
            if(global.wsClients[room.name]) global.wsClients[room.name].clients.forEach(ws => ws.terminate());
            db.delete(k);
        }
    })
}, 300000);

module.exports = (server) => {
    const wss = new WebSocket.Server({ server });
    
    wss.on("connection", (ws, req) => {
        ws.send(JSON.stringify(["auth"]));        
        ws.on("message",  async data => {
            let message = JSON.parse(data);

            // Auth Handler
            if(message[0] == "auth") {
                // Close with 1007 if data structure is invalid
                if(message.length != 4 && ((message[1] == "host") || (message[1] == "clnt"))) return ws.close(1007);
                
                // Close with 1007 if room does not exist
                let name = message[2];
                let room = await db.get("room_" + name);
                if(!room) return ws.close(1007);

                // Host authentication
                if(message[1] == "host") {
                    if(room.hostKey !== message[3]) return ws.close(1007);
                    global.wsClients[name] = { hostKey: room.hostKey, clients: [] };
                    return ws.send(JSON.stringify(["authR"]));
                }

                // Client authentication
                else if (message[1] == "clnt") {
                    if(!global.wsClients[name]) return ws.close(1007);
                    if(room.pass !== genHash(message[3])) return ws.close(1007);
                    global.wsClients[name].clients.push(ws);
                    return ws.send(JSON.stringify(["authR"]));
                }

                // Invalid connection type
                else return ws.close(1007);
            }

            // Host broadcast Handler
            if(message[0] == "a") {
                // Close with 1007 if data structure is invalid
                if(message.length != 10) return ws.close(1007);
                
                // Close with 1007 if room does not exist
                let name = message[1];
                let room = global.wsClients[name];
                if(!room) return ws.close(1007);

                // Close with 1007 if hostKey doesn't match
                if(message[2] !== room.hostKey) return ws.close(1007);

                // Close with 1007 if position data is not in numbers
                let posData = message.slice(3);
                // if(!posData.every(a => (typeof a) == "number")) return ws.close(1007);

                // Broadcast position data to all clients
                return room.clients.forEach(ws => ws.send(JSON.stringify(["a", ...posData])));
            }
        });
    });
}