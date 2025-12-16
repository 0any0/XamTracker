import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, CheckCircle, XCircle, MinusCircle, FileText, Trash2 } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import Menu from '../components/Menu';
import { QuestionStatus } from '../hooks/useStore';
import './ExamDetails.css';

const ExamDetails = ({ getExamById, deleteExam }) => {
    const { examId } = useParams();
    const navigate = useNavigate();
    const exam = getExamById(examId);

    if (!exam) {
        return <div className="loading">Exam not found</div>;
    }

    const formatDate = (isoString) => {
        return new Date(isoString).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatTime = (ms) => {
        if (!ms && ms !== 0) return '-';
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}m ${secs}s`;
    };

    const handleDeleteExam = () => {
        if (confirm('Delete this exam record?')) {
            deleteExam(examId);
            navigate(`/subject/${exam.subjectId}`);
        }
    };

    // Calculate detailed stats
    const totalQuestions = exam.questions.length;
    let correct = 0, incorrect = 0, missed = 0;

    exam.questions.forEach(q => {
        if (q.status === QuestionStatus.CORRECT) correct++;
        else if (q.status === QuestionStatus.INCORRECT) incorrect++;
        else if (q.status === QuestionStatus.UNATTEMPTED) missed++;
    });

    const accuracy = totalQuestions > 0 ? ((correct / totalQuestions) * 100).toFixed(1) : 0;
    const avgTimeMs = totalQuestions > 0 ? exam.totalTime / totalQuestions : 0;

    // Advanced Analysis
    const times = exam.questions.map(q => q.timeSpent || 0).sort((a, b) => a - b);
    const fastest = times.length > 0 ? times[0] : 0;
    const slowest = times.length > 0 ? times[times.length - 1] : 0;
    const median = times.length > 0 ? times[Math.floor(times.length / 2)] : 0;

    const correctQuestions = exam.questions.filter(q => q.status === QuestionStatus.CORRECT);
    const incorrectQuestions = exam.questions.filter(q => q.status === QuestionStatus.INCORRECT);

    const avgCorrectTime = correctQuestions.length > 0
        ? correctQuestions.reduce((sum, q) => sum + (q.timeSpent || 0), 0) / correctQuestions.length
        : 0;

    const avgIncorrectTime = incorrectQuestions.length > 0
        ? incorrectQuestions.reduce((sum, q) => sum + (q.timeSpent || 0), 0) / incorrectQuestions.length
        : 0;

    return (
        <div className="exam-details-page">
            <Button
                variant="ghost"
                icon={<ArrowLeft size={20} />}
                onClick={() => navigate(`/subject/${exam.subjectId}`)}
                className="back-button"
            >
                Back to Subject
            </Button>

            <div className="details-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h1>{exam.subjectName} - Exam Details</h1>
                    <Menu
                        items={[
                            {
                                label: 'Delete Exam',
                                icon: <Trash2 size={16} />,
                                variant: 'danger',
                                onClick: handleDeleteExam
                            }
                        ]}
                    />
                </div>
                <div className="exam-meta">
                    <div className="meta-item">
                        <Calendar size={16} />
                        {formatDate(exam.startTime)}
                    </div>
                    <div className="meta-item">
                        <Clock size={16} />
                        Total Duration: {formatTime(exam.totalTime)}
                    </div>
                </div>
            </div>

            <div className="details-stats-grid">
                <Card className="details-stat-card">
                    <h3>Accuracy</h3>
                    <div className="stat-value" style={{ color: 'var(--color-primary)' }}>
                        {accuracy}%
                    </div>
                </Card>
                <Card className="details-stat-card">
                    <h3>Score</h3>
                    <div className="stat-value">
                        {correct} <span className="stat-sub">/ {totalQuestions}</span>
                    </div>
                </Card>
                <Card className="details-stat-card">
                    <h3>Avg Time/Q</h3>
                    <div className="stat-value">
                        {formatTime(avgTimeMs)}
                    </div>
                </Card>
            </div>

            <div className="details-stats-grid">
                <Card className="details-stat-card">
                    <h3>Time Analysis</h3>
                    <div className="mini-stat-row">
                        <span>Fastest:</span> <strong>{formatTime(fastest)}</strong>
                    </div>
                    <div className="mini-stat-row">
                        <span>Slowest:</span> <strong>{formatTime(slowest)}</strong>
                    </div>
                    <div className="mini-stat-row">
                        <span>Median:</span> <strong>{formatTime(median)}</strong>
                    </div>
                </Card>

                <Card className="details-stat-card">
                    <h3>Avg Time by Result</h3>
                    <div className="mini-stat-row">
                        <span className="dot correct"></span> Correct: <strong>{formatTime(avgCorrectTime)}</strong>
                    </div>
                    <div className="mini-stat-row">
                        <span className="dot incorrect"></span> Incorrect: <strong>{formatTime(avgIncorrectTime)}</strong>
                    </div>
                </Card>
            </div>

            <Card className="questions-list-card">
                <h2>Question Analysis</h2>
                <div className="questions-table-container">
                    <table className="questions-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Result</th>
                                <th>Marks</th>
                                <th>Time Taken</th>
                                <th>Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {exam.questions.map((q) => (
                                <tr key={q.id}>
                                    <td><strong>Q{q.number}</strong></td>
                                    <td>
                                        <span className={`status-badge ${q.status === QuestionStatus.CORRECT ? 'correct' :
                                            q.status === QuestionStatus.INCORRECT ? 'incorrect' : 'missed'
                                            }`}>
                                            {q.status === QuestionStatus.CORRECT && <CheckCircle size={14} />}
                                            {q.status === QuestionStatus.INCORRECT && <XCircle size={14} />}
                                            {q.status === QuestionStatus.UNATTEMPTED && <MinusCircle size={14} />}
                                            {q.status === QuestionStatus.CORRECT ? 'Correct' :
                                                q.status === QuestionStatus.INCORRECT ? 'Incorrect' : 'Missed'}
                                        </span>
                                    </td>
                                    <td>
                                        <span style={{ fontWeight: 600 }}>{q.marks || 0}</span>
                                    </td>
                                    <td style={{ fontFamily: 'monospace' }}>
                                        {formatTime(q.timeSpent)}
                                    </td>
                                    <td>
                                        {q.note ? (
                                            <div className="note-preview">
                                                <FileText size={14} style={{ display: 'inline', marginRight: 4 }} />
                                                {q.note}
                                            </div>
                                        ) : (
                                            <span style={{ color: 'var(--color-text-lighter)' }}>-</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default ExamDetails;
