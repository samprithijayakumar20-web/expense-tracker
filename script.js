
// ==========================================
// LAVENDER WALLET - EXPENSE TRACKER
// ==========================================

const STORAGE_KEY = "lavenderWalletTransactionsV2";
const CURRENCY_KEY = "lavenderWalletCurrencyV2";

let transactions = [];
let editingId = null;

// Get HTML elements
const form = document.getElementById("transactionForm");
const titleInput = document.getElementById("title");
const amountInput = document.getElementById("amount");
const typeInput = document.getElementById("type");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");

const currencySelect = document.getElementById("currency");
const balanceElement = document.getElementById("balance");
const incomeElement = document.getElementById("income");
const expenseElement = document.getElementById("expense");

const transactionList = document.getElementById("transactionList");
const searchInput = document.getElementById("search");
const filterType = document.getElementById("filterType");
const filterCategory = document.getElementById("filterCategory");
const filterMonth = document.getElementById("filterMonth");

const chartMonth = document.getElementById("chartMonth");
const monthlyChart = document.getElementById("monthlyChart");
const chartTotal = document.getElementById("chartTotal");

const submitBtn = document.getElementById("submitBtn");
const cancelEditBtn = document.getElementById("cancelEdit");

// ==========================================
// INITIALIZATION
// ==========================================

function getLocalDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getCurrentMonth() {
    return getLocalDateString().slice(0, 7);
}

function initializeApp() {
    try {
        const savedTransactions = JSON.parse(
            localStorage.getItem(STORAGE_KEY)
        );

        transactions = Array.isArray(savedTransactions)
            ? savedTransactions
            : [];
    } catch (error) {
        transactions = [];
    }

    const savedCurrency = localStorage.getItem(CURRENCY_KEY);

    if (savedCurrency && currencySelect.querySelector(
        `option[value="${savedCurrency}"]`
    )) {
        currencySelect.value = savedCurrency;
    }

    dateInput.value = getLocalDateString();
    chartMonth.value = getCurrentMonth();

    document.getElementById("todayDate").textContent =
        new Date().toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric"
        });

    updateDashboard();
}

// ==========================================
// LOCAL STORAGE
// ==========================================

function saveTransactions() {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(transactions)
    );
}

// ==========================================
// CURRENCY FORMATTER
// ==========================================

function formatMoney(amount) {
    const currency = currencySelect.value;

    try {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: currency,
            maximumFractionDigits: 2
        }).format(amount);
    } catch (error) {
        return `${currency} ${Number(amount).toFixed(2)}`;
    }
}

// ==========================================
// ADD AND EDIT TRANSACTIONS
// ==========================================

form.addEventListener("submit", function (event) {
    event.preventDefault();

    const title = titleInput.value.trim();
    const amount = Number(amountInput.value);
    const type = typeInput.value;
    const category = categoryInput.value;
    const date = dateInput.value;

    if (!title || !Number.isFinite(amount) || amount <= 0 || !date) {
        alert("Please enter valid transaction details.");
        return;
    }

    if (editingId !== null) {
        const existingTransaction = transactions.find(
            item => item.id === editingId
        );

        if (existingTransaction) {
            existingTransaction.title = title;
            existingTransaction.amount = amount;
            existingTransaction.type = type;
            existingTransaction.category = category;
            existingTransaction.date = date;
        }

        editingId = null;
        resetForm();
    } else {
        const newTransaction = {
            id: Date.now().toString() + Math.random().toString(36).slice(2),
            title,
            amount,
            type,
            category,
            date
        };

        transactions.push(newTransaction);
    }

    saveTransactions();
    updateDashboard();
    form.reset();

    dateInput.value = getLocalDateString();
    submitBtn.textContent = "+ Add Transaction";
    cancelEditBtn.classList.add("hidden");
    document.getElementById("formTitle").textContent = "Add Transaction";
});

// ==========================================
// RESET FORM
// ==========================================

function resetForm() {
    editingId = null;
    form.reset();

    dateInput.value = getLocalDateString();
    submitBtn.textContent = "+ Add Transaction";
    cancelEditBtn.classList.add("hidden");
    document.getElementById("formTitle").textContent = "Add Transaction";
}

cancelEditBtn.addEventListener("click", resetForm);

// ==========================================
// EDIT AND DELETE TRANSACTIONS
// ==========================================

transactionList.addEventListener("click", function (event) {
    const editButton = event.target.closest(".edit-btn");
    const deleteButton = event.target.closest(".delete-btn");

    if (editButton) {
        editTransaction(editButton.dataset.id);
    }

    if (deleteButton) {
        deleteTransaction(deleteButton.dataset.id);
    }
});

