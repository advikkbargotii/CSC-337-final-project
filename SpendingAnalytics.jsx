import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ResponsiveContainer } from 'recharts';

const SpendingAnalytics = () => {
  // Sample data remains the same as before
  const categoryData = [
    { name: 'Groceries', value: 500 },
    { name: 'Rent', value: 1200 },
    { name: 'Utilities', value: 300 },
    { name: 'Entertainment', value: 200 },
    { name: 'Transportation', value: 250 }
  ];

  const monthlyData = [
    { month: 'Jan', spent: 2300 },
    { month: 'Feb', spent: 2100 },
    { month: 'Mar', spent: 2500 },
    { month: 'Apr', spent: 2400 },
    { month: 'May', spent: 2200 },
    { month: 'Jun', spent: 2600 }
  ];

  const comparisonData = [
    { category: 'Groceries', budget: 600, actual: 500 },
    { category: 'Rent', budget: 1200, actual: 1200 },
    { category: 'Utilities', budget: 400, actual: 300 },
    { category: 'Entertainment', budget: 300, actual: 200 },
    { category: 'Transportation', budget: 300, actual: 250 }
  ];

  const dailyData = [
    { day: '1', spent: 80 },
    { day: '5', spent: 120 },
    { day: '10', spent: 95 },
    { day: '15', spent: 150 },
    { day: '20', spent: 85 },
    { day: '25', spent: 110 },
    { day: '30', spent: 75 }
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="grid grid-cols-2 gap-8 p-6">
      {/* Spending by Category */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-6 text-gray-800">Spending by Category</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `$${value}`} />
              <Legend layout="vertical" align="right" verticalAlign="middle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Spending Trends */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-6 text-gray-800">Monthly Spending Trends</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value}`} />
              <Bar dataKey="spent" fill="#3498db" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Budget vs Actual */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-6 text-gray-800">Budget vs. Actual Spending</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value}`} />
              <Legend />
              <Bar dataKey="budget" fill="#2ecc71" />
              <Bar dataKey="actual" fill="#e74c3c" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Daily Spending Pattern */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-6 text-gray-800">Daily Spending Pattern</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value}`} />
              <Line 
                type="monotone" 
                dataKey="spent" 
                stroke="#8884d8" 
                strokeWidth={2}
                dot={{ fill: '#8884d8' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default SpendingAnalytics;