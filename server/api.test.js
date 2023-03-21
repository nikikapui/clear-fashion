const request = require('supertest');
const app = require('./api');

describe('GET /products/search', () => {
  test('correct response stucture', async () => {
    const response = await request(app).get('/products/search');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success');
    expect(response.body).toHaveProperty('data');

    if (response.body.success) {
      expect(response.body.data).toHaveProperty('meta');
      expect(response.body.data).toHaveProperty('result');

      expect(response.body.data.meta).toHaveProperty('count');
      expect(response.body.data.meta).toHaveProperty('currentPage');
      expect(response.body.data.meta).toHaveProperty('pageCount');
      expect(response.body.data.meta).toHaveProperty('pageSize');
      expect(response.body.data.meta).toHaveProperty('newCount');
      expect(response.body.data.meta).toHaveProperty('p50');
      expect(response.body.data.meta).toHaveProperty('p90');
      expect(response.body.data.meta).toHaveProperty('p95');
      expect(response.body.data.meta).toHaveProperty('lastDate');
    }
  });

  test('correct limit and pageCount', async () => {
    const response = await request(app).get('/products/search?limit=13');
    expect(response.body.data.meta.pageSize).toBe(13);
    expect(response.body.data.meta.pageCount).toBe(Math.ceil(response.body.data.meta.count / 13))
  });

  test('correct brands', async () => {
    const response = await request(app).get('/products/search?brand=DEDICATED');
    Object.values(response.body.data.result).every((item) =>
      expect(item.brand).toBe("DEDICATED")
    );
  });

  test('lower then given price', async () => {
    const response = await request(app).get('/products/search?price=130');
    Object.values(response.body.data.result).every((item) =>
      expect(item.price).toBeLessThan(130)
    );
  });

  test('correct page', async () => {
    const response = await request(app).get('/products/search?page=2');
    expect(response.body.data.meta.currentPage).toBe(2)

    const response_2 = await request(app).get('/products/search?page=200000');
    expect(response_2.body.data.meta.currentPage).toBe(1)
  });

  test('more recent then given date', async () => {
    const response = await request(app).get('/products/search?date=2023-03-08');
    Object.values(response.body.data.result).every((item) =>
      expect(new Date(item.scrape_date).getMilliseconds()).toBeGreaterThan(new Date("2023-03-08").getMilliseconds())
    );
  });

  test('currect sorting methods', async () => {
    let response = await request(app).get('/products/search?sort=price-asc');
    
    let sortedArray = [...response.body.data.result].sort((A_prod, B_prod) => (A_prod.price - B_prod.price));
    expect(response.body.data.result).toEqual(sortedArray);

    response = await request(app).get('/products/search?sort=price-desc');
    
    sortedArray = [...response.body.data.result].sort((A_prod, B_prod) => (B_prod.price - A_prod.price));
    expect(response.body.data.result).toEqual(sortedArray);

    response = await request(app).get('/products/search?sort=date-asc');
    
    sortedArray = [...response.body.data.result].sort((A_prod, B_prod) => (new Date(B_prod.scrape_date) - new Date(A_prod.scrape_date)));
    expect(response.body.data.result).toEqual(sortedArray);

    response = await request(app).get('/products/search?sort=date-desc');
    
    sortedArray = [...response.body.data.result].sort((A_prod, B_prod) => (new Date(A_prod.scrape_date) - new Date(B_prod.scrape_date)));
    expect(response.body.data.result).toEqual(sortedArray);
  });
});

describe('GET /brands', () => {
  test('correct response stucture', async () => {
    const response = await request(app).get('/brands');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success');
    expect(response.body).toHaveProperty('data');

    if (response.body.success) {
      expect(response.body.data).toHaveProperty('result');
    }
  });
  test('correct brands', async () => {
    const response = await request(app).get('/brands');
  
    expect(new Set(response.body.data.result)).toEqual(new Set(['DEDICATED', 'Circle Sportswear', 'Montlimart']))
  });
});