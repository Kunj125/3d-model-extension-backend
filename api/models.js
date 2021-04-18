const fs = require("fs");

module.exports = (router) => {
    router.get("/api/models", (req, res) => {
        let modelDirs = fs.readdirSync("./static/models");
        let data = [];
        
        for(let modelDir of modelDirs) {
            let info = require(`../static/models/${modelDir}/info.json`);
            data.push([modelDir, info]);
        }

        res.send(data);
    });
}