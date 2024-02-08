const port = 4000;
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
//const BASE_URL = process.env.BASE_URL;
//const DATABASE = process.env.DATABASE;

app.use(express.json());
app.use(cors());

// Database connection With MongoDb
mongoose.connect("mongodb+srv://shuvo_art:Ixaqmeh1@cluster0.4vlukdz.mongodb.net/e-commerce");
//mongoose.connect(`${DATABASE}`);

// API Creation

app.get('/', (req, res) => {
    res.send("Express is running")
})

// Image Storage

const storage = multer.diskStorage({
    destination: './upload/images',
    filename: (req, file, cb) => {
        return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
    }
})

const upload = multer({
    storage: storage
})

// Image Upload API
app.use('/images', express.static('upload/images'))

app.post('/upload', upload.single('product'), (req, res) => {
    res.json({
        success: 1,
        image_url: `http://localhost:${port}/images/${req.file.filename}`
    })  
})

// Schema for Creating Products

const Product = mongoose.model("Product", {
    id: {
        type: Number,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    new_price: {
        type: Number,
        required: true,
    },
    old_price: {
        type: Number,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    available: {
        type: Boolean,
        default: true,
    },
})

app.post('/addproduct', async (req, res) => {
    let products = await Product.find({});
    let id;
    if(products.length > 0) {
       let last_product_array = products.slice(-1);
         let last_product = last_product_array[0];
            id = last_product.id + 1; 
    }
    else {
        id = 1;
    }
    const product = new Product({
        id: id,
        name: req.body.name,
        image: req.body.image,
        category: req.body.category,
        new_price: req.body.new_price,
        old_price: req.body.old_price,
    });
    console.log(product);
    await product.save();
    console.log("Saved");
    res.send({
        success: true,
        name:req.body.name,
    })
})

//Creating API for deleting Products

app.post('/removeproduct', async (req, res) => {
    await Product.findOneAndDelete({id: req.body.id});
    console.log("Removed");
    res.json({
        success: true,
        name: req.body.name,
    })
})

//Creating API for getting all products

app.get('/allproducts', async (req, res) => {
    let products = await Product.find({});
    console.log("All Products Fetched");
    res.json(products);
})

//schema creation for promo Code

const PromoCode = mongoose.model("PromoCode", {
    name: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
    },
    usages: {
        type: Number,
        required: true,
    },
    discount: {
        type: Number,
        required: true,
    },
    createdate: {
        type: Date,
        default: Date.now,
    },
    startdate: {
        type: Date,
    },
    enddate: {
        type: Date,
    }, 
});


app.post('/addpromocode', async (req, res) => {
    let promoCodes = await PromoCode.find({});
    let id;
    if(promoCodes.length > 0) {
        let last_promo_array = promoCodes.slice(-1);
        let last_promo = last_promo_array[0];
        id = last_promo.id + 1;
    }
    else {
        id = 1;
    }

    const promoCode = new PromoCode({
        id: id,
        name: req.body.name,
        usages: req.body.usages,
        discount: req.body.discount,
        startdate: req.body.startdate,
        enddate: req.body.enddate,
    });
    await promoCode.save();
    res.json({
        success: true,
        name: req.body.name,
    })
})

//Creating API for deleting Promo Code

app.post('/removepromocode', async (req, res) => {
    await PromoCode.findOneAndDelete({id: req.body.id});
    console.log("Removed");
    res.json({
        success: true,
        name: req.body.name,
    })
})

//Creating API for getting all promo codes

app.get('/allpromocodes', async (req, res) => {
    let promoCodes = await PromoCode.find({});
    console.log("All Products Fetched");
    res.json(promoCodes);
})

//schema creation for user model

const Users = mongoose.model("Users", {
    name: {
        type: String,
    },
    email: {
        type: String,
        unique: true,
    },
    password: {
        type: String,
    },
    cartData: {
        type: Object,
    },
    date: {
        type: Date,
        default: Date.now,
    }
})

//Creating API for user registration

app.post('/signup', async (req, res) => {

    let check = await Users.findOne({email: req.body.email});
    if(check) {
        return res.status(400).json({success: false, message: "Email already exists"});
    }
    let cart = {};
    for (let i = 0; i < 300; i++) {
        cart[i] = 0;
    }
    const user = new Users({
        name: req.body.username,
        email: req.body.email,
        password: req.body.password,
        cartData: cart,
    });

    await user.save();

    const data = {
        user: {
            id: user.id,
        }
    }

    const token = jwt.sign(data, 'secret_ecom');
    res.json({success: true, token})
})

//Creating API for user login

app.post('/login', async (req, res) => {
    let user = await Users.findOne({email: req.body.email});
    if(user) {
        const passCompare = req.body.password === user.password;
        if(passCompare) {
            const data = {
                user: {
                    id: user.id,
                }
            }
            const token = jwt.sign(data, 'secret_ecom');
            res.json({success: true, token})
        }
        else {
            res.json({success: false, errors: "Password is incorrect"});
        }
    }
    else {
        res.json({success: false, errors: "User not found"});
    }
})

// creating middleware to fetch user
    const fetchUser = async (req, res, next) => {
        const token = req.header('auth-token');
        if(!token) {
            res.status(401).send({errors: "Please authenticate using a valid token"});
        } else {
            try {
                const data = jwt.verify(token, 'secret_ecom');
                req.user = data.user;
                next();
            } catch (error) {
                res.status(401).send({errors: "Invalid token"});
            }
        }
    }

//creating endpoint for adding products to cart data
app.post('/addtocart', fetchUser, async (req, res) => {
    console.log("Added", req.body.itemID, req.user.id);

    let userData = await Users.findOne({_id: req.user.id});
    userData.cartData[req.body.itemID] += 1;
    await Users.findOneAndUpdate({_id: req.user.id}, {cartData: userData.cartData});
    res.send("Added")
})

//creating endpoint for removing products from cart data
app.post('/removefromcart', fetchUser, async (req, res) => {
    console.log("removed", req.body.itemID);

    let userData = await Users.findOne({_id: req.user.id});
    if(userData.cartData[req.body.itemID] > 0) {
        userData.cartData[req.body.itemID] -= 1;
        await Users.findOneAndUpdate({_id: req.user.id}, {cartData: userData.cartData});
        res.send("Removed")
    }
})

//creating endpoint for getting cart data
app.post('/getcart', fetchUser, async (req, res) => {
    console.log("Get Cart", req.user.id);
    let userData = await Users.findOne({_id: req.user.id});
    res.json(userData.cartData);
})

app.listen(port, (error) => {
    if (!error) {
        console.log(`Server is running on port ${port}`)
    } else {
        console.log("Error : "+error)
    }
})
