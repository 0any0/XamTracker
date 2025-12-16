import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Card from '../Card';
import './SubjectComparisonChart.css';

const SubjectComparisonChart = ({ data }) => {
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="custom-tooltip">
                    <p className="tooltip-subject">{payload[0].payload.subject}</p>
                    <p className="tooltip-stat">Accuracy: {payload[0].value}%</p>
                    <p className="tooltip-stat">Exams: {payload[0].payload.exams}</p>
                    <p className="tooltip-stat">Avg Time: {payload[0].payload.avgTime}s</p>
                </div>
            );
        }
        return null;
    };

    return (
        <Card className="chart-card">
            <h3 className="chart-title">📊 Subject Comparison</h3>
            <p className="chart-description">Compare performance across subjects</p>

            {data && data.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                        data={data}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis
                            dataKey="subject"
                            stroke="var(--color-text-secondary)"
                            style={{ fontSize: '12px' }}
                            angle={-45}
                            textAnchor="end"
                            height={80}
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
                        <Bar
                            dataKey="accuracy"
                            fill="var(--color-primary)"
                            radius={[8, 8, 0, 0]}
                            name="Accuracy (%)"
                        />
                    </BarChart>
                </ResponsiveContainer>
            ) : (
                <div className="no-data">
                    <p>No data available. Review exams in multiple subjects to see comparison.</p>
                </div>
            )}
        </Card>
    );
};

export default SubjectComparisonChart;
