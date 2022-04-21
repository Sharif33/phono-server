const express = require('express');
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const stripe = require('stripe')(process.env.STRIPE_SECRET);
// dotenv
require('dotenv').config()
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.w273s.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// middleware
app.use(cors());
app.use(express.json());

async function run() {
    try {
        await client.connect();
        const database = client.db('mobileManagement');
        const mobileCollection = database.collection('phones');
        const usersCollection = database.collection('users');
        const MyOrder = database.collection('orders');
        const MyFavorites = database.collection('favorites');
        const Reviews = database.collection('reviews');
        

          // POST phone
          app.post('/phones', async (req, res) => {
            const phone = req.body;
            console.log('hit the post api', phone);
            const result = await mobileCollection.insertOne(phone);
            console.log(result);
            res.json(result)
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
            // const query = { isFavourited: true };
            const cursor = mobileCollection.find({});
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
                        $set: {
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
                            
                    },
                };
                const result = mobileCollection.updateOne(filter, updateDoc, options)
                console.log('updating', id)
                res.json(result)
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
            console.log('getting specific service', id);
            const query = { _id: ObjectId(id) };
            const bike = await mobileCollection.findOne(query);
            res.json(bike);
        })

      

        // GET Reviews
        app.get('/reviews', async (req, res) => {
            const cursor = Reviews.find({});
            const reviews = await cursor.toArray();
            res.send(reviews);
        });

        // POST Review
        app.post('/reviews', async (req, res) => {
            const review = req.body;
            console.log('hit the post api', review);
            const result = await Reviews.insertOne(review);
            console.log(result);
            res.json(result)
        });

        // GET orders 
        app.get('/orders', async (req, res) => {
            const cursor = MyOrder.find({});
            const orders = await cursor.toArray();
            res.send(orders);
        });
        // GET Favourites 
        app.get('/favorites', async (req, res) => {
            const cursor = MyFavorites.find({});
            const favorites = await cursor.toArray();
            res.send(favorites);
        });

        // GET all order by email
        app.get("/myOrders/:email", (req, res) => {
            console.log(req.params);
            MyOrder
                .find({ email: req.params.email })
                .toArray((err, results) => {
                    res.send(results);
                });
        });
        // GET all favorite by email
        app.get("/myFavorite/:email", (req, res) => {
            console.log(req.params);
            MyFavorites
                .find({ email: req.params.email })
                .toArray((err, results) => {
                    res.send(results);
                });
        });

        //DELETE my order
        app.delete('/myOrders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await MyOrder.deleteOne(query);
            res.json(result);
        })
        //DELETE my favorite
        app.delete('/myFavorites/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await MyFavorites.deleteOne(query);
            res.json(result);
        })

        // POST orders
        app.post('/orders', async (req, res) => {
            const order = req.body;
            console.log('hit the post api', order);
            const result = await MyOrder.insertOne(order);
            console.log(result);
            res.json(result)
        });
        // POST Favorites
        app.post('/favorites', async (req, res) => {
            const favorite = req.body;
            console.log('hit the post api', favorite);
            const result = await MyFavorites.insertOne(order);
            console.log(result);
            res.json(result)
        });

        // DELETE orders from ManageOrders
        app.delete('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await MyOrder.deleteOne(query);
            res.json(result);
        });


        // user and admin part

        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        })

        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            console.log(result);
            res.json(result);
        });

        app.put('/users', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        });

        app.put('/users/admin', async (req, res) => {
            const user = req.body;
            console.log('put', user);
            const filter = { email: user.email };
            const updateDoc = { $set: { role: 'admin' } };
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.json(result);
        });

        //Update orders get
        app.get('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const user = await MyOrder.findOne(query);
            // console.log('load user with id: ', id);
            res.send(user);
        })

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
                    console.log(result);
                });

        });

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