function editTransaction(id) {
    const transaction = transactions.find(
        item => item.id === id
    );

    if (!transaction) return;

    editingId = id;

    titleInput.value = transaction.title;
    amountInput.value = transaction.amount;
    typeInput.value = transaction.type;
    categoryInput.value = transaction.category;
    dateInput.value = transaction.date;

    submitBtn.textContent = "Update Transaction";
    cancelEditBtn.classList.remove("hidden");
    document.getElementById("formTitle").textContent = "Edit Transaction";

    form.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

function deleteTransaction(id) {
    const confirmed = confirm(
        "Are you sure you want to delete this transaction?"
    );

    if (!confirmed) return;

    transactions = transactions.filter(
        item => item.id !== id
    );

    if (editingId === id) {
        resetForm();
    }

    saveTransactions();
    updateDashboard();
}

// ==========================================
// DASHBOARD CALCULATIONS
// ==========================================

function updateDashboard() {
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(transaction => {
        if (transaction.type === "income") {
            totalIncome += Number(transaction.amount);
        } else {
            totalExpense += Number(transaction.amount);
        }
    });

    balanceElement.textContent = formatMoney(
        totalIncome - totalExpense
    );

    incomeElement.textContent = formatMoney(totalIncome);
    expenseElement.textContent = formatMoney(totalExpense);

    displayTransactions();
    createMonthlyChart();
}

// ==========================================
// SAFE HTML TEXT
// ==========================================

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
        const replacements = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return replacements[character];
    });
}

// ==========================================
// TRANSACTION HISTORY
// ==========================================

