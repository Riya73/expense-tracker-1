const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cron = require('node-cron');

const app = express();
const port = 3000;
const strapiUrl = 'http://strapi.koders.in/api/expenses/';

app.use(bodyParser.json());

// Utility function to make API requests
const makeRequest = async (method, url, data = null) => {
  try {
    const response = await axios({
      method,
      url,
      data,
      maxBodyLength: Infinity,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// Root route
app.get('/', (req, res) => {
  res.send('Welcome to the Expense Manager API');
});

// CRUD Operations
app.get('/expenses', async (req, res) => {
  try {
    const data = await makeRequest('get', strapiUrl);
    res.json(data);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.post('/expenses', async (req, res) => {
  try {
    const data = await makeRequest('post', strapiUrl, req.body);
    res.json(data);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.put('/expenses/:id', async (req, res) => {
  try {
    const data = await makeRequest('put', `${strapiUrl}${req.params.id}`, req.body);
    res.json(data);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.delete('/expenses/:id', async (req, res) => {
  try {
    const data = await makeRequest('delete', `${strapiUrl}${req.params.id}`);
    res.json(data);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Scheduler to handle recurring expenses
cron.schedule('0 0 * * *', async () => {  // This runs daily at midnight
  try {
    const { data } = await makeRequest('get', strapiUrl);
    data.forEach(async (expense) => {
      if (expense.frequency !== 'One-Time') {
        let increment = 0;
        switch (expense.frequency) {
          case 'Daily':
            increment = expense.base;
            break;
          case 'Weekly':
            increment = expense.base / 7;
            break;
          case 'Monthly':
            increment = expense.base / 30;
            break;
          case 'Quarterly':
            increment = expense.base / 91;
            break;
          case 'Yearly':
            increment = expense.base / 365;
            break;
        }
        expense.amount += increment;
        await makeRequest('put', `${strapiUrl}${expense.id}`, { amount: expense.amount });
      }
    });
  } catch (error) {
    console.error('Failed to update recurring expenses', error);
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
