const crypto = require("crypto");

function genHash(value) {    
    let hasher = crypto.createHash("sha512", 512);
    hasher.update(value);
    let hash = hasher.digest("hex");

    return hash;
}

module.exports = { genHash };