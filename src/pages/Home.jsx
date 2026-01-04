import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, BookOpen, ChevronRight, Trash2, Edit2 } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import Menu from '../components/Menu';
import './Home.css';

const Home = ({ subjects, exams, addSubject, deleteSubject, updateSubject, getExamsBySubject }) => {
    const navigate = useNavigate();
    const [showNewSubject, setShowNewSubject] = useState(false);
    const [newSubjectName, setNewSubjectName] = useState('');

    const handleAddSubject = () => {
        if (newSubjectName.trim()) {
            addSubject(newSubjectName.trim());
            setNewSubjectName('');
            setShowNewSubject(false);
        }
    };

    const handleStartExam = (subject) => {
        navigate('/new-exam', { state: { subject } });
    };

    const handleViewSubject = (subject) => {
        navigate(`/subject/${subject.id}`);
    };

    const handleDeleteSubject = (subjectId) => {
        if (confirm('Delete this subject and all its exams?')) {
            deleteSubject(subjectId);
        }
    };

    const handleEditSubject = (subject) => {
        const newName = prompt('Enter new subject name:', subject.name);
        if (newName && newName.trim() !== subject.name) {
            updateSubject(subject.id, { name: newName.trim() });
        }
    };

    return (
        <div className="home-page">
            <div className="page-header">
                <h1>My Subjects</h1>
                <p className="page-subtitle">Select a subject to start practicing</p>
            </div>

            {/* Active Exams Section (Continue Learning) */}
            {exams && exams.some(e => ['active', 'completed'].includes(e.status)) && (
                <div className="section" style={{ marginBottom: 'var(--space-xl)' }}>
                    <h2>Continue Learning</h2>
                    <div className="continue-learning-list hide-scrollbar" style={{
                        display: 'flex',
                        gap: '1rem',
                        overflowX: 'auto',
                        paddingBottom: '0.8rem',
                        flexWrap: 'nowrap',
                        width: '100%',
                        WebkitOverflowScrolling: 'touch' // Smooth scroll for touch
                    }}>
                        {exams
                            .filter(e => ['active', 'completed'].includes(e.status))
                            .map(exam => (
                                <Card
                                    key={exam.id}
                                    className="exam-item clickable-card"
                                    onClick={() => {
                                        if (exam.status === 'active') navigate(`/exam/${exam.id}`);
                                        else navigate(`/review/${exam.id}`);
                                    }}
                                    style={{
                                        minWidth: '300px', // Fixed width to prevent compression
                                        width: '300px',
                                        flexShrink: 0, // CRITICAL: Prevent shrinking
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        border: '1px solid var(--color-border)',
                                        padding: '1.25rem',
                                        marginBottom: '2px' // Prevent shadow clipping
                                    }}
                                >
                                    <div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                                            {exam.subjectName} • {new Date(exam.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </div>
                                        <div style={{ fontWeight: '600', fontSize: '1.1rem', marginBottom: '0.5rem', lineHeight: '1.3', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {exam.name || `${exam.subjectName} Exam`}
                                        </div>
                                        <div style={{
                                            display: 'inline-block',
                                            fontSize: '0.75rem',
                                            padding: '2px 8px',
                                            borderRadius: '12px',
                                            background: exam.status === 'active' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                            color: exam.status === 'active' ? 'var(--color-primary)' : 'var(--color-warning)',
                                            fontWeight: '600'
                                        }}>
                                            {exam.status === 'active' ? '● In Progress' : '● Needs Evaluation'}
                                        </div>
                                    </div>

                                    <div style={{ marginTop: '1rem' }}>
                                        <Button
                                            variant={exam.status === 'active' ? 'primary' : 'warning'}
                                            size="small"
                                            fullWidth
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (exam.status === 'active') navigate(`/exam/${exam.id}`);
                                                else navigate(`/review/${exam.id}`);
                                            }}
                                        >
                                            {exam.status === 'active' ? 'Resume Exam' : 'Evaluate'}
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                    </div>
                </div>
            )}

            <div className="subjects-grid">
                {subjects.map(subject => {
                    const exams = getExamsBySubject(subject.id);
                    const reviewedExams = exams.filter(e => e.status === 'reviewed');

                    return (
                        <Card
                            key={subject.id}
                            className="subject-card"
                            onClick={() => handleViewSubject(subject)}
                        >
                            <div className="subject-card-header">
                                <div className="subject-icon">
                                    <BookOpen size={24} />
                                </div>
                                <Menu
                                    items={[
                                        {
                                            label: 'Edit',
                                            icon: <Edit2 size={16} />,
                                            onClick: () => handleEditSubject(subject)
                                        },
                                        {
                                            label: 'Delete',
                                            icon: <Trash2 size={16} />,
                                            variant: 'danger',
                                            onClick: () => handleDeleteSubject(subject.id)
                                        }
                                    ]}
                                    triggerClassName="subject-menu-trigger"
                                />
                            </div>

                            <h3 className="subject-name">{subject.name}</h3>

                            <div className="subject-stats">
                                <div className="stat">
                                    <span className="stat-value">{exams.length}</span>
                                    <span className="stat-label">Total Exams</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-value">{reviewedExams.length}</span>
                                    <span className="stat-label">Reviewed</span>
                                </div>
                            </div>

                            <div className="subject-actions">
                                <Button
                                    variant="primary"
                                    size="small"
                                    fullWidth
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleStartExam(subject);
                                    }}
                                >
                                    Start Exam
                                </Button>

                                <button className="view-details">
                                    View Details <ChevronRight size={16} />
                                </button>
                            </div>
                        </Card>
                    );
                })}

                {/* Add New Subject Card */}
                {showNewSubject ? (
                    <Card className="subject-card new-subject-card" glass>
                        <div className="new-subject-form">
                            <input
                                type="text"
                                placeholder="Subject name..."
                                value={newSubjectName}
                                onChange={(e) => setNewSubjectName(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleAddSubject()}
                                autoFocus
                                className="subject-input"
                            />
                            <div className="new-subject-actions">
                                <Button
                                    variant="success"
                                    size="small"
                                    onClick={handleAddSubject}
                                >
                                    Add
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="small"
                                    onClick={() => {
                                        setShowNewSubject(false);
                                        setNewSubjectName('');
                                    }}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </Card>
                ) : (
                    <Card
                        className="subject-card add-subject-card"
                        glass
                        onClick={() => setShowNewSubject(true)}
                    >
                        <div className="add-subject-content">
                            <Plus size={48} />
                            <span>Add New Subject</span>
                        </div>
                    </Card>
                )}
            </div>

            {subjects.length === 0 && !showNewSubject && (
                <div className="empty-state">
                    <div className="empty-icon">📚</div>
                    <h2>No Subjects Yet</h2>
                    <p>Create your first subject to start tracking your exam practice</p>
                    <Button
                        variant="primary"
                        icon={<Plus size={20} />}
                        onClick={() => setShowNewSubject(true)}
                    >
                        Create Subject
                    </Button>
                </div>
            )}
        </div>
    );
};

export default Home;
