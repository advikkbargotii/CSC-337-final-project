// public/js/charts.js
// Contributors: Harshit Jain, Ashish Dev Choudhary, Shivansh Singh, Advik Bargoti
// Javascript file for Charts Functionality
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
    document.getElementById('timeRange').addEventListener('change', updateCharts);

    // Initialize charts
    initializeCharts();
    
    // Load initial data
    loadBudgets().then(() => updateCharts());
});

// Common chart options
const commonOptions = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 1.5,
    plugins: {
        legend: {
            position: 'right',
            labels: {
                boxWidth: 12,
                padding: 10,
                font: {
                    size: 11
                }
            }
        }
    }
};

async function loadBudgets() {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        const response = await fetch(`/api/budgets/${user.id}`);
        const data = await response.json();

        if (data.success) {
            const budgetSelect = document.getElementById('budgetSelect');
            budgetSelect.innerHTML = '<option value="all">All Budgets</option>';
            
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

function initializeCharts() {
    const categoryCtx = document.getElementById('categoryChart').getContext('2d');
    window.categoryChart = new Chart(categoryCtx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
                    '#9966FF', '#FF9F40', '#00CC99', '#FF99CC'
                ]
            }]
        },
        options: {
            ...commonOptions,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        generateLabels: function(chart) {
                            const data = chart.data;
                            if (data.labels.length && data.datasets.length) {
                                return data.labels.map((label, i) => ({
                                    text: `${label}: $${data.datasets[0].data[i].toFixed(2)}`,
                                    fillStyle: data.datasets[0].backgroundColor[i],
                                    hidden: isNaN(data.datasets[0].data[i])
                                }));
                            }
                            return [];
                        }
                    }
                }
            }
        }
    });

    const trendCtx = document.getElementById('trendChart').getContext('2d');
    window.trendChart = new Chart(trendCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Monthly Spending',
                data: [],
                borderColor: '#36A2EB',
                tension: 0.4,
                fill: false
            }]
        },
        options: {
            ...commonOptions,
            plugins: {
                legend: {
                    display: false
                }
            },
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

    const comparisonCtx = document.getElementById('comparisonChart').getContext('2d');
    window.comparisonChart = new Chart(comparisonCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Budget',
                    data: [],
                    backgroundColor: '#36A2EB'
                },
                {
                    label: 'Actual',
                    data: [],
                    backgroundColor: '#FF6384'
                }
            ]
        },
        options: {
            ...commonOptions,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: value => '$' + value
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top'
                }
            }
        }
    });

    const dailyCtx = document.getElementById('dailyChart').getContext('2d');
    window.dailyChart = new Chart(dailyCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Daily Spending',
                data: [],
                backgroundColor: '#4BC0C0'
            }]
        },
        options: {
            ...commonOptions,
            plugins: {
                legend: {
                    display: false
                }
            },
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

async function updateCharts() {
    const budgetId = document.getElementById('budgetSelect').value;
    const timeRange = document.getElementById('timeRange').value;
    
    try {
        const data = await fetchChartData(budgetId, timeRange);
        updateCategoryChart(data.categoryData);
        updateTrendChart(data.trendData);
        updateComparisonChart(data.comparisonData);
        updateDailyChart(data.dailyData);
    } catch (error) {
        console.error('Error updating charts:', error);
    }
}

async function fetchChartData(budgetId, timeRange) {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        let expenses = [];
        let budgets = [];

        if (budgetId === 'all') {
            const response = await fetch(`/api/budgets/${user.id}`);
            const data = await response.json();
            budgets = data.budgets;
            expenses = budgets.flatMap(budget => budget.expenses || []);
        } else {
            const response = await fetch(`/api/budgets/single/${budgetId}`);
            const data = await response.json();
            budgets = [data.budget];
            expenses = data.budget.expenses || [];
        }

        expenses = filterExpensesByTimeRange(expenses, timeRange);

        return {
            categoryData: processCategoryData(expenses, budgets),
            trendData: processTrendData(expenses),
            comparisonData: processComparisonData(expenses, budgets),
            dailyData: processDailyData(expenses)
        };
    } catch (error) {
        console.error('Error fetching chart data:', error);
        throw error;
    }
}

function filterExpensesByTimeRange(expenses, timeRange) {
    const now = new Date();
    const startDate = new Date();

    switch (timeRange) {
        case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
        case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
        case 'year':
            startDate.setFullYear(now.getFullYear() - 1);
            break;
        default:
            return expenses;
    }

    return expenses.filter(expense => new Date(expense.date) >= startDate);
}

function processCategoryData(expenses) {
    const categoryTotals = expenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
    }, {});

    return {
        labels: Object.keys(categoryTotals),
        data: Object.values(categoryTotals)
    };
}

function processTrendData(expenses) {
    const monthlyData = expenses.reduce((acc, expense) => {
        const month = new Date(expense.date).toLocaleString('default', { month: 'short' });
        acc[month] = (acc[month] || 0) + expense.amount;
        return acc;
    }, {});

    return {
        labels: Object.keys(monthlyData),
        data: Object.values(monthlyData)
    };
}

function processComparisonData(expenses, budgets) {
    const categoryTotals = expenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
    }, {});

    const categoryBudgets = budgets.reduce((acc, budget) => {
        budget.categories.forEach(cat => {
            acc[cat.name] = (acc[cat.name] || 0) + cat.limit;
        });
        return acc;
    }, {});

    const categories = Array.from(new Set([
        ...Object.keys(categoryTotals),
        ...Object.keys(categoryBudgets)
    ]));

    return {
        labels: categories,
        budget: categories.map(cat => categoryBudgets[cat] || 0),
        actual: categories.map(cat => categoryTotals[cat] || 0)
    };
}

function processDailyData(expenses) {
    const dailyTotals = expenses.reduce((acc, expense) => {
        const date = new Date(expense.date).toLocaleDateString();
        acc[date] = (acc[date] || 0) + expense.amount;
        return acc;
    }, {});

    // Sort dates
    const sortedDates = Object.keys(dailyTotals)
        .sort((a, b) => new Date(a) - new Date(b));

    return {
        labels: sortedDates,
        data: sortedDates.map(date => dailyTotals[date])
    };
}

function updateCategoryChart(data) {
    window.categoryChart.data.labels = data.labels;
    window.categoryChart.data.datasets[0].data = data.data;
    window.categoryChart.update();
}

function updateTrendChart(data) {
    window.trendChart.data.labels = data.labels;
    window.trendChart.data.datasets[0].data = data.data;
    window.trendChart.update();
}

function updateComparisonChart(data) {
    window.comparisonChart.data.labels = data.labels;
    window.comparisonChart.data.datasets[0].data = data.budget;
    window.comparisonChart.data.datasets[1].data = data.actual;
    window.comparisonChart.update();
}

function updateDailyChart(data) {
    window.dailyChart.data.labels = data.labels;
    window.dailyChart.data.datasets[0].data = data.data;
    window.dailyChart.update();
}

function logout() {
    localStorage.removeItem('user');
    window.location.href = '/';
}
