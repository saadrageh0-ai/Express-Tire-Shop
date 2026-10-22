let inventory = [];
let neededTires = [];

//--- Head ---// 
////--- Title + Date ---//
let intro = document.createElement("div");
intro.className = "intro";
document.body.append(intro);

let title = document.createElement("h1");
title.className = "title";
title.textContent = "Express Tire Shop Inventory";
intro.append(title);

let dayOfTheWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

let currentDate = new Date();

let todayDate = document.createElement("h3");
todayDate.className = "date";
intro.append(todayDate);

let logoutBtn = document.createElement("a");
logoutBtn.className = "logout-btn";
logoutBtn.href = "/logout";
logoutBtn.textContent = "Log out";
intro.append(logoutBtn);

function renderDate() {
  let dayName = dayOfTheWeek[currentDate.getDay()];
  let dateString = currentDate.toLocaleDateString();
  todayDate.textContent = `${dayName} ${dateString}`
};

renderDate();

//-- Menu --//
let menu = document.createElement("div");
menu.className = "menu";
document.body.append(menu);

let plusBtn = document.createElement("input");
plusBtn.className = "plus-btn";
plusBtn.value = "+";
plusBtn.type = "button";
menu.append(plusBtn);

let menuChoices = document.createElement("div");
menuChoices.className = "menu-choices";
menuChoices.hidden = true;
menu.append(menuChoices);

plusBtn.addEventListener("click", function () {
  menuChoices.hidden = !menuChoices.hidden;
});

let addChoice = document.createElement("input");
addChoice.className = "add-choices";
addChoice.value = "Add";
addChoice.type = "button";
menuChoices.append(addChoice);


addChoice.addEventListener("click", function () {
  addSection.hidden = !addSection.hidden
});

let searchChoice = document.createElement("input");
searchChoice.className = "seaarch-choices";
searchChoice.value = "Search";
searchChoice.type = "button";
menuChoices.append(searchChoice);

searchChoice.addEventListener("click", function () {
  searchSection.hidden = !searchSection.hidden;
});

let sellChoice = document.createElement("input");
sellChoice.className = "sell-choices";
sellChoice.value = "Sell";
sellChoice.type = "button";
menuChoices.append(sellChoice);

sellChoice.addEventListener("click", function () {
  sellSection.hidden = !sellSection.hidden;
});

let neededChoice = document.createElement("input");
neededChoice.className = "needed-choices";
neededChoice.value = "Need";
neededChoice.type = "button";
menuChoices.append(neededChoice);

neededChoice.addEventListener("click", function () {
  neededSection.hidden = !neededSection.hidden;
});

//-- Inventory --//
let inventorySection = document.createElement("div");
inventorySection.className = "inventory-section";
document.body.append(inventorySection);

let inventoryTitle = document.createElement("h2");
inventoryTitle.className = "inventory";
inventoryTitle.textContent = "Inventory";
inventorySection.append(inventoryTitle);

//-- Add to the Inventory --//
let addSection = document.createElement("div");
addSection.className = "add-section";
document.body.append(addSection);

addSection.hidden = true;

let addLabel = document.createElement("h3");
addLabel.className = "add-label";
addLabel.textContent = "Add Tires";
addSection.append(addLabel);

let addName = document.createElement("input");
addName.className = "add-input";
addName.type = "text";
addName.placeholder = "Name of Brand";
addSection.append(addName);

let addSize = document.createElement("input");
addSize.className = "add-size";
addSize.type = "text";
addSize.placeholder = "P225/45R18";
addSection.append(addSize);

let addQuantity = document.createElement("input");
addQuantity.className = "add-quantity";
addQuantity.type = "number";
addQuantity.placeholder = "Number of Tires";
addQuantity.min = 0;
addSection.append(addQuantity);

let addType = document.createElement("select");
addType.className = "add-type";
addType.value = "New";
addSection.append(addType);

let newTires = document.createElement("option");
newTires.textContent = "New";
newTires.value = "New";
addType.append(newTires);

let usedTires = document.createElement("option");
usedTires.textContent = "Used";
usedTires.value = "Used"
addType.append(usedTires);

let addPrice = document.createElement("input");
addPrice.className = "price";
addPrice.type = "number";
addPrice.placeholder = "Cost of Tire";
addPrice.min = 0;
addSection.append(addPrice);

