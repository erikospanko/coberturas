const config = require("../config.json");
const path = require("path");
const express = require("express");
const router = express.Router();

//////////////////routes//////////////////////////////////////

router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/index.html"));
});

// active/:token_register
router.get("/active/:token_register", (req, res) => {
  // console.log("entro: /active/:token_register ");
  // console.log(`tu token es: ${req.params.token_register}`);
});

module.exports = router;
