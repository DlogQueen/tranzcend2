import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
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
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Guidelines from './pages/Guidelines';
import GoLiveSetup from './pages/GoLiveSetup';
import MobileDashboard from './pages/MobileDashboard';
import SafetyCenter from './pages/SafetyCenter';
import Groups from './pages/Groups';
import FriendRequests from './pages/FriendRequests';
import CreatorRequests from './pages/CreatorRequests';
import AdminRoute from './components/AdminRoute';
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
            <Route path="/safety" element={<SafetyCenter />} />
            
            {/* Post Detail inside Layout? Or outside? Let's keep it inside for nav context */}
            <Route path="/post/:id" element={<PostDetail />} />
          </Route>

          {/* Standalone Pages (No Main Layout) */}
          <Route path="/studio" element={<Studio />} />
          <Route path="/go-live-setup" element={<GoLiveSetup />} />
          <Route path="/mobile-dashboard" element={<MobileDashboard />} />
          <Route path="/groups" element={<Groups />} />
              <Route path="/friend-requests" element={<FriendRequests />} />
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/creator-requests" element={<CreatorRequests />} />
              </Route>
          <Route path="/creator-dashboard" element={<Studio />} />
          <Route path="/live-camera" element={<LiveCamera />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/guidelines" element={<Guidelines />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
