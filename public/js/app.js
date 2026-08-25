// Global error catcher for debugging
window.onerror = function (message, source, lineno, colno, error) {
  const msg = `JS Error: ${message} at line ${lineno}:${colno}`;
  console.error(msg, error);
  const toast = document.getElementById('toast-message');
  if (toast) {
    toast.textContent = msg;
    const toastContainer = document.getElementById('toast');
    if (toastContainer) {
      toastContainer.classList.add('error');
      toastContainer.classList.add('show');
      setTimeout(() => toastContainer.classList.remove('show'), 6000);
    }
  } else {
    alert(msg);
  }
};

// Application State
const state = {
  activeTab: 'overview',
  config: null,
  status: null,
  libraries: [],
  sessions: [],
  history: [],
  audit: null,
  logs: null,
  proposals: [],
  eventSource: null
};

// DOM Elements Cache
const elements = {
  // Navigation
  navButtons: document.querySelectorAll('.nav-item'),
  tabPanes: document.querySelectorAll('.tab-pane'),
  activeSessionsBadge: document.getElementById('active-sessions-count'),
  cleanupBadge: document.getElementById('cleanup-proposals-count'),
  statusDot: document.getElementById('status-dot'),
  statusDesc: document.getElementById('status-desc-text'),
  simulationBanner: document.getElementById('simulation-banner'),
  toast: document.getElementById('toast-notification'),
  toastMessage: document.getElementById('toast-message'),

  // Overview Tab
  vitalServerName: document.getElementById('vital-server-name'),
  vitalOS: document.getElementById('vital-os'),
  vitalVersion: document.getElementById('vital-version'),
  vitalTranscode: document.getElementById('vital-transcode'),
  vitalTuner: document.getElementById('vital-tuner'),
  healthGaugeFill: document.getElementById('health-gauge-fill'),
  healthScorePercent: document.getElementById('health-score-percent'),
  healthScoreStatus: document.getElementById('health-score-status'),
  healthSummaryHeadline: document.getElementById('health-summary-headline'),
  healthSummaryText: document.getElementById('health-summary-text'),
  statsTotalItems: document.getElementById('stats-total-items'),
  statsTotalSize: document.getElementById('stats-total-size'),
  statsLibrariesCount: document.getElementById('stats-libraries-count'),
  statsDuplicatesCount: document.getElementById('stats-duplicates-count'),
  selectScanLib: document.getElementById('select-scan-library'),
  selectTrashLib: document.getElementById('select-trash-library'),
  btnScan: document.getElementById('btn-scan-library'),
  btnEmptyTrash: document.getElementById('btn-empty-trash'),
  btnOptimize: document.getElementById('btn-optimize-db'),

  // Active Sessions
  noSessionsCard: document.getElementById('no-active-sessions'),
  sessionsList: document.getElementById('sessions-list'),
  historyTbody: document.getElementById('history-tbody'),

  // Auditor Tab
  auditStatDuplicates: document.getElementById('audit-count-duplicates'),
  auditStatPosters: document.getElementById('audit-count-posters'),
  auditStatSummaries: document.getElementById('audit-count-summaries'),
  auditStatSubtitles: document.getElementById('audit-count-subtitles'),
  auditStatUnmatched: document.getElementById('audit-count-unmatched'),
  resBar4k: document.getElementById('res-bar-4k'),
  resVal4k: document.getElementById('res-val-4k'),
  resBar1080: document.getElementById('res-bar-1080'),
  resVal1080: document.getElementById('res-val-1080'),
  resBar720: document.getElementById('res-bar-720'),
  resVal720: document.getElementById('res-val-720'),
  resBarSd: document.getElementById('res-bar-sd'),
  resValSd: document.getElementById('res-val-sd'),
  auditDetailsTitle: document.getElementById('audit-details-title'),
  auditTabButtons: document.querySelectorAll('[data-audit-target]'),
  auditTablePanes: document.querySelectorAll('.audit-table-pane'),
  auditTbodyDuplicates: document.getElementById('audit-tbody-duplicates'),
  auditTbodyPosters: document.getElementById('audit-tbody-posters'),
  auditTbodySummaries: document.getElementById('audit-tbody-summaries'),
  auditTbodySubtitles: document.getElementById('audit-tbody-subtitles'),
  auditTbodyUnmatched: document.getElementById('audit-tbody-unmatched'),
  resBarContainers: document.querySelectorAll('.bar-container'),
  auditTbodyResolution: document.getElementById('audit-tbody-resolution'),

  // Logs & Forecaster
  trendBox: document.getElementById('trend-box'),
  trendIcon: document.getElementById('trend-icon'),
  trendStatusTitle: document.getElementById('trend-status-title'),
  trendStatusDesc: document.getElementById('trend-status-desc'),
  recommendationsList: document.getElementById('recommendations-list'),
  logCountErrors: document.getElementById('log-count-errors'),
  logCountWarnings: document.getElementById('log-count-warnings'),
  logCountSlow: document.getElementById('log-count-slow'),
  logCountTranscode: document.getElementById('log-count-transcode'),
  logConsole: document.getElementById('log-console-container'),
  logSearchInput: document.getElementById('log-search-input'),
  logFilterLevel: document.getElementById('log-filter-level'),

  // Cleanup proposals
  ruleIconDup: document.getElementById('rule-icon-dup'),
  ruleIconRes: document.getElementById('rule-icon-res'),
  ruleIconBit: document.getElementById('rule-icon-bit'),
  ruleIconLow: document.getElementById('rule-icon-low'),
  ruleDescRes: document.getElementById('rule-desc-res'),
  ruleDescBit: document.getElementById('rule-desc-bit'),
  ruleDescDir: document.getElementById('rule-desc-dir'),
  proposalsTotalBadge: document.getElementById('proposals-total-badge'),
  proposalsTbody: document.getElementById('proposals-tbody'),
  filterDup: document.getElementById('filter-dup'),
  filterLow: document.getElementById('filter-low'),

  // Settings
  inputPmsUrl: document.getElementById('input-pms-url'),
  inputPmsToken: document.getElementById('input-pms-token'),
  inputLogPath: document.getElementById('input-log-path'),
  checkMockLogs: document.getElementById('check-mock-logs'),
  checkRuleDup: document.getElementById('check-rule-dup'),
  checkRulePreferRes: document.getElementById('check-rule-prefer-res'),
  checkRulePreferBit: document.getElementById('check-rule-prefer-bit'),
  selectLowQualityRes: document.getElementById('select-low-quality-res'),
  inputLowQualityBitrate: document.getElementById('input-low-quality-bitrate'),
  inputQuarantineDir: document.getElementById('input-quarantine-dir'),
  formPms: document.getElementById('settings-pms-form'),
  formRules: document.getElementById('settings-rules-form'),

  // Modal Dialogue
  modal: document.getElementById('confirm-modal'),
  modalTitle: document.getElementById('modal-title'),
  modalMessage: document.getElementById('modal-message'),
  modalDetails: document.getElementById('modal-details-file'),
  btnModalCancel: document.getElementById('btn-modal-cancel'),
  btnModalConfirm: document.getElementById('btn-modal-confirm'),

  // Banish Modal Dialogue
  banishModal: document.getElementById('banish-modal'),
  banishReason: document.getElementById('banish-reason'),
  banishModalDetails: document.getElementById('banish-modal-details'),
  btnBanishCancel: document.getElementById('btn-banish-cancel'),
  btnBanishConfirm: document.getElementById('btn-banish-confirm'),

  // Poster Uploader Modal
  posterModal: document.getElementById('poster-modal'),
  posterUrlInput: document.getElementById('poster-url'),
  posterPreviewImg: document.getElementById('poster-preview-img'),
  posterPreviewPlaceholder: document.getElementById('poster-preview-placeholder'),
  posterModalDetails: document.getElementById('poster-modal-details'),
  btnPosterCancel: document.getElementById('btn-poster-cancel'),
  btnPosterConfirm: document.getElementById('btn-poster-confirm'),
  posterMatchesLoading: document.getElementById('poster-matches-loading'),
  posterMatchesList: document.getElementById('poster-matches-list')
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async () => {
  setupNavigation();
  setupSettingsHandlers();
  setupMaintenanceHandlers();
  setupAuditorTabSelector();
  setupResolutionClickHandlers();
  setupLogsFiltering();
  setupProposalFiltering();
  setupModalHandlers();
  setupBanishModalHandlers();
  setupPosterModalHandlers();
  
  // Initial load
  await loadConfig();
  await updateServerStatus();
  await loadLibraries();
  
  // Load data for initial overview tab
  refreshOverviewData();
  
  // Setup Server-Sent Events (SSE) for live stream
  setupSSE();
});

