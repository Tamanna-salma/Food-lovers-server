require('dotenv').config()
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_user}:${process.env.DB_pass}@cluster0.nlnjuiz.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Database and Collections
    const db = client.db('Food_db');
    const foodCollection = db.collection('foods');
    const userscollection = db.collection('users');
    const recipecollection = db.collection('recipe');
    const favouritesCollection = db.collection('favourites');
    const followCollection = db.collection("follows");

    // --- Users API ---
    app.post('/users', async (req, res) => {
      const newUser = req.body;
      const query = { email: newUser.email };
      const existinguser = await userscollection.findOne(query);
      if (existinguser) {
        return res.send({ message: 'user already exists.' });
      }
      const result = await userscollection.insertOne(newUser);
      res.send(result);
    });

    app.get('/users', async (req, res) => {
      const result = await userscollection.find().toArray();
      res.send(result);
    });

    // --- Follow/Unfollow API ---
    app.post('/users/follow', async (req, res) => {
      const { followerEmail, followingEmail } = req.body;

      // নিজের ইমেইলকে নিজে ফলো করা আটকানো
      if (followerEmail === followingEmail) {
        return res.status(400).send({ message: "You cannot follow yourself" });
      }

      const query = { followerEmail, followingEmail };
      const isExists = await followCollection.findOne(query);

      if (isExists) {
        // অলরেডি থাকলে আনফলো (Delete) করবে
        await followCollection.deleteOne(query);
        return res.send({ followed: false });
      }

      // নতুন ফলো ডাটা তৈরি (Date সহ)
      const followDoc = {
        followerEmail,
        followingEmail,
        followedAt: new Date()
      };
      const result = await followCollection.insertOne(followDoc);
      res.send({ followed: true, result });
    });

    // --- My Followers List API (আমাকে কারা ফলো করে) ---
    app.get('/my-followers/:email', async (req, res) => {
      const email = req.params.email;
      try {
        // ১. ফলো কালেকশন থেকে ঐ ইমেইলের ফলোয়ারদের ইমেইল খুঁজুন
        const followers = await followCollection.find({ followingEmail: email }).toArray();
        
        if (followers.length === 0) {
          return res.send([]); 
        }

        // ২. ফলোয়ারদের ইমেইলগুলো দিয়ে ইউজার কালেকশন থেকে তাদের প্রোফাইল আনুন
        const followerEmails = followers.map(f => f.followerEmail);
        const result = await userscollection.find({ email: { $in: followerEmails } }).toArray();
        
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Error fetching followers" });
      }
    });

    // --- Food API ---
    app.get('/recentFood', async (req, res) => {
      const cursor = foodCollection.find().sort({ rating: -1 }).limit(8);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get('/foods', async (req, res) => {
      const { food_name } = req.query;
      let query = {};
      if (food_name) {
        query.food_name = { $regex: food_name, $options: 'i' };
      }
      const cursor = foodCollection.find(query).sort({ created_at: -1 });
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get('/foods/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodCollection.findOne(query);
      res.send(result);
    });

    app.post('/foods', async (req, res) => {
      const newFoodData = req.body;
      newFoodData.created_at = new Date(); // সময় যোগ করা
      const result = await foodCollection.insertOne(newFoodData);
      res.send(result);
    });

    app.patch('/foods/:id', async (req, res) => {
      const id = req.params.id;
      const updatedFood = req.body;
      const query = { _id: new ObjectId(id) };
      const update = {
        $set: {
          ...updatedFood,
          updated_at: new Date()
        }
      };
      const result = await foodCollection.updateOne(query, update);
      res.send(result);
    });

    app.delete('/foods/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodCollection.deleteOne(query);
      res.send(result);
    });

    // --- Recipes API ---
    app.get('/recipe', async (req, res) => {
      const result = await recipecollection.find().toArray();
      res.send(result);
    });

    // --- Favourites API ---
    app.post('/favourites', async (req, res) => {
      const favourite = req.body;
      favourite.added_at = new Date();
      const result = await favouritesCollection.insertOne(favourite);
      res.send(result);
    });

    app.get('/favourites', async (req, res) => {
      const email = req.query.email;
      const query = email ? { email: email } : {};
      const result = await favouritesCollection.find(query).toArray();
      res.send(result);
    });

    app.delete('/favourites/:id', async (req, res) => {
      const id = req.params.id;
      const result = await favouritesCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('food lover server is running');
});

app.listen(port, () => {
  console.log(`food lovers server is running on port ${port}`);
});