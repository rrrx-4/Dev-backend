const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const isAuth = require("../../middleware/auth");
const Post = require("../../model/Post");
const User = require("../../model/User");
const Profile = require("../../model/Profile");

//@ router      POST api/post
// @desc        add a post
// @access      private
router.post(
  "/",
  [isAuth, [check("text", "Text required").not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select("-password");
      const newPost = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      });
      const post = await newPost.save();

      res.json(post);
    } catch (err) {
      console.error(err.message);
      res.status(500).json("Server error ");
    }
  }
);

//@ router      GET api/post
// @desc        get all  post
// @access      Private

router.get("/", isAuth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 }); // -1 means most recent one first
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json("Sever Error");
  }
});

//@ router      GET api/post/:postId
// @desc        get single  post by if
// @access      Private

router.get("/:postId", isAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }
    res.status(200).json(post);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Post not found" });
    }
    res.status(500).json("Sever Error");
  }
});

//@ router      Delete api/post/:postId
// @desc        Delete single  post by postid
// @access      Private

router.delete("/:postId", isAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    // check post user is same as auth user
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User is not authorized" });
    }
    // if user matches then remove this post
    await post.remove();
    res.json({ msg: "Post deleted " });
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Post not found" });
    }
    res.status(500).json("Sever Error");
  }
});

//---------------------------- LIKE OR remove like POST------------------------
//todo-@ later we merge like and remove like

//@ router      PUT api/post/like/:postId
// @desc        Like a post
// @access      Private

router.put("/like/:postId", isAuth, async (req, res) => {
  try {
    const postId = req.params.postId;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    // now if post found check weather this user like this post or not

    if (
      post.likes.filter((like) => like.user.toString() === req.user.id).length >
      0
    ) {
      return res.status(404).json({ msg: "Post already liked " });
    }

    post.likes.unshift({ user: req.user.id });
    await post.save();
    res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server Error ");
  }
});

// @route    PUT api/posts/unlike/:id
// @desc     Unlike a post
// @access   Private
router.put("/unlike/:id", isAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // Check if the post has not yet been liked
    if (!post.likes.some((like) => like.user.toString() === req.user.id)) {
      return res.status(400).json({ msg: "Post has not yet been liked" });
    }

    // remove the like ,return filter array which not include req.user.id
    post.likes = post.likes.filter(
      ({ user }) => user.toString() !== req.user.id
    );

    await post.save();

    return res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

//---------------------------------- COMMENT ON POST  ----------------
//@ router      POST api/post/comment/:id
// @desc        Comment on a post
// @access      private
router.post(
  "/comment/:id",
  [isAuth, [check("text", "Text required").not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select("-password");
      const post = await Post.findById(req.params.id);
      const newComment = {
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      };
      console.log(req.body.text);
      post.comments.unshift(newComment);
      await post.save();
      console.log(post.comments[0].text);
      res.json(post.comments);
    } catch (err) {
      console.error(err.message);
      res.status(500).json("Server error ");
    }
  }
);

//@ router      DELETE api/post/comment/:postId/:comment_id
// @desc        delete Comment on a post
// @access      private
router.delete("/comment/:postId/:comment_id", isAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    const post = await Post.findById(req.params.postId);

    // Pull out comment
    const comment = post.comments.find(
      (comment) => comment.id === req.params.comment_id
    );
    // Make sure comment exists
    if (!comment) {
      return res.status(404).json({ msg: "Comment does not exist" });
    }
    // Check user is same as comment user
    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized" });
    }

    post.comments = post.comments.filter(
      ({ id }) => id !== req.params.comment_id
    );

    await post.save();

    return res.json(post.comments);
  } catch (err) {
    console.error(err);
    res.status(500).json("Server error ");
  }
});

module.exports = router;