// --- HELPER FUNCTIONS ---

// Toast Notifications
function showToast(message, isError = false) {
  elements.toastMessage.textContent = message;
  if (isError) {
    elements.toast.style.borderColor = 'var(--danger)';
    elements.toast.style.boxShadow = '0 4px 20px var(--danger-glow)';
  } else {
    elements.toast.style.borderColor = 'var(--plex-orange)';
    elements.toast.style.boxShadow = '0 4px 20px var(--plex-orange-glow)';
  }
  elements.toast.classList.remove('hidden');
  
  setTimeout(() => {
    elements.toast.classList.add('hidden');
  }, 4000);
}

// Convert Milliseconds to time format HH:MM:SS or MM:SS
function formatDuration(ms) {
  if (isNaN(ms) || ms <= 0) return '0:00';
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  
  const paddedSeconds = seconds < 10 ? '0' + seconds : seconds;
  if (hours > 0) {
    const paddedMinutes = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${paddedMinutes}:${paddedSeconds}`;
  }
  return `${minutes}:${paddedSeconds}`;
}

// Format byte size to readable files size
function formatBytes(bytes, decimals = 2) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Update circular health score progress arc
function setHealthGauge(percent) {
  // circumference of r=45 is 2 * Math.PI * 45 = 282.74 (approx 283)
  const offset = 283 - (283 * (percent / 100));
  elements.healthGaugeFill.style.strokeDashoffset = offset;
  elements.healthScorePercent.textContent = `${percent}%`;
  
  // Color shifting based on health
  if (percent >= 85) {
    elements.healthGaugeFill.style.stroke = 'var(--success)';
    elements.healthScoreStatus.textContent = 'Nominal';
    elements.healthScoreStatus.style.color = 'var(--success)';
  } else if (percent >= 50) {
    elements.healthGaugeFill.style.stroke = 'var(--warning)';
    elements.healthScoreStatus.textContent = 'Warning';
    elements.healthScoreStatus.style.color = 'var(--warning)';
  } else {
    elements.healthGaugeFill.style.stroke = 'var(--danger)';
    elements.healthScoreStatus.textContent = 'Stuttered';
    elements.healthScoreStatus.style.color = 'var(--danger)';
  }
}

// --- API ACTIONS ---

// Fetch Configurations
async function loadConfig() {
  try {
    const res = await fetch('/api/config');
    state.config = await res.json();
    populateSettingsForm();
    updateCleanupRuleWidgets();
  } catch (err) {
    showToast('Failed to load application configuration', true);
  }
}

// Helper to update sidebar connection and health status widget
function updateSidebarStatusWidget() {
  const connected = state.status && state.status.connected;
  const isMock = state.status && state.status.isMock;
  
  if (!connected) {
    elements.statusDot.className = 'status-indicator-dot offline';
    elements.statusDot.style.backgroundColor = '';
    elements.statusDesc.textContent = state.status?.error || 'Disconnected';
    return;
  }
  
  // Connected!
  elements.statusDot.className = 'status-indicator-dot online';
  
  let healthStatus = 'HEALTHY';
  if (state.logs) {
    healthStatus = state.logs.status; // 'HEALTHY', 'WARNING', 'DANGER'
  }
  
  if (healthStatus === 'DANGER') {
    elements.statusDot.style.backgroundColor = 'var(--danger)';
    elements.statusDesc.textContent = isMock ? 'Simulated (Bottleneck)' : 'Connected (Bottleneck)';
  } else if (healthStatus === 'WARNING') {
    elements.statusDot.style.backgroundColor = 'var(--warning)';
    elements.statusDesc.textContent = isMock ? 'Simulated (High Load)' : 'Connected (High Load)';
  } else {
    elements.statusDot.style.backgroundColor = 'var(--success)';
    elements.statusDesc.textContent = isMock ? 'Simulated Plex Server' : 'Connected';
  }
}

// Fetch Server Vitals
async function updateServerStatus() {
  try {
    const res = await fetch('/api/plex/status');
    const status = await res.json();
    state.status = status;
    
    updateSidebarStatusWidget();
    
    if (status.connected) {
      // Update vital info cards
      elements.vitalServerName.textContent = status.serverInfo.friendlyName || 'Plex-Media';
      elements.vitalOS.textContent = status.serverInfo.platform || '-';
      elements.vitalVersion.textContent = status.serverInfo.version || '-';
      
      const hwSupport = status.serverInfo.transcoderVideo && status.serverInfo.transcoderAudio;
      elements.vitalTranscode.textContent = hwSupport ? 'Supported (QSV/NVDEC)' : 'Software Only';
      elements.vitalTranscode.className = hwSupport ? 'value success-text' : 'value danger-text';
      
      if (status.isMock) {
        elements.simulationBanner.classList.remove('hidden');
      } else {
        elements.simulationBanner.classList.add('hidden');
      }
    }
  } catch (err) {
    state.status = { connected: false };
    updateSidebarStatusWidget();
  }
}

// Fetch lists of library sections
async function loadLibraries() {
  try {
    const res = await fetch('/api/plex/libraries');
    state.libraries = await res.json();
    
    // Fill Scan & Empty Trash selects
    elements.selectScanLib.innerHTML = '<option value="">Select Section...</option>';
    elements.selectTrashLib.innerHTML = '<option value="">Select Section...</option>';
    
    state.libraries.forEach(lib => {
      const opt1 = new Option(`${lib.title} (${lib.type})`, lib.key);
      const opt2 = new Option(`${lib.title} (${lib.type})`, lib.key);
      elements.selectScanLib.add(opt1);
      elements.selectTrashLib.add(opt2);
    });
  } catch (err) {
    console.error('Failed to load libraries list', err);
  }
}

// Fetch and load active playbacks
async function loadSessions() {
  try {
    const res = await fetch('/api/plex/sessions');
    state.sessions = await res.json();
    renderSessions();
  } catch (err) {
    console.error('Failed to load sessions data', err);
  }
}

// Fetch and load watch history
async function loadHistory() {
  try {
    const res = await fetch('/api/plex/history');
    state.history = await res.json();
    renderHistory();
  } catch (err) {
    console.error('Failed to load history list', err);
  }
}

// Fetch Metadata Audit
async function loadAudit() {
  try {
    let activeSubTab = 'duplicates';
    if (elements.auditTabButtons) {
      const activeBtn = Array.from(elements.auditTabButtons).find(btn => btn.classList.contains('active'));
      if (activeBtn && activeBtn.dataset.auditTarget) {
        activeSubTab = activeBtn.dataset.auditTarget;
      }
    }

    const res = await fetch('/api/plex/metadata/audit');
    state.audit = await res.json();
    renderAuditSummary();
    renderAuditTable(activeSubTab);
  } catch (err) {
    console.error('Failed to run audit scanner', err);
  }
}

// Fetch system logs & forecast
async function loadLogs() {
  try {
    const res = await fetch('/api/maintenance/logs');
    state.logs = await res.json();
    renderLogForecaster();
    renderLogsConsole();
  } catch (err) {
    console.error('Failed parsing server logs', err);
  }
}

// Fetch proposals for cleanup
async function loadProposals() {
  try {
    const res = await fetch('/api/cleanup/proposals');
    state.proposals = await res.json();
    renderProposals();
  } catch (err) {
    console.error('Failed compilation of proposals', err);
  }
}

// SSE real time status listener
function setupSSE() {
  if (state.eventSource) {
    state.eventSource.close();
  }
  
  state.eventSource = new EventSource('/api/events');
  
  state.eventSource.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data);
      
      if (payload.type === 'sessions') {
        const metadata = payload.data.Metadata || [];
        state.sessions = payload.data;
        elements.activeSessionsBadge.textContent = metadata.length;
        if (state.activeTab === 'sessions') {
          renderSessions();
        }
      } else if (payload.type === 'health') {
        const data = payload.data;
        setHealthGauge(data.healthScore);
        
        // Save to state
        if (!state.logs) {
          state.logs = { status: data.status, healthScore: data.healthScore };
        } else {
          state.logs.status = data.status;
          state.logs.healthScore = data.healthScore;
        }
        
        updateSidebarStatusWidget();
      }
    } catch (e) {
      // Parse err
    }
  };
  
  state.eventSource.onerror = () => {
    console.warn('SSE disconnected. Reconnecting...');
  };
}

// --- RENDERERS ---

// Overview statistics and cards loading
async function refreshOverviewData() {
  await updateServerStatus();
  
  // Aggregate stats from Audit endpoint
  try {
    const res = await fetch('/api/plex/metadata/audit');
    const audit = await res.json();
    state.audit = audit;
    
    elements.statsTotalItems.textContent = audit.totalItems || 0;
    elements.statsTotalSize.textContent = formatBytes(audit.totalSize || 0, 1);
    elements.statsLibrariesCount.textContent = state.libraries.length;
    elements.statsDuplicatesCount.textContent = audit.duplicates?.length || 0;
  } catch (e) {
    //
  }

  // Load Forecaster Summary
  try {
    const res = await fetch('/api/maintenance/logs');
    const logs = await res.json();
    state.logs = logs;
    setHealthGauge(logs.healthScore);
    elements.healthSummaryHeadline.textContent = logs.status === 'HEALTHY' ? 'All Systems Nominal' : logs.status === 'WARNING' ? 'Performance Warning' : 'Stuttering Alert';
    elements.healthSummaryText.textContent = logs.message;
  } catch (e) {
    //
  }

  // Fetch cleanup proposals count for badge
  try {
    const res = await fetch('/api/cleanup/proposals');
    const props = await res.json();
    state.proposals = props;
    if (props.length > 0) {
      elements.cleanupBadge.textContent = props.length;
      elements.cleanupBadge.style.display = 'inline-block';
    } else {
      elements.cleanupBadge.style.display = 'none';
    }
  } catch (e) {
    //
  }
}

// Render active playbacks
function renderSessions() {
  const metadata = state.sessions.Metadata || [];
  elements.sessionsList.innerHTML = '';
  
  if (metadata.length === 0) {
    elements.noSessionsCard.classList.remove('hidden');
    return;
  }
  elements.noSessionsCard.classList.add('hidden');
  
  metadata.forEach(s => {
    const card = document.createElement('div');
    card.className = 'card glass session-card';
    
    const initial = s.User?.title ? s.User.title.charAt(0) : 'U';
    const progressPercent = s.duration && s.viewOffset ? Math.round((s.viewOffset / s.duration) * 100) : 0;
    
    // Playback Decision (Direct vs Transcode)
    const isTranscode = !!s.TranscodeSession;
    let decisionText = 'Direct Play';
    let decisionClass = 'spec-tag direct-play';
    let transcodeBoxHTML = '';
    
    if (isTranscode) {
      decisionText = 'Transcoding';
      decisionClass = 'spec-tag transcode';
      
      const speed = s.TranscodeSession.speed || 1.0;
      const speedClass = speed < 1.0 ? 'val slow' : 'val';
      const videoDecision = s.TranscodeSession.videoDecision || 'transcode';
      const audioDecision = s.TranscodeSession.audioDecision || 'copy';
      
      transcodeBoxHTML = `
        <div class="transcode-details-box">
          <div class="transcode-metric">
            <span class="lbl">Video Stream</span>
            <span class="val">${videoDecision.toUpperCase()}</span>
          </div>
          <div class="transcode-metric">
            <span class="lbl">Audio Stream</span>
            <span class="val">${audioDecision.toUpperCase()}</span>
          </div>
          <div class="transcode-metric">
            <span class="lbl">Buffer Speed</span>
            <span class="val ${speed < 1.0 ? 'slow' : ''}">${speed}x</span>
          </div>
        </div>
      `;
    }
    
    const media = s.Media?.[0] || {};
    const resolution = media.videoResolution ? `${media.videoResolution}p` : 'Unknown';
    const codec = media.videoCodec ? media.videoCodec.toUpperCase() : 'RAW';
    const container = media.container ? media.container.toUpperCase() : 'MKV';
    
    card.innerHTML = `
      <div class="session-header">
        <div class="session-user-badge">
          <div class="user-avatar-initial">${initial}</div>
          <div class="status-indicator-details">
            <span class="username">${s.User?.title || 'Unknown'}</span>
            <span class="session-device">${s.Player?.product || 'Web Client'} (${s.Player?.title || 'Device'})</span>
          </div>
        </div>
        <span class="badge" style="background-color: var(--border-color); color: var(--text-secondary);">${s.Player?.state || 'playing'}</span>
      </div>
      
      <div class="session-body">
        <div class="media-title-row">
          ${s.grandparentTitle ? `<span class="grandparent-title">${s.grandparentTitle}</span>` : ''}
          <span class="media-title">${s.title} ${s.year ? `(${s.year})` : ''}</span>
        </div>
        
        <div class="media-specs">
          <span class="${decisionClass}">${decisionText}</span>
          <span class="spec-tag">${resolution}</span>
          <span class="spec-tag">${codec}</span>
          <span class="spec-tag">${container}</span>
        </div>
        
        <div class="progress-container">
          <div class="progress-track">
            <div class="progress-bar" style="width: ${progressPercent}%"></div>
          </div>
          <div class="progress-time">
            <span>${formatDuration(s.viewOffset)}</span>
            <span>${formatDuration(s.duration)}</span>
          </div>
        </div>
        
        ${transcodeBoxHTML}
      </div>

      <div class="session-footer">
        <button class="btn btn-danger btn-banish" data-session-key="${s.Session?.id || (Array.isArray(s.Session) && s.Session[0]?.id) || s.sessionKey || s.ratingKey}" data-title="${s.title}" data-user="${s.User?.title || 'Unknown'}">Banish Stream</button>
      </div>
    `;
    elements.sessionsList.appendChild(card);
  });

  // Bind Banish Stream buttons
  elements.sessionsList.querySelectorAll('.btn-banish').forEach(btn => {
    btn.onclick = () => {
      const sessionKey = btn.getAttribute('data-session-key');
      const title = btn.getAttribute('data-title');
      const username = btn.getAttribute('data-user');
      openBanishModal(sessionKey, title, username);
    };
  });
}

// Render watch history
function renderHistory() {
  elements.historyTbody.innerHTML = '';
  if (state.history.length === 0) {
    elements.historyTbody.innerHTML = '<tr><td colspan="4" class="text-center">No history found.</td></tr>';
    return;
  }
  
  state.history.forEach(h => {
    const tr = document.createElement('tr');
    let title = h.title;
    if (h.type === 'episode') {
      title = `${h.grandparentTitle} - ${h.title}`;
    }
    const timestamp = h.viewedAt < 10000000000 ? h.viewedAt * 1000 : h.viewedAt;
    const playedAt = new Date(timestamp).toLocaleString();
    tr.innerHTML = `
      <td><strong>${h.User?.title || 'guest'}</strong></td>
      <td>${title} ${h.year ? `(${h.year})` : ''}</td>
      <td><span class="spec-tag">${h.type || 'movie'}</span></td>
      <td class="font-code">${playedAt}</td>
    `;
    elements.historyTbody.appendChild(tr);
  });
}

// Render media audit statistics
function renderAuditSummary() {
  const audit = state.audit;
  elements.auditStatDuplicates.textContent = audit.duplicates?.length || 0;
  elements.auditStatPosters.textContent = audit.missingPoster?.length || 0;
  elements.auditStatSummaries.textContent = audit.missingSummary?.length || 0;
  elements.auditStatSubtitles.textContent = audit.missingSubtitles?.length || 0;
  elements.auditStatUnmatched.textContent = audit.unmatched?.length || 0;
  
  // Calculate Resolution Breakdown percentage totals
  const res = audit.resolutionBreakdown || { '4k': 0, '1080p': 0, '720p': 0, 'sd': 0 };
  const total = res['4k'] + res['1080p'] + res['720p'] + res['sd'] || 1;
  
  const pct4k = Math.max(0, Math.min(100, Math.round((res['4k'] / total) * 100)));
  const pct1080 = Math.max(0, Math.min(100, Math.round((res['1080p'] / total) * 100)));
  const pct720 = Math.max(0, Math.min(100, Math.round((res['720p'] / total) * 100)));
  const pctSd = Math.max(0, Math.min(100, Math.round((res['sd'] / total) * 100)));

  // Animate resolution chart widths
  elements.resBar4k.style.width = `${pct4k}%`;
  elements.resVal4k.textContent = `${res['4k']} (${pct4k}%)`;
  elements.resBar1080.style.width = `${pct1080}%`;
  elements.resVal1080.textContent = `${res['1080p']} (${pct1080}%)`;
  elements.resBar720.style.width = `${pct720}%`;
  elements.resVal720.textContent = `${res['720p']} (${pct720}%)`;
  elements.resBarSd.style.width = `${pctSd}%`;
  elements.resValSd.textContent = `${res['sd']} (${pctSd}%)`;
}

// Render tables inside media audit detail tabs
function renderAuditTable(target, resolutionKey) {
  // Hide all table panes
  elements.auditTablePanes.forEach(pane => pane.classList.remove('active'));
  
  // Show target table pane
  const table = document.getElementById(`audit-table-${target}`);
  table.classList.add('active');
  
  // Set title
  if (target === 'resolution') {
    const labels = { '4k': '4K Ultra HD', '1080p': '1080p Full HD', '720p': '720p HD', 'sd': 'SD Standard' };
    const label = labels[resolutionKey] || 'Unknown Resolution';
    const list = (state.audit?.resolutionItems?.[resolutionKey]) || [];
    elements.auditDetailsTitle.textContent = `Metadata Audit Details: ${label} (${list.length} titles)`;
  } else {
    const names = { duplicates: 'Duplicates', posters: 'No Poster', summaries: 'No Summary', subtitles: 'No Subtitles' };
    elements.auditDetailsTitle.textContent = `Metadata Audit Details: ${names[target]}`;
  }
  
  const audit = state.audit;
  if (!audit) return;
  
  if (target === 'duplicates') {
    elements.auditTbodyDuplicates.innerHTML = '';
    const list = audit.duplicates || [];
    if (list.length === 0) {
      elements.auditTbodyDuplicates.innerHTML = '<tr><td colspan="4" class="text-center">No duplicate files found!</td></tr>';
      return;
    }
    list.forEach(item => {
      const tr = document.createElement('tr');
      const filesSummary = item.files.map(f => `• ${f.resolution || 'unknown'}p (${formatBytes(f.size)})<br><span class="font-code">${f.file}</span>`).join('<br>');
      tr.innerHTML = `
        <td><strong>${item.title}</strong></td>
        <td><span class="spec-tag">${item.library}</span></td>
        <td>${filesSummary}</td>
        <td><button class="btn btn-secondary btn-proposals-shortcut" data-id="${item.id}">View in Cleanup</button></td>
      `;
      elements.auditTbodyDuplicates.appendChild(tr);
    });
    
    // Bind shortcuts
    elements.auditTbodyDuplicates.querySelectorAll('.btn-proposals-shortcut').forEach(btn => {
      btn.onclick = () => {
        switchTab('cleanup');
      };
    });
  } else if (target === 'posters') {
    elements.auditTbodyPosters.innerHTML = '';
    const list = audit.missingPoster || [];
    if (list.length === 0) {
      elements.auditTbodyPosters.innerHTML = '<tr><td colspan="4" class="text-center">No items missing posters!</td></tr>';
      return;
    }
    const rawUrl = state.config?.plex?.url || 'http://localhost:32400';
    const plexUrl = rawUrl.replace(/\/+:/, ':').replace(/\/+$/, '');
    list.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <strong>${item.title}</strong>
          ${item.reason === 'placeholder' ? `<span style="font-size: 10px; padding: 2px 6px; margin-left: 8px; background: rgba(230,81,0,0.2); border: 1px solid var(--plex-orange); color: var(--plex-orange); border-radius: 4px; font-weight: 600; vertical-align: middle;">Placeholder Still</span>` : ''}
        </td>
        <td><span class="spec-tag">${item.type}</span></td>
        <td>${item.library}</td>
        <td>
          <button class="btn btn-primary btn-set-poster" data-rating-key="${item.id}" data-title="${item.title}" style="padding: 4px 12px; font-size: 11px;">Set Poster</button>
          <a href="${plexUrl}/web/index.html#!/server/${state.status?.serverInfo?.machineIdentifier}/details?key=%2Flibrary%2Fmetadata%2F${item.id}" target="_blank" class="value success-text" style="margin-left: 12px; font-size: 11px; vertical-align: middle;">Plex Web</a>
        </td>
      `;
      elements.auditTbodyPosters.appendChild(tr);
    });

    // Bind Set Poster buttons
    elements.auditTbodyPosters.querySelectorAll('.btn-set-poster').forEach(btn => {
      btn.onclick = () => {
        const ratingKey = btn.getAttribute('data-rating-key');
        const title = btn.getAttribute('data-title');
        openPosterModal(ratingKey, title);
      };
    });
  } else if (target === 'summaries') {
    elements.auditTbodySummaries.innerHTML = '';
    const list = audit.missingSummary || [];
    if (list.length === 0) {
      elements.auditTbodySummaries.innerHTML = '<tr><td colspan="4" class="text-center">No items missing summaries!</td></tr>';
      return;
    }
    list.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${item.title}</strong></td>
        <td><span class="spec-tag">${item.type}</span></td>
        <td>${item.library}</td>
        <td><span class="danger-text">Lacks metadata info</span></td>
      `;
      elements.auditTbodySummaries.appendChild(tr);
    });
  } else if (target === 'subtitles') {
    elements.auditTbodySubtitles.innerHTML = '';
    const list = audit.missingSubtitles || [];
    if (list.length === 0) {
      elements.auditTbodySubtitles.innerHTML = '<tr><td colspan="4" class="text-center">No items missing subtitles!</td></tr>';
      return;
    }
    list.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${item.title}</strong></td>
        <td><span class="spec-tag">${item.type}</span></td>
        <td>${item.library}</td>
        <td class="font-code">${item.file || '-'}</td>
      `;
      elements.auditTbodySubtitles.appendChild(tr);
    });
  } else if (target === 'unmatched') {
    elements.auditTbodyUnmatched.innerHTML = '';
    const list = audit.unmatched || [];
    if (list.length === 0) {
      elements.auditTbodyUnmatched.innerHTML = '<tr><td colspan="5" class="text-center">No unmatched items found! All matched successfully.</td></tr>';
      return;
    }
    list.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${item.title}</strong></td>
        <td><span class="spec-tag">${item.type}</span></td>
        <td>${item.library}</td>
        <td class="font-code">${item.guid || 'local://'}</td>
        <td>
          <button class="btn btn-primary btn-fix-match" data-rating-key="${item.id}" data-title="${item.title}" style="padding: 4px 12px; font-size: 11px;">Fix Match</button>
        </td>
      `;
      elements.auditTbodyUnmatched.appendChild(tr);
    });

    // Bind Fix Match buttons to open matches modal
    elements.auditTbodyUnmatched.querySelectorAll('.btn-fix-match').forEach(btn => {
      btn.onclick = () => {
        const ratingKey = btn.getAttribute('data-rating-key');
        const title = btn.getAttribute('data-title');
        openPosterModal(ratingKey, title);
      };
    });
  } else if (target === 'resolution') {
    elements.auditTbodyResolution.innerHTML = '';
    const list = (audit.resolutionItems && audit.resolutionItems[resolutionKey]) || [];
    if (list.length === 0) {
      elements.auditTbodyResolution.innerHTML = '<tr><td colspan="4" class="text-center">No items found for this resolution!</td></tr>';
      return;
    }
    list.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${item.title}</strong></td>
        <td><span class="spec-tag">${item.type}</span></td>
        <td>${item.library}</td>
        <td><span class="value info-text">${item.resolution}</span></td>
      `;
      elements.auditTbodyResolution.appendChild(tr);
    });
  }
}

