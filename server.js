const express = require("express");
const fs = require("fs")
const app = express();

app.use(express.json());
// 💂 Login guard: runs before EVERY request
app.use(function (req, res, next) {
  // What the browser sent (hidden inside the "authorization" header)
  let header = req.headers.authorization || "";
  let encoded = header.split(" ")[1] || "";
  let decoded = Buffer.from(encoded, "base64").toString();
  let user = decoded.split(":")[0];
  let password = decoded.split(":")[1];

  // Correct? Let them in
  if (user === process.env.APP_USER && password === process.env.APP_PASSWORD) {
    next();
    return;
  }

  // Wrong or missing: ask the browser to show the login popup
  res.set("WWW-Authenticate", 'Basic realm="Tire Express"');
  res.status(401).send("Login required");
});
app.use(express.static("public"));

//--- Database (MongoDB) ---//
const { MongoClient } =
  require("mongodb");
const client = new
  MongoClient(process.env.MONGODB_URI);
let store;

let inventory = [];
let neededTires = [];

async function loadList(name, fileName) {
  let box = await store.findOne({ _id: name });
  if (box) {
    return box.items
  }

  let items = [];
  try {
    items = JSON.parse(fs.readFileSync(fileName, "utf8"));
  } catch (error) {
    items = [];
  }
  await store.replaceOne({ _id: name }, { _id: name, items: items }, { upsert: true });
  console.log("Copied", items.length, "items from", fileName, "into MongoDB");
  return items;
}
function saveList(name, items) {
  store.replaceOne({ _id: name }, { _id: name, items: items }, { upsert: true })
    .catch(function (error) {
      console.log("Save failes:", error.message);
    });
}

function saveTires() {
  saveList("inventory", inventory);
}
function saveNeeded() {
  saveList("needed", neededTires);
}


app.get("/", function (req, res) {
  res.send("Hello from my tire server!");
});

app.get("/api/inventory", function (req, res) {
  res.json(inventory);
});

app.post("/api/inventory", function (req, res) {
  let tire = req.body;

  // Look for a tire that's the same (everything except quantity)
  let sameTire = inventory.find(function (item) {
    return item.brand.toLowerCase() === tire.brand.toLowerCase() &&
      item.size.toLowerCase() === tire.size.toLowerCase() &&
      item.condition === tire.condition &&
      item.price === tire.price;
  });

  // Found one: just add to its quantity
  if (sameTire) {
    sameTire.quantity = sameTire.quantity + tire.quantity;
    saveTires();
    console.log("Merged:", sameTire);
    res.json(sameTire);
    return;
  }

  // Not found: it's a new tire, so give it an ID and add it
  tire.id = Date.now();
  inventory.push(tire);
  saveTires();
  console.log("Added:", tire);
  res.json(tire);
});
app.delete("/api/inventory/:id", function (req, res) {
  let id = Number(req.params.id);

  inventory = inventory.filter(function (tire) {
    return tire.id !== id
  });

  saveTires();
  console.log("Deleted:", id);
  res.json({ ok: true });
})

app.put("/api/inventory/:id", function (req, res) {

  let id = Number(req.params.id);

  let tire = inventory.find(function (item) {
    return item.id === id;
  });

  if (!tire) {
    res.status(404).json({ error: "Tire is nout found" });
    return
  }

  tire.brand = req.body.brand;
  tire.size = req.body.size;
  tire.quantity = req.body.quantity;
  tire.condition = req.body.condition;
  tire.price = req.body.price;

  saveTires();
  console.log("Edited:", tire);
  res.json(tire);
});

app.post("/api/inventory/:id/sell", function (req, res) {
  let id = Number(req.params.id);
  let amount = Number(req.body.amount);

  let tire = inventory.find(function (item) {
    return item.id === id;
  });

  if (!tire) {
    res.status(404).json({ error: "Tire not found" });
    return
  }

  if (amount > tire.quantity) {
    res.status(400).json({ error: "Not enough tire" });
    return
  }

  tire.quantity = tire.quantity - amount;

  if (tire.quantity === 0) {
    inventory = inventory.filter(function (item) {
      return item.id !== id
    })
  }

  saveTires();
  console.log("Sold:", amount, "of", id);
  res.json({ ok: true });
})

app.get("/api/needed", function (req, res) {
  res.json(neededTires)
});

app.post("/api/needed", function (req, res) {
  let tire = req.body;
  tire.id = Date.now();
  neededTires.push(tire);
  saveNeeded();
  console.log("Needed:", tire);
  res.json(tire);
});

// Delete a needed tire by its ID
app.delete("/api/needed/:id", function (req, res) {
  let id = Number(req.params.id);

  neededTires = neededTires.filter(function (tire) {
    return tire.id !== id;
  });

  saveNeeded();
  console.log("Deleted needed:", id);
  res.json({ ok: true });
});

async function start() {
  await client.connect();
  store =
    client.db("tireExpress").collection("store");
  console.log("Connected to MongoDB 🍃");

  inventory = await loadList("inventory", "data.json");
  neededTires = await loadList("needed", "needed.json");

  let port = process.env.PORT || 3000;
  app.listen(port, function () {
    console.log("Server is running on http://localhost:" + port);
  });
}
start();