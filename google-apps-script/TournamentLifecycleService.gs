/**
 * =============================================================================
 *  PIXEL PALACE — TOURNAMENT LIFECYCLE SERVICE (v3.0)
 * =============================================================================
 */

const RegistrationMessages = {
  'OPEN': {
    title: "Registration Active",
    subtitle: "Secure your place before registrations close.",
    cta: "Register Your Team",
    icon: "shield-check",
    severity: "info"
  },
  'SLOT_LIMIT_REACHED': {
    title: "Tournament Full",
    subtitle: "All available team slots have been filled.",
    cta: "View Registered Teams",
    icon: "alert-octagon",
    severity: "warning"
  },
  'REGISTRATION_DEADLINE': {
    title: "Registrations Closed",
    subtitle: "The registration deadline has passed.",
    cta: "View Brackets",
    icon: "lock",
    severity: "error"
  },
  'ADMIN_ACTION': {
    title: "Registrations Closed",
    subtitle: "Registration is closed by tournament administrator.",
    cta: "View Details",
    icon: "lock",
    severity: "error"
  },
  'TOURNAMENT_ARCHIVED': {
    title: "Season Concluded",
    subtitle: "This event has ended and is archived.",
    cta: "View Results",
    icon: "trophy",
    severity: "info"
  },
  'EMERGENCY_LOCK': {
    title: "Registrations Suspended",
    subtitle: "Registration is temporarily locked by staff.",
    cta: "Try Again Later",
    icon: "lock",
    severity: "error"
  },
  'MAINTENANCE': {
    title: "System Maintenance",
    subtitle: "Registration is temporarily closed for systems update.",
    cta: "Try Again Later",
    icon: "alert-triangle",
    severity: "warning"
  }
};

