/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
let mongoose = require('mongoose');
require('dotenv').config();

module.exports = function (app) {
  
  let uri = process.env.DB;
  mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  let stockSchema = new mongoose.Schema({
    symbol: { type: String, required: true },
    likes: { type: Number, default: 0 },
    ips: [String]
  });

  let Stock = mongoose.model('stock', stockSchema);

  app.route('/api/stock-prices')
    .get(function (req, res) {

      let twoStocks = false;
      let stocks = [];

      /* Mock fetch when in test mode */
      const getStockPrice = async (symbol) => {
        if (process.env.NODE_ENV === 'test') {
          return 100 + Math.floor(Math.random() * 100); // fake price
        }
        let requestUrl = `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${symbol}/quote`;
        let apiResponse = await fetch(requestUrl).then(r => r.json());
        return Number(apiResponse['latestPrice']);
      };

      /* Like Stock */
      let likeStock = async (stockName, nextStep) => {
        let stockDocument = await Stock.findOne({ symbol: stockName }).exec();
        if (stockDocument && stockDocument.ips && stockDocument.ips.includes(req.ip)) {
          return res.json('Error: Only 1 Like per IP Allowed');
        } else {
          let documentUpdate = { $inc: { likes: 1 }, $push: { ips: req.ip } };
          nextStep(stockName, documentUpdate, getPrice);
        }
      };

      /* Find/Update Stock Document */
      let findOrUpdateStock = async (stockName, documentUpdate, nextStep) => {
        let stockDocument = await Stock.findOneAndUpdate(
          { symbol: stockName },
          documentUpdate,
          { new: true, upsert: true }
        );
        if (stockDocument) {
          if (!twoStocks) {
            return nextStep(stockDocument, processOneStock);
          } else {
            return nextStep(stockDocument, processTwoStocks);
          }
        }
      };

      /* Get Price */
      let getPrice = async (stockDocument, nextStep) => {
        stockDocument.price = await getStockPrice(stockDocument.symbol);
        nextStep(stockDocument);
      };

      /* Build Response for 1 Stock */
      let processOneStock = (stockDocument) => {
        return res.json({
          stockData: {
            stock: stockDocument.symbol,
            price: stockDocument.price,
            likes: stockDocument.likes
          }
        });
      };

      /* Build Response for 2 Stocks */
      let processTwoStocks = (stockDocument) => {
        let newStock = {
          stock: stockDocument.symbol,
          price: stockDocument.price,
          likes: stockDocument.likes
        };
        stocks.push(newStock);
        if (stocks.length === 2) {
          stocks[0].rel_likes = stocks[0].likes - stocks[1].likes;
          stocks[1].rel_likes = stocks[1].likes - stocks[0].likes;
          return res.json({
            stockData: stocks.map(s => ({
              stock: s.stock,
              price: s.price,
              rel_likes: s.rel_likes
            }))
          });
        }
      };

      /* Process Input */
      if (typeof req.query.stock === 'string') {
        let stockName = req.query.stock.toLowerCase();
        let documentUpdate = {};
        if (req.query.like && req.query.like === 'true') {
          likeStock(stockName, findOrUpdateStock);
        } else {
          findOrUpdateStock(stockName, documentUpdate, getPrice);
        }
      } else if (Array.isArray(req.query.stock)) {
        twoStocks = true;
        let stock1 = req.query.stock[0].toLowerCase();
        let stock2 = req.query.stock[1].toLowerCase();

        if (req.query.like && req.query.like === 'true') {
          likeStock(stock1, findOrUpdateStock);
        } else {
          findOrUpdateStock(stock1, {}, getPrice);
        }

        if (req.query.like && req.query.like === 'true') {
          likeStock(stock2, findOrUpdateStock);
        } else {
          findOrUpdateStock(stock2, {}, getPrice);
        }
      }
    });
};
