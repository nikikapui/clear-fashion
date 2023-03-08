const e = require('cors');
const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const {MongoClient} = require('mongodb');
const ObjectId = require('mongodb').ObjectId;

const PORT = 8092;

const app = express();

module.exports = app;

app.use(require('body-parser').json());
app.use(cors());
app.use(helmet());

app.options('*', cors());

app.get('/', (request, response) => {
  response.send({'ack': true, 'test': true});
});

app.get('/products/search', async (request, response) => {
  const MONGODB_URI = 'mongodb+srv://admin:yYpKroykl1yW4Mai@clusterniki.d5csiu7.mongodb.net/?retryWrites=true&w=majority';
  const MONGODB_DB_NAME = 'clearfashion';

  const client = await MongoClient.connect(MONGODB_URI, {'useNewUrlParser': true});
  const db =  client.db(MONGODB_DB_NAME);

  const collection = db.collection('products');

  let limit = request.query.limit;
  const brand = request.query.brand;
  const price = request.query.price;
  let page = request.query.page;

  const find = {};

  if(limit == undefined) {
    limit = 12;
  }
  if(page == undefined) {
    page = 1;
  }
  if(brand != undefined) {
    find["brand"] = brand;
  }
  if(price != undefined) {
    find["price"] = {$lt: parseInt(price)};
  }

  try{
    let end_result = {
      "meta": {},
      "result": []
    };
    const result = await collection.find(find).sort({price: 1}).toArray();

    end_result["meta"]["count"] = result.length;
    end_result["meta"]["currentPage"] = parseInt(page);
    end_result["meta"]["pageCount"] = Math.ceil(result.length/parseInt(limit));
    end_result["meta"]["pageSize"] = parseInt(limit);
    end_result["result"] = result.slice(parseInt(page) - 1, parseInt(page) - 1 + parseInt(limit));
    response.send(end_result);
  }
  catch{
    response.send("Invalid parameters");
  }
});

app.get('/products/:id', async (request, response) => {
  const MONGODB_URI = 'mongodb+srv://admin:yYpKroykl1yW4Mai@clusterniki.d5csiu7.mongodb.net/?retryWrites=true&w=majority';
  const MONGODB_DB_NAME = 'clearfashion';

  const client = await MongoClient.connect(MONGODB_URI, {'useNewUrlParser': true});
  const db =  client.db(MONGODB_DB_NAME);

  const collection = db.collection('products');

  try {
    const result = await collection.findOne({_id: ObjectId(request.params.id) });
    response.send(result);
  }
  catch {
    response.send("Invalid id");
  }
});

app.listen(PORT);

console.log(`📡 Running on port ${PORT}`);
