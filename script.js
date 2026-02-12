const storeLayouts = {
  lidl: ["intrare", "fructe", "legume", "panificatie", "lactate", "branzeturi", "carne", "congelate", "paste si orez", "conserve", "mic dejun", "snacks", "dulciuri", "bauturi", "condimente", "sosuri", "igiena", "curatenie", "casa", "bebe", "animale", "farmacie", "casa de marcat"],
  kaufland: ["intrare", "condimente","fructe", "legume","sosuri","conserve","paste si orez","mic dejun", "panificatie", "carne", "congelate", "lactate", "branzeturi",    "snacks", "dulciuri", "bauturi",   "igiena", "curatenie", "casa", "bebe", "animale", "farmacie", "casa de marcat"],
  carrefour: ["intrare", "fructe", "legume", "lactate", "branzeturi", "carne", "congelate", "paste si orez", "conserve", "mic dejun", "snacks", "dulciuri", "bauturi", "condimente", "sosuri", "igiena", "curatenie", "casa", "bebe", "animale", "farmacie", "casa de marcat"]
};

const categoryMatchers = [
  { category: "fructe", keywords: ["mar", "mere", "banana", "banane", "portoc", "lamaie", "avocado", "fruct"] },
  { category: "legume", keywords: ["rosii", "castrav", "salata", "morcov", "ceapa", "cartof", "ardei", "legume"] },
  { category: "panificatie", keywords: ["paine", "bagheta", "covrig", "toast", "faina", "cozonac"] },
  { category: "lactate", keywords: ["lapte", "iaurt", "smantana", "unt", "branza", "telemea", "kefir"] },
  { category: "branzeturi", keywords: ["parmezan", "mozzarella", "gouda", "brie"] },
  { category: "carne", keywords: ["pui", "porc", "vita", "somon", "peste", "sunca", "mezel", "oua"] },
  { category: "congelate", keywords: ["congel", "inghetata", "pizza", "mix mexican"] },
  { category: "bauturi", keywords: ["apa", "suc", "bere", "vin", "cafea", "ceai"] },
  { category: "paste si orez", keywords: ["paste", "spaghete", "penne", "fusilli", "orez", "bulgur", "couscous"] },
  { category: "conserve", keywords: ["conserva", "ton", "fasole la conserva", "porumb la conserva", "sardine", "mazare conserva"] },
  { category: "mic dejun", keywords: ["cereale", "musli", "ovaz", "fulgi", "granola", "gem", "miere"] },
  { category: "snacks", keywords: ["chips", "alune", "seminte", "covrigei", "nachos", "snack"] },
  { category: "dulciuri", keywords: ["ciocolata", "biscuiti", "prajitura", "napolitane", "bomboane", "inghetata"] },
  { category: "condimente", keywords: ["sare", "piper", "boia", "oregano", "busuioc", "condiment", "curry"] },
  { category: "sosuri", keywords: ["ketchup", "maioneza", "mustar", "sos", "otet", "ulei de masline"] },
  { category: "curatenie", keywords: ["detergent", "clor", "dezinfect", "burete", "saci menajeri"] },
  { category: "igiena", keywords: ["sapun", "sampon", "deodorant", "hartie igienica", "hartie", "prosoape", "pasta de dinti"] },
  { category: "casa", keywords: ["folie aluminiu", "servetele", "bec", "hartie copt"] },
  { category: "bebe", keywords: ["scutece", "servetele umede", "formula lapte", "biberon", "piure bebe"] },
  { category: "animale", keywords: ["pisica", "caine", "hrana", "nisip"] },
  { category: "farmacie", keywords: ["ibuprofen", "paracetamol", "plasturi", "vitamine", "masca", "dezinfectant maini"] }
];

const storeInput = document.getElementById("store");
const ingredientInput = document.getElementById("ingredientInput");
const addIngredientBtn = document.getElementById("addIngredientBtn");
const bulkInput = document.getElementById("bulkInput");
const addBulkBtn = document.getElementById("addBulkBtn");
const orderedList = document.getElementById("orderedList");
const emptyState = document.getElementById("emptyState");
const copyBtn = document.getElementById("copyBtn");
const copyFeedback = document.getElementById("copyFeedback");

let shoppingItems = [];
let latestOrderedItems = [];

function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

