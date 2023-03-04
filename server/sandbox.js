/* eslint-disable no-console, no-process-exit */
const { json } = require('express');
const dedicatedbrand = require('./eshops/dedicatedbrand');
const montlimart = require('./eshops/montlimart');
const circle = require('./eshops/circle');

async function sandbox (eshop = 'https://www.dedicatedbrand.com/en/men/news') {
  try {
    console.log(`🕵️‍♀️  browsing ${eshop} eshop`);

    const products = await montlimart.scrape(eshop);

    console.log(JSON.stringify(products));
    console.log('done');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

const [,, eshop] = process.argv;

sandbox(eshop);
