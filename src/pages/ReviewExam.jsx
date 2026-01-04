import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, X, Minus, ChevronLeft, ChevronRight, Save, Circle, Pause, Plus } from 'lucide-react';
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
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        const examData = getExamById(examId);
        if (!examData || (examData.status !== 'completed' && examData.status !== 'reviewed')) {
            navigate('/');
            return;
        }

        setExam(examData);
        // Sort questions by number to ensure increasing order
        const sortedQuestions = [...examData.questions].sort((a, b) => a.number - b.number);
        setReviewedQuestions(sortedQuestions.map(q => ({ ...q })));
    }, [examId]);

    const getMarkPerQuestion = (questionNumber) => {
        if (!exam) return 4; // Default fallback

        // Check if sections are used
        if (exam.sections && exam.sections.length > 0) {
            const section = exam.sections.find(s =>
                questionNumber >= s.startQuestion && questionNumber <= s.endQuestion
            );
            if (section && section.marks) {
                return parseFloat(section.marks) || 4;
            }
        }

        // Check global marks
        if (exam.totalMaxMarks && exam.questions.length > 0) {
            return exam.totalMaxMarks / exam.questions.length;
        }

        return 4; // Default if no marks defined
    };

    const handleStatusChange = (status) => {
        const updated = [...reviewedQuestions];
        const currentQ = updated[currentQuestionIndex];
        currentQ.status = status;

        // Auto-assign default marks
        if (status === QuestionStatus.CORRECT) {
            // Only overwrite if it was 0 or negative (from previous incorrect) or if currently undefined
            if (!currentQ.marks || currentQ.marks <= 0) {
                currentQ.marks = getMarkPerQuestion(currentQ.number);
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
        const currentQ = updated[currentQuestionIndex];
        currentQ.marks = marks;

        // Auto-set status to CORRECT if full marks are awarded
        const max = currentQ.maxMarks || getMarkPerQuestion(currentQ.number);
        if (max > 0 && marks >= max) {
            currentQ.status = QuestionStatus.CORRECT;
        }

        setReviewedQuestions(updated);
    };

    const handleMaxMarksChange = (value) => {
        const maxMarks = parseFloat(value);
        if (isNaN(maxMarks)) return;

        const updated = [...reviewedQuestions];
        updated[currentQuestionIndex].maxMarks = maxMarks;
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
                        <label className="marks-label">Score / Max Marks</label>
                        <div className="marks-input-container" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                            <div className="marks-stepper" style={{ flex: 1 }}>
                                <button
                                    className="stepper-btn"
                                    onClick={() => handleMarksChange((parseFloat(currentQuestion.marks) || 0) - (currentQuestion.marks % 1 !== 0 ? 0.5 : 1))}
                                >
                                    <Minus size={18} />
                                </button>
                                <input
                                    type="number"
                                    className="marks-input centered"
                                    value={currentQuestion.marks || 0}
                                    onChange={(e) => handleMarksChange(e.target.value)}
                                    onFocus={(e) => e.target.select()}
                                    placeholder="Obtained"
                                />
                                <button
                                    className="stepper-btn"
                                    onClick={() => handleMarksChange((parseFloat(currentQuestion.marks) || 0) + (currentQuestion.marks % 1 !== 0 ? 0.5 : 1))}
                                >
                                    <Plus size={18} />
                                </button>
                            </div>
                            <span style={{ fontSize: '1.2rem', color: 'var(--color-text-secondary)' }}>/</span>
                            <div className="marks-stepper" style={{ flex: 1 }}>
                                <button
                                    className="stepper-btn"
                                    onClick={() => {
                                        const currentMax = parseFloat(currentQuestion.maxMarks || getMarkPerQuestion(currentQuestion.number) || 4);
                                        handleMaxMarksChange(currentMax - (currentMax % 1 !== 0 ? 0.5 : 1));
                                    }}
                                >
                                    <Minus size={18} />
                                </button>
                                <input
                                    type="number"
                                    className="marks-input centered"
                                    value={currentQuestion.maxMarks || getMarkPerQuestion(currentQuestion.number) || 4}
                                    onChange={(e) => handleMaxMarksChange(e.target.value)}
                                    onFocus={(e) => e.target.select()}
                                    placeholder="Max"
                                />
                                <button
                                    className="stepper-btn"
                                    onClick={() => {
                                        const currentMax = parseFloat(currentQuestion.maxMarks || getMarkPerQuestion(currentQuestion.number) || 4);
                                        handleMaxMarksChange(currentMax + (currentMax % 1 !== 0 ? 0.5 : 1));
                                    }}
                                >
                                    <Plus size={18} />
                                </button>
                            </div>
                        </div>
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
                <Card className="progress-sidebar">
                    <div style={{ marginBottom: 'var(--space-md)', paddingBottom: 'var(--space-md)', borderBottom: '1px solid var(--color-border)' }}>
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

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
                        <h3 style={{ margin: 0 }}>Progress</h3>
                        <div className="filter-tabs" style={{ display: 'flex', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-sm)', padding: '2px' }}>
                            <button
                                onClick={() => setFilter('all')}
                                style={{
                                    border: 'none',
                                    background: filter === 'all' ? 'var(--color-bg)' : 'transparent',
                                    color: filter === 'all' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                                    padding: '2px 8px',
                                    borderRadius: 'calc(var(--radius-sm) - 2px)',
                                    fontSize: '0.75rem',
                                    fontWeight: filter === 'all' ? '600' : '400',
                                    cursor: 'pointer'
                                }}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setFilter('pending')}
                                style={{
                                    border: 'none',
                                    background: filter === 'pending' ? 'var(--color-bg)' : 'transparent',
                                    color: filter === 'pending' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                                    padding: '2px 8px',
                                    borderRadius: 'calc(var(--radius-sm) - 2px)',
                                    fontSize: '0.75rem',
                                    fontWeight: filter === 'pending' ? '600' : '400',
                                    cursor: 'pointer'
                                }}
                            >
                                Pending
                            </button>
                            <button
                                onClick={() => setFilter('reviewed')}
                                style={{
                                    border: 'none',
                                    background: filter === 'reviewed' ? 'var(--color-bg)' : 'transparent',
                                    color: filter === 'reviewed' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                                    padding: '2px 8px',
                                    borderRadius: 'calc(var(--radius-sm) - 2px)',
                                    fontSize: '0.75rem',
                                    fontWeight: filter === 'reviewed' ? '600' : '400',
                                    cursor: 'pointer'
                                }}
                            >
                                Done
                            </button>
                        </div>
                    </div>

                    <div className="progress-grid">
                        {reviewedQuestions.map((q, index) => {
                            const isReviewed = q.status === QuestionStatus.CORRECT || q.status === QuestionStatus.INCORRECT;
                            const isPending = !isReviewed;

                            if (filter === 'pending' && !isPending) return null;
                            if (filter === 'reviewed' && !isReviewed) return null;

                            return (
                                <button
                                    key={q.id}
                                    className={`progress-item ${index === currentQuestionIndex ? 'current' : ''} status-${q.status}`}
                                    onClick={() => setCurrentQuestionIndex(index)}
                                >
                                    {q.number}
                                </button>
                            );
                        })}
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
                </Card>
            </div>
        </div >
    );
};

export default ReviewExam;
