const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
// middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ehoamog.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' })
    }
    const token = authHeader;

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(401).send({ message: 'unauthorized access' })
        }
        req.decoded = decoded;
        next();
    })

}

async function run() {
    try {
        const serviceCollection = client.db('paradiseDb').collection('services');
        const reviewCollection = client.db('paradiseDb').collection('review');

        app.post('/jwt', (req, res) => {
            const user = req.body;
            console.log(user)
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET)
            return res.send({ token })


        })

        app.get('/services', async (req, res) => {
            const query = {}
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);

        });
        app.get('/homeServices', async (req, res) => {
            const query = {}
            const sort = { _id: -1 };
            const cursor = serviceCollection.find(query).sort(sort);
            const services = await cursor.limit(3).toArray();
            res.send(services);

        });

        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const service = await serviceCollection.findOne(query);
            res.send(service);
        });

        app.post('/services', async (req, res) => {
            const addedService = req.body;
            const result = await serviceCollection.insertOne(addedService);
            res.send(result);
        });




        app.post('/reviews', async (req, res) => {

            const addedReview = req.body;
            const result = await reviewCollection.insertOne(addedReview);
            return res.send(result);
        });

        app.get('/reviews', async (req, res) => {



            const query = {}
            const sort = { date: -1 };
            const cursor = reviewCollection.find(query).sort(sort);
            const reviews = await cursor.toArray();
            return res.send(reviews);

        });

        app.get('/reviews/:id', verifyJWT, async (req, res) => {

            const decoded = req.decoded;
            if (decoded?.email !== req.query.email) {

                return res.status(401).send({ message: 'unauthorized access' })

            }

            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await reviewCollection.findOne(query);
            return res.send(result);

        })

        app.delete('/reviews/:id', async (req, res) => {

            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await reviewCollection.deleteOne(query);
            return res.send(result);

        })

        app.put('/updateReview/:id', async (req, res) => {

            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const reviews = req.body;

            const option = { upsert: true };
            const updatedReview = {
                $set: {

                    rating: reviews.rating,
                    review: reviews.review,
                }
            }

            const result = await reviewCollection.updateOne(query, updatedReview, option);
            return res.send(result);

        })

    }
    finally {

    }
}
run().catch(err => console.error(err));

app.get('/', (req, res) => {
    res.send('app is running');
})


app.listen(port, () => {
    console.log('server is running on ', port)
})