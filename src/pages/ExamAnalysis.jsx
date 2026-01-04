import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Award, Target, HelpCircle } from 'lucide-react';
import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    BarElement,
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
    Title,
    Tooltip,
    Legend,
    ArcElement
);

const ExamAnalysis = ({ getExamById }) => {
    const { examId } = useParams();
    const navigate = useNavigate();
    const exam = getExamById(examId);

    if (!exam) return <div className="loading">Loading...</div>;

    const stats = useMemo(() => {
        let correct = 0, incorrect = 0, missed = 0;
        let timeCorrect = 0, timeIncorrect = 0;
        let totalTime = 0;
        let totalObtainedMarks = 0;

        exam.questions.forEach(q => {
            if (q.status === QuestionStatus.CORRECT) {
                correct++;
                timeCorrect += (q.timeSpent || 0);
            } else if (q.status === QuestionStatus.INCORRECT) {
                incorrect++;
                timeIncorrect += (q.timeSpent || 0);
            } else {
                missed++;
            }
            totalTime += (q.timeSpent || 0);
            totalObtainedMarks += (q.marks || 0);
        });

        // Use stored max marks or fallback (though updateStore ensures it's stored for new exams)
        const totalMaxMarks = exam.totalMaxMarks || 0;
        const accuracy = exam.questions.length ? ((correct / exam.questions.length) * 100).toFixed(1) : 0;
        const scorePercentage = totalMaxMarks > 0 ? ((totalObtainedMarks / totalMaxMarks) * 100).toFixed(1) : accuracy;

        return {
            correct,
            incorrect,
            missed,
            accuracy: accuracy,
            scorePercentage: scorePercentage,
            totalObtainedMarks,
            totalMaxMarks,
            avgTimeCorrect: correct ? timeCorrect / correct : 0,
            avgTimeIncorrect: incorrect ? timeIncorrect / incorrect : 0,
            avgGlobal: exam.questions.length ? totalTime / exam.questions.length : 0
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
                    <h3>Performance Breakdown</h3>
                    <div className="chart-container">
                        <Doughnut
                            data={statusData}
                            options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }}
                        />
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
                {/* Section-wise Analysis */}
                {exam.sections && exam.sections.length > 0 && (() => {
                    const sectionLabels = exam.sections.map(s => s.name);
                    const sectionStats = exam.sections.map(s => {
                        const qs = exam.questions.filter(q => q.number >= s.startQuestion && q.number <= s.endQuestion);
                        return {
                            correct: qs.filter(q => q.status === QuestionStatus.CORRECT).length,
                            incorrect: qs.filter(q => q.status === QuestionStatus.INCORRECT).length,
                            missed: qs.filter(q => q.status !== QuestionStatus.CORRECT && q.status !== QuestionStatus.INCORRECT).length
                        };
                    });

                    const sectionChartData = {
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
                                backgroundColor: 'rgba(234, 179, 8, 0.8)',
                            }
                        ]
                    };

                    return (
                        <Card className="chart-card" style={{ gridColumn: '1 / -1' }}>
                            <h3>Section Performance</h3>
                            <div className="chart-container">
                                <Bar
                                    data={sectionChartData}
                                    options={{
                                        maintainAspectRatio: false,
                                        scales: {
                                            x: { stacked: true },
                                            y: { stacked: true, beginAtZero: true }
                                        },
                                        plugins: {
                                            tooltip: {
                                                callbacks: {
                                                    label: (context) => {
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
                        </Card>
                    );
                })()}
            </div>
        </div>
    );
};

export default ExamAnalysis;