addPrice.hidden = "";

addType.addEventListener("input", function () {
  addPrice.hidden = addType.value === usedTires.textContent;
});

let addBtn = document.createElement("input");
addBtn.className = "add";
addBtn.value = "Add";
addBtn.type = "button";
addSection.append(addBtn);

let addMsg = document.createElement("p");
addMsg.className = "add-msg";
addSection.append(addMsg);

let addList = document.createElement("ol");
addList.className = "add-list";
inventorySection.append(addList);

let editIndex = null;
let editItem = null;

function renderItem(list) {
  let index = inventory.length;

  let itemsList = document.createElement("li");
  itemsList.className = "items-list";

  let deleteBtn = document.createElement("input");
  deleteBtn.className = "delete-btn";
  deleteBtn.type = "button";
  deleteBtn.value = "Delete";

  deleteBtn.addEventListener("click", function () {
    fetch("/api/inventory/" + list.id, {
      method: "DELETE"
    })
      .then(function () {
        inventory = inventory.filter(function (tire) {
          return tire.id !== list.id
        });
        updatedSellOption();
        itemsList.remove();
      })
  });

  let editBtn = document.createElement("input");
  editBtn.className = "edit-btn";
  editBtn.type = "button";
  editBtn.value = "Edit";

  editBtn.addEventListener("click", function () {
    editItem = itemsList;
    addSection.hidden = false;

    addName.value = list.brand;
    addSize.value = list.size;
    addQuantity.value = list.quantity;
    addType.value = list.condition;
    addPrice.value = list.price;

    editIndex = list.id;
    addPrice.hidden = addType.value === usedTires.textContent;
  });

  let name = document.createElement("div");
  name.className = "tire-name";
  name.textContent = list.brand;

  let details = document.createElement("div");
  details.className = "tire-details";

  let chips = [list.size, list.quantity + " tires", list.condition];
  for (let text of chips) {
    let chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = text;
    details.append(chip);
  }

  itemsList.append(name);
  itemsList.append(details);

  if (list.condition === "New") {
    let price = document.createElement("div");
    price.className = "tire-price";
    price.textContent = `$${list.price}`;
    itemsList.append(price);
  }

  let buttons = document.createElement("div");
  buttons.className = "item-buttons";
  buttons.append(deleteBtn);
  buttons.append(editBtn);

  addList.append(itemsList);
  itemsList.append(buttons);
}

addBtn.addEventListener("click", function () {
  list = {
    brand: addName.value,
    size: addSize.value,
    quantity: Number(addQuantity.value),
    condition: addType.value,
  }

  if (addName.value.trim() === "") {
    alert("Please entry valid brand name");
    return;
  }
  if (addSize.value === "") {
    alert("Please entry valid size");
    return;
  }

  if (addQuantity.value <= 0) {
    alert("Please entry valid number");
    return;
  }

  if (addType.value === "") {
    alert("Please choose tire condition");
    return;
  }

  if (list.condition === "New") {
    if (addPrice.value <= 0) {
      alert("Please entry valid price");
      return;
    }
    list.price = Number(addPrice.value);
  }

  if (editIndex === null) {
    inventory.push(list);
    fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(list)
    })
      .then(function () {
        return fetch("/api/inventory");     // ask for the updated list
      })
      .then(function (response) {
        return response.json();
      })
      .then(function (tires) {
        inventory = tires;
        addList.textContent = "";           // clear the list on the page
        for (let tire of inventory) {
          renderItem(tire);                 // draw it again from the server's data
        }
        updatedSellOption();
      });
  } else {
    fetch("/api/inventory/" + editIndex, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(list)
    })
      .then(function () {
        return fetch("/api/inventory/");
      })
      .then(function (response) {
        return response.json();
      })
      .then(function (tires) {
        inventory = tires;
        addList.textContent = "";
        for (let tires of inventory) {
          renderItem(tires);
        }
        updatedSellOption();
      });
    editIndex = null;
    editItem = null;
  }

  renderItem(list);
  updatedSellOption();

  addMsg.textContent = `Brand: ${list.brand} | Size: ${list.size} | Number: ${list.quantity} | Condition: ${list.condition}`;

  if (list.condition === "New") {
    addMsg.textContent += ` | Price: $${list.price}`;
  }

  addMsg.textContent += ` was added to the inventory`;

  setTimeout(function () {
    addMsg.textContent = ""
  }, 3000)

  addName.value = "";
  addSize.value = "";
  addQuantity.value = "";
  addPrice.value = "";
  addName.focus();
})

