const axios = require('axios');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const params = event.queryStringParameters || {};
    const { filters, sort, limit } = params;
    const maxTickers = parseInt(limit) || 50;

    const requestHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Connection': 'keep-alive',
      'Referer': 'https://finviz.com/'
    };

    const foundTickers = new Set();
    const tickersPerPage = 20;
    const pagesNeeded = Math.ceil(maxTickers / tickersPerPage);

    // Boucle sur les pages Finviz (r=1, r=21, r=41, ...)
    for (let page = 0; page < pagesNeeded && foundTickers.size < maxTickers; page++) {
      const startRow = page * tickersPerPage + 1;
      const finvizUrl = `https://finviz.com/screener.ashx?v=141&f=${filters || 'sec_healthcare'}&o=${sort || '-perf1w'}&r=${startRow}`;

      try {
        const response = await axios.get(finvizUrl, { headers: requestHeaders, timeout: 15000 });
        const html = response.data;

        // Extraire les tickers de cette page
        const patterns = [
          /quote\.ashx\?t=([A-Z]{1,5})&/g,
          /href="quote\.ashx\?t=([A-Z]{1,5})"/g
        ];

        let tickersFoundOnPage = 0;
        for (const pattern of patterns) {
          let match;
          while ((match = pattern.exec(html)) !== null) {
            if (!foundTickers.has(match[1])) {
              foundTickers.add(match[1]);
              tickersFoundOnPage++;
            }
          }
        }

        // Si aucun nouveau ticker trouvé, on a atteint la fin
        if (tickersFoundOnPage === 0) {
          break;
        }

        // Pause entre les requêtes pour éviter le rate limiting
        if (page < pagesNeeded - 1 && foundTickers.size < maxTickers) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      } catch (pageError) {
        console.error(`Erreur page ${page + 1}:`, pageError.message);
        break;
      }
    }

    const tickers = [...foundTickers].slice(0, maxTickers);
    const result = { tickers, timestamp: new Date().toISOString() };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.error('Finviz error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
