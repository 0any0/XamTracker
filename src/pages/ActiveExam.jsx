import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check, Pause, Play, Maximize, Plus, Minus, Flag } from 'lucide-react';
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

    // Pause State derived from exam data
    const isPaused = !!exam?.pauseStartTime;

    const saveCurrentProgress = () => {
        // If passed exam isPaused, we shouldn't save time unless we are in the process of pausing
        // BUT logic: saveCurrentProgress is called just BEFORE setting paused=true.
        // So at that moment, isPaused (derived) is false. Correct.

        if (exam?.pauseStartTime) return;

        const timeSpentSession = Date.now() - viewStartTime.current;
        const currentQ = exam.questions[currentQuestionIndex];

        if (currentQ) {
            const totalTimeSpent = (currentQ.timeSpent || 0) + timeSpentSession;
            updateQuestionAtIndex(examId, currentQuestionIndex, {
                timeSpent: totalTimeSpent
            });
            // Reset local tracker so subsequent calls don't double count
            viewStartTime.current = Date.now();
        }
    };

    const handleTogglePause = () => {
        if (!exam.pauseStartTime) {
            // Pausing
            saveCurrentProgress(); // Save collected time so far
            updateExam(examId, { pauseStartTime: new Date().toISOString() });
        } else {
            // Resuming
            const now = Date.now();
            const pauseStartMs = new Date(exam.pauseStartTime).getTime();
            const pauseDuration = now - pauseStartMs;

            // Shift exam start time forward
            let updates = { pauseStartTime: null };
            if (exam.startTime) {
                const oldStartMs = new Date(exam.startTime).getTime();
                const newStartMs = oldStartMs + pauseDuration;
                updates.startTime = new Date(newStartMs).toISOString();
            }
            updateExam(examId, updates);

            // viewStartTime.current will be reset by the useEffect reacting to pauseStartTime prop change
        }
    };

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

    // Reset view timer when question changes or when un-paused
    // If we just resumed (exam.pauseStartTime became null), we need to reset viewStartTime
    useEffect(() => {
        if (exam && !exam.pauseStartTime) {
            viewStartTime.current = Date.now();
        }
    }, [currentQuestionIndex, exam?.pauseStartTime]); // Depend on pause status change

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            if (exam?.pauseStartTime) {
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
                    if (currentQuestionIndex > 0) handlePrevious();
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
    }, [exam, currentQuestionIndex, examId, updateQuestionAtIndex]);


    if (!exam) {
        return <div className="loading">Loading...</div>;
    }

    const currentQuestion = exam.questions[currentQuestionIndex];

    // Helper for rendering - already defined above
    // const isPaused = !!exam.pauseStartTime;

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

    const [showFinishSummary, setShowFinishSummary] = useState(false);

    // ... existing pause logic ...

    // Calculation helper for stats
    const getExamSummary = () => {
        if (!exam) return { total: 0, attempted: 0, reviewed: 0, skipped: 0 };

        const total = exam.config?.questionCount ? parseInt(exam.config.questionCount) : exam.questions.length;
        const visitedCount = exam.questions.length;
        const reviewCount = exam.questions.filter(q => q.status === 'review_later').length;
        const skippedCount = Math.max(0, total - visitedCount);

        return {
            total,
            visited: visitedCount,
            reviewed: reviewCount,
            skipped: skippedCount
        };
    };

    const handleFinish = () => {
        if (isPaused && !showFinishSummary) {
            setShowFinishSummary(true);
            return;
        }

        if (exam.questions.length === 0) {
            alert('Please attempt at least one question');
            return;
        }

        // Pause the exam while showing the summary if not already paused
        if (!isPaused) {
            saveCurrentProgress(); // Save current Q status
            updateExam(examId, { pauseStartTime: new Date().toISOString() });
        }
        setShowFinishSummary(true);
    };

    const confirmFinish = () => {
        completeExam(examId);
        navigate(`/review/${examId}`);
    };

    const cancelFinish = () => {
        setShowFinishSummary(false);
        // Resume exam
        handleTogglePause(); // This will unpause and correctly adjust offsets
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
                    {isPaused && !showFinishSummary && (
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

                    {showFinishSummary && (
                        <div className="paused-overlay">
                            <div className="finish-summary-card">
                                <div style={{ textAlign: 'center' }}>
                                    <h2 style={{ fontSize: '1.5rem', marginBottom: 'var(--space-sm)' }}>Finish Exam?</h2>
                                    <p style={{ color: 'var(--color-text-secondary)' }}>You are about to submit your exam.</p>
                                </div>

                                <div className="summary-stats-grid">
                                    <div className="stat-box">
                                        <div className="stat-box-value">
                                            {getExamSummary().visited}
                                        </div>
                                        <div className="stat-box-label">Attempted</div>
                                    </div>

                                    <div className="stat-box">
                                        <div className="stat-box-value" style={{ color: 'var(--color-text-tertiary)' }}>
                                            {getExamSummary().skipped}
                                        </div>
                                        <div className="stat-box-label">Skipped</div>
                                    </div>

                                    <div className="stat-box review-alert">
                                        <Flag size={20} className="review-alert-icon" color="var(--color-warning)" />
                                        <div>
                                            <div className="review-alert-text">
                                                {getExamSummary().reviewed} Marked for Review
                                            </div>
                                            <div className="review-alert-subtext">
                                                Double check these before finishing
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-sm)' }}>
                                    <Button
                                        variant="ghost"
                                        size="large"
                                        fullWidth
                                        onClick={cancelFinish}
                                    >
                                        Resume
                                    </Button>
                                    <Button
                                        variant="primary"
                                        size="large"
                                        fullWidth
                                        onClick={confirmFinish}
                                    >
                                        Finish Exam
                                    </Button>
                                </div>
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
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <Timer
                                            key={currentQuestion.id}
                                            startTime={getTimerStartTime()}
                                            size="medium"
                                        />
                                        <div className="timer-controls-capsule" style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            border: '2px solid var(--color-primary)',
                                            borderRadius: '999px',
                                            background: 'var(--color-surface)',
                                            height: '32px',
                                            overflow: 'hidden',
                                            boxShadow: 'var(--shadow-sm)'
                                        }}>
                                            <button
                                                className="capsule-btn"
                                                onClick={() => {
                                                    if (isPaused) return;
                                                    const now = Date.now();
                                                    const currentSessionTime = now - viewStartTime.current;
                                                    const previousTime = currentQuestion.timeSpent || 0;

                                                    // Logic: Current Total + Adjustment
                                                    const intendedNewTime = previousTime + currentSessionTime - 30000;
                                                    const newTotalTime = Math.max(0, intendedNewTime);

                                                    // Calculate actual delta to change universal timer
                                                    // If we hit 0 (clamped), delta will be less than 30s (magnitude)
                                                    const delta = newTotalTime - (previousTime + currentSessionTime);

                                                    updateQuestionAtIndex(examId, currentQuestionIndex, {
                                                        timeSpent: newTotalTime
                                                    });

                                                    // Sync Universal Timer: Shift start time opposite to delta
                                                    // If delta is negative (time removed), StartTime must increase (move later)
                                                    if (delta !== 0) {
                                                        const oldStartMs = new Date(exam.startTime).getTime();
                                                        updateExam(examId, { startTime: new Date(oldStartMs - delta).toISOString() });
                                                    }

                                                    viewStartTime.current = now;
                                                }}
                                                title="Subtract 30s"
                                                style={{
                                                    borderRight: '1px solid var(--color-primary)',
                                                    padding: '0 12px',
                                                    height: '100%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    background: 'transparent',
                                                    color: 'var(--color-primary)',
                                                    fontSize: '0.85rem',
                                                    fontWeight: 600,
                                                    fontFamily: "'SF Mono', 'Monaco', 'Courier New', monospace",
                                                    fontVariantNumeric: 'tabular-nums',
                                                    letterSpacing: '-0.5px'
                                                }}
                                                onMouseOver={(e) => e.currentTarget.style.background = 'var(--color-primary-light)'}
                                                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                            >
                                                -30s
                                            </button>

                                            <button
                                                className="capsule-btn"
                                                onClick={() => {
                                                    if (isPaused) return;
                                                    const now = Date.now();
                                                    const currentSessionTime = now - viewStartTime.current;
                                                    const previousTime = currentQuestion.timeSpent || 0;
                                                    const delta = 30000;

                                                    const newTotalTime = previousTime + currentSessionTime + delta; // Add 30s

                                                    updateQuestionAtIndex(examId, currentQuestionIndex, {
                                                        timeSpent: newTotalTime
                                                    });

                                                    // Sync Universal Timer: Shift start time earlier to add time
                                                    const oldStartMs = new Date(exam.startTime).getTime();
                                                    updateExam(examId, { startTime: new Date(oldStartMs - delta).toISOString() });

                                                    viewStartTime.current = now;
                                                }}
                                                title="Add 30s"
                                                style={{
                                                    padding: '0 12px',
                                                    height: '100%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    background: 'transparent',
                                                    color: 'var(--color-primary)',
                                                    fontSize: '0.85rem',
                                                    fontWeight: 600,
                                                    fontFamily: "'SF Mono', 'Monaco', 'Courier New', monospace",
                                                    fontVariantNumeric: 'tabular-nums',
                                                    letterSpacing: '-0.5px'
                                                }}
                                                onMouseOver={(e) => e.currentTarget.style.background = 'var(--color-primary-light)'}
                                                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                            >
                                                +30s
                                            </button>
                                        </div>
                                    </div>
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
                    <h3 style={{ position: 'sticky', top: 0, background: 'var(--color-surface)', zIndex: 1, paddingBottom: 'var(--space-sm)' }}>Questions</h3>

                    {exam.sections && exam.sections.length > 0 ? (
                        <div className="sections-container" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                            {exam.sections.map((section, idx) => {
                                // Calculate range for this section
                                const start = parseInt(section.startQuestion);
                                const end = parseInt(section.endQuestion);
                                const length = end - start + 1;

                                return (
                                    <div key={section.id || idx} className="section-group">
                                        <div style={{
                                            fontSize: '0.8rem',
                                            fontWeight: 700,
                                            color: 'var(--color-text-tertiary)',
                                            marginBottom: 'var(--space-xs)',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em'
                                        }}>
                                            {section.name} <span style={{ opacity: 0.6, fontWeight: 400 }}>({start}-{end})</span>
                                        </div>
                                        <div className="questions-grid">
                                            {Array.from({ length }, (_, i) => start + i).map((num) => {
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
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
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
                    )}
                </Card>
            </div>
        </div>
    );
};

export default ActiveExam;
