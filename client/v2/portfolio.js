// Invoking strict mode https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode#invoking_strict_mode
'use strict';

/*
Description of the available api
GET https://clear-fashion-api.vercel.app/

Search for specific products

This endpoint accepts the following optional query string parameters:

- `page` - page of products to return
- `limit` - number of products to return

GET https://clear-fashion-api.vercel.app/brands

Search for available brands list
*/

// current products on the page
let currentProducts = [];
let currentPagination = {};
let currentBrand = "";
let currentPrice = 0;
let currentDate = "";
let currentSort = "price-asc";
let currentFav = false;
let favorites = [];

let temp_prod = [];

// instantiate the selectors
const selectShow = document.querySelector('#show-select');
const selectPage = document.querySelector('#page-select');
const sectionProducts = document.querySelector('#products');
const spanNbProducts = document.querySelector('#nbProducts');
const selectBrands = document.querySelector('#brand-select');
const spanPrice = document.querySelector('#reasonable_price');
const spanDate = document.querySelector('#recently_released');
const selectSort = document.querySelector('#sort-select');
const spanNbBrands = document.querySelector('#nbBrands');
const spanNbNew = document.querySelector('#nbNew');
const spanp50 = document.querySelector('#p50');
const spanp90 = document.querySelector('#p90');
const spanp95 = document.querySelector('#p95');
const spanLast = document.querySelector('#last_release');
const spanFav = document.querySelector('#favorites');

/**
 * Set global value
 * @param {Array} result - products to display
 * @param {Object} meta - pagination meta info
 */
const setCurrentProducts = ({result, meta}, brand, price, date, sort, fav) => {
  currentProducts = result;
  currentPagination = meta;
  currentBrand = brand;
  currentPrice = price;
  currentDate = date;
  currentSort = sort;
  currentFav = fav;
};

/**
 * Fetch products from api
 * @param  {Number}  [page=1] - current page to fetch
 * @param  {Number}  [limit=12] - size of the page
 * @return {Object}
 */
const fetchProducts = async (page = 1, limit = 12, brand="", price=0, date = "", sort = "price-asc", fav = false) => {
  try {
    let add = ``;
    if(brand != "") {
      add += `&brand=${brand}`;
    }
    if(price != 0) {
      add += `&price=${price}`;
    }
    if(date != "") {
      add += `&date=${date}`;
    }
    if(fav) {
      add += `&favorites=${favorites}`;
    }
    const response = await fetch(
      `https://clear-fashion-nikikapui.vercel.app/products/search?page=${page}&limit=${limit}&sort=${sort}` + add
    );
    const body = await response.json();

    console.log(body)
    if (body.success !== true) {
      console.error(body);
      return {currentProducts, currentPagination};
    }

    return body.data;
  } catch (error) {
    console.error(error);
    return {currentProducts, currentPagination};
  }
};

const fetchBrands = async (brand) => {
  try {
    const response = await fetch(
      `https://clear-fashion-nikikapui.vercel.app/brands`
    );
    const body = await response.json();

    if (body.success !== true) {
      return {currentProducts, currentPagination};
    }
    return body.data;
  } catch (error) {
    console.error(error);
    return {currentProducts, currentPagination};
  }
};

/**
 * Render list of products
 * @param  {Array} products
 */
const renderProducts = products => {
  const fragment = document.createDocumentFragment();
  const div = document.createElement('div');

  const template = products
    .map(product => {
      var is_fav = "";
      if(favorites.includes(product._id)) {
        is_fav = "fav_clicked";
      }

      return `
      <div class="product" id=${product._id}>
        <div>
          <span>${product.brand}</span>
          <button class="fav ${is_fav}" type="button" onclick="setFav(this)"><i class="fa fa-star"></i></button>
        </div>
        <a href="${product.link}">${product.name}</a>
        <span>${product.price}</span>
      </div>
    `;
    })
    .join('');

  div.innerHTML = template;
  fragment.appendChild(div);
  sectionProducts.innerHTML = '<h2>Products</h2>';
  sectionProducts.appendChild(fragment);
};

/**
 * Render page selector
 * @param  {Object} pagination
 */
const renderPagination = pagination => {
  const {currentPage, pageCount} = pagination;
  const options = Array.from(
    {'length': pageCount},
    (value, index) => `<option value="${index + 1}">${index + 1}</option>`
  ).join('');

  selectPage.innerHTML = options;
  selectPage.selectedIndex = currentPage - 1;
};

/**
 * Render page selector
 * @param  {Object} pagination
 */
const renderIndicators = async pagination => {
  const {count, newCount, p50, p90, p95, lastDate} = pagination;

  spanNbProducts.innerHTML = count;

  const brands = await fetchBrands();
  spanNbBrands.innerHTML = brands.result.length;

  spanNbNew.innerHTML = newCount;
  spanp50.innerHTML = p50;
  spanp90.innerHTML = p90;
  spanp95.innerHTML = p95;
  spanLast.innerHTML = new Date(lastDate).toISOString().slice(0, 10);
};

