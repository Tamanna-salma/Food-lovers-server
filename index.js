const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 3000;

//moddleware
app.use(cors());
app.use(express.json())

const uri = "mongodb+srv://FoodDbUser:UvKhroTORGNUthwq@cluster0.nlnjuiz.mongodb.net/?appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
app.get('/', (req, res) => {
  res.send('food lover server is running')

})

async function run() {
  try {
    await client.connect();
    const db = client.db('Food_db');
    const foodCollection = db.collection('foods');
    const bidscollection = db.collection('myBids');
    const userscollection = db.collection('users');
    const recipecollection = db.collection('recipe');
    const favortiesCollection = db.collection('favourites')

    //  Users APi**
    app.post('/users', async (req, res) => {
      const newUser = req.body;
      const email = req.body.email;
      const query = { email: email }
      const existinguser = await userscollection.findOne(query);
      if (existinguser) {
        res.send({ massage: 'user already exits.' })
      }
      else {
        const result = await userscollection.insertOne(newUser);
        res.send(result);
      }

    })

    app.get('/recentFood', async (req, res) => {
      const cursor = foodCollection.find().sort({ rating: -1 }).limit(6)
      const result = await cursor.toArray();
      res.send(result);
    })

    app.get('/recipe', async (req, res) => {
      const cursor = recipecollection.find()
      const result = await cursor.toArray();
      res.send(result);
    })

    // All food data get**
    app.get('/foods', async (req, res) => {
      // const email = req.query.email;
      // const query = {}
      // if (email) {
      //   query.email = email;
      // }
      const { food_name } = req.query
      let query = {}
      if (food_name) {
        query.food_name = {
          $regex: food_name,
          $options: 'i'
        };
      }
      const cursor = foodCollection.find(query).sort({ created_at: -1 })
      const result = await cursor.toArray();
      res.send(result)
    });

    //  get single data

    app.get('/foods/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await foodCollection.findOne(query)
      res.send(result)
    });

    // data post**

    app.post('/foods', async (req, res) => {
      const newFoodData = req.body;
      const { food_name,
        photo,
        restaurant_name,
        restaurant_location,
        rating,
        review,
        email,
        reviewer_name
      } = newFoodData
      const created_at = new Date()
      const newFood = {
        food_name,
        photo,
        restaurant_name,
        restaurant_location,
        rating,
        review,
        email,
        reviewer_name,
        created_at
      }
      const result = await foodCollection.insertOne(newFood);
      res.send(result);
    });

    app.post('favorites', async (req, res) => {
      const favourite = req.body;  
      const result = await favortiesCollection.insertOne(favourite); 
      res.send(result);
    })


    // edit data**
    app.patch('/foods/:id', async (req, res) => {
      const id = req.params.id;
      // console.log(id);
      const updatedFood = req.body;
      // console.log(updatedFood);
      const query = { _id: new ObjectId(id) }
      const update = {
        // $set:updatedFood
        $set: {
          name: updatedFood.name

        }
      }
      const result = await foodCollection.updateOne(query, update)
      res.send(result)

    });


    app.delete('/foods/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await foodCollection.deleteOne(query);
      res.send(result)
    })

    // bids related Apis
    app.get('/myBids', async (req, res) => {
      const email = req.query.email;
      const query = {};
      if (email) {
        query.
          user_email = email;
      }
      const cursor = bidscollection.find(query);
      const result = await cursor.toArray();
      res.send(result)
    })

    //  get a single bids data

    app.get('/myBids/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await bidscollection.findOne(query)
      res.send(result)
    })

    app.post('/myBids', async (req, res) => {
      const newbid = req.body;
      const result = await bidscollection.insertOne(newbid);
      res.send(result)
    })

    app.delete('/myBids/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await bidscollection.deleteOne(query);
      res.send(result)
    })

    // Edit a bids
    app.patch('/myBids/:id', async (req, res) => {
      const id = req.params.id;
      const updatedbids = req.body;
      const query = { _id: new ObjectId(id) }
      const update = {
        $set: {
          buyer_name: updatedbids.user_name,
          bid_price: updatedbids.rating,
          buyer_email: updatedbids.user_email

        }
      }
      const result = await bidscollection.updateOne(query, update)
      res.send(result)

    })


    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  }
  finally {

  }

}
run().catch(console.dir)

app.listen(port, () => {
  console.log(`food lovers server is running on port ${port}`);
})