const fs = require('fs');
const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const port = 3000;

app.get('/search', async (req, res) => {
  console.log("entered get");
  
  const keyword = req.query.keyword;

  if (!keyword) {
    return res.status(400).json({ error: 'Keyword is required.' });
  }

  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Navigate to Amazon and search for the keyword
    await page.goto(`https://www.amazon.com/s?k=${encodeURIComponent(keyword)}`);

    // Extract details of the first 4 products
    const products = await page.evaluate(() => {
      const results = [];
      const items = document.querySelectorAll('.s-result-item');

      for (let i = 0; i < Math.min(4, items.length); i++) {
        const name = items[i].querySelector('h2 span')?.innerText.trim() || 'N/A';
        const description = items[i].querySelector('.s-title-instructions-style')?.innerText.trim() || 'N/A';
        const rating = items[i].querySelector('.a-icon-star-small .a-icon-alt')?.innerText.trim() || 'N/A';
        const reviews = items[i].querySelector('.s-item__reviews')?.innerText.trim().replace(/\D/g, '') || 'N/A';
        const price = items[i].querySelector('.a-offscreen')?.innerText.trim() || 'N/A';

        results.push({ name, description, rating, reviews, price });
      }

      return results;
    });

    await browser.close();

    // Convert the JSON object to a string
    const jsonString = JSON.stringify(products);

    // Write the JSON string to a file
    fs.writeFile('output.txt', jsonString, (err) => {
      if (err) {
        console.error('Error writing to file:', err);
        res.status(500).send('Error writing to file');
      } else {
        console.log('Data saved to output.txt');
        // Send the JSON response to the client
        res.json(products);
      }
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
