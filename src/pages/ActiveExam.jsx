import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import Timer from '../components/Timer';
import './ActiveExam.css';

const ActiveExam = ({ getExamById, addQuestion, updateQuestionAtIndex, completeExam }) => {
    const { examId } = useParams();
    const navigate = useNavigate();
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const viewStartTime = useRef(Date.now());
    const [pendingNavigation, setPendingNavigation] = useState(null); // { type: 'number', value: 5 }

    // Get exam data directly from props (reactive)
    const exam = getExamById(examId);

    // Initialize first question if needed
    useEffect(() => {
        if (exam && exam.questions.length === 0) {
            addQuestion(examId);
        }
    }, [exam, examId, addQuestion]);

    // Handle pending navigation (wait for question to be created)
    useEffect(() => {
        if (!exam) return;

        if (pendingNavigation) {
            if (pendingNavigation.type === 'number') {
                const targetIndex = exam.questions.findIndex(q => q.number === pendingNavigation.value);
                if (targetIndex !== -1) {
                    setCurrentQuestionIndex(targetIndex);
                    setPendingNavigation(null);
                }
            }
        }
    }, [exam, pendingNavigation]);

    // Reset view timer when question changes
    useEffect(() => {
        viewStartTime.current = Date.now();
    }, [currentQuestionIndex]);

    if (!exam) {
        return <div className="loading">Loading...</div>;
    }

    const currentQuestion = exam.questions[currentQuestionIndex];

    const saveCurrentProgress = () => {
        const timeSpentSession = Date.now() - viewStartTime.current;
        const currentQ = exam.questions[currentQuestionIndex];

        if (currentQ) {
            const totalTimeSpent = (currentQ.timeSpent || 0) + timeSpentSession;
            updateQuestionAtIndex(examId, currentQuestionIndex, {
                timeSpent: totalTimeSpent
            });
        }
    };

    const navigateToNumber = (targetNumber) => {
        saveCurrentProgress();

        const existingIndex = exam.questions.findIndex(q => q.number === targetNumber);

        if (existingIndex !== -1) {
            setCurrentQuestionIndex(existingIndex);
        } else {
            // Create new question with this number
            addQuestion(examId, { number: targetNumber });
            setPendingNavigation({ type: 'number', value: targetNumber });
        }
    };

    const handleNext = () => {
        const currentNum = exam.questions[currentQuestionIndex].number;
        navigateToNumber(currentNum + 1);
    };

    const handlePrevious = () => {
        const currentNum = exam.questions[currentQuestionIndex].number;
        if (currentNum > 1) {
            navigateToNumber(currentNum - 1);
        }
    };

    const handleFinish = () => {
        if (exam.questions.length === 0) {
            alert('Please attempt at least one question');
            return;
        }

        if (confirm(`Finish exam with ${exam.questions.length} questions?`)) {
            saveCurrentProgress();
            completeExam(examId);
            navigate(`/review/${examId}`);
        }
    };

    const getTimerStartTime = () => {
        if (!currentQuestion) return Date.now();
        const accumulated = currentQuestion.timeSpent || 0;
        return Date.now() - accumulated;
    };

    const totalSlots = Math.max(
        parseInt(exam.config?.questionCount || 90),
        ...exam.questions.map(q => q.number)
    );

    // Check if we reached the configured limit
    const isLastConfiguredQuestion = exam.config?.questionCount &&
        currentQuestion?.number >= parseInt(exam.config.questionCount);

    return (
        <div className="active-exam-page">
            <div className="exam-header-bar">
                <div className="exam-info">
                    <h2>{exam.subjectName}</h2>
                    <span className="question-count">
                        Question {currentQuestion?.number}
                    </span>
                </div>

                <Timer startTime={new Date(exam.startTime).getTime()} size="medium" />
            </div>

            <div className="exam-container">
                <Card glass className="exam-card">
                    <div className="question-header">
                        <div className="question-title">
                            <div className="question-number-input-wrapper">
                                <label>Question #</label>
                                <input
                                    type="number"
                                    className="question-number-input"
                                    value={currentQuestion?.number || ''}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        if (!isNaN(val)) {
                                            updateQuestionAtIndex(examId, currentQuestionIndex, { number: val });
                                        }
                                    }}
                                />
                            </div>

                            {currentQuestion && (
                                <div className="question-timer-wrapper">
                                    <span className="timer-label">Question Time:</span>
                                    {/* Key prop ensures timer resets/re-inits when question changes */}
                                    <Timer
                                        key={currentQuestion.id}
                                        startTime={getTimerStartTime()}
                                        size="medium"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="question-placeholder">
                        <p className="instruction-text">
                            View your question from your book/notes and work on it.
                            <br />
                            <br />
                            ⏱️ <strong>Individual timer</strong> is running above for this question.
                            <br />
                            Use the sidebar to jump to any question number.
                        </p>
                    </div>

                    <div className="exam-navigation">
                        <Button
                            variant="secondary"
                            size="large"
                            icon={<ChevronLeft size={24} />}
                            onClick={handlePrevious}
                            disabled={currentQuestion?.number <= 1}
                        >
                            Previous
                        </Button>

                        <Button
                            variant="primary"
                            size="large"
                            icon={isLastConfiguredQuestion ? <Check size={24} /> : <ChevronRight size={24} />}
                            onClick={handleNext}
                        >
                            {isLastConfiguredQuestion ? "Finish" : "Next"}
                        </Button>
                    </div>

                    <div className="exam-footer">
                        <Button
                            variant="success"
                            size="medium"
                            fullWidth
                            icon={<Check size={20} />}
                            onClick={handleFinish}
                        >
                            Finish Exam
                        </Button>
                    </div>
                </Card>

                {/* Question List Sidebar */}
                <Card className="questions-sidebar">
                    <h3>Questions</h3>
                    <div className="questions-grid">
                        {Array.from({ length: totalSlots }, (_, i) => i + 1).map((num) => {
                            const qData = exam.questions.find(q => q.number === num);
                            const isActive = currentQuestion?.number === num;
                            const statusClass = qData ? (qData.status !== 'unattempted' ? qData.status : 'visited') : 'unvisited';

                            return (
                                <button
                                    key={num}
                                    className={`question-grid-item ${isActive ? 'active' : ''} ${statusClass}`}
                                    onClick={() => navigateToNumber(num)}
                                >
                                    {num}
                                </button>
                            );
                        })}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default ActiveExam;
