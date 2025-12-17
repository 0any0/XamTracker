import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, CheckCircle, XCircle, MinusCircle, Edit2, Trash2 } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import Menu from '../components/Menu';
import { QuestionStatus } from '../hooks/useStore';
import './SubjectView.css';

const SubjectView = ({ getSubjectById, getExamsBySubject, getAllNotesBySubject, getSubjectStats, updateSubject, deleteSubject, deleteExam, updateExam }) => {
    const { subjectId } = useParams();
    const navigate = useNavigate();

    const subject = getSubjectById(subjectId);
    const exams = getExamsBySubject(subjectId);
    const notes = getAllNotesBySubject(subjectId);
    const stats = getSubjectStats(subjectId);

    if (!subject) {
        return <div className="loading">Subject not found</div>;
    }

    const formatDate = (isoString) => {
        return new Date(isoString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    const handleEditSubject = () => {
        const newName = prompt('Enter new subject name:', subject.name);
        if (newName && newName.trim() !== subject.name) {
            updateSubject(subject.id, { name: newName.trim() });
        }
    };

    const handleDeleteSubject = () => {
        if (confirm('Delete this subject and all its exams?')) {
            deleteSubject(subjectId);
            navigate('/');
        }
    };

    const handleDeleteExam = (examId) => {
        if (confirm('Delete this exam record?')) {
            deleteExam(examId);
        }
    };

    const handleRenameExam = (exam) => {
        const newName = prompt('Enter new exam name:', exam.name || exam.subjectName);
        if (newName && newName.trim()) {
            updateExam(exam.id, { name: newName.trim() });
        }
    };

    return (
        <div className="subject-view-page">
            <Button
                variant="ghost"
                icon={<ArrowLeft size={20} />}
                onClick={() => navigate('/')}
                className="back-button"
            >
                Back to Subjects
            </Button>

            <div className="subject-header">
                <div className="subject-title-row" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h1>{subject.name}</h1>
                    <Menu
                        items={[
                            {
                                label: 'Edit Name',
                                icon: <Edit2 size={16} />,
                                onClick: handleEditSubject
                            },
                            {
                                label: 'Delete Subject',
                                icon: <Trash2 size={16} />,
                                variant: 'danger',
                                onClick: handleDeleteSubject
                            }
                        ]}
                    />
                </div>
                <Button
                    variant="primary"
                    onClick={() => navigate('/new-exam', { state: { subject } })}
                >
                    Start New Exam
                </Button>
            </div>

            {/* Statistics */}
            <div className="stats-grid">
                <Card className="stat-card">
                    <div className="stat-content">
                        <div className="stat-value">{stats.totalExams}</div>
                        <div className="stat-label">Total Exams</div>
                    </div>
                </Card>

                <Card className="stat-card">
                    <div className="stat-content">
                        <div className="stat-value">{stats.totalQuestions}</div>
                        <div className="stat-label">Total Questions</div>
                    </div>
                </Card>

                <Card className="stat-card">
                    <div className="stat-content">
                        <div className="stat-value">{stats.accuracy}%</div>
                        <div className="stat-label">Accuracy</div>
                    </div>
                </Card>

                <Card className="stat-card">
                    <div className="stat-content">
                        <div className="stat-value">{stats.avgTimePerQuestion}s</div>
                        <div className="stat-label">Avg Time/Question</div>
                    </div>
                </Card>
            </div>

            {/* Exams List */}
            <div className="section">
                <h2>Exam History</h2>
                <div className="exams-list">
                    {exams.length === 0 ? (
                        <div className="empty-message">No exams yet. Start your first exam!</div>
                    ) : (
                        exams.map(exam => (
                            <Card
                                key={exam.id}
                                className="exam-item clickable-card"
                                onClick={() => {
                                    if (exam.status === 'active') navigate(`/exam/${exam.id}`);
                                    else if (exam.status === 'completed') navigate(`/review/${exam.id}`);
                                    else navigate(`/exam-details/${exam.id}`);
                                }}
                            >
                                <div className="exam-item-header">
                                    <div className="exam-info-col">
                                        <div className="exam-name-list">{exam.name || exam.subjectName}</div>
                                        <div className="exam-date">
                                            <Calendar size={14} />
                                            {formatDate(exam.startTime)}
                                        </div>
                                    </div>
                                    <div className={`exam-status status-${exam.status}`}>
                                        {exam.status}
                                    </div>
                                    <div className="exam-menu-trigger" onClick={(e) => e.stopPropagation()}>
                                        <Menu
                                            items={[
                                                {
                                                    label: 'Rename',
                                                    icon: <Edit2 size={16} />,
                                                    onClick: () => handleRenameExam(exam)
                                                },
                                                {
                                                    label: 'Delete Exam',
                                                    icon: <Trash2 size={16} />,
                                                    variant: 'danger',
                                                    onClick: () => handleDeleteExam(exam.id)
                                                }
                                            ]}
                                        />
                                    </div>
                                </div>

                                <div className="exam-stats-row">
                                    <div className="exam-stat">
                                        <span className="stat-icon">#</span>
                                        {exam.questions.length} Questions
                                    </div>
                                    <div className="exam-stat">
                                        <Clock size={14} />
                                        {formatTime(Math.floor(exam.totalTime / 1000))}
                                    </div>
                                </div>

                                {exam.status === 'reviewed' && (
                                    <div className="exam-results">
                                        <span className="result-badge correct">
                                            <CheckCircle size={14} />
                                            {exam.questions.filter(q => q.status === QuestionStatus.CORRECT).length}
                                        </span>
                                        <span className="result-badge incorrect">
                                            <XCircle size={14} />
                                            {exam.questions.filter(q => q.status === QuestionStatus.INCORRECT).length}
                                        </span>
                                        <span className="result-badge missed">
                                            <MinusCircle size={14} />
                                            {exam.questions.filter(q => q.status === QuestionStatus.UNATTEMPTED).length}
                                        </span>
                                    </div>
                                )}
                            </Card>
                        ))
                    )}
                </div>
            </div>

            {/* Revision Notes */}
            {notes.length > 0 && (
                <div className="section">
                    <h2>Revision Notes</h2>
                    <div className="notes-list">
                        {notes.map((note, index) => (
                            <Card key={index} className="note-item">
                                <div className="note-header">
                                    <span className="note-question">Q{note.questionNumber}</span>
                                    <span className="note-date">
                                        {formatDate(note.examDate)}
                                    </span>
                                </div>
                                <div className="note-content">{note.note}</div>
                                <div className={`note-status status-${note.status}`}>
                                    {note.status === QuestionStatus.CORRECT && '✓ Correct'}
                                    {note.status === QuestionStatus.INCORRECT && '✗ Incorrect'}
                                    {note.status === QuestionStatus.UNATTEMPTED && '− Missed'}
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubjectView;
