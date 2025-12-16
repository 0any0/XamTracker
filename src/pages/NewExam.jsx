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

    const [config, setConfig] = useState({
        questionCount: '',
    });

    const handleStartExam = () => {
        if (!selectedSubjectId) return;

        const subject = subjects.find(s => s.id === selectedSubjectId);
        const exam = createExam(selectedSubjectId, subject.name, config);

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
