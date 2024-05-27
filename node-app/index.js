
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix);
  },
});

const upload = multer({ storage: storage });
var jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const app = express();
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(cors());
const port = 4000;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
// Middleware to parse JSON bodies
app.use(express.json());

// MongoDB connection
mongoose
  .connect("mongodb://127.0.0.1:27017/test")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Define Mongoose schema
const userSchema = new mongoose.Schema({
  username: String,
  mobile: String,
  email: String,
  password: String,
  likedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Products" }],
});

// Define Mongoose model
const Users = mongoose.model("User", userSchema);
// for Add-product card
const Products = mongoose.model("Products", {
  pname: String,
  pdesc: String,
  price: String,
  category: String,
  pimage: String,
  pimage2: String,
   addedBy: mongoose.Schema.Types.ObjectId
});
// Routes
app.get("/", (req, res) => {
  res.send("Hello World!");
});
app.get('/search',(req,res)=>{
   let search= req.query.search;
  Products.find({
  $or :[
 {pname: {$regex : search}},
 {pdesc: {$regex : search}},
 {price: {$regex : search}},
  ]
  })
  .then((results) => {
    res.send({ message: "success", products: results});
  })
  .catch((err) => {
    res.send({ message: "server err" });
  });
});


app.post("/like-product", (req, res) => {
  let productId = req.body.productId;
  let userId = req.body.userId;


  Users.updateOne(
    { _id: userId },
    { $addToSet: { likedProducts: productId } }
  )
    .then(() => {
      res.send({ message: "liked sucecss." });
    })
    .catch(() => {
      res.send({ message: "server err." });
    });
});

app.post("/add-product", upload.fields([{name:'pimage'},{name:"pimage2"}]), (req, res) => {
console.log(req.files);
console.log(req.body);

  const pname = req.body.pname;
  const pdesc = req.body.pdesc;
  const price = req.body.price;
  const category = req.body.category;
  const pimage = req.files.pimage[0].path;
  const pimage2 = req.files.pimage2[0].path;
   const  addedBy= req.body.userId;
  const product = new Products({ pname, pdesc, pimage,pimage2, price, category,addedBy });

  product
    .save()
    .then(() => {
      res.send({ message: "saved sucecss." });
    })
    .catch(() => {
      res.send({ message: "server err." });
    });
});


app.get("/get-products", (req, res) => {
  const catName = req.query.catName;
  console.log(catName);
  
  let filter = {};
  
  if (catName) {
    filter = { category: catName }; // Construct filter object based on query parameter
  }

  Products.find(filter)
    .then((result) => {
      res.send({ message: "success", products: result });
    })
    .catch((err) => {
      res.status(500).send({ message: "server err" }); // Set proper status code for server error
    });
});

app.get("/get-product/:pId", (req, res) => {
  console.log(req.params);
  Products.findOne({_id:req.params.pId})
    .then((result) => {
      res.send({ message: "success", product : result });
    })
    .catch((err) => {
      res.send({ message: "server err" });
    });
});
app.post("/liked-products", (req, res) => {
  Users.findOne({_id:req.body.userId}).populate('likedProducts')
    .then((result) => {
      res.send({ message: "success", products: result.likedProducts });
    })
    .catch((err) => {
      res.send({ message: "server err" });
    });
});

app.post("/signup", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const mobile = req.body.mobile;
  const email = req.body.email;
  const user = new Users({ username: username, password: password , mobile:mobile , email:email});

  user
    .save()
    .then(() => {
      res.send({ message: "saved sucecss." });
    })
    .catch(() => {
      res.send({ message: "server err." });
    });
});

app.get('/get-user/:uId',(req,res)=>{
   const _userId=req.params.uId;
  Users.findOne({_id: _userId })
  .then((result) => {
    res.send({ message: "sucecss.", user:{email:result.email,username
    :result.username,mobile:result.mobile}});    {/*user:result*/}  
  })
  .catch(() => {
    res.send({ message: "server err." });
  });
})
//login page

app.post("/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const user = new Users({ username: username, password: password });

  Users.findOne({ username: username })
    .then((result) => {
      if (!result) {
        res.send({ message: "user not found." });
      } else {
        if (result.password == password) {
          const token = jwt.sign(
            {
              data: result,
            },
            "MYKEY",
            { expiresIn: "1hr" }
          );
          res.send({
            message: "find sucecss.",
            token: token,
            userId: result._id,
          });
        }
        if (result.password != password) {
          res.send({ message: "password not matched." });
        }
      }
    })
    .catch(() => {
      res.send({ message: "server err." });
    });
});


// Start server
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});