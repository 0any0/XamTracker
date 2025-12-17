import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, X, Minus, ChevronLeft, ChevronRight, Save, Circle, Pause } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import { QuestionStatus } from '../hooks/useStore';
import './ReviewExam.css';

const ReviewExam = ({ getExamById, reviewExam, updateExam }) => {
    const { examId } = useParams();
    const navigate = useNavigate();
    const [exam, setExam] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [reviewedQuestions, setReviewedQuestions] = useState([]);
    const [negativeMark, setNegativeMark] = useState(1);

    useEffect(() => {
        const examData = getExamById(examId);
        if (!examData || (examData.status !== 'completed' && examData.status !== 'reviewed')) {
            navigate('/');
            return;
        }

        setExam(examData);
        setReviewedQuestions(examData.questions.map(q => ({ ...q })));
    }, [examId]);

    const handleStatusChange = (status) => {
        const updated = [...reviewedQuestions];
        const currentQ = updated[currentQuestionIndex];
        currentQ.status = status;

        // Auto-assign default marks
        if (status === QuestionStatus.CORRECT) {
            // Only overwrite if it was 0 or negative (from previous incorrect)
            if (!currentQ.marks || currentQ.marks <= 0) {
                currentQ.marks = 4;
            }
        } else if (status === QuestionStatus.INCORRECT) {
            currentQ.marks = -Math.abs(negativeMark); // Ensure it's negative
        } else if (status === QuestionStatus.UNATTEMPTED) {
            currentQ.marks = 0;
        }

        setReviewedQuestions(updated);
    };

    const handleMarksChange = (value) => {
        const marks = parseFloat(value);
        if (isNaN(marks)) return;

        const updated = [...reviewedQuestions];
        updated[currentQuestionIndex].marks = marks;
        setReviewedQuestions(updated);
    };

    const handleNoteChange = (note) => {
        const updated = [...reviewedQuestions];
        updated[currentQuestionIndex].note = note;
        setReviewedQuestions(updated);
    };

    const handleNext = () => {
        if (currentQuestionIndex < reviewedQuestions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        }
    };

    const handlePrevious = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
        }
    };

    const handleSaveReview = () => {
        reviewExam(examId, reviewedQuestions);
        navigate(`/subject/${exam.subjectId}`);
    };

    if (!exam) {
        return <div className="loading">Loading...</div>;
    }

    const currentQuestion = reviewedQuestions[currentQuestionIndex];
    const formatTime = (ms) => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="review-exam-page">
            <div className="review-header">
                <h1>Review Exam - {exam.name || exam.subjectName}</h1>
                <p className="review-subtitle">
                    Mark each question and add notes for revision
                </p>
            </div>

            <div className="review-container">
                <Card className="review-card">
                    <div className="question-review-header">
                        <div>
                            <h2>Question {currentQuestion.number}</h2>
                            <span className="time-taken">
                                Time: {formatTime(currentQuestion.timeSpent)}
                            </span>
                        </div>
                        <span className="progress-indicator">
                            {currentQuestionIndex + 1} / {reviewedQuestions.length}
                        </span>
                    </div>

                    <div className="status-selector">
                        <h3>Mark as:</h3>
                        <div className="status-buttons">
                            <button
                                className={`status-btn status-correct ${currentQuestion.status === QuestionStatus.CORRECT ? 'active' : ''
                                    }`}
                                onClick={() => handleStatusChange(QuestionStatus.CORRECT)}
                            >
                                <Check size={24} />
                                Correct
                            </button>

                            <button
                                className={`status-btn status-incorrect ${currentQuestion.status === QuestionStatus.INCORRECT ? 'active' : ''
                                    }`}
                                onClick={() => handleStatusChange(QuestionStatus.INCORRECT)}
                            >
                                <X size={24} />
                                Incorrect
                            </button>

                            <button
                                className={`status-btn status-missed ${currentQuestion.status === QuestionStatus.UNATTEMPTED ? 'active' : ''
                                    }`}
                                onClick={() => handleStatusChange(QuestionStatus.UNATTEMPTED)}
                            >
                                <Minus size={24} />
                                Missed
                            </button>

                            <button
                                className={`status-btn status-evaluate-later ${currentQuestion.status === QuestionStatus.EVALUATE_LATER ? 'active' : ''
                                    }`}
                                onClick={() => handleStatusChange(QuestionStatus.EVALUATE_LATER)}
                            >
                                <Circle size={24} />
                                Later
                            </button>
                        </div>
                    </div>


                    <div className="marks-section">
                        <label className="marks-label">Marks Awarded</label>
                        <input
                            type="number"
                            className="marks-input"
                            value={currentQuestion.marks || 0}
                            onChange={(e) => handleMarksChange(e.target.value)}
                            onFocus={(e) => e.target.select()}
                        />
                    </div>

                    <div className="note-section">
                        <label htmlFor="note" className="note-label">
                            Add Note (optional)
                        </label>
                        <textarea
                            id="note"
                            className="note-textarea"
                            placeholder={`Add notes for Question ${currentQuestion.number}...`}
                            value={currentQuestion.note}
                            onChange={(e) => handleNoteChange(e.target.value)}
                            rows="5"
                        />
                        <span className="note-hint">
                            This note will be tagged as "Q{currentQuestion.number}" for easy reference
                        </span>
                    </div>

                    <div className="review-navigation">
                        <Button
                            variant="secondary"
                            size="large"
                            icon={<ChevronLeft size={20} />}
                            onClick={handlePrevious}
                            disabled={currentQuestionIndex === 0}
                        >
                            Previous
                        </Button>

                        <Button
                            variant="primary"
                            size="large"
                            icon={<ChevronRight size={20} />}
                            onClick={handleNext}
                            disabled={currentQuestionIndex === reviewedQuestions.length - 1}
                        >
                            Next
                        </Button>
                    </div>

                    <div className="review-footer" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <Button
                            variant="secondary"
                            size="large"
                            icon={<Pause size={20} />} // Using Pause icon or similar for "Later"
                            onClick={() => {
                                // Save progress but don't finish
                                updateExam(examId, { questions: reviewedQuestions });
                                navigate(`/subject/${exam.subjectId}`);
                            }}
                        >
                            Evaluate Later
                        </Button>
                        <Button
                            variant="success"
                            size="large"
                            icon={<Save size={20} />}
                            onClick={handleSaveReview}
                        >
                            {exam.status === 'reviewed' ? 'Update Review' : 'Finish Evaluation'}
                        </Button>
                    </div>
                </Card >

                {/* Progress Sidebar */}
                < Card className="progress-sidebar" >
                    <div style={{ marginBottom: 'var(--space-lg)', paddingBottom: 'var(--space-md)', borderBottom: '1px solid var(--color-border)' }}>
                        <h3 style={{ fontSize: 'var(--font-size-base)', marginBottom: 'var(--space-sm)' }}>Marking Scheme</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                            <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>Negative Mark:</label>
                            <input
                                type="number"
                                min="0"
                                step="0.5"
                                value={negativeMark}
                                onChange={(e) => setNegativeMark(parseFloat(e.target.value) || 0)}
                                style={{
                                    width: '60px',
                                    padding: '4px 8px',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--color-border)',
                                    background: 'var(--color-bg)',
                                    color: 'var(--color-text)'
                                }}
                            />
                        </div>
                    </div>

                    <h3>Review Progress</h3>
                    <div className="progress-grid">
                        {reviewedQuestions.map((q, index) => (
                            <button
                                key={q.id}
                                className={`progress-item ${index === currentQuestionIndex ? 'current' : ''} status-${q.status}`}
                                onClick={() => setCurrentQuestionIndex(index)}
                            >
                                {q.number}
                            </button>
                        ))}
                    </div>

                    <div className="progress-stats">
                        <div className="progress-stat">
                            <span className="stat-icon correct">✓</span>
                            <span>{reviewedQuestions.filter(q => q.status === QuestionStatus.CORRECT).length}</span>
                        </div>
                        <div className="progress-stat">
                            <span className="stat-icon incorrect">✗</span>
                            <span>{reviewedQuestions.filter(q => q.status === QuestionStatus.INCORRECT).length}</span>
                        </div>
                        <div className="progress-stat">
                            <span className="stat-icon missed">−</span>
                            <span>{reviewedQuestions.filter(q => q.status === QuestionStatus.UNATTEMPTED).length}</span>
                        </div>
                        <div className="progress-stat">
                            <span className="stat-icon evaluate-later" style={{ color: 'var(--color-primary)' }}>○</span>
                            <span>{reviewedQuestions.filter(q => q.status === QuestionStatus.EVALUATE_LATER).length}</span>
                        </div>
                    </div>
                </Card >
            </div >
        </div >
    );
};

export default ReviewExam;
