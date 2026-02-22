import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Discovery from './pages/Discovery';
import Profile from './pages/Profile';
import Messages from './pages/Messages';
import Chat from './pages/Chat';
import Wallet from './pages/Wallet';
import Verification from './pages/Verification';
import AdminDashboard from './pages/AdminDashboard';
import Landing from './pages/Landing';
import EditProfile from './pages/EditProfile';
import CreatePost from './pages/CreatePost';
import Feed from './pages/Feed';
import PostDetail from './pages/PostDetail';
import LiveCamera from './pages/LiveCamera';
import Studio from './pages/Studio';
import AgeGate from './components/AgeGate';

function App() {
  return (
    <AuthProvider>
      <AgeGate />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          <Route element={<Layout />}>
            <Route path="/discover" element={<Discovery />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/create-post" element={<CreatePost />} />
            <Route path="/profile/:id" element={<Profile />} />
            <Route path="/profile/edit" element={<EditProfile />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/messages/:id" element={<Chat />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/verification" element={<Verification />} />
            <Route path="/admin" element={<AdminDashboard />} />
            
            {/* Post Detail inside Layout? Or outside? Let's keep it inside for nav context */}
            <Route path="/post/:id" element={<PostDetail />} />
          </Route>

          {/* Standalone Pages (No Main Layout) */}
          <Route path="/studio" element={<Studio />} />
          <Route path="/live-camera" element={<LiveCamera />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
