import React, { useState, useMemo } from 'react';
import Card from '../components/Card';
import FilterBar from '../components/FilterBar';
import PerformanceChart from '../components/charts/PerformanceChart';
import TimeDistributionChart from '../components/charts/TimeDistributionChart';
import SubjectComparisonChart from '../components/charts/SubjectComparisonChart';
import { QuestionStatus } from '../hooks/useStore';
import './Analytics.css';

const Analytics = ({ subjects, exams, getOverallStats }) => {
    const [selectedSubjects, setSelectedSubjects] = useState(subjects.map(s => s.id));
    const [dateRange, setDateRange] = useState('all');

    // Filter exams based on selections
    const filteredExams = useMemo(() => {
        let filtered = exams.filter(e => e.status === 'reviewed');

        // Filter by subjects
        if (selectedSubjects.length > 0) {
            filtered = filtered.filter(e => selectedSubjects.includes(e.subjectId));
        }

        // Filter by date range
        if (dateRange !== 'all') {
            const now = new Date();
            const days = parseInt(dateRange.replace('days', ''));
            const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

            filtered = filtered.filter(e => new Date(e.startTime) >= cutoffDate);
        }

        return filtered;
    }, [exams, selectedSubjects, dateRange]);

    // Recalculate stats based on filtered exams
    const stats = useMemo(() => {
        let totalQuestions = 0;
        let correctQuestions = 0;
        let totalTime = 0;
        let totalExams = filteredExams.length;

        filteredExams.forEach(exam => {
            totalQuestions += exam.questions.length;
            totalTime += exam.totalTime;

            exam.questions.forEach(q => {
                if (q.status === QuestionStatus.CORRECT) correctQuestions++;
            });
        });

        const accuracy = totalQuestions > 0 ? (correctQuestions / totalQuestions) * 100 : 0;

        return {
            totalExams,
            totalQuestions,
            accuracy: accuracy.toFixed(1),
            totalTimeHours: (totalTime / 1000 / 60 / 60).toFixed(1)
        };
    }, [filteredExams]);


    // Prepare performance trend data
    const performanceData = useMemo(() => {
        const examsByDate = {}; // { "Jan 12": { correct: 10, total: 20 } }

        filteredExams.sort((a, b) => new Date(a.startTime) - new Date(b.startTime)).forEach(exam => {
            const date = new Date(exam.startTime).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });

            if (!examsByDate[date]) {
                examsByDate[date] = { correct: 0, total: 0 };
            }

            exam.questions.forEach(q => {
                examsByDate[date].total++;
                if (q.status === QuestionStatus.CORRECT) {
                    examsByDate[date].correct++;
                }
            });
        });

        return Object.entries(examsByDate)
            .map(([date, data]) => ({
                date,
                accuracy: data.total > 0 ? parseFloat(((data.correct / data.total) * 100).toFixed(1)) : 0,
                questions: data.total,
            }));
    }, [filteredExams]);

    // Prepare distribution data
    const distributionData = useMemo(() => {
        let correct = 0, incorrect = 0, missed = 0;

        filteredExams.forEach(exam => {
            exam.questions.forEach(q => {
                if (q.status === QuestionStatus.CORRECT) correct++;
                else if (q.status === QuestionStatus.INCORRECT) incorrect++;
                else if (q.status === QuestionStatus.UNATTEMPTED) missed++;
            });
        });

        return { correct, incorrect, missed };
    }, [filteredExams]);

    // Prepare subject comparison data
    const subjectData = useMemo(() => {
        const subjectStats = {};

        filteredExams.forEach(exam => {
            if (!subjectStats[exam.subjectId]) {
                subjectStats[exam.subjectId] = {
                    subject: exam.subjectName,
                    correct: 0,
                    total: 0,
                    totalTime: 0,
                    exams: 0,
                };
            }

            subjectStats[exam.subjectId].exams++;

            exam.questions.forEach(q => {
                subjectStats[exam.subjectId].total++;
                subjectStats[exam.subjectId].totalTime += q.timeSpent || 0;
                if (q.status === QuestionStatus.CORRECT) {
                    subjectStats[exam.subjectId].correct++;
                }
            });
        });

        return Object.values(subjectStats).map(stat => ({
            subject: stat.subject,
            accuracy: stat.total > 0 ? parseFloat(((stat.correct / stat.total) * 100).toFixed(1)) : 0,
            avgTime: stat.total > 0 ? Math.round((stat.totalTime / stat.total) / 1000) : 0,
            exams: stat.exams,
        }));
    }, [filteredExams]);

    const handleReset = () => {
        setSelectedSubjects(subjects.map(s => s.id));
        setDateRange('all');
    };

    return (
        <div className="analytics-page">
            <div className="analytics-header">
                <h1>Analytics Dashboard</h1>
                <p className="page-subtitle">Track your progress with detailed insights</p>
            </div>

            {/* Filters */}
            {subjects.length > 0 && (
                <FilterBar
                    subjects={subjects}
                    selectedSubjects={selectedSubjects}
                    onSubjectChange={setSelectedSubjects}
                    dateRange={dateRange}
                    onDateRangeChange={setDateRange}
                    onReset={handleReset}
                />
            )}

            {/* Overall Stats Cards */}
            <div className="analytics-grid">
                <Card className="analytics-card">
                    <div className="stat-icon">📝</div>
                    <h3>Total Exams</h3>
                    <div className="analytics-value">{stats.totalExams}</div>
                </Card>

                <Card className="analytics-card">
                    <div className="stat-icon">❓</div>
                    <h3>Total Questions</h3>
                    <div className="analytics-value">{stats.totalQuestions}</div>
                </Card>

                <Card className="analytics-card">
                    <div className="stat-icon">🎯</div>
                    <h3>Accuracy</h3>
                    <div className="analytics-value">{stats.accuracy}%</div>
                </Card>

                <Card className="analytics-card">
                    <div className="stat-icon">⏱️</div>
                    <h3>Study Time</h3>
                    <div className="analytics-value">{stats.totalTimeHours}h</div>
                </Card>
            </div>


            {/* Charts */}
            {filteredExams.length > 0 ? (
                <div className="charts-section">
                    <div className="charts-row full-width">
                        <PerformanceChart data={performanceData} />
                    </div>

                    <div className="charts-row">
                        <TimeDistributionChart data={distributionData} />
                        <SubjectComparisonChart data={subjectData} />
                    </div>
                </div>
            ) : (
                <Card className="empty-state-card">
                    <div className="empty-state-analytics">
                        <div className="empty-icon">📊</div>
                        <h2>No Data Available</h2>
                        <p>
                            {exams.length === 0
                                ? "Complete and review some exams to see your analytics"
                                : "No exams match the current filters or date range."}
                        </p>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default Analytics;
