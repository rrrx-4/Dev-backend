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
  process.env.mongoURI ,
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


// middleware
app.use(morgan("dev"));

// connect db
const PORT = process.env.PORT || 5000;

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