function displayTransactions() {
    const searchText = searchInput.value.toLowerCase().trim();
    const selectedType = filterType.value;
    const selectedCategory = filterCategory.value;
    const selectedMonth = filterMonth.value;

    const filteredTransactions = transactions
        .filter(transaction => {
            const matchesSearch =
                transaction.title.toLowerCase().includes(searchText);

            const matchesType =
                selectedType === "all" ||
                transaction.type === selectedType;

            const matchesCategory =
                selectedCategory === "all" ||
                transaction.category === selectedCategory;

            const matchesMonth =
                !selectedMonth ||
                transaction.date.startsWith(selectedMonth);

            return matchesSearch &&
                matchesType &&
                matchesCategory &&
                matchesMonth;
        })
        .sort((a, b) => b.date.localeCompare(a.date));

    if (filteredTransactions.length === 0) {
        transactionList.innerHTML = `
            <tr>
                <td colspan="6" class="empty-message">
                    No matching transactions found.
                </td>
            </tr>
        `;
    } else {
        transactionList.innerHTML = filteredTransactions.map(item => {
            const isIncome = item.type === "income";

            return `
                <tr>
                    <td>${escapeHTML(item.title)}</td>
                    <td>${escapeHTML(item.category)}</td>
                    <td>${escapeHTML(item.date)}</td>
                    <td>${isIncome ? "Income" : "Expense"}</td>
                    <td class="${isIncome ? "income-text" : "expense-text"}">
                        ${isIncome ? "+" : "-"}${formatMoney(Number(item.amount))}
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="edit-btn"
                                data-id="${escapeHTML(item.id)}">
                                Edit
                            </button>

                            <button class="delete-btn"
                                data-id="${escapeHTML(item.id)}">
                                Delete
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join("");
    }

    let filteredTotal = 0;

    filteredTransactions.forEach(item => {
        if (item.type === "income") {
            filteredTotal += Number(item.amount);
        } else {
            filteredTotal -= Number(item.amount);
        }
    });

    document.getElementById("transactionCount").textContent =
        filteredTransactions.length;

    document.getElementById("filteredTotal").textContent =
        formatMoney(filteredTotal);
}

// ==========================================
// MONTHLY EXPENSE CHART
// ==========================================

function createMonthlyChart() {
    const selectedMonth = chartMonth.value || getCurrentMonth();

    const monthlyTransactions = transactions.filter(item =>
        item.type === "expense" &&
        item.date.startsWith(selectedMonth)
    );

    const weeklyExpenses = [0, 0, 0, 0, 0];

    monthlyTransactions.forEach(item => {
        const day = Number(item.date.slice(8, 10));
        const weekIndex = Math.min(Math.floor((day - 1) / 7), 4);

        weeklyExpenses[weekIndex] += Number(item.amount);
    });

    const total = weeklyExpenses.reduce(
        (sum, value) => sum + value,
        0
    );

    chartTotal.textContent = formatMoney(total);

    const highestExpense = Math.max(...weeklyExpenses, 1);

    monthlyChart.innerHTML = weeklyExpenses.map((amount, index) => {
        const percentage = amount === 0
            ? 0
            : Math.max((amount / highestExpense) * 100, 4);

        return `
            <div class="chart-column">
                <span class="bar-value">
                    ${amount > 0 ? escapeHTML(formatMoney(amount)) : ""}
                </span>

                <div class="bar-track">
                    <div class="bar" style="height: ${percentage}%"
                         title="${escapeHTML(formatMoney(amount))}">
                    </div>
                </div>

                <span class="bar-label">Week ${index + 1}</span>
            </div>
        `;
    }).join("");
}

// ==========================================
// FILTER EVENTS
// ==========================================

searchInput.addEventListener("input", displayTransactions);
filterType.addEventListener("change", displayTransactions);
filterCategory.addEventListener("change", displayTransactions);
filterMonth.addEventListener("change", displayTransactions);

chartMonth.addEventListener("change", createMonthlyChart);

document.getElementById("clearFilters").addEventListener(
    "click",
    function () {
        searchInput.value = "";
        filterType.value = "all";
        filterCategory.value = "all";
        filterMonth.value = "";

        displayTransactions();
    }
);

// ==========================================
// CURRENCY SELECTION
// ==========================================

currencySelect.addEventListener("change", function () {
    localStorage.setItem(CURRENCY_KEY, currencySelect.value);
    updateDashboard();
});

// ==========================================
// START APP ONLY ONCE
// ==========================================

initializeApp();

// ==========================================
// MONTHLY REPORTS
// ==========================================

const reportMonth = document.getElementById("reportMonth");

reportMonth.value = getCurrentMonth();

function updateMonthlyReport() {
    const selectedMonth = reportMonth.value;

    const monthlyTransactions = transactions.filter(item =>
        item.date.startsWith(selectedMonth)
    );

    let monthlyIncome = 0;
    let monthlyExpense = 0;

    const categoryTotals = {};

    monthlyTransactions.forEach(item => {
        const amount = Number(item.amount);

        if (item.type === "income") {
            monthlyIncome += amount;
        } else {
            monthlyExpense += amount;

            categoryTotals[item.category] =
                (categoryTotals[item.category] || 0) + amount;
        }
    });

    const monthlySavings = monthlyIncome - monthlyExpense;

    document.getElementById("reportIncome").textContent =
        formatMoney(monthlyIncome);

    document.getElementById("reportExpense").textContent =
        formatMoney(monthlyExpense);

    document.getElementById("reportSavings").textContent =
        formatMoney(monthlySavings);

    displayCategoryReport(categoryTotals);
}

// ==========================================
// CATEGORY-WISE REPORT
// ==========================================

function displayCategoryReport(categoryTotals) {
    const categoryReport = document.getElementById("categoryReport");

    const categories = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1]);

    if (categories.length === 0) {
        categoryReport.innerHTML = `
            <p class="empty-message">
                No expenses for this month.
            </p>
        `;
        return;
    }

    categoryReport.innerHTML = categories.map(([category, amount]) => `
        <div class="category-row">
            <span>${escapeHTML(category)}</span>
            <strong>${escapeHTML(formatMoney(amount))}</strong>
        </div>
    `).join("");
}

// ==========================================
// DOWNLOAD MONTHLY CSV REPORT
// ==========================================

function downloadMonthlyReport() {
    const selectedMonth = reportMonth.value;

    if (!selectedMonth) {
        alert("Please select a month.");
        return;
    }

    const monthlyTransactions = transactions.filter(item =>
        item.date.startsWith(selectedMonth)
    );

    if (monthlyTransactions.length === 0) {
        alert("No transactions available for this month.");
        return;
    }

    const rows = [
        ["Expense Tracker Monthly Report"],
        ["Month", selectedMonth],
        [],
        ["Name", "Category", "Type", "Date", "Amount", "Currency"]
    ];

    monthlyTransactions.forEach(item => {
        rows.push([
            item.title,
            item.category,
            item.type,
            item.date,
            Number(item.amount).toFixed(2),
            currencySelect.value
        ]);
    });

    const csvContent = rows.map(row =>
        row.map(value => {
            const safeValue = String(value ?? "")
                .replace(/"/g, '""');

            return `"${safeValue}"`;
        }).join(",")
    ).join("\r\n");

    const blob = new Blob(
        ["\uFEFF" + csvContent],
        { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `Expense-Report-${selectedMonth}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
}

// ==========================================
// REPORT EVENT LISTENERS
// ==========================================

reportMonth.addEventListener("change", updateMonthlyReport);

document.getElementById("downloadReport")
    .addEventListener("click", downloadMonthlyReport);

// Refresh reports whenever dashboard data changes.
const originalUpdateDashboard = updateDashboard;

updateDashboard = function () {
    originalUpdateDashboard();
    updateMonthlyReport();
};

// Initial report display
updateMonthlyReport();