const knownCategories = Array.from(
  new Set(
    [...Object.values(storeLayouts).flat(), ...categoryMatchers.map((matcher) => matcher.category)]
      .map((value) => normalizeText(value))
      .filter(Boolean)
  )
);

function getCategoryClassName(category) {
  return `category-${normalizeText(category).replace(/\s+/g, "-")}`;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseParentheticalContent(content) {
  const normalized = normalizeText(content);

  if (!normalized) {
    return { type: "unknown", value: "" };
  }

  if (knownCategories.includes(normalized)) {
    return { type: "category", value: normalized };
  }

  const categoryMatch = knownCategories.find((category) => {
    const categoryRegex = new RegExp(`\\b${escapeRegExp(category)}\\b`);
    return categoryRegex.test(normalized);
  });

  if (categoryMatch) {
    return { type: "category", value: categoryMatch };
  }

  const looksLikeWeightOrPack = /\d/.test(normalized) && /(kg|g|gr|l|ml|buc|bucata|bucati|pachet|pachete)/.test(normalized);
  if (looksLikeWeightOrPack) {
    return { type: "quantity", value: normalized };
  }

  return { type: "unknown", value: normalized };
}

function extractItemFromInput(value) {
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return null;
  }

  let categoryHint = null;
  const parentheticalMatches = trimmedValue.matchAll(/\(([^)]*)\)/g);

  for (const match of parentheticalMatches) {
    const parsed = parseParentheticalContent(match[1]);
    if (parsed.type === "category") {
      categoryHint = parsed.value;
    }
  }

  const cleanedName = trimmedValue
    .replace(/\([^)]*\)/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^[^a-zA-Z0-9\u00C0-\u024F]+/, "")
    .replace(/[^a-zA-Z0-9\u00C0-\u024F]+$/, "")
    .trim();

  if (!/[a-zA-Z0-9\u00C0-\u024F]/.test(cleanedName)) {
    return null;
  }

  return {
    name: cleanedName,
    categoryHint
  };
}

function extractItemsFromBulkInput(value) {
  return value
    .split(/\n|,|;/)
    .map((entry) => extractItemFromInput(entry))
    .filter(Boolean);
}

function categorizeItem(itemName, categoryHint = null) {
  if (categoryHint) {
    return categoryHint;
  }

  const normalizedItem = normalizeText(itemName);

  for (const matcher of categoryMatchers) {
    if (matcher.keywords.some((keyword) => normalizedItem.includes(keyword))) {
      return matcher.category;
    }
  }

  return "diverse";
}

function organizeShoppingList(items, store) {
  const layout = storeLayouts[store] || [];
  const defaultIndex = layout.length + 1;
  const groupedItems = new Map();

  items.forEach((item) => {
    const normalizedName = normalizeText(item.name);
    const existingItem = groupedItems.get(normalizedName);

    if (existingItem) {
      existingItem.quantity += 1;

      if (existingItem.category === "diverse" && item.categoryHint) {
        existingItem.category = item.categoryHint;
      }

      return;
    }

    groupedItems.set(normalizedName, {
      name: item.name,
      normalizedName,
      quantity: 1,
      category: categorizeItem(item.name, item.categoryHint)
    });
  });

  return [...groupedItems.values()].sort((a, b) => {
    const indexA = layout.indexOf(a.category);
    const indexB = layout.indexOf(b.category);

    const orderA = indexA === -1 ? defaultIndex : indexA;
    const orderB = indexB === -1 ? defaultIndex : indexB;

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    return a.normalizedName.localeCompare(b.normalizedName, "ro");
  });
}

