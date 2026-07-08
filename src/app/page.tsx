"use client";
import { useState } from "react";

// Icons (Mock SVGs)
const HomeIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
  </svg>
);

const PlusIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
  </svg>
);

const ChatIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
  </svg>
);

const ProfileIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
  </svg>
);

const LocationIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16" style={{ display: 'inline', verticalAlign: 'text-bottom' }}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z"></path>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
  </svg>
);

const FireIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16" style={{ display: 'inline', verticalAlign: 'text-bottom', color: 'var(--primary)' }}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"></path>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z"></path>
  </svg>
);

// Initial Mock Data
const INITIAL_ALERTS = [
  { id: 1, user: "Alex M.", restaurant: "Spice Symphony", dish: "Chicken Biryani (Large)", match: 98, distance: "0.4 miles", time: "10 mins ago" },
  { id: 2, user: "Sam T.", restaurant: "Pizza Paradiso", dish: "Large Pepperoni & Mushroom", match: 85, distance: "1.2 miles", time: "25 mins ago" },
  { id: 3, user: "Jordan L.", restaurant: "Sushi Zen", dish: "Deluxe Sushi Boat for 2", match: 92, distance: "0.8 miles", time: "1 hour ago" },
];

import { useAuth } from "@/context/AuthContext";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function App() {
  const [activeTab, setActiveTab] = useState("feed");
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  
  const [restaurant, setRestaurant] = useState("");
  const [dish, setDish] = useState("");
  const [time, setTime] = useState("Now");
  
  const [displayName, setDisplayName] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const { user, loading, logout } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  const removeAlert = (id: number) => {
    setAlerts(alerts.filter(a => a.id !== id));
  };

  const handleBroadcast = () => {
    if (!restaurant || !dish) return;
    const newAlert = {
      id: Date.now(),
      user: user?.displayName || user?.email?.split('@')[0] || "You",
      restaurant,
      dish,
      match: 100,
      distance: "0.0 miles",
      time: "Just now"
    };
    setAlerts([newAlert, ...alerts]);
    setRestaurant("");
    setDish("");
    setTime("Now");
    setActiveTab("feed");
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await updateProfile(user, { displayName: displayName || user.displayName || "" });
      setProfileMessage("Profile updated successfully!");
      setTimeout(() => setProfileMessage(""), 3000);
    } catch (error: any) {
      setProfileMessage("Error updating profile.");
    }
  };

  if (loading) {
    return (
      <div className="flex-col items-center justify-center" style={{ minHeight: "100vh" }}>
        <div className="text-primary" style={{ fontSize: "1.5rem", fontWeight: "bold" }}>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-col p-4 items-center justify-center" style={{ minHeight: "100vh" }}>
        <div className="card" style={{ width: "100%", maxWidth: "400px" }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '16px', textAlign: 'center' }}>
            {isLogin ? "Welcome Back" : "Create Account"}
          </h2>
          <form onSubmit={handleAuth} className="flex-col gap-4">
            <div>
              <label className="text-secondary" style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" 
                required
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--bg-hover)', backgroundColor: 'var(--bg-dark)', color: 'white', outline: 'none' }} 
              />
            </div>
            <div>
              <label className="text-secondary" style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                required
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--bg-hover)', backgroundColor: 'var(--bg-dark)', color: 'white', outline: 'none' }} 
              />
            </div>
            {authError && <div style={{ color: "var(--danger)", fontSize: "0.9rem" }}>{authError}</div>}
            <button type="submit" className="btn-primary mt-2" style={{ width: '100%' }}>
              {isLogin ? "Log In" : "Sign Up"}
            </button>
          </form>
          <div className="text-center mt-4 text-secondary" style={{ fontSize: "0.9rem" }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={() => setIsLogin(!isLogin)} 
              style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0 }}
            >
              {isLogin ? "Sign up" : "Log in"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <header className="glass-header">
        <div className="logo-text">SPLOOD</div>
        {activeTab !== 'profile' && (
           <button className="btn-secondary" style={{ padding: '8px', borderRadius: '50%' }} onClick={() => setActiveTab('profile')}>
             <ProfileIcon />
           </button>
        )}
      </header>

      <main className="p-4" style={{ minHeight: 'calc(100vh - 140px)' }}>
        {activeTab === "feed" && (
          <div className="flex-col gap-4">
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '8px' }}>Nearby Sploods</h2>
            
            <div className="flex-col gap-4">
              {alerts.map(alert => (
                <div key={alert.id} className="card">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {alert.user.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{alert.user}</div>
                        <div className="text-secondary" style={{ fontSize: '0.8rem' }}>{alert.time}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                       <div style={{ color: 'var(--success)', fontWeight: 600, fontSize: '0.9rem' }}>
                         <FireIcon /> {alert.match}% Match
                       </div>
                       <div className="text-secondary" style={{ fontSize: '0.8rem' }}>
                         <LocationIcon /> {alert.distance}
                       </div>
                    </div>
                  </div>
                  
                  <div style={{ backgroundColor: 'var(--bg-hover)', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary)' }}>{alert.restaurant}</div>
                    <div style={{ color: 'var(--text-secondary)' }}>Wants to split: <span style={{ color: 'white', fontWeight: 500 }}>{alert.dish}</span></div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button className="btn-secondary" style={{ flex: 1 }} onClick={() => removeAlert(alert.id)}>Ignore</button>
                    <button className="btn-primary" style={{ flex: 1 }} onClick={() => { window.alert('Splood request sent!'); removeAlert(alert.id); }}>Splood!</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "create" && (
          <div className="flex-col gap-4">
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '8px' }}>Create Splood Alert</h2>
            
            <div className="card">
              <div className="flex-col gap-4">
                <div>
                  <label className="text-secondary" style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Select Restaurant</label>
                  <input type="text" value={restaurant} onChange={(e) => setRestaurant(e.target.value)} placeholder="e.g. Spice Symphony" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--bg-hover)', backgroundColor: 'var(--bg-dark)', color: 'white', outline: 'none' }} />
                </div>
                
                <div>
                  <label className="text-secondary" style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>What do you want to split?</label>
                  <input type="text" value={dish} onChange={(e) => setDish(e.target.value)} placeholder="e.g. Chicken Biryani" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--bg-hover)', backgroundColor: 'var(--bg-dark)', color: 'white', outline: 'none' }} />
                </div>
                
                <div>
                  <label className="text-secondary" style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Time</label>
                  <select value={time} onChange={(e) => setTime(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--bg-hover)', backgroundColor: 'var(--bg-dark)', color: 'white', outline: 'none', appearance: 'none' }}>
                    <option>Now</option>
                    <option>In 30 mins</option>
                    <option>In 1 hour</option>
                    <option>Schedule for later</option>
                  </select>
                </div>

                <button className="btn-primary mt-4" style={{ width: '100%' }} onClick={handleBroadcast}>Broadcast Alert</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "chat" && (
          <div className="flex-col gap-4 items-center justify-center" style={{ height: '50vh' }}>
            <ChatIcon />
            <p className="text-secondary">No active sploods yet.</p>
          </div>
        )}

        {activeTab === "profile" && (
          <div className="flex-col gap-4">
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '8px' }}>Your Profile</h2>
            
            <div className="card">
              <form onSubmit={handleUpdateProfile} className="flex-col gap-4">
                <div>
                  <label className="text-secondary" style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Email</label>
                  <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>
                    {user?.email}
                  </div>
                </div>
                
                <div>
                  <label className="text-secondary" style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Display Name</label>
                  <input 
                    type="text" 
                    value={displayName || user?.displayName || ""} 
                    onChange={(e) => setDisplayName(e.target.value)} 
                    placeholder="Enter display name" 
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--bg-hover)', backgroundColor: 'var(--bg-dark)', color: 'white', outline: 'none' }} 
                  />
                </div>
                
                {profileMessage && <div style={{ color: 'var(--success)', fontSize: '0.9rem' }}>{profileMessage}</div>}
                
                <button type="submit" className="btn-primary mt-2" style={{ width: '100%' }}>Update Profile</button>
              </form>
              
              <div style={{ marginTop: '24px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '24px' }}>
                <button className="btn-secondary" style={{ width: '100%', color: 'var(--danger)' }} onClick={logout}>
                  Log Out
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <nav className="bottom-nav">
        <button className={`nav-item ${activeTab === 'feed' ? 'active' : ''}`} onClick={() => setActiveTab('feed')}>
          <HomeIcon />
          <span>Feed</span>
        </button>
        <button className={`nav-item ${activeTab === 'create' ? 'active' : ''}`} onClick={() => setActiveTab('create')}>
          <div style={{ backgroundColor: 'var(--primary)', padding: '10px', borderRadius: '50%', color: 'white', marginTop: '-20px', boxShadow: '0 4px 10px rgba(255, 87, 34, 0.4)' }}>
            <PlusIcon />
          </div>
          <span style={{ marginTop: '4px' }}>Splood</span>
        </button>
        <button className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>
          <ChatIcon />
          <span>Chat</span>
        </button>
        <button className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
          <ProfileIcon />
          <span>Profile</span>
        </button>
      </nav>
    </>
  );
}
