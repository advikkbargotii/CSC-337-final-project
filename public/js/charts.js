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
    document.getElementById('budgetSelect').addEventListener('change', loadAndDisplayData);
    document.getElementById('timeRange').addEventListener('change', loadAndDisplayData);

    // Initial setup
    loadBudgets();
});

async function loadBudgets() {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        const response = await fetch(`/api/budgets/${user.id}`);
        const data = await response.json();

        if (data.success) {
            const budgetSelect = document.getElementById('budgetSelect');
            // Clear existing options except "All Budgets"
            budgetSelect.innerHTML = '<option value="all">All Budgets</option>';
            
            data.budgets.forEach(budget => {
                const option = document.createElement('option');
                option.value = budget._id;
                option.textContent = budget.name;
                budgetSelect.appendChild(option);
            });

            // Load initial data after budgets are loaded
            loadAndDisplayData();
        }
    } catch (error) {
        console.error('Error loading budgets:', error);
    }
}

async function loadAndDisplayData() {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        const selectedBudget = document.getElementById('budgetSelect').value;
        const timeRange = document.getElementById('timeRange').value;

        // First get all budgets for the user
        const budgetsResponse = await fetch(`/api/budgets/${user.id}`);
        const budgetsData = await budgetsResponse.json();

        if (!budgetsData.success) {
            throw new Error('Failed to load budgets');
        }

        let allExpenses = [];
        
        // If "all" is selected, get expenses for all budgets
        if (selectedBudget === 'all') {
            const expensesPromises = budgetsData.budgets.map(budget =>
                fetch(`/api/expenses/budget/${budget._id}`).then(res => res.json())
            );
            
            const expensesResults = await Promise.all(expensesPromises);
            allExpenses = expensesResults
                .filter(result => result.success)
                .flatMap(result => result.expenses);
        } else {
            // Get expenses for selected budget only
            const expensesResponse = await fetch(`/api/expenses/budget/${selectedBudget}`);
            const expensesData = await expensesResponse.json();
            
            if (expensesData.success) {
                allExpenses = expensesData.expenses;
            }
        }

        // Filter expenses by time range
        const filteredExpenses = filterExpensesByTimeRange(allExpenses, timeRange);
        
        // Process and display the data
        processAndDisplayData(filteredExpenses);
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

function filterExpensesByTimeRange(expenses, timeRange) {
    const now = new Date();
    const filtered = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        switch (timeRange) {
            case 'month':
                return expenseDate.getMonth() === now.getMonth() &&
                       expenseDate.getFullYear() === now.getFullYear();
            case 'year':
                return expenseDate.getFullYear() === now.getFullYear();
            default: // 'all'
                return true;
        }
    });
    return filtered;
}

function processAndDisplayData(expenses) {
    // Process category data
    const categoryData = expenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
    }, {});

    // Process monthly trend data
    const trendData = expenses.reduce((acc, expense) => {
        const month = new Date(expense.date).toLocaleString('default', { month: 'short' });
        acc[month] = (acc[month] || 0) + expense.amount;
        return acc;
    }, {});

    // Convert to arrays for D3
    const categoryChartData = Object.entries(categoryData)
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount);

    const trendChartData = Object.entries(trendData)
        .map(([month, amount]) => ({ month, amount }))
        .sort((a, b) => {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return months.indexOf(a.month) - months.indexOf(b.month);
        });

    // Draw the charts
    drawPieChart(categoryChartData);
    drawBarChart(trendChartData);
}

// Your existing drawPieChart and drawBarChart functions remain the same
function drawPieChart(data) {
    // Clear previous chart
    d3.select('#categoryChart').selectAll('*').remove();

    if (data.length === 0) {
        d3.select('#categoryChart')
            .append('div')
            .attr('class', 'no-data')
            .text('No data available for the selected period');
        return;
    }

    const width = 400;
    const height = 400;
    const radius = Math.min(width, height) / 2;

    const svg = d3.select('#categoryChart')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${width / 2}, ${height / 2})`);

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const pie = d3.pie()
        .value(d => d.amount)
        .sort(null);

    const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius - 20);

    const arcs = svg.selectAll('arc')
        .data(pie(data))
        .enter()
        .append('g')
        .attr('class', 'arc');

    arcs.append('path')
        .attr('d', arc)
        .attr('fill', (d, i) => color(i))
        .attr('stroke', 'white')
        .style('stroke-width', '2px');

    // Add labels
    arcs.append('text')
        .attr('transform', d => `translate(${arc.centroid(d)})`)
        .attr('text-anchor', 'middle')
        .text(d => {
            const percentage = ((d.data.amount / d3.sum(data, d => d.amount)) * 100).toFixed(1);
            return `${d.data.category}\n${percentage}%`;
        })
        .style('font-size', '12px')
        .style('fill', 'white');
}

function drawBarChart(data) {
    // Clear previous chart
    d3.select('#trendChart').selectAll('*').remove();

    if (data.length === 0) {
        d3.select('#trendChart')
            .append('div')
            .attr('class', 'no-data')
            .text('No data available for the selected period');
        return;
    }

    const margin = { top: 20, right: 30, bottom: 40, left: 60 };
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select('#trendChart')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Create scales
    const x = d3.scaleBand()
        .domain(data.map(d => d.month))
        .range([0, width])
        .padding(0.2);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.amount) * 1.1])
        .range([height, 0]);

    // Add bars
    svg.selectAll('rect')
        .data(data)
        .enter()
        .append('rect')
        .attr('x', d => x(d.month))
        .attr('y', d => y(d.amount))
        .attr('width', x.bandwidth())
        .attr('height', d => height - y(d.amount))
        .attr('fill', '#3498db');

    // Add X axis
    svg.append('g')
        .attr('transform', `translate(0, ${height})`)
        .call(d3.axisBottom(x));

    // Add Y axis
    svg.append('g')
        .call(d3.axisLeft(y).tickFormat(formatCurrency));

    // Add value labels on top of bars
    svg.selectAll('.value-label')
        .data(data)
        .enter()
        .append('text')
        .attr('class', 'value-label')
        .attr('x', d => x(d.month) + x.bandwidth() / 2)
        .attr('y', d => y(d.amount) - 5)
        .attr('text-anchor', 'middle')
        .text(d => formatCurrency(d.amount))
        .style('font-size', '12px');
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function logout() {
    localStorage.removeItem('user');
    window.location.href = '/';
}
