if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const morgan = require("morgan");
const cors = require('cors')
const mongoose = require('mongoose')


app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "DELETE", "UPDATE", "PUT", "PATCH"],
    allowedHeaders: "*",
    credentials: true,
  })
);




mongoose.connect(
  "mongodb+srv://krahul:One2345678@9@cluster0.agghb.mongodb.net/myFirstDatabase?retryWrites=true&w=majority",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  },
  () => {
    console.log("Connected to mongoDB...");
  }
);

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});
// middleware
app.use(morgan("dev"));

// connect db
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));


app.use(express.json({ extended: false })); // to get body data similar to body parser

// define routes
const userRoutes = require("./routes/api/users")
const authRoutes = require("./routes/api/auth")
const profileRoutes = require("./routes/api/profile")
const postRoutes = require("./routes/api/post")
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/post", postRoutes);




