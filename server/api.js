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
  let fav = request.query.favorites;

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
    find["scrape_date"] = {$gt: new Date(date).toISOString()};
  }
  if(sorting == undefined) {
    sorting = "price-asc";
  }
  if(fav != undefined) {
    fav = fav.split(",");
    fav = fav.map(id => ObjectId(id))

    find["_id"] = {$in: fav};
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
      sort["scrape_date"] = -1;
      break;
    case "date-desc":
      sort["scrape_date"] = 1;
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

    if(page > Math.ceil(result.length/parseInt(limit))) {
      page = 1;
    }

    end_result["success"] = true;
    end_result["data"]["meta"]["count"] = result.length;
    end_result["data"]["meta"]["currentPage"] = parseInt(page);
    end_result["data"]["meta"]["pageCount"] = Math.ceil(result.length/parseInt(limit));
    end_result["data"]["meta"]["pageSize"] = parseInt(limit);

    end_result["data"]["meta"]["newCount"] = result.filter(product => {
      return new Date(product.scrape_date) > new Date(new Date().getTime() - (14 * 24 * 60 * 60 * 1000)) ;
    }).length;

    if(result.length != 0) {
      const temp_p_value = [...result].sort((A_prod, B_prod) => (B_prod.price - A_prod.price));
      const p50_index = Math.floor(temp_p_value.length * 0.5);
      end_result["data"]["meta"]["p50"] = temp_p_value[p50_index].price;
      const p90_index = Math.floor(temp_p_value.length * 0.9);
      end_result["data"]["meta"]["p90"] = temp_p_value[p90_index].price;
      const p95_index = Math.floor(temp_p_value.length * 0.95);
      end_result["data"]["meta"]["p95"] = temp_p_value[p95_index].price;

      end_result["data"]["meta"]["lastDate"] = [...result].sort((A_prod, B_prod) => (new Date(B_prod.released) - new Date(A_prod.released)))[0].scrape_date;
    }
    else {
      end_result["data"]["meta"]["p50"] = 0;
      end_result["data"]["meta"]["p90"] = 0;
      end_result["data"]["meta"]["p95"] = 0;
      end_result["data"]["meta"]["lastDate"] = new Date();
    }

    end_result["data"]["result"] = result.slice((parseInt(page) - 1) * parseInt(limit), parseInt(page) * parseInt(limit));
    response.send(end_result);
  }
  catch(error){
    console.log(error)

    end_result["success"] = false;
    end_result["data"] = "Invalid parameters";
    
    response.send(end_result);
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
