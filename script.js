const storeLayouts = {
  lidl: ["intrare", "fructe", "legume", "panificatie", "lactate", "carne", "congelate", "bauturi", "curatenie", "casa", "casa de marcat"],
  kaufland: ["intrare", "panificatie", "fructe", "legume", "carne", "lactate", "congelate", "bauturi", "igiena", "curatenie", "casa de marcat"],
  carrefour: ["intrare", "fructe", "legume", "lactate", "branzeturi", "carne", "bauturi", "congelate", "curatenie", "animale", "casa de marcat"]
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
  { category: "curatenie", keywords: ["detergent", "clor", "dezinfect", "burete", "saci menajeri"] },
  { category: "igiena", keywords: ["sapun", "sampon", "deodorant", "hartie igienica", "pasta dinti"] },
  { category: "casa", keywords: ["folie aluminiu", "servetele", "bec", "hartie copt"] },
  { category: "animale", keywords: ["pisica", "caine", "hrana", "nisip"] }
];

const storeInput = document.getElementById("store");
const itemsInput = document.getElementById("items");
const organizeBtn = document.getElementById("organizeBtn");
const orderedList = document.getElementById("orderedList");
const emptyState = document.getElementById("emptyState");

function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function parseItems(text) {
  return text
    .split(/\n|,|;/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function categorizeItem(item) {
  const normalizedItem = normalizeText(item);

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

  return [...items]
    .map((item) => ({
      name: item,
      category: categorizeItem(item)
    }))
    .sort((a, b) => {
      const indexA = layout.indexOf(a.category);
      const indexB = layout.indexOf(b.category);

      const orderA = indexA === -1 ? defaultIndex : indexA;
      const orderB = indexB === -1 ? defaultIndex : indexB;

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      return a.name.localeCompare(b.name, "ro");
    });
}

function renderResults(orderedItems) {
  orderedList.innerHTML = "";

  if (!orderedItems.length) {
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";

  orderedItems.forEach((item) => {
    const li = document.createElement("li");
    const category = item.category === "diverse" ? "diverse" : item.category;
    li.textContent = `${item.name} (${category})`;
    orderedList.appendChild(li);
  });
}

organizeBtn.addEventListener("click", () => {
  const items = parseItems(itemsInput.value);
  const store = storeInput.value;

  const ordered = organizeShoppingList(items, store);
  renderResults(ordered);
});
