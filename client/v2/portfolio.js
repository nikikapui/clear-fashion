// Invoking strict mode https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode#invoking_strict_mode
'use strict';

/*
Description of the available api
GET https://clear-fashion-api.vercel.app/

Search for specific products

This endpoint accepts the following optional query string parameters:

- `page` - page of products to return
- `size` - number of products to return

GET https://clear-fashion-api.vercel.app/brands

Search for available brands list
*/

// current products on the page
let currentProducts = [];
let currentPagination = {};
let currentBrand = "";
let favorites = [];

let temp_prod = [];

let brandFilter = false;
let brand = "";
let priceFilter = false;
let dateFilter = false;
let sorting_method = "price-asc";
let favFilter = false;

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
const p50 = document.querySelector('#p50');
const p90 = document.querySelector('#p90');
const p95 = document.querySelector('#p95');
const spanLast = document.querySelector('#last_release');
const spanFav = document.querySelector('#favorites');

/**
 * Set global value
 * @param {Array} result - products to display
 * @param {Object} meta - pagination meta info
 */
const setCurrentProducts = ({result, meta}, brand) => {
  currentProducts = result;
  currentPagination = meta;
  currentBrand = brand;
};

/**
 * Fetch products from api
 * @param  {Number}  [page=1] - current page to fetch
 * @param  {Number}  [size=12] - size of the page
 * @return {Object}
 */
const fetchProducts = async (page = 1, size = 12) => {
  try {
    const response = await fetch(
      `https://clear-fashion-nikikapui.vercel.app/products/search?page=${page}&size=${size}`
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
      `https://clear-fashion-api.vercel.app/brands`
    );
    const body = await response.json();

    if (body.success !== true) {
      return selectBrands;
    }
    return body.data;
  } catch (error) {
    console.error(error);
    return selectBrands;
  }
};


