const e = require('cors');
const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const {MongoClient} = require('mongodb');
const ObjectId = require('mongodb').ObjectId;

const PORT = 8092;

const app = express();

const MONGODB_URI = 'mongodb+srv://admin:yYpKroykl1yW4Mai@clusterniki.d5csiu7.mongodb.net/?retryWrites=true&w=majority';
const MONGODB_DB_NAME = 'clearfashion';

const client = new MongoClient(MONGODB_URI, {'useNewUrlParser': true});

module.exports = app;

app.use(require('body-parser').json());
app.use(cors());
app.use(helmet());

app.options('*', cors());

app.get('/', (request, response) => {
  response.send({'ack': true, 'test': true});
});


app.get('/products/search', async (request, response) => {
  const connection = await client.connect();
  const db =  connection.db(MONGODB_DB_NAME);

  const collection = db.collection('products');

  let limit = request.query.limit;
  const brand = request.query.brand;
  const price = request.query.price;
  let page = request.query.page;
  let date = request.query.date;
  let sorting = request.query.sort;

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
  if(date != undefined) {
    find["scrape_date"] = {$gt: new Date(date).toISOString};
    response.send(find);
  }
  if(sorting == undefined) {
    sorting = "price-asc"
  }

  const sort = {};

  switch(sorting) {
    case "price-asc":
      sort["price"] = 1;
      break;
    case "price-desc":
      sort["price"] = -1;
      break;
    case "date-asc":
      sort["scrape_date"] = 1;
      break;
    case "date-desc":
      sort["scrape_date"] = -1;
      break;
  }


  let end_result = {
    "success": "",
    "data": {
      "meta": {},
      "result": []
    }
  };
  try{
    const result = await collection.find(find).sort(sort).toArray();

    client.close();

    end_result["success"] = true;
    end_result["data"]["meta"]["count"] = result.length;
    end_result["data"]["meta"]["currentPage"] = parseInt(page);
    end_result["data"]["meta"]["pageCount"] = Math.ceil(result.length/parseInt(limit));
    end_result["data"]["meta"]["pageSize"] = parseInt(limit);
    end_result["data"]["result"] = result.slice((parseInt(page) - 1) * parseInt(limit), parseInt(page) * parseInt(limit));
    response.send(end_result);
  }
  catch{
    end_result["success"] = false;
    end_result["data"] = "Invalid parameters";
    //response.send(end_result);
  }
});

app.get('/brands', async (request, response) => {
  const connection = await client.connect();
  const db =  connection.db(MONGODB_DB_NAME);

  const collection = db.collection('products');

  let end_result = {
    "success": "",
    "data": {
      "result": []
    }
  };
  try {
    const result = await collection.distinct('brand');

    client.close();

    end_result["success"] = true;
    end_result["data"]["result"] = result;
    response.send(end_result);
  }
  catch {
    end_result["success"] = false;
    end_result["data"] = "Could not find brands";
    response.send(end_result);
  }
});

//TODO response formatting
app.get('/products/:id', async (request, response) => {
  const connection = await client.connect();
  const db =  connection.db(MONGODB_DB_NAME);

  const collection = db.collection('products');

  try {
    const result = await collection.findOne({_id: ObjectId(request.params.id) });
    client.close();

    response.send(result);
  }
  catch {
    response.send("Invalid id");
  }
});

app.listen(PORT);

console.log(`📡 Running on port ${PORT}`);
