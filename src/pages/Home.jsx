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

            {/* Active Exams Section */}
            {exams && exams.some(e => ['active', 'completed'].includes(e.status)) && (
                <div className="section" style={{ marginBottom: 'var(--space-2xl)' }}>
                    <h2>Continue Learning</h2>
                    <div className="exams-list">
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
                                    style={{ borderLeft: `4px solid var(--color-${exam.status === 'active' ? 'primary' : 'warning'})` }}
                                >
                                    <div className="exam-item-header">
                                        <div className="exam-info-col">
                                            <div className="exam-name-list">{exam.name || exam.subjectName}</div>
                                            <div className="exam-date">
                                                <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                                                    {exam.subjectName} • {new Date(exam.startTime).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                        <Button
                                            variant={exam.status === 'active' ? 'primary' : 'warning'}
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (exam.status === 'active') navigate(`/exam/${exam.id}`);
                                                else navigate(`/review/${exam.id}`);
                                            }}
                                        >
                                            {exam.status === 'active' ? 'Resume Exam' : 'Evaluate Now'}
                                        </Button>
                                    </div>
                                    <div className="exam-status-text" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                                        {exam.status === 'active'
                                            ? `${exam.questions.length} questions answered`
                                            : 'Ready for evaluation'}
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