const getProducts = async () => {
  var products = {};
  if(brandFilter || priceFilter || dateFilter || (sorting_method !="") || favFilter) {
    const temp = currentPagination.pageSize;
    const test = await fetchProducts(1, 1);
    products = await fetchProducts(1, test.meta.count);

    temp_prod = products.result;
    if(brandFilter) {
      temp_prod = temp_prod.filter(product => {
        return product.brand == brand;
      });
    }
    if(priceFilter) {
      temp_prod = temp_prod.filter(product => {
        return product.price < 50;
      });
    }
    if(dateFilter) {
      temp_prod = temp_prod.filter(product => {
        return new Date(product.released) > new Date(new Date().getTime() - (14 * 24 * 60 * 60 * 1000)) ;
      });
    }
    if(favFilter) {
      temp_prod = temp_prod.filter(product => {
        return favorites.includes(product.uuid);
      });
    }

    switch(sorting_method) {
      case "price-asc":
        temp_prod.sort((A_prod, B_prod) => (A_prod.price - B_prod.price));
        break;
      case "price-desc":
        temp_prod.sort((A_prod, B_prod) => (B_prod.price - A_prod.price));
        break;
      case "date-asc":
        temp_prod.sort((A_prod, B_prod) => (new Date(B_prod.released) - new Date(A_prod.released)));
        break;
      case "date-desc":
        temp_prod.sort((A_prod, B_prod) => (new Date(A_prod.released) - new Date(B_prod.released)));
        break;
    }

    products.meta.count =  temp_prod.length;
    products.meta.pageSize = temp;
    products.meta.currentPage = 1;
    products.meta.pageCount = Math.ceil(temp_prod.length / temp);
    products.result = temp_prod.slice(0,products.meta.pageSize);
  }
  else {
    temp_prod = [];
    products = await fetchProducts(1, currentPagination.pageSize);
  }

  return products;
}

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
      if(favorites.includes(product.uuid)) {
        is_fav = "fav_clicked";
      }

      return `
      <div class="product" id=${product.uuid}>
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
  const {count} = pagination;

  spanNbProducts.innerHTML = count;

  const brands = await fetchBrands();
  spanNbBrands.innerHTML = brands.result.length;

  let temp_new = 0;
  let temp_p_value = [];
  let temp_last = {};
  if(brandFilter || priceFilter || dateFilter || favFilter) {
    temp_new = temp_prod.filter(product => {
      return new Date(product.released) > new Date(new Date('2022-10-12').getTime() - (14 * 24 * 60 * 60 * 1000)) ;
    }).length;

    temp_p_value = [...temp_prod].sort((A_prod, B_prod) => (B_prod.price - A_prod.price));

    temp_last = [...temp_prod].sort((A_prod, B_prod) => (new Date(B_prod.released) - new Date(A_prod.released)));
  }
  else {
    const test = await fetchProducts(1, 1);
    const products = await fetchProducts(1, test.meta.count);
    
    temp_new = products.result.filter(product => {
      return new Date(product.released) > new Date(new Date('2022-10-12').getTime() - (14 * 24 * 60 * 60 * 1000)) ;
    }).length;

    temp_p_value = [...products.result].sort((A_prod, B_prod) => (B_prod.price - A_prod.price));

    temp_last = [...products.result].sort((A_prod, B_prod) => (new Date(B_prod.released) - new Date(A_prod.released)));
  }
  spanNbNew.innerHTML = temp_new;

  if(temp_p_value.length != 0) {
    const p50_index = Math.floor(temp_p_value.length * 0.5);
    p50.innerHTML = temp_p_value[p50_index].price;
    const p90_index = Math.floor(temp_p_value.length * 0.9);
    p90.innerHTML = temp_p_value[p90_index].price;
    const p95_index = Math.floor(temp_p_value.length * 0.95);
    p95.innerHTML = temp_p_value[p95_index].price;
  }
  else{
    p50.innerHTML = 0;
    p90.innerHTML = 0;
    p95.innerHTML = 0;
  }

  if (temp_last.length != 0) {
    spanLast.innerHTML = temp_last[0].released;
  }
  else {
    spanLast.innerHTML = "";
  }
  

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
  let products = { 
    "meta" : {},
    "result" : []
  };
  if(brandFilter || priceFilter || dateFilter || (sorting_method !="") || favFilter) {
    products.meta.count =  temp_prod.length;
    products.meta.pageSize = parseInt(event.target.value);
    products.meta.pageCount = Math.ceil(temp_prod.length / parseInt(event.target.value));
    products.result = temp_prod.slice(0,products.meta.pageSize);
  }
  else {
    products = await fetchProducts(1, parseInt(event.target.value));
  }

  products.meta.currentPage = 1;

  setCurrentProducts(products, currentBrand);
  render(currentProducts, currentPagination);
});

document.addEventListener('DOMContentLoaded', async () => {
  favorites = JSON.parse(localStorage.getItem('favorites'));
  const products = await fetchProducts();

  if(favorites == null) {
    favorites = []
  }

  setCurrentProducts(products, currentBrand);
  render(currentProducts, currentPagination);
});

selectPage.addEventListener('change', async (event) => {
  let products = { 
    "meta" : {},
    "result" : []
  };
  if(brandFilter || priceFilter || dateFilter || (sorting_method !="") || favFilter) {
    products.meta.count =  temp_prod.length;
    products.meta.pageSize = currentPagination.pageSize;
    products.meta.currentPage = parseInt(event.target.value);
    products.meta.pageCount = Math.ceil(temp_prod.length / currentPagination.pageSize);
    products.result = temp_prod.slice((products.meta.currentPage - 1) * products.meta.pageSize, (products.meta.currentPage * products.meta.pageSize));
  }
  else {
    products = await fetchProducts(parseInt(event.target.value), currentPagination.pageSize);
  }

  setCurrentProducts(products, currentBrand);
  render(currentProducts, currentPagination);
});

selectBrands.addEventListener('change', async (event) => {
  if (event.target.value === "") {
    brandFilter = false;
    brand = "";
  }
  else {
    brandFilter = true;
    brand = event.target.value;
  }

  const products = await getProducts();
  setCurrentProducts(products, event.target.value);
  render(currentProducts, currentPagination);
});

spanPrice.addEventListener('click', async (event) => {
  if (!priceFilter) {
    priceFilter = true;
    spanPrice.classList.add('checked');
  }
  else {
    priceFilter = false;
    spanPrice.classList.remove('checked');
  }
  
  const products = await getProducts();
  setCurrentProducts(products, currentBrand);
  render(currentProducts, currentPagination);
});

spanDate.addEventListener('click', async (event) => {
  if (!dateFilter) {
    dateFilter = true;
    spanDate.classList.add('checked');
  }
  else {
    dateFilter = false;
    spanDate.classList.remove('checked');
  }
  
  const products = await getProducts();
  setCurrentProducts(products, currentBrand);
  render(currentProducts, currentPagination);
});

selectSort.addEventListener('change', async (event) => {
  sorting_method = event.target.value;

  const products = await getProducts();
  setCurrentProducts(products, event.target.value);
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
  if (!favFilter) {
    favFilter = true;
    spanFav.classList.add('checked');
  }
  else {
    favFilter = false;
    spanFav.classList.remove('checked');
  }
  
  const products = await getProducts();
  setCurrentProducts(products, currentBrand);
  render(currentProducts, currentPagination);
});