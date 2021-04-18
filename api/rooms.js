const fs = require("fs");
const { genHash } = require("../libs/hashing");
const Database = require("@replit/database")
const db = new Database();

module.exports = (router) => {
    router.post("/api/createroom", async (req, res) => {
        if(!(req.body.name && req.body.pass && req.body.model)) return res.status(400).send("Bad Request!"); // Validating request body
        if(await db.get("room_" + req.body.name)) return res.status(406).send("Room with name already exists!"); // Checking if room already exists
        if(!fs.existsSync("./static/models/" + req.body.model)) return res.status(404).send("Couldn't find model!"); // Checking if model exists

        let room = {
            pass: genHash(req.body.pass),
            model: req.body.model,
            ts: Date.now()
        };

        await db.set("room_" + req.body.name, room);
        setTimeout(() => { db.delete("room_" + req.body.name) }, 7200000);

        return res.status(201).send(room);
    });

    router.post("/api/joinroom", async (req, res) => {
        if(!(req.body.name && req.body.pass)) return res.send(400).status("Bad Request!"); // Validating request body

        let room = await db.get("room_" + req.body.name);
        if(!room) return res.status(404).send("Room not found!"); // Checking if room exists

        if(room.pass === genHash(req.body.pass)) {
            return res.status(200).send(room);
        } else {
            return res.status(401).send("Invalid Password!");
        }
    });
}