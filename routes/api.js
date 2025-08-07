'use strict';
const axios = require('axios');

const likeStore = {}; // In-memory IP-based like tracking

module.exports = function (app) {

  app.route('/api/stock-prices')
    .get(async function (req, res) {
      try {
        let stocks = req.query.stock;
        const like = req.query.like === 'true';
        const ip = req.ip;

        if (!stocks) {
          return res.status(400).json({ error: 'Stock symbol is required' });
        }

        // Normalize to array
        if (!Array.isArray(stocks)) {
          stocks = [stocks];
        }

        const results = await Promise.all(stocks.map(async stock => {
          const symbol = stock.toUpperCase();

          // Fetch stock data
          const response = await axios.get(`https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${symbol}/quote`);
          const data = response.data;

          if (!data || !data.symbol || !data.latestPrice) {
            throw new Error(`Invalid stock data for ${symbol}`);
          }

          // Handle likes
          if (!likeStore[symbol]) likeStore[symbol] = new Set();
          if (like) likeStore[symbol].add(ip);

          return {
            stock: data.symbol,
            price: data.latestPrice,
            likes: likeStore[symbol].size
          };
        }));

        // Single stock
        if (results.length === 1) {
          return res.json({ stockData: results[0] });
        }

        // Two stocks: add rel_likes
        const [stock1, stock2] = results;
        return res.json({
          stockData: [
            {
              stock: stock1.stock,
              price: stock1.price,
              rel_likes: stock1.likes - stock2.likes
            },
            {
              stock: stock2.stock,
              price: stock2.price,
              rel_likes: stock2.likes - stock1.likes
            }
          ]
        });

      } catch (err) {
        return res.status(500).json({ error: 'Stock data retrieval failed', details: err.message });
      }
    });

};
