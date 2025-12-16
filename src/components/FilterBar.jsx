import React from 'react';
import { Filter } from 'lucide-react';
import Button from './Button';
import './FilterBar.css';

const FilterBar = ({
    subjects,
    selectedSubjects,
    onSubjectChange,
    dateRange,
    onDateRangeChange,
    onReset
}) => {
    const dateRanges = [
        { label: 'All Time', value: 'all' },
        { label: 'Last 7 Days', value: '7days' },
        { label: 'Last 30 Days', value: '30days' },
        { label: 'Last 90 Days', value: '90days' },
    ];

    const handleSubjectToggle = (subjectId) => {
        if (selectedSubjects.includes(subjectId)) {
            onSubjectChange(selectedSubjects.filter(id => id !== subjectId));
        } else {
            onSubjectChange([...selectedSubjects, subjectId]);
        }
    };

    const handleSelectAll = () => {
        if (selectedSubjects.length === subjects.length) {
            onSubjectChange([]);
        } else {
            onSubjectChange(subjects.map(s => s.id));
        }
    };

    return (
        <div className="filter-bar">
            <div className="filter-header">
                <div className="filter-title">
                    <Filter size={20} />
                    <h3>Filters</h3>
                </div>
                <Button variant="secondary" size="small" onClick={onReset}>
                    Reset
                </Button>
            </div>

            <div className="filter-section">
                <label className="filter-label">Time Period</label>
                <div className="filter-buttons">
                    {dateRanges.map(range => (
                        <button
                            key={range.value}
                            className={`filter-btn ${dateRange === range.value ? 'active' : ''}`}
                            onClick={() => onDateRangeChange(range.value)}
                        >
                            {range.label}
                        </button>
                    ))}
                </div>
            </div>

            {subjects.length > 0 && (
                <div className="filter-section">
                    <div className="filter-label-row">
                        <label className="filter-label">Subjects</label>
                        <button className="select-all-btn" onClick={handleSelectAll}>
                            {selectedSubjects.length === subjects.length ? 'Deselect All' : 'Select All'}
                        </button>
                    </div>
                    <div className="subject-checkboxes">
                        {subjects.map(subject => (
                            <label key={subject.id} className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={selectedSubjects.includes(subject.id)}
                                    onChange={() => handleSubjectToggle(subject.id)}
                                    className="checkbox-input"
                                />
                                <span className="checkbox-text">{subject.name}</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FilterBar;
