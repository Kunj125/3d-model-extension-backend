module.exports = (router) => {
    router.get("/api/ping", (req, res) => {
        res.send("Pong!");
    });
}