const express = require("express");
const User = require("../models/user");

const userRouter = express.Router({
  strict: true,
});

userRouter.post("/insert/", (req, res) => {
  const user = new User(req.body);
  user
    .save()
    .then(() => {
      res.status(201).send(user);
    })
    .catch((e) => {
      res.status(400);
      res.send(e);
    });
});

userRouter.get("/getUser", async (req, res) => {
  if (req.query.email && req.query.password) {
    try {
      const user = await User.findOne({
        email: req.query.email,
        password: req.query.password,
      });
      if (user) {
        res.status(200).json({
          message: "User already exists",
          data: user,
        });
      } else
        res.status(203).json({
          message: "User does not exist",
          data: null,
        });
    } catch (e) {
      res.status(500).json({
        message: "Internal server error",
        data: e,
      });
    }
  } else {
    res.status(500).json({
      message: "Invalid data",
      data: e,
    });
  }
});

module.exports = userRouter;