for (let tire of inventory) {
  renderItem(tire);
};

//-- Search Section --//
let searchSection = document.createElement("div");
searchSection.className = "search-section";
document.body.append(searchSection);

searchSection.hidden = true;

let searchTitle = document.createElement("h3");
searchTitle.className = "seach-title";
searchTitle.textContent = "Search Section"
searchSection.append(searchTitle);

let search = document.createElement("input");
search.className = "search";
search.type = "text";
search.placeholder = "Search for Tire"
searchSection.append(search);


let searchResults = document.createElement("ul");
searchResults.className = "search-results";
searchSection.append(searchResults);

search.addEventListener("input", function () {
  let text = search.value.toLowerCase().trim();
  searchResults.textContent = "";
  if (text === "") return;

  for (let tire of inventory) {
    if (tire.brand.toLowerCase().includes(text) ||
      tire.size.toLowerCase().includes(text) ||
      tire.condition.toLowerCase().includes(text)) {
      let list = document.createElement("li");
      list.className = "list";

      list.textContent = `
      Name of the Brand: ${tire.brand} |
      Size Number: ${tire.size} |
      Number of Tires: ${tire.quantity} |
      Condition of Tires: ${tire.condition}`;

      if (tire.condition === "New") {
        list.textContent += ` | Price of Tire: $${tire.price}`;
      }
      searchResults.append(list);
    }
  }
  if (searchResults.children.length === 0) {
    let noTire = document.createElement("li");
    noTire.className = "no-tire";
    noTire.textContent = `No Tire Found`;
    searchResults.append(noTire);
  }
})

//-- Sell Section --//
let sellSection = document.createElement("div");
sellSection.className = "sell-section";
document.body.append(sellSection);

sellSection.hidden = true;

let sellTitle = document.createElement("h3");
sellTitle.className = "sell-title";
sellTitle.textContent = "Sell Tires";
sellSection.append(sellTitle);

let filterSell = document.createElement("input");
filterSell.className = "filter-sell";
filterSell.type = "text";
filterSell.placeholder = "Name of Tire";
sellSection.append(filterSell);

filterSell.addEventListener("input", updatedSellOption);

let selectType = document.createElement("select");
selectType.className = "select-type";
sellSection.append(selectType);

function updatedSellOption() {
  let filter = filterSell.value.toLowerCase().trim();
  selectType.textContent = "";

  for (let tire of inventory) {
    if (tire.brand.toLowerCase().includes(filter) ||
      tire.size.toLowerCase().includes(filter) ||
      tire.condition.toLowerCase().includes(filter)) {
      let option = document.createElement("option");
      option.className = "option";
      option.value = tire.id;
      option.textContent = `${tire.brand} | ${tire.size} | ${tire.condition} | ${tire.quantity}`;
      selectType.append(option);
    }
  }

  if (selectType.children.length === 0) {
    let option = document.createElement("option");
    option.textContent = "No Tires Found"
    selectType.append(option);
  }

}
updatedSellOption();

let sellInput = document.createElement("input");
sellInput.className = "sell-input";
sellInput.placeholder = "Number to sell";
sellInput.type = "number";
sellInput.min = 1;
sellSection.append(sellInput);


let sellBtn = document.createElement("input");
sellBtn.className = "sell-btn";
sellBtn.type = "button";
sellBtn.value = "Sell";
sellSection.append(sellBtn);

let sellMsg = document.createElement("p");
sellMsg.className = "sell-msg";
sellSection.append(sellMsg);

