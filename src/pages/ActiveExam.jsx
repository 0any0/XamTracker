import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check, Pause, Play, Maximize } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import Timer from '../components/Timer';
import './ActiveExam.css';

const ActiveExam = ({ getExamById, addQuestion, updateQuestionAtIndex, updateExam, completeExam }) => {
    const { examId } = useParams();
    const navigate = useNavigate();
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const viewStartTime = useRef(Date.now());
    const [pendingNavigation, setPendingNavigation] = useState(null); // { type: 'number', value: 5 }

    // Pause State
    const [isPaused, setIsPaused] = useState(false);
    const pauseStartTime = useRef(null);

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
        if (!isPaused) {
            viewStartTime.current = Date.now();
        }
    }, [currentQuestionIndex, isPaused]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Avoid triggering shortcuts if user is typing in an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            if (isPaused) {
                // Only allow Resume (Space)
                if (e.code === 'Space') {
                    e.preventDefault();
                    handleTogglePause();
                }
                return;
            }

            switch (e.code) {
                case 'ArrowRight':
                    e.preventDefault();
                    handleNext();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    if (currentQuestionIndex > 0) handlePrevious(); // Only if not at start
                    break;
                case 'Space':
                    e.preventDefault();
                    handleTogglePause();
                    break;
                case 'KeyM':
                    e.preventDefault();
                    const status = currentQuestion?.status === 'review_later' ? 'unattempted' : 'review_later';
                    updateQuestionAtIndex(examId, currentQuestionIndex, { status });
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isPaused, currentQuestionIndex, exam, examId, updateQuestionAtIndex]);
    // Dependencies: handleNext/Prev invoke navigation. 
    // We should make sure we have access to latest state or use refs if these funcs are unstable.
    // Since handleNext/Prev are defined in component scope, they rely on 'exam' and 'currentQuestionIndex'.
    // Including them in dependency array is safer.


    if (!exam) {
        return <div className="loading">Loading...</div>;
    }

    const currentQuestion = exam.questions[currentQuestionIndex];

    const saveCurrentProgress = () => {
        if (isPaused) return; // Don't save if already paused (shouldn't happen)

        const timeSpentSession = Date.now() - viewStartTime.current;
        const currentQ = exam.questions[currentQuestionIndex];

        if (currentQ) {
            const totalTimeSpent = (currentQ.timeSpent || 0) + timeSpentSession;
            updateQuestionAtIndex(examId, currentQuestionIndex, {
                timeSpent: totalTimeSpent
            });
        }
    };

    const handleTogglePause = () => {
        if (!isPaused) {
            // Pausing
            saveCurrentProgress();
            pauseStartTime.current = Date.now();
            setIsPaused(true);
        } else {
            // Resuming
            const now = Date.now();
            const pauseDuration = now - (pauseStartTime.current || now);

            // Shift exam start time forward by the duration of the pause
            // so that "Now - StartTime" continues to be correct total elapsed active time
            if (exam.startTime) {
                const oldStartMs = new Date(exam.startTime).getTime();
                const newStartMs = oldStartMs + pauseDuration;
                updateExam(examId, { startTime: new Date(newStartMs).toISOString() });
            }

            // Reset question view timer
            viewStartTime.current = now;
            setIsPaused(false);
            pauseStartTime.current = null;
        }
    };

    const navigateToNumber = (targetNumber) => {
        if (isPaused) return;
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
        if (isPaused) return;

        // If we have a configured limit and we are at it, finish instead of creating new
        if (exam.config?.questionCount &&
            exam.questions[currentQuestionIndex].number >= parseInt(exam.config.questionCount)) {
            handleFinish();
            return;
        }

        const currentNum = exam.questions[currentQuestionIndex].number;
        navigateToNumber(currentNum + 1);
    };

    const handlePrevious = () => {
        if (isPaused) return;
        const currentNum = exam.questions[currentQuestionIndex].number;
        if (currentNum > 1) {
            navigateToNumber(currentNum - 1);
        }
    };

    const handleFinish = () => {
        if (isPaused) return;
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

    let totalSlots;
    if (exam.config?.questionCount) {
        // Ensure we always show at least the max existing question number, even if it exceeds config
        const maxNum = exam.questions.length > 0
            ? Math.max(...exam.questions.map(q => q.number))
            : 1;
        totalSlots = Math.max(parseInt(exam.config.questionCount), maxNum);
    } else {
        const maxNum = exam.questions.length > 0
            ? Math.max(...exam.questions.map(q => q.number))
            : 1;
        totalSlots = Math.ceil(maxNum / 5) * 5;
    }

    // Check if we reached the configured limit
    const isLastConfiguredQuestion = exam.config?.questionCount &&
        currentQuestion?.number >= parseInt(exam.config.questionCount);

    // Determine current section
    const currentSection = exam.sections?.find(
        s => currentQuestion?.number >= s.startQuestion && currentQuestion?.number <= s.endQuestion
    );

    return (
        <div className="active-exam-page">
            <div className="exam-header-bar">
                <div className="exam-info">
                    <h2>{exam.name || exam.subjectName}</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                        <span className="question-count">
                            Question {currentQuestion?.number}
                        </span>
                        {currentSection && (
                            <span className="section-badge" style={{
                                fontSize: '0.85rem',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                background: 'var(--color-primary-light)',
                                color: 'var(--color-primary-dark)',
                                fontWeight: 600
                            }}>
                                {currentSection.name}
                            </span>
                        )}
                    </div>
                </div>

                <div className="exam-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Button
                        variant="ghost"
                        size="small"
                        icon={<Maximize size={20} />}
                        onClick={() => {
                            if (!document.fullscreenElement) {
                                document.documentElement.requestFullscreen();
                            } else {
                                if (document.exitFullscreen) {
                                    document.exitFullscreen();
                                }
                            }
                        }}
                        title="Toggle Fullscreen Mode"
                    />
                    <Button
                        variant={isPaused ? "primary" : "ghost"}
                        size="small"
                        icon={isPaused ? <Play size={20} /> : <Pause size={20} />}
                        onClick={handleTogglePause}
                        className="pause-btn"
                    >
                        {isPaused ? "Resume" : "Pause"}
                    </Button>
                    <Timer
                        startTime={new Date(exam.startTime).getTime()}
                        size="medium"
                        paused={isPaused}
                    />
                </div>
            </div>

            <div className="exam-container">
                <Card glass className="exam-card">
                    {isPaused && (
                        <div className="paused-overlay">
                            <div className="paused-content">
                                <Pause size={48} className="paused-icon" />
                                <h2>Exam Paused</h2>
                                <p>Take a break! Your time is stopped.</p>
                                <Button
                                    variant="primary"
                                    size="large"
                                    icon={<Play size={24} />}
                                    onClick={handleTogglePause}
                                >
                                    Resume Exam
                                </Button>
                            </div>
                        </div>
                    )}

                    <div className="question-header">
                        <div className="question-title">
                            <div className="question-number-input-wrapper">
                                <label>Question #</label>
                                <input
                                    type="number"
                                    className="question-number-input"
                                    value={currentQuestion?.number || ''}
                                    readOnly={isPaused}
                                    onChange={(e) => {
                                        if (isPaused) return;
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
                            ⏱️ <strong>Individual timer</strong> is running above.
                        </p>
                    </div>

                    <div className="active-note-section" style={{ margin: '0 var(--space-xl) var(--space-xl)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                            Quick Note / Reminder:
                        </label>
                        <textarea
                            className="note-textarea"
                            style={{ minHeight: '80px', fontSize: '0.95rem' }}
                            placeholder="e.g. Double check calculation, Formula unsure..."
                            value={currentQuestion?.note || ''}
                            onChange={(e) => {
                                updateQuestionAtIndex(examId, currentQuestionIndex, { note: e.target.value });
                            }}
                            disabled={isPaused}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-md)' }}>
                        <Button
                            variant={currentQuestion?.status === 'review_later' ? 'warning' : 'outline'}
                            size="small"
                            onClick={() => {
                                updateQuestionAtIndex(examId, currentQuestionIndex, {
                                    status: currentQuestion?.status === 'review_later' ? 'unattempted' : 'review_later'
                                });
                            }}
                        >
                            {currentQuestion?.status === 'review_later' ? 'Marked for Review' : 'Mark for Review'}
                        </Button>
                    </div>

                    <div className="exam-navigation">
                        <Button
                            variant="secondary"
                            size="large"
                            icon={<ChevronLeft size={24} />}
                            onClick={handlePrevious}
                            disabled={currentQuestion?.number <= 1}
                            title="Press Left Arrow"
                        >
                            Previous
                        </Button>

                        <Button
                            variant="primary"
                            size="large"
                            icon={isLastConfiguredQuestion ? <Check size={24} /> : <ChevronRight size={24} />}
                            onClick={handleNext}
                            title="Press Right Arrow"
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
