'use strict';
const axios = require('axios');

const likeStore = {}; // In-memory like store: { STOCK: Set of IPs }

module.exports = function (app) {
  app.route('/api/stock-prices')
    .get(async function (req, res) {
      try {
        let { stock, like } = req.query;
        const ip = req.ip;

        if (!stock) {
          return res.status(400).json({ error: 'Stock symbol is required' });
        }

        // Normalize to array
        const stocks = Array.isArray(stock) ? stock : [stock];

        const results = await Promise.all(stocks.map(async s => {
          const symbol = s.toUpperCase();

          const response = await axios.get(`https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${symbol}/quote`);
          const data = response.data;

          if (!data || !data.symbol || !data.latestPrice) {
            throw new Error(`Invalid data for ${symbol}`);
          }

          // Initialize like store
          if (!likeStore[symbol]) likeStore[symbol] = new Set();

          // Apply like if requested and not already liked by this IP
          if (like === 'true') {
            likeStore[symbol].add(ip);
          }

          return {
            stock: symbol,
            price: data.latestPrice,
            likes: likeStore[symbol].size
          };
        }));

        if (results.length === 1) {
          return res.json({ stockData: results[0] });
        }

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