// Render predictive maintenance gauge
function renderLogForecaster() {
  const data = state.logs;
  if (!data) return;
  
  elements.logCountErrors.textContent = data.counts.errors;
  elements.logCountWarnings.textContent = data.counts.warnings;
  elements.logCountSlow.textContent = data.counts.slowQueries;
  elements.logCountTranscode.textContent = data.counts.transcodeErrors;
  
  // Set gauge percent
  setHealthGauge(data.healthScore);
  
  // Update class of trend alert box
  const level = data.status.toLowerCase();
  elements.trendBox.className = `trend-alert-box ${level}`;
  
  // Icon and title
  let icon = '✓';
  let title = 'All Systems Nominal';
  let desc = data.message;
  let recs = [];
  
  if (level === 'danger') {
    icon = '🚨';
    title = 'Critical Stutter Risk';
    recs = [
      'Immediate action: Check system GPU transcoder driver status.',
      'Alert the active users experiencing speeds < 1.0x (e.g. bob).',
      'Optimize the Plex SQLite databases immediately.',
      'Purge transcoding cache directory to avoid full storage disk.'
    ];
  } else if (level === 'warning') {
    icon = '⚠️';
    title = 'Performance Stutter Warning';
    recs = [
      'Optimize database file records (in Overview tab).',
      'Inform users to disable subtitle burn-ins if possible.',
      'Check system log for slow database lookup queries.'
    ];
  } else {
    recs = [
      'No maintenance actions required.',
      'Plex database query indexing is within normal range (< 500ms).',
      'Hardware acceleration is direct streaming and direct playing.'
    ];
  }
  
  elements.trendIcon.textContent = icon;
  elements.trendStatusTitle.textContent = title;
  elements.trendStatusDesc.textContent = desc;
  
  // Render recommendations list
  elements.recommendationsList.innerHTML = recs.map(r => `<li>${r}</li>`).join('');
}

