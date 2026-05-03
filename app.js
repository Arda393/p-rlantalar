const whoOptions = [
  "annen",
  "sevgilin",
  "arkadaşın",
  "eşin",
  "baban",
  "kardeşin",
  "çocuğun",
  "iş arkadaşın"
];

const occasionOptions = [
  "anneler günü",
  "doğum günü",
  "yeni iş/terfi",
  "içimden geldi",
  "geçmiş olsun",
  "yıl dönümü",
  "özür dilerim",
  "söz-nişan-düğün"
];

const state = {
  products: [],
  selectedWho: "",
  selectedOccasion: ""
};

const elements = {
  whoOptions: document.querySelector("#whoOptions"),
  occasionOptions: document.querySelector("#occasionOptions"),
  occasionStep: document.querySelector("#occasionStep"),
  resetButton: document.querySelector("#resetButton"),
  resultsTitle: document.querySelector("#resultsTitle"),
  resultCount: document.querySelector("#resultCount"),
  loader: document.querySelector("#loader"),
  emptyState: document.querySelector("#emptyState"),
  productGrid: document.querySelector("#productGrid")
};

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLocaleLowerCase("tr-TR");
}

function getColumnValue(row, possibleNames) {
  const keys = Object.keys(row);
  const wanted = possibleNames.map(normalizeText);
  const matchedKey = keys.find((key) => wanted.includes(normalizeText(key)));
  return matchedKey ? row[matchedKey] : "";
}

function splitCsvLine(line) {
  const cells = [];
  let current = "";
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"' && nextChar === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  cells.push(current.trim());
  return cells;
}

function parseCsv(csvText) {
  const lines = csvText
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  const headers = splitCsvLine(lines[0]);

  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    return headers.reduce((row, header, index) => {
      row[header] = values[index] || "";
      return row;
    }, {});
  });
}

function createPill(label, groupName, onSelect) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "pill";
  button.textContent = label;
  button.setAttribute("aria-pressed", "false");
  button.dataset.value = label;
  button.dataset.group = groupName;

  button.addEventListener("click", () => {
    onSelect(label);
    updateActivePills(groupName, label);
  });

  return button;
}

function updateActivePills(groupName, activeValue) {
  document.querySelectorAll(`[data-group="${groupName}"]`).forEach((button) => {
    const isActive = button.dataset.value === activeValue;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function renderOptions() {
  whoOptions.forEach((option) => {
    elements.whoOptions.appendChild(createPill(option, "who", selectWho));
  });

  occasionOptions.forEach((option) => {
    elements.occasionOptions.appendChild(createPill(option, "occasion", selectOccasion));
  });
}

function selectWho(value) {
  state.selectedWho = value;
  state.selectedOccasion = "";
  elements.occasionStep.classList.remove("step-hidden");
  updateActivePills("occasion", "");
  renderWaitingState("Seçiminiz kaydedildi. Şimdi mücevherin eşlik edeceği özel anı belirleyin.");
}

function selectOccasion(value) {
  state.selectedOccasion = value;
  filterWithLoading();
}

function productMatches(row) {
  const who = normalizeText(getColumnValue(row, ["kimin için", "kimin icin", "who"]));
  const occasion = normalizeText(getColumnValue(row, ["ne için", "ne icin", "occasion"]));

  return who === normalizeText(state.selectedWho) && occasion === normalizeText(state.selectedOccasion);
}

function getProductName(row) {
  return getColumnValue(row, [
    "urun_adi",
    "ürün adı",
    "urun adi",
    "product name",
    "name",
    "ürün",
    "urun"
  ]) || "İsimsiz ARİŞ AI önerisi";
}

function filterWithLoading() {
  elements.loader.hidden = false;
  elements.emptyState.hidden = true;
  elements.productGrid.innerHTML = "";
  elements.resultsTitle.textContent = "Seçkiniz hazırlanıyor";
  elements.resultCount.textContent = "...";

  window.setTimeout(() => {
    const filteredProducts = state.products.filter(productMatches);
    elements.loader.hidden = true;
    renderProducts(filteredProducts);
  }, 450);
}

function renderProducts(products) {
  elements.productGrid.innerHTML = "";
  elements.resultsTitle.textContent = `${state.selectedWho} için ${state.selectedOccasion} önerileri`;
  elements.resultCount.textContent = `${products.length} ürün`;

  if (products.length === 0) {
    elements.emptyState.hidden = false;
    elements.emptyState.querySelector("p").textContent = "Bu seçim için uygun ürün bulunamadı. Farklı bir özel an veya kişi seçimiyle yeniden deneyebilirsiniz.";
    return;
  }

  elements.emptyState.hidden = true;

  products.forEach((product, index) => {
    const card = document.createElement("article");
    card.className = "product-card";
    card.style.animationDelay = `${Math.min(index * 0.045, 0.45)}s`;

    const productName = getProductName(product);
    const title = document.createElement("h3");
    const tags = document.createElement("div");
    const whoTag = document.createElement("span");
    const occasionTag = document.createElement("span");

    title.textContent = productName;
    tags.className = "tags";
    whoTag.className = "tag";
    occasionTag.className = "tag";
    whoTag.textContent = state.selectedWho;
    occasionTag.textContent = state.selectedOccasion;

    tags.append(whoTag, occasionTag);
    card.append(title, tags);

    elements.productGrid.appendChild(card);
  });
}

function renderWaitingState(message) {
  elements.loader.hidden = true;
  elements.productGrid.innerHTML = "";
  elements.emptyState.hidden = false;
  elements.emptyState.querySelector("p").textContent = message;
  elements.resultsTitle.textContent = "Bir adım kaldı";
  elements.resultCount.textContent = "0 ürün";
}

function resetApp() {
  state.selectedWho = "";
  state.selectedOccasion = "";
  elements.occasionStep.classList.add("step-hidden");
  updateActivePills("who", "");
  updateActivePills("occasion", "");
  elements.resultsTitle.textContent = "Seçimlerini bekliyoruz";
  elements.resultCount.textContent = "0 ürün";
  elements.loader.hidden = true;
  elements.productGrid.innerHTML = "";
  elements.emptyState.hidden = false;
  elements.emptyState.querySelector("p").textContent = "Önce kimin için ve hangi özel an için seçim yapmak istediğinizi belirtin. ARİŞ AI önerileriniz burada listelenecek.";
}

async function loadProducts() {
  try {
    const response = await fetch("urunler2.csv");

    if (!response.ok) {
      throw new Error("CSV dosyası yüklenemedi.");
    }

    const csvText = await response.text();
    state.products = parseCsv(csvText);
  } catch (error) {
    elements.emptyState.hidden = false;
    elements.emptyState.querySelector("p").textContent = "Ürün listesi yüklenemedi. Sayfayı yerel bir sunucu üzerinden açmayı deneyebilirsin.";
    elements.resultsTitle.textContent = "Bir aksilik oldu";
    console.error(error);
  }
}

renderOptions();
elements.resetButton.addEventListener("click", resetApp);
loadProducts();
