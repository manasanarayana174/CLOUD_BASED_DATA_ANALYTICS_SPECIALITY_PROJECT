import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import { SocketProvider } from './context/SocketContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import PatientDetail from './components/patient/PatientDetail';
import AIChat from './pages/AIChat';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Operations from './pages/Operations';
import AdminPanel from './pages/AdminPanel';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();

    // BYPASS AUTH FOR TESTING - Remove this in production
    return <Layout>{children}</Layout>;

    // Original auth logic (commented out for testing)
    // if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    // if (!user) return <Navigate to="/login" replace />;
    // return <Layout>{children}</Layout>;
};

function App() {
    return (
        <AuthProvider>
            <SocketProvider>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />

                    {/* Protected Routes */}
                    <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/patients" element={<ProtectedRoute><Patients /></ProtectedRoute>} />
                    <Route path="/patients/:id" element={<ProtectedRoute><PatientDetail /></ProtectedRoute>} />
                    <Route path="/operations" element={<ProtectedRoute><Operations /></ProtectedRoute>} />
                    <Route path="/ai-chat" element={<ProtectedRoute><AIChat /></ProtectedRoute>} />
                    <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </SocketProvider>
        </AuthProvider>
    );
}

export default App;