const TournamentLifecycleService = {
  /**
   * Calculates the current authoritative tournament and registration states dynamically.
   */
  calculate: function(tournamentId, config) {
    const teams = this.getApprovedTeamsLive_(tournamentId, config);
    
    // Derived Counts
    const confirmedCount = teams.filter(t => t.status === "APPROVED" || t.status === "ROSTER_LOCKED" || t.status === "VERIFIED" || t.status === "CHAMPION").length;
    const pendingCount = teams.filter(t => t.status === "PENDING" || t.status === "UNDER REVIEW" || t.status === "OBJECTION").length;
    const rejectedCount = teams.filter(t => t.status === "REJECTED" || t.status === "DISQUALIFIED").length;
    const withdrawnCount = teams.filter(t => t.status === "WITHDRAWN" || t.status === "WITHDRAW").length;
    
    const maxTeams = parseInt(config.maxteams || 32);
    const inviteMax = parseInt(config.inviteslots || 6);
    const publicMax = Math.max(0, maxTeams - inviteMax);
    
    // Exclude rejected/withdrawn from slots usage
    const activeTeams = teams.filter(t => t.status !== "REJECTED" && t.status !== "DISQUALIFIED" && t.status !== "WITHDRAWN" && t.status !== "WITHDRAW");
    
    // Cross-reference MASTER_RAW_REGISTRATIONS to check invite code usage
    let inviteUsed = 0;
    try {
      const rawData = DatabaseAdapter.getRawRegistrations();
      if (rawData.length > 1) {
        const headers = rawData[0].map(h => h.toString().toLowerCase().trim());
        const nameIdx = headers.indexOf("team name");
        const inviteIdx = headers.indexOf("vip code used");
        
        const activeNames = new Set(activeTeams.map(t => t.name.trim().toUpperCase()));
        
        for (let i = 1; i < rawData.length; i++) {
          const rawName = (rawData[i][nameIdx] || "").toString().trim().toUpperCase();
          if (activeNames.has(rawName)) {
            const inviteCode = (rawData[i][inviteIdx] || "").toString().trim();
            if (inviteCode) {
              inviteUsed++;
            }
          }
        }
      }
    } catch (e) {
      Logger.log("[Lifecycle] Failed to calculate invite used slots: " + e);
    }
    
    // Bound inviteUsed to inviteMax
    inviteUsed = Math.min(inviteUsed, inviteMax);
    const publicUsed = Math.max(0, activeTeams.length - inviteUsed);
    
    const remainingSlots = Math.max(0, maxTeams - activeTeams.length);
    const isFull = remainingSlots <= 0;
    
    // 1. Phase Engine
    const phase = config.currentphase ? config.currentphase.toUpperCase().replace(/\s+/g, "_") : "REGISTRATION";
    
    // 2. Rule Engine: Priority Order State Derivation
    let status = "OPEN";
    let closedReason = null;
    let triggeredBy = null;
    
    const isArchived = phase === "ARCHIVED";
    const isManualClosed = phase === "REGISTRATION_CLOSED";
    const isEmergencyLocked = (config.emergencylock === true || config.emergencylock === "TRUE");
    const isMaintenance = (config.maintenance === true || config.maintenance === "TRUE");
    
    // Deadline check
    const deadlineStr = config.registrationdeadline || (tournamentId === "chaos-ii" ? "2026-04-18T23:59:00+05:00" : "2026-07-26T23:59:00+05:00");
    let deadlinePassed = false;
    if (deadlineStr && deadlineStr !== "TBD") {
      const deadline = new Date(deadlineStr).getTime();
      if (Date.now() >= deadline) {
        deadlinePassed = true;
      }
    }
    
    // Evaluate in priority order
    if (isArchived) {
      status = "ARCHIVED";
      closedReason = "TOURNAMENT_ARCHIVED";
      triggeredBy = "SYSTEM";
    } else if (isEmergencyLocked) {
      status = "CLOSED";
      closedReason = "EMERGENCY_LOCK";
      triggeredBy = "ADMIN";
    } else if (isManualClosed) {
      status = "CLOSED";
      closedReason = "ADMIN_ACTION";
      triggeredBy = "ADMIN";
    } else if (isMaintenance) {
      status = "CLOSED";
      closedReason = "MAINTENANCE";
      triggeredBy = "ADMIN";
    } else if (deadlinePassed) {
      status = "CLOSED";
      closedReason = "REGISTRATION_DEADLINE";
      triggeredBy = "SYSTEM";
    } else if (isFull) {
      status = "CLOSED";
      closedReason = "SLOT_LIMIT_REACHED";
      triggeredBy = "SYSTEM";
    }
    
    const isAcceptingRegistrations = (status === "OPEN");
    
    // Expose Dynamic Messages
    const msgKey = closedReason || status;
    const msg = RegistrationMessages[msgKey] || RegistrationMessages['OPEN'];
    
    // Expose FSM Version and Last Transition
    const properties = PropertiesService.getScriptProperties();
    let version = parseInt(properties.getProperty("fsm_version_" + tournamentId)) || 1;
    let lastTransitionJson = properties.getProperty("fsm_last_transition_" + tournamentId);
    let lastTransition = lastTransitionJson ? JSON.parse(lastTransitionJson) : null;
    
    // Recalculate and trigger transition audit if status changed
    if (lastTransition && lastTransition.to !== status) {
      this.transition(tournamentId, config, lastTransition.to, status, closedReason, triggeredBy || "SYSTEM");
      // Reload version and lastTransition after transition execution
      version = parseInt(properties.getProperty("fsm_version_" + tournamentId)) || version;
      lastTransition = JSON.parse(properties.getProperty("fsm_last_transition_" + tournamentId));
    } else if (!lastTransition) {
      // Initialize first transition state
      const initialTransition = {
        from: "UNKNOWN",
        to: status,
        reason: closedReason || "INITIALIZATION",
        timestamp: new Date().toISOString(),
        transitionId: "REG-" + Utilities.getUuid().substring(0, 8).toUpperCase()
      };
      properties.setProperty("fsm_last_transition_" + tournamentId, JSON.stringify(initialTransition));
      properties.setProperty("fsm_version_" + tournamentId, "1");
      lastTransition = initialTransition;
    }
    
    return {
      phase: phase,
      registration: {
        status: status,
        isAcceptingRegistrations: isAcceptingRegistrations,
        closedAt: (status === "CLOSED" || status === "ARCHIVED") ? (lastTransition ? lastTransition.timestamp : new Date().toISOString()) : null,
        closedReason: closedReason,
        triggeredBy: triggeredBy,
        remainingSlots: remainingSlots,
        registrationDeadline: deadlineStr,
        serverTime: new Date().toISOString(),
        version: version,
        title: msg.title,
        subtitle: msg.subtitle,
        cta: msg.cta,
        icon: msg.icon,
        severity: msg.severity,
        lastTransition: lastTransition,
        waitlist: {
          enabled: (config.waitlistenabled === true || config.waitlistenabled === "TRUE"),
          status: (config.waitlistenabled === true || config.waitlistenabled === "TRUE") ? "ACTIVE" : "INACTIVE",
          position: 0,
          available: 0
        }
      },
      capacity: {
        total: maxTeams,
        public: publicMax,
        invite: inviteMax,
        remaining: remainingSlots,
        percentage: parseFloat(((activeTeams.length / maxTeams) * 100).toFixed(2))
      },
      registrationPools: {
        public: {
          max: publicMax,
          used: publicUsed,
          remaining: Math.max(0, publicMax - publicUsed)
        },
        invite: {
          max: inviteMax,
          used: inviteUsed,
          remaining: Math.max(0, inviteMax - inviteUsed)
        }
      },
      analytics: {
        confirmedTeams: confirmedCount,
        pendingTeams: pendingCount,
        rejectedTeams: rejectedCount,
        withdrawnTeams: withdrawnCount,
        inviteUsed: inviteUsed,
        publicUsed: publicUsed
      }
    };
  },

  /**
   * Gates a submission payload to ensure registration is open and accepting submissions.
   */
  validateSubmission: function(tournamentId, config) {
    const state = this.calculate(tournamentId, config);
    if (!state.registration.isAcceptingRegistrations) {
      throw new Error("Registration closed. Reason: " + (state.registration.closedReason || "Registration is not active."));
    }
    return true;
  },

  /**
   * Forces state FSM transitions, increments version tracking, and logs audits.
   */
  transition: function(tournamentId, config, fromState, toState, reason, actor) {
    const properties = PropertiesService.getScriptProperties();
    const currentVer = parseInt(properties.getProperty("fsm_version_" + tournamentId)) || 1;
    const nextVer = currentVer + 1;
    const transitionId = "REG-" + Utilities.getUuid().substring(0, 8).toUpperCase();
    
    const transitionObj = {
      from: fromState,
      to: toState,
      reason: reason || "ADMIN_ACTION",
      timestamp: new Date().toISOString(),
      transitionId: transitionId
    };
    
    properties.setProperty("fsm_last_transition_" + tournamentId, JSON.stringify(transitionObj));
    properties.setProperty("fsm_version_" + tournamentId, String(nextVer));
    
    // Log transition event inside sheet EVENT_LOG
    this.logTransition(tournamentId, fromState, toState, reason || "ADMIN_ACTION", actor, transitionId);
  },

  /**
   * Formats and appends FSM transition entries to the EVENT_LOG spreadsheet.
   */
  logTransition: function(tournamentId, fromState, toState, reason, actor, transitionId) {
    try {
      const time = Utilities.formatDate(new Date(), "GMT+5", "yyyy-MM-dd HH:mm:ss");
      const row = [
        transitionId,
        time,
        tournamentId,
        "LIFECYCLE_TRANSITION",
        fromState,
        toState,
        "Registration transition: " + fromState + " -> " + toState + ". Reason: " + reason + ".",
        actor
      ];
      DatabaseAdapter.appendEventLog(row);
      Logger.log("[Lifecycle] Transition logged: " + transitionId);
    } catch (e) {
      Logger.log("[Lifecycle] Failed to write event transition log: " + e);
    }
  },

  /**
   * Helper fetching live approved teams list. Never caches registration counts.
   */
  getApprovedTeamsLive_: function(tournamentId, config) {
    return RegistrationService.getApprovedTeams(tournamentId, config);
  }
};
