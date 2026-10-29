import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import LessonPage from './pages/LessonPage';
import ExamsPage from './pages/ExamsPage';
import ResourcesPage from './pages/ResourcesPage';
import ProgressPage from './pages/ProgressPage';
import FlashcardsPage from './pages/FlashcardsPage';
import AdminPage from './pages/AdminPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import TranslatorPage from './pages/TranslatorPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/lesson/:slug" element={<LessonPage />} />
              <Route path="/exams" element={<ExamsPage />} />
              <Route path="/resources" element={<ResourcesPage />} />
              <Route path="/progress" element={<ProgressPage />} />
              <Route path="/flashcards" element={<FlashcardsPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/translate" element={<TranslatorPage />} />
            </Routes>
          </Layout>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
