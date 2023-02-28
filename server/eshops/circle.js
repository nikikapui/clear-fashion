const fetch = require('node-fetch');
const cheerio = require('cheerio');

/**
 * Parse webpage e-shop
 * @param  {String} data - html response
 * @return {Array} products
 */
const parse = data => {
  const $ = cheerio.load(data);
  return $('.product-grid .grid__item')
    .map((i, element) => {
      const name = $(element)
        .find('.card__heading')
        .find('.full-unstyled-link')
        .text()
        .split("\n")[1]
        .trim();
      const price = parseInt(
          $(element)
          .find('.price__regular')
          .find('.money')
          .text()
          .slice(1)
      );

      return {name, price};
    })
    .get();
};

/**
 * Scrape all the products for a given url page
 * @param  {[type]}  url
 * @return {Array|null}
 */
module.exports.scrape = async url => {
  try {
    const response = await fetch(url);

    if (response.ok) {
      const body = await response.text();

      return parse(body);
    }

    console.error(response);

    return null;
  } catch (error) {
    console.error(error);
    return null;
  }
};
