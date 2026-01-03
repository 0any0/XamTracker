import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Play, ArrowLeft } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import './NewExam.css';

const NewExam = ({ subjects, createExam }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const preselectedSubject = location.state?.subject;

    const [selectedSubjectId, setSelectedSubjectId] = useState(
        preselectedSubject?.id || (subjects[0]?.id || '')
    );
    const [examName, setExamName] = useState('');

    const [config, setConfig] = useState({
        questionCount: '',
    });

    // Sections State
    const [enableSections, setEnableSections] = useState(false);
    const [sections, setSections] = useState([{ id: Date.now(), name: '', count: '' }]);

    const addSection = () => {
        setSections([...sections, { id: Date.now(), name: '', count: '' }]);
    };

    const removeSection = (id) => {
        if (sections.length > 1) {
            setSections(sections.filter(s => s.id !== id));
        }
    };

    const updateSection = (id, field, value) => {
        setSections(sections.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const handleStartExam = () => {
        if (!selectedSubjectId) return;

        const subject = subjects.find(s => s.id === selectedSubjectId);
        let finalConfig = { ...config };
        let finalSections = [];

        if (enableSections) {
            // Calculate total questions from sections
            const totalQuestions = sections.reduce((sum, s) => sum + (parseInt(s.count) || 0), 0);
            if (totalQuestions > 0) {
                finalConfig.questionCount = totalQuestions;
            }

            // Prepare sections with calculated start/end ranges
            let currentStart = 1;
            finalSections = sections.map(s => {
                const count = parseInt(s.count) || 0;
                const sectionData = {
                    id: s.id,
                    name: s.name || 'Untitled Section',
                    count: count,
                    startQuestion: currentStart,
                    endQuestion: currentStart + count - 1
                };
                currentStart += count;
                return sectionData;
            }).filter(s => s.count > 0);
        }

        const exam = createExam(selectedSubjectId, subject.name, examName, finalConfig, finalSections);

        navigate(`/exam/${exam.id}`);
    };

    return (
        <div className="new-exam-page">
            <Button
                variant="ghost"
                icon={<ArrowLeft size={20} />}
                onClick={() => navigate(-1)}
                className="back-button"
            >
                Back
            </Button>

            <div className="new-exam-container">
                <Card glass className="new-exam-card">
                    <div className="new-exam-header">
                        <h1>Start New Exam</h1>
                        <p>Select your subject and begin practice</p>
                    </div>

                    <div className="form-group">
                        <label htmlFor="subject" className="form-label">
                            Subject
                        </label>
                        <select
                            id="subject"
                            value={selectedSubjectId}
                            onChange={(e) => setSelectedSubjectId(e.target.value)}
                            className="form-select"
                        >
                            {subjects.length === 0 ? (
                                <option value="">No subjects available</option>
                            ) : (
                                subjects.map(subject => (
                                    <option key={subject.id} value={subject.id}>
                                        {subject.name}
                                    </option>
                                ))
                            )}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="examName" className="form-label">
                            Exam Name (Optional)
                        </label>
                        <input
                            type="text"
                            id="examName"
                            className="form-input"
                            placeholder="e.g., Midterm Review, Chapter 1 Quiz"
                            value={examName}
                            onChange={(e) => setExamName(e.target.value)}
                        />
                    </div>

                    {/* Section Configuration */}
                    <div className="form-group" style={{ marginBottom: 'var(--space-lg)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
                            <label className="form-label" style={{ marginBottom: 0 }}>Enable Sections</label>
                            <input
                                type="checkbox"
                                checked={enableSections}
                                onChange={(e) => setEnableSections(e.target.checked)}
                                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                            />
                        </div>
                        <span className="note-hint">
                            Divide your exam into specific sections (e.g., Physics, Chemistry) for better analysis.
                        </span>
                    </div>

                    {enableSections ? (
                        <div className="sections-config" style={{ marginBottom: 'var(--space-xl)' }}>
                            {sections.map((section, index) => (
                                <div key={section.id} className="section-row" style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder={`Section ${index + 1} Name`}
                                        value={section.name}
                                        onChange={(e) => updateSection(section.id, 'name', e.target.value)}
                                        style={{ flex: 2 }}
                                    />
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="Qs"
                                        min="1"
                                        value={section.count}
                                        onChange={(e) => updateSection(section.id, 'count', e.target.value)}
                                        style={{ flex: 1 }}
                                    />
                                    {sections.length > 1 && (
                                        <Button
                                            variant="ghost"
                                            size="small"
                                            onClick={() => removeSection(section.id)}
                                            style={{ color: 'var(--color-error)' }}
                                            icon={<span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>×</span>}
                                        />
                                    )}
                                </div>
                            ))}
                            <Button
                                variant="secondary"
                                size="small"
                                onClick={addSection}
                                fullWidth
                                style={{ marginTop: 'var(--space-sm)' }}
                            >
                                + Add Section
                            </Button>

                            <div style={{ marginTop: 'var(--space-md)', textAlign: 'right', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                                Total Questions: <strong>{sections.reduce((sum, s) => sum + (parseInt(s.count) || 0), 0)}</strong>
                            </div>
                        </div>
                    ) : (
                        <div className="form-group">
                            <label className="form-label">Total Questions (Optional)</label>
                            <input
                                type="number"
                                className="form-input"
                                placeholder="Unlimited"
                                min="1"
                                value={config.questionCount}
                                onChange={(e) => setConfig({ ...config, questionCount: e.target.value })}
                            />
                            <span className="note-hint" style={{ marginTop: '0.5rem', display: 'block' }}>
                                Setting a limit allows specific target practice. Leave empty for open-ended sessions.
                            </span>
                        </div>
                    )}

                    <div className="exam-instructions">
                        <h3> Instructions</h3>
                        <ul>
                            <li>Timer starts automatically when you begin</li>
                            <li>Use Next/Previous buttons to navigate questions</li>
                            <li>Time for each question is recorded individually</li>
                            <li>You can review and add notes after completing the exam</li>
                        </ul>
                    </div>

                    <Button
                        variant="primary"
                        size="large"
                        fullWidth
                        icon={<Play size={24} />}
                        onClick={handleStartExam}
                        disabled={!selectedSubjectId}
                    >
                        Start Exam
                    </Button>
                </Card>
            </div>
        </div>
    );
};

export default NewExam;