function renderResults(orderedItems) {
  orderedList.innerHTML = "";
  copyFeedback.textContent = "";
  latestOrderedItems = orderedItems;

  if (!orderedItems.length) {
    emptyState.style.display = "block";
    copyBtn.disabled = true;
    return;
  }

  emptyState.style.display = "none";
  copyBtn.disabled = false;
  const groupedByCategory = new Map();

  orderedItems.forEach((item) => {
    if (!groupedByCategory.has(item.category)) {
      groupedByCategory.set(item.category, []);
    }

    groupedByCategory.get(item.category).push(item);
  });

  groupedByCategory.forEach((items, category) => {
    const categorySection = document.createElement("section");
    categorySection.className = "category-group";
    categorySection.classList.add(getCategoryClassName(category));

    const header = document.createElement("h3");
    header.className = "category-header";
    header.textContent = category;
    categorySection.appendChild(header);

    const list = document.createElement("ul");
    list.className = "category-items";

    items.forEach((item) => {
      const li = document.createElement("li");
      li.className = "item-row";
      li.classList.add(getCategoryClassName(item.category));

      const topRow = document.createElement("div");
      topRow.className = "item-top";

      const name = document.createElement("span");
      name.className = "item-name";
      name.textContent = item.name;
      topRow.appendChild(name);

      if (item.quantity > 1) {
        const quantity = document.createElement("span");
        quantity.className = "item-qty";
        quantity.textContent = `x${item.quantity}`;
        topRow.appendChild(quantity);
      }

      const removeBtn = document.createElement("button");
      removeBtn.className = "remove-item-btn";
      removeBtn.type = "button";
      removeBtn.textContent = "x";
      removeBtn.dataset.normalizedName = item.normalizedName;
      topRow.appendChild(removeBtn);

      li.appendChild(topRow);
      list.appendChild(li);
    });

    categorySection.appendChild(list);
    orderedList.appendChild(categorySection);
  });
}

function buildCopyText(items) {
  let currentCategory = "";
  const lines = [];

  items.forEach((item) => {
    if (item.category !== currentCategory) {
      currentCategory = item.category;
      if (lines.length > 0) {
        lines.push("");
      }
      lines.push(currentCategory.toUpperCase());
    }

    const quantityLabel = item.quantity > 1 ? ` x${item.quantity}` : "";
    lines.push(`- ${item.name}${quantityLabel}`);
  });

  return lines.join("\n");
}

async function copyOrderedList() {
  if (!latestOrderedItems.length) {
    return;
  }

  const copyText = buildCopyText(latestOrderedItems);

  try {
    await navigator.clipboard.writeText(copyText);
    copyFeedback.textContent = "Lista a fost copiata.";
  } catch (error) {
    const tempArea = document.createElement("textarea");
    tempArea.value = copyText;
    tempArea.setAttribute("readonly", "");
    tempArea.style.position = "absolute";
    tempArea.style.left = "-9999px";
    document.body.appendChild(tempArea);
    tempArea.select();

    const copied = document.execCommand("copy");
    document.body.removeChild(tempArea);

    copyFeedback.textContent = copied
      ? "Lista a fost copiata."
      : "Nu am putut copia automat lista.";
  }
}

function refreshResults() {
  const ordered = organizeShoppingList(shoppingItems, storeInput.value);
  renderResults(ordered);
}

function addIngredient() {
  const parsedItem = extractItemFromInput(ingredientInput.value);

  if (!parsedItem) {
    copyFeedback.textContent = "Introdu un ingredient valid.";
    return;
  }

  shoppingItems.push(parsedItem);
  ingredientInput.value = "";
  ingredientInput.focus();
  refreshResults();
}

function addBulkItems() {
  const parsedItems = extractItemsFromBulkInput(bulkInput.value);

  if (!parsedItems.length) {
    copyFeedback.textContent = "Introdu cel putin un produs valid in lista rapida.";
    return;
  }

  shoppingItems.push(...parsedItems);
  bulkInput.value = "";
  ingredientInput.focus();
  refreshResults();
}

function removeOneItem(normalizedName) {
  const index = shoppingItems.findIndex((entry) => normalizeText(entry.name) === normalizedName);

  if (index === -1) {
    return;
  }

  shoppingItems.splice(index, 1);
  refreshResults();
}

addIngredientBtn.addEventListener("click", addIngredient);
addBulkBtn.addEventListener("click", addBulkItems);

ingredientInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    addIngredient();
  }
});

bulkInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && event.ctrlKey) {
    event.preventDefault();
    addBulkItems();
  }
});

orderedList.addEventListener("click", (event) => {
  const target = event.target;

  if (!(target instanceof HTMLElement)) {
    return;
  }

  if (!target.classList.contains("remove-item-btn")) {
    return;
  }

  const { normalizedName } = target.dataset;
  if (!normalizedName) {
    return;
  }

  removeOneItem(normalizedName);
});

storeInput.addEventListener("change", refreshResults);
copyBtn.addEventListener("click", copyOrderedList);

renderResults([]);
