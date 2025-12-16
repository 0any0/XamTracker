import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Card from '../Card';
import './PerformanceChart.css';

const PerformanceChart = ({ data }) => {
    // Custom tooltip
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="custom-tooltip">
                    <p className="tooltip-date">{payload[0].payload.date}</p>
                    <p className="tooltip-accuracy">Accuracy: {payload[0].value}%</p>
                    <p className="tooltip-questions">Questions: {payload[0].payload.questions}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <Card className="chart-card">
            <h3 className="chart-title">📈 Performance Trend</h3>
            <p className="chart-description">Track your accuracy over time</p>

            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis
                        dataKey="date"
                        stroke="var(--color-text-secondary)"
                        style={{ fontSize: '12px' }}
                    />
                    <YAxis
                        stroke="var(--color-text-secondary)"
                        style={{ fontSize: '12px' }}
                        domain={[0, 100]}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        wrapperStyle={{ fontSize: '14px', color: 'var(--color-text)' }}
                    />
                    <Line
                        type="monotone"
                        dataKey="accuracy"
                        stroke="var(--color-primary)"
                        strokeWidth={3}
                        dot={{ fill: 'var(--color-primary)', r: 5 }}
                        activeDot={{ r: 7 }}
                        name="Accuracy (%)"
                    />
                </LineChart>
            </ResponsiveContainer>
        </Card>
    );
};

export default PerformanceChart;