sellBtn.addEventListener("click", function () {
  let id = selectType.value;
  let amount = Number(sellInput.value);

  if (amount <= 0) return;

  fetch("/api/inventory/" + id + "/sell", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount: amount })
  })

    .then(function (response) {
      if (!response.ok) {
        alert("Not enough tires to sell");
      }
      return fetch("/api/inventory")
    })

    .then(function (response) {
      return response.json();
    })

    .then(function (tires) {
      inventory = tires;
      addList.textContent = "";
      for (let tire of inventory) {
        renderItem(tire);
      }
      updatedSellOption();
    })

  sellMsg.textContent = "Inventory Was Updated";

  setTimeout(function () {
    sellMsg.textContent = "";
  }, 3000)
});


//-- Needed Section --//
let neededSection = document.createElement("div");
neededSection.className = "needed-section";
document.body.append(neededSection);

neededSection.hidden = true;

let neededTiresTitle = document.createElement("h3");
neededTiresTitle.className = "needed-tires-title";
neededTiresTitle.textContent = "Needed Tires";
neededSection.append(neededTiresTitle);

let neededBrand = document.createElement("input");
neededBrand.className = "needed-brand";
neededBrand.placeholder = "Name of Brand";
neededBrand.type = "text";
neededSection.append(neededBrand);

let neededSize = document.createElement("input");
neededSize.className = "needed-size";
neededSize.type = "text";
neededSize.placeholder = "215/60R17";
neededSection.append(neededSize);

let neededQuantity = document.createElement("input");
neededQuantity.className = "needed-quantity";
neededQuantity.placeholder = "Number of Tires";
neededQuantity.type = "number";
neededQuantity.min = 1;
neededSection.append(neededQuantity);

let neededType = document.createElement("select");
neededType.className = "needed-type";
neededType.value = "New";
neededSection.append(neededType);

let neededNew = document.createElement("option");
neededNew.className = "needed-new";
neededNew.textContent = "New";
neededType.append(neededNew);

let neededUsed = document.createElement("option");
neededUsed.className = "needed-used";
neededUsed.textContent = "Used";
neededType.append(neededUsed);

let neededBtn = document.createElement("input");
neededBtn.className = "needed-btn";
neededBtn.value = "Add";
neededBtn.type = "button";
neededSection.append(neededBtn);

let neededList = document.createElement("ul");
neededList.className = "needed-list";
neededSection.append(neededList);

function renderNeeded(tire) {
  let li = document.createElement("li");
  li.className = "needed-li";

  li.textContent = `
  Name of Brand: ${tire.brand} |
  Tire Size: ${tire.size} |
  Number of Tires: ${tire.number} |
  Condition: ${tire.type}`;

  let neededDeleteBtn = document.createElement("input");
  neededDeleteBtn.className = "needed-delete-btn";
  neededDeleteBtn.type = "button";
  neededDeleteBtn.value = "Delete"
  li.append(neededDeleteBtn);

  neededDeleteBtn.addEventListener("click", function () {
    fetch("/api/needed/" + tire.id, {
      method: "DELETE"
    })
      .then(function () {
        neededTires = neededTires.filter(function (item) {
          return item.id !== tire.id;
        });
        li.remove();
      });
  });


  neededList.append(li);
}

neededBtn.addEventListener("click", function () {
  let neededTire = {
    brand: neededBrand.value,
    size: neededSize.value,
    number: Number(neededQuantity.value),
    type: neededType.value
  };

  if (neededBrand.value.trim() === "") {
    alert("Please enter valid brand name");
    return;
  }
  if (neededSize.value === "") {
    alert("Please enter valid size");
    return;
  }
  if (neededQuantity.value <= 0) {
    alert("Please enter valid number");
    return;
  }
  if (neededType.value === "") {
    alert("Please choose tire condition");
    return;
  }

  fetch("/api/needed", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(neededTire)
  })
    .then(function (response) {
      return response.json();
    })
    .then(function (savedTire) {
      neededTires.push(savedTire);
      renderNeeded(savedTire);
    });

  neededBrand.value = "";
  neededSize.value = "";
  neededQuantity.value = "";
  neededBrand.focus();
});

fetch("/api/needed")
  .then(function (response) {
    return response.json();
  })
  .then(function (tires) {
    neededTires = tires;
    for (let tires of neededTires) {
      renderNeeded(tires);
    }
  })

fetch("/api/inventory")
  .then(function (response) {
    return response.json();
  })
  .then(function (tires) {
    inventory = tires;
    for (let tire of inventory) {
      renderItem(tire);
    }
    updatedSellOption();
  });