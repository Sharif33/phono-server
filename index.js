const express = require('express');
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const stripe = require('stripe')(process.env.STRIPE_SECRET);
// dotenv
require('dotenv').config()
const cors = require('cors');

const app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.json({limit: "50mb"}));
app.use(bodyParser.urlencoded({limit: "50mb", extended: true, parameterLimit:50000}));
const port = process.env.PORT || 5000;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.w273s.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// jwt
const admin = require("firebase-admin");

const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
// const serviceAccount = require('./');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


// middleware
app.use(cors());
app.use(express.json());

// jwt
async function verifyToken(req,res,next){
if(req.headers.authorization.startsWith('Bearer')){
    const token = req.headers.authorization.split(' ')[1];

    try {
        const decodedUser = await admin.auth().verifyIdToken(token);
        req.decodedEmail = decodedUser.email;
    } catch (error) {
        
    }
}
    next();
}

const cloudinary = require("cloudinary").v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

async function run() {
    try {
        await client.connect();
        const database = client.db('mobileManagement');
        const mobileCollection = database.collection('phones');
        const mobileCollection2 = database.collection('mobiles');
        const usersCollection = database.collection('users');
        const MyOrder = database.collection('orders');
        const Coupons = database.collection('coupons');
        const Reviews = database.collection('reviews');
        const CustomerReviews = database.collection('customerReviews');
        

        /* Offers CRUD */

          // POST phone
            app.post('/phones', async (req, res) => {
                const phone = req.body;
                const {image} = req.body;
                try {
                    if (image) {
                      const uploadedResponse = await cloudinary.uploader.upload(image, {
                        upload_preset: "phono-uploads",
                      });
                
                      if (uploadedResponse) {   
                        // console.log(uploadedResponse);
                        const img = {...phone, image: uploadedResponse.secure_url};
                        const result = await mobileCollection.insertOne(img);
                  // console.log(result);
                  res.json(result)
                      }
                    }
                  } catch (error) {
                    console.log(error);
                    // res.status(500).send(error);
                  }
                  
            });

        // Use POST to get data by keys
            app.post('/phones/byKeys', async (req, res) => {
                const keys = req.body;
                const query = { key: { $in: keys } }
                const products = await mobileCollection.find(query).toArray();
                res.send(products);
            });

        // GET phones
            app.get('/phones', async (req, res) => {
                const cursor = mobileCollection.find({});
                const phones = await cursor.toArray();
                res.send(phones);
            });

        // GET phones
            app.get('/phonesAp', async (req, res) => {
                const query = { isApproved: true };
                const cursor = mobileCollection.find(query);
                const phones = await cursor.toArray();
                res.send(phones);
            });


        //Update phones get
        app.get('/phones/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const cursor = await mobileCollection.findOne(query);
            // console.log('load user with id: ', id);
            res.send(cursor);
        })

        //  update phones per id
        app.put("/phones/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const updatePhones = req.body;
            const options = { upsert: true };
            const updateDoc = {
                $set: updatePhones /* {
                name: updatePhones.name,
                brand: updatePhones.brand,
                specs: updatePhones.specs,
                processor: updatePhones.processor,
                memory: updatePhones.memory,
                display: updatePhones.display,
                battery: updatePhones.battery,
                camera: updatePhones.camera,
                selfie: updatePhones.selfie,
                network: updatePhones.network,
                id: updatePhones.id,
                contact: updatePhones.contact,
                price: updatePhones.price,
                star: updatePhones.star,
                rating: updatePhones.rating,
                image: updatePhones.image,
                date: updatePhones.date,
                time: updatePhones.time
                    
            }, */
        };
        const result = mobileCollection.updateOne(filter, updateDoc, options)
        // console.log('updating', id)
        res.json(result)
        });

        app.put('/phones', async (req, res) => {
            const updated = req.body;
    
            const filter = { _id: ObjectId(updated._id) };
    
            let updateDoc = {};
            if(updated.isApproved)
            {
             updated.isApproved = false;
             updateDoc = {
                 $set: {
                     isApproved: false
                 },
             };
            }
    
            else {
                updated.isApproved = true;
                updateDoc = {
                    $set: {
                        isApproved: true
                    },
                };
               }
               const result = await mobileCollection.updateOne(filter, updateDoc);
    
               if (result) {
                res.json(updated);
               }
          });



            // DELETE phones from ManageProducts
            app.delete('/phones/:id', async (req, res) => {
                const id = req.params.id;
                const query = { _id: ObjectId(id) };
                const result = await mobileCollection.deleteOne(query);
                res.json(result);
            });


            // GET Single phone
            app.get('/phones/:id', async (req, res) => {
                const id = req.params.id;
                // console.log('getting specific service', id);
                const query = { _id: ObjectId(id) };
                const phone = await mobileCollection.findOne(query);
                res.json(phone);
            })

        /* Offers CRUD End */    
        

        /* Mobile section start */

          // POST mobile
          app.post('/mobiles', async (req, res) => {
                const mobile = req.body;
                // console.log('hit the post api', phone);
                const result = await mobileCollection2.insertOne(mobile);
                // console.log(result);
                res.json(result)
           });

            // Use POST to get data by keys
            app.post('/mobiles/byKeys', async (req, res) => {
                const keys = req.body;
                const query = { key: { $in: keys } }
                const products = await mobileCollection2.find(query).toArray();
                res.send(products);
            });

            // GET mobile
            app.get('/mobiles', async (req, res) => {
                // const query = { isFavourited: true };
                const cursor = mobileCollection2.find({});
                const phones = await cursor.toArray();
                res.send(phones);
            });

               //Update mobiles get
               app.get('/mobiles/:id', async (req, res) => {
                const id = req.params.id;
                const query = { _id: ObjectId(id) };
                const cursor = await mobileCollection2.findOne(query);
                // console.log('load user with id: ', id);
                res.send(cursor);
            })
    
            //  update mobiles per id
            app.put("/mobiles/:id", async (req, res) => {
                const id = req.params.id;
                const filter = { _id: ObjectId(id) };
                const updateMobiles = req.body;
                const options = { upsert: true };
                const updateDoc = {
                    $set: updateMobiles
                };
            const result = mobileCollection2.updateOne(filter, updateDoc, options)
            // console.log('updating', id)
            res.json(result)
            });
    

            // DELETE mobiles from ManageProducts
            app.delete('/mobiles/:id', async (req, res) => {
                const id = req.params.id;
                const query = { _id: ObjectId(id) };
                const result = await mobileCollection2.deleteOne(query);
                res.json(result);
            });


            // GET Single mobile
            app.get('/mobiles/:id', async (req, res) => {
                const id = req.params.id;
                // console.log('getting specific service', id);
                const query = { _id: ObjectId(id) };
                const phone = await mobileCollection2.findOne(query);
                res.json(phone);
            })
        
            /* Mobile section End */

                

      /* Reviews Section */

        // GET Reviews
        app.get('/reviews', async (req, res) => {
            const cursor = Reviews.find({});
            const reviews = await cursor.toArray();
            res.send(reviews);
        });

        // POST Review
        app.post('/reviews', async (req, res) => {
            const review = req.body;
            // console.log('hit the post api', review);
            const result = await Reviews.insertOne(review);
            // console.log(result);
            res.json(result)
        });

        /* Reviews section end */

      /*Customer Reviews Section */

        // GET cReviews
        app.get('/cReviews', async (req, res) => {
            const cursor = CustomerReviews.find({});
            const creviews = await cursor.toArray();
            res.send(creviews);
        });

        // POST cReview
        app.post('/cReviews', async (req, res) => {
            const creview = req.body;
            // console.log('hit the post api', review);
            const result = await CustomerReviews.insertOne(creview);
            // console.log(result);
            res.json(result)
        });

         // GET all cReviews by email
         app.get("/myReviews/:email", (req, res) => {
            // console.log(req.params);
        CustomerReviews.find({ email: req.params.email }).toArray((err, results) => {
                    res.send(results);
                });
        });

         //  update cReviews by their email
         app.put("/cReviews/:email", async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            // console.log(user);
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await CustomerReviews.updateOne(filter, updateDoc, options);
            res.json(result);
        });


        /*Customer Reviews section end */

        /* Coupon sectio */

          // POST coupon
          app.post('/coupons', async (req, res) => {
            const coupon = req.body;
            const result = await Coupons.insertOne(coupon);
            res.json(result)
       });

        // GET coupon
        app.get('/coupons', async (req, res) => {
            // const query = { isFavourited: true };
            const cursor = Coupons.find({});
            const coupon = await cursor.toArray();
            res.send(coupon);
        });

           //Update coupons get
           app.get('/coupons/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const cursor = await Coupons.findOne(query);
            res.send(cursor);
        })

        //  update coupons per id
        app.put("/coupons/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const updateMobiles = req.body;
            const options = { upsert: true };
            const updateDoc = {
                $set: updateMobiles
            };
        const result = Coupons.updateOne(filter, updateDoc, options)
        res.json(result)
        });


        // DELETE coupons from ManageCoupons
        app.delete('/coupons/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await Coupons.deleteOne(query);
            res.json(result);
        });


        // GET Single coupon
        app.get('/coupons/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const phone = await Coupons.findOne(query);
            res.json(phone);
        })
    
        /* Coupon section End */

        /* Orders Section start */

        // GET orders 
        app.get('/orders', async (req, res) => {
            const cursor = MyOrder.find({});
            const orders = await cursor.toArray();
            res.send(orders);
        });

        //Update orders get
        app.get('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const user = await MyOrder.findOne(query);
            // console.log('load user with id: ', id);
            res.send(user);
        })

        // POST orders
        app.post('/orders', async (req, res) => {
            const order = req.body;
            // console.log('hit the post api', order);
            const result = await MyOrder.insertOne(order);
            // console.log(result);
            res.json(result)
        });

        // DELETE orders from ManageOrders
        app.delete('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await MyOrder.deleteOne(query);
            res.json(result);
        });

        //  update orders status
        app.put("/updateStatus/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const updateStatus = req.body;
            MyOrder
                .updateOne(filter, {
                    $set: {
                        status: updateStatus.status,
                    },
                })
                .then((result) => {
                    res.send(result);
                    // console.log(result);
                });

        });

        // GET all order by email
        app.get("/myOrders/:email", (req, res) => {
            // console.log(req.params);
            MyOrder.find({ email: req.params.email }).toArray((err, results) => {
                    res.send(results);
                });
        });

         //  update myOrders status
         app.put("/myOrders/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const updateStatus = req.body;
            MyOrder
                .updateOne(filter, {
                    $set: {
                        status: updateStatus.status,
                    },
                })
                .then((result) => {
                    res.send(result);
                    // console.log(result);
                });

        });

        //DELETE my order
        app.delete('/myOrders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await MyOrder.deleteOne(query);
            res.json(result);
        })

    /* Orders section end */


    /* user and admin part */

          // GET users 
          app.get('/users', async (req, res) => {
            const cursor = usersCollection.find({});
            const users = await cursor.toArray();
            res.send(users);
        });

        // single user
        /* app.get('/usersEmail/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            // console.log(user);
            res.send(user);
        }); */

        // admin create
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
                 res.json({ admin: isAdmin });
            } else{
              res.send(user);  
            } 
        })

        // user post
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            // console.log(result);
            res.json(result);
        });

        // user update
        app.put('/users', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        });

        // user update by their email
        app.put("/users/:email", async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            // console.log(user);
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        });

        // make admin with jwt
        app.put('/users/admin/:email', verifyToken, async (req, res) => {
            const user = req.body;
            // console.log('put', user);
            const requester = req.decodedEmail;
            if(requester){
                const requesterAccount = await usersCollection.findOne({email: requester});
                if(requesterAccount?.role === 'admin'){
                    const filter = { email: user.email };
                    const updateDoc = { $set: { role: 'admin' } };
                    const result = await usersCollection.updateOne(filter, updateDoc);
                    // console.log(result);
                    res.json(result);
                }
            }
            else{
                res.status(403).json({message: 'You do not have access to make Admin'})
            }
            
        });
    
        /* user and admin part end */


        /* Payment section start */

        //orders PAYMENT
        app.put('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const payment = req.body;
            const filter = { _id: ObjectId(id) };
            const updateDoc = {
                $set: {
                    payment: payment
                }
            };
            const result = await MyOrder.updateOne(filter, updateDoc);
            res.json(result);
        });

        // orders payment post
        app.post('/create-payment-intent', async (req, res) => {
            const paymentInfo = req.body;
            const amount = paymentInfo.total * 100;
            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                payment_method_types: ['card']
            });
            res.json({ clientSecret: paymentIntent.client_secret })
        })
    /* Payment section end */

    }
    finally {
        // await client.close();
    }
}

run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Network Server is Runnning')
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
});