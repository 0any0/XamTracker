# ExamTracker - Practice & Progress Tracking App

An elegant, modern web application to track your exam practice sessions, analyze your performance, and manage revision notes.

## Features

### ✅ Core Functionality
- **Subject Management**: Create and organize subjects
- **Exam Sessions**: Practice with automatic time tracking per question
- **Question Navigation**: Navigate forward and backward through questions
- **Review & Grading**: Mark each question as Correct/Incorrect/Missed
- **Notes**: Add question-specific notes tagged with question numbers
- **Analytics**: View overall statistics and subject-wise performance

### 🎨 Design
- Modern glassmorphism UI
- Dark/Light theme support
- Fully responsive (works on phone, tablet, PC)
- Smooth animations and transitions
- Premium aesthetic with vibrant gradients

### 💾 Data Management
- LocalStorage persistence (data stays on your device)
- Export data as JSON for backup
- Import data to restore or merge
- Clear all data option

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm

### Installation & Running

The app is already set up and ready to run!

```bash
# The dependencies are already installed

# Start the development server (already running)
npm run dev
```

The app will be available at **http://localhost:5173**

## How to Use

### 1. Create a Subject
- Click "Add New Subject" on the home page
- Enter a subject name (e.g., "Mathematics", "Physics")

### 2. Start an Exam
- Click "Start Exam" on a subject card
- The timer starts automatically

### 3. During the Exam
- Work on your questions (from your book/notes)
- Use **Next** button to move to the next question
- Use **Previous** button to go back
- Each question's time is tracked individually
- Click **Finish Exam** when done

### 4. Review the Exam
- Mark each question as:
  - ✓ Correct
  - ✗ Incorrect
  - − Missed/Unattempted
- Add notes for questions (tagged as Q1, Q2, etc.)
- Click **Save Review & Finish**

### 5. View Subject Analysis
- Check exam history
- Review all your notes
- See statistics (accuracy, average time, etc.)

### 6. Analytics Dashboard
- View overall performance across all subjects
- Track total study time
- Monitor improvement

### 7. Settings
- Toggle dark/light theme
- Export your data as JSON backup
- Import previously exported data
- Clear all data if needed

## Data Structure

Your data is stored locally in the browser. When you export, you'll get:

```json
{
  "subjects": [...],
  "exams": [...],
  "exportDate": "2025-12-13T...",
  "version": "1.0"
}
```

## Deployment

### Deploy to Vercel (Free)

1. Push this code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your GitHub repository
4. Vercel will auto-detect Vite and deploy
5. You'll get a URL like `https://your-app.vercel.app`

### Or Deploy to Netlify

1. Run `npm run build` to create production files
2. Drag the `dist` folder to [netlify.com/drop](https://app.netlify.com/drop)
3. Get your live URL instantly

## Technology Stack

- **React** 18+ (with Hooks)
- **Vite** (Fast build tool)
- **React Router** (Navigation)
- **Lucide React** (Icons)
- **Vanilla CSS** (Modern design system)

## Browser Compatibility

- Chrome/Edge (recommended)
- Firefox
- Safari
- Works on mobile browsers

## Notes

- Data is stored in LocalStorage (per device)
- Clearing browser data will delete your exam history
- Export regularly to keep backups
- No internet required after initial load (PWA-ready)

## Future Enhancements

- Advanced charts (performance trends, time analysis)
- Cloud sync across devices (Firebase integration)
- PDF export for revision notes
- Statistics export to CSV
- Custom question templates

## Support

For issues or questions, refer to the Settings > About section in the app.

---

**Happy Studying! 📚**
