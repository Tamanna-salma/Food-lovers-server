const express= require('express');
const cors=require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const app=express();
const port=process.env.PORT || 3000;

//moddleware
 app.use(cors());
 app .use(express.json())

 const uri = "mongodb+srv://FoodDbUser:UvKhroTORGNUthwq@cluster0.nlnjuiz.mongodb.net/?appName=Cluster0";

 const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
  app.get('/',(req,res)=>{
    res.send('food lovers server is running')

 })

 async function run(){
    try{

          await client.connect();
          const db=client.db('Food_db');
const foodCollection=db.collection('foods');

app.post('/foods',async(req,res)=>{
    const newFood=req.body;
    const result=await foodCollection.insertOne(newFood);
    res.send(result);
})

           await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");    
    }
    finally{

    }

 }
 run().catch(console.dir)

app.listen(port,()=>{
 console.log(`food lovers server is running on port ${port}`);
 })