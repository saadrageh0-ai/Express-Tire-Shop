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

function loadTires() {
  try {
    let tire = JSON.parse(fs.readFileSync("data.json", "utf8"));

    for (let i = 0; i < tire.length; i++) {
      if (!tire[i].id) {
        tire[i].id = Date.now() + i;
      }
    }
    return tire;
  } catch (error) {
    return [];
  }
}

function saveTires() {
  fs.writeFileSync("data.json", JSON.stringify(inventory, null, 2));
}

function loadNeeded () {
 try {
  return JSON.parse(fs.readFileSync("needed.json", "utf8"));
 } catch(error) {
  return [];
 }
}

function saveNeeded() {
  fs.writeFileSync("needed.json", JSON.stringify(neededTires, null, 2));
}

let inventory = loadTires();
saveTires();
let neededTires = loadNeeded();

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

  if(!tire) {
    res.status(404).json({ error: "Tire not found"});
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

app.listen(3000, function () {
  console.log("Server is running on http://localhost:3000");
});