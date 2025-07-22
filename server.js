const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { Parser } = require('json2csv');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

let claims = {};
const CLAIMS_FILE = './claims.json';
const ALLOWED_FILE = './allowed_badges.json';

if (fs.existsSync(CLAIMS_FILE)) {
  claims = JSON.parse(fs.readFileSync(CLAIMS_FILE));
}

const allowedBadges = fs.existsSync(ALLOWED_FILE)
  ? JSON.parse(fs.readFileSync(ALLOWED_FILE))
  : [];

app.post('/claim', (req, res) => {
  const { badge, drink } = req.body;

  if (!badge || !drink) {
    return res.json({ success: false, message: "Please fill all fields." });
  }

  if (!allowedBadges.includes(badge)) {
    return res.json({ success: false, message: "Badge number not authorized." });
  }

  if (claims[badge]) {
    return res.json({ success: false, message: "You already claimed a drink." });
  }

  claims[badge] = drink;
  fs.writeFileSync(CLAIMS_FILE, JSON.stringify(claims, null, 2));
  res.json({ success: true, message: `Enjoy your ${drink}!` });
});

// Admin page
app.get('/admin', (req, res) => {
  const pass = req.query.pass;
  if (pass !== 'secret123') return res.status(401).send('Unauthorized');

  let html = `<h2>Beer Claims</h2><ul>`;
  for (const [badge, drink] of Object.entries(claims)) {
    html += `<li><strong>${badge}</strong>: ${drink}</li>`;
  }
  html += `</ul><br><a href="/download?pass=${pass}">Download CSV</a>`;
  res.send(html);
});

// CSV download
app.get('/download', (req, res) => {
  const pass = req.query.pass;
  if (pass !== 'secret123') return res.status(401).send('Unauthorized');

  const parser = new Parser({ fields: ['badge', 'drink'] });
  const data = Object.entries(claims).map(([badge, drink]) => ({ badge, drink }));
  const csv = parser.parse(data);

  res.header('Content-Type', 'text/csv');
  res.attachment('beer_claims.csv');
  res.send(csv);
});

app.listen(PORT, () => {
  console.log(`Beer app running on port ${PORT}`);
});
