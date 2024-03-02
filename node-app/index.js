const express = require("express");
const app = express();
const port = 3000;

const mongoose = require("mongoose");
mongoose.connect(
  "mongodb+srv://aakankshasarode005:<andySandy@0099>@webdata.tz7zjei.mongodb.net/?retryWrites=true&w=majority",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

const Users = mongoose.model("Users", {
  username: String,
  password: String,
});

app.get("/", (req, res) => {
  res.send("hello world !");
});

app.post("/signup", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (!username || !password) {
    return res.status(400).send("Missing username or password");
  }

  const user = new Users({ username, password }); // Use variables instead of hardcoded values
  user.save()
    .then(() => {
      console.log("User saved");
      res.send("User signed up successfully");
    })
    .catch((error) => {
      console.error("Error saving user:", error);
      res.status(500).send("Error signing up user");
    });
});

app.listen(port, () => {
  console.log(`example app listening on port${port}`);
});