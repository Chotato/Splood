"use client";
import { useState, useEffect, useRef } from "react";

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
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14" style={{ display: 'inline', verticalAlign: 'text-bottom', color: 'var(--success)' }}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"></path>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z"></path>
  </svg>
);

import { useAuth } from "@/context/AuthContext";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { collection, addDoc, doc, setDoc, getDoc, getDocs, deleteDoc, onSnapshot, query, orderBy, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { calculateDistance } from "@/lib/geo";
import dynamic from "next/dynamic";

const MapPicker = dynamic(() => import("@/components/MapPicker"), { ssr: false });

function getTimeAgo(timestamp: number) {
  if (!timestamp) return "Just now";
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

export default function App() {
  const [activeTab, setActiveTab] = useState("feed");
  const [alerts, setAlerts] = useState<any[]>([]);
  
  const [restaurant, setRestaurant] = useState("");
  const [dish, setDish] = useState("");
  const [time, setTime] = useState("Now");
  
  const [displayName, setDisplayName] = useState("");
  const [searchRadius, setSearchRadius] = useState(10);
  const [userProfile, setUserProfile] = useState<any>(null);
  
  // Temporary state for the map picker before saving
  const [mapLat, setMapLat] = useState<number | null>(null);
  const [mapLng, setMapLng] = useState<number | null>(null);
  
  // Chat state
  const [chats, setChats] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [mySploods, setMySploods] = useState<any[]>([]);
  
  // Notification and badge state
  const [incomingMatch, setIncomingMatch] = useState<{
    chat: any;
    otherUserName: string;
    restaurant: string;
    dish: string;
  } | null>(null);
  const [hasUnreadChat, setHasUnreadChat] = useState(false);
  const knownChatIdsRef = useRef<Set<string>>(new Set());
  const isInitialChatLoadRef = useRef(true);
  const activeChatRef = useRef<any>(null);
  activeChatRef.current = activeChat;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  const [profileMessage, setProfileMessage] = useState("");
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (!user) return;
    if (user.displayName) {
      setDisplayName(user.displayName);
    }
    const fetchProfile = async () => {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserProfile(data);
        if (data.displayName) {
          setDisplayName(data.displayName);
        } else if (user.displayName) {
          setDisplayName(user.displayName);
        }
        if (data.lat && data.lng) {
          setMapLat(data.lat);
          setMapLng(data.lng);
        }
        setSearchRadius(data.searchRadius || 10);
      }
    };
    fetchProfile();
  }, [user]);

  useEffect(() => {
    if (!userProfile?.lat || !userProfile?.lng) {
      setAlerts([]);
      return;
    }
    
    const q = query(collection(db, "alerts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedAlerts: any[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        
        // Exclude alerts older than 1 hour (3600000 ms)
        if (Date.now() - (data.createdAt || 0) > 3600000) return;
        
        const dist = calculateDistance(userProfile.lat, userProfile.lng, data.lat, data.lng);
        
        if (dist <= userProfile.searchRadius) {
          fetchedAlerts.push({
            id: doc.id,
            ...data,
            distanceStr: dist < 0.1 ? "Very close" : `${dist.toFixed(1)} miles away`
          });
        }
      });
      setAlerts(fetchedAlerts);
    });
    return () => unsubscribe();
  }, [userProfile]);
  
  useEffect(() => {
    if (!user) return;
    // Query without orderBy in Firestore to avoid requiring a composite index.
    // Client-side sorting is used instead, matching the pattern in mySploods.
    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", user.uid)
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedChats: any[] = [];
        snapshot.forEach((doc) => {
          fetchedChats.push({ id: doc.id, ...doc.data() });
        });
        fetchedChats.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

        if (isInitialChatLoadRef.current) {
          fetchedChats.forEach((c) => knownChatIdsRef.current.add(c.id));
          isInitialChatLoadRef.current = false;
        } else {
          // Detect incoming matches or new messages from others
          for (const c of fetchedChats) {
            if (!knownChatIdsRef.current.has(c.id)) {
              knownChatIdsRef.current.add(c.id);
              // If someone else created this chat with us
              if (c.createdBy !== user.uid) {
                const otherUserId =
                  c.participants?.find((p: string) => p !== user.uid) || "";
                const otherUserName =
                  c.participantNames?.[otherUserId] || "Someone";
                setIncomingMatch({
                  chat: c,
                  otherUserName,
                  restaurant: c.restaurant,
                  dish: c.dish,
                });
                setHasUnreadChat(true);
              }
            } else {
              // Existing chat: if a new message was sent by the other user and not currently open
              if (
                c.lastSenderId &&
                c.lastSenderId !== user.uid &&
                (!activeChatRef.current || activeChatRef.current.id !== c.id)
              ) {
                setHasUnreadChat(true);
              }
            }
          }
        }

        setChats(fetchedChats);
      },
      (error) => {
        console.error("Error fetching chats:", error);
      }
    );
    return () => unsubscribe();
  }, [user]);
  
  useEffect(() => {
    if (!activeChat) return;
    const q = query(collection(db, `chats/${activeChat.id}/messages`), orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMsgs: any[] = [];
      snapshot.forEach(doc => {
        fetchedMsgs.push({ id: doc.id, ...doc.data() });
      });
      setMessages(fetchedMsgs);
    });
    return () => unsubscribe();
  }, [activeChat]);
  
  useEffect(() => {
    if (activeTab === "my-sploods" && user) {
      const q = query(collection(db, "alerts"), where("userId", "==", user.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetched: any[] = [];
        snapshot.forEach(doc => {
          fetched.push({ id: doc.id, ...doc.data() });
        });
        fetched.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setMySploods(fetched);
      });
      return () => unsubscribe();
    }
  }, [activeTab, user]);
  
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

  const removeAlert = (id: string) => {
    setAlerts(alerts.filter(a => a.id !== id));
  };

  const handleSplood = async (alert: any) => {
    if (!user) return;
    
    // Check if chat already exists for this alert and these participants
    const existingChat = chats.find(c => c.alertId === alert.id && c.participants.includes(alert.userId));
    
    if (existingChat) {
      setActiveChat(existingChat);
      setActiveTab("chat");
      setHasUnreadChat(false);
      return;
    }
    
    try {
      const chatData = {
        alertId: alert.id,
        restaurant: alert.restaurant,
        dish: alert.dish,
        participants: [user.uid, alert.userId],
        participantNames: {
          [user.uid]: user.displayName || user.email?.split('@')[0] || "You",
          [alert.userId]: alert.user
        },
        createdBy: user.uid,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const chatRef = await addDoc(collection(db, "chats"), chatData);
      
      const newChat = { id: chatRef.id, ...chatData };
      knownChatIdsRef.current.add(chatRef.id);
      setActiveChat(newChat);
      setActiveTab("chat");
      setHasUnreadChat(false);
    } catch (error) {
      console.error("Error creating chat:", error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChat || !newMessage.trim() || !user) return;
    
    try {
      const text = newMessage.trim();
      setNewMessage("");
      await addDoc(collection(db, `chats/${activeChat.id}/messages`), {
        senderId: user.uid,
        text,
        timestamp: Date.now()
      });
      await setDoc(
        doc(db, "chats", activeChat.id),
        {
          updatedAt: Date.now(),
          lastMessage: text,
          lastSenderId: user.uid
        },
        { merge: true }
      );
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleBroadcast = async () => {
    if (!restaurant || !dish) return;
    if (!userProfile?.lat || !userProfile?.lng) {
       window.alert("Please complete your profile location before broadcasting!");
       return;
    }
    
    try {
      const userAlertsQuery = query(collection(db, "alerts"), where("userId", "==", user?.uid));
      const userAlertsSnap = await getDocs(userAlertsQuery);
      let userAlerts: any[] = [];
      userAlertsSnap.forEach(doc => userAlerts.push({ id: doc.id, ...doc.data() }));
      
      userAlerts.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
      
      if (userAlerts.length >= 3) {
        const toDeleteCount = userAlerts.length - 2;
        for (let i = 0; i < toDeleteCount; i++) {
          await deleteDoc(doc(db, "alerts", userAlerts[i].id));
        }
      }
      
      await addDoc(collection(db, "alerts"), {
        user: user?.displayName || user?.email?.split('@')[0] || "You",
        userId: user?.uid,
        restaurant,
        dish,
        time,
        match: 100,
        lat: userProfile.lat,
        lng: userProfile.lng,
        createdAt: Date.now()
      });
      
      setRestaurant("");
      setDish("");
      setTime("Now");
      setActiveTab("feed");
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      setProfileMessage("Saving...");
      
      if (!mapLat || !mapLng) {
        setProfileMessage("Please select a location on the map.");
        return;
      }
      
      const trimmedName = displayName.trim();
      await updateProfile(user, { displayName: trimmedName });
      
      const newProfile = {
        displayName: trimmedName,
        searchRadius: Number(searchRadius),
        lat: mapLat,
        lng: mapLng
      };
      
      await setDoc(doc(db, "users", user.uid), newProfile, { merge: true });
      setUserProfile(newProfile);
      
      setProfileMessage("Profile updated successfully!");
      setTimeout(() => setProfileMessage(""), 3000);
    } catch (error: any) {
      setProfileMessage("Error updating profile.");
    }
  };

  const handleDeleteSplood = async (id: string) => {
    try {
      await deleteDoc(doc(db, "alerts", id));
    } catch (e) {
      console.error("Error deleting splood: ", e);
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
      {/* Incoming Splood Match Modal Banner */}
      {incomingMatch && (
        <div className="match-banner-backdrop">
          <div className="match-banner-card">
            <div className="flex items-center gap-3">
              <div className="match-icon-badge">🎉</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "white" }}>
                  Splood Match Found!
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                  <strong style={{ color: "var(--primary)" }}>{incomingMatch.otherUserName}</strong> accepted your request for{" "}
                  <strong style={{ color: "white" }}>{incomingMatch.dish}</strong> at{" "}
                  <strong style={{ color: "white" }}>{incomingMatch.restaurant}</strong>!
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                className="btn-secondary"
                style={{ flex: 1, padding: "10px", fontSize: "0.9rem" }}
                onClick={() => setIncomingMatch(null)}
              >
                Later
              </button>
              <button
                className="btn-primary"
                style={{ flex: 1, padding: "10px", fontSize: "0.9rem" }}
                onClick={() => {
                  setActiveChat(incomingMatch.chat);
                  setActiveTab("chat");
                  setHasUnreadChat(false);
                  setIncomingMatch(null);
                }}
              >
                Chat Now
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="glass-header">
        <div className="logo-text">SPLOOD</div>
      </header>

      <main className="p-4" style={{ minHeight: 'calc(100vh - 140px)' }}>
        {activeTab === "feed" && (
          <div className="flex-col gap-4">
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '8px' }}>Nearby Sploods</h2>
            
            {!userProfile?.lat && (
              <div className="card text-center" style={{ color: 'var(--primary)' }}>
                Please set your location in the Profile tab to see nearby sploods!
              </div>
            )}
            
            <div className="flex-col gap-4">
              {alerts.map(alert => (
                <div key={alert.id} className="card">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--bg-hover)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--primary)' }}>
                        {alert.user.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{alert.user}</div>
                        <div className="text-secondary" style={{ fontSize: '0.8rem' }}>{getTimeAgo(alert.createdAt)}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                       <div style={{ color: 'var(--success)', fontWeight: 600, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'var(--success-bg)', border: '1px solid var(--success-border)', padding: '3px 8px', borderRadius: 'var(--radius-full)' }}>
                         <FireIcon /> {alert.match}% Match
                       </div>
                       <div className="text-secondary" style={{ fontSize: '0.8rem' }}>
                         <LocationIcon /> {alert.distanceStr || "Nearby"}
                       </div>
                    </div>
                  </div>
                  
                  <div style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-subtle)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', marginBottom: '16px' }}>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--primary)' }}>{alert.restaurant}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '2px' }}>Wants to split: <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{alert.dish}</span></div>
                  </div>
                  
                  {alert.userId === user?.uid ? (
                    <div className="text-center" style={{ color: 'var(--text-secondary)', fontWeight: 500, padding: '10px', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem' }}>
                      Your Alert
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button className="btn-secondary" style={{ flex: 1 }} onClick={() => removeAlert(alert.id)}>Ignore</button>
                      <button className="btn-primary" style={{ flex: 1 }} onClick={() => handleSplood(alert)}>Splood!</button>
                    </div>
                  )}
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
          <div className="flex-col gap-4" style={{ height: '100%' }}>
            {!activeChat ? (
              <>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '8px' }}>Your Chats</h2>
                {chats.length === 0 ? (
                  <div className="flex-col gap-4 items-center justify-center" style={{ height: '40vh' }}>
                    <ChatIcon />
                    <p className="text-secondary">No active chats yet.</p>
                  </div>
                ) : (
                  <div className="flex-col gap-2">
                    {chats.map(chat => {
                       const otherUserId = chat.participants?.find((p: string) => p !== user?.uid) || "Unknown";
                       const otherUserName = chat.participantNames?.[otherUserId] || "Someone";
                       return (
                         <div
                           key={chat.id}
                           className="card"
                           onClick={() => {
                             setActiveChat(chat);
                             setHasUnreadChat(false);
                           }}
                           style={{ cursor: 'pointer' }}
                         >
                           <div className="flex justify-between items-center">
                             <div style={{ fontWeight: 600 }}>{otherUserName}</div>
                             {chat.updatedAt && (
                               <div className="text-secondary" style={{ fontSize: '0.75rem' }}>
                                 {getTimeAgo(chat.updatedAt)}
                               </div>
                             )}
                           </div>
                           <div className="text-secondary" style={{ fontSize: '0.85rem', marginTop: '2px' }}>
                             {chat.restaurant} • <span style={{ color: 'white' }}>{chat.dish}</span>
                           </div>
                           {chat.lastMessage && (
                             <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                               {chat.lastSenderId === user?.uid ? "You: " : ""}{chat.lastMessage}
                             </div>
                           )}
                         </div>
                       );
                    })}
                  </div>
                )}
              </>
            ) : (
              <div className="flex-col" style={{ height: 'calc(100vh - 180px)' }}>
                <div className="flex items-center gap-3 mb-4">
                  <button onClick={() => setActiveChat(null)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '0 8px', fontSize: '1.2rem' }}>
                    ←
                  </button>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '1.05rem' }}>
                      {activeChat.participantNames?.[activeChat.participants?.find((p: string) => p !== user?.uid) || ""] || "Chat"}
                    </div>
                    <div className="text-secondary" style={{ fontSize: '0.8rem' }}>
                      {activeChat.restaurant} • {activeChat.dish}
                    </div>
                  </div>
                </div>
                
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', backgroundColor: 'var(--bg-dark)', borderRadius: '12px', marginBottom: '12px' }}>
                  {messages.length === 0 ? (
                    <div className="text-center text-secondary" style={{ margin: 'auto', fontSize: '0.9rem' }}>
                      Say hello and coordinate where to meet! 👋
                    </div>
                  ) : (
                    messages.map(msg => {
                      const isMine = msg.senderId === user?.uid;
                      return (
                        <div
                          key={msg.id}
                          style={{
                            alignSelf: isMine ? 'flex-end' : 'flex-start',
                            backgroundColor: isMine ? 'var(--primary)' : 'var(--bg-hover)',
                            color: isMine ? 'var(--primary-text)' : 'var(--text-primary)',
                            padding: '8px 14px',
                            borderRadius: '16px',
                            maxWidth: '80%',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px',
                            fontWeight: isMine ? 500 : 400
                          }}
                        >
                          <div>{msg.text}</div>
                          {msg.timestamp && (
                            <div style={{ fontSize: '0.65rem', color: isMine ? 'rgba(18, 16, 28, 0.65)' : 'var(--text-secondary)', alignSelf: isMine ? 'flex-end' : 'flex-start' }}>
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
                
                <form onSubmit={sendMessage} className="flex gap-2">
                  <input 
                    type="text" 
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    style={{ flex: 1, padding: '12px 16px', borderRadius: '24px', border: '1px solid var(--bg-hover)', backgroundColor: 'var(--bg-dark)', color: 'white', outline: 'none' }}
                  />
                  <button type="submit" className="btn-primary" style={{ borderRadius: '24px', padding: '0 20px' }}>
                    Send
                  </button>
                </form>
              </div>
            )}
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
                    value={displayName} 
                    onChange={(e) => setDisplayName(e.target.value)} 
                    placeholder="Enter display name" 
                  />
                </div>
                
                <div>
                  <label className="text-secondary" style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Pinpoint your location</label>
                  <MapPicker 
                    initialLat={userProfile?.lat} 
                    initialLng={userProfile?.lng} 
                    onLocationChange={(lat, lng) => {
                      setMapLat(lat);
                      setMapLng(lng);
                    }} 
                  />
                </div>
                
                <div>
                  <label className="text-secondary" style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Search Radius ({searchRadius} miles)</label>
                  <input 
                    type="range" 
                    min="1" max="100" 
                    value={searchRadius} 
                    onChange={(e) => setSearchRadius(Number(e.target.value))} 
                    style={{ width: '100%' }} 
                  />
                </div>
                
                {profileMessage && <div style={{ color: 'var(--success)', fontSize: '0.9rem' }}>{profileMessage}</div>}
                
                <button type="submit" className="btn-primary mt-2" style={{ width: '100%' }}>Update Profile</button>
              </form>
              
              <div style={{ marginTop: '24px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '24px' }}>
                <button className="btn-secondary mb-4" style={{ width: '100%' }} onClick={() => setActiveTab('my-sploods')}>
                  Manage My Sploods
                </button>
                <button className="btn-secondary" style={{ width: '100%', color: 'var(--danger)' }} onClick={logout}>
                  Log Out
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "my-sploods" && (
          <div className="flex-col gap-4">
            <div className="flex items-center gap-2 mb-2">
              <button onClick={() => setActiveTab('profile')} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '0 8px' }}>
                ← Back
              </button>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Manage My Sploods</h2>
            </div>
            
            {mySploods.length === 0 ? (
              <div className="card text-center text-secondary">
                You don't have any active sploods.
              </div>
            ) : (
              <div className="flex-col gap-4">
                {mySploods.map(alert => (
                  <div key={alert.id} className="card">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <div style={{ fontWeight: 600 }}>{alert.restaurant}</div>
                        <div className="text-secondary" style={{ fontSize: '0.8rem' }}>{getTimeAgo(alert.createdAt)}</div>
                      </div>
                      <button className="btn-secondary" style={{ color: 'var(--danger)', padding: '6px 12px' }} onClick={() => handleDeleteSplood(alert.id)}>
                        Delete
                      </button>
                    </div>
                    <div style={{ color: 'var(--text-secondary)' }}>Wants to split: <span style={{ color: 'white', fontWeight: 500 }}>{alert.dish}</span></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <nav className="bottom-nav">
        <button className={`nav-item ${activeTab === 'feed' ? 'active' : ''}`} onClick={() => setActiveTab('feed')}>
          <HomeIcon />
          <span>Feed</span>
        </button>
        <button className={`nav-item ${activeTab === 'create' ? 'active' : ''}`} onClick={() => setActiveTab('create')}>
          <div className="splood-fab">
            <PlusIcon />
          </div>
          <span>Splood</span>
        </button>
        <button className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => { setActiveTab('chat'); setHasUnreadChat(false); }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ChatIcon />
            {hasUnreadChat && <span className="unread-dot" />}
          </div>
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
