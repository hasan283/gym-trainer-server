const express = require('express');
const cors = require('cors');
var jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000;

// middleWare 
app.use(cors());
app.use(express.json());

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'UnAuthorize Access' })
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'Forbidden Access' })
        }
        console.log('decoded', decoded)
        req.decoded = decoded;
        next()
    })
}




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.1nfoa.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const userCollection = client.db('gym-trainer').collection('trainer-service');
        const orderCollection = client.db('gym-trainer').collection('order');

        // Auth 
        app.post('/login', async (req, res) => {
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1d'
            });
            res.send({ accessToken });
        })



        // Services Api 
        app.get('/service', async (req, res) => {
            const query = {};
            const cursor = userCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        });

        app.get('/service/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const services = await userCollection.findOne(query);
            res.send(services);
        });

        // Data Post 
        app.post('/service', async (req, res) => {
            const newService = req.body;
            const result = await userCollection.insertOne(newService);
            res.send(result);
        });

        // Delete Data 
        app.delete('/service/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await userCollection.deleteOne(query);
            res.send(result);
        });

        // Order Api 

        // Show Display Order 
        app.get('/order', verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const email = req.query.email;
            if (email === decodedEmail) {
                const query = { email: email };
                const cursor = orderCollection.find(query);
                const order = await cursor.toArray();
                res.send(order)
            }
            else {
                res.status(403).send({ message: 'Forbidden Access' })
            }
        })

        // Order Collection 
        app.post('/order', async (req, res) => {
            const newOrder = req.body;
            const order = await orderCollection.insertOne(newOrder);
            res.send(order);
        });
    }
    finally {

    }
}
run().catch(console.dir);






app.get('/', (req, res) => {
    res.send('Hello Word! Running Server!!');
})


app.listen(port, () => {
    console.log('Gym Trainer Server', port)
})

