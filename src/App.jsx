import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { useStore } from './hooks/useStore';
import Layout from './components/Layout';
import Home from './pages/Home';
import NewExam from './pages/NewExam';
import ActiveExam from './pages/ActiveExam';
import ReviewExam from './pages/ReviewExam';
import SubjectView from './pages/SubjectView';
import Analytics from './pages/Analytics';
import ExamAnalysis from './pages/ExamAnalysis';
import Settings from './pages/Settings';
import ExamDetails from './pages/ExamDetails';

function App() {
    const store = useStore();

    return (
        <HashRouter>
            <Layout theme={store.theme} toggleTheme={store.toggleTheme}>
                <Routes>
                    <Route
                        path="/"
                        element={
                            <Home
                                subjects={store.subjects}
                                addSubject={store.addSubject}
                                updateSubject={store.updateSubject}
                                deleteSubject={store.deleteSubject}
                                getExamsBySubject={store.getExamsBySubject}
                                exams={store.exams}
                            />
                        }
                    />

                    <Route
                        path="/new-exam"
                        element={
                            <NewExam
                                subjects={store.subjects}
                                createExam={store.createExam}
                            />
                        }
                    />

                    <Route
                        path="/exam/:examId"
                        element={
                            <ActiveExam
                                getExamById={store.getExamById}
                                addQuestion={store.addQuestion}
                                updateQuestionAtIndex={store.updateQuestionAtIndex}
                                updateExam={store.updateExam}
                                completeExam={store.completeExam}
                            />
                        }
                    />

                    <Route
                        path="/review/:examId"
                        element={
                            <ReviewExam
                                getExamById={store.getExamById}
                                reviewExam={store.reviewExam}
                                updateExam={store.updateExam}
                            />
                        }
                    />

                    <Route
                        path="/exam-details/:examId"
                        element={
                            <ExamDetails
                                getExamById={store.getExamById}
                                deleteExam={store.deleteExam}
                                updateExam={store.updateExam}
                            />
                        }
                    />

                    <Route
                        path="/subject/:subjectId"
                        element={
                            <SubjectView
                                getSubjectById={store.getSubjectById}
                                getExamsBySubject={store.getExamsBySubject}
                                getAllNotesBySubject={store.getAllNotesBySubject}
                                getSubjectStats={store.getSubjectStats}
                                updateSubject={store.updateSubject}
                                deleteSubject={store.deleteSubject}
                                deleteExam={store.deleteExam}
                                updateExam={store.updateExam}
                            />
                        }
                    />

                    <Route
                        path="/analysis/:examId"
                        element={
                            <ExamAnalysis
                                getExamById={store.getExamById}
                            />
                        }
                    />

                    <Route
                        path="/analytics"
                        element={
                            <Analytics
                                subjects={store.subjects}
                                exams={store.exams}
                                getOverallStats={store.getOverallStats}
                            />
                        }
                    />

                    <Route
                        path="/settings"
                        element={
                            <Settings
                                exportAllData={store.exportAllData}
                                importData={store.importData}
                                clearAllData={store.clearAllData}
                                theme={store.theme}
                                toggleTheme={store.toggleTheme}
                                accentColor={store.accentColor}
                                changeAccentColor={store.changeAccentColor}
                            />
                        }
                    />
                </Routes>
            </Layout>
        </HashRouter>
    );
}

export default App;
