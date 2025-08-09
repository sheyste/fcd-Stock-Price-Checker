# Stock Price Checker

This is the boilerplate for the Stock Price Checker project. Instructions for building your project can be found at https://freecodecamp.org/learn/information-security/information-security-projects/stock-price-checker



add this cot code `.set('x-forwarded-for', '111.111.233.143')` to ``test/2_function-test.js`` if you are having error in testing:


like this:

```
var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
  this.timeout(10000);
    
    suite('GET /api/stock-prices => stockData object', function() {
      
      test('1 stock', function(done) {
       chai.request(server)
        .get('/api/stock-prices')
        .set('x-forwarded-for', '111.111.233.143') 
        .query({stock: 'goog'})
        .end(function(err, res){
          assert.equal(res.body.stockData.stock, 'goog')
          assert.isNumber(res.body.stockData.price)
           assert.isNumber(res.body.stockData.likes)
          done();
        });
      });
      
      test('1 stock with like', function(done) {
        chai.request(server)
        .get('/api/stock-prices')
        .set('x-forwarded-for', '111.111.233.143') 
        .query({stock: 'aapl', like: true})
        .end(function(err, res){
          assert.equal(res.body.stockData.stock, 'aapl')
          assert.equal(res.body.stockData.likes, 1)
          done();
        });
      });
      
      test('1 stock with like again (ensure likes arent double counted)', function(done) {
        chai.request(server)
        .get('/api/stock-prices')
        .set('x-forwarded-for', '111.111.233.143') 
        .query({stock: 'aapl', like: true})
        .end(function(err, res){
          assert.equal(res.body, 'Error: Only 1 Like per IP Allowed')
          done()
        });
      });
      
      test('2 stocks', function(done) {
        chai.request(server)
        .get('/api/stock-prices')
        .set('x-forwarded-for', '111.111.233.143') 
        .query({stock: ['aapl', 'amzn']})
        .end(function(err, res){
          let stockData = res.body['stockData']
          assert.isArray(stockData)
          /* Stocks can come in either order */
          if(stockData[0].stock === 'aapl'){
            assert.equal(stockData[0].stock, 'aapl')
            assert.equal(stockData[0].rel_likes, 1)
            assert.equal(stockData[1].stock, 'amzn')
            assert.equal(stockData[1].rel_likes, -1)
          }else{
            assert.equal(stockData[1].stock, 'aapl')
            assert.equal(stockData[1].rel_likes, 1)
            assert.equal(stockData[0].stock, 'amzn')
            assert.equal(stockData[0].rel_likes, -1)
          }
          done()
        });
      });
      
      test('2 stocks with like', function(done) {
        chai.request(server)
        .get('/api/stock-prices')
        .set('x-forwarded-for', '111.111.233.143') 
        .query({stock: ['spot', 'amzn'], like: true})
        .end(function(err, res){
          let stockData = res.body.stockData
          if(stockData[0]['stock'] === 'spot'){
            assert.equal(stockData[0].stock, 'spot')
            assert.equal(stockData[0].rel_likes, 0)
            assert.equal(stockData[1].stock, 'amzn')
            assert.equal(stockData[1].rel_likes, 0)
          }else{
            assert.equal(stockData[1].stock, 'spot')
            assert.equal(stockData[1].rel_likes, 0)
            assert.equal(stockData[0].stock, 'amzn')
            assert.equal(stockData[0].rel_likes, 0)
          }
          done()
        });
      });
      
    });

});

```
