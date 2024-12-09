document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        window.location.href = '/';
        return;
    }

    // Set username
    document.getElementById('username').textContent = user.username;

    // Event listeners
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('budgetSelect').addEventListener('change', updateCharts);

    // Initialize charts
    initializeCharts();
    
    // Load initial data
    loadBudgets().then(() => updateCharts());
});

function initializeCharts() {
    // Category Pie Chart
    const ctxPie = document.getElementById('categoryPieChart').getContext('2d');
    window.categoryPieChart = new Chart(ctxPie, {
        type: 'pie',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                    '#4BC0C0',
                    '#9966FF'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });

    // Monthly Bar Chart
    const ctxBar = document.getElementById('trendsBarChart').getContext('2d');
    window.trendsBarChart = new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Monthly Spending',
                data: [],
                backgroundColor: '#36A2EB'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: value => '$' + value
                    }
                }
            }
        }
    });

    // Daily Line Chart
    const ctxLine = document.getElementById('dailyLineChart').getContext('2d');
    window.dailyLineChart = new Chart(ctxLine, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Daily Spending',
                data: [],
                borderColor: '#8884d8',
                tension: 0.1,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: value => '$' + value
                    }
                }
            }
        }
    });
}

async function loadBudgets() {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        const response = await fetch(`/api/budgets/${user.id}`);
        const data = await response.json();

        if (data.success) {
            const budgetSelect = document.getElementById('budgetSelect');
            data.budgets.forEach(budget => {
                const option = document.createElement('option');
                option.value = budget._id;
                option.textContent = budget.name;
                budgetSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading budgets:', error);
    }
}

async function updateCharts() {
    const budgetId = document.getElementById('budgetSelect').value;
    
    try {
        const expenses = await fetchExpenses(budgetId);
        updateCategoryPieChart(expenses);
        updateTrendsBarChart(expenses);
        updateDailyLineChart(expenses);
    } catch (error) {
        console.error('Error updating charts:', error);
    }
}

async function fetchExpenses(budgetId) {
    const response = await fetch(`/api/expenses/budget/${budgetId}`);
    const data = await response.json();
    return data.success ? data.expenses : [];
}

function updateCategoryPieChart(expenses) {
    const categoryTotals = expenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
    }, {});

    window.categoryPieChart.data.labels = Object.keys(categoryTotals);
    window.categoryPieChart.data.datasets[0].data = Object.values(categoryTotals);
    window.categoryPieChart.update();
}

function updateTrendsBarChart(expenses) {
    const monthlyTotals = expenses.reduce((acc, expense) => {
        const month = new Date(expense.date).toLocaleString('default', { month: 'short' });
        acc[month] = (acc[month] || 0) + expense.amount;
        return acc;
    }, {});

    window.trendsBarChart.data.labels = Object.keys(monthlyTotals);
    window.trendsBarChart.data.datasets[0].data = Object.values(monthlyTotals);
    window.trendsBarChart.update();
}

function updateDailyLineChart(expenses) {
    const dailyTotals = expenses.reduce((acc, expense) => {
        const date = new Date(expense.date).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + expense.amount;
        return acc;
    }, {});

    // Sort dates
    const sortedDates = Object.keys(dailyTotals).sort();

    window.dailyLineChart.data.labels = sortedDates;
    window.dailyLineChart.data.datasets[0].data = sortedDates.map(date => dailyTotals[date]);
    window.dailyLineChart.update();
}

function logout() {
    localStorage.removeItem('user');
    window.location.href = '/';
}