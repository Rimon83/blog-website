import "dotenv/config";
import express from "express";
import ejs from "ejs";
//import the required packages in order to store data in DB
import mongoose from "mongoose";
import session from "express-session";
import passport from "passport";
import passportLocalMongoose from "passport-local-mongoose";

import dateFormat from "../modules/date.js";
const app = (module.exports = express());

// connect to database
const url = `mongodb+srv://${process.env.USER_NAME}:${process.env.PASSWORD}@cluster0.0upwaqt.mongodb.net/blogDB`;
try {
  await mongoose.connect(url);
  console.log("connected successfully to server");
} catch (err) {
  console.log("the connection is failed");
}
// try {
//   mongoose.connect("mongodb://127.0.0.1:27017/blogDB");
//   console.log("connected successfully to server");
// } catch (err) {
//   console.log("the connection is failed");
// }
const blogSchema = new mongoose.Schema({
  fullname: String,
  title: String,
  content: String,
  date: String,
});

//create user schema
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  fullname: String,
});

//plug in the schema
userSchema.plugin(passportLocalMongoose);

// create the collection
const User = mongoose.model("User", userSchema);
const Blog = mongoose.model("Blog", blogSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(express.urlencoded({ extended: false }));
app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(express.static("public"));
app.set("view engine", "ejs");

app.use(passport.initialize());
app.use(passport.session());

let date = new Date().getFullYear();

app.get("/", function (req, res) {
  res.render("home", { date: date });
});

app.get("/signin", function (req, res) {
  res.render("signin", { date: date });
});
app.get("/signup", function (req, res) {
  res.render("signup", { date: date });
});
app.get("/new", async function (req, res) {
  if (req.isAuthenticated()) {
    const id = req.user.id;
    const name = await User.find({ _id: id }, { fullname: 1 });
    res.render("newBlog", {
      date: date,
      name: name[0].fullname,
      heading: "Create New Post",
      button: "Create post",
    });
  }
});

app.get("/blogs", async function (req, res) {
  if (req.isAuthenticated()) {
    const id = req.user.id;
    const name = await User.find({ _id: id }, { fullname: 1 });
    const findBlogAll = await Blog.find({});

    res.render("blogs", {
      date: date,
      name: name[0].fullname,
      blogs: findBlogAll,
    });
  }
});

app.post("/signup", function (req, res) {
  const username = req.body.username;
  const password = req.body.password;
  const fullname = req.body.fullname;
  User.register(
    { username: username, fullname: fullname },
    password,
    function (err, user) {
      if (err) {
        console.log(err);
        res.redirect("/signup");
      } else {
        passport.authenticate("local")(req, res, async function () {
          res.redirect("/blogs");
        });
      }
    }
  );
});

app.post("/signin", function (req, res) {
  const username = req.body.username;
  const password = req.body.password;
  const user = new User({
    username: username,
    password: password,
  });
  req.login(user, function (err) {
    if (err) {
      console.log(err);
      res.redirect("/signin")
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/blogs");
      });
    }
  });
});

app.post("/new", async function (req, res) {
  const id = req.user.id;
  const name = await User.find({ _id: id }, { fullname: 1 });
  const fullname = name[0].fullname;
  const post = req.body.post;
  const title = req.body.title;
  let postDate = dateFormat.getDate();

  const blog = new Blog({
    fullname: fullname,
    title: title,
    content: post,
    date: postDate,
  });
  blog.save().then(
    (docs) => {
      console.log("doc inserted in blogDB");
      res.redirect("/blogs");
    },
    (e) => {
      console.log("unable to save");
    }
  );
});

app.get("/edit/:id", async function (req, res) {
  if (req.isAuthenticated()) {
    const id = req.user.id;
    const blogId = req.params.id;
    const name = await User.find({ _id: id }, { fullname: 1 });

    const blogWithId = await Blog.findById(blogId);

    res.render("newBlog", {
      blog: blogWithId,
      date: date,
      name: name[0].fullname,
      heading: "Edit post",
      button: "Update post",
    });
  }
});

app.post("/edit/:id", async function (req, res) {
  const blogId = req.params.id;
  const title = req.body.title;
  const content = req.body.post;

  let postDate = dateFormat.getDate();

  const blogWithId = await Blog.updateMany(
    { _id: blogId },
    { title: title, content: content, date: postDate }
  );
  res.redirect("/blogs");
});

app.get("/signout", function (req, res) {
  res.redirect("/");
});

app.get("/delete/:id", async function (req, res) {
  const blogId = req.params.id;
  const deleteBlog = await Blog.deleteOne({ _id: blogId });
  res.redirect("/blogs");
});

app.get("/blogs/:title", async function (req, res) {
  const id = req.user.id;
  const name = await User.find({ _id: id }, { fullname: 1 });
  const title = req.params.title;
  const blogByTitle = Blog.findOne({ title: title }).exec();
  blogByTitle.then((blog) => {
    res.render("blogs", {
      date: date,
      name: name[0].fullname,
      blogByTitle: blog,
    });
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`listening on port ${port}`));
