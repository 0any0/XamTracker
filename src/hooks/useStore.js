import { useState, useEffect } from 'react';

// Data Models
export const QuestionStatus = {
  UNATTEMPTED: 'unattempted',
  CORRECT: 'correct',
  INCORRECT: 'incorrect',
};

// LocalStorage keys
const STORAGE_KEYS = {
  SUBJECTS: 'exam_tracker_subjects',
  EXAMS: 'exam_tracker_exams',
  THEME: 'exam_tracker_theme',
};

// Initialize default data
const getInitialData = (key, defaultValue) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return defaultValue;
  }
};

const saveToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};

// Main store hook
export const useStore = () => {
  const [subjects, setSubjects] = useState(() => getInitialData(STORAGE_KEYS.SUBJECTS, []));
  const [exams, setExams] = useState(() => getInitialData(STORAGE_KEYS.EXAMS, []));
  const [theme, setTheme] = useState(() => getInitialData(STORAGE_KEYS.THEME, 'light'));

  // Persist subjects to localStorage
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SUBJECTS, subjects);
  }, [subjects]);

  // Persist exams to localStorage
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.EXAMS, exams);
  }, [exams]);

  // Persist theme to localStorage and apply to DOM
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.THEME, theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Subject operations
  const addSubject = (name) => {
    const newSubject = {
      id: Date.now().toString(),
      name,
      createdAt: new Date().toISOString(),
    };
    setSubjects([...subjects, newSubject]);
    return newSubject;
  };

  const deleteSubject = (subjectId) => {
    setSubjects(subjects.filter(s => s.id !== subjectId));
    // Also delete all exams for this subject
    setExams(exams.filter(e => e.subjectId !== subjectId));
  };

  const getSubjectById = (subjectId) => {
    return subjects.find(s => s.id === subjectId);
  };

  const updateSubject = (subjectId, updates) => {
    setSubjects(subjects.map(s => s.id === subjectId ? { ...s, ...updates } : s));
  };

  // Exam operations
  const createExam = (subjectId, subjectName, config = {}) => {
    const newExam = {
      id: Date.now().toString(),
      subjectId,
      subjectName,
      startTime: new Date().toISOString(),
      endTime: null,
      questions: [],
      totalTime: 0,
      status: 'active', // active, completed, reviewed
      config: {
        questionCount: config.questionCount || null, // null means unlimited
      }
    };
    setExams([...exams, newExam]);
    return newExam;
  };

  const addQuestion = (examId, overrides = {}) => {
    setExams(prevExams => prevExams.map(exam => {
      if (exam.id === examId) {
        const currentTime = Date.now();
        const lastQuestion = exam.questions[exam.questions.length - 1];

        let questionNumber;

        if (overrides.number) {
          questionNumber = overrides.number;
        } else if (exam.questions.length === 0) {
          questionNumber = 1;
        } else {
          questionNumber = lastQuestion.number + 1;
        }

        // Calculate time for previous question if exists
        // Note: With ActiveExam explicitly saving progress, this might be redundant but safe if !timeSpent check holds
        if (lastQuestion && !lastQuestion.timeSpent) {
          lastQuestion.timeSpent = currentTime - lastQuestion.startTime;
        }

        const newQuestion = {
          id: `q_${currentTime}`,
          number: questionNumber,
          startTime: currentTime,
          startTime: currentTime,
          timeSpent: null,
          status: QuestionStatus.UNATTEMPTED,
          marks: 0,
          note: '',
          ...overrides,
        };

        return {
          ...exam,
          questions: [...exam.questions, newQuestion],
        };
      }
      return exam;
    }));
  };

  const updateQuestionAtIndex = (examId, questionIndex, updates) => {
    setExams(prevExams => prevExams.map(exam => {
      if (exam.id === examId) {
        const updatedQuestions = [...exam.questions];
        updatedQuestions[questionIndex] = {
          ...updatedQuestions[questionIndex],
          ...updates,
        };
        return {
          ...exam,
          questions: updatedQuestions,
        };
      }
      return exam;
    }));
  };

  const updateExam = (examId, updates) => {
    setExams(prevExams => prevExams.map(e => e.id === examId ? { ...e, ...updates } : e));
  };

  const completeExam = (examId) => {
    setExams(prevExams => prevExams.map(exam => {
      if (exam.id === examId) {
        const endTime = Date.now();
        const questions = [...exam.questions];

        // Finalize time for last question
        if (questions.length > 0) {
          const lastQuestion = questions[questions.length - 1];
          if (!lastQuestion.timeSpent) {
            lastQuestion.timeSpent = endTime - lastQuestion.startTime;
          }
        }

        // Calculate total time
        const totalTime = questions.reduce((sum, q) => sum + (q.timeSpent || 0), 0);

        return {
          ...exam,
          endTime: new Date(endTime).toISOString(),
          questions,
          totalTime,
          status: 'completed',
        };
      }
      return exam;
    }));
  };

  const reviewExam = (examId, reviewedQuestions) => {
    setExams(exams.map(exam => {
      if (exam.id === examId) {
        return {
          ...exam,
          questions: reviewedQuestions,
          status: 'reviewed',
        };
      }
      return exam;
    }));
  };

  const getExamById = (examId) => {
    return exams.find(e => e.id === examId);
  };

  const getExamsBySubject = (subjectId) => {
    return exams.filter(e => e.subjectId === subjectId).sort((a, b) =>
      new Date(b.startTime) - new Date(a.startTime)
    );
  };

  const getAllNotesBySubject = (subjectId) => {
    const subjectExams = getExamsBySubject(subjectId);
    const notes = [];

    subjectExams.forEach(exam => {
      exam.questions.forEach(question => {
        if (question.note && question.note.trim()) {
          notes.push({
            examId: exam.id,
            examDate: exam.startTime,
            questionNumber: question.number,
            note: question.note,
            status: question.status,
          });
        }
      });
    });

    return notes;
  };

  const deleteExam = (examId) => {
    setExams(exams.filter(e => e.id !== examId));
  };

  // Theme operations
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  // Analytics
  const getSubjectStats = (subjectId) => {
    const subjectExams = getExamsBySubject(subjectId);
    const reviewedExams = subjectExams.filter(e => e.status === 'reviewed');

    let totalQuestions = 0;
    let correctQuestions = 0;
    let incorrectQuestions = 0;
    let missedQuestions = 0;
    let totalTime = 0;

    reviewedExams.forEach(exam => {
      totalQuestions += exam.questions.length;
      totalTime += exam.totalTime;

      exam.questions.forEach(q => {
        if (q.status === QuestionStatus.CORRECT) correctQuestions++;
        else if (q.status === QuestionStatus.INCORRECT) incorrectQuestions++;
        else if (q.status === QuestionStatus.UNATTEMPTED) missedQuestions++;
      });
    });

    const accuracy = totalQuestions > 0 ? (correctQuestions / totalQuestions) * 100 : 0;
    const avgTimePerQuestion = totalQuestions > 0 ? totalTime / totalQuestions : 0;

    return {
      totalExams: reviewedExams.length,
      totalQuestions,
      correctQuestions,
      incorrectQuestions,
      missedQuestions,
      accuracy: accuracy.toFixed(1),
      avgTimePerQuestion: Math.round(avgTimePerQuestion / 1000), // in seconds
      totalTime: Math.round(totalTime / 1000), // in seconds
      totalMarks: reviewedExams.reduce((sum, e) => sum + e.questions.reduce((qSum, q) => qSum + (q.marks || 0), 0), 0),
    };
  };

  const getOverallStats = () => {
    const reviewedExams = exams.filter(e => e.status === 'reviewed');

    let totalQuestions = 0;
    let correctQuestions = 0;
    let totalTime = 0;

    reviewedExams.forEach(exam => {
      totalQuestions += exam.questions.length;
      totalTime += exam.totalTime;

      exam.questions.forEach(q => {
        if (q.status === QuestionStatus.CORRECT) correctQuestions++;
      });
    });

    const accuracy = totalQuestions > 0 ? (correctQuestions / totalQuestions) * 100 : 0;

    // Find most practiced subject
    const subjectCounts = {};
    exams.forEach(exam => {
      subjectCounts[exam.subjectId] = (subjectCounts[exam.subjectId] || 0) + 1;
    });

    const mostPracticedSubjectId = Object.keys(subjectCounts).reduce((a, b) =>
      subjectCounts[a] > subjectCounts[b] ? a : b, null
    );

    return {
      totalExams: reviewedExams.length,
      totalQuestions,
      accuracy: accuracy.toFixed(1),
      totalTimeHours: (totalTime / 1000 / 60 / 60).toFixed(1),
      mostPracticedSubject: mostPracticedSubjectId ? getSubjectById(mostPracticedSubjectId)?.name : 'None',
    };
  };

  // Export/Import operations
  const exportAllData = () => {
    return {
      subjects,
      exams,
      exportDate: new Date().toISOString(),
      version: '1.0',
    };
  };

  const importData = (data, mode = 'merge') => {
    if (mode === 'replace') {
      setSubjects(data.subjects || []);
      setExams(data.exams || []);
    } else {
      // Merge mode
      setSubjects([...subjects, ...(data.subjects || [])]);
      setExams([...exams, ...(data.exams || [])]);
    }
  };

  const clearAllData = () => {
    if (confirm('Are you sure you want to delete all data? This cannot be undone.')) {
      setSubjects([]);
      setExams([]);
    }
  };

  return {
    // State
    subjects,
    exams,
    theme,

    // Subject operations
    addSubject,
    updateSubject,
    deleteSubject,
    getSubjectById,

    // Exam operations
    createExam,
    addQuestion,
    updateQuestionAtIndex,
    updateExam,
    completeExam,
    reviewExam,
    getExamById,
    getExamsBySubject,
    getAllNotesBySubject,
    deleteExam,

    // Theme
    toggleTheme,

    // Analytics
    getSubjectStats,
    getOverallStats,

    // Export/Import
    exportAllData,
    importData,
    clearAllData,
  };
};
