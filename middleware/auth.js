const jwt = require("jsonwebtoken");


module.exports = (req, res, next) => {
  // get token from header
  const token = req.header("x-auth-token");

  // if not token
  if (!token) {
    return res.status(401).json({ message: "No Token , authorization denied" });
  }

  // verify token

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // user to req
    req.user = decoded.user;

    next();
  } catch (err) {
    res.status(401).json({ msg: "Invalid token " });
  }
};
