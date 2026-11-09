module.exports = (req, res, next) => { 
  if (req.method !== "GET" && req.headers["x-fail"] === "true") { 
    return res.status(500).json({ error: "Forced failure" }); 
  } 
  next(); 
}; 
