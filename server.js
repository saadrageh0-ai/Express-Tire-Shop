const express = require("express");
const fs = require("fs");
const crypto = require("crypto");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set("trust proxy", 1);

const WEEK = 7 * 24 * 60 * 60 * 1000;

function makeTicket() {
  let expires = Date.now() + WEEK;
  let signature = crypto.createHmac("sha256", process.env.SESSION_SECRET).update(String(expires)).digest("hex");

  return expires + "." + signature
}

function ticketIsValid(ticket) {
  if (!ticket) return false;
  let parts = ticket.split(".");
  let expires = Number(parts[0]);
  let signature = parts[1] || "";
  let expected = crypto.createHmac("sha256", process.env.SESSION_SECRET).update(String(expires)).digest("hex");

  return signature === expected && Date.now() < expires;
}

function readTicket(req) {
  let cookies = (req.headers.cookie || "").split(";");
  for (let cookie of cookies) {
    let parts = cookie.trim().split("=");
    if (parts[0] === "ticket") return parts[1];
  }
  return null;
}

app.get("/login", function (req, res) {
  res.sendFile(__dirname + "/views/login.html");
});

app.post("/login", function (req, res) {
  if (req.body.username === process.env.APP_USER && req.body.password === process.env.APP_PASSWORD) {
    res.cookie("ticket", makeTicket(), {
      httpOnly: true,
      sameSite: "lax",
      secure: req.secure,
      maxAge: WEEK
    });
    res.redirect("/");
    return;
  }
  res.redirect("/login?error=1");
});

app.get("/logout", function (req, res) {
  res.clearCookie("ticket");
  res.redirect("/login");
})

app.use(function (req, res, next) {
  if (ticketIsValid(readTicket(req))) {
    next();
    return;
  }
  if (req.path.startsWith("/api/")) {
    res.status(401).json({ error: "Login required" });
    return
  }
  res.redirect("/login");
});

app.use(express.static("public"));

//--- Database (MongoDB) ---//
const { MongoClient } =
  require("mongodb");
const client = new
  MongoClient(process.env.MONGODB_URI);
let store;

let inventory = {
  westMemphis: [],
  marion: []
};

let neededTires = {
  westMemphis: [],
  marion: []
};


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
      console.log("Save failed:", error.message);
    });
}

function saveTires(location) {
  if (location === "westMemphis") {
    saveList("inventory", inventory.westMemphis)
  } else {
    saveList("inventory-marion", inventory.marion)
  }
}

function saveNeeded(location) {
  if (location === "westMemphis") {
    saveList("needed", neededTires.westMemphis)
  } else {
    saveList("needed-marion", neededTires.marion)
  }
}

app.get("/", function (req, res) {
  res.send("Hello from my tire server!");
});

app.get("/api/:location/inventory", function (req, res) {
  let location = req.params.location;
  res.json((inventory)[location]);
});

app.post("/api/:location/inventory", function (req, res) {
  let tire = req.body;
  let location = req.params.location;
  let shelf = inventory[location];

  // Look for a tire that's the same (everything except quantity)
  let sameTire = shelf.find(function (item) {
    return item.brand.toLowerCase() === tire.brand.toLowerCase() &&
      item.size.toLowerCase() === tire.size.toLowerCase() &&
      item.condition === tire.condition &&
      item.price === tire.price;
  });

  // Found one: just add to its quantity
  if (sameTire) {
    sameTire.quantity = sameTire.quantity + tire.quantity;
    saveTires(location);
    console.log("Merged:", sameTire);
    res.json(sameTire);
    return;
  }

  // Not found: it's a new tire, so give it an ID and add it
  tire.id = Date.now();
  shelf.push(tire);
  saveTires(location);
  console.log("Added:", tire);
  res.json(tire);
});

app.delete("/api/:location/inventory/:id", function (req, res) {
  let id = Number(req.params.id);
  let location = req.params.location;

  inventory[location] = inventory[location].filter(function (tire) {
    return tire.id !== id
  });

  saveTires(location);
  console.log("Deleted:", id);
  res.json({ ok: true });
})

app.put("/api/:location/inventory/:id", function (req, res) {
  let id = Number(req.params.id);
  let location = req.params.location;

  let tire = inventory[location].find(function (item) {
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

  saveTires(location);
  console.log("Edited:", tire);
  res.json(tire);
});

app.post("/api/:location/inventory/:id/sell", function (req, res) {
  let id = Number(req.params.id);
  let amount = Number(req.body.amount);
  let location = req.params.location;

  let tire = inventory[location].find(function (item) {
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
    inventory[location] = inventory[location].filter(function (item) {
      return item.id !== id
    })
  }

  saveTires(location);
  console.log("Sold:", amount, "of", id);
  res.json({ ok: true });
})

app.get("/api/:location/needed", function (req, res) {
  let location = req.params.location;
  res.json(neededTires[location]);
});

app.post("/api/:location/needed", function (req, res) {
  let location = req.params.location;
  let tire = req.body;
  tire.id = Date.now();
  neededTires[location].push(tire);
  saveNeeded(location);
  console.log("Needed:", tire);
  res.json(tire);
});

// Delete a needed tire by its ID
app.delete("/api/:location/needed/:id", function (req, res) {
  let id = Number(req.params.id);
  let location = req.params.location;

  neededTires[location] = neededTires[location].filter(function (tire) {
    return tire.id !== id;
  });

  saveNeeded(location);
  console.log("Deleted needed:", id);
  res.json({ ok: true });
});

async function start() {
  await client.connect();
  store =
    client.db("tireExpress").collection("store");
  console.log("Connected to MongoDB 🍃");

  inventory.westMemphis = await loadList("inventory", "data.json");
  inventory.marion = await loadList("inventory-marion", "marion.json");

  neededTires.westMemphis = await loadList("needed", "needed.json");
  neededTires.marion = await loadList("needed-marion", "needed-marion.json");

  let port = process.env.PORT || 3000;
  app.listen(port, function () {
    console.log("Server is running on http://localhost:" + port);
  });
}
start();