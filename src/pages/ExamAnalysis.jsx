import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Award, Target, HelpCircle } from 'lucide-react';
import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    BarElement,
    LineElement,
    PointElement,
    CategoryScale,
    LinearScale,
    ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import Button from '../components/Button';
import Card from '../components/Card';
import { QuestionStatus } from '../hooks/useStore';
import './ExamAnalysis.css';

// Register ChartJS
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

const ExamAnalysis = ({ getExamById }) => {
    const { examId } = useParams();
    const navigate = useNavigate();
    const [breakdownView, setBreakdownView] = useState('questions'); // 'questions' or 'marks'
    const exam = getExamById(examId);

    if (!exam) return <div className="loading">Loading...</div>;

    const stats = useMemo(() => {
        let correct = 0, incorrect = 0, missed = 0;
        let timeCorrect = 0, timeIncorrect = 0;
        let totalTime = 0;
        let totalObtainedMarks = 0;

        // Detailed marks breakdown
        let positiveMarks = 0;
        let negativeMarks = 0;
        let lostPotentialMarks = 0; // Marks lost because incorrect (failed to get positive)
        let missedPotentialMarks = 0; // Marks lost because unattempted

        // Helper to get max potential mark of a question
        // We reuse the logic: if marks defined, its that. If not, default 4 (or whatever logic Review uses)
        // But better: we can try to guess potential if not explicitly stored.
        // Actually, let's treat "Marks Lost" as:
        // 1. Negative Marking (Penalty)
        // 2. Opportunity Cost (What you could have earned)

        // Simpler approach for chart:
        // Segment 1: Net Score (Green) -> Wait, Net Score can be small.
        // Let's use: Positive Marks (Green), Negative Deductions (Red), Unearned/Missed (Yellow/Gray)

        let maxTime = -1;
        let minTime = Infinity;
        let maxTimeQuestion = null;
        let minTimeQuestion = null;
        const incorrectQuestions = [];

        exam.questions.forEach(q => {
            // Try to deduce max mark for this specific question if not stored
            // Try to deduce max mark for this specific question if not stored
            let qMaxMark = 4; // Default fallback

            // 1. Check explicit question max marks
            if (q.maxMarks !== undefined && q.maxMarks !== null && q.maxMarks !== '') {
                const val = parseFloat(q.maxMarks);
                if (!isNaN(val)) qMaxMark = val;
            } else {
                // 2. Fallback to section marks
                let foundSection = false;
                if (exam.sections && exam.sections.length > 0) {
                    const s = exam.sections.find(sect => q.number >= sect.startQuestion && q.number <= sect.endQuestion);
                    if (s && s.marks) {
                        const m = parseFloat(s.marks);
                        if (!isNaN(m)) {
                            qMaxMark = m;
                            foundSection = true;
                        }
                    }
                }

                // 3. Fallback to global total max marks
                if (!foundSection && exam.totalMaxMarks) {
                    const t = parseFloat(exam.totalMaxMarks);
                    if (!isNaN(t) && exam.questions.length > 0) {
                        qMaxMark = t / exam.questions.length;
                    }
                }
            }

            // Time extremes
            const t = q.timeSpent || 0;
            if (t > maxTime) {
                maxTime = t;
                maxTimeQuestion = q;
            }
            if (t > 0 && t < minTime) {
                minTime = t;
                minTimeQuestion = q;
            }

            // Status Counts & Time
            if (q.status === QuestionStatus.CORRECT) {
                correct++;
                timeCorrect += t;
            } else if (q.status === QuestionStatus.INCORRECT) {
                incorrect++;
                timeIncorrect += t;
                incorrectQuestions.push(q);
            } else {
                missed++;
            }
            totalTime += t;

            // Marks Logic (Independent of status to handle partial credit in 'Incorrect')
            const earned = q.marks || 0;
            totalObtainedMarks += earned;

            if (earned > 0) {
                positiveMarks += earned;
            } else if (earned < 0) {
                negativeMarks += earned;
            }

            // Potential Lost Logic
            if (q.status === QuestionStatus.UNATTEMPTED) {
                missedPotentialMarks += qMaxMark;
            } else {
                // For Attempted (Correct/Incorrect), lost is Max - (Positive Part of Earned)
                // If you got -1, you lost the full Max potential (plus the penalty, tracked separately)
                const positivePart = earned > 0 ? earned : 0;
                lostPotentialMarks += (qMaxMark - positivePart);
            }
        });

        // Use stored max marks or fallback (though updateStore ensures it's stored for new exams)
        const totalMaxMarks = exam.totalMaxMarks || 0;
        const accuracy = exam.questions.length ? ((correct / exam.questions.length) * 100).toFixed(1) : 0;
        const scorePercentage = totalMaxMarks > 0 ? ((totalObtainedMarks / totalMaxMarks) * 100).toFixed(1) : accuracy;

        // Handle empty case for minTime
        if (minTime === Infinity) minTimeQuestion = null;

        return {
            correct,
            incorrect,
            missed,
            accuracy: accuracy,
            scorePercentage: scorePercentage,
            totalObtainedMarks,
            totalMaxMarks,
            positiveMarks,
            negativeMarks,
            lostPotentialMarks,
            missedPotentialMarks,
            avgTimeCorrect: correct ? timeCorrect / correct : 0,
            avgTimeIncorrect: incorrect ? timeIncorrect / incorrect : 0,
            avgGlobal: exam.questions.length ? totalTime / exam.questions.length : 0,
            maxTimeQuestion,
            minTimeQuestion,
            incorrectQuestions
        };
    }, [exam]);

    // Data for Charts
    const statusData = {
        labels: ['Correct', 'Incorrect', 'Missed'],
        datasets: [{
            data: [stats.correct, stats.incorrect, stats.missed],
            backgroundColor: [
                'rgba(34, 197, 94, 0.8)',
                'rgba(239, 68, 68, 0.8)',
                'rgba(234, 179, 8, 0.8)',
            ],
            borderColor: [
                '#22c55e',
                '#ef4444',
                '#eab308',
            ],
            borderWidth: 1,
        }]
    };

    const marksData = {
        labels: ['Marks Earned', 'Negative Marks', 'Potential Lost (Wrong)', 'Potential Lost (Missed)'],
        datasets: [{
            data: [
                stats.positiveMarks,
                Math.abs(stats.negativeMarks),
                stats.lostPotentialMarks,
                stats.missedPotentialMarks
            ],
            backgroundColor: [
                'rgba(34, 197, 94, 0.8)', // Earned
                'rgba(239, 68, 68, 0.8)', // Negative
                'rgba(249, 115, 22, 0.6)', // Opportunity cost (Wrong) - Orange
                'rgba(107, 114, 128, 0.6)', // Opportunity cost (Missed) - Gray
            ],
            borderWidth: 0,
        }]
    };

    const timeData = {
        labels: ['Avg Correct', 'Avg Incorrect', 'Avg Overall'],
        datasets: [{
            label: 'Time per Question (seconds)',
            data: [
                stats.avgTimeCorrect / 1000,
                stats.avgTimeIncorrect / 1000,
                stats.avgGlobal / 1000
            ],
            backgroundColor: [
                'rgba(34, 197, 94, 0.6)',
                'rgba(239, 68, 68, 0.6)',
                'rgba(59, 130, 246, 0.6)',
            ],
            borderRadius: 6,
        }]
    };

    const formatTime = (ms) => `${(ms / 1000).toFixed(1)}s`;

    return (
        <div className="exam-analysis-page">
            <Button
                variant="ghost"
                icon={<ArrowLeft size={20} />}
                onClick={() => navigate(`/exam-details/${examId}`)}
            >
                Back to Details
            </Button>

            <header className="analysis-header">
                <h1>Deep Dive Analysis</h1>
                <p>{exam.name || exam.subjectName}</p>
            </header>

            <div className="analysis-grid">
                {/* Score Breakdown (Doughnut) */}
                <Card className="chart-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3>Performance Breakdown</h3>
                        <div className="view-toggle" style={{ display: 'flex', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-sm)', padding: '2px' }}>
                            <button
                                onClick={() => setBreakdownView('questions')}
                                style={{
                                    border: 'none',
                                    background: breakdownView === 'questions' ? 'var(--color-bg)' : 'transparent',
                                    color: breakdownView === 'questions' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                                    padding: '4px 12px',
                                    borderRadius: 'calc(var(--radius-sm) - 2px)',
                                    fontSize: '0.85rem',
                                    fontWeight: breakdownView === 'questions' ? '600' : '400',
                                    cursor: 'pointer',
                                    boxShadow: breakdownView === 'questions' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                                }}
                            >
                                Questions
                            </button>
                            <button
                                onClick={() => setBreakdownView('marks')}
                                style={{
                                    border: 'none',
                                    background: breakdownView === 'marks' ? 'var(--color-bg)' : 'transparent',
                                    color: breakdownView === 'marks' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                                    padding: '4px 12px',
                                    borderRadius: 'calc(var(--radius-sm) - 2px)',
                                    fontSize: '0.85rem',
                                    fontWeight: breakdownView === 'marks' ? '600' : '400',
                                    cursor: 'pointer',
                                    boxShadow: breakdownView === 'marks' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                                }}
                            >
                                Marks
                            </button>
                        </div>
                    </div>
                    <div className="chart-container" style={{ position: 'relative' }}>
                        <Doughnut
                            data={breakdownView === 'questions' ? statusData : marksData}
                            options={{
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: { position: 'bottom' },
                                    tooltip: {
                                        callbacks: {
                                            label: (context) => {
                                                const label = context.label || '';
                                                const value = context.parsed;
                                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) + '%' : '0%';
                                                return `${label}: ${value} (${percentage})`;
                                            }
                                        }
                                    }
                                }
                            }}
                        />
                    </div>
                    {/* Detailed Breakdown Text */}
                    <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--color-text-secondary)', borderTop: '1px solid var(--color-border)', paddingTop: '0.8rem' }}>
                        {breakdownView === 'questions' ? (
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Attempted: <strong>{exam.questions.length - stats.missed}/{exam.questions.length}</strong></span>
                                <span>Skipped: <strong>{stats.missed}</strong></span>
                            </div>
                        ) : (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <span>Marks Earned:</span>
                                    <span style={{ color: 'var(--color-success)' }}>+{stats.positiveMarks}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <span>Negative Marks:</span>
                                    <span style={{ color: 'var(--color-error)' }}>-{Math.abs(stats.negativeMarks)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', paddingTop: '4px', borderTop: '1px dashed var(--color-border)' }}>
                                    <span>Net Score:</span>
                                    <span>{stats.totalObtainedMarks} / {stats.totalMaxMarks}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Time Analysis (Bar) */}
                <Card className="chart-card">
                    <h3>Time Management Analysis</h3>
                    <div className="chart-container">
                        <Bar
                            data={timeData}
                            options={{
                                maintainAspectRatio: false,
                                scales: { y: { beginAtZero: true, title: { display: true, text: 'Seconds' } } },
                                plugins: { legend: { display: false } }
                            }}
                        />
                    </div>
                </Card>

                {/* Text Insights */}
                <Card className="insights-card">
                    <h3>Key Insights</h3>
                    <div className="insight-item">
                        <Target className="icon-success" />
                        <div>
                            <h4>Score: {stats.scorePercentage}% {stats.totalMaxMarks > 0 && <span style={{ fontSize: '0.8em', color: 'var(--color-text-secondary)' }}>({stats.totalObtainedMarks}/{stats.totalMaxMarks} Marks)</span>}</h4>
                            <p>You answered {stats.correct} out of {exam.questions.length} questions correctly ({stats.accuracy}% accuracy).</p>
                        </div>
                    </div>

                    <div className="insight-item">
                        <Clock className="icon-info" />
                        <div>
                            <h4>Speed Analysis</h4>
                            <p>
                                You spend about <strong>{formatTime(stats.avgTimeCorrect)}</strong> on correct answers
                                vs <strong>{formatTime(stats.avgTimeIncorrect)}</strong> on incorrect ones.
                                {stats.avgTimeIncorrect > stats.avgTimeCorrect * 1.5 &&
                                    " You might be spending too long on questions you don't know."}
                            </p>
                        </div>
                    </div>

                    <div className="insight-item">
                        <Award className="icon-warning" />
                        <div>
                            <h4>Improvement Focus</h4>
                            <p>
                                {stats.missed > 0
                                    ? `Review the ${stats.missed} questions you skipped/missed.`
                                    : stats.incorrect > 0
                                        ? "Great attempt rate! Focus on reducing negative marking errors."
                                        : "Excellent work! Perfect accuracy."}
                            </p>
                        </div>
                    </div>
                </Card>
                {/* Extreme Statistics */}
                <Card className="chart-card auto-height">
                    <h3>Time Extremes</h3>
                    <div className="extremes-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="extreme-item" style={{ padding: '1rem', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Longest Time Spent</div>
                            {stats.maxTimeQuestion ? (
                                <div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{formatTime(stats.maxTimeQuestion.timeSpent)}</div>
                                    <div style={{ fontSize: '0.9rem' }}>Question {stats.maxTimeQuestion.number}</div>
                                    <div className={`status-badge status-${stats.maxTimeQuestion.status}`} style={{ marginTop: '0.5rem', display: 'inline-block', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem' }}>
                                        {stats.maxTimeQuestion.status}
                                    </div>
                                </div>
                            ) : <div>-</div>}
                        </div>
                        <div className="extreme-item" style={{ padding: '1rem', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Shortest Time Spent</div>
                            {stats.minTimeQuestion ? (
                                <div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{formatTime(stats.minTimeQuestion.timeSpent)}</div>
                                    <div style={{ fontSize: '0.9rem' }}>Question {stats.minTimeQuestion.number}</div>
                                    <div className={`status-badge status-${stats.minTimeQuestion.status}`} style={{ marginTop: '0.5rem', display: 'inline-block', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem' }}>
                                        {stats.minTimeQuestion.status}
                                    </div>
                                </div>
                            ) : <div>-</div>}
                        </div>
                    </div>
                </Card>

                {/* Incorrect Questions List */}
                {stats.incorrectQuestions.length > 0 && (
                    <Card className="chart-card auto-height" style={{ gridColumn: '1 / -1' }}>
                        <h3>Needs Attention ({stats.incorrectQuestions.length})</h3>
                        <div className="incorrect-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                            {stats.incorrectQuestions.map(q => (
                                <div key={q.id} style={{ padding: '1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ fontWeight: 'bold' }}>Question {q.number}</span>
                                        <span style={{ color: 'var(--color-error)' }}>{q.marks} Marks</span>
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                                        Time: {formatTime(q.timeSpent)}
                                    </div>
                                    {q.note && (
                                        <div style={{ fontSize: '0.85rem', background: 'var(--color-bg-secondary)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                                            <span style={{ fontWeight: '600' }}>Note:</span> {q.note}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </Card>
                )}

                {/* Section-wise Analysis */}
                {exam.sections && exam.sections.length > 0 && (() => {
                    const sectionLabels = exam.sections.map(s => s.name);
                    const sectionStats = exam.sections.map(s => {
                        const qs = exam.questions.filter(q => q.number >= s.startQuestion && q.number <= s.endQuestion);
                        const totalSecObtained = qs.reduce((sum, q) => sum + (q.marks || 0), 0);
                        const totalSecMax = qs.reduce((sum, q) => {
                            // 1. Check explicit question max marks
                            if (q.maxMarks !== undefined && q.maxMarks !== null && q.maxMarks !== '') {
                                const val = parseFloat(q.maxMarks);
                                if (!isNaN(val)) return sum + val;
                            }

                            // 2. Fallback to section marks
                            if (s.marks) {
                                const m = parseFloat(s.marks);
                                if (!isNaN(m)) return sum + m;
                            }

                            return sum + 4; // Final default
                        }, 0);

                        const sectionTime = qs.reduce((sum, q) => sum + (q.timeSpent || 0), 0);
                        const positiveSecMarks = qs.reduce((sum, q) => sum + (q.marks > 0 ? q.marks : 0), 0);

                        return {
                            name: s.name,
                            correct: qs.filter(q => q.status === QuestionStatus.CORRECT).length,
                            incorrect: qs.filter(q => q.status === QuestionStatus.INCORRECT).length,
                            missed: qs.filter(q => q.status !== QuestionStatus.CORRECT && q.status !== QuestionStatus.INCORRECT).length,
                            attempted: qs.filter(q => q.status !== QuestionStatus.UNATTEMPTED).length,
                            totalQuestions: qs.length,
                            marksObtained: totalSecObtained,
                            marksPositive: positiveSecMarks,
                            marksMax: totalSecMax,
                            totalTime: sectionTime
                        };
                    });

                    const hasNegativeMarks = stats.negativeMarks < 0;

                    const sectionChartData = (() => {
                        if (breakdownView === 'questions') {
                            return {
                                labels: sectionLabels,
                                datasets: [
                                    {
                                        label: 'Correct',
                                        data: sectionStats.map(s => s.correct),
                                        backgroundColor: 'rgba(34, 197, 94, 0.8)',
                                    },
                                    {
                                        label: 'Incorrect',
                                        data: sectionStats.map(s => s.incorrect),
                                        backgroundColor: 'rgba(239, 68, 68, 0.8)',
                                    },
                                    {
                                        label: 'Missed',
                                        data: sectionStats.map(s => s.missed),
                                        backgroundColor: 'rgba(234, 197, 8, 0.8)',
                                    }
                                ]
                            };
                        }

                        // Marks View
                        if (hasNegativeMarks) {
                            return {
                                labels: sectionLabels,
                                datasets: [
                                    {
                                        label: 'Positive Score %',
                                        data: sectionStats.map(s => s.marksMax > 0 ? ((s.marksPositive / s.marksMax) * 100) : 0),
                                        backgroundColor: 'rgba(34, 197, 94, 0.6)',
                                        borderRadius: 4,
                                        order: 2,
                                        barPercentage: 0.7,
                                        categoryPercentage: 0.8
                                    },
                                    {
                                        label: 'Net Score %',
                                        data: sectionStats.map(s => s.marksMax > 0 ? ((s.marksObtained / s.marksMax) * 100) : 0),
                                        backgroundColor: 'rgba(59, 130, 246, 0.8)',
                                        borderRadius: 4,
                                        order: 1,
                                        barPercentage: 0.7,
                                        categoryPercentage: 0.8
                                    }
                                ]
                            };
                        }

                        // Simple View (No Negatives)
                        return {
                            labels: sectionLabels,
                            datasets: [{
                                label: 'Score Percentage',
                                data: sectionStats.map(s => s.marksMax > 0 ? ((s.marksObtained / s.marksMax) * 100) : 0),
                                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                                borderRadius: 6,
                                barThickness: 40,
                            }]
                        };
                    })();

                    return (
                        <Card className="chart-card auto-height" style={{ gridColumn: '1 / -1' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3>Section Performance</h3>
                                {breakdownView === 'questions' ?
                                    <small style={{ color: 'var(--color-text-secondary)' }}>Breakdown by Count</small> :
                                    <small style={{ color: 'var(--color-text-secondary)' }}>
                                        {hasNegativeMarks ? 'Comparing Positive vs Net Score %' : 'Percentage Score'}
                                    </small>
                                }
                            </div>

                            <div className="chart-container" style={{ height: '300px', marginBottom: '2rem' }}>
                                <Bar
                                    data={sectionChartData}
                                    options={{
                                        maintainAspectRatio: false,
                                        interaction: {
                                            mode: 'index',
                                            intersect: false,
                                        },
                                        scales: {
                                            x: {
                                                stacked: breakdownView === 'questions', // Stacked only for questions
                                                grid: { display: false }
                                            },
                                            y: {
                                                stacked: breakdownView === 'questions',
                                                beginAtZero: true,
                                                max: breakdownView === 'marks' ? 100 : undefined,
                                                title: {
                                                    display: true,
                                                    text: breakdownView === 'marks' ? 'Percentage (%)' : 'Count'
                                                }
                                            }
                                        },
                                        plugins: {
                                            tooltip: {
                                                callbacks: {
                                                    label: (context) => {
                                                        const idx = context.dataIndex;
                                                        const s = sectionStats[idx];

                                                        if (breakdownView === 'marks') {
                                                            if (hasNegativeMarks) {
                                                                if (context.dataset.label.includes('Positive')) {
                                                                    return `Positive: ${context.parsed.y.toFixed(1)}% (${s.marksPositive.toFixed(1)}/${s.marksMax.toFixed(1)})`;
                                                                }
                                                                return `Net Score: ${context.parsed.y.toFixed(1)}% (${s.marksObtained.toFixed(1)}/${s.marksMax.toFixed(1)})`;
                                                            }
                                                            // Standard single bar
                                                            return `Score: ${context.parsed.y.toFixed(1)}% (${s.marksObtained.toFixed(1)}/${s.marksMax.toFixed(1)})`;
                                                        }

                                                        const label = context.dataset.label || '';
                                                        const value = context.parsed.y;
                                                        const total = context.chart.data.datasets.reduce((sum, ds) => sum + ds.data[context.dataIndex], 0);
                                                        const percentage = total > 0 ? ((value / total) * 100).toFixed(0) + '%' : '0%';
                                                        return `${label}: ${value} (${percentage})`;
                                                    }
                                                }
                                            }
                                        }
                                    }}
                                />
                            </div>

                            {/* Detailed Section Table */}
                            <div className="table-container" style={{ overflowX: 'auto', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                                <h4 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Detailed Statistics</h4>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                    <thead>
                                        <tr style={{ textAlign: 'left', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                                            <th style={{ padding: '8px' }}>Section</th>
                                            <th style={{ padding: '8px' }}>Score</th>
                                            <th style={{ padding: '8px' }}>Accuracy</th>
                                            <th style={{ padding: '8px' }}>Attempted</th>
                                            <th style={{ padding: '8px' }}>Time</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sectionStats.map((s, idx) => {
                                            const accuracy = s.attempted > 0 ? ((s.correct / s.attempted) * 100).toFixed(1) : '0.0';
                                            const scorePct = s.marksMax > 0 ? ((s.marksObtained / s.marksMax) * 100).toFixed(1) : '0.0';
                                            // const timePct = stats.avgGlobal > 0 ? (s.totalTime / stats.avgGlobal) : 0; // Relative to global isn't great. Just show formatted.

                                            // Qualitative color for accuracy
                                            const accColor = parseFloat(accuracy) >= 75 ? 'var(--color-success)' : parseFloat(accuracy) >= 40 ? 'var(--color-warning)' : 'var(--color-error)';

                                            return (
                                                <tr key={idx} style={{ borderTop: '1px solid var(--color-border)' }}>
                                                    <td style={{ padding: '12px 8px', fontWeight: 'bold' }}>{s.name}</td>
                                                    <td style={{ padding: '12px 8px' }}>
                                                        <div style={{ fontWeight: '600' }}>{s.marksObtained} / {s.marksMax.toFixed(1)}</div>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{scorePct}%</div>
                                                    </td>
                                                    <td style={{ padding: '12px 8px' }}>
                                                        <div style={{ color: accColor, fontWeight: '600' }}>{accuracy}%</div>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{s.correct} Correct</div>
                                                    </td>
                                                    <td style={{ padding: '12px 8px' }}>
                                                        <div>{s.attempted} / {s.totalQuestions}</div>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{s.missed} Missed</div>
                                                    </td>
                                                    <td style={{ padding: '12px 8px', fontFamily: 'monospace' }}>
                                                        {formatTime(s.totalTime)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    );
                })()}
                {/* Detailed Question Analysis Table */}
                <Card className="chart-card auto-height" style={{ marginTop: '2rem' }}>
                    <div style={{ padding: '0 0.5rem' }}>
                        <h3>Detailed Question Analysis</h3>
                        <div className="table-container" style={{ overflowX: 'auto', marginTop: '1rem' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                                        <th style={{ padding: '12px 8px' }}>Q#</th>
                                        <th style={{ padding: '12px 8px' }}>Result</th>
                                        <th style={{ padding: '12px 8px' }}>Marks</th>
                                        <th style={{ padding: '12px 8px' }}>Time</th>
                                        <th style={{ padding: '12px 8px' }}>Notes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...exam.questions].sort((a, b) => a.number - b.number).map((q) => {
                                        // Calculate Max Mark for display
                                        let qMaxMark = 1; // Default

                                        // 1. Explicit Max Marks on Question
                                        if (q.maxMarks !== undefined && q.maxMarks !== null && q.maxMarks !== '' && parseFloat(q.maxMarks) > 0) {
                                            qMaxMark = parseFloat(q.maxMarks);
                                        }
                                        else {
                                            // 2. Fallback to section marks
                                            let foundSection = false;
                                            if (exam.sections && exam.sections.length > 0) {
                                                const s = exam.sections.find(sect => q.number >= sect.startQuestion && q.number <= sect.endQuestion);
                                                if (s && s.marks) {
                                                    const m = parseFloat(s.marks);
                                                    if (!isNaN(m) && m > 0) {
                                                        qMaxMark = m;
                                                        foundSection = true;
                                                    }
                                                }
                                            }

                                            // 3. Fallback to global
                                            if (!foundSection && exam.totalMaxMarks && exam.questions.length > 0) {
                                                qMaxMark = parseFloat(exam.totalMaxMarks) / exam.questions.length;
                                            } else if (!foundSection) {
                                                qMaxMark = 4; // Legacy default
                                            }
                                        }

                                        return (
                                            <tr key={q.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                                <td style={{ padding: '12px 8px', fontWeight: 'bold' }}>Q{q.number}</td>
                                                <td style={{ padding: '12px 8px' }}>
                                                    <span className={`status-badge status-${q.status}`} style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                                                        {q.status === 'unattempted' ? 'Missed' : q.status.charAt(0).toUpperCase() + q.status.slice(1)}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '12px 8px' }}>
                                                    <span style={{
                                                        color: q.marks > 0 ? 'var(--color-success)' : q.marks < 0 ? 'var(--color-error)' : 'inherit',
                                                        fontWeight: '600'
                                                    }}>
                                                        {q.marks || 0}
                                                    </span>
                                                    <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.85em' }}> / {parseFloat(qMaxMark.toFixed(2))}</span>
                                                </td>
                                                <td style={{ padding: '12px 8px', fontFamily: 'monospace' }}>{formatTime(q.timeSpent)}</td>
                                                <td style={{ padding: '12px 8px', color: 'var(--color-text-secondary)', maxWidth: '300px', wordBreak: 'break-word' }}>
                                                    {q.note || '-'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default ExamAnalysis;
