const {MongoClient} = require('mongodb')
const products = require('./products.json');

async function getDB (products) {
    const MONGODB_URI = 'mongodb+srv://admin:yYpKroykl1yW4Mai@clusterniki.d5csiu7.mongodb.net/?retryWrites=true&w=majority';
    const MONGODB_DB_NAME = 'clearfashion';

    const client = await MongoClient.connect(MONGODB_URI, {'useNewUrlParser': true});
    const db =  client.db(MONGODB_DB_NAME);

    const collection = db.collection('products');
    //const result = collection.insertMany(products);

    //Find all products related to a given brand
    const brand = 'Circle Sportswear';
    let filtered = await collection.find({brand : brand}).toArray();
    console.log(filtered.length)

    //Find all products less than a price
    const price = 100;
    filtered = await collection.find({price : {"$lt" : price}}).toArray();
    console.log(filtered);

    //Find all products sorted by price ascending
    let sorted = await collection.find().sort({price: 1}).toArray();
    console.log(sorted);

    //Find all products sorted by date from most recent to oldest
    sorted = await collection.find().sort({scrape_date: -1}).toArray();
    console.log(sorted);

    //Find all products scraped less than 2 weeks
    const date = new Date(new Date().getTime() - (14 * 24 * 60 * 60 * 1000));
    filtered = await collection.find({scrape_date : {"$gt" : date.toISOString()}}).toArray();
    console.log(filtered);
}

getDB(products);
