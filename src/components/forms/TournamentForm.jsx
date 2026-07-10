/**
 * TournamentForm.jsx
 *
 * DEPENDENCIES REQUIRED (run once):
 *   npm install react-hook-form @hookform/resolvers
 *
 * Architecture:
 *  - useForm + zodResolver → zero uncontrolled re-renders; validation runs on
 *    submit and per-field on touch. No useState for form values.
 *  - useFieldArray → `players` array is the source of truth for roster cards.
 *    Sub toggle simply appends/removes a player — no separate subActive state.
 *  - Controller → used only for the range slider (non-standard input).
 *  - Invite code onBlur → side-effect lookup, NOT a Zod validator.
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFormSubmit } from '../../hooks/useFormSubmit';
import { 
  validateInviteCode, 
  saveDraft, 
  getDraft, 
  renewLock, 
  checkDuplicateDrafts, 
  logEvents,
  logDiagnostics 
} from '../../services/sheets';
import { resolveSteam64 } from '../../services/steam';
import { fetchFaceitProfile } from '../../services/faceit';
import { LogoUploader } from './LogoUploader';
import { SYSTEM_CONFIG, FEATURES } from '../../config/systemConfig';
import { migrateDraft, SCHEMA_VERSION } from '../../utils/draftMigrator';
import { EVENT_SCHEMA_VERSION } from '../../constants/eventSchema';
import { getCapabilities } from '../../services/sheets';
import { 
  getSessionUuid, 
  setSessionUuid, 
  clearSessionUuid, 
  getRevision, 
  incrementRevision,
  clearRevision 
} from '../../utils/idempotency';
import {
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Users as UsersIcon,
  MessageSquare,
  Gamepad2,
  Crosshair,
  Award,
  Key,
  Users,
  Tag,
  Globe,
  Image as ImageIcon,
  Copy,
  Check,
  ExternalLink,
  Activity,
  ShieldAlert,
  AlertOctagon,
  Zap,
  Lock,
  CloudOff,
  RefreshCw,
} from 'lucide-react';

// ─── Dynamic Zod Schema ────────────────────────────────────────────────────────
// Built per-tournament so coreCount is encoded into the min() guard.
// All players in the form array are required — when a sub is added, they fill it.
// When a sub is removed via the toggle, the element is gone from the array.
const buildFormSchema = (tournament) => {
  const coreCount = tournament.playersPerTeam ?? 5;

  const playerSchema = z.object({
    ign: z.string().optional().default(''),
    discord: z.string().min(1, 'Discord handle required').transform(v => v.trim().toLowerCase()),
    steam: z.string().min(1, 'Steam URL required'),
    steam64: z.string().optional(),
    faceit: z.string().min(1, 'FACEIT URL required'),
    faceitLevel: z.string().default('N/A'),
    faceitElo: z.string().default('N/A'),
    cs2RankLabel: z.string().default('Not Linked'),
    avatar: z.string().optional().default(''),
    walletAddress: z.string().optional().default(''),
  });

  return z.object({
    inviteCode: z.string().optional().default(''),
    teamName: z.string()
      .min(2, 'Team name must be at least 2 characters')
      .max(64, 'Team name max 64 chars')
      .regex(/^[\w\s\-'.!]+$/u, 'No restricted special characters'),
    teamTag: z
      .string()
      .min(1, 'Team tag is required')
      .max(8, 'Tag max 8 chars')
      .regex(/^[A-Za-z0-9]+$/, 'Alphanumeric letters only'),
    teamRegion: z.string().min(1, 'Select a region'),
    logoLink: z.string().min(1, 'Logo URL is required'),
    players: z
      .array(playerSchema)
      .min(coreCount, `Minimum ${coreCount} players required`),
    agreeDiscord: z.literal(true, { errorMap: () => ({ message: "You must agree to Discord presence requirement" }) }),
    agreeVoice: z.literal(true, { errorMap: () => ({ message: "You must agree to join Voice Channels" }) }),
    agreeSchedule: z.literal(true, { errorMap: () => ({ message: "You must confirm availability for all dates" }) }),
  });
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
const blankPlayer = () => ({ ign: '', discord: '', steam: '', steam64: '', faceit: '', faceitLevel: '', faceitElo: '', cs2RankLabel: '', avatar: '' });

const getPlayerMeta = (index, coreCount) => {
  if (index === 0)
    return {
      title: 'CAPTAIN',
      dotClass: 'bg-yellow-400',
      textClass: 'text-yellow-400',
      lineClass: 'bg-yellow-500',
    };
  if (index >= coreCount)
    return {
      title: 'SUBSTITUTE',
      dotClass: 'bg-neon-pink',
      textClass: 'text-neon-pink',
      lineClass: 'bg-neon-pink',
    };
  if (coreCount === 2)
    return {
      title: 'PARTNER',
      dotClass: 'bg-white',
      textClass: 'text-white',
      lineClass: 'bg-white',
    };
  return {
    title: 'STARTER',
    dotClass: 'bg-white',
    textClass: 'text-white',
    lineClass: 'bg-white',
  };
};

// ─── Component ────────────────────────────────────────────────────────────────
export const TournamentForm = ({ tournament, slots }) => {
  const [inviteStatus, setInviteStatus] = useState('AWAITING INPUT...');
  const corePlayerCount = tournament.playersPerTeam ?? 5;
  const hasSubs = (tournament.substitutes?.max ?? 0) > 0;

  // Memoize schema so it only rebuilds when tournament changes
  const formSchema = useMemo(() => buildFormSchema(tournament), [tournament]);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      inviteCode: '',
      teamName: '',
      teamTag: '',
      teamRegion: '',
      logoLink: '',
      players: Array.from({ length: corePlayerCount }, blankPlayer),
      agreeDiscord: false,
      agreeVoice: false,
      agreeSchedule: false
    },
  });

  // ── Session Management System States & Refs ───────────────────────────────
  const lockOwnerId = useMemo(() => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36), []);
  const [sessionUuid, setSessionUuidState] = useState(() => getSessionUuid(tournament.id) || null);
  const [lockAcquired, setLockAcquired] = useState(false);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [isRevisionConflict, setIsRevisionConflict] = useState(false);
  
  // Autosave HUD states
  const [autosaveStatus, setAutosaveStatus] = useState(null); // 'SAVING', 'SAVED', 'SAVED_OFFLINE', 'ERROR'
  const [lastSavedText, setLastSavedText] = useState('');
  
  // Recovery overlays
  const [draftRestorePrompt, setDraftRestorePrompt] = useState(null); // holds { formData, ageText }
  const [duplicateDraftPrompt, setDuplicateDraftPrompt] = useState(null); // holds matching session info
  const [draftRestored, setDraftRestored] = useState(false);

  // Time & Diagnostics telemetry refs
  const activeEditingTimeRef = useRef(0);
  const idleTimeRef = useRef(0);
  const offlineTimeRef = useRef(0);
  const totalSessionDurationRef = useRef(0);
  
  const lastActivityTimestampRef = useRef(Date.now());
  const eventQueueRef = useRef([]);
  const diagnosticsQueueRef = useRef([]);
  const lastSavedPayloadRef = useRef('');
  const isTypingRef = useRef(false);

  // Diagnostics counters
  const lookupFailuresCountRef = useRef(0);
  const validationFailuresCountRef = useRef(0);
  const resumeCountRef = useRef(0);
  const idleCountRef = useRef(0);
  const offlineCountRef = useRef(0);
  const retryCountRef = useRef(0);
  const apiFailuresCountRef = useRef(0);

  // Logo upload diagnostics
  const logoDiagnosticsRef = useRef({
    fileSize: 0,
    dimensions: '',
    compression: '',
    uploadDuration: 0,
    failureReason: '',
    retryCount: 0
  });

  // Watch all values to detect form updates
  const watchedValues = watch();

  // Helper to log events locally to batch flush
  const pushTelemetryEvent = (eventType, frictionStage, details = {}) => {
    if (!FEATURES.eventTelemetry) return;
    const eventId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
    eventQueueRef.current.push({
      eventId,
      requestId: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      timestamp: new Date().toISOString(),
      frictionStage,
      eventType,
      taxonomyVersion: String(EVENT_SCHEMA_VERSION),
      details
    });
  };

  const pushDiagnostic = (apiStatus, saveDuration, errDetails = "") => {
    const ua = navigator.userAgent;
    let browser = "BR_UNKNOWN";
    let os = "OS_UNKNOWN";
    let deviceType = "DEV_DESKTOP";

    if (/chrome|crios/i.test(ua) && !/edge|edg/i.test(ua)) browser = "BR_CHROME";
    else if (/firefox|iceweasel/i.test(ua)) browser = "BR_FIREFOX";
    else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) browser = "BR_SAFARI";
    else if (/edge|edg/i.test(ua)) browser = "BR_EDGE";

    if (/android/i.test(ua)) {
      os = "OS_ANDROID";
      deviceType = "DEV_MOBILE";
    } else if (/ipad|iphone|ipod/i.test(ua)) {
      os = "OS_IOS";
      deviceType = "DEV_MOBILE";
    } else if (/windows/i.test(ua)) os = "OS_WINDOWS";
    else if (/macintosh|mac os x/i.test(ua)) os = "OS_MAC";
    else if (/linux/i.test(ua)) os = "OS_LINUX";

    diagnosticsQueueRef.current.push({
      diagnosticId: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      requestId: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      timestamp: new Date().toISOString(),
      saveDuration,
      lookupDuration: lookupFailuresCountRef.current * 120,
      uploadDuration: logoDiagnosticsRef.current.uploadDuration || 0,
      apiStatus,
      retryCount: retryCountRef.current,
      networkStatus: navigator.onLine ? "NET_ONLINE" : "NET_OFFLINE",
      deviceType,
      browser,
      os,
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      errorDetails: errDetails
    });
  };

  // ── Calculate Form Completion metrics ───────────────────────────────
  const completionStats = useMemo(() => {
    const { teamName, teamTag, teamRegion, logoLink, players = [], agreeDiscord, agreeVoice, agreeSchedule } = watchedValues;
    const required = [];
    required.push({ name: "Team Name", val: teamName });
    required.push({ name: "Team Tag", val: teamTag });
    required.push({ name: "Server Region", val: teamRegion });
    required.push({ name: "Team Logo", val: logoLink });
    
    for (let i = 0; i < corePlayerCount; i++) {
      const p = players[i] || {};
      required.push({ name: `Player ${i+1} Discord`, val: p.discord });
      required.push({ name: `Player ${i+1} Steam`, val: p.steam });
      required.push({ name: `Player ${i+1} FACEIT`, val: p.faceit });
    }
    
    required.push({ name: "Agree Discord", val: agreeDiscord });
    required.push({ name: "Agree Voice Channel", val: agreeVoice });
    required.push({ name: "Agree Schedule", val: agreeSchedule });

    const totalRequired = required.length;
    const completed = required.filter(f => {
      if (typeof f.val === 'boolean') return f.val === true;
      return f.val && String(f.val).trim() !== '';
    });
    
    const missing = required
      .filter(f => {
        if (typeof f.val === 'boolean') return f.val !== true;
        return !f.val || String(f.val).trim() === '';
      })
      .map(f => f.name);

    let frictionStage = "STAGE_TEAM_DETAILS";
    if (!teamName || !teamTag || !teamRegion) {
      frictionStage = "STAGE_TEAM_DETAILS";
    } else if (!logoLink) {
      frictionStage = "STAGE_LOGO_UPLOAD";
    } else {
      let firstIncompletePlayer = -1;
      for (let i = 0; i < corePlayerCount; i++) {
        const p = players[i] || {};
        if (!p.discord || !p.steam || !p.faceit) {
          firstIncompletePlayer = i;
          break;
        }
      }
      if (firstIncompletePlayer !== -1) {
        frictionStage = firstIncompletePlayer === 0 ? "STAGE_CAPTAIN_INFO" : `STAGE_PLAYER_${firstIncompletePlayer + 1}`;
      } else if (!agreeDiscord || !agreeVoice || !agreeSchedule) {
        frictionStage = "STAGE_REVIEW";
      } else {
        frictionStage = "STAGE_SUBMIT";
      }
    }

    return {
      completedCount: completed.length,
      totalRequired,
      missingFields: missing.join(", "),
      frictionStage
    };
  }, [watchedValues, corePlayerCount]);

  // ── Session Mount Restoration & Init ──────────────────────────────────────
  useEffect(() => {
    // 1. Check for Dead-Letter Queue (DLQ fallback)
    const dlq = localStorage.getItem(`pp_dlq_${tournament.id}`);
    if (dlq) {
      try {
        setDlqItem(JSON.parse(dlq));
      } catch (e) {
        localStorage.removeItem(`pp_dlq_${tournament.id}`);
      }
    }

    if (!FEATURES.sessionTracking) return;

    // 2. Fetch or Load session state
    const loadSession = async () => {
      // Negotiate Capabilities
      try {
        const caps = await getCapabilities(tournament.id);
        if (caps && caps.success) {
          Terminal.log('CAPABILITIES', `Negotiated API: ${caps.apiVersion}, max payload: ${caps.maxPayloadSize}`);
        }
      } catch (e) {
        console.warn("Failed to check capabilities:", e);
      }

      const storedSessionUuid = getSessionUuid(tournament.id);
      if (storedSessionUuid) {
        try {
          const res = await getDraft(tournament.id, storedSessionUuid);
          if (res?.success && res.draft) {
            const draftData = res.draft;
            
            // If already submitted, archive or clear session
            if (draftData.status === 'STATUS_SUBMITTED' || draftData.status === 'STATUS_PURGED') {
              clearSessionUuid(tournament.id);
              clearRevision(tournament.id);
              return;
            }

            // Calculate age and show warn banner
            const deltaMs = Date.now() - new Date(draftData.lastActivityTime).getTime();
            const daysOld = Math.floor(deltaMs / 86400000);
            let ageText = '';
            if (daysOld >= 3) {
              ageText = `This registration draft was last updated ${daysOld} days ago. Roster rules or map pools may have changed.`;
            }

            setDraftRestorePrompt({
              sessionUuid: storedSessionUuid,
              formData: draftData.formData,
              ageText,
              schemaVersion: draftData.schemaVersion
            });
          } else {
            // Draft not found on server (purged or different environment)
            clearSessionUuid(tournament.id);
            clearRevision(tournament.id);
          }
        } catch (e) {
          console.warn("Failed to check active draft session on mount:", e);
        }
      }
    };

    loadSession();

    // 3. Setup Telemetry listeners (online/offline, visibility change)
    const handleOnline = () => {
      setAutosaveStatus(null);
      pushTelemetryEvent('NETWORK_ONLINE', completionStats.frictionStage);
    };
    const handleOffline = () => {
      setAutosaveStatus('SAVED_OFFLINE');
      offlineCountRef.current += 1;
      pushTelemetryEvent('NETWORK_OFFLINE', completionStats.frictionStage);
    };
    const handleVisibility = () => {
      if (document.hidden) {
        pushTelemetryEvent('TAB_HIDDEN', completionStats.frictionStage);
      } else {
        pushTelemetryEvent('TAB_VISIBLE', completionStats.frictionStage);
        lastActivityTimestampRef.current = Date.now();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibility);

    // 4. Timer to count active editing vs idle time
    const secondTimer = setInterval(() => {
      totalSessionDurationRef.current += 1;
      const now = Date.now();
      const sinceLastActivity = now - lastActivityTimestampRef.current;

      if (sinceLastActivity > 1800000) { // 30 minutes
        // Idle state
        idleTimeRef.current += 1;
      } else {
        if (!document.hidden && document.hasFocus() && isTypingRef.current) {
          activeEditingTimeRef.current += 1;
        } else {
          idleTimeRef.current += 1;
        }
      }

      if (!navigator.onLine) {
        offlineTimeRef.current += 1;
      }
    }, 1000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(secondTimer);
    };
  }, [tournament.id, completionStats.frictionStage]);

  // ── Heartbeat lease lock renewal timer ────────────────────────────────────
  useEffect(() => {
    if (!sessionUuid || !lockAcquired || isLockedOut || !FEATURES.sessionTracking) return;

    const renewLease = async () => {
      try {
        const res = await renewLock(tournament.id, sessionUuid, lockOwnerId);
        if (res && res.success === false && res.errorCode === 'ERR_LOCK_LOST') {
          setIsLockedOut(true);
          pushTelemetryEvent('LOOKUP_FAILED', completionStats.frictionStage, { reason: 'LOCK_LOST' });
          Terminal.error('LOCK', 'Session lock taken over by another window.');
        }
      } catch (err) {
        console.warn("Heartbeat lock renewal failed:", err);
      }
    };

    const leaseInterval = setInterval(renewLease, SYSTEM_CONFIG.LOCK_HEARTBEAT_INTERVAL);
    return () => clearInterval(leaseInterval);
  }, [sessionUuid, lockAcquired, isLockedOut, tournament.id, lockOwnerId, completionStats.frictionStage]);

  // ── Telemetry & Diagnostics Background Flusher (Every 60 seconds) ────────────
  useEffect(() => {
    if (!sessionUuid || !FEATURES.eventTelemetry) return;

    const flushQueue = async () => {
      // 1. Events flush
      const events = [...eventQueueRef.current];
      if (events.length > 0) {
        const batchId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
        const eventsWithBatch = events.map(e => ({ ...e, batchId }));
        eventQueueRef.current = []; // optimistic clear
        try {
          await logEvents(tournament.id, sessionUuid, eventsWithBatch);
        } catch (err) {
          eventQueueRef.current = [...events, ...eventQueueRef.current];
        }
      }

      // 2. Diagnostics flush
      const diags = [...diagnosticsQueueRef.current];
      if (diags.length > 0) {
        diagnosticsQueueRef.current = []; // optimistic clear
        try {
          await logDiagnostics(tournament.id, sessionUuid, diags);
        } catch (err) {
          diagnosticsQueueRef.current = [...diags, ...diagnosticsQueueRef.current];
        }
      }
    };

    const flushInterval = setInterval(flushQueue, 60000);

    const handleUnload = () => {
      flushQueue();
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      clearInterval(flushInterval);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [sessionUuid, tournament.id]);

  // ── Watch form value changes and trigger debounced autosave ───────────────────
  useEffect(() => {
    if (!sessionUuid || isLockedOut || !FEATURES.draftRecovery) return;

    // Filter default values from checking
    const stringified = JSON.stringify(watchedValues);
    if (!lastSavedPayloadRef.current) {
      lastSavedPayloadRef.current = stringified;
      return;
    }
    if (stringified === lastSavedPayloadRef.current) return;

    isTypingRef.current = true;
    lastActivityTimestampRef.current = Date.now();
    setAutosaveStatus('SAVING');

    const debouncedSave = setTimeout(async () => {
      isTypingRef.current = false;
      
      const currentRev = incrementRevision(tournament.id);
      
      // Parse device info and acquisition params
      const ua = navigator.userAgent;
      let browser = "BR_UNKNOWN";
      let os = "OS_UNKNOWN";
      let deviceType = "DEV_DESKTOP";

      if (/chrome|crios/i.test(ua) && !/edge|edg/i.test(ua)) browser = "BR_CHROME";
      else if (/firefox|iceweasel/i.test(ua)) browser = "BR_FIREFOX";
      else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) browser = "BR_SAFARI";
      else if (/edge|edg/i.test(ua)) browser = "BR_EDGE";

      if (/android/i.test(ua)) {
        os = "OS_ANDROID";
        deviceType = "DEV_MOBILE";
      } else if (/ipad|iphone|ipod/i.test(ua)) {
        os = "OS_IOS";
        deviceType = "DEV_MOBILE";
      } else if (/windows/i.test(ua)) os = "OS_WINDOWS";
      else if (/macintosh|mac os x/i.test(ua)) os = "OS_MAC";
      else if (/linux/i.test(ua)) os = "OS_LINUX";

      const params = new URLSearchParams(window.location.search);
      const utm_source = params.get("utm_source") || "";
      const utm_medium = params.get("utm_medium") || "";
      const utm_campaign = params.get("utm_campaign") || "";

      let referralSource = "REF_UNKNOWN";
      const ref = document.referrer ? new URL(document.referrer).hostname.toLowerCase() : "";
      if (ref.includes("discord")) referralSource = "REF_DISCORD";
      else if (ref.includes("instagram")) referralSource = "REF_INSTAGRAM";
      else if (ref.includes("twitter") || ref.includes("t.co")) referralSource = "REF_TWITTER";
      else if (!ref) referralSource = "REF_DIRECT";

      const startSaveTime = Date.now();

      const savePayload = {
        sessionUuid,
        currentRevision: currentRev,
        expectedRevision: currentRev - 1,
        tournamentId: tournament.id,
        teamName: watchedValues.teamName || '',
        p1IGN: watchedValues.players?.[0]?.ign || '',
        p1Discord: watchedValues.players?.[0]?.discord || '',
        p1Faceit: watchedValues.players?.[0]?.faceit || '',
        p1Steam64: watchedValues.players?.[0]?.steam64 || '',
        country: watchedValues.teamRegion || '',
        currentStep: completionStats.frictionStage,
        lastCompletedStep: completionStats.frictionStage,
        frictionStage: completionStats.frictionStage,
        completedRequiredFieldsCount: completionStats.completedCount,
        totalRequiredFieldsCount: completionStats.totalRequired,
        missingFields: completionStats.missingFields,
        totalPlayersAdded: watchedValues.players?.length || 0,
        activeEditingTime: activeEditingTimeRef.current,
        idleTime: idleTimeRef.current,
        offlineTime: offlineTimeRef.current,
        totalSessionDuration: totalSessionDurationRef.current,
        referralSource,
        utm_source,
        utm_medium,
        utm_campaign,
        draftStatus: 'STATUS_ACTIVE',
        lockOwner: lockOwnerId,
        formData: stringified,
        lookupFailuresCount: lookupFailuresCountRef.current,
        validationFailuresCount: validationFailuresCountRef.current,
        resumeCount: resumeCountRef.current,
        idleCount: idleCountRef.current,
        offlineCount: offlineCountRef.current,
        logoDiagnostics: logoDiagnosticsRef.current,
        schemaVersion: SCHEMA_VERSION
      };

      try {
        const res = await saveDraft(tournament.id, savePayload);
        const duration = Date.now() - startSaveTime;
        
        if (res && res.success) {
          setAutosaveStatus('SAVED');
          const timeString = new Date(res.serverTime || new Date()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          setLastSavedText(`Saved at ${timeString}`);
          lastSavedPayloadRef.current = stringified;
          pushDiagnostic('STATUS_SUCCESS', duration);
        } else {
          pushDiagnostic('STATUS_ERROR', duration, res?.message || 'Lock lease lost or save rejected');
          if (res?.errorCode === 'ERR_LOCK_LOST' || res?.error?.includes('ERR_LOCK_LOST')) {
            setIsLockedOut(true);
            setAutosaveStatus(null);
          } else if (res?.errorCode === 'ERR_REVISION_MISMATCH' || res?.error?.includes('ERR_REVISION_MISMATCH') || String(res?.errorCode) === '409') {
            setIsRevisionConflict(true);
            setAutosaveStatus(null);
          } else {
            setAutosaveStatus('ERROR');
            retryCountRef.current += 1;
          }
        }
      } catch (e) {
        const duration = Date.now() - startSaveTime;
        pushDiagnostic('STATUS_ERROR', duration, e.message);
        setAutosaveStatus('ERROR');
        retryCountRef.current += 1;
      }
    }, SYSTEM_CONFIG.AUTO_SAVE_INTERVAL ? 3000 : 3000); // Debounce save timer (3s)

    return () => clearTimeout(debouncedSave);
  }, [watchedValues, sessionUuid, isLockedOut, tournament.id, lockOwnerId, completionStats]);

  // ── Trigger dynamic duplicate draft check on blur ─────────────────────────
  const handleDuplicateCheck = async () => {
    if (sessionUuid || !FEATURES.duplicateDetection) return;

    const teamName = getValues('teamName');
    const captainDiscord = getValues('players.0.discord');
    const captainSteam = getValues('players.0.steam64');
    const captainFaceit = getValues('players.0.faceit');

    if (!teamName && !captainDiscord && !captainSteam && !captainFaceit) return;

    try {
      const res = await checkDuplicateDrafts(tournament.id, {
        teamName: teamName || '',
        discord: captainDiscord || '',
        steam64: captainSteam || '',
        faceit: captainFaceit || ''
      });

      if (res && res.duplicate && res.session) {
        setDuplicateDraftPrompt({
          sessionUuid: res.session.sessionUuid,
          teamName: res.session.teamName,
          captainName: res.session.captainName,
          confidence: res.confidence
        });
      }
    } catch (e) {
      console.warn("Failed to check duplicate drafts:", e);
    }
  };

  // ── Auto-generate session UUID when user starts typing ──────────────────────
  useEffect(() => {
    if (sessionUuid || !FEATURES.sessionTracking) return;

    const teamName = watchedValues.teamName;
    const captainDiscord = watchedValues.players?.[0]?.discord;
    const logoLink = watchedValues.logoLink;

    if (teamName || captainDiscord || logoLink) {
      const newUuid = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
      setSessionUuid(tournament.id, newUuid);
      setSessionUuidState(newUuid);
      setLockAcquired(true);
      
      // Seed first event log
      const eventId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
      eventQueueRef.current.push({
        eventId,
        requestId: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
        timestamp: new Date().toISOString(),
        frictionStage: completionStats.frictionStage,
        eventType: 'SESSION_STARTED',
        taxonomyVersion: 'v1',
        details: { message: "User began typing form details" }
      });
      
      setAutosaveStatus('SAVING');
    }
  }, [watchedValues, sessionUuid, tournament.id, completionStats]);

  const { fields, append, remove } = useFieldArray({ control, name: 'players' });

  // Substitutes calculations
  const maxSubs = tournament.substitutes?.max ?? 0;
  const currentSubs = fields.length - corePlayerCount;

  const { submit, isSubmitting, error, isSuccess } = useFormSubmit(tournament.id);
  const [submissionId, setSubmissionId] = useState(null);
  const [copiedId, setCopiedId] = useState(false);
  const [dlqItem, setDlqItem] = useState(null);

  // ── Sub handling ────────────────────────────────────────────────────────────
  const handleAddSub = () => {
    if (currentSubs < maxSubs) {
      append(blankPlayer());
    }
  };

  const handleRemoveSub = () => {
    if (currentSubs > 0) {
      remove(fields.length - 1);
    }
  };

  // ── Invite code live validation (side-effect, not Zod) ─────────────────────
  const handleInviteBlur = async (e) => {
    const code = e.target.value.trim();
    if (!code) {
      setInviteStatus('AWAITING INPUT...');
      return;
    }
    setInviteStatus('QUERYING...');
    try {
      const res = await validateInviteCode(tournament.id, code);
      setInviteStatus(res.valid ? 'PRIORITY SLOT' : 'OPEN SLOT');
    } catch {
      setInviteStatus('AWAITING INPUT...');
    }
  };

  // ── Auto-Resolving UI Status Caches ──────────────────────────────────────────
  const [steamStatus, setSteamStatus] = useState({});
  const [faceitStatus, setFaceitStatus] = useState({});
  const [faceitMeta, setFaceitMeta] = useState({});

  const handleSteamBlur = async (index, value) => {
    if (!value) return;

    // Fast-path: if it's a /profiles/STEAMID64 URL, extract directly without any API call
    const profileMatch = value.match(/\/profiles\/([0-9]{17})\/?/);
    if (profileMatch) {
      setValue(`players.${index}.steam64`, profileMatch[1]);
      setSteamStatus((prev) => ({ ...prev, [index]: 'SUCCESS' }));
      return;
    }

    // Vanity /id/ URL — needs Steam API key which isn't available on the frontend
    const vanityMatch = value.match(/\/id\/([^/?#]+)/);
    if (vanityMatch && !tournament.steamApiKey) {
      setSteamStatus((prev) => ({ ...prev, [index]: 'VANITY' }));
      return;
    }

    setSteamStatus((prev) => ({ ...prev, [index]: 'RESOLVING...' }));
    try {
      const steam64 = await resolveSteam64(value, tournament.steamApiKey);
      if (steam64) {
        setValue(`players.${index}.steam64`, steam64);
        setSteamStatus((prev) => ({ ...prev, [index]: 'SUCCESS' }));
      } else {
        setSteamStatus((prev) => ({ ...prev, [index]: 'VANITY' }));
      }
    } catch (err) {
      setSteamStatus((prev) => ({ ...prev, [index]: 'FAILED' }));
    }
  };

  const handleFaceitBlur = async (index, value) => {
    if (!value) return;
    setFaceitStatus((prev) => ({ ...prev, [index]: 'FETCHING...' }));
    try {
      const data = await fetchFaceitProfile(value, tournament.faceitApiKey);
      if (data) {
        setValue(`players.${index}.faceitLevel`, data.faceitLevel?.toString());
        setValue(`players.${index}.faceitElo`, data.faceitElo?.toString());
        setValue(`players.${index}.cs2RankLabel`, data.cs2RankLabel?.toString());

        // Always extract IGN from FACEIT URL as a base fallback
        const urlIgn = value.replace(/\/$/, '').split('/').pop();
        if (urlIgn) setValue(`players.${index}.ign`, urlIgn, { shouldValidate: false });

        if (data.nickname) {
          setValue(`players.${index}.ign`, data.nickname, { shouldValidate: false });
        }
        if (data.avatar) {
          setValue(`players.${index}.avatar`, data.avatar);
        }

        setFaceitMeta((prev) => ({
          ...prev,
          [index]: { source: data._source, fetchedAt: data._fetchedAt }
        }));

        // Auto-populate Steam if blank and Faceit provided it
        if (data.steam64 && !getValues(`players.${index}.steam64`)) {
          setValue(`players.${index}.steam64`, data.steam64);
        }
        setFaceitStatus((prev) => ({ ...prev, [index]: 'SUCCESS' }));
      } else {
        setFaceitStatus((prev) => ({ ...prev, [index]: 'FAILED' }));
        // On API failure, still extract IGN from the URL path
        const urlIgnFail = value.replace(/\/$/, '').split('/').pop();
        if (urlIgnFail) setValue(`players.${index}.ign`, urlIgnFail, { shouldValidate: false });
      }
    } catch (err) {
      setFaceitStatus((prev) => ({ ...prev, [index]: 'FAILED' }));
      // Even on exception, extract IGN from the URL path
      const urlIgn = value.replace(/\/$/, '').split('/').pop();
      if (urlIgn) setValue(`players.${index}.ign`, urlIgn, { shouldValidate: false });
    }
  };

  // ── Mock Pre-Fill Injection (Admin Testing) ──────────────────────────────────
  useEffect(() => {
    const handleMockFill = () => {
      setValue('teamName', 'PIXEL TEST SQUAD', { shouldValidate: true });
      setValue('teamTag', 'TEST', { shouldValidate: true });
      setValue('teamRegion', 'EU', { shouldValidate: true });
      setValue('logoLink', 'https://raw.githubusercontent.com/rpkaul/cs-map-images/main/de_dust2.png', { shouldValidate: true });
      setValue('agreeDiscord', true, { shouldValidate: true });
      setValue('agreeVoice', true, { shouldValidate: true });
      setValue('agreeSchedule', true, { shouldValidate: true });

      const mockProfiles = [
        { ign: "s1mple", steam: "https://steamcommunity.com/id/s1mpleO", faceit: "https://www.faceit.com/en/players/s1mple", discord: "s1mple_test" },
        { ign: "ZywOo", steam: "https://steamcommunity.com/id/ZywOo_test", faceit: "https://www.faceit.com/en/players/ZywOo", discord: "zywoo_test" },
        { ign: "NiKo", steam: "https://steamcommunity.com/profiles/76561197990449419", faceit: "https://www.faceit.com/en/players/NiKo", discord: "niko_test" },
        { ign: "m0NESY", steam: "https://steamcommunity.com/profiles/76561198428588049", faceit: "https://www.faceit.com/en/players/m0NESY", discord: "m0nesy_test" },
        { ign: "donk", steam: "https://steamcommunity.com/id/donk_test", faceit: "https://www.faceit.com/en/players/donk", discord: "donk_test" },
        { ign: "Spinx", steam: "https://steamcommunity.com/id/Spinx_test", faceit: "https://www.faceit.com/en/players/Spinx", discord: "spinx_test" },
        { ign: "apEX", steam: "https://steamcommunity.com/id/apEX_test", faceit: "https://www.faceit.com/en/players/apEX", discord: "apex_test" }
      ];

      fields.forEach((_, idx) => {
        const mock = mockProfiles[idx] || mockProfiles[0];
        setValue(`players.${idx}.ign`, mock.ign, { shouldValidate: true });
        setValue(`players.${idx}.discord`, mock.discord, { shouldValidate: true });
        setValue(`players.${idx}.steam`, mock.steam, { shouldValidate: true });
        setValue(`players.${idx}.faceit`, mock.faceit, { shouldValidate: true });

        handleSteamBlur(idx, mock.steam);
        handleFaceitBlur(idx, mock.faceit);
      });
    };

    window.addEventListener('admin-mock-fill', handleMockFill);
    return () => window.removeEventListener('admin-mock-fill', handleMockFill);
  }); // Omitted dependency array because it captures local hook closures without tearing them down

  // ── Submit (react-hook-form calls this only when schema passes) ─────────────
  const onSubmit = async (formData) => {
    const res = await submit(formData);
    if (res?.success) {
      setSubmissionId(res.submissionId);
      localStorage.removeItem(`pp_dlq_${tournament.id}`); // Clear DLQ on success

      const activeTeamPayload = {
        tournamentId: tournament.id,
        teamName: formData.teamName,
        teamTag: formData.teamTag,
        logo: formData.logoUrl || '',
        submissionId: res.submissionId,
        registeredAt: new Date().toISOString(),
        roster: formData.players.map((p, idx) => ({
          ign: p.ign,
          discord: p.discord,
          avatar: p.avatar || '',
          role: idx === 0 ? 'CAPTAIN' : (idx >= corePlayerCount ? 'SUBSTITUTE' : 'CORE PLAYER')
        }))
      };

      localStorage.setItem(`pp_active_team_${tournament.id}`, JSON.stringify(activeTeamPayload));
      window.dispatchEvent(new CustomEvent('pp-registration-success', { detail: activeTeamPayload }));
    }
  };

  // ─── SUCCESS STATE ────────────────────────────────────────────────────────
  if (isSuccess) {
    const ticketId = submissionId ? `PP-${submissionId.split('-')[0].toUpperCase()}-${submissionId.split('-')[1].toUpperCase()}` : 'PP-UNKNOWN';

    const handleCopy = () => {
      navigator.clipboard.writeText(submissionId || '');
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    };

    return (
      <div className="glass-panel p-8 md:p-16 text-center flex flex-col items-center justify-center min-h-[500px] relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-b from-neon-cyan/5 to-transparent pointer-events-none" />
        <div className="hud-crosshair tl"></div><div className="hud-crosshair tr"></div><div className="hud-crosshair bl"></div><div className="hud-crosshair br"></div>

        <div className="relative mb-8">
          <div className="absolute inset-0 bg-neon-cyan blur-[60px] opacity-20 rounded-full animate-pulse" />
          <CheckCircle2 className="w-24 h-24 text-neon-cyan relative z-10 drop-shadow-[0_0_20px_rgba(0,240,255,0.5)]" />
        </div>

        <div className="space-y-2 mb-10">
          <h2 className="text-5xl md:text-7xl font-black text-white font-heading uppercase tracking-tighter italic leading-none">
            ROSTER SECURED
          </h2>
          <p className="text-zinc-500 font-body text-sm font-bold uppercase tracking-[0.3em]">
            Transmission Received // Entry Serialized
          </p>
        </div>

        <div className="w-full max-w-md bg-black/60 border border-white/10 rounded-lg p-6 mb-10 relative">
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1 font-body">Official Submission ID</span>
              <div className="flex items-center gap-3 bg-zinc-900 border border-white/5 px-4 py-3 rounded group/id cursor-pointer" onClick={handleCopy}>
                <span className="text-xl font-heading text-neon-cyan tracking-[0.2em] font-black">{ticketId}</span>
                {copiedId ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-zinc-600 group-hover/id:text-white transition-colors" />}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full pt-4 border-t border-white/5">
              <div className="text-left">
                <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest block font-body">Team</span>
                <span className="text-sm font-heading text-white uppercase tracking-wider">{getValues('teamName') || 'Squad'}</span>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest block font-body">Timestamp</span>
                <span className="text-sm font-heading text-white uppercase tracking-wider">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 p-3 bg-neon-cyan/5 border border-neon-cyan/20 rounded">
            <p className="text-[10px] text-neon-cyan font-bold uppercase tracking-widest leading-relaxed font-body">
              Save this Submission ID! Use it in the "Track Status" tab to verify player roles, Discord connections, and admin review remarks.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
          <button
            onClick={() => window.location.reload()}
            className="flex-1 py-4 bg-white/5 border border-white/10 text-white font-bold uppercase tracking-widest text-xs hover:bg-white/10 transition-all font-body rounded"
          >
            REGISTER ANOTHER TEAM
          </button>
          <button
            onClick={() => {
              localStorage.setItem(`pp_track_prefill_${tournament.id}`, submissionId);
              window.dispatchEvent(new CustomEvent('pp-switch-tab', { detail: 'track' }));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex-1 py-4 bg-neon-cyan text-black font-bold uppercase tracking-widest text-xs hover:bg-white transition-all font-body rounded shadow-[0_0_20px_rgba(0,240,255,0.3)] flex items-center justify-center gap-2"
          >
            TEAM PORTAL <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  // ─── SECTION 01 — TEAM IDENTITY ──────────────────────────────────────────
  const TeamIdentity = (
    <div className="glass-panel p-0 overflow-hidden group/section">
      <div className="flex items-stretch bg-black/50 border-b border-white/10">
        <div className="bg-neon-purple px-5 flex items-center justify-center font-bold font-heading text-3xl text-white italic group-hover/section:bg-neon-pink transition-colors">
          01
        </div>
        <h2 className="text-3xl text-white font-heading tracking-wider pl-6 py-4 flex-grow italic uppercase">
          Team Identity
        </h2>
        <div className="flex items-center px-6 gap-2 border-l border-white/10 bg-white/5">
          <div className={`w-2 h-2 rounded-full ${!slots ? 'bg-zinc-500 animate-pulse' : slots === 'error' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]'}`}></div>
          <span className="text-[9px] font-black font-body text-zinc-500 uppercase tracking-widest leading-none">
            {!slots ? 'SYNC...' : slots === 'error' ? 'OFFLINE' : 'ONLINE'}
          </span>
        </div>
      </div>

      <div className="p-8 space-y-6">
        {/* Invite Code */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-neon-pink font-body">
              Invite Code (Optional — unlocks priority slot)
            </label>
            <span
              className={`text-[10px] font-bold uppercase font-body transition-colors ${inviteStatus === 'PRIORITY SLOT'
                ? 'text-neon-cyan'
                : inviteStatus === 'QUERYING...'
                  ? 'text-yellow-400 animate-pulse'
                  : 'text-zinc-500'
                }`}
            >
              {inviteStatus}
            </span>
          </div>
          <div className="input-group relative">
            <div className="absolute -left-4 top-0 w-1 h-full bg-neon-pink shadow-[0_0_10px_rgba(240,0,255,0.5)]" />
            <Key className="ml-3 w-4 h-4 text-white/30" />
            <input
              {...register('inviteCode')}
              onBlur={handleInviteBlur}
              type="text"
              placeholder="Leave blank if none"
              className="input-ghost"
            />
          </div>
        </div>

        {/* Team Name */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2 block font-body">
            Team Name <span className="text-red-500">*</span>
          </label>
          <div className="input-group">
            <Users className="ml-3 w-4 h-4 text-white/30" />
            <input
              {...register('teamName')}
              onBlur={(e) => {
                register('teamName').onBlur(e);
                handleDuplicateCheck();
              }}
              type="text"
              placeholder="e.g. Natus Vincere"
              className="input-ghost text-lg"
            />
          </div>
          {errors.teamName && (
            <p className="text-red-400 text-[10px] mt-1 font-body uppercase tracking-widest">
              {errors.teamName.message}
            </p>
          )}
        </div>

        {/* Team Tag + Region */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2 block font-body">
              Team Tag <span className="text-red-500">*</span>
            </label>
            <div className="input-group">
              <Tag className="ml-3 w-4 h-4 text-white/30" />
              <input
                {...register('teamTag')}
                type="text"
                placeholder="e.g. CHAO"
                maxLength={8}
                className="input-ghost"
              />
            </div>
            {errors.teamTag && (
              <p className="text-red-400 text-[10px] mt-1 font-body uppercase tracking-widest">
                {errors.teamTag.message}
              </p>
            )}
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2 block font-body">
              Server Region <span className="text-red-500">*</span>
            </label>
            <div className="input-group">
              <Globe className="ml-3 w-4 h-4 text-white/30" />
              <select
                {...register('teamRegion')}
                className="input-ghost appearance-none cursor-pointer"
              >
                <option value="" disabled>Select Region...</option>

                <option value="IND" className="bg-black">India (IND)</option>
                <option value="PAK" className="bg-black">Pakistan (PAK)</option>
                <option value="AFG" className="bg-black">Afghanistan (AFG)</option>
                <option value="BGD" className="bg-black">Bangladesh (BGD)</option>
                <option value="LKA" className="bg-black">Sri Lanka (LKA)</option>
                <option value="NPL" className="bg-black">Nepal (NPL)</option>

                <option value="ARE" className="bg-black">United Arab Emirates (ARE)</option>
                <option value="SAU" className="bg-black">Saudi Arabia (SAU)</option>
                <option value="QAT" className="bg-black">Qatar (QAT)</option>
                <option value="BHR" className="bg-black">Bahrain (BHR)</option>
                <option value="KWT" className="bg-black">Kuwait (KWT)</option>
                <option value="OMN" className="bg-black">Oman (OMN)</option>
                <option value="TUR" className="bg-black">Turkey (TUR)</option>

                <option value="SGP" className="bg-black">Singapore (SGP)</option>
                <option value="MYS" className="bg-black">Malaysia (MYS)</option>
                <option value="THA" className="bg-black">Thailand (THA)</option>
                <option value="IDN" className="bg-black">Indonesia (IDN)</option>
                <option value="PHL" className="bg-black">Philippines (PHL)</option>
                <option value="VNM" className="bg-black">Vietnam (VNM)</option>

              </select>
            </div>
            {errors.teamRegion && (
              <p className="text-red-400 text-[10px] mt-1 font-body uppercase tracking-widest">
                {errors.teamRegion.message}
              </p>
            )}
          </div>
        </div>
        {/* Logo Upload Component */}
        <LogoUploader
          tournament={tournament}
          formRegister={register}
          errorMessage={errors.logoLink?.message}
          teamName={getValues('teamName') || 'team'}
          onUploadStart={(file) => {
            logoDiagnosticsRef.current.startTime = Date.now();
            logoDiagnosticsRef.current.fileSize = file.size;
            pushTelemetryEvent('UPLOAD_STARTED', completionStats.frictionStage, { fileName: file.name, fileSize: file.size });
          }}
          onUploadSuccess={(url, file) => {
            const duration = Date.now() - logoDiagnosticsRef.current.startTime;
            logoDiagnosticsRef.current.uploadDuration = duration;
            logoDiagnosticsRef.current.failureReason = '';
            logoDiagnosticsRef.current.compression = file.type || 'COMP_NONE';
            
            setValue('logoLink', url, { shouldValidate: true });
            
            pushTelemetryEvent('UPLOAD_COMPLETED', completionStats.frictionStage, { 
              durationMs: duration,
              fileSize: file.size,
              logoUrl: url
            });
            isTypingRef.current = false;
            lastActivityTimestampRef.current = Date.now();
          }}
          onUploadError={(err, file) => {
            logoDiagnosticsRef.current.failureReason = err.message || 'Unknown Upload Error';
            logoDiagnosticsRef.current.retryCount += 1;
            
            pushTelemetryEvent('UPLOAD_FAILED', completionStats.frictionStage, {
              error: err.message,
              fileName: file.name
            });
          }}
          onUploadRemove={() => {
            logoDiagnosticsRef.current = {
              fileSize: 0,
              dimensions: '',
              compression: '',
              uploadDuration: 0,
              failureReason: '',
              retryCount: 0
            };
            setValue('logoLink', '', { shouldValidate: true });
            pushTelemetryEvent('LOGO_REMOVED', completionStats.frictionStage);
          }}
        />
      </div>
    </div>
  );

  // ─── SECTION 02 — TEAM ROSTER ─────────────────────────────────────────────
  const TeamRoster = (
    <div className="glass-panel p-0 overflow-hidden group/section">
      <div className="flex items-stretch justify-between bg-black/50 border-b border-white/10 pr-6">
        <div className="flex items-stretch">
          <div className="bg-neon-cyan px-5 flex items-center justify-center font-bold font-heading text-3xl text-black italic group-hover/section:bg-white transition-colors">
            02
          </div>
          <h2 className="text-3xl text-white font-heading tracking-wider pl-6 py-4 italic uppercase">
            Team Roster
          </h2>
        </div>

        {hasSubs && (
          <div className="flex items-center gap-2 my-auto select-none bg-neon-purple/10 border border-neon-purple/35 rounded p-1.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400 font-body px-2">
              Subs ({currentSubs}/{maxSubs})
            </span>
            <button
              type="button"
              disabled={currentSubs === 0}
              onClick={handleRemoveSub}
              className="w-8 h-8 flex items-center justify-center bg-black/40 border border-white/10 hover:border-red-500/50 hover:text-red-400 disabled:opacity-30 disabled:hover:border-white/10 disabled:hover:text-zinc-500 rounded font-bold text-base leading-none transition-colors cursor-pointer select-none"
            >
              -
            </button>
            <button
              type="button"
              disabled={currentSubs === maxSubs}
              onClick={handleAddSub}
              className="w-8 h-8 flex items-center justify-center bg-black/40 border border-white/10 hover:border-neon-cyan/50 hover:text-neon-cyan disabled:opacity-30 disabled:hover:border-white/10 disabled:hover:text-zinc-500 rounded font-bold text-base leading-none transition-colors cursor-pointer select-none"
            >
              +
            </button>
          </div>
        )}
      </div>

      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {fields.map((field, index) => {
            const meta = getPlayerMeta(index, corePlayerCount);

            return (
              <div
                key={field.id}
                className="cyber-card p-6 relative overflow-hidden group"
              >
                {/* HUD Corner Accents */}
                <div className="hud-crosshair tl opacity-30 group-hover:opacity-100 transition-opacity" />
                <div className="hud-crosshair tr opacity-30 group-hover:opacity-100 transition-opacity" />
                <div className="hud-crosshair bl opacity-30 group-hover:opacity-100 transition-opacity" />
                <div className="hud-crosshair br opacity-30 group-hover:opacity-100 transition-opacity" />

                {/* Accent line */}
                <div className={`absolute top-0 left-0 w-full h-[3px] opacity-70 ${meta.lineClass}`} />

                {/* Card header */}
                <div className="flex justify-between items-center mb-5 border-b border-white/10 pb-3">
                  <div className="flex items-center gap-3">
                    {getValues(`players.${index}.avatar`) ? (
                      <img
                        src={getValues(`players.${index}.avatar`)}
                        alt="Player Avatar"
                        className="w-8 h-8 rounded-full border border-white/10 object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] text-zinc-600 font-bold uppercase">
                        P{index + 1}
                      </div>
                    )}
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 font-body">
                      Player {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${meta.dotClass} animate-pulse`} />
                    <span className={`text-xs font-bold uppercase tracking-widest font-body ${meta.textClass}`}>
                      {meta.title}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* IGN */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1.5 block font-body">
                      In-Game Name (IGN) <span className="text-red-500">*</span>
                    </label>
                    <div className="input-group">
                      <Users className="ml-3 w-4 h-4 text-white/30" />
                      <input
                        {...register(`players.${index}.ign`)}
                        type="text"
                        placeholder="e.g. s1mple"
                        className="input-ghost text-xs"
                      />
                    </div>
                  </div>

                  {/* Discord */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1.5 block font-body">
                      Discord Username <span className="text-red-500">*</span>
                    </label>
                    <div className="input-group">
                      <MessageSquare className="ml-3 w-4 h-4 text-white/30" />
                      <input
                        {...register(`players.${index}.discord`)}
                        onBlur={(e) => {
                          register(`players.${index}.discord`).onBlur(e);
                          if (index === 0) handleDuplicateCheck();
                        }}
                        type="text"
                        placeholder="username (no #0000)"
                        className="input-ghost text-xs"
                      />
                    </div>
                    <p className="text-zinc-500 text-[9px] mt-1 font-body">Exact username, no display names.</p>
                    {errors.players?.[index]?.discord && (
                      <p className="text-red-400 text-[10px] mt-1 font-body">{errors.players[index].discord.message}</p>
                    )}
                  </div>

                  {/* Steam URL */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1.5 block font-body">
                      Steam Profile URL <span className="text-red-500">*</span>
                    </label>
                    <div className="input-group">
                      <Gamepad2 className="ml-3 w-4 h-4 text-white/30" />
                      <input
                        {...register(`players.${index}.steam`)}
                        type="url"
                        placeholder="https://steamcommunity.com/profiles/76561198..."
                        className="input-ghost text-xs"
                        onBlur={(e) => {
                          handleSteamBlur(index, e.target.value);
                          if (index === 0) handleDuplicateCheck();
                        }}
                      />
                    </div>
                    <input
                      {...register(`players.${index}.steam64`)}
                      type="hidden"
                    />
                  </div>

                  {/* FACEIT URL */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1.5 block font-body">
                      FACEIT Profile URL <span className="text-red-500">*</span>
                    </label>
                    <div className="input-group">
                      <Crosshair className="ml-3 w-4 h-4 text-white/30" />
                      <input
                        {...register(`players.${index}.faceit`)}
                        type="url"
                        placeholder="https://www.faceit.com/en/players/yourname"
                        className="input-ghost text-xs"
                        onBlur={(e) => {
                          handleFaceitBlur(index, e.target.value);
                          if (index === 0) handleDuplicateCheck();
                        }}
                      />
                    </div>
                    {faceitMeta[index]?.source === 'csgo' && (
                      <p className="text-yellow-500 text-[9px] mt-1.5 font-bold uppercase tracking-wider font-body">
                        ⚠ Legacy CS:GO data detected. Ensure your CS2 profile is linked to avoid seeding errors.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const FormSubmitSection = (
    <div className="glass-panel p-6 flex flex-col gap-6">
      {/* Roster Verification & Agreements */}
      <div className="space-y-3">
        <span className="text-[10px] font-black font-body text-neon-pink uppercase tracking-widest block mb-1">
          Acknowledge & Confirm Roster Rules:
        </span>

        <label className="flex items-start gap-4 p-3 bg-black/60 border border-white/5 hover:border-white/15 rounded-sm cursor-pointer transition-all">
          <input
            type="checkbox"
            {...register('agreeDiscord')}
            className="mt-0.5 w-5 h-5 accent-neon-cyan flex-shrink-0 cursor-pointer"
          />
          <span className="text-xs text-zinc-400 leading-relaxed font-body">
            <strong className="text-white uppercase tracking-wider block mb-0.5">DISCORD PRESENCE</strong>
            All players must be in the Discord server before match start.
          </span>
        </label>
        {errors.agreeDiscord && (
          <p className="text-red-400 text-[10px] font-body uppercase tracking-widest">{errors.agreeDiscord.message}</p>
        )}

        <label className="flex items-start gap-4 p-3 bg-black/60 border border-white/5 hover:border-white/15 rounded-sm cursor-pointer transition-all">
          <input
            type="checkbox"
            {...register('agreeVoice')}
            className="mt-0.5 w-5 h-5 accent-neon-cyan flex-shrink-0 cursor-pointer"
          />
          <span className="text-xs text-zinc-400 leading-relaxed font-body">
            <strong className="text-white uppercase tracking-wider block mb-0.5">VOICE COMMS</strong>
            All players confirm to join Pixel Voice Channels during matches.
          </span>
        </label>
        {errors.agreeVoice && (
          <p className="text-red-400 text-[10px] font-body uppercase tracking-widest">{errors.agreeVoice.message}</p>
        )}

        <label className="flex items-start gap-4 p-3 bg-black/60 border border-white/5 hover:border-white/15 rounded-sm cursor-pointer transition-all">
          <input
            type="checkbox"
            {...register('agreeSchedule')}
            className="mt-0.5 w-5 h-5 accent-neon-cyan flex-shrink-0 cursor-pointer"
          />
          <span className="text-xs text-zinc-400 leading-relaxed font-body">
            <strong className="text-white uppercase tracking-wider block mb-0.5">SCHEDULE</strong>
            We confirm availability for the deadline and all tournament dates.
          </span>
        </label>
        {errors.agreeSchedule && (
          <p className="text-red-400 text-[10px] font-body uppercase tracking-widest">{errors.agreeSchedule.message}</p>
        )}
      </div>

      {error && (
        <div className={`border p-6 flex flex-col items-center gap-4 animate-in zoom-in duration-300 shadow-2xl ${error.includes('PLAYER_BANNED') ? 'bg-orange-500/10 border-orange-500 text-orange-400 shadow-orange-500/20' : 'bg-red-500/10 border-red-500 text-red-400 shadow-red-500/20'}`}>
          <div className="flex items-center gap-3">
            <AlertOctagon className="w-6 h-6 flex-shrink-0" />
            <span className="text-xs font-black uppercase tracking-[0.2em] leading-none">
              {error.includes('PLAYER_BANNED') ? 'ELIGIBILITY RESTRICTED' : 'TRANSMISSION FAILED'}
            </span>
          </div>

          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-center max-w-sm leading-relaxed opacity-90 font-body">
            {error.replace('PLAYER_BANNED: ', '')}
          </p>

          {error.includes('PLAYER_BANNED') ? (
            <a
              href="https://discord.com/invite/pixelpalacee"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 px-6 py-3 bg-orange-500 text-black font-black text-[10px] uppercase tracking-widest hover:bg-white transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              OPEN SUPPORT TICKET (APPEAL) <ExternalLink className="w-3 h-3" />
            </a>
          ) : (
            <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest opacity-50">Please verify your connection and try again.</span>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-ignite w-full flex justify-center items-center h-[72px]"
      >
        {isSubmitting ? (
          <span className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin" />
            TRANSMITTING...
          </span>
        ) : (
          <span>SUBMIT REGISTRATION</span>
        )}
      </button>

      {/* Autosave Status HUD */}
      {FEATURES.draftRecovery && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-black/40 border border-white/5 rounded mt-2 select-none">
          <div className="flex items-center gap-2">
            <Activity className={`w-3.5 h-3.5 ${autosaveStatus === 'SAVING' ? 'text-yellow-400 animate-spin' : autosaveStatus === 'ERROR' ? 'text-red-500 animate-pulse' : 'text-neon-cyan'}`} />
            <span className="text-[9px] font-black font-body text-zinc-500 uppercase tracking-widest">
              {autosaveStatus === 'SAVING' ? 'AUTOSAVING TELEMETRY...' : 
               autosaveStatus === 'SAVED_OFFLINE' ? 'OFFLINE (AUTOSAVED LOCALLY)' :
               autosaveStatus === 'ERROR' ? 'UPLINK ERROR' : 'AUTOSAVE ACTIVE'}
            </span>
          </div>
          {lastSavedText && (
            <span className="text-[9px] font-bold text-zinc-400 font-body uppercase">
              {lastSavedText}
            </span>
          )}
        </div>
      )}
    </div>
  );

  // ─── FORM ROOT ────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-8 pb-20">
      {dlqItem && !draftRestored && (
        <div className="glass-panel p-5 bg-orange-500/10 border border-orange-500/30 flex items-center justify-between gap-4 animate-in slide-in-from-top duration-700">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-orange-500/20 rounded">
              <ShieldAlert className="w-5 h-5 text-orange-400 animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black text-orange-400 uppercase tracking-widest leading-none">Unsent Registration Detected</span>
              <span className="text-[10px] text-zinc-400 font-body uppercase mt-1">Found unsent data for "{dlqItem.teamName}" from {new Date(dlqItem.timestamp).toLocaleDateString()}.</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { localStorage.removeItem(`pp_dlq_${tournament.id}`); setDlqItem(null); }}
              className="text-[9px] font-bold text-zinc-600 hover:text-white uppercase tracking-widest transition-colors font-body px-3"
            >
              DISCARD
            </button>
            <button
              type="button"
              onClick={() => { reset(dlqItem.formData); setDlqItem(null); setDraftRestored(true); }}
              className="bg-orange-500 text-black px-4 py-2 text-[9px] font-black uppercase tracking-widest hover:bg-white transition-all transform hover:scale-105"
            >
              RESTORE & RETRY
            </button>
          </div>
        </div>
      )}

      {isLockedOut && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-6">
          <div className="glass-panel p-8 max-w-md text-center border-red-500/50 flex flex-col items-center gap-6 relative">
            <div className="hud-crosshair tl" /><div className="hud-crosshair tr" /><div className="hud-crosshair bl" /><div className="hud-crosshair br" />
            <Lock className="w-16 h-16 text-red-500 animate-pulse drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white font-heading tracking-wider uppercase italic">SESSION LOCKED OUT</h3>
              <p className="text-xs text-zinc-400 font-body uppercase leading-relaxed">
                This registration session is currently active in another browser tab or window. Lock lease could not be acquired.
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full h-12 bg-red-500 hover:bg-white text-black font-black text-xs uppercase tracking-widest transition-all cursor-pointer"
            >
              Reload Page
            </button>
          </div>
        </div>
      )}

      {isRevisionConflict && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-6">
          <div className="glass-panel p-8 max-w-md text-center border-red-500/50 flex flex-col items-center gap-6 relative">
            <div className="hud-crosshair tl" /><div className="hud-crosshair tr" /><div className="hud-crosshair bl" /><div className="hud-crosshair br" />
            <AlertTriangle className="w-16 h-16 text-yellow-500 animate-pulse drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" />
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white font-heading tracking-wider uppercase italic">CONCURRENCY CONFLICT</h3>
              <p className="text-xs text-zinc-400 font-body uppercase leading-relaxed">
                This draft session has been updated in another tab or window. To prevent overwriting newer changes, this tab has been paused.
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full h-12 bg-yellow-500 hover:bg-white text-black font-black text-xs uppercase tracking-widest transition-all cursor-pointer"
            >
              Restore Latest Draft
            </button>
          </div>
        </div>
      )}

      {draftRestorePrompt && (
        <div className="fixed inset-0 z-[9998] flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm p-6">
          <div className="glass-panel p-8 max-w-md text-center border-neon-cyan/50 flex flex-col items-center gap-6 relative">
            <div className="hud-crosshair tl" /><div className="hud-crosshair tr" /><div className="hud-crosshair bl" /><div className="hud-crosshair br" />
            <Zap className="w-16 h-16 text-neon-cyan animate-pulse drop-shadow-[0_0_15px_rgba(0,240,255,0.5)]" />
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white font-heading tracking-wider uppercase italic">RESUME REGISTRATION?</h3>
              <p className="text-xs text-zinc-400 font-body uppercase leading-relaxed">
                We found an incomplete draft for "{draftRestorePrompt.formData ? JSON.parse(draftRestorePrompt.formData).teamName || 'Your Team' : 'Your Team'}". Would you like to continue?
              </p>
              {draftRestorePrompt.ageText && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded mt-2 text-left flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <span className="text-[10px] text-yellow-400 font-body uppercase leading-normal">
                    {draftRestorePrompt.ageText}
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-4 w-full">
              <button
                type="button"
                onClick={() => {
                  clearSessionUuid(tournament.id);
                  clearRevision(tournament.id);
                  setDraftRestorePrompt(null);
                  pushTelemetryEvent('SESSION_STARTED', completionStats.frictionStage, { action: 'START_NEW' });
                }}
                className="flex-1 h-12 border border-zinc-700 text-zinc-400 hover:text-white font-bold text-xs uppercase tracking-widest transition-all cursor-pointer"
              >
                Start New
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    const parsed = JSON.parse(draftRestorePrompt.formData);
                    const migrated = migrateDraft(parsed, draftRestorePrompt.schemaVersion);
                    reset(migrated);
                    setSessionUuidState(draftRestorePrompt.sessionUuid);
                    setLockAcquired(true);
                    resumeCountRef.current += 1;
                    
                    setAutosaveStatus('SAVED');
                    setLastSavedText('Draft restored');
                    setDraftRestorePrompt(null);
                    setDraftRestored(true);
                    
                    pushTelemetryEvent('SESSION_RESUMED', completionStats.frictionStage, { revision: getRevision(tournament.id) });
                  } catch (e) {
                    console.error("Failed to restore draft form data:", e);
                    setDraftRestorePrompt(null);
                  }
                }}
                className="flex-1 h-12 bg-neon-cyan hover:bg-white text-black font-black text-xs uppercase tracking-widest transition-all cursor-pointer shadow-[0_0_15px_rgba(0,240,255,0.3)] hover:shadow-none"
              >
                Resume Draft
              </button>
            </div>
          </div>
        </div>
      )}

      {duplicateDraftPrompt && (
        <div className="fixed inset-0 z-[9998] flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm p-6">
          <div className="glass-panel p-8 max-w-md text-center border-neon-pink/50 flex flex-col items-center gap-6 relative">
            <div className="hud-crosshair tl" /><div className="hud-crosshair tr" /><div className="hud-crosshair bl" /><div className="hud-crosshair br" />
            <AlertTriangle className="w-16 h-16 text-neon-pink animate-pulse drop-shadow-[0_0_15px_rgba(240,0,255,0.5)]" />
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white font-heading tracking-wider uppercase italic">DRAFT FOUND</h3>
              <p className="text-xs text-zinc-400 font-body uppercase leading-relaxed">
                An active registration session exists for team "{duplicateDraftPrompt.teamName}" (Captain: {duplicateDraftPrompt.captainName || 'Unknown'}) with {duplicateDraftPrompt.confidence}% match.
              </p>
            </div>
            <div className="flex gap-4 w-full">
              <button
                type="button"
                onClick={() => {
                  setDuplicateDraftPrompt(null);
                }}
                className="flex-1 h-12 border border-zinc-700 text-zinc-400 hover:text-white font-bold text-xs uppercase tracking-widest transition-all cursor-pointer"
              >
                Keep Current
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const matchedSessionUuid = duplicateDraftPrompt.sessionUuid;
                    const res = await getDraft(tournament.id, matchedSessionUuid);
                    if (res?.success && res.draft) {
                      const draftData = res.draft;
                      const migrated = migrateDraft(draftData.formData, draftData.schemaVersion);
                      reset(migrated);
                      setSessionUuid(tournament.id, matchedSessionUuid);
                      setSessionUuidState(matchedSessionUuid);
                      setLockAcquired(true);
                      
                      resumeCountRef.current += 1;
                      setAutosaveStatus('SAVED');
                      setLastSavedText('Draft restored');
                      setDuplicateDraftPrompt(null);
                      setDraftRestored(true);
                      
                      pushTelemetryEvent('SESSION_RESUMED', completionStats.frictionStage, { source: 'DUPLICATE_CHECK_RESUME' });
                    }
                  } catch (e) {
                    console.error("Failed to load duplicate draft:", e);
                    setDuplicateDraftPrompt(null);
                  }
                }}
                className="flex-1 h-12 bg-neon-pink hover:bg-white text-black font-black text-xs uppercase tracking-widest transition-all cursor-pointer shadow-[0_0_15px_rgba(240,0,255,0.3)] hover:shadow-none"
              >
                Load Draft
              </button>
            </div>
          </div>
        </div>
      )}

      {draftRestored && (
        <div className="glass-panel p-4 bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-between gap-4 animate-in slide-in-from-top duration-500">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-neon-cyan animate-pulse" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-neon-cyan uppercase tracking-widest leading-none">DRAFT RECOVERED</span>
              <span className="text-[10px] text-zinc-400 font-body uppercase mt-1">We saved your previous attempt. Review and resubmit.</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { setDraftRestored(false); }}
            className="text-[9px] font-bold text-zinc-600 hover:text-white uppercase tracking-widest transition-colors font-body p-2 cursor-pointer"
          >
            DISMISS
          </button>
        </div>
      )}
      {TeamIdentity}
      {TeamRoster}
      {FormSubmitSection}
    </form>
  );
};
