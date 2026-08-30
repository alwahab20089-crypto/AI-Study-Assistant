import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/auth/LoginPage.jsx";
import RegisterPage from "./pages/auth/RegisterPage.jsx";
import DashboardPage from "./pages/dashboard/DashboardPage.jsx";
import DashboardLayout from "./layouts/DashboardLayout.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import PublicRoute from "./routes/PublicRoute.jsx";
import DocumentsPage from "./pages/dashboard/DocumentsPage.jsx";
import UploadDocumentPage from "./pages/dashboard/UploadDocumentPage.jsx";
import DocumentDetailPage from "./pages/dashboard/DocumentDetailPage.jsx";
import DocumentChatPage from "./pages/dashboard/DocumentChatPage.jsx";
import QuizPage from "./pages/quizzes/QuizPage.jsx";
import QuizResult from "./pages/quizzes/QuizResult.jsx";
import QuizHistoryPage from "./pages/quizzes/QuizHistoryPage.jsx";
import FlashcardPage from "./pages/flashcards/FlashcardPage.jsx";
import FlashcardsLibraryPage from "./pages/flashcards/FlashcardsLibraryPage.jsx";
import StudySessionsPage from "./pages/study/StudySessionsPage.jsx";
import StudySetupPage from "./pages/study/StudySetupPage.jsx";
import StudyModePage from "./pages/study/StudyModePage.jsx";
import StudyResultPage from "./pages/study/StudyResultPage.jsx";
import ProgressPage from "./pages/progress/ProgressPage.jsx";
import SubjectsPage from "./pages/subjects/SubjectsPage.jsx";
import SubjectDetailPage from "./pages/subjects/SubjectDetailPage.jsx";
function App() {
  return (
    <Routes>
      {/* Public-only routes */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/documents/upload" element={<UploadDocumentPage />} />
          <Route path="/documents/:id" element={<DocumentDetailPage />} />
          <Route path="/chat/:id" element={<DocumentChatPage />} />
          <Route path="/flashcards" element={<FlashcardsLibraryPage />} />

          <Route path="/quizzes/:quizId" element={<QuizPage />} />
          <Route path="/quizzes" element={<QuizHistoryPage />} />
          <Route path="/quizzes/:quizId/result" element={<QuizResult />} />
          <Route path="/flashcards/:flashcardSetId" element={<FlashcardPage />} />
          <Route path="/study" element={<StudySessionsPage />} />
          <Route path="/study/:documentId" element={<StudySetupPage />} />
          <Route path="/study/session/:sessionId" element={<StudyModePage />} />
          <Route path="/study/session/:sessionId/result" element={<StudyResultPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/subjects" element={<SubjectsPage />} />
          <Route path="/subjects/:subjectId" element={<SubjectDetailPage />} />
        </Route>
      </Route>

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;