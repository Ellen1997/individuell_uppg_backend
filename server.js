require('dotenv').config()
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const writerRoute = require("./routes/writerRoute.js")
const commentRoute = require("./routes/commentRoute.js")
const postRoute = require("./routes/postRoute.js")

const app = express();
const PORT = 3000;

app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));


mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log("Ansluten till MongoDB (Altlas?)")
    app.listen(PORT, () => {
        console.log("Servern körs på localhost:3000")
    })
})
.catch((error) => 
console.error("MongoDB anslutnings error:", error)
)

app.use("/api/writers", writerRoute);
app.use("/api/comments", commentRoute);
app.use("/api/posts", postRoute);

app.use((req, res, next) => {
    res.status(404).sendFile(path.join(__dirname, "404.html"));
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        message: err.message || "Ett serverfel inträffade! Försök igen senare." });
});



module.exports = app;