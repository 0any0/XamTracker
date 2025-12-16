import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import Card from '../Card';
import './TimeDistributionChart.css';

const TimeDistributionChart = ({ data }) => {
    const COLORS = {
        correct: 'var(--color-success)',
        incorrect: 'var(--color-error)',
        missed: 'var(--color-warning)',
    };

    const chartData = [
        { name: 'Correct', value: data.correct, color: '#10b981' },
        { name: 'Incorrect', value: data.incorrect, color: '#ef4444' },
        { name: 'Missed', value: data.missed, color: '#f59e0b' },
    ].filter(item => item.value > 0);

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const total = data.correct + data.incorrect + data.missed;
            const percentage = ((payload[0].value / total) * 100).toFixed(1);
            return (
                <div className="custom-tooltip">
                    <p className="tooltip-label">{payload[0].name}</p>
                    <p className="tooltip-value">{payload[0].value} questions ({percentage}%)</p>
                </div>
            );
        }
        return null;
    };

    const renderLabel = ({ name, percent }) => {
        return `${name}: ${(percent * 100).toFixed(0)}%`;
    };

    return (
        <Card className="chart-card">
            <h3 className="chart-title">🎯 Question Distribution</h3>
            <p className="chart-description">Breakdown of your performance</p>

            {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={renderLabel}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            verticalAlign="bottom"
                            height={36}
                            wrapperStyle={{ fontSize: '14px' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            ) : (
                <div className="no-data">
                    <p>No data available. Complete and review exams to see distribution.</p>
                </div>
            )}
        </Card>
    );
};

export default TimeDistributionChart;
