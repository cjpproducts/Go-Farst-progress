/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { doc, setDoc, onSnapshot, getDocFromServer } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "./firebase";
import { PortalConfig, ModuleStatus } from "./types";
import { 
  Building2, 
  Smartphone, 
  Globe, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Lock, 
  ChevronRight, 
  Save, 
  RefreshCw, 
  AlertCircle,
  TrendingUp,
  ShieldCheck,
  Eye
} from "lucide-react";
import { motion } from "motion/react";

export default function App() {
  // Hash Router State
  const [hash, setHash] = useState(window.location.hash);

  // Firestore Sync State
  const [config, setConfig] = useState<PortalConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Admin View state / fields
  const [adminPasscode, setAdminPasscode] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passcodeError, setPasscodeError] = useState(false);

  // Form Fields inside Admin View
  const [formProgress, setFormProgress] = useState(1);
  const [formControlCenter, setFormControlCenter] = useState<ModuleStatus>("Yet to Start");
  const [formSellerPortal, setFormSellerPortal] = useState<ModuleStatus>("Yet to Start");
  const [formMainApp, setFormMainApp] = useState<ModuleStatus>("Yet to Start");
  const [formPartnerApp, setFormPartnerApp] = useState<ModuleStatus>("Yet to Start");
  const [formDeliveryDate, setFormDeliveryDate] = useState("To Be Updated");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fixed values
  const startAndLaunchDate = "8 June 2026";

  // Listen to hash shifts
  useEffect(() => {
    const handleHashChange = () => {
      setHash(window.location.hash);
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  // Validate Firestore Connection on initiate
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, "test", "connection"));
      } catch (error) {
        if (error instanceof Error && error.message.includes("the client is offline")) {
          console.error("Please check your Firebase configuration or network.");
        }
      }
    }
    testConnection();
  }, []);

  // Listen to the live Portal document
  useEffect(() => {
    const docRef = doc(db, "portal", "config");
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const fetchedData = snapshot.data() as PortalConfig;
          setConfig(fetchedData);
          
          // Seed admin form fields with the current synced values
          setFormProgress(fetchedData.progressBar);
          setFormControlCenter(fetchedData.controlCenterWeb);
          setFormSellerPortal(fetchedData.sellerPortalWeb);
          setFormMainApp(fetchedData.mainAppAndroid);
          setFormPartnerApp(fetchedData.partnerAppAndroid);
          setFormDeliveryDate(fetchedData.estimatedDeliveryDate);
        } else {
          // Document does not exist: Seed with default clean state (remove all pre-completed progresses as per user request)
          const initial: PortalConfig = {
            progressBar: 1,
            controlCenterWeb: "Yet to Start",
            sellerPortalWeb: "Yet to Start",
            mainAppAndroid: "Yet to Start",
            partnerAppAndroid: "Yet to Start",
            estimatedDeliveryDate: "To Be Updated"
          };
          setDoc(docRef, initial)
            .then(() => {
              setConfig(initial);
            })
            .catch((err) => {
              handleFirestoreError(err, OperationType.WRITE, "portal/config");
            });
        }
        setLoading(false);
      },
      (error) => {
        setErrorMessage("Could not load data from Firebase. Check security rules or logs.");
        handleFirestoreError(error, OperationType.GET, "portal/config");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Admin access validation helper
  const handleUnlockAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPasscode === "polarith8825") {
      setIsUnlocked(true);
      setPasscodeError(false);
    } else {
      setPasscodeError(true);
    }
  };

  // Submit edits to Firestore
  const handleSaveChangesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    const docRef = doc(db, "portal", "config");
    const updatedPayload: PortalConfig = {
      progressBar: Math.max(1, Math.min(100, Number(formProgress))),
      controlCenterWeb: formControlCenter,
      sellerPortalWeb: formSellerPortal,
      mainAppAndroid: formMainApp,
      partnerAppAndroid: formPartnerApp,
      estimatedDeliveryDate: formDeliveryDate,
    };

    try {
      await setDoc(docRef, updatedPayload);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000); // clear banner after timer
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "portal/config");
    } finally {
      setIsSaving(false);
    }
  };

  // Determine if URL points to admin route
  const isAdminView = hash === "#/admin" || hash === "#/admin/";

  // Date calculation counters: Days spent since launch
  const getDaysSinceStart = () => {
    try {
      const startDate = new Date("2026-06-08");
      const currentDate = new Date();
      const diffTime = Math.abs(currentDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return isNaN(diffDays) ? 0 : diffDays;
    } catch (e) {
      return 0;
    }
  };

  // Render loader if Firestore isn't connected yet
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white py-20 px-6 font-sans">
        <div className="relative flex flex-col items-center">
          <div className="w-12 h-12 border-2 border-black border-t-blue-600 rounded-none animate-spin"></div>
          <p className="mt-6 text-xs font-mono text-black uppercase tracking-wider">
            Accessing database...
          </p>
        </div>
      </div>
    );
  }

  // Active state template fallback
  const data = config || {
    progressBar: 1,
    controlCenterWeb: "Yet to Start" as ModuleStatus,
    sellerPortalWeb: "Yet to Start" as ModuleStatus,
    mainAppAndroid: "Yet to Start" as ModuleStatus,
    partnerAppAndroid: "Yet to Start" as ModuleStatus,
    estimatedDeliveryDate: "To Be Updated"
  };

  // Helper renderer for box cards status badges using sharp, minimal, high-contrast aesthetics
  const renderStatusBadge = (status: ModuleStatus) => {
    switch (status) {
      case "Completed":
        return (
          <span className="inline-flex items-center px-3 py-1 text-xs font-bold font-mono uppercase tracking-wider bg-blue-600 text-white rounded-none border border-blue-700">
            Completed
          </span>
        );
      case "Progressing":
        return (
          <span className="inline-flex items-center px-3 py-1 text-xs font-bold font-mono uppercase tracking-wider bg-black text-white rounded-none border border-black">
            Progressing
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 text-xs font-bold font-mono uppercase tracking-wider bg-white text-slate-400 rounded-none border border-slate-200">
            Yet to Start
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen text-black bg-white select-none pb-20 transition-colors duration-300 font-sans">
      {/* Dynamic Error Status Bar */}
      {errorMessage && (
        <div className="bg-red-50 border-b-2 border-black text-black px-4 py-3 flex items-center justify-center gap-2 text-xs font-mono font-bold uppercase tracking-wider">
          <AlertCircle className="w-4 h-4 text-black shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Container Wrapper */}
      {!isAdminView ? (
        // PUBLIC VIEW PORTAL
        <main className="max-w-4xl mx-auto px-4 pt-20 sm:px-6">
          {/* Header Layout - Logo Removed at user's instruction */}
          <div className="text-center mb-16 border-b-2 border-black pb-10">
            <motion.div 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-2"
            >
              <h1 className="text-4xl sm:text-5xl font-extrabold font-display tracking-tight text-black rounded-none">
                Polarith Web
              </h1>
            </motion.div>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="text-xs font-mono tracking-widest text-slate-500 uppercase mt-2 font-semibold"
            >
              by Priyam Kesh
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="mt-6 inline-block bg-white border-2 border-black rounded-none px-6 py-2.5"
            >
              <p className="text-black font-bold text-xs uppercase tracking-wider font-mono">
                Go Farst - App development progress portal
              </p>
            </motion.div>
          </div>

          {/* Interactive Progress Bar Card (90 degree sharp edges, no shadow or glow) */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="bg-white rounded-none border-2 border-black p-6 sm:p-8 mb-10"
          >
            <div className="flex items-baseline justify-between mb-5">
              <h2 className="text-sm font-bold font-mono uppercase tracking-wider text-black flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                Overall Progress
              </h2>
              <span className="text-5xl font-black font-display text-blue-600 font-mono">
                {data.progressBar}%
              </span>
            </div>

            {/* Sharp Visual Progress Track - No neon, No rounded edges, Clean flat filled color */}
            <div className="relative w-full h-8 bg-slate-100 border-2 border-black rounded-none mb-6">
              <motion.div 
                className="absolute top-0 left-0 h-full bg-blue-600 rounded-none"
                initial={{ width: 0 }}
                animate={{ width: `${data.progressBar}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-xs font-mono font-bold text-black mix-blend-difference">
                  {data.progressBar}% COMPLETED
                </span>
              </div>
            </div>

            {/* Sub Timeline Blocks (Flat, sharp borders, no shadows) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t-2 border-black">
              <div className="flex items-start gap-3.5 p-4 rounded-none bg-slate-50 border border-slate-200">
                <Calendar className="w-4 h-4 text-black mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Starting Date</p>
                  <p className="text-sm font-bold text-black font-mono mt-1">{startAndLaunchDate}</p>
                  <p className="text-xs text-slate-500 font-mono mt-1">
                    [{getDaysSinceStart()} days elapsed]
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-4 rounded-none bg-slate-50 border border-slate-200">
                <Clock className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Estimated Delivery</p>
                  <p className="text-sm font-bold text-black font-mono mt-1">{data.estimatedDeliveryDate}</p>
                  <p className="text-xs text-blue-600 font-mono font-semibold mt-1 uppercase">
                    Live dynamic estimation
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Development Modules (4 Boxes Grid - 90 degree sharp corners, flat border, hover solid border effect) */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16"
          >
            {/* Box 1: control center (Web) */}
            <div className="bg-white rounded-none border-2 border-slate-200 hover:border-black p-6 flex flex-col justify-between transition-colors duration-200">
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="p-2 border border-slate-200 text-black">
                    <Globe className="w-4 h-4" />
                  </div>
                  {renderStatusBadge(data.controlCenterWeb)}
                </div>
                <h3 className="text-base font-bold text-black font-mono uppercase tracking-tight">
                  control center (Web)
                </h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Web-based control console, configurations manager, parameter variables dashboard, and real-time synchronization backend pipeline.
                </p>
              </div>
            </div>

            {/* Box 2: seller portal (Web) */}
            <div className="bg-white rounded-none border-2 border-slate-200 hover:border-black p-6 flex flex-col justify-between transition-colors duration-200">
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="p-2 border border-slate-200 text-black">
                    <Building2 className="w-4 h-4" />
                  </div>
                  {renderStatusBadge(data.sellerPortalWeb)}
                </div>
                <h3 className="text-base font-bold text-black font-mono uppercase tracking-tight">
                  seller portal (Web)
                </h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Merchant dashboard platform featuring stock management boards, product listings controls, checkout tracking, and core billing data sets.
                </p>
              </div>
            </div>

            {/* Box 3: Main app (android) */}
            <div className="bg-white rounded-none border-2 border-slate-200 hover:border-black p-6 flex flex-col justify-between transition-colors duration-200">
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="p-2 border border-slate-200 text-black">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  {renderStatusBadge(data.mainAppAndroid)}
                </div>
                <h3 className="text-base font-bold text-black font-mono uppercase tracking-tight">
                  Main app (android)
                </h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Native Android mobile environment comprising clean customer account sign-in/up routes, visual products display, and local app cache rules.
                </p>
              </div>
            </div>

            {/* Box 4: Partner app (Android) */}
            <div className="bg-white rounded-none border-2 border-slate-200 hover:border-black p-6 flex flex-col justify-between transition-colors duration-200">
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="p-2 border border-slate-200 text-black">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  {renderStatusBadge(data.partnerAppAndroid)}
                </div>
                <h3 className="text-base font-bold text-black font-mono uppercase tracking-tight">
                  Partner app (Android)
                </h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Fulfillment application tailored for couriers, dispatchers, and order processors including real-time alerts and state updates.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Clean Sub-Footer */}
          <div className="text-center text-[10px] text-slate-400 mt-20 font-mono tracking-widest uppercase border-t border-slate-200 pt-8">
            <p>Polarith Web Team Space • Secured via Firestore</p>
            <p className="mt-1">© 2026 Priyam Kesh. Go Farst Portal.</p>
          </div>
        </main>
      ) : (
        // SECRET ADMIN PORTAL VIEW
        <main className="max-w-xl mx-auto px-4 pt-20 sm:px-6">
          {!isUnlocked ? (
            // LOCK SCREEN (90 degree sharp corners, black & white & blue contrast, no shadows or glows)
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-none border-2 border-black p-8"
            >
              <div className="text-center mb-8">
                <div className="inline-flex p-3 border border-black text-black bg-slate-50 mb-4 rounded-none">
                  <Lock className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold font-mono uppercase tracking-wider text-black">
                  Admin Verification Gate
                </h2>
                <p className="text-xs text-slate-500 mt-1 font-mono uppercase">
                  Authorize access to edit progress details
                </p>
              </div>

              <form onSubmit={handleUnlockAdmin} className="space-y-6">
                <div>
                  <label htmlFor="passcode" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 font-mono">
                    Admin Passcode
                  </label>
                  <input
                    id="passcode"
                    type="password"
                    style={{ WebkitTextSecurity: 'disc' } as React.CSSProperties}
                    placeholder="Enter administration passcode"
                    value={adminPasscode}
                    onChange={(e) => setAdminPasscode(e.target.value)}
                    className="w-full bg-white border-2 border-black rounded-none px-4 py-3.5 text-xs font-mono focus:outline-none focus:border-blue-600 focus:bg-slate-50 transition-all font-bold"
                    required
                  />
                  {passcodeError && (
                    <p className="text-xs text-red-600 font-bold uppercase tracking-wider font-mono mt-2.5 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Access denied. Incorrect passcode.
                    </p>
                  )}
                </div>

                <div className="flex gap-4 pt-2">
                  <a 
                    href="#/"
                    className="flex-1 text-center bg-slate-100 hover:bg-slate-200 text-black border border-slate-300 py-3 rounded-none text-xs font-bold uppercase tracking-wider font-mono transition"
                  >
                    Cancel
                  </a>
                  <button
                    type="submit"
                    className="flex-1 bg-black hover:bg-slate-900 text-white font-bold py-3 rounded-none text-xs uppercase tracking-wider font-mono transition flex items-center justify-center gap-1.5"
                  >
                    Proceed
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </motion.div>
          ) : (
            // MASTER MANAGER CONTROL PANEL (90 degree sharp corners, zero shadow/glow)
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-none border-2 border-black p-6 sm:p-8"
            >
              <div className="flex items-center justify-between pb-5 border-b-2 border-black mb-8">
                <div>
                  <h2 className="text-lg font-bold font-mono uppercase tracking-wider text-black flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-blue-600" />
                    Admin Portal
                  </h2>
                  <p className="text-xs text-slate-500 font-mono uppercase mt-1">Configure development variables</p>
                </div>
                <button
                  onClick={() => {
                    setIsUnlocked(false);
                    setAdminPasscode("");
                    window.location.hash = "#/";
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-black border border-slate-200 hover:border-black px-3 py-1.5 rounded-none transition font-bold uppercase font-mono"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Lock & Exit
                </button>
              </div>

              {saveSuccess && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-blue-50 border-2 border-blue-600 text-blue-900 p-4 rounded-none text-xs font-mono font-bold uppercase tracking-wider mb-6 flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Config saved and live-synced successfully!</span>
                </motion.div>
              )}

              <form onSubmit={handleSaveChangesSubmit} className="space-y-6">
                {/* Progress bar controller */}
                <div className="bg-slate-50 p-5 border border-slate-200">
                  <div className="flex justify-between items-baseline mb-3">
                    <label htmlFor="progress-slider" className="block text-xs font-bold uppercase tracking-wider font-mono text-black">
                      Overall Progress Bar Value
                    </label>
                    <span className="text-3xl font-black font-mono text-blue-600 font-display">
                      {formProgress}%
                    </span>
                  </div>
                  <input
                    id="progress-slider"
                    type="range"
                    min="1"
                    max="100"
                    value={formProgress}
                    onChange={(e) => setFormProgress(Number(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer rounded-none"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1 font-bold">
                    <span>1%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* 4 module state boxes controller */}
                <div className="space-y-4 pt-4 border-t-2 border-black">
                  <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-500">
                    Application Modules Flags
                  </h3>

                  {/* 1. Control Center */}
                  <div className="bg-slate-50 p-4 rounded-none border border-slate-200">
                    <label className="block text-xs font-bold uppercase tracking-wider font-mono text-black mb-3">
                      control center (Web)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["Yet to Start", "Progressing", "Completed"] as ModuleStatus[]).map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setFormControlCenter(status)}
                          className={`py-2 text-[10px] sm:text-xs font-bold font-mono uppercase tracking-wider rounded-none border transition-all ${
                            formControlCenter === status
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "bg-white border-slate-200 text-slate-600 hover:border-black"
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Seller Portal */}
                  <div className="bg-slate-50 p-4 rounded-none border border-slate-200">
                    <label className="block text-xs font-bold uppercase tracking-wider font-mono text-black mb-3">
                      seller portal (Web)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["Yet to Start", "Progressing", "Completed"] as ModuleStatus[]).map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setFormSellerPortal(status)}
                          className={`py-2 text-[10px] sm:text-xs font-bold font-mono uppercase tracking-wider rounded-none border transition-all ${
                            formSellerPortal === status
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "bg-white border-slate-200 text-slate-600 hover:border-black"
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. Main App */}
                  <div className="bg-slate-50 p-4 rounded-none border border-slate-200">
                    <label className="block text-xs font-bold uppercase tracking-wider font-mono text-black mb-3">
                      Main app (android)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["Yet to Start", "Progressing", "Completed"] as ModuleStatus[]).map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setFormMainApp(status)}
                          className={`py-2 text-[10px] sm:text-xs font-bold font-mono uppercase tracking-wider rounded-none border transition-all ${
                            formMainApp === status
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "bg-white border-slate-200 text-slate-600 hover:border-black"
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 4. Partner App */}
                  <div className="bg-slate-50 p-4 rounded-none border border-slate-200">
                    <label className="block text-xs font-bold uppercase tracking-wider font-mono text-black mb-3">
                      Partner app (Android)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["Yet to Start", "Progressing", "Completed"] as ModuleStatus[]).map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setFormPartnerApp(status)}
                          className={`py-2 text-[10px] sm:text-xs font-bold font-mono uppercase tracking-wider rounded-none border transition-all ${
                            formPartnerApp === status
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "bg-white border-slate-200 text-slate-600 hover:border-black"
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Delivery Date Controller */}
                <div className="pt-4 border-t-2 border-black">
                  <label htmlFor="delivery-date-input" className="block text-xs font-bold uppercase tracking-wider font-mono text-black mb-2">
                    Estimated Delivery Date
                  </label>
                  <input
                    id="delivery-date-input"
                    type="text"
                    value={formDeliveryDate}
                    onChange={(e) => setFormDeliveryDate(e.target.value)}
                    placeholder="e.g. 15 August 2026"
                    className="w-full bg-white border-2 border-black rounded-none px-4 py-3 text-xs font-mono focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>

                {/* Submit Controls Block */}
                <div className="flex gap-4 pt-6 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      window.location.hash = "#/";
                    }}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-black border border-slate-300 py-3 rounded-none text-xs font-bold uppercase tracking-wider font-mono transition text-center"
                  >
                    Go Back
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-none text-xs uppercase tracking-wider font-mono transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </main>
      )}
    </div>
  );
}
