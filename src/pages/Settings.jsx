import React from 'react';
import { Download, Upload, Trash2 } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import './Settings.css';

const COLORS = {
    blue: 'hsl(220, 90%, 56%)',
    purple: 'hsl(270, 85%, 58%)',
    green: 'hsl(142, 71%, 45%)',
    indigo: 'hsl(245, 80%, 60%)',
    orange: 'hsl(25, 95%, 53%)',
    pink: 'hsl(330, 80%, 55%)',
    red: 'hsl(345, 80%, 55%)',
    teal: 'hsl(175, 80%, 40%)'
};

const Settings = ({ exportAllData, importData, clearAllData, theme, toggleTheme, accentColor, changeAccentColor }) => {
    const fileInputRef = React.useRef(null);

    const handleExportJSON = () => {
        const data = exportAllData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `exam-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleImportJSON = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                const mode = confirm('Merge with existing data? (Cancel to replace all data)') ? 'merge' : 'replace';
                importData(data, mode);
                alert('Data imported successfully!');
            } catch (error) {
                alert('Error importing data. Please check the file format.');
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="settings-page">
            <h1>Settings</h1>

            <div className="settings-sections">
                {/* Theme */}
                <Card className="settings-card">
                    <h3>Appearance</h3>

                    <div className="settings-item">
                        <div>
                            <div className="setting-label">Theme Mode</div>
                            <div className="setting-description">
                                Switch between light and dark backgrounds
                            </div>
                        </div>
                        <Button variant="secondary" onClick={toggleTheme}>
                            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                        </Button>
                    </div>

                    <div className="settings-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '1rem' }}>
                        <div>
                            <div className="setting-label">Accent Color</div>
                            <div className="setting-description">
                                Customize the primary color of the application
                            </div>
                        </div>
                        <div className="color-picker-grid" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                            {['blue', 'purple', 'green', 'indigo', 'orange', 'pink', 'red', 'teal'].map((color) => (
                                <button
                                    key={color}
                                    onClick={() => changeAccentColor(color)}
                                    title={color.charAt(0).toUpperCase() + color.slice(1)}
                                    style={{
                                        width: '2rem',
                                        height: '2rem',
                                        borderRadius: '50%',
                                        backgroundColor: COLORS[color],
                                        border: accentColor === color ? '2px solid var(--color-text)' : '2px solid transparent',
                                        boxShadow: accentColor === color ? '0 0 0 2px var(--color-bg), 0 0 0 4px var(--color-text)' : 'none',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </Card>

                {/* Data Management */}
                <Card className="settings-card">
                    <h3>Data Management</h3>

                    <div className="settings-item">
                        <div>
                            <div className="setting-label">Export Data</div>
                            <div className="setting-description">
                                Download as JSON. Save to Google Drive / OneDrive to sync with other devices.
                            </div>
                        </div>
                        <Button
                            variant="primary"
                            icon={<Download size={16} />}
                            onClick={handleExportJSON}
                        >
                            Export
                        </Button>
                    </div>

                    <div className="settings-item">
                        <div>
                            <div className="setting-label">Import Data</div>
                            <div className="setting-description">
                                Restore data from a backup or cloud drive file.
                            </div>
                        </div>
                        <div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".json"
                                onChange={handleImportJSON}
                                style={{ display: 'none' }}
                            />
                            <Button
                                variant="secondary"
                                icon={<Upload size={16} />}
                                onClick={() => fileInputRef.current.click()}
                            >
                                Import
                            </Button>
                        </div>
                    </div>

                    <div className="settings-item">
                        <div>
                            <div className="setting-label">Clear All Data</div>
                            <div className="setting-description">
                                Permanently delete all subjects and exams
                            </div>
                        </div>
                        <Button
                            variant="error"
                            icon={<Trash2 size={16} />}
                            onClick={clearAllData}
                        >
                            Clear Data
                        </Button>
                    </div>
                </Card>

                {/* Info */}
                <Card className="settings-card">
                    <h3>About</h3>
                    <div className="about-text">
                        <p><strong>Exam Tracker</strong></p>
                        <p>Version 1.0.0</p>
                        <p>Track your exam practice progress with ease.</p>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Settings;