const renderBrands = async () => {
  const brands = await fetchBrands();
  setBrands(brands.result);
}

function setBrands(brands) {
  var options = ["<option value=\"\">Choose brand</option>"];
  for (let i = 0; i < brands.length; i++) { 
    const option = ["<option value=\"", brands[i], "\">", brands[i], "</option>"].join('');
    options.push(option);
  }
  selectBrands.innerHTML = options.join('');

  var optionToSelect = selectBrands.querySelector("option[value='" + currentBrand + "']");
  if (optionToSelect) {
    optionToSelect.selected = true;
  }
}

const render = (products, pagination) => {
  renderProducts(products);
  renderPagination(pagination);
  renderIndicators(pagination);
  renderBrands();
};

/**
 * Declaration of all Listeners
 */

/**
 * Select the number of products to display
 */
selectShow.addEventListener('change', async (event) => {
  const products = await fetchProducts(1, parseInt(event.target.value), currentBrand, currentPrice, currentDate, currentSort, currentFav);

  setCurrentProducts(products, currentBrand, currentPrice, currentDate, currentSort, currentFav);
  render(currentProducts, currentPagination);
});

document.addEventListener('DOMContentLoaded', async () => {
  favorites = JSON.parse(localStorage.getItem('favorites'));
  const products = await fetchProducts();

  if(favorites == null) {
    favorites = []
  }

  setCurrentProducts(products, currentBrand, currentPrice, currentDate, currentSort, currentFav);
  render(currentProducts, currentPagination);
});

selectPage.addEventListener('change', async (event) => {
  const products = await fetchProducts(parseInt(event.target.value), currentPagination.pageSize, currentBrand, currentPrice, currentDate, currentSort, currentFav);

  setCurrentProducts(products, currentBrand, currentPrice, currentDate, currentSort, currentFav);
  render(currentProducts, currentPagination);
});

selectBrands.addEventListener('change', async (event) => {
  const products = await fetchProducts(1, currentPagination.pageSize, event.target.value, currentPrice, currentDate, currentSort, currentFav); 

  setCurrentProducts(products, event.target.value, currentPrice, currentDate, currentSort, currentFav);
  render(currentProducts, currentPagination);
});

spanPrice.addEventListener('click', async (event) => {
  let price = 0;
  if (currentPrice==0) {
    price = 50;
    spanPrice.classList.add('checked');
  }
  else {
    spanPrice.classList.remove('checked');
  }
  
  const products = await fetchProducts(1, currentPagination.pageSize, currentBrand, price, currentDate, currentSort, currentFav);

  setCurrentProducts(products, currentBrand, price, currentDate, currentSort, currentFav);
  render(currentProducts, currentPagination);
});

spanDate.addEventListener('click', async (event) => {
  let date = "";
  if (currentDate == "") {
    date = new Date(new Date().getTime() - (14 * 24 * 60 * 60 * 1000));
    spanDate.classList.add('checked');
  }
  else {
    spanDate.classList.remove('checked');
  }

  const products = await fetchProducts(1, currentPagination.pageSize, currentBrand, currentPrice, date, currentSort, currentFav);
  
  setCurrentProducts(products, currentBrand, currentPrice, date, currentSort, currentFav);
  render(currentProducts, currentPagination);
});

selectSort.addEventListener('change', async (event) => {
  const products = await fetchProducts(1, currentPagination.pageSize, currentBrand, currentPrice, currentDate, event.target.value, currentFav);

  setCurrentProducts(products, currentBrand, currentPrice, currentDate, event.target.value, currentFav);

  console.log(currentSort);
  render(currentProducts, currentPagination);
});

const setFav = (button) => {
  if(!favorites.includes(button.parentNode.parentNode.id)) {
    favorites.push(button.parentNode.parentNode.id);
    button.classList.add('fav_clicked');
  }
  else {
    let index = favorites.indexOf(button.parentNode.parentNode.id);
    if (index !== -1) {
      favorites.splice(index, 1); // remove 1 element starting from the index
    }
    button.classList.remove('fav_clicked');
  }

  localStorage.setItem('favorites', JSON.stringify(favorites));
}

spanFav.addEventListener('click', async (event) => {
  let fav = false;
  if (!currentFav) {
    fav = true;
    spanFav.classList.add('checked');
  }
  else {
    spanFav.classList.remove('checked');
  }

  const products = await fetchProducts(1, currentPagination.pageSize, currentBrand, currentPrice, currentDate, currentSort, fav);

  setCurrentProducts(products, currentBrand, currentPrice, currentDate, currentSort, fav);
  render(currentProducts, currentPagination);
});