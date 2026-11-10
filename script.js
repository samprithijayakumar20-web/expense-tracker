
// =====================================
// LAVENDER WALLET - EXPENSE TRACKER
// =====================================

// 1. SELECT HTML ELEMENTS

const transactionForm = document.getElementById("transactionForm");

const transactionName = document.getElementById("transactionName");
const transactionAmount = document.getElementById("transactionAmount");
const transactionType = document.getElementById("transactionType");
const transactionCategory = document.getElementById("transactionCategory");
const transactionDate = document.getElementById("transactionDate");

const transactionList = document.getElementById("transactionList");
const emptyMessage = document.getElementById("emptyMessage");

const totalBalance = document.getElementById("totalBalance");
const totalIncome = document.getElementById("totalIncome");
const totalExpense = document.getElementById("totalExpense");

const currencySearch = document.getElementById("currencySearch");
const currencyOptions = document.getElementById("currencyOptions");

const filterType = document.getElementById("filterType");
const todayDate = document.getElementById("todayDate");
const toast = document.getElementById("toast");


// 2. WORLD CURRENCY LIST

const currencyCodes = `
AED AFN ALL AMD ANG AOA ARS AUD AWG AZN
BAM BBD BDT BGN BHD BIF BMD BND BOB BRL
BSD BTN BWP BYN BZD CAD CDF CHF CLP CNY
COP CRC CUP CVE CZK DJF DKK DOP DZD EGP
ERN ETB EUR FJD FKP GBP GEL GHS GIP GMD
GNF GTQ GYD HKD HNL HTG HUF IDR ILS INR
IQD IRR ISK JMD JOD JPY KES KGS KHR KMF
KPW KRW KWD KYD KZT LAK LBP LKR LRD LSL
LYD MAD MDL MGA MKD MMK MNT MOP MRU MUR
MVR MWK MXN MYR MZN NAD NGN NIO NOK NPR
NZD OMR PAB PEN PGK PHP PKR PLN PYG QAR
RON RSD RUB RWF SAR SBD SCR SDG SEK SGD
SHP SLE SOS SRD SSP STN SVC SYP SZL THB
TJS TMT TND TOP TRY TTD TWD TZS UAH UGX
USD UYU UZS VES VND VUV WST XAF XCD XOF
XPF YER ZAR ZMW ZWG
`.trim().split(/\s+/);

const currencyNames = new Intl.DisplayNames(
    ["en"],
    { type: "currency" }
);

const supportedCurrencies = new Set(currencyCodes);

function getCurrencyName(code) {
    try {
        return currencyNames.of(code) || code;
    } catch {
        return code;
    }
}

// Add currencies to the searchable dropdown

currencyCodes.forEach(code => {
    const option = document.createElement("option");

    option.value = `${code} — ${getCurrencyName(code)}`;

    currencyOptions.appendChild(option);
});


// 3. LOAD SAVED SETTINGS AND TRANSACTIONS

function loadTransactions() {
    try {
        const saved = JSON.parse(
            localStorage.getItem("lavenderTransactions")
        );

        return Array.isArray(saved) ? saved : [];
    } catch {
        return [];
    }
}

let transactions = loadTransactions();

let selectedCurrency =
    localStorage.getItem("lavenderCurrency") || "INR";

if (!supportedCurrencies.has(selectedCurrency)) {
    selectedCurrency = "INR";
}

currencySearch.value =
    `${selectedCurrency} — ${getCurrencyName(selectedCurrency)}`;


// 4. SAVE DATA IN BROWSER

function saveTransactions() {
    localStorage.setItem(
        "lavenderTransactions",
        JSON.stringify(transactions)
    );
}


// 5. CURRENCY FORMATTER

function formatMoney(amount) {
    try {
        return new Intl.NumberFormat("en", {
            style: "currency",
            currency: selectedCurrency
        }).format(amount);
    } catch {
        return `${selectedCurrency} ${amount.toFixed(2)}`;
    }
}


// 6. SELECT A DIFFERENT CURRENCY

currencySearch.addEventListener("change", function () {

    const enteredValue = currencySearch.value.trim();

    const code = enteredValue
        .split("—")[0]
        .trim()
        .toUpperCase();

    if (!supportedCurrencies.has(code)) {
        showToast("Please select a valid currency.");
        currencySearch.value =
            `${selectedCurrency} — ${getCurrencyName(selectedCurrency)}`;
        return;
    }

    selectedCurrency = code;

    localStorage.setItem(
        "lavenderCurrency",
        selectedCurrency
    );

    currencySearch.value =
        `${selectedCurrency} — ${getCurrencyName(selectedCurrency)}`;

    renderDashboard();

    showToast("Currency updated successfully!");
});


