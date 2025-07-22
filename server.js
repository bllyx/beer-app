const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

let claims = {};
const CLAIMS_FILE = './claims.json';

// Load existing claims on startup
if (fs.existsSync(CLAIMS_FILE)) {
  claims = JSON.parse(fs.readFileSync(CLAIMS_FILE));
}

app.post('/claim', (req, res) => {
  const { badge, drink } = req.body;
  if (!badge || !drink) {
    return res.json({ success: false, message: "Please fill all fields." });
  }

  if (claims[badge]) {
    return res.json({ success: false, message: "You already claimed a drink." });
  }

  claims[badge] = drink;
  fs.writeFileSync(CLAIMS_FILE, JSON.stringify(claims, null, 2));
  res.json({ success: true, message: `Enjoy your ${drink}!` });
});

app.listen(PORT, () => {
  console.log(`Beer app running on port ${PORT}`);
});