// Render logs line inside log console panel
function renderLogsConsole() {
  const data = state.logs;
  if (!data) return;
  
  const query = elements.logSearchInput.value.toLowerCase();
  const filterLevel = elements.logFilterLevel.value;
  
  elements.logConsole.innerHTML = '';
  
  const filtered = data.logs.filter(l => {
    // Level match
    if (filterLevel !== 'ALL' && l.type !== filterLevel) return false;
    // Search match
    if (query && !l.text.toLowerCase().includes(query)) return false;
    return true;
  });
  
  if (filtered.length === 0) {
    elements.logConsole.innerHTML = '<div class="text-center" style="grid-column: span 3; color: var(--text-muted);">No matching log events.</div>';
    return;
  }
  
  filtered.forEach(l => {
    const line = document.createElement('div');
    line.className = `log-line ${l.type.toLowerCase()}`;
    
    line.innerHTML = `
      <span class="log-time">[${l.timestamp}]</span>
      <span class="log-type">${l.type}</span>
      <span class="log-text">${l.text}</span>
    `;
    elements.logConsole.appendChild(line);
  });
  
  // Scroll to bottom
  elements.logConsole.scrollTop = elements.logConsole.scrollHeight;
}

// Render rules settings descriptions
function updateCleanupRuleWidgets() {
  const rules = state.config?.cleanup?.rules;
  if (!rules) return;
  
  elements.ruleIconDup.className = rules.deleteDuplicates ? 'rule-icon checked' : 'rule-icon unchecked';
  elements.ruleIconDup.textContent = rules.deleteDuplicates ? '✓' : '✗';
  
  elements.ruleIconRes.className = rules.preferHigherResolution ? 'rule-icon checked' : 'rule-icon unchecked';
  elements.ruleIconRes.textContent = rules.preferHigherResolution ? '✓' : '✗';
  
  elements.ruleIconBit.className = rules.preferHigherBitrate ? 'rule-icon checked' : 'rule-icon unchecked';
  elements.ruleIconBit.textContent = rules.preferHigherBitrate ? '✓' : '✗';
  
  elements.ruleIconLow.className = (rules.maxLowQualityResolution || rules.maxLowQualityBitrate) ? 'rule-icon checked' : 'rule-icon unchecked';
  elements.ruleIconLow.textContent = (rules.maxLowQualityResolution || rules.maxLowQualityBitrate) ? '✓' : '✗';
  
  elements.ruleDescRes.textContent = `${rules.maxLowQualityResolution || 'sd'} or lower`;
  elements.ruleDescBit.textContent = `${rules.maxLowQualityBitrate || 1500} kbps`;
  elements.ruleDescDir.textContent = state.config.cleanup.targetDir || './quarantine';
}

