const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const User = require("../../model/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");


const { check, validationResult } = require("express-validator");

// @route    GET api/auth
// @desc     Test route
// @ access  private
router.get("/", auth, async (req, res) => {
  try {
    console.log("id: ", req.user.id)
    const user = await User.findById(req.user.id).select("-password"); // this will delete password from user found
    console.log("User found ", user)
    res.status(200).json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server error ");
  }
});

//@ router  GET api/auth
// @desc   Authenticate user and get token
// @access public
router.post(
  "/",
  [
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password is required ").exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;



    try {
      let user = await User.findOne({ email });

      if (!user) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Invalid Credentials" }] });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Invalid Credentials" }] });
      }

      const payload = {
        user: {
          id: user.id,
        },
      };


      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: "10h" },
        (err, token) => {
          if (err) throw err;
          return res.status(200).json({ token });
        }
      );
    } catch (err) {
      console.error(err);
      res.status(500).send("Server Error ");
    }
  }
);

module.exports = router;
