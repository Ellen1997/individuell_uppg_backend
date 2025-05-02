const jwt = require("jsonwebtoken");

const authToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Ej autentiserad. Du måste logga in." });
  }

  jwt.verify(token, process.env.JWT_SECRET || "123", (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Förbjuden åtkomst. Ogiltig token." });
    }
    console.log("Decoded Writer:", decoded);
    
    req.writer = decoded;
    next();
  });
};  

module.exports = { authToken };