// Render cleanup proposals list
function renderProposals() {
  elements.proposalsTbody.innerHTML = '';
  
  if (state.proposals.length === 0) {
    elements.proposalsTbody.innerHTML = '<tr><td colspan="5" class="text-center success-text"><strong>All clear!</strong> No duplicate or low quality files matching your rule thresholds.</td></tr>';
    elements.proposalsTotalBadge.textContent = '0 Pending';
    elements.proposalsTotalBadge.style.backgroundColor = 'var(--border-color)';
    elements.proposalsTotalBadge.style.color = 'var(--text-muted)';
    return;
  }

  const showDup = elements.filterDup ? elements.filterDup.checked : true;
  const showLow = elements.filterLow ? elements.filterLow.checked : true;

  const filtered = state.proposals.filter(p => {
    if (p.type === 'Duplicate File') return showDup;
    if (p.type === 'Low Quality File') return showLow;
    return true;
  });

  if (filtered.length === 0) {
    elements.proposalsTbody.innerHTML = '<tr><td colspan="5" class="text-center success-text"><strong>No matching proposals!</strong> Adjust filter toggles or thresholds.</td></tr>';
    elements.proposalsTotalBadge.textContent = '0 Filtered';
    elements.proposalsTotalBadge.style.backgroundColor = 'var(--border-color)';
    elements.proposalsTotalBadge.style.color = 'var(--text-muted)';
    return;
  }
  
  elements.proposalsTotalBadge.textContent = `${filtered.length} Pending`;
  elements.proposalsTotalBadge.style.backgroundColor = 'var(--warning)';
  elements.proposalsTotalBadge.style.color = '#000';
  
  filtered.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <strong>${p.title}</strong><br>
        <span class="spec-tag font-small" style="margin-top: 4px;">${p.library}</span>
      </td>
      <td>
        <span class="badge ${p.type.includes('Duplicate') ? 'warning-badge' : 'primary-badge'}" style="margin-left: 0; padding: 4px 10px;">${p.type}</span>
      </td>
      <td class="font-small">${p.details}</td>
      <td class="font-small">
        Size: ${formatBytes(p.fileSize)}<br>
        <span class="font-code" style="word-break: break-all;">${p.filePath}</span>
      </td>
      <td>
        <div class="action-trigger" style="min-width: 150px;">
          <button class="btn btn-secondary font-small btn-quarantine" style="padding: 6px 12px;" data-id="${p.id}" data-path="${p.filePath}">Quarantine</button>
          <button class="btn btn-danger font-small btn-delete" style="padding: 6px 12px;" data-id="${p.id}" data-path="${p.filePath}">Delete</button>
        </div>
      </td>
    `;
    elements.proposalsTbody.appendChild(tr);
  });
  
  // Bind actions
  elements.proposalsTbody.querySelectorAll('.btn-quarantine').forEach(btn => {
    btn.onclick = () => {
      openConfirmModal('move', btn.dataset.id, btn.dataset.path);
    };
  });
  
  elements.proposalsTbody.querySelectorAll('.btn-delete').forEach(btn => {
    btn.onclick = () => {
      openConfirmModal('delete', btn.dataset.id, btn.dataset.path);
    };
  });
}

// Populate Settings forms input fields
function populateSettingsForm() {
  const cfg = state.config;
  if (!cfg) return;
  
  elements.inputPmsUrl.value = cfg.plex.url || '';
  elements.inputPmsToken.value = cfg.plex.token || '';
  elements.inputLogPath.value = cfg.plex.logPath || '';
  elements.checkMockLogs.checked = cfg.plex.useMockLogs || false;
  
  if (cfg.overridden) {
    if (cfg.overridden.url) {
      elements.inputPmsUrl.disabled = true;
      elements.inputPmsUrl.title = "Configured via environment variable (.env)";
      elements.inputPmsUrl.style.opacity = '0.6';
    } else {
      elements.inputPmsUrl.disabled = false;
      elements.inputPmsUrl.title = "";
      elements.inputPmsUrl.style.opacity = '1';
    }
    if (cfg.overridden.token) {
      elements.inputPmsToken.disabled = true;
      elements.inputPmsToken.title = "Configured via environment variable (.env)";
      elements.inputPmsToken.style.opacity = '0.6';
    } else {
      elements.inputPmsToken.disabled = false;
      elements.inputPmsToken.title = "";
      elements.inputPmsToken.style.opacity = '1';
    }
    if (cfg.overridden.logPath) {
      elements.inputLogPath.disabled = true;
      elements.inputLogPath.title = "Configured via environment variable (.env)";
      elements.inputLogPath.style.opacity = '0.6';
    } else {
      elements.inputLogPath.disabled = false;
      elements.inputLogPath.title = "";
      elements.inputLogPath.style.opacity = '1';
    }
  }

  elements.checkRuleDup.checked = cfg.cleanup.rules.deleteDuplicates || false;
  elements.checkRulePreferRes.checked = cfg.cleanup.rules.preferHigherResolution || false;
  elements.checkRulePreferBit.checked = cfg.cleanup.rules.preferHigherBitrate || false;
  elements.selectLowQualityRes.value = cfg.cleanup.rules.maxLowQualityResolution || 'sd';
  elements.inputLowQualityBitrate.value = cfg.cleanup.rules.maxLowQualityBitrate || 1500;
  elements.inputQuarantineDir.value = cfg.cleanup.targetDir || './quarantine';
}

// --- CONTROLLERS & EVENTS HANDLERS ---

// Sidebar tab switching navigation
function setupNavigation() {
  elements.navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      switchTab(tab);
    });
  });
}

function switchTab(tab) {
  state.activeTab = tab;
  
  // Toggle nav buttons
  elements.navButtons.forEach(btn => {
    if (btn.dataset.tab === tab) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  
  // Toggle panes
  elements.tabPanes.forEach(pane => {
    if (pane.id === `tab-${tab}`) {
      pane.classList.add('active');
    } else {
      pane.classList.remove('active');
    }
  });
  
  // Load data for active tab
  if (tab === 'overview') {
    refreshOverviewData();
  } else if (tab === 'sessions') {
    loadSessions();
    loadHistory();
  } else if (tab === 'auditor') {
    loadAudit();
  } else if (tab === 'logs') {
    loadLogs();
  } else if (tab === 'cleanup') {
    loadProposals();
  } else if (tab === 'settings') {
    loadConfig();
  }
}

// Settings submit handlers
function setupSettingsHandlers() {
  // Save Connection Config
  elements.formPms.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      plex: {
        url: elements.inputPmsUrl.value,
        token: elements.inputPmsToken.value,
        logPath: elements.inputLogPath.value,
        useMockLogs: elements.checkMockLogs.checked
      }
    };
    
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        state.config = data.config;
        showToast('Plex connection credentials updated successfully!');
        await updateServerStatus();
        await loadLibraries();
      } else {
        showToast('Failed to save connection updates', true);
      }
    } catch (err) {
      showToast('Error sending configurations to server', true);
    }
  });

  // Save Cleanup Rules Config
  elements.formRules.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      cleanup: {
        targetDir: elements.inputQuarantineDir.value,
        rules: {
          deleteDuplicates: elements.checkRuleDup.checked,
          preferHigherResolution: elements.checkRulePreferRes.checked,
          preferHigherBitrate: elements.checkRulePreferBit.checked,
          maxLowQualityResolution: elements.selectLowQualityRes.value,
          maxLowQualityBitrate: parseInt(elements.inputLowQualityBitrate.value) || 0
        }
      }
    };
    
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        state.config = data.config;
        updateCleanupRuleWidgets();
        showToast('Cleanup rules updated successfully!');
      } else {
        showToast('Failed to save rules updates', true);
      }
    } catch (err) {
      showToast('Error sending rules configurations', true);
    }
  });
}

// Maintenance actions scan & optimize triggers
function setupMaintenanceHandlers() {
  // Trigger scan library
  elements.btnScan.onclick = async () => {
    const val = elements.selectScanLib.value;
    if (!val) {
      showToast('Please select a library section to scan first', true);
      return;
    }
    
    elements.btnScan.disabled = true;
    elements.btnScan.textContent = 'Scanning...';
    
    try {
      const res = await fetch('/api/plex/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'refresh', sectionId: val })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
      } else {
        showToast('Scan request failed', true);
      }
    } catch (err) {
      showToast('Error sending maintenance request', true);
    } finally {
      elements.btnScan.disabled = false;
      elements.btnScan.textContent = 'Scan Now';
    }
  };

  // Empty Trash trigger
  elements.btnEmptyTrash.onclick = async () => {
    const val = elements.selectTrashLib.value;
    if (!val) {
      showToast('Please select a library section first', true);
      return;
    }
    
    elements.btnEmptyTrash.disabled = true;
    elements.btnEmptyTrash.textContent = 'Clearing...';
    
    try {
      const res = await fetch('/api/plex/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'emptyTrash', sectionId: val })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
      } else {
        showToast('Empty trash request failed', true);
      }
    } catch (err) {
      showToast('Error sending empty trash request', true);
    } finally {
      elements.btnEmptyTrash.disabled = false;
      elements.btnEmptyTrash.textContent = 'Empty Trash';
    }
  };

  // Optimize DB trigger
  elements.btnOptimize.onclick = async () => {
    elements.btnOptimize.disabled = true;
    elements.btnOptimize.textContent = 'Optimizing...';
    
    try {
      const res = await fetch('/api/plex/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'optimize' })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
      } else {
        showToast('Optimization failed', true);
      }
    } catch (err) {
      showToast('Error optimizing database', true);
    } finally {
      elements.btnOptimize.disabled = false;
      elements.btnOptimize.textContent = 'Run Optimization';
    }
  };
}

// Auditor target sub tabs selector
function setupAuditorTabSelector() {
  elements.auditTabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      elements.auditTabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const target = btn.dataset.auditTarget;
      renderAuditTable(target);
    });
  });

  // Query and bind clicks for the top summary stat cards
  const statCards = document.querySelectorAll('.auditor-stat-card');
  statCards.forEach(card => {
    card.addEventListener('click', () => {
      const section = card.dataset.auditSection; // e.g. "duplicates", "posters", "summaries", "subtitles"
      if (!section) return;
      
      // Find the corresponding tab button below and trigger its click
      const correspondingBtn = Array.from(elements.auditTabButtons).find(
        btn => btn.dataset.auditTarget === section
      );
      
      if (correspondingBtn) {
        correspondingBtn.click();
        
        // Smooth scroll down to the audit details card
        const detailsCard = document.querySelector('.audit-details-card');
        if (detailsCard) {
          detailsCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });
}

// Setup resolution breakdown click handlers
function setupResolutionClickHandlers() {
  elements.resBarContainers.forEach(container => {
    container.addEventListener('click', () => {
      const resKey = container.dataset.resKey;
      if (!resKey) return;
      
      // Deactivate all standard audit buttons
      elements.auditTabButtons.forEach(b => b.classList.remove('active'));
      
      // Render resolution details table
      renderAuditTable('resolution', resKey);
      
      // Smooth scroll down to the audit details card
      const detailsCard = document.querySelector('.audit-details-card');
      if (detailsCard) {
        detailsCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

// Real time logs filter
function setupLogsFiltering() {
  elements.logSearchInput.addEventListener('input', () => {
    renderLogsConsole();
  });
  
  elements.logFilterLevel.addEventListener('change', () => {
    renderLogsConsole();
  });
}

// Proposals list filters
function setupProposalFiltering() {
  elements.filterDup.addEventListener('change', () => {
    renderProposals();
  });
  elements.filterLow.addEventListener('change', () => {
    renderProposals();
  });
}

// Modal handling logic
let activeProposal = null;



function openConfirmModal(action, proposalId, filePath) {
  activeProposal = { action, proposalId, filePath };
  
  if (action === 'delete') {
    elements.modalTitle.textContent = 'Confirm File Deletion';
    elements.modalMessage.innerHTML = 'Are you sure you want to <strong style="color:var(--danger)">PERMANENTLY DELETE</strong> this file from disk? This action cannot be undone.';
    elements.btnModalConfirm.className = 'btn btn-danger';
    elements.btnModalConfirm.textContent = 'Delete File';
  } else {
    elements.modalTitle.textContent = 'Confirm File Quarantine';
    elements.modalMessage.innerHTML = 'Are you sure you want to move this file to the Quarantine folder? It will be relocated out of your Plex library.';
    elements.btnModalConfirm.className = 'btn btn-primary';
    elements.btnModalConfirm.textContent = 'Move File';
  }
  
  elements.modalDetails.textContent = filePath;
  elements.modal.showModal();
}

function setupModalHandlers() {
  elements.btnModalCancel.onclick = () => {
    elements.modal.close();
    activeProposal = null;
  };

  elements.btnModalConfirm.onclick = async () => {
    if (!activeProposal) return;
    
    const { action, proposalId, filePath } = activeProposal;
    elements.btnModalConfirm.disabled = true;
    elements.btnModalConfirm.textContent = 'Processing...';
    
    try {
      const res = await fetch('/api/cleanup/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposalId, action, filePath })
      });
      const data = await res.json();
      
      if (data.success) {
        showToast(data.message);
        
        // Remove proposal from local state
        state.proposals = state.proposals.filter(p => p.id !== proposalId);
        renderProposals();
        
        // Refresh overview badge
        if (state.proposals.length > 0) {
          elements.cleanupBadge.textContent = state.proposals.length;
          elements.cleanupBadge.style.display = 'inline-block';
        } else {
          elements.cleanupBadge.style.display = 'none';
        }
      } else {
        showToast(data.message || 'Operation failed', true);
      }
    } catch (err) {
      showToast('Error performing cleanup action', true);
    } finally {
      elements.btnModalConfirm.disabled = false;
      elements.btnModalConfirm.textContent = action === 'delete' ? 'Delete File' : 'Move File';
      elements.modal.close();
      activeProposal = null;
    }
  };
}

// Banish stream modal handling logic
let activeBanishSession = null;

function openBanishModal(sessionKey, title, username) {
  activeBanishSession = sessionKey;
  elements.banishReason.value = '';
  elements.banishModalDetails.innerHTML = `User: <strong>${username}</strong><br>Stream: <strong>${title}</strong>`;
  elements.banishModal.showModal();
}

function setupBanishModalHandlers() {
  elements.btnBanishCancel.onclick = () => {
    elements.banishModal.close();
    activeBanishSession = null;
  };

  elements.btnBanishConfirm.onclick = async () => {
    if (!activeBanishSession) return;
    
    const sessionId = activeBanishSession;
    const reason = elements.banishReason.value.trim();
    
    elements.btnBanishConfirm.disabled = true;
    elements.btnBanishConfirm.textContent = 'Banishing...';
    
    try {
      const res = await fetch('/api/plex/sessions/terminate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, reason })
      });
      const data = await res.json();
      
      if (data.success) {
        showToast(data.message);
        // Refresh active playbacks
        await loadSessions();
      } else {
        showToast(data.message || 'Failed to terminate stream', true);
      }
    } catch (err) {
      showToast('Error performing stream banishment', true);
    } finally {
      elements.btnBanishConfirm.disabled = false;
      elements.btnBanishConfirm.textContent = 'Banish Stream';
      elements.banishModal.close();
      activeBanishSession = null;
    }
  };
}

// Poster Uploader modal handling logic
let activePosterRatingKey = null;
let selectedMatch = null;

async function openPosterModal(ratingKey, title) {
  activePosterRatingKey = ratingKey;
  selectedMatch = null;

  const posterUrlInput = document.getElementById('poster-url');
  const posterPreviewImg = document.getElementById('poster-preview-img');
  const posterPreviewPlaceholder = document.getElementById('poster-preview-placeholder');
  const posterModalDetails = document.getElementById('poster-modal-details');
  const posterMatchesLoading = document.getElementById('poster-matches-loading');
  const posterMatchesList = document.getElementById('poster-matches-list');
  const posterModal = document.getElementById('poster-modal');

  if (posterUrlInput) posterUrlInput.value = '';
  if (posterPreviewImg) {
    posterPreviewImg.src = '';
    posterPreviewImg.style.display = 'none';
  }
  if (posterPreviewPlaceholder) {
    posterPreviewPlaceholder.style.display = 'block';
    posterPreviewPlaceholder.textContent = 'No Preview Available';
  }
  if (posterModalDetails) {
    posterModalDetails.innerHTML = `Title: <strong>${title}</strong> (ID: ${ratingKey})`;
  }
  
  if (posterMatchesLoading) posterMatchesLoading.style.display = 'block';
  if (posterMatchesList) posterMatchesList.innerHTML = '';
  
  if (posterModal) {
    posterModal.showModal();
  } else {
    console.error('Poster modal dialog element not found in DOM');
    return;
  }

  try {
    const res = await fetch(`/api/plex/metadata/matches?ratingKey=${ratingKey}`);
    const data = await res.json();
    
    if (posterMatchesLoading) posterMatchesLoading.style.display = 'none';
    
    if (data.success && data.matches && data.matches.length > 0) {
      if (posterMatchesList) {
        data.matches.forEach(match => {
          const itemDiv = document.createElement('div');
          itemDiv.className = 'poster-match-item';
          itemDiv.style.display = 'flex';
          itemDiv.style.justifyContent = 'space-between';
          itemDiv.style.alignItems = 'center';
          
          const thumbUrl = match.thumb || '';
          
          itemDiv.innerHTML = `
            <span><strong>${match.name}</strong> ${match.year ? `(${match.year})` : ''}</span>
            <span style="font-size: 11px; color: var(--plex-orange); font-weight: 600;">Select</span>
          `;
          
          itemDiv.onclick = () => {
            posterMatchesList.querySelectorAll('.poster-match-item').forEach(el => el.classList.remove('active'));
            itemDiv.classList.add('active');
            
            selectedMatch = {
              guid: match.guid,
              name: match.name,
              thumb: thumbUrl
            };
            
            if (posterUrlInput) posterUrlInput.value = '';
            
            if (thumbUrl && posterPreviewImg && posterPreviewPlaceholder) {
              posterPreviewImg.src = thumbUrl;
              posterPreviewImg.style.display = 'block';
              posterPreviewPlaceholder.style.display = 'none';
            } else if (posterPreviewImg && posterPreviewPlaceholder) {
              posterPreviewImg.src = '';
              posterPreviewImg.style.display = 'none';
              posterPreviewPlaceholder.style.display = 'block';
              posterPreviewPlaceholder.textContent = 'Preview Not Available (No match artwork)';
            }
          };
          
          posterMatchesList.appendChild(itemDiv);
        });
      }
    } else if (posterMatchesList) {
      posterMatchesList.innerHTML = '<div style="color: var(--text-muted); font-size: 12px; padding: 8px; text-align: center;">No matches returned from Plex.</div>';
    }
  } catch (err) {
    if (posterMatchesLoading) posterMatchesLoading.style.display = 'none';
    if (posterMatchesList) {
      posterMatchesList.innerHTML = '<div style="color: var(--status-danger); font-size: 12px; padding: 8px; text-align: center;">Error querying matches from server.</div>';
    }
  }

  // Query and render available artwork options
  const posterOptionsLoading = document.getElementById('poster-options-loading');
  const posterOptionsList = document.getElementById('poster-options-list');

  if (posterOptionsLoading) posterOptionsLoading.style.display = 'block';
  if (posterOptionsList) posterOptionsList.innerHTML = '';

  try {
    const pRes = await fetch(`/api/plex/metadata/posters?ratingKey=${ratingKey}`);
    const pData = await pRes.json();
    
    if (posterOptionsLoading) posterOptionsLoading.style.display = 'none';

    if (pData.success && pData.posters && pData.posters.length > 0) {
      if (posterOptionsList) {
        pData.posters.forEach(poster => {
          let thumbSrc = poster.thumb;
          if (thumbSrc && thumbSrc.startsWith('/')) {
            const rawUrl = state.config?.plex?.url || 'http://localhost:32400';
            const plexUrl = rawUrl.replace(/\/+:/, ':').replace(/\/+$/, '');
            thumbSrc = `${plexUrl}${thumbSrc}?X-Plex-Token=${state.config?.plex?.token}`;
          }

          const img = document.createElement('img');
          img.src = thumbSrc || '';
          img.alt = 'Poster option';
          img.style.height = '100px';
          img.style.width = '67px';
          img.style.objectFit = 'cover';
          img.style.borderRadius = 'var(--radius-sm)';
          img.style.cursor = 'pointer';
          img.style.border = poster.selected ? '2px solid var(--plex-orange)' : '2px solid transparent';
          img.style.transition = 'transform 0.1s ease, border-color 0.1s ease';

          // Set default preview if currently selected
          if (poster.selected && posterPreviewImg && posterPreviewPlaceholder) {
            posterPreviewImg.src = thumbSrc;
            posterPreviewImg.style.display = 'block';
            posterPreviewPlaceholder.style.display = 'none';
            if (posterUrlInput) posterUrlInput.value = poster.key;
          }

          img.onclick = () => {
            posterOptionsList.querySelectorAll('img').forEach(el => {
              el.style.border = '2px solid transparent';
            });
            img.style.border = '2px solid var(--plex-orange)';
            
            selectedMatch = null;
            if (posterUrlInput) posterUrlInput.value = poster.key;

            if (posterPreviewImg && posterPreviewPlaceholder) {
              posterPreviewImg.src = thumbSrc;
              posterPreviewImg.style.display = 'block';
              posterPreviewPlaceholder.style.display = 'none';
            }
          };

          posterOptionsList.appendChild(img);
        });
      }
    } else if (posterOptionsList) {
      posterOptionsList.innerHTML = '<div style="color: var(--text-muted); font-size: 12px; padding: 8px;">No official artwork options available.</div>';
    }
  } catch (err) {
    if (posterOptionsLoading) posterOptionsLoading.style.display = 'none';
    if (posterOptionsList) {
      posterOptionsList.innerHTML = '<div style="color: var(--status-danger); font-size: 12px; padding: 8px;">Error querying artwork options.</div>';
    }
  }
}

function setupPosterModalHandlers() {
  const btnPosterCancel = document.getElementById('btn-poster-cancel');
  const btnPosterConfirm = document.getElementById('btn-poster-confirm');
  const posterUrlInput = document.getElementById('poster-url');
  const posterModal = document.getElementById('poster-modal');
  const posterMatchesList = document.getElementById('poster-matches-list');
  const posterPreviewImg = document.getElementById('poster-preview-img');
  const posterPreviewPlaceholder = document.getElementById('poster-preview-placeholder');

  if (btnPosterCancel && posterModal) {
    btnPosterCancel.onclick = () => {
      posterModal.close();
      activePosterRatingKey = null;
      selectedMatch = null;
    };
  }

  if (posterUrlInput) {
    posterUrlInput.oninput = () => {
      if (posterMatchesList) {
        posterMatchesList.querySelectorAll('.poster-match-item').forEach(el => el.classList.remove('active'));
      }
      const posterOptionsList = document.getElementById('poster-options-list');
      if (posterOptionsList) {
        posterOptionsList.querySelectorAll('img').forEach(el => el.style.border = '2px solid transparent');
      }
      selectedMatch = null;
      
      const url = posterUrlInput.value.trim();
      if (url && posterPreviewImg && posterPreviewPlaceholder) {
        posterPreviewImg.src = url;
        posterPreviewImg.style.display = 'block';
        posterPreviewPlaceholder.style.display = 'none';
      } else if (posterPreviewImg && posterPreviewPlaceholder) {
        posterPreviewImg.src = '';
        posterPreviewImg.style.display = 'none';
        posterPreviewPlaceholder.style.display = 'block';
        posterPreviewPlaceholder.textContent = 'No Preview Available';
      }
    };
  }

  if (btnPosterConfirm) {
    btnPosterConfirm.onclick = async () => {
      if (!activePosterRatingKey) return;
      
      const ratingKey = activePosterRatingKey;
      let urlEndpoint = '';
      let requestBody = {};
      
      if (selectedMatch) {
        urlEndpoint = '/api/plex/metadata/match';
        requestBody = {
          ratingKey,
          guid: selectedMatch.guid,
          name: selectedMatch.name
        };
      } else {
        const posterUrl = posterUrlInput ? posterUrlInput.value.trim() : '';
        if (!posterUrl) {
          showToast('Please select a match option or paste a custom URL', true);
          return;
        }
        urlEndpoint = '/api/plex/metadata/poster';
        requestBody = { ratingKey, posterUrl };
      }
      
      btnPosterConfirm.disabled = true;
      btnPosterConfirm.textContent = 'Updating...';
      
      try {
        const res = await fetch(urlEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });
        const data = await res.json();
        
        if (data.success) {
          showToast(data.message);
          if (posterModal) posterModal.close();
          await loadAudit();
        } else {
          showToast(data.message || 'Failed to update', true);
        }
      } catch (err) {
        showToast('Error performing poster upload', true);
      } finally {
        btnPosterConfirm.disabled = false;
        btnPosterConfirm.textContent = 'Update Poster';
        activePosterRatingKey = null;
        selectedMatch = null;
      }
    };
  }
}