// 7. ADD TRANSACTION

transactionForm.addEventListener("submit", function (event) {

    event.preventDefault();

    const name = transactionName.value.trim();
    const amount = Number(transactionAmount.value);
    const type = transactionType.value;
    const category = transactionCategory.value;
    const date = transactionDate.value;

    if (!name || !Number.isFinite(amount) || amount <= 0 || !date) {
        showToast("Please enter valid transaction details.");
        return;
    }

    const newTransaction = {
        id: window.crypto?.randomUUID
            ? window.crypto.randomUUID()
            : String(Date.now()),

        name: name,
        amount: amount,
        type: type,
        category: category,
        date: date
    };

    transactions.push(newTransaction);

    saveTransactions();

    renderDashboard();

    transactionForm.reset();

    // Set today's date again after resetting the form
    transactionDate.value = getTodayString();

    showToast("Transaction added successfully!");
});


// 8. CALCULATE INCOME, EXPENSE AND BALANCE

function updateSummary() {

    let income = 0;
    let expense = 0;

    transactions.forEach(transaction => {

        if (transaction.type === "income") {
            income += transaction.amount;
        } else {
            expense += transaction.amount;
        }

    });

    const balance = income - expense;

    totalBalance.textContent = formatMoney(balance);
    totalIncome.textContent = formatMoney(income);
    totalExpense.textContent = formatMoney(expense);
}


// 9. DISPLAY TRANSACTIONS

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function renderTransactions() {

    transactionList.innerHTML = "";

    const filter = filterType.value;

    const filteredTransactions = transactions
        .filter(transaction => {
            return filter === "all" || transaction.type === filter;
        })
        .sort((a, b) => {
            return b.date.localeCompare(a.date);
        });

    emptyMessage.style.display =
        filteredTransactions.length === 0 ? "block" : "none";

    filteredTransactions.forEach(transaction => {

        const row = document.createElement("tr");

        const amountClass =
            transaction.type === "income"
                ? "amount-income"
                : "amount-expense";

        const sign =
            transaction.type === "income" ? "+" : "−";

        row.innerHTML = `
            <td>${escapeHTML(transaction.name)}</td>

            <td>
                <span class="type-tag">
                    ${escapeHTML(transaction.category)}
                </span>
            </td>

            <td>${escapeHTML(transaction.date)}</td>

            <td class="${amountClass}">
                ${sign}${escapeHTML(formatMoney(transaction.amount))}
            </td>

            <td>
                <button
                    class="delete-button"
                    data-id="${escapeHTML(transaction.id)}"
                    type="button"
                    aria-label="Delete ${escapeHTML(transaction.name)}"
                >
                    Delete
                </button>
            </td>
        `;

        transactionList.appendChild(row);

    });
}


// 10. DELETE TRANSACTION

transactionList.addEventListener("click", function (event) {

    const button = event.target.closest(".delete-button");

    if (!button) return;

    const transactionId = button.dataset.id;

    transactions = transactions.filter(transaction => {
        return String(transaction.id) !== transactionId;
    });

    saveTransactions();

    renderDashboard();

    showToast("Transaction deleted.");
});


// 11. FILTER TRANSACTIONS

filterType.addEventListener("change", function () {
    renderTransactions();
});


// 12. UPDATE THE WHOLE DASHBOARD

function renderDashboard() {
    updateSummary();
    renderTransactions();
}


// 13. GET TODAY'S DATE

function getTodayString() {

    const today = new Date();

    const year = today.getFullYear();

    const month = String(
        today.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        today.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

transactionDate.value = getTodayString();

todayDate.textContent = new Date().toLocaleDateString(
    "en-IN",
    {
        day: "numeric",
        month: "long",
        year: "numeric"
    }
);


// 14. SHOW NOTIFICATION

let toastTimer;

function showToast(message) {

    toast.textContent = message;

    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(function () {
        toast.classList.remove("show");
    }, 2500);
}


// 15. START THE WEBSITE

renderDashboard();

console.log("Lavender Wallet is ready!");
