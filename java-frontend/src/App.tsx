import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import RouteGuard from './components/RouteGuard';
import Homepage from './pages/Homepage';
import SearchResults from './pages/SearchResults';
import ItemDetail from './pages/ItemDetail';
import PostItem from './pages/PostItem';
import Profile from './pages/Profile';
import Chat from './pages/Chat';
import Login from './pages/Login';

import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AdminUsers from './pages/AdminUsers';
import AdminItems from './pages/AdminItems';
import AdminDashboard from './pages/AdminDashboard';
import Reports from './pages/Reports';
import UserProfile from './pages/UserProfile';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <Router>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <Navbar />
            <main>
              <Routes>
                <Route path="/" element={
                  <RouteGuard requireVerified={true}>
                    <Homepage />
                  </RouteGuard>
                } />
                <Route path="/search" element={
                  <RouteGuard requireVerified={true}>
                    <SearchResults />
                  </RouteGuard>
                } />
                <Route path="/item/:id" element={
                  <RouteGuard requireVerified={true}>
                    <ItemDetail />
                  </RouteGuard>
                } />
                <Route path="/post" element={
                  <RouteGuard requireVerified={true}>
                    <PostItem />
                  </RouteGuard>
                } />
                <Route path="/profile" element={
                  <RouteGuard requireVerified={true}>
                    <Profile />
                  </RouteGuard>
                } />
                <Route path="/user/:userId" element={
                  <RouteGuard requireVerified={true}>
                    <UserProfile />
                  </RouteGuard>
                } />
                <Route path="/chat" element={
                  <RouteGuard requireVerified={true}>
                    <Chat />
                  </RouteGuard>
                } />
                <Route path="/admin" element={
                  <RouteGuard requireVerified={true} requireAdmin={true}>
                    <AdminDashboard />
                  </RouteGuard>
                } />
                <Route path="/admin/users" element={
                  <RouteGuard requireVerified={true} requireAdmin={true}>
                    <AdminUsers />
                  </RouteGuard>
                } />
                <Route path="/admin/items" element={
                  <RouteGuard requireVerified={true} requireAdmin={true}>
                    <AdminItems />
                  </RouteGuard>
                } />
                <Route path="/admin/reports" element={
                  <RouteGuard requireVerified={true} requireAdmin={true}>
                    <Reports />
                  </RouteGuard>
                } />
                <Route path="/login" element={<Login />} />

                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
              </Routes>
            </main>
          </div>
        </Router>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;