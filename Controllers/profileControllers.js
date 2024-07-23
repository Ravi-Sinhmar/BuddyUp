// see profile of any user
exports.userProfile = async (req, res) => {
  let uid = req.params.uid;
  const myId = req.id;
  if (uid.includes("-")) {
    let fid = extractString(uid, myId);
    uid = fid[0];
  }

  if (uid === req.id) {
    return res.redirect("/profile");
  }
  try {
    const user = await users.findById(uid);
    console.log(user);

    if (!user) {
      return res.status(404).render("resultBox", {
        title: "Failed",
        type: "fail",
        status: "Failed",
        message:
          "Looks like your friend don't have an account yet. Ask him/her to Sign up first",
        href: "/messages",
      });
    }

    const user2 = await users.findById(myId);
    if (!user2) {
      return res.status(500).render("resultBox", {
        title: "Failed",
        type: "500",
        status: "Try Again",
        message: "We Encountered a Problem with showing profile",
        href: "/messages",
      });
    }
    let mstate = "unset";
    user2.friendsDetails.forEach((el) => {
      if (el._id === `${myId}-${uid}` || el._id === `${uid}-${myId}`) {
        console.log(myId);
        console.log(uid);
        mstate = el.state;
        return console.log("this is mstate", mstate);
      }
    });
    const { _id: id, name, profilePic, bio } = user;
    let fstate = "unset";
    let rid = "";
    user.friendsDetails.forEach((el) => {
      if (el._id === `${myId}-${uid}` || el._id === `${uid}-${myId}`) {
        fstate = el.state;
        rid = el._id;
        console.log(myId);
        console.log(uid);
        return console.log("this is fstate", fstate);
      }
    });

    if (fstate === "blocked") {
      return res.status(200).render("resultBox", {
        title: "Failed",
        type: "fail",
        status: "Blocked",
        message: "Your are blocked by that person",
        href: "/messages",
      });
    }

    let title = `${name}-Profile`;
    res
      .status(200)
      .render("otherProfile", {
        id,
        name,
        profilePic,
        bio,
        title,
        fstate,
        mstate,
        rid,
      });
  } catch (error) {
    return res.status(500).render("resultBox", {
      title: "Failed",
      type: "500",
      status: "Try Again",
      message: "We Encountered a Problem with showing profile",
      href: "/messages",
    });
  }
};

//   self profile
exports.myProfile = (req, res) => {
  const uid = req.id;
  const name = req.name;
  const profilePic = req.profilePic;
  const bio = req.bio;
  const myPic = req.profilePic;

  res.status(200).render("profile", {
    title: "My Profile",
    name: name,
    uid: uid,
    myPic: myPic,
    bio: bio,
    blcount: "0",
  });
};

//   edit profie (self obviously)
exports.editProfile = (req, res) => {
  const { name, profilePic, bio } = req;
  res
    .status(200)
    .render("editProfile", { title: "Edit", name, profilePic, bio });
};

//   (save) patch  edit profile
exports.SaveEditProfile = async (req, res) => {
  const uid = req.id;
  const { name, bio, profilePic } = req.body;
  try {
    const user = await users.findOneAndUpdate(
      { _id: uid },
      { $set: { name: name, bio: bio, profilePic: profilePic } },
      { new: true }
    );

    if (!user) {
      return res.status(400).json({ status: "fail", message: "Not Updated" });
    }
    const token = setCookies(user); // Generate token
    res.cookie("token", token, { httpOnly: true }); // Set cookie after token generation
    res.status(201).json({ status: "success", message: "Updated" });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "500",
    });
  }
};
