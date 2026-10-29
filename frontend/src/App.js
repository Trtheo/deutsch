import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { DialogProvider } from './components/Dialog';
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
import ProfilePage from './pages/ProfilePage';

export default function App() {
  return (
    <BrowserRouter>
      <DialogProvider>
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
              <Route path="/profile" element={<ProfilePage />} />
            </Routes>
          </Layout>
        </AppProvider>
      </AuthProvider>
      </DialogProvider>
    </BrowserRouter>
  );
}
