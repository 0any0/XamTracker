import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, X, Minus, ChevronLeft, ChevronRight, Save } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import { QuestionStatus } from '../hooks/useStore';
import './ReviewExam.css';

const ReviewExam = ({ getExamById, reviewExam }) => {
    const { examId } = useParams();
    const navigate = useNavigate();
    const [exam, setExam] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [reviewedQuestions, setReviewedQuestions] = useState([]);

    useEffect(() => {
        const examData = getExamById(examId);
        if (!examData || examData.status !== 'completed') {
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

        // Auto-assign default marks if currently 0
        if (status === QuestionStatus.CORRECT && (!currentQ.marks || currentQ.marks === 0)) {
            currentQ.marks = 4; // Default to 4 for JEE/NEET style, or just 1. Let's use 1 as generic default for now.
        } else if (status === QuestionStatus.INCORRECT) {
            // Maybe subtract marks? For now let's not force negative unless user enters it.
            // But usually incorrect is 0 or negative. Let's default to 0 if it was positive.
            if (currentQ.marks > 0) currentQ.marks = 0;
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
                <h1>Review Exam - {exam.subjectName}</h1>
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

                    <div className="review-footer">
                        <Button
                            variant="success"
                            size="large"
                            fullWidth
                            icon={<Save size={20} />}
                            onClick={handleSaveReview}
                        >
                            Save Review & Finish
                        </Button>
                    </div>
                </Card >

                {/* Progress Sidebar */}
                < Card className="progress-sidebar" >
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
                    </div>
                </Card >
            </div >
        </div >
    );
};

export default ReviewExam;
