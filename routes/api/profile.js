const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const Profile = require("../../model/Profile");
const User = require("../../model/User");
const Post = require("../../model/Post");
const isAuth = require("../../middleware/auth");
const { check, validationResult } = require("express-validator");
// bring in normalize to give us a proper url, regardless of what user entered
const normalize = require("normalize-url");
const request = require("request");


//@ router    GET api/profile/me
// @desc     login user profile
// @access   private
router.get("/me", isAuth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id }).populate(
      "user",
      ["name", "avatar"]
    );

    if (!profile) {
      return res.status(400).json({
        msg: "There is no profile for this user",
      });
    }

    res.json(profile);
  } catch (err) {
    console.log(err.message);
    res.status(500).json("Server Error");
  }
});

//@ router    POST api/profile/
// @desc     create or update user profile
// @access   private
router.post(
  "/",
  [
    isAuth,
    [
      check("status", "status required").not().isEmpty(),
      check("skills", "skills required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // destructure the request
    const {
      website,
      skills,
      youtube,
      twitter,
      instagram,
      linkedin,
      facebook,
      // spread the rest of the fields we don't need to check
      ...rest
    } = req.body;

    // build a profile
    // build a profile
    const profileFields = {
      user: req.user.id,
      website:
        website && website !== ""
          ? normalize(website, { forceHttps: true })
          : "",
      skills: Array.isArray(skills)
        ? skills
        : skills.split(",").filter((skill) => skill.trim().length > 0),
      ...rest,
    };

    // build socila array
    const socialFields = { youtube, twitter, instagram, linkedin, facebook };

    // normalize social fields to ensure valid url
    for (const [key, value] of Object.entries(socialFields)) {
      if (value && value.length > 0)
        socialFields[key] = normalize(value, { forceHttps: true });
    }
    // add to profileFields
    profileFields.social = socialFields;

    try {
      let profile = Profile.findOne({ user: req.user.id });
      // Here  upsert=true means create if not exists or if exists update
      profile = await Profile.findOneAndUpdate(
        { user: req.user.id },
        { $set: profileFields },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      res.json(profile);
    } catch (err) {
      console.error(err);
      res.status(500).json("Server Error");
    }
  }
);

//@ router    GET api/profile/
// @desc     get all profile
// @access   public

router.get("/", async (req, res) => {
  try {
    const profile = await Profile.find().populate("user", ["name", "avatar"]);
    res.json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).json("Server Error");
  }
});

//@ router    GET api/profile/:user_id
// @desc     get  profile by User ID
// @access   Public
router.get("/user/:user_id", async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id,
    }).populate("user", ["name", "avatar"]);
    if (!profile) {
      return res
        .status(400)
        .json({ msg: "No Profile for this user", profile: null });
    }

    res.json(profile);
  } catch (err) {
    console.error(err);
    if (err.kind == "ObjectId") {
      return res
        .status(400)
        .json({ msg: "No Profile for this user", profile: "Not FOUND" });
    }
    res.status(500).json("Server Error");
  }
});

//@ router    DELETE api/profile/
// @desc     Delete profile ,  user , post
// @access   private
router.delete("/", isAuth, async (req, res) => {
  try {
    //@todo -   remove users post - remove all post where this user is present

    await Post.deleteMany({ user: req.user.id });

    // remove profile of user
    await Profile.findOneAndRemove({ user: req.user.id });

    // remove user
    await User.findOneAndRemove({ _id: req.user.id });

    res.json({ msg: "User Removed Successully" });
  } catch (err) {
    console.log(err.message);
    res.status(500).json("Server Error");
  }
});

//@ router    PUT api/profile/experience
// @desc     Add profile experience
// @access   private
router.put(
  "/experience",
  [
    auth,
    [
      check("title", "Title is required").not().isEmpty(),
      check("company", "Company is required").not().isEmpty(),
      check("from", "Form date is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, company, location, from, to, current, description } =
      req.body;

    const newexp = {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      profile.experience.unshift(newexp); // similar to push ,except it pushes to beginning
      await profile.save();
      res.json(profile);
    } catch (err) {
      console.error(err);
      res.status(500).json("Server Error ");
    }
  }
);

//@ router    Delete api/profile/experience/exp_id
// @desc     Delete profile experience
// @access   private
router.delete("/experience/:exp_id", isAuth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    const removeindex = profile.experience
      .map((item) => item.id) // change it to array then index of exp_id , and simply remove it from array
      .indexOf(req.params.exp_id);

    profile.experience.splice(removeindex, 1);
    await profile.save();
    res.json(profile);
  } catch (error) {
    res.status(500).send("Server Error");
  }
});

//@ router    PUT api/profile/education
// @desc     Add profile education
// @access   private
router.put(
  "/education",
  [
    auth,
    [
      check("school", "School name is required").not().isEmpty(),
      check("degree", "degreee name  is required").not().isEmpty(),
      check("fieldofstudy", "Field of study date is required").not().isEmpty(),
      check("from", "from Date is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { school, degree, fieldofstudy, from, to, current, description } =
      req.body;

    const newedu = {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description,
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      profile.education.unshift(newedu); // similar to push ,except it pushes to beginning
      await profile.save();
      res.json(profile);
    } catch (err) {
      console.error(err);
      res.status(500).json("Server Error ");
    }
  }
);

//@ router    Delete api/profile/education/edu_id
// @desc     Delete profile education
// @access   private
router.delete("/education/:edu_id", isAuth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    const removeindex = profile.education
      .map((item) => item.id)
      .indexOf(req.params.edu_id);

    profile.education.splice(removeindex, 1);
    await profile.save();
    res.json(profile);
  } catch (error) {
    res.status(500).send("Server Error");
  }
});

//@ router    GET api/profile/github/:username
// @desc     get users repo from github
// @access   public
router.get("/github/:username", (req, res) => {
  try {
    const options = {
      uri: `https://api.github.com/users/${req.params.username
        }/repos?per_page=5&
      sort=created:asc&client_id=${process.env.githubclient_id}
      & client_secret=${process.env.githubsecret} `,
      method: "GET",
      headers: { "user-agent": "nodejs" },
    };

    request(options, (error, response, body) => {
      if (error) console.log(error);
      if (response.statusCode != 200) {
        return res.status(404).json({ msg: "Not github profile found" });
      }
      res.json(JSON.parse(body));
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json("Server error");
  }
});
module.exports = router;