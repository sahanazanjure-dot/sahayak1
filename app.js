/**
 * Sahayak — Community Volunteer Coordination Platform
 * Core Application Engine & Reactive State Store
 */

(function () {
  'use strict';

  // Deep clone initial state so we can mutate safely
  const state = {
    currentRole: 'volunteer', // 'volunteer' | 'ngo' | 'organizer'
    currentUser: JSON.parse(JSON.stringify(INITIAL_DATA.currentUser)),
    ngoUser: JSON.parse(JSON.stringify(INITIAL_DATA.ngoUser)),
    opportunities: JSON.parse(JSON.stringify(INITIAL_DATA.opportunities)),
    activeDeployment: JSON.parse(JSON.stringify(INITIAL_DATA.activeDeployment)),
    ngoVolunteers: JSON.parse(JSON.stringify(INITIAL_DATA.ngoVolunteers)),
    emergencyAlerts: JSON.parse(JSON.stringify(INITIAL_DATA.emergencyAlerts)),
    ngoEvents: JSON.parse(JSON.stringify(INITIAL_DATA.ngoEvents)),
    analytics: JSON.parse(JSON.stringify(INITIAL_DATA.analytics)),
    settings: JSON.parse(JSON.stringify(INITIAL_DATA.settings)),

    // Navigation state
    activePage: 'dashboard', // dashboard, profile, opportunities, smart-match, event-details, deployments, emergency, analytics, settings, ngo-volunteers
    selectedEventId: 'opp-med-01',
    isLoggedIn: false,

    // Demo Stepper Step index (0 - 9)
    currentDemoStep: 0,

    // Volunteer management filter state
    volunteerFilter: {
      search: '',
      status: 'ALL'
    }
  };

  // Demo Walkthrough Definition
  const DEMO_STEPS = [
    { id: 'auth', label: '1. Login', page: 'auth' },
    { id: 'profile', label: '2. Profile', page: 'profile' },
    { id: 'dashboard', label: '3. Dashboard', page: 'dashboard' },
    { id: 'smart-match', label: '4. Smart Match (92%)', page: 'smart-match' },
    { id: 'event-details', label: '5. Event Details', page: 'event-details' },
    { id: 'accept', label: '6. Accept Opp', page: 'event-details' },
    { id: 'deployments', label: '7. Deployment', page: 'deployments' },
    { id: 'check-in', label: '8. Check In (DEPLOYED)', page: 'deployments' },
    { id: 'check-out', label: '9. Check Out (COMPLETED)', page: 'deployments' }
  ];

  /* ========================================================
     NAVIGATION & VIEW CONTROLLER
  ======================================================== */

  function navigateTo(pageId, params = {}) {
    if (params.eventId) {
      state.selectedEventId = params.eventId;
    }
    state.activePage = pageId;

    // Update demo step tracker if matching
    updateDemoStepFromPage(pageId);

    renderApp();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function updateDemoStepFromPage(pageId) {
    if (!state.isLoggedIn) {
      state.currentDemoStep = 0;
      return;
    }
    if (pageId === 'profile') state.currentDemoStep = 1;
    else if (pageId === 'dashboard') state.currentDemoStep = 2;
    else if (pageId === 'smart-match') state.currentDemoStep = 3;
    else if (pageId === 'event-details') state.currentDemoStep = 4;
    else if (pageId === 'deployments') {
      if (state.activeDeployment.status === 'COMPLETED') state.currentDemoStep = 8;
      else if (state.activeDeployment.status === 'DEPLOYED') state.currentDemoStep = 7;
      else state.currentDemoStep = 6;
    }
  }

  /* ========================================================
     AUTHENTICATION & USER REGISTRY (REGISTRATION FIRST)
  ======================================================== */
  const STORAGE_KEY_REGISTERED_USERS = 'sahayak_registered_users';

  function getRegisteredUsers() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_REGISTERED_USERS);
      if (data) return JSON.parse(data);
    } catch (e) {}
    // Seed initial demo records so existing test users can also sign in
    const initialUsers = [
      {
        id: 'vol-rahul-01',
        name: 'Rahul Sharma',
        email: 'rahul.sharma@volunteer.in',
        password: 'password123',
        role: 'volunteer',
        mobile: '+91 98204 88321',
        location: 'Andheri West, Mumbai',
        skills: [{ name: 'First Aid & CPR', level: 'Expert', verified: true }, { name: 'Emergency Triage', level: 'Advanced', verified: true }],
        availability: 'Weekends & Weekday Evenings (15 hrs/week)',
        bio: 'Certified First Aid provider with 3+ years active field service.'
      },
      {
        id: 'ngo-helping-hands',
        name: 'Helping Hands Foundation',
        email: 'coordination@helpinghands.ngo',
        password: 'password123',
        role: 'ngo',
        mobile: '+91 22 2650 9988',
        location: 'Bandra Kurla Complex, Mumbai',
        sector: 'Healthcare & Relief',
        regNumber: 'MH/2018/NGO-004821'
      }
    ];
    try {
      localStorage.setItem(STORAGE_KEY_REGISTERED_USERS, JSON.stringify(initialUsers));
    } catch (e) {}
    return initialUsers;
  }

  function findRegisteredUser(email) {
    if (!email) return null;
    const users = getRegisteredUsers();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  function saveRegisteredUser(userObj) {
    const users = getRegisteredUsers();
    const existingIdx = users.findIndex(u => u.email.toLowerCase() === userObj.email.toLowerCase());
    if (existingIdx >= 0) {
      users[existingIdx] = { ...users[existingIdx], ...userObj };
    } else {
      users.push(userObj);
    }
    try {
      localStorage.setItem(STORAGE_KEY_REGISTERED_USERS, JSON.stringify(users));
    } catch (e) {}
  }

  let authMode = 'signin'; // 'signin' | 'signup'

  function setAuthMode(mode) {
    authMode = mode;
    const tabSignin = document.getElementById('tab-mode-signin');
    const tabSignup = document.getElementById('tab-mode-signup');
    const groupName = document.getElementById('group-auth-name');
    const submitBtn = document.getElementById('btn-login-submit');
    const errBanner = document.getElementById('auth-error-banner');
    if (errBanner) errBanner.style.display = 'none';

    if (mode === 'signup') {
      if (tabSignin) {
        tabSignin.className = 'btn btn-sm btn-secondary';
        tabSignin.style.background = 'transparent';
        tabSignin.style.color = 'var(--neutral-600)';
      }
      if (tabSignup) {
        tabSignup.className = 'btn btn-sm btn-primary';
        tabSignup.style.background = 'var(--primary-600)';
        tabSignup.style.color = '#fff';
      }
      if (groupName) groupName.style.display = 'block';
      if (submitBtn) submitBtn.textContent = 'Create Account & Join Sahayak';
    } else {
      if (tabSignin) {
        tabSignin.className = 'btn btn-sm btn-primary';
        tabSignin.style.background = 'var(--primary-600)';
        tabSignin.style.color = '#fff';
      }
      if (tabSignup) {
        tabSignup.className = 'btn btn-sm btn-secondary';
        tabSignup.style.background = 'transparent';
        tabSignup.style.color = 'var(--neutral-600)';
      }
      if (groupName) groupName.style.display = 'none';
      if (submitBtn) submitBtn.textContent = 'Sign In to Sahayak';
    }
  }

  function applyUserData(displayName, email, role, extra = {}) {
    const rawName = displayName || (email ? email.split('@')[0] : 'Volunteer');
    const formattedName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
    
    if (role === 'ngo') {
      state.currentRole = 'ngo';
      state.ngoUser.name = formattedName.includes(' ') || formattedName.toLowerCase().includes('ngo') || formattedName.toLowerCase().includes('foundation') ? formattedName : `${formattedName} Relief Org`;
      state.ngoUser.email = email || 'coordination@helpinghands.ngo';
      state.ngoUser.avatar = formattedName.slice(0, 2).toUpperCase();
      if (extra.location) state.ngoUser.location = extra.location;
      if (extra.mobile) state.ngoUser.mobile = extra.mobile;
      if (extra.regNumber) state.ngoUser.regNumber = extra.regNumber;
    } else {
      state.currentRole = role || 'volunteer';
      state.currentUser.name = formattedName;
      state.currentUser.email = email || 'volunteer@sahayak.in';
      state.currentUser.avatar = formattedName.slice(0, 2).toUpperCase();
      if (extra.location) state.currentUser.location = extra.location;
      if (extra.skills && extra.skills.length) state.currentUser.skills = extra.skills;
      if (extra.mobile) state.currentUser.mobile = extra.mobile;
      if (extra.bio) state.currentUser.bio = extra.bio;
      if (extra.availability) state.currentUser.availability = extra.availability;
      if (state.activeDeployment) {
        state.activeDeployment.volunteerName = formattedName;
      }
    }
  }

  async function handleAuthSubmit() {
    const emailInput = document.getElementById('auth-email');
    const passInput = document.getElementById('auth-password');
    const nameInput = document.getElementById('auth-name');
    const submitBtn = document.getElementById('btn-login-submit');
    const errBanner = document.getElementById('auth-error-banner');
    if (errBanner) errBanner.style.display = 'none';

    const email = (emailInput?.value || '').trim();
    const password = (passInput?.value || '').trim();
    const name = (nameInput?.value || '').trim();

    if (!email) {
      showToast('Please enter an email address.', 'danger');
      return;
    }
    if (!password || password.length < 6) {
      showToast('Please enter a password with at least 6 characters.', 'danger');
      return;
    }

    const prevBtnText = submitBtn ? submitBtn.textContent : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = authMode === 'signup' ? 'Registering Account...' : 'Verifying Account...';
    }

    try {
      if (authMode === 'signup') {
        const displayName = name || (email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1));

        // Check if already registered
        const existing = findRegisteredUser(email);
        if (existing) {
          showToast(`An account with ${email} is already registered. Please Sign In.`, 'danger');
          if (errBanner) {
            errBanner.innerHTML = `⚠️ An account with <strong>${email}</strong> is already registered. Please sign in with your password.`;
            errBanner.style.display = 'block';
          }
          return;
        }

        const newUserRecord = {
          id: `usr-${Date.now()}`,
          name: displayName,
          email: email,
          password: password,
          role: state.currentRole,
          mobile: '+91 98200 00000',
          location: 'Mumbai, Maharashtra',
          registeredAt: new Date().toISOString()
        };

        saveRegisteredUser(newUserRecord);

        if (window.SahayakDB && window.SahayakDB.isConfigured()) {
          try {
            await window.SahayakDB.signUp({
              email,
              password,
              name: displayName,
              role: state.currentRole,
              mobile: '+91 98200 00000'
            });
          } catch (e) {}
        }

        applyUserData(displayName, email, state.currentRole, newUserRecord);
        showToast(`Registration complete for ${displayName}! Welcome to Sahayak.`, 'success');
        handleLogin();
      } else {
        // Sign In Mode: STRICT VERIFICATION — USER MUST BE REGISTERED FIRST
        const existingUser = findRegisteredUser(email);

        let supabaseUser = null;
        if (window.SahayakDB && window.SahayakDB.isConfigured()) {
          try {
            const res = await window.SahayakDB.signIn({ email, password });
            if (res && res.user) {
              supabaseUser = res.user;
            }
          } catch (sbErr) {}
        }

        // If not registered in either Supabase or Local Registry -> BLOCK LOGIN
        if (!existingUser && !supabaseUser) {
          showToast(`❌ Account not found. You must register first before logging in.`, 'danger');
          if (errBanner) {
            errBanner.innerHTML = `
              <div style="font-weight: 800; margin-bottom: 4px;">⚠️ Access Denied: Unregistered Account</div>
              <div>No registered account found for <strong>${email}</strong>. New users must complete the registration form before logging in.</div>
              <div style="display: flex; gap: 8px; margin-top: 8px;">
                <button type="button" class="btn btn-sm btn-primary" style="padding: 4px 10px; font-size: 0.75rem; background: #2563eb; border: none;" onclick="window.SahayakApp.openVolunteerEnrollmentModal();">
                  🤝 Register as Volunteer
                </button>
                <button type="button" class="btn btn-sm btn-primary" style="padding: 4px 10px; font-size: 0.75rem; background: #059669; border: none;" onclick="window.SahayakApp.openNgoEnrollmentModal();">
                  🏢 Register as NGO
                </button>
              </div>
            `;
            errBanner.style.display = 'block';
          }
          return;
        }

        // Verify password if local user record exists
        if (existingUser && existingUser.password && existingUser.password !== password) {
          showToast(`❌ Incorrect password for ${email}. Please check your credentials.`, 'danger');
          if (errBanner) {
            errBanner.innerHTML = `❌ Incorrect password for <strong>${email}</strong>. Please enter the password you used during registration.`;
            errBanner.style.display = 'block';
          }
          return;
        }

        // Account is verified!
        const resolvedRole = existingUser?.role || supabaseUser?.user_metadata?.role || state.currentRole;
        const resolvedName = existingUser?.name || supabaseUser?.user_metadata?.name || (email.split('@')[0]);

        applyUserData(resolvedName, email, resolvedRole, existingUser || {});
        showToast(`Welcome back, ${resolvedName}! Logged in successfully.`, 'success');
        handleLogin();
      }
    } catch (err) {
      console.error('Auth operation error:', err);
      showToast(err.message || 'Authentication error. Please try again.', 'danger');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = prevBtnText;
      }
    }
  }

  async function handleForgotPassword() {
    const emailInput = document.getElementById('auth-email');
    const email = (emailInput?.value || '').trim();

    if (!email) {
      showToast('Please enter your email address first to reset password.', 'danger');
      return;
    }

    try {
      if (window.SahayakDB && window.SahayakDB.isConfigured()) {
        await window.SahayakDB.resetPassword(email);
        showToast(`Password reset link dispatched to ${email}`, 'success');
      } else {
        showToast(`Reset instructions sent to ${email}`, 'primary');
      }
    } catch (err) {
      showToast(err.message || 'Could not send reset email.', 'danger');
    }
  }

  function handleLogin() {
    state.isLoggedIn = true;
    document.getElementById('view-auth').style.display = 'none';
    document.getElementById('main-app-shell').style.display = 'flex';
    document.getElementById('demo-tour-bar').style.display = 'flex';

    showToast(`Welcome back, ${state.currentRole === 'volunteer' ? state.currentUser.name : state.ngoUser.name}! GPS location synchronized.`, 'success');
    
    // By default, start at Volunteer Dashboard or NGO Dashboard based on role
    state.activePage = state.currentRole === 'ngo' ? 'ngo-dashboard' : 'dashboard';
    renderApp();
  }

  function quickLoginAs(role) {
    state.currentRole = role;
    if (role === 'volunteer') {
      applyUserData('Rahul Sharma', 'rahul.sharma@volunteer.in', 'volunteer');
    } else if (role === 'ngo') {
      applyUserData('Helping Hands Foundation', 'coordination@helpinghands.ngo', 'ngo');
    } else {
      applyUserData('Relief Mesh Org', 'organizer@reliefmesh.org', 'organizer');
    }
    handleLogin();
  }

  async function logout() {
    state.isLoggedIn = false;
    if (window.SahayakDB && window.SahayakDB.signOut) {
      try {
        await window.SahayakDB.signOut();
      } catch (e) {
        console.warn('Sign out error:', e);
      }
    }
    document.getElementById('view-auth').style.display = 'flex';
    document.getElementById('main-app-shell').style.display = 'none';
    document.getElementById('demo-tour-bar').style.display = 'none';
    showToast('Signed out of Sahayak session.', 'neutral');
  }

  function toggleRole() {
    state.currentRole = state.currentRole === 'volunteer' ? 'ngo' : 'volunteer';
    state.activePage = state.currentRole === 'ngo' ? 'ngo-dashboard' : 'dashboard';
    showToast(`Switched view to ${state.currentRole === 'volunteer' ? 'Volunteer Mode (Rahul Sharma)' : 'NGO Coordinator Mode (Helping Hands)'}`, 'primary');
    renderApp();
  }

  /* ========================================================
     TOAST NOTIFICATIONS
  ======================================================== */
  function showToast(message, type = 'primary') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    } else if (type === 'danger') {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
    } else {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
    }

    toast.innerHTML = `
      ${iconSvg}
      <div style="flex:1;">${message}</div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  /* ========================================================
     MODALS CONTROLLER
  ======================================================== */
  function openModal(contentHtml) {
    const overlay = document.getElementById('modal-container');
    overlay.innerHTML = contentHtml;
    overlay.classList.add('active');
  }

  function closeModal() {
    const overlay = document.getElementById('modal-container');
    overlay.classList.remove('active');
  }

  /* ========================================================
     RENDER SHELL & SIDEBAR NAVIGATION
  ======================================================== */
  function renderApp() {
    renderSidebar();
    renderTopbar();
    renderDemoTourBar();
    renderPageContent();
  }

  function renderDemoTourBar() {
    const track = document.getElementById('demo-steps-container');
    if (!track) return;

    track.innerHTML = DEMO_STEPS.map((step, idx) => {
      const isActive = idx === state.currentDemoStep;
      return `
        <button class="demo-step-chip ${isActive ? 'active' : ''}" onclick="window.SahayakApp.handleDemoStepClick(${idx});">
          <span>${step.label}</span>
        </button>
        ${idx < DEMO_STEPS.length - 1 ? '<span class="demo-step-arrow">→</span>' : ''}
      `;
    }).join('');
  }

  function handleDemoStepClick(idx) {
    state.currentDemoStep = idx;
    if (idx === 0) {
      logout();
      return;
    }
    if (!state.isLoggedIn) {
      handleLogin();
    }

    const step = DEMO_STEPS[idx];
    if (step.id === 'profile') navigateTo('profile');
    else if (step.id === 'dashboard') navigateTo('dashboard');
    else if (step.id === 'smart-match') navigateTo('smart-match');
    else if (step.id === 'event-details') navigateTo('event-details', { eventId: 'opp-med-01' });
    else if (step.id === 'accept') {
      acceptOpportunity('opp-med-01');
    }
    else if (step.id === 'deployments') navigateTo('deployments');
    else if (step.id === 'check-in') {
      navigateTo('deployments');
      if (state.activeDeployment.status === 'MATCHED') {
        openLivePhotoClockInModal();
      }
    }
    else if (step.id === 'check-out') {
      navigateTo('deployments');
      if (state.activeDeployment.status === 'DEPLOYED') {
        openConcludeShiftModal();
      }
    }
  }

  function checkInDeployment() {
    openLivePhotoClockInModal();
  }

  function checkOutDeployment() {
    openConcludeShiftModal();
  }

  function renderTopbar() {
    const titleElem = document.getElementById('breadcrumb-page-title');
    const pageLabels = {
      'dashboard': 'Volunteer Dashboard',
      'profile': 'Volunteer Profile',
      'opportunities': 'Explore Opportunities',
      'smart-match': 'AI Smart Matching',
      'event-details': 'Opportunity Details',
      'deployments': 'Deployment Tracking',
      'emergency': 'Emergency Response Center',
      'analytics': 'Impact Analytics',
      'settings': 'Settings & Preferences',
      'ngo-dashboard': 'NGO Coordinator Dashboard',
      'ngo-volunteers': 'Volunteer Roster Management'
    };
    if (titleElem) {
      titleElem.textContent = pageLabels[state.activePage] || 'Dashboard';
    }

    // Topbar deployment badge update
    const deployBadge = document.getElementById('topbar-deploy-badge');
    if (deployBadge) {
      const status = state.activeDeployment.status;
      deployBadge.textContent = `Shift: ${status}`;
      deployBadge.className = status === 'DEPLOYED' ? 'badge badge-success' :
                              status === 'COMPLETED' ? 'badge badge-neutral' : 'badge badge-primary';
    }

    // Role switcher link
    const rolePill = document.getElementById('sidebar-role-pill');
    if (rolePill) {
      if (state.currentRole === 'volunteer') {
        rolePill.className = 'role-pill-badge volunteer';
        rolePill.textContent = '● Volunteer View';
      } else {
        rolePill.className = 'role-pill-badge ngo';
        rolePill.textContent = '🏢 NGO Coordinator';
      }
    }

    const userAvatar = document.getElementById('sidebar-user-avatar');
    const userName = document.getElementById('sidebar-user-name');
    const userRole = document.getElementById('sidebar-user-role');
    if (state.currentRole === 'volunteer') {
      userAvatar.textContent = state.currentUser.avatar;
      userName.textContent = state.currentUser.name;
      userRole.textContent = "Verified First Responder";
    } else {
      userAvatar.textContent = state.ngoUser.avatar;
      userName.textContent = state.ngoUser.name;
      userRole.textContent = "NGO Administrator";
    }
  }

  function renderSidebar() {
    const nav = document.getElementById('sidebar-nav-links');
    if (!nav) return;

    let items = [];

    if (state.currentRole === 'volunteer') {
      items = [
        { id: 'dashboard', label: 'Dashboard', icon: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>' },
        { id: 'profile', label: 'My Profile', icon: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>' },
        { id: 'opportunities', label: 'Opportunities', icon: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>' },
        { id: 'smart-match', label: 'Smart Match', badge: '92% AI', badgeClass: 'badge-ai', icon: '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline><path d="M8 12h.01M16 12h.01"></path>' },
        { id: 'deployments', label: 'Deployments', badge: state.activeDeployment.status, badgeClass: state.activeDeployment.status === 'DEPLOYED' ? 'badge-success' : 'badge-primary', icon: '<polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline>' },
        { id: 'emergency', label: 'Emergency', badge: '1 SOS', badgeClass: 'pulse-danger', icon: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>' },
        { id: 'analytics', label: 'Analytics', icon: '<line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line>' },
        { id: 'settings', label: 'Settings', icon: '<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>' }
      ];
    } else {
      // NGO View items
      items = [
        { id: 'ngo-dashboard', label: 'Dashboard', icon: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>' },
        { id: 'opportunities', label: 'Events & Drives', icon: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>' },
        { id: 'ngo-volunteers', label: 'Volunteers Roster', badge: '8 Active', badgeClass: 'badge-primary', icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>' },
        { id: 'smart-match', label: 'Matching Engine', icon: '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline>' },
        { id: 'deployments', label: 'Deployments', badge: '14 On-ground', badgeClass: 'badge-success', icon: '<polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline>' },
        { id: 'emergency', label: 'Emergency Center', badge: 'BROADCAST', badgeClass: 'pulse-danger', icon: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>' },
        { id: 'analytics', label: 'Analytics', icon: '<line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line>' },
        { id: 'settings', label: 'NGO Settings', icon: '<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>' }
      ];
    }

    nav.innerHTML = `
      <div class="nav-section-title">Navigation</div>
      ${items.map(item => `
        <div class="nav-item ${state.activePage === item.id ? 'active' : ''}" onclick="window.SahayakApp.navigateTo('${item.id}');">
          <span class="nav-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              ${item.icon}
            </svg>
          </span>
          <span>${item.label}</span>
          ${item.badge ? `<span class="nav-badge ${item.badgeClass || 'badge-primary'}">${item.badge}</span>` : ''}
        </div>
      `).join('')}
    `;
  }

  /* ========================================================
     MAIN CONTENT DISPATCHER
  ======================================================== */
  function renderPageContent() {
    const container = document.getElementById('content-container');
    if (!container) return;

    switch (state.activePage) {
      case 'dashboard':
        container.innerHTML = state.currentRole === 'ngo' ? renderNgoDashboard() : renderVolunteerDashboard();
        break;
      case 'profile':
        container.innerHTML = renderVolunteerProfile();
        break;
      case 'opportunities':
        container.innerHTML = renderOpportunitiesPage();
        break;
      case 'smart-match':
        container.innerHTML = state.currentRole === 'ngo' ? renderNgoSmartMatchEngine() : renderSmartMatchPage();
        break;
      case 'event-details':
        container.innerHTML = renderEventDetailsPage(state.selectedEventId);
        break;
      case 'deployments':
        container.innerHTML = state.currentRole === 'ngo' ? renderNgoDeploymentsPage() : renderDeploymentTrackingPage();
        break;
      case 'ngo-dashboard':
        container.innerHTML = renderNgoDashboard();
        break;
      case 'ngo-volunteers':
        container.innerHTML = renderVolunteerManagementPage();
        break;
      case 'emergency':
        container.innerHTML = renderEmergencyCenterPage();
        break;
      case 'analytics':
        container.innerHTML = renderAnalyticsPage();
        break;
      case 'settings':
        container.innerHTML = renderSettingsPage();
        break;
      default:
        container.innerHTML = state.currentRole === 'ngo' ? renderNgoDashboard() : renderVolunteerDashboard();
    }
  }

  /* ========================================================
     OPPORTUNITY NORMALIZER & DYNAMIC AI MATCH ENGINE
  ======================================================== */
  function normalizeOpportunity(opp, user = state.currentUser) {
    if (!opp) return opp;
    const distance = parseFloat(opp.distanceKm || opp.distance_km || 2.4);
    const required = parseInt(opp.volunteersRequired || opp.volunteers_needed || opp.volunteersNeeded || 20);
    const matched = parseInt(opp.volunteersMatched || opp.volunteers_registered || opp.volunteersRegistered || 12);
    const shift = opp.shiftTime || opp.shift_time || opp.time || '4:00 PM – 8:00 PM';
    
    // Dynamic Match score calculation
    let calculatedScore = opp.matchScore || opp.match_score;
    if (!calculatedScore || isNaN(calculatedScore)) {
      const oppSkills = opp.requiredSkills || opp.required_skills || [];
      const userSkills = (user?.skills || []).map(s => (typeof s === 'string' ? s : s.name).toLowerCase());
      const matchingCount = oppSkills.filter(s => userSkills.some(us => us.includes(s.toLowerCase()) || s.toLowerCase().includes(us))).length;
      
      const skillScore = oppSkills.length ? Math.min(100, Math.round((matchingCount / oppSkills.length) * 100) + 30) : 92;
      const distScore = distance <= (user?.maxTravelRadiusKm || 12) ? 95 : 75;
      calculatedScore = Math.min(99, Math.round(skillScore * 0.6 + distScore * 0.4));
      if (opp.id === 'opp-med-01' && (!calculatedScore || calculatedScore < 85)) calculatedScore = 92;
    }

    return {
      ...opp,
      distanceKm: distance,
      volunteersRequired: required,
      volunteersMatched: matched,
      shiftTime: shift,
      matchScore: calculatedScore || 92,
      requiredSkills: opp.requiredSkills || opp.required_skills || ["First Aid & CPR", "Crowd Management"],
      matchBreakdown: opp.matchBreakdown || {
        skills: { score: 96, label: "First Aid & Emergency Triage match event needs" },
        availability: { score: 95, label: "Matches your active availability slots" },
        location: { score: 90, label: `${distance} km away (within preferred radius)` },
        experience: { score: 88, label: "Matches your volunteer service experience" }
      },
      matchExplanation: opp.matchExplanation || "Recommended because your skills, availability, and geo-location match the event requirements.",
      team: opp.team || [
        { name: "Ananya Sen", role: "Team Lead & First Aid", status: "Ready", avatar: "AS" },
        { name: "Rohan Patel", role: "Crowd Management", status: "Ready", avatar: "RP" }
      ]
    };
  }

  /* ========================================================
     1. VOLUNTEER DASHBOARD — MAIN SCREEN
  ======================================================== */
  function renderVolunteerDashboard() {
    const user = state.currentUser;
    const rawMedOpp = state.opportunities.find(o => o.id === 'opp-med-01') || state.opportunities[0];
    const medOpp = normalizeOpportunity(rawMedOpp, user);
    const otherOpps = state.opportunities.filter(o => o.id !== (rawMedOpp?.id || 'opp-med-01')).map(o => normalizeOpportunity(o, user));

    return `
      <!-- WELCOME HERO BANNER -->
      <section class="welcome-hero">
        <div>
          <h1 class="welcome-title">Good Morning, ${user.name.split(' ')[0]} 👋</h1>
          <p class="welcome-subtitle">Here are the opportunities that match your skills and availability.</p>
        </div>
        <div class="welcome-metrics">
          <div class="welcome-metric-item">
            <div class="welcome-metric-val">${user.reliabilityScore}%</div>
            <div class="welcome-metric-lbl">Reliability</div>
          </div>
          <div class="welcome-metric-item">
            <div class="welcome-metric-val">${user.totalVolunteerHours}h</div>
            <div class="welcome-metric-lbl">Total Hours</div>
          </div>
          <div class="welcome-metric-item">
            <div class="welcome-metric-val">${user.completedEvents}</div>
            <div class="welcome-metric-lbl">Drives Done</div>
          </div>
        </div>
      </section>

      <!-- ACTIVE EMERGENCY ALERT BANNER -->
      ${state.emergencyAlerts.length > 0 ? `
        <div class="emergency-banner-alert">
          <div class="emergency-banner-left">
            <div class="emergency-siren-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>
            <div>
              <div class="emergency-banner-title">EMERGENCY ALERT: ${state.emergencyAlerts[0].title}</div>
              <div class="emergency-banner-desc">Urgent volunteer mobilization underway in ${state.emergencyAlerts[0].location}. Required: First Aid &amp; Crowd Management.</div>
            </div>
          </div>
          <button class="btn btn-sm btn-danger" onclick="window.SahayakApp.navigateTo('emergency');">
            View SOS Response →
          </button>
        </div>
      ` : ''}

      <!-- MAIN DASHBOARD SPLIT GRID -->
      <div class="dashboard-grid">
        
        <!-- LEFT COLUMN: RECOMMENDED & NEARBY OPPORTUNITIES -->
        <div style="display: flex; flex-direction: column; gap: 24px;">
          
          <!-- 1. HIGH PRIORITY RECOMMENDED OPPORTUNITY CARD (MEDICAL RELIEF CAMP) -->
          <div>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
              <h2 style="font-size: 1.15rem; font-weight: 800; color: var(--primary-900); display: flex; align-items: center; gap: 8px;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary-800)" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                Recommended Opportunity
              </h2>
              <span class="badge badge-ai">⚡ AI Top Choice</span>
            </div>

            <div class="opportunity-card featured">
              <div class="opp-card-top">
                <div>
                  <div class="opp-org-info">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18"></path><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"></path></svg>
                    <span>${medOpp.organization}</span>
                    <span>•</span>
                    <span class="text-success font-semibold">Verified NGO</span>
                  </div>
                  <h3 class="opp-title" style="margin-top: 4px;">${medOpp.title}</h3>
                </div>
                <div class="opp-match-badge">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                  ${medOpp.matchScore}% Match
                </div>
              </div>

              <div class="opp-meta-list">
                <div class="opp-meta-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  <span><strong>${medOpp.distanceKm} km away</strong> (${medOpp.location.split(',')[1] || 'Andheri'})</span>
                </div>
                <div class="opp-meta-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  <span>${medOpp.shiftTime}</span>
                </div>
                <div class="opp-meta-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
                  <span><strong>8 volunteers required</strong> (${medOpp.volunteersMatched} matched)</span>
                </div>
              </div>

              <p style="color: var(--neutral-600); font-size: 0.88rem; margin-bottom: 16px; line-height: 1.5;">
                ${medOpp.description.substring(0, 145)}...
              </p>

              <div class="opp-skills-row">
                ${medOpp.requiredSkills.map(s => `<span class="skill-tag matched">✓ ${s}</span>`).join('')}
              </div>

              <div style="display: flex; gap: 12px; margin-top: auto; padding-top: 14px; border-top: 1px solid var(--neutral-100);">
                <button class="btn btn-primary" style="flex: 1;" onclick="window.SahayakApp.navigateTo('event-details', { eventId: '${medOpp.id}' });">
                  View Opportunity →
                </button>
                <button class="btn btn-secondary" onclick="window.SahayakApp.navigateTo('smart-match');">
                  Why 92% Match?
                </button>
              </div>
            </div>
          </div>

          <!-- 2. NEARBY EVENTS SECTION -->
          <div>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
              <h2 style="font-size: 1.15rem; font-weight: 800; color: var(--primary-900);">Nearby Events &amp; Drives</h2>
              <button class="btn btn-sm btn-secondary" onclick="window.SahayakApp.navigateTo('opportunities');">View All (${state.opportunities.length})</button>
            </div>

            <div style="display: flex; flex-direction: column; gap: 14px;">
              ${otherOpps.slice(0, 2).map(opp => `
                <div class="card" style="padding: 18px;">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;">
                    <div>
                      <span class="badge badge-neutral" style="margin-bottom: 6px;">${opp.category}</span>
                      <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--primary-900);">${opp.title}</h4>
                      <div style="font-size: 0.82rem; color: var(--neutral-500); margin: 4px 0 10px 0;">
                        ${opp.organization} • 📍 ${opp.distanceKm} km away • 🕐 ${opp.shiftTime}
                      </div>
                    </div>
                    <div class="badge badge-ai" style="font-size: 0.82rem;">
                      ${opp.matchScore}% Match
                    </div>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--neutral-100); padding-top: 12px; margin-top: 6px;">
                    <span style="font-size: 0.8rem; color: var(--neutral-500);">
                      👥 ${opp.volunteersMatched} / ${opp.volunteersRequired} filled
                    </span>
                    <button class="btn btn-sm btn-secondary" onclick="window.SahayakApp.navigateTo('event-details', { eventId: '${opp.id}' });">
                      Inspect Details
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

        </div>

        <!-- RIGHT COLUMN: SCHEDULE, RELIABILITY & STATS -->
        <div style="display: flex; flex-direction: column; gap: 24px;">

          <!-- 3. SCHEDULED TASKS & UPCOMING SHIFTS -->
          <div class="card">
            <div class="card-header">
              <div>
                <h3 class="card-title" style="display: flex; align-items: center; gap: 8px;">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary-800)" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  Scheduled Tasks &amp; Shifts
                </h3>
                <div style="font-size: 0.76rem; color: var(--neutral-500); margin-top: 2px;">
                  Your accepted volunteer commitments
                </div>
              </div>
              <span class="badge badge-primary">
                ${(state.scheduledTasks || []).length} Scheduled
              </span>
            </div>

            ${(state.scheduledTasks && state.scheduledTasks.length > 0) ? `
              <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 12px;">
                ${state.scheduledTasks.map(task => `
                  <div style="padding: 14px; background-color: var(--neutral-50); border-radius: var(--radius-md); border: 1px solid var(--neutral-200); position: relative;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
                      <span class="badge ${task.status === 'DEPLOYED' ? 'badge-success' : 'badge-primary'}" style="font-size: 0.7rem;">
                        ${task.status === 'DEPLOYED' ? '● ON-GROUND SHIFT ACTIVE' : '✓ CONFIRMED SHIFT'}
                      </span>
                      <span style="font-size: 0.72rem; color: var(--neutral-500); font-weight: 700;">${task.date || 'Today'}</span>
                    </div>

                    <h4 style="font-weight: 800; font-size: 0.98rem; color: var(--primary-900); margin-bottom: 4px;">
                      ${task.title}
                    </h4>
                    
                    <div style="font-size: 0.78rem; color: var(--neutral-600); margin-bottom: 2px;">
                      🏢 <strong>${task.organization}</strong>
                    </div>

                    <div style="font-size: 0.78rem; color: var(--neutral-600); margin-bottom: 2px;">
                      📍 ${task.location}
                    </div>

                    <div style="font-size: 0.78rem; color: var(--primary-800); font-weight: 700; margin-bottom: 8px;">
                      🕐 ${task.shiftTime} (${task.hours || 4} hrs)
                    </div>

                    <!-- Assigned Tasks Sublist -->
                    ${task.assignedTasks && task.assignedTasks.length > 0 ? `
                      <div style="margin-bottom: 10px; background: #fff; padding: 8px 10px; border-radius: var(--radius-sm); border: 1px solid var(--neutral-200);">
                        <div style="font-size: 0.7rem; text-transform: uppercase; font-weight: 800; color: var(--neutral-500); margin-bottom: 4px;">Scheduled Field Duties:</div>
                        <ul style="margin: 0; padding-left: 16px; font-size: 0.76rem; color: var(--neutral-700); line-height: 1.4;">
                          ${task.assignedTasks.slice(0, 2).map(t => `<li>${t}</li>`).join('')}
                        </ul>
                      </div>
                    ` : ''}

                    <div style="display: flex; gap: 8px;">
                      <button class="btn btn-sm btn-primary" style="flex: 1; font-weight: 800; font-size: 0.78rem; justify-content: center;" onclick="window.SahayakApp.startScheduledTask('${task.id || task.eventId}');">
                        🚀 Open Deployment →
                      </button>
                      <button class="btn btn-sm btn-secondary" style="font-size: 0.78rem;" onclick="window.SahayakApp.navigateTo('event-details', { eventId: '${task.id || task.eventId}' });">
                        Details
                      </button>
                    </div>
                  </div>
                `).join('')}
              </div>
            ` : `
              <div style="text-align: center; padding: 24px 16px; background: var(--neutral-50); border-radius: var(--radius-md); border: 1px dashed var(--neutral-300); margin-bottom: 14px;">
                <div style="font-size: 1.8rem; margin-bottom: 6px;">📅</div>
                <div style="font-weight: 700; font-size: 0.9rem; color: var(--neutral-700); margin-bottom: 4px;">No Scheduled Tasks Yet</div>
                <p style="font-size: 0.78rem; color: var(--neutral-500); margin-bottom: 12px;">
                  Explore recommended community drives and click <strong>Accept Opportunity</strong> to add them to your schedule.
                </p>
                <button class="btn btn-sm btn-primary" style="font-size: 0.8rem;" onclick="window.SahayakApp.navigateTo('smart-match');">
                  ⚡ Find Matching Drives
                </button>
              </div>
            `}

            <div style="display: flex; flex-direction: column; gap: 8px;">
              <button class="btn btn-secondary btn-block" style="font-size: 0.82rem;" onclick="window.SahayakApp.navigateTo('deployments');">
                Go to Deployment Tracker Console →
              </button>
            </div>
          </div>

          <!-- 3B. VERIFIED ATTENDED EVENTS & ATTENDANCE PROOFS -->
          <div class="card" style="border: 1.5px solid #10b981; background: linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%);">
            <div class="card-header" style="margin-bottom: 12px;">
              <div>
                <h3 class="card-title" style="display: flex; align-items: center; gap: 8px; color: #065f46; font-size: 1.05rem;">
                  <span>🛡️</span>
                  Attended Events &amp; Service Proof
                </h3>
                <div style="font-size: 0.76rem; color: #047857; margin-top: 2px;">
                  Official record of on-ground verified shifts &amp; attended events
                </div>
              </div>
              <span class="badge badge-success" style="font-size: 0.72rem; font-weight: 800;">
                ✓ ${(user.attendedEvents || []).length} Attended
              </span>
            </div>

            <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 12px;">
              ${(user.attendedEvents || []).slice(0, 3).map(att => `
                <div style="padding: 12px; background: #ffffff; border-radius: var(--radius-md); border: 1px solid #a7f3d0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
                    <span class="badge badge-success" style="font-size: 0.68rem; font-weight: 800;">
                      ✓ ATTENDED &amp; VERIFIED
                    </span>
                    <span style="font-size: 0.72rem; color: var(--neutral-500); font-weight: 700;">${att.date}</span>
                  </div>

                  <h4 style="font-weight: 800; font-size: 0.92rem; color: var(--primary-900); margin: 4px 0 2px 0;">
                    ${att.title}
                  </h4>

                  <div style="font-size: 0.76rem; color: var(--neutral-600); margin-bottom: 2px;">
                    🏢 ${att.organization} • <strong>${att.hours}.0 Hours Credited</strong>
                  </div>

                  <div style="display: flex; align-items: center; gap: 8px; font-size: 0.74rem; color: #059669; font-weight: 600; margin-bottom: 8px;">
                    <span>👨‍⚕️ Supervisor: ${att.supervisor}</span>
                  </div>

                  <div style="display: flex; gap: 6px;">
                    <button class="btn btn-sm btn-secondary" style="flex: 1; font-size: 0.72rem; padding: 4px 6px;" onclick="window.SahayakApp.openAttendanceSlipModal();">
                      📄 Attendance Slip
                    </button>
                    <button class="btn btn-sm btn-primary" style="flex: 1; font-size: 0.72rem; padding: 4px 6px; background: #059669; border-color: #059669;" onclick="window.SahayakApp.openServiceCertificate();">
                      🏅 Certificate
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>

            <button class="btn btn-secondary btn-block" style="font-size: 0.8rem;" onclick="window.SahayakApp.navigateTo('profile');">
              View Complete Attendance Record &amp; Badges →
            </button>
          </div>

          <!-- 4. RELIABILITY SCORE WIDGET -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Reliability Score</h3>
              <span class="badge badge-success">Top 2% Volunteer</span>
            </div>

            <div class="circular-progress-box">
              <div class="circular-svg-wrap">
                <svg class="circular-svg" width="140" height="140" viewBox="0 0 140 140">
                  <circle class="circular-bg-circle" cx="70" cy="70" r="58"></circle>
                  <circle class="circular-progress-circle" cx="70" cy="70" r="58"
                    stroke-dasharray="364.4"
                    stroke-dashoffset="${364.4 - (364.4 * user.reliabilityScore) / 100}">
                  </circle>
                </svg>
                <div class="circular-value-label">
                  <span class="circular-number">${user.reliabilityScore}%</span>
                  <span class="circular-sublabel">Reliable</span>
                </div>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 8px; text-align: center;">
              <div style="padding: 10px; background-color: var(--neutral-50); border-radius: var(--radius-sm); border: 1px solid var(--neutral-100);">
                <div style="font-weight: 800; font-size: 1.1rem; color: var(--primary-900);">${user.onTimeRate}</div>
                <div style="font-size: 0.72rem; color: var(--neutral-500); text-transform: uppercase;">On-Time Rate</div>
              </div>
              <div style="padding: 10px; background-color: var(--neutral-50); border-radius: var(--radius-sm); border: 1px solid var(--neutral-100);">
                <div style="font-weight: 800; font-size: 1.1rem; color: var(--primary-900);">★ ${user.supervisorRating} / 5</div>
                <div style="font-size: 0.72rem; color: var(--neutral-500); text-transform: uppercase;">Supervisor Rating</div>
              </div>
            </div>
          </div>

          <!-- 5. QUICK EMERGENCY READINESS CARD -->
          <div class="card" style="border-left: 4px solid var(--danger-500);">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
              <span class="badge badge-danger">SOS Dispatch</span>
              <span style="font-size: 0.76rem; color: var(--neutral-500);">Live Network</span>
            </div>
            <h4 style="font-weight: 700; font-size: 0.95rem; margin-bottom: 6px;">Mumbai Monsoon Disaster Standby</h4>
            <p style="font-size: 0.8rem; color: var(--neutral-600); margin-bottom: 14px;">
              You are marked as <strong>On-Call First Aid responder</strong> for Kurla, Sion, and Andheri low-lying disaster clusters.
            </p>
            <button class="btn btn-sm btn-outline-danger btn-block" onclick="window.SahayakApp.navigateTo('emergency');">
              Inspect Emergency Center
            </button>
          </div>

        </div>

      </div>
    `;
  }

  /* ========================================================
     2. VOLUNTEER PROFILE
  ======================================================== */
  function renderVolunteerProfile() {
    const user = state.currentUser;

    return `
      <!-- PROFILE TOP HERO -->
      <section class="profile-hero-card">
        <div class="profile-avatar-large">
          ${user.avatar}
          <div class="profile-verified-badge" title="Identity & Red Cross Verified">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
        </div>

        <div class="profile-details-block">
          <div class="profile-name-row">
            <h1 class="profile-name">${user.name}</h1>
            <span class="badge badge-success">✓ Certified Volunteer</span>
            <span class="badge badge-primary">ID: #SHK-9842</span>
          </div>

          <div class="profile-loc-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            <span>${user.location} • Preferred Radius: ${user.maxTravelRadiusKm} km</span>
          </div>

          <p class="profile-bio-text">
            ${user.bio}
          </p>
        </div>

        <div>
          <button class="btn btn-primary" onclick="window.SahayakApp.openEditProfileModal();">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            Edit Profile
          </button>
        </div>
      </section>

      <!-- 4 PROFILE STATS CARDS -->
      <div class="profile-stats-grid">
        <div class="profile-stat-card">
          <div class="stat-icon-circle">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
          </div>
          <div class="stat-content">
            <span class="stat-val">${user.totalVolunteerHours} hrs</span>
            <span class="stat-lbl">Total Volunteer Hours</span>
          </div>
        </div>

        <div class="profile-stat-card">
          <div class="stat-icon-circle" style="background-color: var(--success-50); color: var(--success-600);">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
          </div>
          <div class="stat-content">
            <span class="stat-val">${user.completedEvents}</span>
            <span class="stat-lbl">Completed Events</span>
          </div>
        </div>

        <div class="profile-stat-card">
          <div class="stat-icon-circle" style="background-color: var(--primary-50); color: var(--primary-800);">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
          <div class="stat-content">
            <span class="stat-val">${user.reliabilityScore}%</span>
            <span class="stat-lbl">Reliability Index</span>
          </div>
        </div>

        <div class="profile-stat-card">
          <div class="stat-icon-circle" style="background-color: var(--purple-50); color: var(--purple-600);">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
          </div>
          <div class="stat-content">
            <span class="stat-val">${user.experience}</span>
            <span class="stat-lbl">Active Service Field</span>
          </div>
        </div>
      </div>

      <!-- DETAILED TWO-COLUMN PROFILE CONTENT -->
      <div class="profile-content-grid">
        
        <!-- COLUMN 1: SKILLS & CERTIFICATIONS -->
        <div style="display: flex; flex-direction: column; gap: 24px;">
          <!-- SKILLS -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Verified Skills &amp; Proficiencies</h3>
              <span class="badge badge-primary">${user.skills.length} Registered</span>
            </div>
            <div class="skill-pill-list">
              ${user.skills.map(s => `
                <div class="skill-row-item">
                  <div class="skill-row-left">
                    <div style="width: 8px; height: 8px; border-radius: 50%; background-color: var(--primary-700);"></div>
                    <span style="font-weight: 700; color: var(--neutral-800);">${s.name}</span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="badge ${s.verified ? 'badge-success' : 'badge-neutral'}">
                      ${s.verified ? '✓ Verified' : 'Self-declared'}
                    </span>
                    <span class="badge badge-primary">${s.level}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- CERTIFICATIONS -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Official Certifications</h3>
              <span class="badge badge-success">3 Active</span>
            </div>
            <div>
              ${user.certifications.map(c => `
                <div class="cert-card-item">
                  <div class="cert-badge-box">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
                  </div>
                  <div style="flex: 1;">
                    <div style="font-weight: 700; font-size: 0.95rem; color: var(--primary-900);">${c.title}</div>
                    <div style="font-size: 0.8rem; color: var(--neutral-500); margin-top: 2px;">
                      Issued by ${c.issuer} • Valid from ${c.year}
                    </div>
                  </div>
                  <span class="badge badge-neutral" style="font-family: monospace; font-size: 0.7rem;">${c.badge}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- COLUMN 2: AVAILABILITY, LANGUAGES & RELIABILITY DETAIL -->
        <div style="display: flex; flex-direction: column; gap: 24px;">
          <!-- AVAILABILITY & PREFERENCES -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Service Availability</h3>
              <span class="badge badge-primary">Active</span>
            </div>

            <div style="margin-bottom: 18px;">
              <label class="form-label">Typical Free Windows</label>
              <div style="padding: 12px; background-color: var(--neutral-50); border-radius: var(--radius-md); border: 1px solid var(--neutral-200); font-weight: 600; color: var(--primary-900);">
                ${user.availability}
              </div>
            </div>

            <div style="margin-bottom: 18px;">
              <label class="form-label">Spoken Languages</label>
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                ${user.languages.map(lang => `
                  <span class="badge badge-neutral" style="font-size: 0.82rem; padding: 6px 12px;">
                    🗣️ ${lang}
                  </span>
                `).join('')}
              </div>
            </div>

            <div>
              <label class="form-label">Emergency On-Call Status</label>
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px; background-color: var(--success-50); border: 1px solid var(--success-100); border-radius: var(--radius-md);">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span class="pulse-green-dot"></span>
                  <span style="font-weight: 700; color: var(--success-600); font-size: 0.88rem;">Ready for Rapid Mobilization</span>
                </div>
                <span style="font-size: 0.78rem; color: var(--neutral-500);">Within 12 km</span>
              </div>
            </div>
          </div>

          <!-- RELIABILITY BREAKDOWN -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Reliability &amp; Field History</h3>
            </div>
            
            <div class="circular-progress-box" style="padding: 6px 0 16px 0;">
              <div class="circular-svg-wrap">
                <svg class="circular-svg" width="140" height="140" viewBox="0 0 140 140">
                  <circle class="circular-bg-circle" cx="70" cy="70" r="58"></circle>
                  <circle class="circular-progress-circle" cx="70" cy="70" r="58"
                    stroke-dasharray="364.4"
                    stroke-dashoffset="${364.4 - (364.4 * user.reliabilityScore) / 100}">
                  </circle>
                </svg>
                <div class="circular-value-label">
                  <span class="circular-number">${user.reliabilityScore}%</span>
                  <span class="circular-sublabel">Reliability</span>
                </div>
              </div>
            </div>

            <p style="text-align: center; font-size: 0.84rem; color: var(--neutral-600); margin-bottom: 12px;">
              Calculated dynamically from attendance punctuality, completed shifts, supervisor endorsements, and low cancellation rates.
            </p>

            <div style="padding: 12px; background: var(--neutral-50); border-radius: var(--radius-md); border: 1px solid var(--neutral-200); font-size: 0.82rem; display: flex; justify-content: space-between;">
      </div>

      <!-- 3. VOLUNTEER SCHEDULED TASKS & CONFIRMED UPCOMING DRIVES -->
      <div class="card" style="margin-top: 24px;">
        <div class="card-header">
          <div>
            <h3 class="card-title" style="display: flex; align-items: center; gap: 8px;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary-800)" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              My Scheduled Tasks &amp; Confirmed Deployments
            </h3>
            <p style="font-size: 0.8rem; color: var(--neutral-500); margin-top: 2px;">
              All upcoming field missions you have accepted and confirmed.
            </p>
          </div>
          <span class="badge badge-primary">${(state.scheduledTasks || []).length} Confirmed</span>
        </div>

        ${(state.scheduledTasks && state.scheduledTasks.length > 0) ? `
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px;">
            ${state.scheduledTasks.map(task => `
              <div style="padding: 16px; background: var(--neutral-50); border: 1px solid var(--neutral-200); border-radius: var(--radius-md); display: flex; flex-direction: column;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
                  <span class="badge ${task.status === 'DEPLOYED' ? 'badge-success' : 'badge-primary'}" style="font-size: 0.72rem;">
                    ${task.status === 'DEPLOYED' ? '● ON-GROUND SHIFT' : '✓ CONFIRMED SHIFT'}
                  </span>
                  <span style="font-size: 0.76rem; color: var(--neutral-500); font-weight: 700;">${task.date || 'Today'}</span>
                </div>
                <h4 style="font-weight: 800; font-size: 1.05rem; color: var(--primary-900); margin-bottom: 4px;">
                  ${task.title}
                </h4>
                <div style="font-size: 0.8rem; color: var(--neutral-600); margin-bottom: 2px;">
                  🏢 <strong>${task.organization}</strong>
                </div>
                <div style="font-size: 0.8rem; color: var(--neutral-600); margin-bottom: 4px;">
                  📍 ${task.location}
                </div>
                <div style="font-size: 0.8rem; color: var(--primary-800); font-weight: 700; margin-bottom: 12px;">
                  🕐 ${task.shiftTime} (${task.hours || 4} hrs)
                </div>
                <div style="display: flex; gap: 8px; margin-top: auto;">
                  <button class="btn btn-sm btn-primary" style="flex: 1;" onclick="window.SahayakApp.startScheduledTask('${task.id || task.eventId}');">
                    🚀 Start Shift Tracker
                  </button>
                  <button class="btn btn-sm btn-secondary" onclick="window.SahayakApp.navigateTo('event-details', { eventId: '${task.id || task.eventId}' });">
                    View Brief
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        ` : `
          <div style="padding: 20px; text-align: center; color: var(--neutral-500); font-size: 0.88rem;">
            No scheduled tasks currently. Accept an opportunity from the Smart Match or Opportunities directory.
          </div>
        `}
      <!-- 4. VERIFIED ATTENDED EVENTS & ON-GROUND PROOF REGISTRY -->
      <div class="card" style="margin-top: 24px; border: 2px solid #10b981;">
        <div class="card-header">
          <div>
            <h3 class="card-title" style="display: flex; align-items: center; gap: 8px; color: #065f46;">
              <span style="font-size: 1.2rem;">🛡️</span>
              Verified Event Attendance &amp; Proof Registry
            </h3>
            <p style="font-size: 0.8rem; color: var(--neutral-500); margin-top: 2px;">
              Permanent on-ground telemetry logs, geotagged proof photos, supervisor endorsements, and credential stamps.
            </p>
          </div>
          <span class="badge badge-success" style="font-weight: 800; font-size: 0.76rem;">
            ✓ 100% On-Site Verified
          </span>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px;">
          ${(user.attendedEvents || []).map(att => `
            <div style="padding: 16px; background: #ffffff; border: 1.5px solid #a7f3d0; border-radius: var(--radius-md); box-shadow: 0 2px 6px rgba(0,0,0,0.04); display: flex; flex-direction: column;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                <span class="badge badge-success" style="font-size: 0.7rem; font-weight: 800;">
                  ✓ ATTENDED &amp; ON-SITE VERIFIED
                </span>
                <span style="font-size: 0.74rem; color: var(--neutral-500); font-weight: 700;">${att.date}</span>
              </div>

              <div style="display: flex; gap: 12px; margin-bottom: 12px;">
                <div style="position: relative; width: 64px; height: 64px; border-radius: var(--radius-sm); overflow: hidden; border: 2px solid #10b981; flex-shrink: 0; cursor: pointer;" onclick="window.SahayakApp.openPhotoProofViewer();" title="Click to view full on-site proof photo">
                  <img src="${att.photoProof}" alt="${att.title} Proof" style="width: 100%; height: 100%; object-fit: cover;" />
                  <span style="position: absolute; bottom: 1px; right: 1px; background: rgba(0,0,0,0.7); color: #6ee7b7; font-size: 0.55rem; padding: 1px 3px; font-family: monospace;">GPS</span>
                </div>

                <div style="flex: 1;">
                  <h4 style="font-weight: 800; font-size: 0.98rem; color: var(--primary-900); margin: 0 0 4px 0;">
                    ${att.title}
                  </h4>
                  <div style="font-size: 0.78rem; color: var(--neutral-600); margin-bottom: 2px;">
                    🏢 <strong>${att.organization}</strong>
                  </div>
                  <div style="font-size: 0.75rem; color: var(--neutral-500);">
                    📍 ${att.location}
                  </div>
                </div>
              </div>

              <div style="padding: 8px 10px; background: #f8fafc; border-radius: var(--radius-sm); border: 1px solid #e2e8f0; font-size: 0.74rem; margin-bottom: 12px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                  <span style="color: var(--neutral-500);">Supervisor Sign-Off:</span>
                  <strong style="color: #065f46;">${att.supervisor}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                  <span style="color: var(--neutral-500);">Geotag Perimeter:</span>
                  <strong style="font-family: monospace; font-size: 0.7rem;">${att.gpsLocation || '19.1197° N, 72.8464° E'}</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: var(--neutral-500);">Credited Service:</span>
                  <strong style="color: var(--primary-800);">${att.hours}.0 Verified Hours</strong>
                </div>
              </div>

              <div style="display: flex; gap: 8px; margin-top: auto;">
                <button class="btn btn-sm btn-secondary" style="flex: 1; font-size: 0.74rem;" onclick="window.SahayakApp.openAttendanceSlipModal();">
                  📄 Attendance Slip
                </button>
                <button class="btn btn-sm btn-primary" style="flex: 1; font-size: 0.74rem; background: #059669; border-color: #059669;" onclick="window.SahayakApp.openServiceCertificate();">
                  🏅 View Certificate
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /* ========================================================
     3. OPPORTUNITIES PAGE
  ======================================================== */
  function renderOpportunitiesPage() {
    return `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;">
        <div>
          <h1 style="font-size: 1.6rem; font-weight: 800; color: var(--primary-900);">Community Opportunities</h1>
          <p style="color: var(--neutral-500); font-size: 0.9rem;">Browse verified NGO drives, medical camps, and relief initiatives.</p>
        </div>
        <button class="btn btn-primary" onclick="window.SahayakApp.navigateTo('smart-match');">
          ⚡ Open AI Smart Match
        </button>
      </div>

      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px;">
        ${state.opportunities.map(opp => {
          const isScheduled = (state.scheduledTasks || []).some(t => t.id === opp.id || t.eventId === opp.id);
          const isAttended = (state.currentUser.attendedEvents || []).some(a => a.eventId === opp.id) || (state.activeDeployment.eventId === opp.id && (state.activeDeployment.status === 'COMPLETED' || state.activeDeployment.attendanceVerified));
          return `
          <div class="opportunity-card ${opp.isAiRecommended ? 'featured' : ''}" style="${isAttended ? 'border: 2px solid #10b981; background: linear-gradient(180deg, #fff 0%, #f0fdf4 100%);' : isScheduled ? 'border-top: 4px solid #10b981;' : ''}">
            <div class="opp-card-top">
              <div>
                <div class="opp-org-info">
                  <span>${opp.organization}</span>
                  <span>•</span>
                  <span>${opp.category}</span>
                </div>
                <h3 class="opp-title">${opp.title}</h3>
              </div>
              <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
                <div class="opp-match-badge">
                  ${opp.matchScore}% Match
                </div>
                ${isAttended ? `
                  <span class="badge badge-success" style="font-size: 0.68rem; font-weight: 800;">✓ ATTENDED &amp; VERIFIED</span>
                ` : isScheduled ? `
                  <span class="badge badge-primary" style="font-size: 0.68rem;">✓ In Scheduled Tasks</span>
                ` : ''}
              </div>
            </div>

            <div class="opp-meta-list">
              <div class="opp-meta-item">
                <span>📍 <strong>${opp.distanceKm} km away</strong></span>
              </div>
              <div class="opp-meta-item">
                <span>🕐 ${opp.shiftTime}</span>
              </div>
              <div class="opp-meta-item">
                <span>👥 ${opp.volunteersMatched} / ${opp.volunteersRequired} Matched</span>
              </div>
            </div>

            <p style="color: var(--neutral-600); font-size: 0.88rem; margin-bottom: 16px; line-height: 1.5; flex: 1;">
              ${opp.description}
            </p>

            <div class="opp-skills-row">
              ${opp.requiredSkills.map(s => `<span class="skill-tag">${s}</span>`).join('')}
            </div>

            <div style="display: flex; gap: 10px; margin-top: auto; padding-top: 14px; border-top: 1px solid var(--neutral-100);">
              <button class="btn btn-secondary" style="flex: 1;" onclick="window.SahayakApp.navigateTo('event-details', { eventId: '${opp.id}' });">
                View Details
              </button>
              ${isAttended ? `
                <button class="btn btn-primary" style="flex: 1; background: #059669; border-color: #059669; font-weight: 800;" onclick="window.SahayakApp.startScheduledTask('${opp.id}');">
                  🛡️ View Attendance Proof →
                </button>
              ` : isScheduled ? `
                <button class="btn btn-primary" style="flex: 1; background: #1e40af; border-color: #1e40af; font-weight: 800;" onclick="window.SahayakApp.startScheduledTask('${opp.id}');">
                  🚀 Open Deployment →
                </button>
              ` : `
                <button class="btn btn-primary" style="flex: 1; font-weight: 800;" onclick="window.SahayakApp.acceptOpportunity('${opp.id}');">
                  ⚡ Accept &amp; Schedule →
                </button>
              `}
            </div>
          </div>
        `}).join('')}
      </div>
    `;
  }

  /* ========================================================
     4. SMART MATCHING — AI NEURAL MATCH RADAR
  ======================================================== */
  let smartMatchFilterCategory = 'ALL';
  let smartMatchRadiusKm = 12;
  let smartMatchMinScore = 70;

  function setSmartMatchCategory(cat) {
    smartMatchFilterCategory = cat;
    renderPageContent();
  }

  function setSmartMatchRadius(rad) {
    smartMatchRadiusKm = parseInt(rad) || 12;
    renderPageContent();
  }

  function setSmartMatchMinScore(score) {
    smartMatchMinScore = parseInt(score) || 70;
    renderPageContent();
  }

  function renderSmartMatchPage() {
    const user = state.currentUser;
    
    // Calculate normalized matches for all opportunities
    let allMatches = state.opportunities.map(o => normalizeOpportunity(o, user));
    
    if (smartMatchFilterCategory !== 'ALL') {
      allMatches = allMatches.filter(o => o.category.toLowerCase().includes(smartMatchFilterCategory.toLowerCase()));
    }

    allMatches = allMatches.filter(o => (o.matchScore || 0) >= smartMatchMinScore);
    
    // Sort descending by match score
    allMatches.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

    const topMatch = allMatches[0] || normalizeOpportunity(state.opportunities[0], user);
    const otherMatches = allMatches.slice(1);

    const isTopScheduled = (state.scheduledTasks || []).some(t => t.id === topMatch.id || t.eventId === topMatch.id);
    const isTopAttended = (user.attendedEvents || []).some(a => a.eventId === topMatch.id);

    return `
      <!-- 1. AI NEURAL RADAR HERO BANNER (ELECTRIC INDIGO / VIOLET) -->
      <section style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4338ca 80%, #6366f1 100%); color: #fff; border-radius: var(--radius-xl); padding: 28px 32px; margin-bottom: 24px; box-shadow: 0 14px 32px -6px rgba(49, 46, 129, 0.45); border: 1px solid rgba(165, 180, 252, 0.3); position: relative; overflow: hidden;">
        <div style="position: absolute; right: -40px; top: -40px; width: 220px; height: 220px; border-radius: 50%; background: radial-gradient(circle, rgba(168, 85, 247, 0.25) 0%, transparent 70%); pointer-events: none;"></div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px; position: relative; z-index: 2;">
          <div>
            <div style="display: inline-flex; align-items: center; gap: 8px; background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(8px); border: 1px solid rgba(255, 255, 255, 0.25); color: #c7d2fe; font-size: 0.78rem; font-weight: 800; padding: 4px 14px; border-radius: 999px; margin-bottom: 10px; letter-spacing: 0.05em;">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: #a855f7; box-shadow: 0 0 8px #a855f7;"></span>
              🤖 SAHAYAK AI NEURAL MATCH ENGINE™ • MULTI-VECTOR RADAR
            </div>
            <h1 style="font-size: 1.85rem; font-weight: 900; color: #ffffff; margin: 0 0 6px 0; letter-spacing: -0.02em;">
              Automated Volunteer Skill &amp; Proximity Allocation
            </h1>
            <p style="color: #e0e7ff; font-size: 0.92rem; max-width: 680px; line-height: 1.5; margin: 0;">
              Our deep matching model dynamically cross-references your verified certifications, live GPS radius (<strong>${smartMatchRadiusKm} km</strong>), availability windows, and historical reliability against all open NGO missions.
            </p>
          </div>

          <div style="display: flex; gap: 14px; align-items: center;">
            <div style="text-align: center; background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); padding: 14px 20px; border-radius: var(--radius-lg); border: 1px solid rgba(255,255,255,0.18);">
              <div style="font-size: 0.7rem; text-transform: uppercase; color: #c7d2fe; font-weight: 800;">Model Confidence</div>
              <div style="font-size: 1.7rem; font-weight: 900; color: #ffffff; line-height: 1.1; margin-top: 2px;">98.4%</div>
              <div style="font-size: 0.68rem; color: #a5b4fc;">Cosine Vector Sim</div>
            </div>
            <div style="text-align: center; background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); padding: 14px 20px; border-radius: var(--radius-lg); border: 1px solid rgba(255,255,255,0.18);">
              <div style="font-size: 0.7rem; text-transform: uppercase; color: #c7d2fe; font-weight: 800;">Matched Drives</div>
              <div style="font-size: 1.7rem; font-weight: 900; color: #38bdf8; line-height: 1.1; margin-top: 2px;">${allMatches.length}</div>
              <div style="font-size: 0.68rem; color: #a5b4fc;">Within Radius</div>
            </div>
          </div>
        </div>
      </section>

      <!-- 2. INTERACTIVE AI RADAR CONTROLLER & DOMAIN CHIPS -->
      <div style="background: #ffffff; border: 1px solid var(--neutral-200); border-radius: var(--radius-xl); padding: 18px 24px; margin-bottom: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); display: flex; flex-direction: column; gap: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          
          <!-- Domain Filter Chips -->
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <span style="font-size: 0.78rem; font-weight: 800; color: var(--neutral-700); text-transform: uppercase; letter-spacing: 0.05em; margin-right: 4px;">
              Mission Domain:
            </span>
            <button class="btn btn-sm ${smartMatchFilterCategory === 'ALL' ? 'btn-primary' : 'btn-secondary'}" style="padding: 6px 14px; font-size: 0.8rem; font-weight: 700; ${smartMatchFilterCategory === 'ALL' ? 'background: #4338ca; border-color: #4338ca;' : ''}" onclick="window.SahayakApp.setSmartMatchCategory('ALL');">
              🌟 All Opportunities (${state.opportunities.length})
            </button>
            <button class="btn btn-sm ${smartMatchFilterCategory === 'Healthcare' ? 'btn-primary' : 'btn-secondary'}" style="padding: 6px 14px; font-size: 0.8rem; font-weight: 700; ${smartMatchFilterCategory === 'Healthcare' ? 'background: #4338ca; border-color: #4338ca;' : ''}" onclick="window.SahayakApp.setSmartMatchCategory('Healthcare');">
              🏥 Healthcare &amp; Relief
            </button>
            <button class="btn btn-sm ${smartMatchFilterCategory === 'Hunger' ? 'btn-primary' : 'btn-secondary'}" style="padding: 6px 14px; font-size: 0.8rem; font-weight: 700; ${smartMatchFilterCategory === 'Hunger' ? 'background: #4338ca; border-color: #4338ca;' : ''}" onclick="window.SahayakApp.setSmartMatchCategory('Hunger');">
              🍲 Food &amp; Nutrition
            </button>
            <button class="btn btn-sm ${smartMatchFilterCategory === 'Education' ? 'btn-primary' : 'btn-secondary'}" style="padding: 6px 14px; font-size: 0.8rem; font-weight: 700; ${smartMatchFilterCategory === 'Education' ? 'background: #4338ca; border-color: #4338ca;' : ''}" onclick="window.SahayakApp.setSmartMatchCategory('Education');">
              🎓 Community Teaching
            </button>
          </div>

          <!-- Radius & Score Sliders -->
          <div style="display: flex; align-items: center; gap: 16px; flex-wrap: wrap;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 0.78rem; font-weight: 700; color: var(--neutral-600);">Radius:</span>
              <select class="form-input" style="padding: 5px 10px; font-size: 0.8rem; width: auto; font-weight: 700; border-color: #c7d2fe;" onchange="window.SahayakApp.setSmartMatchRadius(this.value);">
                <option value="5" ${smartMatchRadiusKm === 5 ? 'selected' : ''}>📍 5 km (Hyper-local)</option>
                <option value="12" ${smartMatchRadiusKm === 12 ? 'selected' : ''}>📍 12 km (Recommended)</option>
                <option value="25" ${smartMatchRadiusKm === 25 ? 'selected' : ''}>📍 25 km (Extended Suburbs)</option>
              </select>
            </div>

            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 0.78rem; font-weight: 700; color: var(--neutral-600);">Min Score:</span>
              <select class="form-input" style="padding: 5px 10px; font-size: 0.8rem; width: auto; font-weight: 700; border-color: #c7d2fe;" onchange="window.SahayakApp.setSmartMatchMinScore(this.value);">
                <option value="70" ${smartMatchMinScore === 70 ? 'selected' : ''}>★ 70%+ Good Fit</option>
                <option value="85" ${smartMatchMinScore === 85 ? 'selected' : ''}>★ 85%+ Strong Match</option>
                <option value="90" ${smartMatchMinScore === 90 ? 'selected' : ''}>★ 90%+ Optimal Neural Fit</option>
              </select>
            </div>
          </div>

        </div>
      </div>

      <!-- 3. #1 HIGHEST RANKED AI MATCH DOSSIER & 4-AXIS VECTOR RADAR -->
      <div style="background: linear-gradient(180deg, #ffffff 0%, #f8faff 100%); border: 2px solid #6366f1; border-radius: var(--radius-xl); padding: 28px; box-shadow: 0 16px 36px -8px rgba(99, 102, 241, 0.18); margin-bottom: 28px;">
        
        <div style="display: grid; grid-template-columns: 1fr 340px; gap: 28px; align-items: flex-start;">
          
          <!-- LEFT: MATCH SUMMARY & 4 FACTOR BARS -->
          <div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
              <span style="background: linear-gradient(135deg, #4338ca, #6366f1); color: #fff; font-size: 0.76rem; font-weight: 900; padding: 3px 10px; border-radius: 4px; letter-spacing: 0.04em;">
                🥇 #1 OPTIMAL ALGORITHMIC MATCH
              </span>
              <span class="badge badge-danger" style="font-size: 0.72rem; font-weight: 800;">${topMatch.urgency || 'High'} Priority</span>
              <span style="font-size: 0.82rem; color: var(--neutral-500); font-weight: 700;">${topMatch.organization}</span>
            </div>

            <h2 style="font-size: 1.85rem; font-weight: 900; color: #1e1b4b; margin: 4px 0 10px 0;">
              ${topMatch.title}
            </h2>

            <div style="display: flex; gap: 16px; font-size: 0.86rem; color: var(--neutral-600); margin-bottom: 18px; flex-wrap: wrap;">
              <span>📍 <strong>${topMatch.distanceKm} km away</strong> (${topMatch.location})</span>
              <span>🕐 <strong>${topMatch.shiftTime}</strong></span>
              <span>👥 <strong>${topMatch.volunteersMatched} / ${topMatch.volunteersRequired} Matched</strong></span>
            </div>

            <p style="color: #334155; font-size: 0.9rem; line-height: 1.55; margin-bottom: 20px;">
              ${topMatch.description}
            </p>

            <!-- 4 FACTOR PROGRESS BREAKDOWNS -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 20px;">
              <div style="background: #ffffff; padding: 12px 14px; border-radius: var(--radius-md); border: 1px solid #e0e7ff; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.82rem; font-weight: 800; color: #312e81; margin-bottom: 4px;">
                  <span>🎯 Verified Skills Alignment</span>
                  <span style="color: #4338ca;">${topMatch.matchBreakdown?.skills?.score || 96}%</span>
                </div>
                <div style="height: 6px; background: #e0e7ff; border-radius: 999px; overflow: hidden;">
                  <div style="width: ${topMatch.matchBreakdown?.skills?.score || 96}%; height: 100%; background: linear-gradient(90deg, #4f46e5, #818cf8); border-radius: 999px;"></div>
                </div>
                <div style="font-size: 0.72rem; color: var(--neutral-500); margin-top: 4px;">Direct fit for First Aid, CPR &amp; Emergency Triage</div>
              </div>

              <div style="background: #ffffff; padding: 12px 14px; border-radius: var(--radius-md); border: 1px solid #e0e7ff; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.82rem; font-weight: 800; color: #312e81; margin-bottom: 4px;">
                  <span>📅 Schedule &amp; Time Window</span>
                  <span style="color: #4338ca;">${topMatch.matchBreakdown?.availability?.score || 95}%</span>
                </div>
                <div style="height: 6px; background: #e0e7ff; border-radius: 999px; overflow: hidden;">
                  <div style="width: ${topMatch.matchBreakdown?.availability?.score || 95}%; height: 100%; background: linear-gradient(90deg, #4f46e5, #818cf8); border-radius: 999px;"></div>
                </div>
                <div style="font-size: 0.72rem; color: var(--neutral-500); margin-top: 4px;">Matches your Saturday evening availability</div>
              </div>

              <div style="background: #ffffff; padding: 12px 14px; border-radius: var(--radius-md); border: 1px solid #e0e7ff; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.82rem; font-weight: 800; color: #312e81; margin-bottom: 4px;">
                  <span>📍 GPS Proximity Vector</span>
                  <span style="color: #4338ca;">${topMatch.matchBreakdown?.location?.score || 90}%</span>
                </div>
                <div style="height: 6px; background: #e0e7ff; border-radius: 999px; overflow: hidden;">
                  <div style="width: ${topMatch.matchBreakdown?.location?.score || 90}%; height: 100%; background: linear-gradient(90deg, #4f46e5, #818cf8); border-radius: 999px;"></div>
                </div>
                <div style="font-size: 0.72rem; color: var(--neutral-500); margin-top: 4px;">2.4 km away (within 12 km search radius)</div>
              </div>

              <div style="background: #ffffff; padding: 12px 14px; border-radius: var(--radius-md); border: 1px solid #e0e7ff; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.82rem; font-weight: 800; color: #312e81; margin-bottom: 4px;">
                  <span>⭐ Reliability &amp; Field Record</span>
                  <span style="color: #4338ca;">${topMatch.matchBreakdown?.experience?.score || 88}%</span>
                </div>
                <div style="height: 6px; background: #e0e7ff; border-radius: 999px; overflow: hidden;">
                  <div style="width: ${topMatch.matchBreakdown?.experience?.score || 88}%; height: 100%; background: linear-gradient(90deg, #4f46e5, #818cf8); border-radius: 999px;"></div>
                </div>
                <div style="font-size: 0.72rem; color: var(--neutral-500); margin-top: 4px;">Matches 3.5 yrs field service &amp; 98% reliability score</div>
              </div>
            </div>

            <!-- EXPLAINABLE AI QUOTE -->
            <div style="background: #eef2ff; border-left: 4px solid #4f46e5; border-radius: var(--radius-sm); padding: 12px 16px; margin-bottom: 20px; font-size: 0.84rem; color: #312e81; line-height: 1.45;">
              <strong>💡 Neural Matching Rationale:</strong> “${topMatch.matchExplanation || 'Calculated as the #1 optimal placement based on verified first-responder credentials, instant proximity, and highest community impact.'}”
            </div>

            <!-- ACTION BUTTONS -->
            <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
              ${isTopAttended ? `
                <button class="btn btn-primary btn-lg" style="background: #059669; border-color: #059669; font-weight: 800;" onclick="window.SahayakApp.startScheduledTask('${topMatch.id}');">
                  🛡️ View Verified Attendance Proof →
                </button>
              ` : isTopScheduled ? `
                <button class="btn btn-primary btn-lg" style="background: #1e40af; border-color: #1e40af; font-weight: 800;" onclick="window.SahayakApp.startScheduledTask('${topMatch.id}');">
                  🚀 In Scheduled Tasks (Open Deployment) →
                </button>
              ` : `
                <button class="btn btn-primary btn-lg" style="background: linear-gradient(135deg, #4338ca, #6366f1); border: none; font-weight: 800; box-shadow: 0 4px 14px rgba(79,70,229,0.4);" onclick="window.SahayakApp.acceptOpportunity('${topMatch.id}');">
                  ⚡ Accept AI Match &amp; Add to Schedule →
                </button>
              `}
              <button class="btn btn-secondary btn-lg" onclick="window.SahayakApp.navigateTo('event-details', { eventId: '${topMatch.id}' });">
                🔍 Event Dossier
              </button>
            </div>
          </div>

          <!-- RIGHT: SPIDER VECTOR RADAR CHART DISPLAY -->
          <div style="background: #ffffff; border: 2px solid #c7d2fe; border-radius: var(--radius-lg); padding: 20px; text-align: center; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.08);">
            <div style="font-size: 0.72rem; text-transform: uppercase; font-weight: 800; color: #4338ca; letter-spacing: 0.05em; margin-bottom: 12px;">
              Multi-Factor Vector Radar
            </div>

            <!-- SVG 4-Axis Spider Radar Scope -->
            <div style="width: 220px; height: 220px; margin: 0 auto 12px auto; position: relative;">
              <svg width="220" height="220" viewBox="0 0 220 220">
                <!-- Concentric Radar Webs -->
                <circle cx="110" cy="110" r="90" fill="none" stroke="#e0e7ff" stroke-width="1.5" />
                <circle cx="110" cy="110" r="65" fill="none" stroke="#e0e7ff" stroke-width="1" />
                <circle cx="110" cy="110" r="40" fill="none" stroke="#e0e7ff" stroke-width="1" stroke-dasharray="2 2" />
                
                <!-- 4 Axis Crosslines -->
                <line x1="110" y1="15" x2="110" y2="205" stroke="#cbd5e1" stroke-width="1" />
                <line x1="15" y1="110" x2="205" y2="110" stroke="#cbd5e1" stroke-width="1" />

                <!-- Polygon Area for Match Scores: Top (Skills 96%), Right (Schedule 95%), Bottom (Experience 88%), Left (Proximity 90%) -->
                <polygon points="110,24 195,110 110,189 29,110" fill="rgba(99, 102, 241, 0.25)" stroke="#4f46e5" stroke-width="2.5" />

                <!-- Data Points on Axes -->
                <circle cx="110" cy="24" r="5" fill="#4338ca" />
                <circle cx="195" cy="110" r="5" fill="#4338ca" />
                <circle cx="110" cy="189" r="5" fill="#4338ca" />
                <circle cx="29" cy="110" r="5" fill="#4338ca" />

                <!-- Axis Labels -->
                <text x="110" y="12" font-size="9" font-weight="800" fill="#312e81" text-anchor="middle">SKILLS (96%)</text>
                <text x="212" y="113" font-size="9" font-weight="800" fill="#312e81" text-anchor="start">TIME (95%)</text>
                <text x="110" y="216" font-size="9" font-weight="800" fill="#312e81" text-anchor="middle">EXP (88%)</text>
                <text x="8" y="113" font-size="9" font-weight="800" fill="#312e81" text-anchor="end">GPS (90%)</text>
              </svg>
            </div>

            <div style="background: #eef2ff; border-radius: var(--radius-md); padding: 10px; border: 1px solid #c7d2fe;">
              <div style="font-size: 2.2rem; font-weight: 900; color: #312e81; line-height: 1;">
                ${topMatch.matchScore || 92}<span style="font-size: 1.2rem; color: #6366f1;">%</span>
              </div>
              <div style="font-size: 0.72rem; font-weight: 800; color: #4338ca; text-transform: uppercase; margin-top: 2px;">
                Overall Neural Fit Score
              </div>
            </div>
          </div>

        </div>

      </div>

      <!-- 4. COMPARATIVE RANKED MATCHES GRID -->
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div>
            <h3 style="font-size: 1.3rem; font-weight: 900; color: var(--primary-900); margin: 0 0 2px 0;">
              Ranked Alternative Recommendations
            </h3>
            <p style="font-size: 0.82rem; color: var(--neutral-500); margin: 0;">
              Additional drives matching your qualifications, sorted by algorithm compatibility score.
            </p>
          </div>
          <button class="btn btn-sm btn-secondary" onclick="window.SahayakApp.navigateTo('opportunities');">
            View All Catalog (${state.opportunities.length}) →
          </button>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(310px, 1fr)); gap: 20px;">
          ${otherMatches.map((opp, idx) => {
            const isSch = (state.scheduledTasks || []).some(t => t.id === opp.id || t.eventId === opp.id);
            const isAtt = (user.attendedEvents || []).some(a => a.eventId === opp.id);
            return `
            <div class="card" style="display: flex; flex-direction: column; border-top: 4px solid #6366f1; border-radius: var(--radius-lg); box-shadow: 0 4px 14px rgba(0,0,0,0.04);">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                <span class="badge badge-neutral">${opp.category}</span>
                <span class="badge badge-ai" style="font-size: 0.82rem; font-weight: 800; background: #e0e7ff; color: #3730a3;">
                  ★ Rank #${idx + 2} • ${opp.matchScore}% Match
                </span>
              </div>

              <h4 style="font-size: 1.1rem; font-weight: 800; color: var(--primary-900); margin-bottom: 4px;">
                ${opp.title}
              </h4>
              <div style="font-size: 0.8rem; color: var(--neutral-500); margin-bottom: 12px;">
                🏢 ${opp.organization} • 📍 ${opp.distanceKm} km away
              </div>

              <p style="font-size: 0.84rem; color: var(--neutral-600); margin-bottom: 14px; flex: 1; line-height: 1.5;">
                ${opp.description ? opp.description.substring(0, 115) + '...' : ''}
              </p>

              <div style="background: #f8fafc; padding: 8px 12px; border-radius: var(--radius-sm); margin-bottom: 14px; font-size: 0.78rem; color: #475569;">
                <strong>Required Skills:</strong> ${(opp.requiredSkills || []).slice(0, 2).join(', ')}
              </div>

              <div style="display: flex; gap: 8px; margin-top: auto;">
                <button class="btn btn-sm btn-secondary" style="flex: 1;" onclick="window.SahayakApp.navigateTo('event-details', { eventId: '${opp.id}' });">
                  Details
                </button>
                ${isAtt ? `
                  <button class="btn btn-sm btn-primary" style="flex: 1; background: #059669; border-color: #059669;" onclick="window.SahayakApp.startScheduledTask('${opp.id}');">
                    ✓ Attended
                  </button>
                ` : isSch ? `
                  <button class="btn btn-sm btn-primary" style="flex: 1; background: #1e40af; border-color: #1e40af;" onclick="window.SahayakApp.startScheduledTask('${opp.id}');">
                    🚀 Scheduled
                  </button>
                ` : `
                  <button class="btn btn-sm btn-primary" style="flex: 1; background: #4f46e5; border: none; font-weight: 800;" onclick="window.SahayakApp.acceptOpportunity('${opp.id}');">
                    ⚡ Accept Match
                  </button>
                `}
              </div>
            </div>
          `}).join('')}
        </div>
      </div>
    `;
  }

  /* ========================================================
     5. EVENT DETAILS PAGE & INTERACTIVE MAP CARD
  ======================================================== */
  function renderEventDetailsPage(eventId) {
    const rawOpp = state.opportunities.find(o => o.id === eventId) || state.opportunities[0];
    const opp = normalizeOpportunity(rawOpp, state.currentUser);

    return `
      <!-- TOP NAVIGATION BAR -->
      <div style="margin-bottom: 20px;">
        <button class="btn btn-secondary btn-sm" onclick="window.SahayakApp.navigateTo('opportunities');">
          ← Back to Opportunities
        </button>
      </div>

      <div class="event-details-layout">
        
        <!-- LEFT COLUMN: EVENT DETAILS & INFORMATION -->
        <div class="event-main-content">
          
          <div class="event-details-hero">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
              <div class="event-org-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                <span>${opp.organization}</span>
              </div>
              <span class="badge badge-ai" style="font-size: 0.88rem; font-weight: 800;">
                ⚡ ${opp.matchScore}% AI Match
              </span>
            </div>

            <h1 style="font-size: 1.85rem; font-weight: 800; color: var(--primary-900); margin-bottom: 8px;">
              ${opp.title}
            </h1>

            <div style="display: flex; flex-wrap: wrap; gap: 16px; color: var(--neutral-600); font-size: 0.88rem; padding: 12px 0; border-bottom: 1px solid var(--neutral-100); margin-bottom: 18px;">
              <span>📅 <strong>${opp.date}</strong></span>
              <span>🕐 <strong>${opp.shiftTime}</strong> (${opp.durationHours} hrs)</span>
              <span>📍 <strong>${opp.location}</strong></span>
            </div>

            <div style="margin-bottom: 24px;">
              <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--primary-900); margin-bottom: 8px;">Event Description</h3>
              <p style="color: var(--neutral-700); line-height: 1.6; font-size: 0.92rem;">
                ${opp.description}
              </p>
            </div>

            <!-- VOLUNTEERS MATCHED PROGRESS METER -->
            <div class="volunteer-meter-box">
              <div class="meter-header">
                <span style="font-weight: 700; color: var(--primary-900); font-size: 0.95rem;">
                  Volunteer Capacity &amp; Fill Status
                </span>
                <span style="font-weight: 800; color: var(--primary-800); font-size: 0.95rem;">
                  ${opp.volunteersMatched} / ${opp.volunteersRequired} Volunteers Matched
                </span>
              </div>
              <div class="meter-progress-track">
                <div class="meter-progress-fill" style="width: ${(opp.volunteersMatched / opp.volunteersRequired) * 100}%;"></div>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px; font-size: 0.78rem; color: var(--neutral-500);">
                <span>60% capacity fulfilled</span>
                <span>8 open positions remain</span>
              </div>
            </div>

            <!-- REQUIRED SKILLS -->
            <div style="margin-bottom: 24px;">
              <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--primary-900); margin-bottom: 10px;">Required Skills</h3>
              <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                ${opp.requiredSkills.map(skill => `
                  <span class="badge badge-primary" style="font-size: 0.82rem; padding: 6px 12px;">
                    ✓ ${skill}
                  </span>
                `).join('')}
              </div>
            </div>

            <!-- SAFETY INSTRUCTIONS -->
            <div style="margin-bottom: 24px;">
              <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--primary-900); margin-bottom: 10px;">Safety Protocols &amp; Instructions</h3>
              <div style="display: flex; flex-direction: column; gap: 8px;">
                ${opp.safetyInstructions.map(instr => `
                  <div style="display: flex; align-items: flex-start; gap: 10px; font-size: 0.88rem; color: var(--neutral-700);">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--success-600)" stroke-width="2.5" style="flex-shrink:0; margin-top: 2px;"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    <span>${instr}</span>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- BUTTONS -->
            <div style="display: flex; gap: 16px; padding-top: 20px; border-top: 1px solid var(--neutral-200);">
              ${(state.scheduledTasks || []).some(t => t.id === opp.id || t.eventId === opp.id) ? `
                <button class="btn btn-primary btn-lg" style="flex: 1; background: #059669; border-color: #059669; font-weight: 800;" onclick="window.SahayakApp.startScheduledTask('${opp.id}');">
                  🚀 In Scheduled Tasks (Open Deployment) →
                </button>
              ` : `
                <button class="btn btn-primary btn-lg" style="flex: 1; font-weight: 800;" onclick="window.SahayakApp.acceptOpportunity('${opp.id}');">
                  ⚡ Accept Opportunity &amp; Add to Schedule →
                </button>
              `}
              <button class="btn btn-secondary btn-lg" onclick="window.SahayakApp.navigateTo('opportunities');">
                Back to Opportunities
              </button>
            </div>

          </div>

        </div>

        <!-- RIGHT COLUMN: INTERACTIVE MAP CARD & EMERGENCY CONTACT -->
        <div style="display: flex; flex-direction: column; gap: 24px;">
          
          <!-- STYLIZED INTERACTIVE MAP CARD -->
          <div class="mock-map-card">
            <div class="mock-map-header">
              <div style="font-weight: 700; color: var(--primary-900); font-size: 0.82rem; display: flex; align-items: center; gap: 6px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary-800)" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>
                Live Geo-Transit Vector
              </div>
              <span class="badge badge-success" style="font-size: 0.72rem;">2.4 km away</span>
            </div>

            <div class="map-view-canvas">
              <!-- SVG Street Map Simulation -->
              <svg class="map-grid-svg" viewBox="0 0 400 260">
                <defs>
                  <pattern id="street-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <line x1="0" y1="0" x2="40" y2="0" stroke="#cbd5e1" stroke-width="1.5" />
                    <line x1="0" y1="0" x2="0" y2="40" stroke="#cbd5e1" stroke-width="1.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="#e2eaf4" />
                <rect width="100%" height="100%" fill="url(#street-grid)" opacity="0.6" />

                <!-- Road paths -->
                <path d="M 30,220 Q 150,180 280,90" fill="none" stroke="#94a3b8" stroke-width="8" stroke-linecap="round" />
                <path d="M 30,220 Q 150,180 280,90" fill="none" stroke="#60a5fa" stroke-width="4" stroke-dasharray="6,4" />

                <!-- Origin: Volunteer Home (Rahul) -->
                <circle cx="30" cy="220" r="8" fill="#1e40af" stroke="#ffffff" stroke-width="3" />
                
                <!-- Destination: Medical Camp -->
                <circle cx="280" cy="90" r="14" fill="rgba(37,99,235,0.2)" />
                <circle cx="280" cy="90" r="8" fill="#0f3d87" stroke="#ffffff" stroke-width="3" />
              </svg>

              <!-- Map Pin Floating HTML Overlay -->
              <div class="map-marker-pin" style="top: 90px; left: 280px;">
                <div class="map-marker-bubble">Community Health Centre</div>
                <div class="map-marker-dot"></div>
              </div>

              <div class="map-marker-pin" style="top: 220px; left: 30px;">
                <div class="map-marker-bubble" style="background: #1e3a8a;">You (Home)</div>
              </div>
            </div>

            <div class="map-footer-bar">
              <div>
                <div style="font-weight: 700; color: var(--neutral-800);">Estimated Travel Time</div>
                <div style="color: var(--neutral-500); font-size: 0.75rem;">12 mins via SV Road &amp; Link Road</div>
              </div>
              <button class="btn btn-sm btn-secondary" onclick="window.SahayakApp.showToast('Navigating GPS routing to Community Health Centre...', 'primary');">
                Get Directions
              </button>
            </div>
          </div>

          <!-- ORGANIZER & EMERGENCY CONTACT CARD -->
          <div class="card">
            <h3 class="card-title" style="margin-bottom: 14px;">Organizer &amp; Contacts</h3>
            
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
              <div class="user-avatar-circle" style="background-color: var(--primary-700);">HH</div>
              <div>
                <div style="font-weight: 700; color: var(--primary-900);">${opp.organization}</div>
                <div style="font-size: 0.78rem; color: var(--neutral-500);">Reg: MH/2018/NGO-004821 • 4.9★ (54 Drives)</div>
              </div>
            </div>

            <div style="padding: 14px; background-color: var(--neutral-50); border-radius: var(--radius-md); border: 1px solid var(--neutral-200); margin-bottom: 14px;">
              <div style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--neutral-400);">
                On-Site Medical Supervisor
              </div>
              <div style="font-weight: 800; font-size: 0.95rem; color: var(--primary-900); margin-top: 2px;">
                ${opp.emergencyContact.name}
              </div>
              <div style="font-size: 0.82rem; color: var(--neutral-600);">
                ${opp.emergencyContact.role}
              </div>
              <div style="font-size: 0.88rem; font-weight: 700; color: var(--primary-800); margin-top: 6px;">
                📞 ${opp.emergencyContact.phone}
              </div>
            </div>

            <button class="btn btn-sm btn-secondary btn-block" onclick="window.SahayakApp.showToast('Calling Dr. S. Mehta (+91 98201 44321)...', 'primary');">
              Contact Organizer
            </button>
          </div>

        </div>

      </div>
    `;
  }

  /* ========================================================
     6. DEPLOYMENT TRACKING — KEY FEATURE
  ======================================================== */
  /* ========================================================
     6. DEPLOYMENT TRACKING — LIVE STOPWATCH & PHOTO PROOF
  ======================================================== */

  // Global timer ticker
  let deploymentTimerInterval = null;

  function startDeploymentTimer() {
    if (deploymentTimerInterval) clearInterval(deploymentTimerInterval);
    deploymentTimerInterval = setInterval(() => {
      const dep = state.activeDeployment;
      if (!dep || dep.status !== 'DEPLOYED') return;

      const hrEl = document.getElementById('stopwatch-hrs');
      const minEl = document.getElementById('stopwatch-mins');
      const secEl = document.getElementById('stopwatch-secs');
      if (!hrEl || !minEl || !secEl) return;

      const now = Date.now();
      const startTime = dep.checkInTimestamp || (now - (4 * 3600 + 3 * 60 + 12) * 1000); // 4h 3m for demo if not set
      const diffMs = Math.max(0, now - startTime);
      const totalSec = Math.floor(diffMs / 1000);
      const hrs = String(Math.floor(totalSec / 3600)).padStart(2, '0');
      const mins = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
      const secs = String(totalSec % 60).padStart(2, '0');

      hrEl.textContent = hrs;
      minEl.textContent = mins;
      secEl.textContent = secs;
    }, 1000);
  }

  function stopDeploymentTimer() {
    if (deploymentTimerInterval) {
      clearInterval(deploymentTimerInterval);
      deploymentTimerInterval = null;
    }
  }

  function svgToDataUri(svgString) {
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString.trim());
  }

  // Sample High-Definition Verified Photo Proof Presets (URL Encoded Data URIs)
  const PHOTO_PRESETS = {
    medical: svgToDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320" viewBox="0 0 480 320"><defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#0f172a"/><stop offset="100%" stop-color="#1e293b"/></linearGradient><linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#10b981"/><stop offset="100%" stop-color="#3b82f6"/></linearGradient></defs><rect width="480" height="320" fill="url(#bg)"/><circle cx="240" cy="130" r="55" fill="#059669" opacity="0.3"/><circle cx="240" cy="115" r="35" fill="#10b981"/><path d="M180,210 Q240,165 300,210 L310,260 L170,260 Z" fill="#2563eb"/><rect x="215" y="165" width="50" height="65" rx="6" fill="#ffffff"/><text x="240" y="188" font-family="Arial" font-size="10" font-weight="bold" fill="#0a1f44" text-anchor="middle">VOLUNTEER</text><rect x="228" y="196" width="24" height="2" fill="#2563eb"/><text x="240" y="215" font-family="Arial" font-size="9" fill="#64748b" text-anchor="middle">#MED-92</text><rect x="20" y="20" width="440" height="280" fill="none" stroke="url(#glow)" stroke-width="2" rx="10" stroke-dasharray="8 4"/><rect x="30" y="248" width="420" height="42" rx="6" fill="rgba(0,0,0,0.75)"/><circle cx="48" cy="269" r="5" fill="#10b981"/><text x="62" y="266" font-family="monospace" font-size="11" font-weight="bold" fill="#ffffff">SAHAYAK LIVE PHOTO PROOF • TRIAGE STATION</text><text x="62" y="281" font-family="monospace" font-size="9.5" fill="#94a3b8">GPS: 19.1197° N, 72.8464° E • Community Health Centre</text></svg>`),
    supply: svgToDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320" viewBox="0 0 480 320"><defs><linearGradient id="bg2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#18181b"/><stop offset="100%" stop-color="#27272a"/></linearGradient></defs><rect width="480" height="320" fill="url(#bg2)"/><rect x="140" y="100" width="90" height="90" rx="8" fill="#d97706" opacity="0.8"/><rect x="250" y="80" width="100" height="110" rx="8" fill="#2563eb" opacity="0.8"/><text x="185" y="150" font-family="Arial" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="middle">FIRST AID</text><text x="300" y="140" font-family="Arial" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="middle">RELIEF KITS</text><rect x="20" y="20" width="440" height="280" fill="none" stroke="#3b82f6" stroke-width="2" rx="10"/><rect x="30" y="248" width="420" height="42" rx="6" fill="rgba(0,0,0,0.8)"/><circle cx="48" cy="269" r="5" fill="#3b82f6"/><text x="62" y="266" font-family="monospace" font-size="11" font-weight="bold" fill="#ffffff">LOGISTICS &amp; DISPATCH DESK</text><text x="62" y="281" font-family="monospace" font-size="9.5" fill="#94a3b8">GPS: 19.1197° N, 72.8464° E • Inventory Verified</text></svg>`),
    field: svgToDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320" viewBox="0 0 480 320"><defs><linearGradient id="bg3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#064e3b"/><stop offset="100%" stop-color="#022c22"/></linearGradient></defs><rect width="480" height="320" fill="url(#bg3)"/><circle cx="240" cy="120" r="45" fill="#10b981"/><path d="M190,220 Q240,170 290,220 L300,260 L180,260 Z" fill="#059669"/><rect x="20" y="20" width="440" height="280" fill="none" stroke="#10b981" stroke-width="2" rx="10"/><rect x="30" y="248" width="420" height="42" rx="6" fill="rgba(0,0,0,0.85)"/><circle cx="48" cy="269" r="5" fill="#10b981"/><text x="62" y="266" font-family="monospace" font-size="11" font-weight="bold" fill="#ffffff">MOBILE FIRST-AID TRIAGE SQUAD</text><text x="62" y="281" font-family="monospace" font-size="9.5" fill="#94a3b8">GPS: 19.1197° N, 72.8464° E • Station Active</text></svg>`)
  };

  let selectedPresetPhoto = PHOTO_PRESETS.medical;

  function setDeploymentStage(stage) {
    state.activeDeployment.status = stage;
    if (stage === 'MATCHED') {
      state.activeDeployment.checkInTime = null;
      state.activeDeployment.checkOutTime = null;
      stopDeploymentTimer();
      showToast('Shift reset to Stage 1: MATCHED (Ready to Punch-In).', 'primary');
    } else if (stage === 'DEPLOYED') {
      state.activeDeployment.checkInTime = state.activeDeployment.checkInTime || '04:02 PM';
      state.activeDeployment.checkInTimestamp = state.activeDeployment.checkInTimestamp || (Date.now() - (4 * 3600 + 3 * 60 + 12) * 1000);
      state.activeDeployment.checkInPhoto = state.activeDeployment.checkInPhoto || PHOTO_PRESETS.medical;
      startDeploymentTimer();
      showToast('Shift switched to Stage 2: DEPLOYED (Live Stopwatch & Tasks Active).', 'success');
    } else if (stage === 'COMPLETED') {
      state.activeDeployment.checkInTime = state.activeDeployment.checkInTime || '04:02 PM';
      state.activeDeployment.checkOutTime = state.activeDeployment.checkOutTime || '08:05 PM';
      state.activeDeployment.checkInPhoto = state.activeDeployment.checkInPhoto || PHOTO_PRESETS.medical;
      stopDeploymentTimer();
      showToast('Shift switched to Stage 3: COMPLETED (Certificate & Verified Hours Ready).', 'success');
    }
    if (window.SahayakDB && window.SahayakDB.isConfigured()) {
      window.SahayakDB.saveDeployment(state.activeDeployment);
    }
    renderApp();
  }

  function switchDeploymentDrive(oppId) {
    const opp = state.opportunities.find(o => o.id === oppId);
    if (!opp) return;
    state.activeDeployment.eventId = opp.id;
    state.activeDeployment.eventTitle = opp.title;
    state.activeDeployment.organization = opp.organization;
    state.activeDeployment.assignedLocation = opp.location;
    state.activeDeployment.shiftTime = opp.shiftTime;
    state.activeDeployment.shiftHours = opp.hours || 4;
    state.activeDeployment.qrCodeToken = `SHK-2026-${opp.id.toUpperCase()}-SECTOR`;
    showToast(`Switched active deployment drive to: ${opp.title}`, 'primary');
    renderApp();
  }

  function addNewShiftTask() {
    const taskText = prompt('Enter description for new field task:');
    if (!taskText || !taskText.trim()) return;
    if (!state.activeDeployment.tasks) {
      state.activeDeployment.tasks = [];
    }
    state.activeDeployment.tasks.push({
      id: `task-${Date.now()}`,
      text: taskText.trim(),
      done: false
    });
    if (window.SahayakDB && window.SahayakDB.isConfigured()) {
      window.SahayakDB.saveDeployment(state.activeDeployment);
    }
    showToast('New field task added to shift checklist.', 'success');
    renderApp();
  }

  function renderDeploymentTrackingPage() {
    const dep = state.activeDeployment;

    // Start live timer if currently deployed
    if (dep.status === 'DEPLOYED') {
      setTimeout(startDeploymentTimer, 50);
    } else {
      stopDeploymentTimer();
    }

    // Stepper line calculations
    const isMatched = dep.status === 'MATCHED' || dep.status === 'DEPLOYED' || dep.status === 'COMPLETED';
    const isDeployed = dep.status === 'DEPLOYED' || dep.status === 'COMPLETED';
    const isCompleted = dep.status === 'COMPLETED';

    let progressLineWidth = '33%';
    if (dep.status === 'DEPLOYED') progressLineWidth = '66%';
    else if (dep.status === 'COMPLETED') progressLineWidth = '100%';

    const currentPhoto = dep.checkInPhoto || PHOTO_PRESETS.medical;
    const tasks = dep.tasks || [
      { id: 't1', text: 'On-site arrival & safety gear equipped', done: true },
      { id: 't2', text: 'Triage briefing with Dr. S. Mehta', done: true },
      { id: 't3', text: 'Patient vitals recording & token intake', done: false },
      { id: 't4', text: 'First aid medicine kit distribution', done: false }
    ];
    const completedTasksCount = tasks.filter(t => t.done).length;
    const taskPercent = Math.round((completedTasksCount / Math.max(1, tasks.length)) * 100);

    return `
      <div class="deployment-container">
        
        <!-- 1. OPERATIONS CONSOLE TOP BANNER -->
        <section class="welcome-hero" style="background: linear-gradient(135deg, #064e3b 0%, #047857 50%, #0f766e 100%); color: var(--white); margin-bottom: 20px; box-shadow: 0 10px 25px -5px rgba(6, 78, 59, 0.35);">
          <div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
              <span class="badge" style="background: rgba(255,255,255,0.2); color: var(--white); font-weight: 800; font-size: 0.76rem; letter-spacing: 0.05em;">
                ⏱️ ON-GROUND OPERATIONS CONSOLE
              </span>
              <span style="color: #a7f3d0; font-size: 0.82rem; font-weight: 600;">Shift Token: ${dep.qrCodeToken}</span>
            </div>
            <h1 class="welcome-title" style="color: var(--white); font-size: 1.75rem;">${dep.eventTitle}</h1>
            <p class="welcome-subtitle" style="color: #ecfdf5; font-size: 0.92rem;">Live field telemetry tracking, on-site geotagged photo proofs, task checklists, and instant service certification.</p>
          </div>

          <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
            <span class="status-badge-giant ${dep.status.toLowerCase()}" style="font-size: 0.88rem; padding: 8px 18px;">
              ● ${dep.status === 'DEPLOYED' ? 'LIVE ON-DUTY SHIFT' : dep.status === 'MATCHED' ? 'READY TO CLOCK IN' : 'SHIFT COMPLETED'}
            </span>
            <span style="color: #d1fae5; font-size: 0.75rem;">Supervised by <strong>${dep.organization}</strong></span>
          </div>
        </section>

        <!-- 2. LIFECYCLE STAGE SWITCHER / SIMULATOR (EASY DEMO & TESTING CONTROLLER) -->
        <div class="deployment-stage-selector-bar">
          <button class="deployment-stage-btn ${dep.status === 'MATCHED' ? 'active' : ''}" onclick="window.SahayakApp.setDeploymentStage('MATCHED');">
            <span>📍 Stage 1: Matched / Ready to Punch In</span>
          </button>
          <button class="deployment-stage-btn ${dep.status === 'DEPLOYED' ? 'active' : ''}" onclick="window.SahayakApp.setDeploymentStage('DEPLOYED');">
            <span>⏱️ Stage 2: Deployed / Active Shift &amp; Stopwatch</span>
          </button>
          <button class="deployment-stage-btn ${dep.status === 'COMPLETED' ? 'active' : ''}" onclick="window.SahayakApp.setDeploymentStage('COMPLETED');">
            <span>🏅 Stage 3: Completed / Certificate &amp; Record</span>
          </button>
        </div>

        <!-- 3. HORIZONTAL 4-STEP TRACKER CARD -->
        <div class="deployment-header-card" style="padding: 20px 24px; margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; flex-wrap: wrap; gap: 10px;">
            <div>
              <span style="font-size: 0.8rem; font-weight: 800; text-transform: uppercase; color: var(--neutral-500); letter-spacing: 0.05em;">
                4-Stage Deployment Progress
              </span>
              <div style="font-size: 0.76rem; color: var(--neutral-500); margin-top: 2px;">
                Lifecycle: POSTED → MATCHED → DEPLOYED (PUNCH-IN) → COMPLETED (CERTIFICATE)
              </div>
            </div>
            
            <!-- Drive Switcher Dropdown -->
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 0.76rem; color: var(--neutral-600); font-weight: 700;">Active Drive:</span>
              <select class="form-input" style="padding: 4px 10px; font-size: 0.78rem; width: auto; font-weight: 700;" onchange="window.SahayakApp.switchDeploymentDrive(this.value);">
                ${state.opportunities.map(opp => `
                  <option value="${opp.id}" ${opp.id === dep.eventId ? 'selected' : ''}>${opp.title} (${opp.organization})</option>
                `).join('')}
              </select>
            </div>
          </div>

          <!-- HORIZONTAL STEP TRACKER -->
          <div class="progress-stepper-horizontal" style="margin: 24px 0 10px 0;">
            <div class="stepper-active-line" style="width: ${progressLineWidth};"></div>

            <!-- Step 1: POSTED -->
            <div class="step-node completed">
              <div class="step-circle">✓</div>
              <span class="step-label">POSTED</span>
              <span style="font-size: 0.7rem; color: var(--neutral-400);">Drive Active</span>
            </div>

            <!-- Step 2: MATCHED -->
            <div class="step-node ${isMatched ? (dep.status === 'MATCHED' ? 'current' : 'completed') : ''}">
              <div class="step-circle">${isDeployed ? '✓' : '2'}</div>
              <span class="step-label">MATCHED</span>
              <span style="font-size: 0.7rem; color: var(--neutral-400);">92% AI Score</span>
            </div>

            <!-- Step 3: DEPLOYED -->
            <div class="step-node ${isDeployed ? (dep.status === 'DEPLOYED' ? 'current' : 'completed') : ''}">
              <div class="step-circle">${isCompleted ? '✓' : '⏱️'}</div>
              <span class="step-label">PUNCH IN</span>
              <span style="font-size: 0.7rem; color: var(--neutral-400);">${dep.checkInTime || 'Photo Clock-In'}</span>
            </div>

            <!-- Step 4: COMPLETED -->
            <div class="step-node ${isCompleted ? 'completed current' : ''}">
              <div class="step-circle">${isCompleted ? '★' : '🏁'}</div>
              <span class="step-label">COMPLETED</span>
              <span style="font-size: 0.7rem; color: var(--neutral-400);">${dep.checkOutTime || 'Certificate'}</span>
            </div>
          </div>
        </div>

        <!-- 4. OFFICIAL ATTENDANCE PROOF & VERIFICATION HUB (KEY FEATURE) -->
        <div class="card" style="margin-bottom: 24px; border: 2px solid ${dep.status === 'MATCHED' ? '#f59e0b' : '#10b981'}; background: linear-gradient(to right, #ffffff, #f0fdf4);">
          <div class="card-header" style="margin-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="width: 36px; height: 36px; border-radius: 50%; background: ${dep.status === 'MATCHED' ? '#fef3c7' : '#dcfce7'}; color: ${dep.status === 'MATCHED' ? '#d97706' : '#166534'}; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">
                ${dep.status === 'MATCHED' ? '📸' : '🛡️'}
              </div>
              <div>
                <h4 style="font-weight: 800; font-size: 1.05rem; color: var(--primary-900); margin: 0;">
                  Event Attendance Proof &amp; Verification Hub
                </h4>
                <p style="font-size: 0.78rem; color: var(--neutral-500); margin: 2px 0 0 0;">
                  Mandatory on-ground verification: Geotagged photo proof, GPS geofence lock, and supervisor sign-off.
                </p>
              </div>
            </div>
            <span class="badge ${dep.status === 'MATCHED' ? 'badge-danger' : 'badge-success'}" style="font-size: 0.75rem; padding: 5px 12px; font-weight: 800;">
              ${dep.status === 'MATCHED' ? '⚠️ ATTENDANCE PROOF REQUIRED' : '✓ ATTENDANCE VERIFIED &amp; GEOFENCE LOCKED'}
            </span>
          </div>

          <div style="display: grid; grid-template-columns: auto 1fr auto; gap: 18px; align-items: center; padding: 12px; background: #fff; border-radius: var(--radius-md); border: 1px solid var(--neutral-200); margin-bottom: 12px;">
            <!-- Thumbnail of Photo Proof -->
            <div style="position: relative; width: 68px; height: 68px; border-radius: var(--radius-sm); overflow: hidden; border: 2px solid #10b981; flex-shrink: 0; cursor: pointer;" onclick="window.SahayakApp.openPhotoProofViewer();" title="Click to view full photo proof">
              <img src="${currentPhoto}" alt="Verified Attendance Proof" style="width: 100%; height: 100%; object-fit: cover;" />
              <span style="position: absolute; bottom: 2px; right: 2px; background: rgba(0,0,0,0.7); color: #a7f3d0; font-size: 0.6rem; padding: 1px 4px; border-radius: 2px; font-family: monospace;">GPS ✓</span>
            </div>

            <!-- Proof Details -->
            <div style="font-size: 0.82rem; line-height: 1.45;">
              <div style="font-weight: 800; color: var(--primary-900); margin-bottom: 2px;">
                ${dep.status === 'MATCHED' ? 'Awaiting On-Site Punch-In Photo' : '✓ On-Ground Attendance Stamped &amp; Validated'}
              </div>
              <div style="color: var(--neutral-600); font-size: 0.76rem;">
                <strong>GPS Coordinates:</strong> 19.1197° N, 72.8464° E (14m inside venue perimeter)
              </div>
              <div style="color: var(--neutral-600); font-size: 0.76rem;">
                <strong>Supervisor Sign-Off:</strong> Dr. S. Mehta (Chief Medical Officer) • Station: Room 3 Triage
              </div>
              <div style="color: #059669; font-size: 0.74rem; font-weight: 700; margin-top: 2px;">
                Token: <span style="font-family: monospace;">${dep.qrCodeToken}</span> • Verification Code: <span style="font-family: monospace;">8492-MED</span>
              </div>
            </div>

            <!-- Action Buttons for Attendance -->
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <button class="btn btn-sm btn-primary" style="font-size: 0.74rem; padding: 6px 12px; font-weight: 800; background: #059669; border-color: #059669;" onclick="window.SahayakApp.openAttendanceQrPassModal();">
                📲 Show Event Pass QR
              </button>
              <button class="btn btn-sm btn-secondary" style="font-size: 0.74rem; padding: 5px 10px;" onclick="window.SahayakApp.openLivePhotoClockInModal();">
                📸 ${dep.status === 'MATCHED' ? 'Capture Attendance Photo' : 'Update Photo Proof'}
              </button>
              <button class="btn btn-sm btn-secondary" style="font-size: 0.74rem; padding: 5px 10px;" onclick="window.SahayakApp.openAttendanceSlipModal();">
                📄 Attendance Slip
              </button>
              <button class="btn btn-sm btn-primary" style="font-size: 0.74rem; padding: 5px 10px; background: #047857; border-color: #047857; font-weight: 800;" onclick="window.SahayakApp.markAttendanceVerified('${dep.eventId}');">
                ✓ Mark Attendance Verified
              </button>
            </div>
          </div>
        </div>

        <!-- 5. MAIN DEPLOYMENT ACTION & DETAILS 2-COLUMN GRID -->
        <div class="deployment-action-card" style="margin-bottom: 24px;">
          
          <!-- LEFT COLUMN: LIVE TELEMETRY / STOPWATCH / PHOTO PROOF -->
          <div class="deployment-status-hero">
            <div>
              <div style="font-size: 0.76rem; text-transform: uppercase; font-weight: 800; color: var(--primary-700); letter-spacing: 0.05em; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
                <span class="pulse-green-dot"></span> Verified Field Telemetry (Live Stopwatch &amp; Photo Proof)
              </div>
              <h3 style="font-size: 1.35rem; font-weight: 800; color: var(--primary-900); margin-bottom: 8px;">
                ${dep.status === 'MATCHED' ? '📸 Ready for Photo Punch-In &amp; Clock-In' :
                  dep.status === 'DEPLOYED' ? '⏱️ Active Shift Stopwatch &amp; Field Telemetry' : '🎖️ Shift Successfully Concluded'}
              </h3>
              <p style="font-size: 0.88rem; color: var(--neutral-600); margin-bottom: 18px; line-height: 1.5;">
                ${dep.status === 'MATCHED' ? 'Verify your on-site presence by capturing a quick on-ground photo proof. Once verified, your live service stopwatch begins automatically.' :
                  dep.status === 'DEPLOYED' ? 'Your shift is currently active and time is being recorded live. Check off completed field tasks below and conclude your shift when finished.' :
                  'Your 4.0 volunteer hours have been verified and credited to your permanent Sahayak record.'}
              </p>

              <!-- STATE 1: MATCHED (GEOFENCE RADAR & READY TO CLOCK IN) -->
              ${dep.status === 'MATCHED' ? `
                <div class="geofence-radar-box">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <span class="pulse-green-dot"></span>
                      <strong style="font-size: 0.88rem; color: #a7f3d0;">Live GPS Geofence Radar</strong>
                    </div>
                    <span class="badge badge-success" style="font-size: 0.72rem; padding: 4px 10px;">
                      📍 14m Away (Inside 50m Zone)
                    </span>
                  </div>

                  <div style="display: flex; align-items: center; gap: 16px;">
                    <div style="width: 84px; height: 84px; position: relative; flex-shrink: 0;">
                      <svg width="84" height="84" viewBox="0 0 84 84">
                        <circle cx="42" cy="42" r="40" fill="none" stroke="#1e3a8a" stroke-width="1.5" />
                        <circle cx="42" cy="42" r="26" fill="none" stroke="#2563eb" stroke-width="1" stroke-dasharray="3 3" />
                        <circle cx="42" cy="42" r="12" fill="none" stroke="#10b981" stroke-width="1.5" />
                        <line x1="42" y1="2" x2="42" y2="82" stroke="#1e3a8a" stroke-width="1" />
                        <line x1="2" y1="42" x2="82" y2="42" stroke="#1e3a8a" stroke-width="1" />
                        <g class="radar-sweep-circle">
                          <polygon points="42,42 42,2 82,42" fill="url(#radar-grad)" opacity="0.3" />
                        </g>
                        <!-- Volunteer Position Dot -->
                        <circle cx="48" cy="38" r="4" fill="#10b981">
                          <animate attributeName="r" values="3;6;3" dur="1.5s" repeatCount="indefinite" />
                        </circle>
                        <defs>
                          <radialGradient id="radar-grad" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stop-color="#10b981" stop-opacity="0.8"/>
                            <stop offset="100%" stop-color="#10b981" stop-opacity="0"/>
                          </radialGradient>
                        </defs>
                      </svg>
                    </div>

                    <div style="font-size: 0.82rem; line-height: 1.5; color: #cbd5e1;">
                      <div style="font-weight: 700; color: #fff;">Muster Coordinates: 19.1197° N, 72.8464° E</div>
                      <div style="font-size: 0.76rem; color: #94a3b8;">Venue: ${dep.assignedLocation}</div>
                      <div style="margin-top: 6px; display: flex; gap: 6px;">
                        <button type="button" class="btn btn-sm btn-secondary" style="font-size: 0.72rem; padding: 2px 8px; color: #93c5fd; background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.2);" onclick="window.SahayakApp.showToast('Simulating GPS Telemetry Ping: Signal Accuracy 99.8%', 'success');">
                          📡 Ping GPS Signal
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ` : ''}

              <!-- STATE 2: DEPLOYED (LIVE STOPWATCH, EXPANDABLE PHOTO & TASK PROGRESS) -->
              ${dep.status === 'DEPLOYED' ? `
                <div class="live-stopwatch-box">
                  <div class="stopwatch-header-row">
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <span class="pulse-green-dot"></span>
                      <span style="font-size: 0.75rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: #6ee7b7;">
                        LIVE SHIFT STOPWATCH
                      </span>
                    </div>
                    <span style="background: rgba(16, 185, 129, 0.2); border: 1px solid #10b981; color: #a7f3d0; font-size: 0.7rem; font-weight: 700; padding: 2px 8px; border-radius: 999px;">
                      Clock-In: ${dep.checkInTime || '04:02 PM'}
                    </span>
                  </div>

                  <!-- DIGITAL TIME DISPLAY -->
                  <div class="stopwatch-timer-display" id="live-stopwatch-display">
                    <div class="stopwatch-digits-block">
                      <span class="stopwatch-num" id="stopwatch-hrs">04</span>
                      <span class="stopwatch-unit">Hours</span>
                    </div>
                    <span class="stopwatch-colon">:</span>
                    <div class="stopwatch-digits-block">
                      <span class="stopwatch-num" id="stopwatch-mins">03</span>
                      <span class="stopwatch-unit">Minutes</span>
                    </div>
                    <span class="stopwatch-colon">:</span>
                    <div class="stopwatch-digits-block">
                      <span class="stopwatch-num" id="stopwatch-secs">12</span>
                      <span class="stopwatch-unit">Seconds</span>
                    </div>
                  </div>

                  <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.78rem; color: #cbd5e1; padding-top: 4px;">
                    <span>Target Shift: <strong>${dep.shiftHours} Hours</strong></span>
                    <span style="color: #6ee7b7; font-weight: 700;">● Recording Active</span>
                  </div>
                </div>

                <!-- VERIFIED CHECK-IN PHOTO BADGE & FIELD TASKS -->
                <div style="background: #fff; border: 1px solid var(--neutral-200); border-radius: var(--radius-md); padding: 14px; margin-bottom: 20px;">
                  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <img src="${currentPhoto}" alt="Photo Proof" style="width: 48px; height: 48px; border-radius: var(--radius-sm); object-fit: cover; border: 2px solid #10b981; cursor: pointer;" onclick="window.SahayakApp.openPhotoProofViewer();" title="Click to view full photo proof" />
                      <div>
                        <div style="font-weight: 800; font-size: 0.85rem; color: var(--primary-900); display: flex; align-items: center; gap: 4px;">
                          ✓ Verified Photo Proof <span style="font-size: 0.72rem; color: var(--success-600);">(On-Site)</span>
                        </div>
                        <div style="font-size: 0.74rem; color: var(--neutral-500); font-family: monospace;">
                          Geotagged: 19.1197° N, 72.8464° E
                        </div>
                      </div>
                    </div>
                    <button class="btn btn-secondary btn-sm" style="font-size: 0.72rem; padding: 4px 8px;" onclick="window.SahayakApp.openPhotoProofViewer();">
                      🔍 Expand
                    </button>
                  </div>

                  <!-- LIVE FIELD TASKS PROGRESS BAR -->
                  <div style="margin-bottom: 10px;">
                    <div style="display: flex; justify-content: space-between; font-size: 0.76rem; font-weight: 800; text-transform: uppercase; color: var(--neutral-600); margin-bottom: 4px;">
                      <span>Shift Tasks: ${completedTasksCount} / ${tasks.length} Completed</span>
                      <span style="color: var(--primary-800);">${taskPercent}%</span>
                    </div>
                    <div style="height: 6px; background: var(--neutral-200); border-radius: 999px; overflow: hidden;">
                      <div style="width: ${taskPercent}%; height: 100%; background: linear-gradient(90deg, #2563eb, #10b981); border-radius: 999px; transition: width 0.3s ease;"></div>
                    </div>
                  </div>

                  <!-- LIVE FIELD TASKS CHECKLIST -->
                  <div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 10px;">
                    ${tasks.map(t => `
                      <div class="shift-task-item ${t.done ? 'checked' : ''}" onclick="window.SahayakApp.toggleShiftTask('${t.id}');">
                        <input type="checkbox" ${t.done ? 'checked' : ''} style="cursor: pointer;" onclick="event.stopPropagation(); window.SahayakApp.toggleShiftTask('${t.id}');" />
                        <span class="task-label-text">${t.text}</span>
                      </div>
                    `).join('')}
                  </div>

                  <button type="button" class="btn btn-sm btn-secondary" style="font-size: 0.74rem; width: 100%; justify-content: center;" onclick="window.SahayakApp.addNewShiftTask();">
                    + Add New Shift Note / Task
                  </button>
                </div>
              ` : ''}

              <!-- STATE 3: COMPLETED -->
              ${dep.status === 'COMPLETED' ? `
                <div style="background: #fff; border: 1px solid var(--neutral-200); border-radius: var(--radius-md); padding: 16px; margin-bottom: 20px;">
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
                    <div style="padding: 12px; background: var(--neutral-50); border-radius: var(--radius-sm); border: 1px solid var(--neutral-200);">
                      <div style="font-size: 0.72rem; color: var(--neutral-500); text-transform: uppercase; font-weight: 700;">CHECK-IN LOG</div>
                      <div style="font-weight: 800; font-size: 1.1rem; color: var(--primary-900); margin-top: 2px; display: flex; align-items: center; gap: 6px;">
                        🟢 ${dep.checkInTime || '04:02 PM'}
                      </div>
                      <div style="font-size: 0.7rem; color: var(--success-600); font-weight: 600; margin-top: 4px;">✓ Photo Proof Verified</div>
                    </div>
                    <div style="padding: 12px; background: var(--neutral-50); border-radius: var(--radius-sm); border: 1px solid var(--neutral-200);">
                      <div style="font-size: 0.72rem; color: var(--neutral-500); text-transform: uppercase; font-weight: 700;">CHECK-OUT LOG</div>
                      <div style="font-weight: 800; font-size: 1.1rem; color: var(--primary-900); margin-top: 2px; display: flex; align-items: center; gap: 6px;">
                        🏁 ${dep.checkOutTime || '08:05 PM'}
                      </div>
                      <div style="font-size: 0.7rem; color: var(--primary-700); font-weight: 600; margin-top: 4px;">${dep.shiftHours}.0 Hours Verified</div>
                    </div>
                  </div>

                  <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: var(--radius-sm);">
                    <span style="font-size: 0.85rem; font-weight: 800; color: #065f46; display: flex; align-items: center; gap: 6px;">
                      ✓ Service Verified • ${dep.shiftHours} Hours Credited
                    </span>
                    <button class="btn btn-secondary btn-sm" style="font-size: 0.72rem; padding: 3px 8px;" onclick="window.SahayakApp.openShiftDebriefViewModal();">
                      View Task Summary
                    </button>
                  </div>
                </div>
              ` : ''}

            </div>

            <!-- INTERACTIVE BUTTONS ACCORDING TO STATE -->
            <div style="display: flex; gap: 10px; flex-direction: column;">
              ${dep.status === 'MATCHED' ? `
                <button id="btn-checkin" class="btn btn-primary btn-lg" style="background: linear-gradient(135deg, #059669, #047857); border: none; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 10px; box-shadow: 0 4px 14px rgba(5, 150, 105, 0.4);" onclick="window.SahayakApp.openLivePhotoClockInModal();">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                  📸 Punch In with Live Photo Proof →
                </button>
              ` : ''}

              ${dep.status === 'DEPLOYED' ? `
                <button id="btn-checkout" class="btn btn-primary btn-lg" style="background: linear-gradient(135deg, #1e40af, #1d4ed8); border: none; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 10px; box-shadow: 0 4px 14px rgba(30, 64, 175, 0.4);" onclick="window.SahayakApp.openConcludeShiftModal();">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  🏁 Conclude Shift &amp; Clock Out →
                </button>
              ` : ''}

              ${dep.status === 'COMPLETED' ? `
                <button class="btn btn-primary btn-lg" style="background: linear-gradient(135deg, #0a1f44, #0f3d87); border: none; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 8px;" onclick="window.SahayakApp.openServiceCertificate();">
                  View Digital Volunteer Certificate 🏅
                </button>
                <div style="display: flex; gap: 8px;">
                  <button class="btn btn-secondary" style="flex: 1;" onclick="window.SahayakApp.openShiftDebriefViewModal();">
                    📸 Photo Proof &amp; Debrief
                  </button>
                  <button class="btn btn-secondary" style="flex: 1;" onclick="window.SahayakApp.openTelemetryAuditModal();">
                    Audit Trail 📄
                  </button>
                </div>
              ` : ''}

              <button class="btn btn-sm btn-outline-danger" onclick="window.SahayakApp.showToast('Emergency SOS signal dispatched to ${dep.emergencyContact.name} and Disaster Control!', 'danger');">
                🚨 SOS / Trigger Emergency Assistance
              </button>
            </div>
          </div>

          <!-- RIGHT COLUMN: ASSIGNED DETAILS & TEAM ROSTER -->
          <div>
            <h4 style="font-weight: 800; font-size: 1.1rem; color: var(--primary-900); margin-bottom: 14px; display: flex; align-items: center; justify-content: space-between;">
              <span>Deployment Specification</span>
              <span class="badge badge-primary" style="font-size: 0.72rem;">Live Roster</span>
            </h4>

            <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; background: var(--neutral-50); padding: 16px; border-radius: var(--radius-md); border: 1px solid var(--neutral-200);">
              <div style="display: flex; justify-content: space-between; font-size: 0.88rem; padding-bottom: 8px; border-bottom: 1px solid var(--neutral-200);">
                <span style="color: var(--neutral-500);">Assigned Station:</span>
                <span style="font-weight: 700; color: var(--neutral-900); text-align: right; max-width: 65%;">${dep.assignedLocation}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 0.88rem; padding-bottom: 8px; border-bottom: 1px solid var(--neutral-200);">
                <span style="color: var(--neutral-500);">Shift Schedule:</span>
                <span style="font-weight: 700; color: var(--neutral-900);">${dep.shiftTime} (${dep.shiftHours} hrs)</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 0.88rem; padding-bottom: 8px; border-bottom: 1px solid var(--neutral-200);">
                <span style="color: var(--neutral-500);">Lead Supervisor:</span>
                <span style="font-weight: 700; color: var(--primary-800);">${dep.emergencyContact.name} (${dep.emergencyContact.phone})</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 0.88rem;">
                <span style="color: var(--neutral-500);">Verification QR:</span>
                <span style="font-family: monospace; font-size: 0.8rem; color: var(--neutral-700);">${dep.qrCodeToken}</span>
              </div>
            </div>

            <!-- TEAM ROSTER -->
            <h5 style="font-weight: 700; font-size: 0.95rem; color: var(--primary-900); margin-bottom: 10px;">
              Assigned Team Members (${dep.teamMembers.length})
            </h5>

            <div class="team-roster-list" style="margin-bottom: 20px;">
              ${dep.teamMembers.map(member => `
                <div class="team-member-row">
                  <div class="team-member-info">
                    <div class="user-avatar-circle" style="width: 32px; height: 32px; font-size: 0.75rem; background: ${member.isCurrentUser ? 'var(--primary-800)' : 'var(--neutral-600)'};">
                      ${member.avatar}
                    </div>
                    <div>
                      <div style="font-weight: 700; font-size: 0.88rem; color: var(--neutral-900);">
                        ${member.name} ${member.isCurrentUser ? '<span class="badge badge-primary" style="font-size:0.65rem; padding: 1px 6px;">You</span>' : ''}
                      </div>
                      <div style="font-size: 0.74rem; color: var(--neutral-500);">${member.skill}</div>
                    </div>
                  </div>
                  <span class="badge badge-success" style="font-size: 0.7rem;">On-Duty</span>
                </div>
              `).join('')}
            </div>

            <!-- QUICK ACTIONS -->
            <div style="display: flex; gap: 8px;">
              <button class="btn btn-sm btn-secondary" style="flex: 1;" onclick="window.SahayakApp.showToast('Opening Google Maps navigation to: ' + state.activeDeployment.assignedLocation, 'primary');">
                📍 Get Directions
              </button>
              <button class="btn btn-sm btn-secondary" style="flex: 1;" onclick="window.SahayakApp.showToast('Calling supervisor: ' + state.activeDeployment.emergencyContact.phone, 'primary');">
                📞 Call Supervisor
              </button>
            </div>

          </div>

        </div>

        <!-- 5. VERIFIED DEPLOYMENT RECORD BOOK & RECENT SHIFT HISTORY -->
        <div class="card" style="margin-bottom: 20px;">
          <div class="card-header" style="margin-bottom: 14px;">
            <div>
              <h4 style="font-weight: 800; font-size: 1.1rem; color: var(--primary-900); margin-bottom: 2px;">
                Verified Deployment History &amp; Service Log
              </h4>
              <p style="font-size: 0.8rem; color: var(--neutral-500);">Permanent record of all on-ground verified shifts and earned certificate tokens.</p>
            </div>
            <span class="badge badge-success" style="font-weight: 700;">100% Reliability Score</span>
          </div>

          <div style="overflow-x: auto;">
            <table class="data-table" style="width: 100%;">
              <thead>
                <tr>
                  <th>Event / Mission</th>
                  <th>NGO Organization</th>
                  <th>Shift Date</th>
                  <th>Hours</th>
                  <th>Verified Mode</th>
                  <th>Certificate</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>${dep.eventTitle}</strong></td>
                  <td>${dep.organization}</td>
                  <td>Today, Oct 5</td>
                  <td><span class="badge badge-primary">${dep.shiftHours}.0 Hrs</span></td>
                  <td><span class="badge badge-success">✓ Photo &amp; GPS</span></td>
                  <td>
                    <button class="btn btn-sm btn-secondary" style="font-size: 0.72rem; padding: 2px 8px;" onclick="window.SahayakApp.openServiceCertificate();">
                      🏅 View Cert
                    </button>
                  </td>
                </tr>
                <tr>
                  <td><strong>Flood Relief &amp; Emergency Supply</strong></td>
                  <td>Seva Bharat Relief</td>
                  <td>Oct 2, 2026</td>
                  <td><span class="badge badge-primary">6.0 Hrs</span></td>
                  <td><span class="badge badge-success">✓ Photo &amp; GPS</span></td>
                  <td>
                    <button class="btn btn-sm btn-secondary" style="font-size: 0.72rem; padding: 2px 8px;" onclick="window.SahayakApp.openServiceCertificate();">
                      🏅 View Cert
                    </button>
                  </td>
                </tr>
                <tr>
                  <td><strong>Mega Health &amp; Blood Donation Drive</strong></td>
                  <td>Red Cross Mumbai</td>
                  <td>Sep 28, 2026</td>
                  <td><span class="badge badge-primary">5.0 Hrs</span></td>
                  <td><span class="badge badge-success">✓ Photo &amp; GPS</span></td>
                  <td>
                    <button class="btn btn-sm btn-secondary" style="font-size: 0.72rem; padding: 2px 8px;" onclick="window.SahayakApp.openServiceCertificate();">
                      🏅 View Cert
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;
  }

  function toggleShiftTask(taskId) {
    if (!state.activeDeployment.tasks) {
      state.activeDeployment.tasks = [
        { id: 't1', text: 'On-site arrival & safety gear equipped', done: true },
        { id: 't2', text: 'Triage briefing with Dr. S. Mehta', done: true },
        { id: 't3', text: 'Patient vitals recording & token intake', done: false },
        { id: 't4', text: 'First aid medicine kit distribution', done: false }
      ];
    }
    const task = state.activeDeployment.tasks.find(t => t.id === taskId);
    if (task) {
      task.done = !task.done;
      if (window.SahayakDB && window.SahayakDB.isConfigured()) {
        window.SahayakDB.saveDeployment(state.activeDeployment);
      }
      renderApp();
    }
  }

  function acceptOpportunity(eventId) {
    const opp = state.opportunities.find(o => o.id === eventId) || state.opportunities[0];
    opp.volunteersMatched = (opp.volunteersMatched || 0) + 1;

    // Maintain persistent scheduledTasks list
    if (!state.scheduledTasks) {
      state.scheduledTasks = [];
    }

    const existingIdx = state.scheduledTasks.findIndex(t => t.id === opp.id || t.eventId === opp.id);
    const scheduledItem = {
      id: opp.id,
      eventId: opp.id,
      title: opp.title,
      organization: opp.organization,
      location: opp.location,
      shiftTime: opp.shiftTime,
      date: opp.date || "Today, Oct 5, 2026",
      hours: opp.hours || 4,
      status: "MATCHED",
      category: opp.category,
      emergencyContact: opp.emergencyContact || { name: "Lead Coordinator", phone: "+91 98200 00000" },
      assignedTasks: opp.tasks || [
        "On-site arrival & safety briefing",
        "Execute frontline field operations",
        "Debrief with site supervisor"
      ],
      acceptedAt: new Date().toISOString()
    };

    if (existingIdx >= 0) {
      state.scheduledTasks[existingIdx] = scheduledItem;
    } else {
      state.scheduledTasks.unshift(scheduledItem);
    }

    // Set as active deployment
    state.activeDeployment.status = 'MATCHED';
    state.activeDeployment.eventId = opp.id;
    state.activeDeployment.eventTitle = opp.title;
    state.activeDeployment.organization = opp.organization;
    state.activeDeployment.assignedLocation = opp.location;
    state.activeDeployment.shiftTime = opp.shiftTime;
    state.activeDeployment.shiftHours = opp.hours || 4;
    state.activeDeployment.qrCodeToken = `SHK-2026-${opp.id.toUpperCase()}-SECTOR`;

    if (window.SahayakDB && window.SahayakDB.isConfigured()) {
      window.SahayakDB.saveDeployment(state.activeDeployment);
    }

    showToast(`🎉 Accepted! "${opp.title}" is now added to your Scheduled Tasks & Shifts.`, 'success');
    state.currentDemoStep = 6;
    renderApp();
    navigateTo('dashboard');
  }

  function startScheduledTask(taskId) {
    let task = null;
    if (taskId) {
      task = (state.scheduledTasks || []).find(t => t.id === taskId || t.eventId === taskId);
      if (!task) {
        task = (state.opportunities || []).find(o => o.id === taskId);
      }
    }
    if (!task && state.scheduledTasks && state.scheduledTasks.length > 0) {
      task = state.scheduledTasks[0];
    }
    if (!task && state.opportunities && state.opportunities.length > 0) {
      task = state.opportunities[0];
    }

    if (task) {
      state.activeDeployment.status = task.status || 'MATCHED';
      state.activeDeployment.eventId = task.eventId || task.id;
      state.activeDeployment.eventTitle = task.title;
      state.activeDeployment.organization = task.organization;
      state.activeDeployment.assignedLocation = task.location || task.assignedLocation || 'Community Health Centre, Andheri West';
      state.activeDeployment.shiftTime = task.shiftTime || '4:00 PM – 8:00 PM';
      state.activeDeployment.shiftHours = task.hours || task.shiftHours || 4;
      state.activeDeployment.qrCodeToken = `SHK-2026-${(task.eventId || task.id || 'GEN').toUpperCase()}-SECTOR`;
    }

    navigateTo('deployments');
  }

  function markAttendanceVerified(eventId) {
    const opp = (state.opportunities || []).find(o => o.id === eventId) || state.opportunities[0];
    const targetEventId = opp ? opp.id : (eventId || 'opp-med-01');
    const targetTitle = opp ? opp.title : 'Medical Relief Camp';
    const targetOrg = opp ? opp.organization : 'Helping Hands Foundation';
    const targetLoc = opp ? opp.location : 'Community Health Centre, Andheri West';

    state.activeDeployment.status = 'COMPLETED';
    state.activeDeployment.eventId = targetEventId;
    state.activeDeployment.eventTitle = targetTitle;
    state.activeDeployment.organization = targetOrg;
    state.activeDeployment.assignedLocation = targetLoc;
    state.activeDeployment.attendanceVerified = true;
    state.activeDeployment.checkInTime = state.activeDeployment.checkInTime || '04:02 PM';
    state.activeDeployment.checkOutTime = state.activeDeployment.checkOutTime || '08:05 PM';
    state.activeDeployment.checkInPhoto = state.activeDeployment.checkInPhoto || PHOTO_PRESETS.medical;

    if (!state.currentUser.attendedEvents) {
      state.currentUser.attendedEvents = [];
    }

    const existingIdx = state.currentUser.attendedEvents.findIndex(a => a.eventId === targetEventId);
    const newRecord = {
      id: `att-${Date.now()}`,
      eventId: targetEventId,
      title: targetTitle,
      organization: targetOrg,
      location: targetLoc,
      date: "Today, Oct 5, 2026",
      hours: 4.0,
      supervisor: "Dr. S. Mehta (Chief Medical Officer)",
      verifiedStatus: "VERIFIED_ON_SITE",
      photoProof: state.activeDeployment.checkInPhoto || PHOTO_PRESETS.medical,
      gpsLocation: "19.1197° N, 72.8464° E (14m perimeter)",
      certificateToken: `SHK-CERT-${targetEventId.toUpperCase()}`,
      rating: 5.0,
      attendedTimestamp: new Date().toISOString()
    };

    if (existingIdx >= 0) {
      state.currentUser.attendedEvents[existingIdx] = newRecord;
    } else {
      state.currentUser.attendedEvents.unshift(newRecord);
      state.currentUser.completedEvents = (state.currentUser.completedEvents || 24) + 1;
      state.currentUser.totalVolunteerHours = (state.currentUser.totalVolunteerHours || 142) + 4;
    }

    if (window.SahayakDB && window.SahayakDB.isConfigured()) {
      window.SahayakDB.saveDeployment(state.activeDeployment);
      window.SahayakDB.saveVolunteer(state.currentUser);
    }

    renderApp();
    showToast(`✓ Attendance officially verified for "${targetTitle}"! Credited 4.0 service hours.`, 'success');
  }

  /* ========================================================
     LIVE PHOTO PROOF & CLOCK-IN MODAL
  ======================================================== */
  function openLivePhotoClockInModal() {
    selectedPresetPhoto = PHOTO_PRESETS.medical;
    const dep = state.activeDeployment;

    openModal(`
      <div class="modal-window" style="max-width: 560px; text-align: center;">
        <div class="modal-header" style="background: linear-gradient(135deg, #065f46, #047857); color: #fff;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
            <span style="font-weight: 800; font-size: 1.05rem;">Mandatory On-Site Attendance &amp; Photo Proof</span>
          </div>
          <button onclick="window.SahayakApp.closeModal();" style="color: #fff; background: rgba(255,255,255,0.1); border: none; border-radius: 50%; width: 28px; height: 28px; cursor: pointer;">✕</button>
        </div>

        <div class="modal-body" style="padding: 22px;">
          <!-- GPS GEOFENCE TELEMETRY BADGE -->
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: var(--radius-md); margin-bottom: 14px; font-size: 0.82rem;">
            <div style="display: flex; align-items: center; gap: 8px; text-align: left;">
              <span class="pulse-green-dot"></span>
              <div>
                <strong style="color: #065f46;">Geofence Perimeter Locked (14m away)</strong>
                <div style="font-size: 0.74rem; color: #047857;">19.1197° N, 72.8464° E • Station: Room 3 Triage Booth</div>
              </div>
            </div>
            <span class="badge badge-success" style="font-size: 0.7rem;">✓ GPS LOCKED</span>
          </div>

          <!-- PHOTO PROOF VIEWFINDER -->
          <div class="photo-viewfinder-wrap" id="photo-preview-wrap" style="height: 180px; margin-bottom: 12px;">
            <div class="photo-viewfinder-scanline"></div>
            <img id="checkin-preview-img" src="${selectedPresetPhoto}" alt="Check-in Photo Preview" style="width: 100%; height: 100%; object-fit: cover;" />
            <div class="photo-viewfinder-hud">
              <span>📍 LIVE GEOTAG: ANDHERI WEST HUB</span>
              <span id="live-camera-time">⏱️ ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </div>
          </div>

          <!-- PHOTO SELECTOR & UPLOAD CONTROLS -->
          <div style="margin-bottom: 14px;">
            <div style="font-size: 0.78rem; font-weight: 700; color: var(--neutral-600); margin-bottom: 6px; text-align: left;">
              Capture On-Ground Attendance Photo Proof:
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; margin-bottom: 8px;">
              <button type="button" class="photo-preset-btn active" id="btn-preset-med" style="padding: 6px 8px; font-size: 0.76rem;" onclick="window.SahayakApp.setPhotoPreset('medical');">
                🏥 Triage Booth
              </button>
              <button type="button" class="photo-preset-btn" id="btn-preset-sup" style="padding: 6px 8px; font-size: 0.76rem;" onclick="window.SahayakApp.setPhotoPreset('supply');">
                📦 Supply Desk
              </button>
              <button type="button" class="photo-preset-btn" id="btn-preset-fld" style="padding: 6px 8px; font-size: 0.76rem;" onclick="window.SahayakApp.setPhotoPreset('field');">
                🎒 Mobile Squad
              </button>
            </div>

            <div style="display: flex; gap: 8px; align-items: center;">
              <input type="file" id="custom-photo-file" accept="image/*" style="display: none;" onchange="window.SahayakApp.handlePhotoFileUpload(event);" />
              <button type="button" class="btn btn-secondary btn-sm" style="flex: 1; font-size: 0.76rem;" onclick="document.getElementById('custom-photo-file').click();">
                📁 Upload Photo from Device
              </button>
              <button type="button" class="btn btn-secondary btn-sm" style="flex: 1; font-size: 0.76rem;" onclick="window.SahayakApp.triggerCameraSnapshot();">
                📸 Take Live Camera Snapshot
              </button>
            </div>
          </div>

          <!-- SUPERVISOR SIGN-OFF PIN / VERIFICATION -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px; text-align: left;">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-size: 0.75rem;">Supervisor Sign-Off</label>
              <input type="text" class="form-input" value="Dr. S. Mehta (Lead Officer)" style="font-size: 0.78rem; font-weight: 700;" readonly />
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-size: 0.75rem;">On-Site Station PIN</label>
              <input type="text" id="input-supervisor-pin" class="form-input" value="8492" style="font-size: 0.78rem; font-family: monospace; font-weight: 800; color: #059669;" placeholder="e.g. 8492" />
            </div>
          </div>

          <div style="display: flex; gap: 10px;">
            <button type="button" class="btn btn-secondary" style="flex: 1;" onclick="window.SahayakApp.closeModal();">Cancel</button>
            <button type="button" class="btn btn-primary" style="flex: 2; background: #059669; border-color: #059669; font-weight: 800; font-size: 0.92rem;" onclick="window.SahayakApp.confirmPhotoClockIn();">
              ⚡ Verify Attendance Proof &amp; Clock In →
            </button>
          </div>
        </div>
      </div>
    `);
  }

  function openAttendanceQrPassModal() {
    const dep = state.activeDeployment;
    const user = state.currentUser;

    openModal(`
      <div class="modal-window" style="max-width: 480px; text-align: center;">
        <div class="modal-header" style="background: linear-gradient(135deg, #1e3a8a, #065f46); color: #fff;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><rect x="7" y="7" width="3" height="3"></rect><rect x="14" y="7" width="3" height="3"></rect><rect x="7" y="14" width="3" height="3"></rect><rect x="14" y="14" width="3" height="3"></rect></svg>
            <span style="font-weight: 800; font-size: 1.05rem;">Official Volunteer Attendance Pass</span>
          </div>
          <button onclick="window.SahayakApp.closeModal();" style="color: #fff; background: rgba(255,255,255,0.1); border: none; border-radius: 50%; width: 28px; height: 28px; cursor: pointer;">✕</button>
        </div>

        <div class="modal-body" style="padding: 24px; background: #fafafa;">
          <p style="font-size: 0.82rem; color: var(--neutral-600); margin-bottom: 16px;">
            Present this QR verification pass to the on-site NGO supervisor (<strong>Dr. S. Mehta</strong>) to confirm your attendance.
          </p>

          <!-- QR PASS TICKET -->
          <div style="background: #fff; border: 2px dashed #2563eb; border-radius: var(--radius-lg); padding: 20px; box-shadow: 0 4px 12px rgba(37,99,235,0.1); margin-bottom: 18px;">
            <!-- QR Pattern Simulation -->
            <div style="width: 140px; height: 140px; margin: 0 auto 14px auto; background: #0f172a; border-radius: var(--radius-md); padding: 10px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
              <svg width="120" height="120" viewBox="0 0 120 120">
                <rect width="120" height="120" fill="#ffffff" rx="6" />
                <!-- QR Finder Corners -->
                <rect x="8" y="8" width="32" height="32" fill="#0f172a" />
                <rect x="14" y="14" width="20" height="20" fill="#ffffff" />
                <rect x="18" y="18" width="12" height="12" fill="#0f172a" />

                <rect x="80" y="8" width="32" height="32" fill="#0f172a" />
                <rect x="86" y="14" width="20" height="20" fill="#ffffff" />
                <rect x="90" y="18" width="12" height="12" fill="#0f172a" />

                <rect x="8" y="80" width="32" height="32" fill="#0f172a" />
                <rect x="14" y="86" width="20" height="20" fill="#ffffff" />
                <rect x="18" y="90" width="12" height="12" fill="#0f172a" />

                <!-- Random data modules -->
                <rect x="48" y="12" width="8" height="8" fill="#0f172a" />
                <rect x="62" y="12" width="8" height="8" fill="#0f172a" />
                <rect x="48" y="28" width="16" height="8" fill="#0f172a" />
                <rect x="48" y="48" width="24" height="24" fill="#2563eb" rx="2" />
                <rect x="12" y="48" width="12" height="12" fill="#0f172a" />
                <rect x="80" y="48" width="16" height="8" fill="#0f172a" />
                <rect x="88" y="64" width="20" height="8" fill="#0f172a" />
                <rect x="48" y="80" width="12" height="12" fill="#0f172a" />
                <rect x="68" y="88" width="16" height="12" fill="#0f172a" />
                <rect x="88" y="88" width="12" height="20" fill="#0f172a" />
              </svg>
            </div>

            <div style="font-weight: 800; font-size: 1.15rem; color: var(--primary-900); margin-bottom: 2px;">
              ${user.name}
            </div>
            <div style="font-size: 0.8rem; color: var(--neutral-600); margin-bottom: 6px;">
              Mission: <strong>${dep.eventTitle}</strong>
            </div>
            <div style="font-family: monospace; font-size: 0.78rem; color: #2563eb; font-weight: 800; background: #eff6ff; padding: 4px 8px; border-radius: 4px; display: inline-block;">
              PASS TOKEN: ${dep.qrCodeToken}
            </div>
          </div>

          <div style="display: flex; gap: 10px;">
            <button class="btn btn-secondary" style="flex: 1;" onclick="window.SahayakApp.closeModal();">Close</button>
            <button class="btn btn-primary" style="flex: 1;" onclick="window.SahayakApp.showToast('Attendance Pass QR saved to device storage.', 'success');">
              🖨️ Save Pass Slip
            </button>
          </div>
        </div>
      </div>
    `);
  }

  function openAttendanceSlipModal() {
    const dep = state.activeDeployment;
    const user = state.currentUser;
    const currentPhoto = dep.checkInPhoto || PHOTO_PRESETS.medical;

    openModal(`
      <div class="modal-window" style="max-width: 520px; text-align: center; border: 3px solid #059669;">
        <div class="modal-header" style="background: linear-gradient(135deg, #065f46, #047857); color: #fff;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6ee7b7" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
            <span style="font-weight: 800; font-size: 1.05rem;">Official Attendance Verification Slip</span>
          </div>
          <button onclick="window.SahayakApp.closeModal();" style="color: #fff; background: rgba(255,255,255,0.1); border: none; border-radius: 50%; width: 28px; height: 28px; cursor: pointer;">✕</button>
        </div>

        <div class="modal-body" style="padding: 24px; background: #fff; text-align: left;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 14px;">
            <div>
              <div style="font-size: 0.72rem; text-transform: uppercase; font-weight: 800; color: #059669; letter-spacing: 0.05em;">Sahayak Field Telemetry</div>
              <h3 style="margin: 0; font-size: 1.15rem; font-weight: 900; color: #0f172a;">PROOF OF ATTENDANCE</h3>
            </div>
            <span class="badge badge-success" style="font-size: 0.75rem; font-weight: 800;">✓ VALIDATED</span>
          </div>

          <div style="display: flex; gap: 14px; align-items: center; background: #f8fafc; padding: 12px; border-radius: var(--radius-md); border: 1px solid #e2e8f0; margin-bottom: 14px;">
            <img src="${currentPhoto}" alt="Verified Photo Proof" style="width: 56px; height: 56px; border-radius: var(--radius-sm); object-fit: cover; border: 2px solid #10b981;" />
            <div style="font-size: 0.8rem; line-height: 1.4;">
              <div style="font-weight: 800; color: #0f172a;">Volunteer: ${user.name}</div>
              <div style="color: #475569;">Venue: ${dep.assignedLocation}</div>
              <div style="color: #059669; font-weight: 700;">Check-In: ${dep.checkInTime || '04:02 PM'} (Live Verified)</div>
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 6px; font-size: 0.8rem; color: #334155; margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between;">
              <span>Mission Drive:</span>
              <strong>${dep.eventTitle}</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>NGO Supervisor:</span>
              <strong>Dr. S. Mehta (Chief Medical Officer)</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>GPS Geofence:</span>
              <strong>19.1197° N, 72.8464° E (14m radius)</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Verification Stamp Token:</span>
              <strong style="font-family: monospace; color: #059669;">${dep.qrCodeToken}</strong>
            </div>
          </div>

          <div style="display: flex; gap: 10px;">
            <button class="btn btn-secondary" style="flex: 1;" onclick="window.SahayakApp.closeModal();">Close</button>
            <button class="btn btn-primary" style="flex: 1; background: #059669; border-color: #059669; font-weight: 800;" onclick="window.SahayakApp.showToast('Attendance Slip PDF downloaded with official seal.', 'success');">
              ⬇ Download Slip PDF
            </button>
          </div>
        </div>
      </div>
    `);
  }

  function setPhotoPreset(presetKey) {
    selectedPresetPhoto = PHOTO_PRESETS[presetKey] || PHOTO_PRESETS.medical;
    const img = document.getElementById('checkin-preview-img');
    if (img) img.src = selectedPresetPhoto;

    document.querySelectorAll('.photo-preset-btn').forEach(b => b.classList.remove('active'));
    if (presetKey === 'medical') document.getElementById('btn-preset-med')?.classList.add('active');
    else if (presetKey === 'supply') document.getElementById('btn-preset-sup')?.classList.add('active');
    else if (presetKey === 'field') document.getElementById('btn-preset-fld')?.classList.add('active');
  }

  function handlePhotoFileUpload(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(evt) {
      selectedPresetPhoto = evt.target.result;
      const img = document.getElementById('checkin-preview-img');
      if (img) img.src = selectedPresetPhoto;
      showToast('Custom photo proof loaded successfully!', 'success');
    };
    reader.readAsDataURL(file);
  }

  function triggerCameraSnapshot() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          showToast('Live Camera activated! Capturing on-ground proof...', 'primary');
          setTimeout(() => {
            stream.getTracks().forEach(track => track.stop());
            selectedPresetPhoto = PHOTO_PRESETS.medical;
            showToast('Photo Proof Captured with GPS Telemetry!', 'success');
          }, 1200);
        })
        .catch(err => {
          showToast('Camera snapshot simulated & verified.', 'primary');
        });
    } else {
      showToast('Camera proof verified via mobile telemetry.', 'primary');
    }
  }

  function confirmPhotoClockIn() {
    state.activeDeployment.status = 'DEPLOYED';
    state.activeDeployment.checkInTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    state.activeDeployment.checkInTimestamp = Date.now();
    state.activeDeployment.checkInPhoto = selectedPresetPhoto || PHOTO_PRESETS.medical;
    state.activeDeployment.attendanceVerified = true;

    if (window.SahayakDB && window.SahayakDB.isConfigured()) {
      window.SahayakDB.saveDeployment(state.activeDeployment);
    }

    closeModal();
    showToast('📸 Attendance Proof Verified & Recorded! Shift Clock Started.', 'success');
    state.currentDemoStep = 7;
    renderApp();
  }

  /* ========================================================
     SHIFT CONCLUSION & CLOCK-OUT MODAL
  ======================================================== */
  let activeShiftRating = 5;

  function openConcludeShiftModal() {
    activeShiftRating = 5;
    const dep = state.activeDeployment;
    const currentPhoto = dep.checkInPhoto || PHOTO_PRESETS.medical;

    openModal(`
      <div class="modal-window" style="max-width: 540px;">
        <div class="modal-header" style="background: linear-gradient(135deg, var(--primary-900), var(--primary-700)); color: #fff;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            <span style="font-weight: 800; font-size: 1.05rem;">Conclude Shift &amp; Clock Out</span>
          </div>
          <button onclick="window.SahayakApp.closeModal();" style="color: #fff; background: rgba(255,255,255,0.1); border: none; border-radius: 50%; width: 28px; height: 28px; cursor: pointer;">✕</button>
        </div>

        <div class="modal-body" style="padding: 24px;">
          <!-- SHIFT METRICS SUMMARY -->
          <div style="padding: 14px; background: var(--neutral-50); border: 1px solid var(--neutral-200); border-radius: var(--radius-md); margin-bottom: 16px; font-size: 0.85rem;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span style="color: var(--neutral-500);">Event / Task:</span>
              <strong style="color: var(--primary-900);">${dep.eventTitle}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span style="color: var(--neutral-500);">Check-In Time:</span>
              <strong style="color: var(--success-600);">${dep.checkInTime || '04:02 PM'} (Photo Verified)</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--neutral-500);">Total Credited Hours:</span>
              <strong style="color: var(--primary-700); font-size: 0.95rem;">4.0 Service Hours</strong>
            </div>
          </div>

          <!-- PHOTO PROOF RECAP -->
          <div style="display: flex; align-items: center; gap: 12px; padding: 10px 14px; background: #fff; border: 1px solid var(--neutral-200); border-radius: var(--radius-sm); margin-bottom: 16px;">
            <img src="${currentPhoto}" alt="Verified Checkin" style="width: 50px; height: 50px; border-radius: var(--radius-sm); object-fit: cover; border: 2px solid #10b981;" />
            <div style="font-size: 0.82rem; text-align: left;">
              <div style="font-weight: 700; color: var(--neutral-900);">✓ On-Ground Presence Verified</div>
              <div style="font-size: 0.74rem; color: var(--neutral-500);">Timestamp: ${dep.checkInTime || '04:02 PM'} • 19.1197° N, 72.8464° E</div>
            </div>
          </div>

          <!-- SHIFT EXPERIENCE RATING -->
          <div class="form-group" style="margin-bottom: 14px; text-align: left;">
            <label class="form-label" style="font-size: 0.8rem;">Shift Experience &amp; Safety Rating</label>
            <div class="star-rating-row" id="shift-star-row">
              <span class="star active" onclick="window.SahayakApp.setShiftRating(1);">★</span>
              <span class="star active" onclick="window.SahayakApp.setShiftRating(2);">★</span>
              <span class="star active" onclick="window.SahayakApp.setShiftRating(3);">★</span>
              <span class="star active" onclick="window.SahayakApp.setShiftRating(4);">★</span>
              <span class="star active" onclick="window.SahayakApp.setShiftRating(5);">★</span>
              <span id="star-rating-label" style="font-size: 0.85rem; color: var(--neutral-700); font-weight: 700; margin-left: 8px; align-self: center;">5.0 / 5.0 (Outstanding)</span>
            </div>
          </div>

          <!-- DEBRIEF SUMMARY NOTES -->
          <div class="form-group" style="margin-bottom: 18px; text-align: left;">
            <label class="form-label" style="font-size: 0.8rem;">Completed Field Tasks &amp; Summary Notes</label>
            <textarea id="input-checkout-summary" class="form-input" rows="3" style="font-size: 0.84rem; resize: none;">Assisted Dr. S. Mehta in patient triage, recorded vitals for 38 attendees, and distributed emergency first-aid packs.</textarea>
          </div>

          <div style="display: flex; gap: 10px;">
            <button type="button" class="btn btn-secondary" style="flex: 1;" onclick="window.SahayakApp.closeModal();">Cancel</button>
            <button type="button" class="btn btn-primary" style="flex: 2; background: linear-gradient(135deg, #1e40af, #1d4ed8); border: none; font-weight: 800;" onclick="window.SahayakApp.confirmConcludeShift();">
              🏁 Confirm Clock Out &amp; Credit 4.0 Hours →
            </button>
          </div>
        </div>
      </div>
    `);
  }

  function setShiftRating(stars) {
    activeShiftRating = stars;
    state.activeDeployment.shiftRating = stars;
    const starsElems = document.querySelectorAll('#shift-star-row .star');
    starsElems.forEach((s, idx) => {
      if (idx < stars) s.classList.add('active');
      else s.classList.remove('active');
    });
    const label = document.getElementById('star-rating-label');
    if (label) {
      label.textContent = `${stars}.0 / 5.0 (${stars === 5 ? 'Outstanding' : stars === 4 ? 'Great' : stars === 3 ? 'Good' : 'Needs Improvement'})`;
    }
  }

  function confirmConcludeShift() {
    const summaryInput = document.getElementById('input-checkout-summary');
    if (summaryInput && summaryInput.value) {
      state.activeDeployment.checkOutSummary = summaryInput.value;
    }

    state.activeDeployment.status = 'COMPLETED';
    state.activeDeployment.checkOutTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Stop stopwatch ticker
    stopDeploymentTimer();

    // Credit hours and increment completed events
    state.currentUser.totalVolunteerHours += state.activeDeployment.shiftHours;
    state.currentUser.completedEvents += 1;
    state.currentUser.reliabilityScore = Math.min(100, state.currentUser.reliabilityScore + 1);

    if (window.SahayakDB && window.SahayakDB.isConfigured()) {
      window.SahayakDB.saveDeployment(state.activeDeployment);
      window.SahayakDB.saveVolunteer(state.currentUser);
    }

    closeModal();
    showToast('Shift Concluded! 4.0 volunteer hours credited to your profile.', 'success');
    state.currentDemoStep = 8;
    renderApp();

    setTimeout(() => {
      openServiceCertificate();
    }, 400);
  }

  function openPhotoProofViewer() {
    const dep = state.activeDeployment;
    const currentPhoto = dep.checkInPhoto || PHOTO_PRESETS.medical;

    openModal(`
      <div class="modal-window" style="max-width: 540px; text-align: center;">
        <div class="modal-header" style="background: #090d16; color: #fff;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
            <span style="font-weight: 800;">On-Site Field Photo Proof</span>
          </div>
          <button onclick="window.SahayakApp.closeModal();" style="color: #fff; background: rgba(255,255,255,0.1); border: none; border-radius: 50%; width: 28px; height: 28px; cursor: pointer;">✕</button>
        </div>

        <div class="modal-body" style="padding: 20px; background: #0b1120;">
          <div style="border-radius: var(--radius-md); overflow: hidden; border: 2px solid #10b981; margin-bottom: 14px;">
            <img src="${currentPhoto}" alt="Verified Photo Proof" style="width: 100%; display: block;" />
          </div>

          <div style="font-family: monospace; font-size: 0.78rem; color: #94a3b8; text-align: left; background: rgba(0,0,0,0.5); padding: 12px; border-radius: var(--radius-sm); border: 1px solid #1e293b;">
            <div style="color: #10b981; font-weight: 700; margin-bottom: 4px;">✓ TIME &amp; GPS STAMPED TELEMETRY</div>
            <div>Volunteer: ${state.currentUser.name}</div>
            <div>Venue: Community Health Centre, Andheri West</div>
            <div>Geotag: 19.1197° N, 72.8464° E (Perimeter Locked)</div>
            <div>Check-In Timestamp: ${dep.checkInTime || '04:02 PM'}</div>
          </div>
        </div>

        <div class="modal-footer" style="background: #090d16; border-top: 1px solid #1e293b;">
          <button class="btn btn-secondary btn-sm" onclick="window.SahayakApp.closeModal();">Close Preview</button>
        </div>
      </div>
    `);
  }

  function openShiftDebriefViewModal() {
    const dep = state.activeDeployment;
    const currentPhoto = dep.checkInPhoto || PHOTO_PRESETS.medical;

    openModal(`
      <div class="modal-window" style="max-width: 540px;">
        <div class="modal-header" style="background: linear-gradient(135deg, var(--primary-900), var(--primary-700)); color: #fff;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            <span style="font-weight: 800;">Shift Debrief &amp; Verification Record</span>
          </div>
          <button onclick="window.SahayakApp.closeModal();" style="color: #fff; background: rgba(255,255,255,0.1); border: none; border-radius: 50%; width: 28px; height: 28px; cursor: pointer;">✕</button>
        </div>

        <div class="modal-body" style="padding: 24px;">
          <div style="display: flex; gap: 14px; align-items: center; padding: 12px; background: var(--neutral-50); border: 1px solid var(--neutral-200); border-radius: var(--radius-md); margin-bottom: 16px;">
            <img src="${currentPhoto}" alt="Photo Proof" style="width: 64px; height: 64px; border-radius: var(--radius-sm); object-fit: cover; border: 2px solid #10b981;" />
            <div>
              <div style="font-weight: 800; font-size: 1.05rem; color: var(--primary-900);">${dep.eventTitle}</div>
              <div style="font-size: 0.8rem; color: var(--neutral-600);">Clock-In: ${dep.checkInTime || '04:02 PM'} • Clock-Out: ${dep.checkOutTime || '08:05 PM'}</div>
              <div style="font-size: 0.78rem; color: var(--success-600); font-weight: 700; margin-top: 2px;">✓ 4.0 Hours Officially Credited</div>
            </div>
          </div>

          <div style="margin-bottom: 14px;">
            <div style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--neutral-500); margin-bottom: 4px;">Volunteer Debrief Note:</div>
            <div style="padding: 10px; background: #fff; border: 1px solid var(--neutral-200); border-radius: var(--radius-sm); font-size: 0.84rem; color: var(--neutral-800);">
              "${dep.checkOutSummary || 'Assisted Dr. S. Mehta in patient triage, recorded vitals for 38 attendees, and distributed emergency first-aid packs.'}"
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: #fef3c7; border: 1px solid #fde68a; border-radius: var(--radius-sm); margin-bottom: 18px;">
            <span style="font-size: 0.82rem; font-weight: 700; color: #92400e;">Experience Rating:</span>
            <span style="font-size: 1.1rem; color: #f59e0b;">★★★★★ <strong style="font-size: 0.85rem; color: #92400e;">(5.0 / 5.0)</strong></span>
          </div>

          <div style="display: flex; gap: 10px;">
            <button class="btn btn-secondary" style="flex: 1;" onclick="window.SahayakApp.closeModal();">Close</button>
            <button class="btn btn-primary" style="flex: 2;" onclick="window.SahayakApp.closeModal(); window.SahayakApp.openServiceCertificate();">
              View Verified Certificate 🏅
            </button>
          </div>
        </div>
      </div>
    `);
  }

  function openTelemetryAuditModal() {
    openModal(`
      <div class="modal-window" style="max-width: 560px;">
        <div class="modal-header" style="background: #0f172a; color: #fff;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
            <span style="font-weight: 800; font-family: monospace;">Cryptographic Field Audit Trail</span>
          </div>
          <button onclick="window.SahayakApp.closeModal();" style="color: #fff; background: rgba(255,255,255,0.1); border: none; border-radius: 50%; width: 28px; height: 28px; cursor: pointer;">✕</button>
        </div>

        <div class="modal-body" style="padding: 24px; font-family: monospace; font-size: 0.82rem; background: #0b1120; color: #94a3b8;">
          <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #1e293b;">
            <div style="color: #38bdf8; font-weight: 700;">// DEPLOYMENT LEDGER HASH</div>
            <div style="word-break: break-all; color: #e2e8f0; font-size: 0.78rem;">SHA-256: e8b9f4a1c0d2948f93e2b17a6c5d4e3f890123456789abcdef0123456789a7f8</div>
          </div>

          <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #1e293b; line-height: 1.6;">
            <div><span style="color: #64748b;">[04:02:14 PM]</span> <strong style="color: #10b981;">GEOFENCE_VERIFIED:</strong> Lat 19.1197°, Lng 72.8464° (18.2m from Hub)</div>
            <div><span style="color: #64748b;">[04:02:15 PM]</span> <strong style="color: #38bdf8;">PHOTO_PROOF_CAPTURED:</strong> On-Site Triage Viewfinder Verified</div>
            <div><span style="color: #64748b;">[04:02:15 PM]</span> <strong style="color: #10b981;">STOPWATCH_STARTED:</strong> Telemetry ping verified OK</div>
            <div><span style="color: #64748b;">[08:05:22 PM]</span> <strong style="color: #f59e0b;">CLOCK_OUT_CONFIRMED:</strong> 4.0 hrs authorized (Rating: 5.0/5.0)</div>
          </div>

          <div style="color: #10b981; font-weight: 700; display: flex; align-items: center; gap: 6px;">
            <span>✓ IMMUTABLE PROOF OF SERVICE RECORDED ON SAHAYAK NETWORK</span>
          </div>
        </div>

        <div class="modal-footer" style="background: #0f172a; border-top: 1px solid #1e293b;">
          <button class="btn btn-secondary btn-sm" onclick="window.SahayakApp.closeModal();">Close Audit Trail</button>
        </div>
      </div>
    `);
  }

  function openServiceCertificate() {
    openModal(`
      <div class="modal-window" style="max-width: 580px; text-align: center; border: 4px solid var(--primary-800);">
        <div class="modal-header" style="background: linear-gradient(135deg, #0a1f44, #0f3d87); color: #fff; border-bottom: 2px solid #d97706;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            <span style="font-weight: 800; font-size: 1.05rem; letter-spacing: 0.03em;">Verified Volunteer Service Certificate</span>
          </div>
          <button onclick="window.SahayakApp.closeModal();" style="color: #fff; background: rgba(255,255,255,0.1); border: none; border-radius: 50%; width: 28px; height: 28px; cursor: pointer;">✕</button>
        </div>

        <div class="modal-body" style="padding: 28px; background: #fafafa;">
          <div style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: var(--primary-700); letter-spacing: 0.1em; margin-bottom: 4px;">
            National Disaster &amp; Community Response Network
          </div>
          <h2 style="font-size: 1.6rem; font-weight: 900; color: var(--primary-900); margin-bottom: 12px; font-family: 'Plus Jakarta Sans', serif;">
            CERTIFICATE OF EXCELLENCE
          </h2>
          
          <p style="font-size: 0.88rem; color: var(--neutral-600); margin-bottom: 18px;">
            This certifies that <strong>${state.currentUser.name}</strong> has successfully completed on-ground emergency deployment for:
          </p>

          <div style="padding: 14px; background: #fff; border: 1px dashed var(--primary-500); border-radius: var(--radius-md); margin-bottom: 20px;">
            <div style="font-weight: 800; font-size: 1.15rem; color: var(--primary-900);">${state.activeDeployment.eventTitle}</div>
            <div style="font-size: 0.82rem; color: var(--neutral-500); margin-top: 4px;">4.0 Hours Verified Service • Helping Hands Foundation</div>
            <div style="font-size: 0.74rem; color: var(--success-600); font-weight: 700; margin-top: 2px;">📸 Photo Proof &amp; Live Telemetry Watermarked</div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: flex-end; padding-top: 14px; border-top: 1px solid var(--neutral-200); text-align: left; font-size: 0.78rem;">
            <div>
              <div style="font-weight: 800; color: var(--neutral-800);">Dr. S. Mehta</div>
              <div style="color: var(--neutral-500);">Chief Medical Officer, IRCS Lead</div>
              <div style="font-family: monospace; color: var(--primary-700); margin-top: 2px;">CERT-ID: #SHK-2026-MED-8492</div>
            </div>
            <div style="text-align: right;">
              <span class="badge badge-success" style="padding: 4px 8px;">✓ Cryptographically Sealed</span>
            </div>
          </div>

          <div style="margin-top: 20px; display: flex; gap: 10px;">
            <button class="btn btn-secondary" style="flex: 1;" onclick="window.SahayakApp.showToast('Official PDF certificate downloaded with QR verification seal.', 'success');">
              ⬇ Download PDF
            </button>
            <button class="btn btn-primary" style="flex: 1;" onclick="window.SahayakApp.closeModal(); window.SahayakApp.navigateTo('profile');">
              View Updated Profile →
            </button>
          </div>
        </div>
      </div>
    `);
  }

  /* ========================================================
     7. NGO / ADMIN DASHBOARD
  ======================================================== */
  function renderNgoDashboard() {
    const ngo = state.ngoUser;

    return `
      <!-- NGO HEADER BANNER -->
      <section class="welcome-hero" style="background: linear-gradient(135deg, #0f3d87 0%, #164ea5 100%); color: var(--white);">
        <div>
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
            <span class="badge" style="background: rgba(255,255,255,0.2); color: var(--white); font-weight: 700;">NGO Operations Portal</span>
            <span style="color: #bfdbfe; font-size: 0.82rem;">Reg: ${ngo.regNumber}</span>
          </div>
          <h1 class="welcome-title" style="color: var(--white);">${ngo.name}</h1>
          <p class="welcome-subtitle" style="color: #e0edff;">Coordinating community relief events, volunteer matching, and emergency dispatch.</p>
        </div>

        <div style="display: flex; gap: 10px;">
          <button class="btn btn-sm btn-secondary" onclick="window.SahayakApp.openEmergencyBroadcastModal();" style="color: var(--danger-600); font-weight: 700;">
            🚨 Broadcast Emergency
          </button>
          <button class="btn btn-sm btn-primary" style="background-color: var(--white); color: var(--primary-800);" onclick="window.SahayakApp.showToast('Opening New Event Creator Modal...', 'primary');">
            + Create New Event
          </button>
        </div>
      </section>

      <!-- 6 NGO KPI METRICS -->
      <div class="ngo-stats-grid">
        <div class="ngo-stat-box">
          <span class="ngo-stat-num">6</span>
          <span class="ngo-stat-title">Active Events</span>
        </div>
        <div class="ngo-stat-box">
          <span class="ngo-stat-num">85</span>
          <span class="ngo-stat-title">Required Volunteers</span>
        </div>
        <div class="ngo-stat-box">
          <span class="ngo-stat-num" style="color: var(--primary-700);">64</span>
          <span class="ngo-stat-title">Matched Volunteers</span>
        </div>
        <div class="ngo-stat-box">
          <span class="ngo-stat-num" style="color: var(--success-600);">28</span>
          <span class="ngo-stat-title">Active Deployments</span>
        </div>
        <div class="ngo-stat-box">
          <span class="ngo-stat-num" style="color: var(--warning-600);">12</span>
          <span class="ngo-stat-title">Pending Volunteers</span>
        </div>
        <div class="ngo-stat-box" style="border-color: var(--danger-200); background-color: var(--danger-50);">
          <span class="ngo-stat-num" style="color: var(--danger-600);">1</span>
          <span class="ngo-stat-title" style="color: var(--danger-600);">Emergency Alerts</span>
        </div>
      </div>

      <!-- ACTIVE EVENTS MANAGEMENT TABLE -->
      <div class="card" style="margin-bottom: 28px;">
        <div class="card-header">
          <div>
            <h3 class="card-title">Live Field Event Operations</h3>
            <p style="font-size: 0.82rem; color: var(--neutral-500);">Current volunteer fulfillment and ground deployment status.</p>
          </div>
          <button class="btn btn-sm btn-secondary" onclick="window.SahayakApp.navigateTo('ngo-volunteers');">
            Manage All Volunteers →
          </button>
        </div>

        <div class="table-responsive">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Event Name</th>
                <th>Volunteers Matched</th>
                <th>Deployed</th>
                <th>Pending</th>
                <th>Location</th>
                <th>Status</th>
                <th>Quick Actions</th>
              </tr>
            </thead>
            <tbody>
              ${state.ngoEvents.map(ev => `
                <tr>
                  <td>
                    <div style="font-weight: 700; color: var(--primary-900); font-size: 0.95rem;">${ev.title}</div>
                    <div style="font-size: 0.75rem; color: var(--neutral-500);">${ev.date}</div>
                  </td>
                  <td>
                    <span style="font-weight: 800; color: var(--primary-800);">${ev.matchedRatio}</span>
                  </td>
                  <td>
                    <span class="badge badge-success">${ev.deployedCount} Deployed</span>
                  </td>
                  <td>
                    <span class="badge badge-warning">${ev.pendingCount} Pending</span>
                  </td>
                  <td>📍 ${ev.location}</td>
                  <td>
                    <span class="badge ${ev.status.includes('Emergency') ? 'badge-danger' : 'badge-primary'}">
                      ${ev.status}
                    </span>
                  </td>
                  <td>
                    <div style="display: flex; gap: 6px;">
                      <button class="btn btn-sm btn-secondary" onclick="window.SahayakApp.navigateTo('ngo-volunteers');">
                        Manage Volunteers
                      </button>
                      <button class="btn btn-sm btn-primary" onclick="window.SahayakApp.navigateTo('deployments');">
                        View Deployment
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- BOTTOM ACTION TILES -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
        <div class="card" style="cursor: pointer;" onclick="window.SahayakApp.navigateTo('ngo-volunteers');">
          <h4 style="font-weight: 800; color: var(--primary-900); margin-bottom: 6px;">👥 Volunteer Roster</h4>
          <p style="font-size: 0.84rem; color: var(--neutral-600); margin-bottom: 12px;">Search, filter, and assign verified volunteers to upcoming drives.</p>
          <span style="font-size: 0.8rem; font-weight: 700; color: var(--primary-800);">View Roster Table →</span>
        </div>

        <div class="card" style="cursor: pointer;" onclick="window.SahayakApp.navigateTo('smart-match');">
          <h4 style="font-weight: 800; color: var(--primary-900); margin-bottom: 6px;">⚡ AI Match Engine</h4>
          <p style="font-size: 0.84rem; color: var(--neutral-600); margin-bottom: 12px;">Simulate algorithm rankings across skills, location matrix, and reliability.</p>
          <span style="font-size: 0.8rem; font-weight: 700; color: var(--primary-800);">Inspect Algorithm →</span>
        </div>

        <div class="card" style="cursor: pointer;" onclick="window.SahayakApp.openEmergencyBroadcastModal();">
          <h4 style="font-weight: 800; color: var(--danger-600); margin-bottom: 6px;">🚨 Broadcast Emergency</h4>
          <p style="font-size: 0.84rem; color: var(--neutral-600); margin-bottom: 12px;">Send high-priority sirens and SMS alerts to nearby volunteers within 5-15 km.</p>
          <span style="font-size: 0.8rem; font-weight: 700; color: var(--danger-600);">Trigger Broadcast Modal →</span>
        </div>
      </div>
    `;
  }

  /* ========================================================
     NGO SIDE: AI CANDIDATE MATCHING & DISPATCH ENGINE
  ======================================================== */
  let selectedNgoEventId = 'opp-med-01';

  function setSelectedNgoEvent(eventId) {
    selectedNgoEventId = eventId;
    renderPageContent();
  }

  function renderNgoSmartMatchEngine() {
    const activeDrive = state.opportunities.find(o => o.id === selectedNgoEventId) || state.opportunities[0];
    const driveSkills = activeDrive.requiredSkills || [];

    // Calculate match score for all volunteers in roster
    const rankedVolunteers = state.ngoVolunteers.map(vol => {
      const volSkills = vol.skills || [];
      const matchCount = driveSkills.filter(ds => volSkills.some(vs => vs.toLowerCase().includes(ds.toLowerCase()) || ds.toLowerCase().includes(vs.toLowerCase()))).length;
      const skillScore = driveSkills.length ? Math.round((matchCount / driveSkills.length) * 100) : 85;
      const distScore = (vol.distanceKm || 2.4) <= 12 ? 95 : 70;
      const relScore = vol.reliability || 95;
      const compositeScore = Math.min(99, Math.max(70, Math.round(skillScore * 0.5 + distScore * 0.3 + relScore * 0.2)));
      return { ...vol, calculatedFit: compositeScore };
    });

    rankedVolunteers.sort((a, b) => b.calculatedFit - a.calculatedFit);

    return `
      <!-- NGO MATCH ENGINE HEADER -->
      <section class="smart-match-header" style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%);">
        <div>
          <div class="ai-match-badge-large">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
            NGO DISPATCH ENGINE • CANDIDATE MATCHING
          </div>
          <h1 style="font-size: 1.75rem; font-weight: 800; color: var(--white); margin-bottom: 6px;">
            AI Volunteer Candidate Allocation Engine
          </h1>
          <p style="color: #c7d2fe; font-size: 0.92rem; max-width: 680px;">
            Select an open NGO drive to rank all verified community volunteers by skill compatibility, geographic transit time, and reliability index.
          </p>
        </div>

        <div style="text-align: right; background: rgba(255,255,255,0.12); padding: 18px 24px; border-radius: var(--radius-lg); border: 1px solid rgba(255,255,255,0.2);">
          <div style="font-size: 0.75rem; text-transform: uppercase; color: #a5b4fc; font-weight: 800;">Available Candidates</div>
          <div style="font-size: 2rem; font-weight: 900; color: var(--white);">${rankedVolunteers.length} Active</div>
          <div style="font-size: 0.75rem; color: #e0e7ff; margin-top: 4px;">Top Fit: ${rankedVolunteers[0]?.name} (${rankedVolunteers[0]?.calculatedFit}%)</div>
        </div>
      </section>

      <!-- DRIVE SELECTION SELECTOR -->
      <div class="smart-match-filter-bar">
        <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
          <span style="font-size: 0.85rem; font-weight: 800; color: var(--neutral-800); text-transform: uppercase;">
            🎯 Target NGO Drive:
          </span>
          <select class="form-input" style="padding: 8px 14px; font-weight: 700; width: auto; font-size: 0.9rem;" onchange="window.SahayakApp.setSelectedNgoEvent(this.value);">
            ${state.opportunities.map(opp => `
              <option value="${opp.id}" ${opp.id === activeDrive.id ? 'selected' : ''}>
                ${opp.title} (${opp.category} • ${opp.volunteersMatched}/${opp.volunteersRequired} Staffed)
              </option>
            `).join('')}
          </select>
        </div>

        <button class="btn btn-primary" style="background: linear-gradient(135deg, #4f46e5, #6366f1); border: none; font-weight: 800;" onclick="window.SahayakApp.showToast('AI Auto-Dispatched top 5 candidate volunteers to ${activeDrive.title}!', 'success');">
          ⚡ 1-Click Auto-Staff Top Candidates
        </button>
      </div>

      <!-- CANDIDATES RANKING TABLE -->
      <div class="card">
        <div class="card-header">
          <div>
            <h3 class="card-title">AI Ranked Volunteer Matches for “${activeDrive.title}”</h3>
            <p style="font-size: 0.82rem; color: var(--neutral-500);">Required Skills: <strong>${driveSkills.join(', ')}</strong> • Location: <strong>${activeDrive.location}</strong></p>
          </div>
          <span class="badge badge-ai" style="font-size: 0.85rem; font-weight: 800; background: #e0e7ff; color: #3730a3;">
            ${rankedVolunteers.filter(v => v.calculatedFit >= 85).length} High Match Candidates
          </span>
        </div>

        <div class="table-responsive">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Rank &amp; Candidate</th>
                <th>AI Match Score</th>
                <th>Key Skills &amp; Certs</th>
                <th>Distance &amp; Location</th>
                <th>Reliability</th>
                <th>Availability Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${rankedVolunteers.map((vol, idx) => `
                <tr>
                  <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <span style="font-weight: 900; color: #4338ca; font-size: 0.95rem; width: 24px;">#${idx + 1}</span>
                      <div class="user-avatar-circle" style="width: 34px; height: 34px; font-size: 0.82rem; background: #312e81;">${vol.avatar || vol.name.split(' ').map(n=>n[0]).join('')}</div>
                      <div>
                        <div style="font-weight: 800; color: var(--primary-900); font-size: 0.92rem;">${vol.name}</div>
                        <div style="font-size: 0.75rem; color: var(--neutral-500);">${vol.role || 'Verified Responder'}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="badge badge-ai" style="font-weight: 800; font-size: 0.88rem; background: ${vol.calculatedFit >= 90 ? '#dcfce7; color: #166534;' : '#e0e7ff; color: #3730a3;'}">
                      ${vol.calculatedFit}% Match
                    </span>
                  </td>
                  <td>
                    <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                      ${(vol.skills || []).map(s => `<span class="badge badge-neutral" style="font-size: 0.72rem;">${s}</span>`).join('')}
                    </div>
                  </td>
                  <td>📍 ${vol.distanceKm || 2.4} km (${vol.location ? vol.location.split(',')[0] : 'Mumbai'})</td>
                  <td>
                    <span style="font-weight: 800; color: var(--success-600);">${vol.reliability || 98}%</span>
                  </td>
                  <td>
                    <span class="badge ${vol.status === 'Available' ? 'badge-success' : vol.status === 'Matched' ? 'badge-primary' : 'badge-neutral'}">
                      ${vol.status || 'Available'}
                    </span>
                  </td>
                  <td>
                    <button class="btn btn-sm btn-primary" style="font-size: 0.78rem; padding: 4px 10px;" onclick="window.SahayakApp.openAssignVolunteerModal('${vol.id}');">
                      Assign Drive
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  /* ========================================================
     NGO SIDE: LIVE GROUND FLEET & DEPLOYMENTS COMMAND CENTER
  ======================================================== */
  function renderNgoDeploymentsPage() {
    return `
      <!-- NGO DEPLOYMENT COMMAND CENTER BANNER -->
      <section class="welcome-hero" style="background: linear-gradient(135deg, #064e3b 0%, #047857 50%, #0f766e 100%); color: var(--white); margin-bottom: 24px; box-shadow: 0 10px 25px -5px rgba(6, 78, 59, 0.35);">
        <div>
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
            <span class="badge" style="background: rgba(255,255,255,0.2); color: var(--white); font-weight: 800; font-size: 0.76rem; letter-spacing: 0.05em;">
              🗺️ GROUND FLEET COMMAND CENTER
            </span>
            <span style="color: #a7f3d0; font-size: 0.82rem; font-weight: 600;">Real-time Telemetry Active</span>
          </div>
          <h1 class="welcome-title" style="color: var(--white); font-size: 1.75rem;">Active Field Deployments &amp; Volunteer Fleet</h1>
          <p class="welcome-subtitle" style="color: #ecfdf5; font-size: 0.92rem;">Live GPS geofence tracking, on-site verified clock-in photo audits, shift stopwatches, and emergency SOS muster points.</p>
        </div>

        <div style="display: flex; gap: 10px;">
          <button class="btn btn-sm btn-secondary" style="color: #064e3b; background: #fff; font-weight: 800;" onclick="window.SahayakApp.showToast('Refreshing live telemetry pings across all sectors...', 'primary');">
            🔄 Refresh Telemetry
          </button>
          <button class="btn btn-sm btn-secondary" style="color: #ef4444; background: #fee2e2; border-color: #fca5a5; font-weight: 800;" onclick="window.SahayakApp.openEmergencyBroadcastModal();">
            🚨 Emergency Alert
          </button>
        </div>
      </section>

      <!-- 4 FLEET STATUS STATS -->
      <div class="ngo-stats-grid" style="margin-bottom: 24px;">
        <div class="ngo-stat-box" style="border-top: 4px solid #059669;">
          <span class="ngo-stat-num" style="color: #059669;">14</span>
          <span class="ngo-stat-title">Volunteers On Duty (Live Shift)</span>
        </div>
        <div class="ngo-stat-box" style="border-top: 4px solid #2563eb;">
          <span class="ngo-stat-num" style="color: #2563eb;">8</span>
          <span class="ngo-stat-title">En Route to Muster Point</span>
        </div>
        <div class="ngo-stat-box" style="border-top: 4px solid #10b981;">
          <span class="ngo-stat-num" style="color: #10b981;">99.4%</span>
          <span class="ngo-stat-title">GPS Geofence Compliance</span>
        </div>
        <div class="ngo-stat-box" style="border-top: 4px solid #f59e0b;">
          <span class="ngo-stat-num" style="color: #f59e0b;">0</span>
          <span class="ngo-stat-title">Overdue Check-Outs</span>
        </div>
      </div>

      <!-- FLEET MAP & ACTIVE ROSTER GRID -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px;">
        
        <!-- LIVE GROUND FLEET MAP CANVAS -->
        <div class="mock-map-card">
          <div class="mock-map-header">
            <div style="font-weight: 800; color: var(--primary-900); font-size: 0.85rem; display: flex; align-items: center; gap: 6px;">
              <span class="pulse-green-dot"></span> Mumbai Field Sectors (Live Geo-Fleet)
            </div>
            <span class="badge badge-success" style="font-size: 0.72rem;">14 GPS Signals Active</span>
          </div>

          <div class="map-view-canvas" style="height: 320px;">
            <svg class="map-grid-svg" viewBox="0 0 400 320">
              <defs>
                <pattern id="ngo-fleet-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="0" x2="40" y2="0" stroke="#cbd5e1" stroke-width="1.2" />
                  <line x1="0" y1="0" x2="0" y2="40" stroke="#cbd5e1" stroke-width="1.2" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="#e0f2fe" />
              <rect width="100%" height="100%" fill="url(#ngo-fleet-grid)" opacity="0.6" />

              <!-- Sector Road Tracks -->
              <path d="M 40,280 Q 180,180 320,100" fill="none" stroke="#94a3b8" stroke-width="7" />
              <path d="M 60,80 Q 200,160 360,260" fill="none" stroke="#94a3b8" stroke-width="7" />

              <!-- Sector 1: Andheri Health Centre -->
              <circle cx="280" cy="110" r="28" fill="rgba(16, 185, 129, 0.2)" />
              <circle cx="280" cy="110" r="10" fill="#059669" stroke="#ffffff" stroke-width="3" />
              
              <!-- Sector 2: Dharavi Transit -->
              <circle cx="160" cy="210" r="32" fill="rgba(37, 99, 235, 0.2)" />
              <circle cx="160" cy="210" r="10" fill="#2563eb" stroke="#ffffff" stroke-width="3" />

              <!-- Sector 3: Kurla Relief -->
              <circle cx="90" cy="110" r="22" fill="rgba(220, 38, 38, 0.2)" />
              <circle cx="90" cy="110" r="10" fill="#dc2626" stroke="#ffffff" stroke-width="3" />
            </svg>

            <!-- Map Pin Floating HTML Overlays -->
            <div class="map-marker-pin" style="top: 110px; left: 280px;">
              <div class="map-marker-bubble" style="background: #065f46;">📍 Andheri (6 Vols On-Duty)</div>
            </div>

            <div class="map-marker-pin" style="top: 210px; left: 160px;">
              <div class="map-marker-bubble" style="background: #1e40af;">📍 Dharavi (5 Vols On-Duty)</div>
            </div>

            <div class="map-marker-pin" style="top: 110px; left: 90px;">
              <div class="map-marker-bubble" style="background: #991b1b;">🚨 Kurla SOS (3 Vols Deployed)</div>
            </div>
          </div>

          <div class="map-footer-bar">
            <span style="font-size: 0.78rem; color: #475569;">All teams reporting at 30-sec telemetry refresh interval.</span>
            <button class="btn btn-sm btn-secondary" onclick="window.SahayakApp.showToast('All 14 field telemetry beacons confirmed active.', 'success');">
              Ping All Volunteers
            </button>
          </div>
        </div>

        <!-- RECENT PHOTO PROOF AUDIT STREAM -->
        <div class="card">
          <div class="card-header" style="margin-bottom: 12px;">
            <div>
              <h4 style="font-weight: 800; color: var(--primary-900); font-size: 1.05rem;">Recent On-Site Photo Audits</h4>
              <p style="font-size: 0.78rem; color: var(--neutral-500);">Live check-in selfie proofs with verified GPS watermarks.</p>
            </div>
            <button class="btn btn-sm btn-secondary" onclick="window.SahayakApp.openPhotoProofViewer();">
              Audit Viewer
            </button>
          </div>

          <div style="display: flex; flex-direction: column; gap: 10px;">
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px; background: #f8fafc; border-radius: var(--radius-md); border: 1px solid #e2e8f0;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <div class="user-avatar-circle" style="width: 36px; height: 36px; background: #059669; font-size: 0.85rem;">RS</div>
                <div>
                  <div style="font-weight: 800; font-size: 0.85rem; color: var(--primary-900);">Rahul Sharma</div>
                  <div style="font-size: 0.74rem; color: var(--neutral-500);">Medical Camp • Clocked in 4h 3m ago</div>
                </div>
              </div>
              <span class="badge badge-success" style="font-size: 0.72rem;">✓ Verified GPS</span>
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px; background: #f8fafc; border-radius: var(--radius-md); border: 1px solid #e2e8f0;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <div class="user-avatar-circle" style="width: 36px; height: 36px; background: #2563eb; font-size: 0.85rem;">PV</div>
                <div>
                  <div style="font-weight: 800; font-size: 0.85rem; color: var(--primary-900);">Priya Verma</div>
                  <div style="font-size: 0.74rem; color: var(--neutral-500);">Registration &amp; Vitals • Clocked in 2h 15m ago</div>
                </div>
              </div>
              <span class="badge badge-success" style="font-size: 0.72rem;">✓ Verified GPS</span>
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px; background: #f8fafc; border-radius: var(--radius-md); border: 1px solid #e2e8f0;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <div class="user-avatar-circle" style="width: 36px; height: 36px; background: #d97706; font-size: 0.85rem;">AS</div>
                <div>
                  <div style="font-weight: 800; font-size: 0.85rem; color: var(--primary-900);">Ananya Sen</div>
                  <div style="font-size: 0.74rem; color: var(--neutral-500);">Team Lead • Clocked in 4h 10m ago</div>
                </div>
              </div>
              <span class="badge badge-success" style="font-size: 0.72rem;">✓ Verified GPS</span>
            </div>
          </div>
        </div>

      </div>
    `;
  }

  /* ========================================================
     8. VOLUNTEER MANAGEMENT (NGO SIDE)
  ======================================================== */
  function renderVolunteerManagementPage() {
    const filter = state.volunteerFilter;
    const volunteers = state.ngoVolunteers.filter(v => {
      const matchSearch = filter.search === '' ||
        v.name.toLowerCase().includes(filter.search.toLowerCase()) ||
        v.skills.some(s => s.toLowerCase().includes(filter.search.toLowerCase())) ||
        v.location.toLowerCase().includes(filter.search.toLowerCase());
      
      const matchStatus = filter.status === 'ALL' || v.status.toUpperCase() === filter.status.toUpperCase();
      return matchSearch && matchStatus;
    });

    return `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;">
        <div>
          <h1 style="font-size: 1.65rem; font-weight: 800; color: var(--primary-900);">Volunteer Operations Roster</h1>
          <p style="color: var(--neutral-500); font-size: 0.9rem;">Assign, track, and contact verified community volunteers across Mumbai.</p>
        </div>
        <button class="btn btn-primary" onclick="window.SahayakApp.showToast('Exporting verified volunteer roster to CSV...', 'primary');">
          Export Roster CSV
        </button>
      </div>

      <!-- FILTER & SEARCH BAR -->
      <div class="card" style="padding: 16px; margin-bottom: 20px;">
        <div style="display: flex; gap: 14px; align-items: center;">
          <div style="flex: 1; position: relative;">
            <input type="text" class="form-input" style="padding-left: 14px;"
              placeholder="Search by volunteer name, skill (e.g. First Aid), or location..."
              value="${filter.search}"
              oninput="window.SahayakApp.handleVolunteerSearch(this.value);" />
          </div>

          <div style="display: flex; gap: 8px;">
            ${['ALL', 'AVAILABLE', 'MATCHED', 'DEPLOYED'].map(st => `
              <button class="btn btn-sm ${filter.status === st ? 'btn-primary' : 'btn-secondary'}"
                onclick="window.SahayakApp.handleVolunteerStatusFilter('${st}');">
                ${st}
              </button>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- VOLUNTEER TABLE -->
      <div class="card">
        <div class="table-responsive">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Volunteer Name</th>
                <th>Skills &amp; Expertise</th>
                <th>Location &amp; Distance</th>
                <th>Availability</th>
                <th>Match %</th>
                <th>Reliability</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${volunteers.map(v => `
                <tr>
                  <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <div class="user-avatar-circle" style="width: 34px; height: 34px; font-size: 0.8rem;">
                        ${v.avatar}
                      </div>
                      <div>
                        <div style="font-weight: 700; color: var(--neutral-900);">${v.name}</div>
                        <div style="font-size: 0.74rem; color: var(--neutral-500);">${v.hoursContributed} hrs served</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                      ${v.skills.map(s => `<span class="skill-tag">${s}</span>`).join('')}
                    </div>
                  </td>
                  <td style="font-size: 0.82rem;">📍 ${v.location}</td>
                  <td style="font-size: 0.82rem;">${v.availability}</td>
                  <td>
                    <span class="badge badge-ai" style="font-weight: 800;">${v.matchScore}%</span>
                  </td>
                  <td>
                    <span class="badge badge-success">${v.reliabilityScore}%</span>
                  </td>
                  <td>
                    <span class="badge ${v.status === 'Deployed' ? 'badge-success' :
                                         v.status === 'Matched' ? 'badge-primary' :
                                         v.status === 'Available' ? 'badge-neutral' : 'badge-warning'}">
                      ${v.status}
                    </span>
                  </td>
                  <td>
                    <div style="display: flex; gap: 6px;">
                      <button class="btn btn-sm btn-primary" onclick="window.SahayakApp.openAssignVolunteerModal('${v.id}');">
                        Assign
                      </button>
                      <button class="btn btn-sm btn-secondary" onclick="window.SahayakApp.showToast('Opening full verification file for ${v.name}...', 'primary');">
                        Profile
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function handleVolunteerSearch(query) {
    state.volunteerFilter.search = query;
    renderPageContent();
  }

  function handleVolunteerStatusFilter(status) {
    state.volunteerFilter.status = status;
    renderPageContent();
  }

  function openAssignVolunteerModal(volunteerId) {
    const vol = state.ngoVolunteers.find(v => v.id === volunteerId);
    if (!vol) return;

    openModal(`
      <div class="modal-window">
        <div class="modal-header">
          <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--primary-900);">
            Assign Volunteer: ${vol.name}
          </h3>
          <button onclick="window.SahayakApp.closeModal();">✕</button>
        </div>

        <div class="modal-body">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px; padding: 12px; background: var(--neutral-50); border-radius: var(--radius-md);">
            <div class="user-avatar-circle">${vol.avatar}</div>
            <div>
              <div style="font-weight: 700;">${vol.name}</div>
              <div style="font-size: 0.8rem; color: var(--neutral-500);">${vol.skills.join(', ')} • Reliability: ${vol.reliabilityScore}%</div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Select Target Event</label>
            <select class="form-input" id="assign-event-select">
              <option value="Medical Relief Camp">Medical Relief Camp (Today, 4:00 PM – Andheri)</option>
              <option value="Flood Relief Support">Flood Relief Support (Kurla Emergency Sector)</option>
              <option value="Food Distribution Drive">Food Distribution Drive (Dharavi Transit Camp)</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Deployment Role</label>
            <input type="text" class="form-input" id="assign-role-input" value="First Aid &amp; Triage Specialist" />
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="window.SahayakApp.closeModal();">Cancel</button>
          <button class="btn btn-primary" onclick="window.SahayakApp.confirmAssignVolunteer('${vol.id}');">
            Confirm Assignment
          </button>
        </div>
      </div>
    `);
  }

  function confirmAssignVolunteer(volunteerId) {
    const vol = state.ngoVolunteers.find(v => v.id === volunteerId);
    const eventSelect = document.getElementById('assign-event-select');
    const selectedEvent = eventSelect ? eventSelect.value : 'Medical Relief Camp';

    if (vol) {
      vol.status = 'Matched';
      vol.assignedEvent = selectedEvent;
    }

    if (window.SahayakDB && window.SahayakDB.isConfigured()) {
      window.SahayakDB.updateVolunteerStatus(volunteerId, 'DEPLOYED');
    }

    closeModal();
    showToast(`Assigned ${vol.name} to ${selectedEvent}! Deployment pass issued.`, 'success');
    renderPageContent();
  }

  /* ========================================================
     9. EMERGENCY RESPONSE CENTER
  ======================================================== */
  function renderEmergencyCenterPage() {
    return `
      <!-- EMERGENCY CENTER HERO -->
      <section class="emergency-center-hero">
        <div>
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <span class="badge" style="background: rgba(255,255,255,0.2); color: var(--white); font-weight: 800;">
              🚨 HIGH PRIORITY DISASTER DISPATCH
            </span>
          </div>
          <h1 style="font-size: 1.85rem; font-weight: 800; color: var(--white); margin-bottom: 6px;">
            Emergency Response Center
          </h1>
          <p style="color: #fee2e2; font-size: 0.92rem; max-width: 620px;">
            Coordinate urgent emergency mobilization during floods, building structural distress, and civil relief situations. Direct tie-in with Municipal Disaster cells.
          </p>
        </div>

        <div>
          <button class="btn btn-lg" style="background-color: var(--white); color: var(--danger-600); font-weight: 800; box-shadow: var(--shadow-lg);"
            onclick="window.SahayakApp.openEmergencyBroadcastModal();">
            🚨 SEND EMERGENCY BROADCAST
          </button>
        </div>
      </section>

      <!-- ACTIVE EMERGENCY ALERTS LIST -->
      <div>
        <h2 style="font-size: 1.3rem; font-weight: 800; color: var(--primary-900); margin-bottom: 16px;">
          Active Emergency Incidents (${state.emergencyAlerts.length})
        </h2>

        ${state.emergencyAlerts.map(emg => `
          <div class="emergency-live-card">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 14px;">
              <div>
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                  <span class="badge badge-danger">CRITICAL ALERT</span>
                  <span style="font-size: 0.8rem; color: var(--neutral-500);">Issued ${emg.issuedAt}</span>
                  <span style="font-size: 0.8rem; color: var(--neutral-500);">• ${emg.issuedBy}</span>
                </div>
                <h3 style="font-size: 1.35rem; font-weight: 800; color: #991b1b;">
                  ${emg.title}
                </h3>
                <div style="font-size: 0.88rem; color: var(--neutral-700); margin-top: 4px;">
                  📍 <strong>Location:</strong> ${emg.location}
                </div>
              </div>

              <div style="text-align: right;">
                <div style="font-size: 1.45rem; font-weight: 800; color: var(--danger-600);">
                  ${emg.volunteersAvailableNearby} / ${emg.volunteersRequired}
                </div>
                <div style="font-size: 0.72rem; text-transform: uppercase; font-weight: 700; color: var(--neutral-500);">
                  Volunteers Mobilized
                </div>
              </div>
            </div>

            <p style="color: var(--neutral-700); font-size: 0.9rem; line-height: 1.55; margin-bottom: 18px;">
              ${emg.description}
            </p>

            <!-- STATS ROW -->
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px;">
              <div style="padding: 12px; background: var(--neutral-50); border-radius: var(--radius-sm); border: 1px solid var(--neutral-200);">
                <div style="font-size: 0.72rem; color: var(--neutral-500); text-transform: uppercase;">Required Positions</div>
                <div style="font-size: 1.15rem; font-weight: 800; color: var(--neutral-900);">${emg.volunteersRequired} Volunteers</div>
              </div>
              <div style="padding: 12px; background: var(--neutral-50); border-radius: var(--radius-sm); border: 1px solid var(--neutral-200);">
                <div style="font-size: 0.72rem; color: var(--neutral-500); text-transform: uppercase;">Available Nearby</div>
                <div style="font-size: 1.15rem; font-weight: 800; color: var(--success-600);">${emg.volunteersAvailableNearby} Ready</div>
              </div>
              <div style="padding: 12px; background: var(--neutral-50); border-radius: var(--radius-sm); border: 1px solid var(--neutral-200);">
                <div style="font-size: 0.72rem; color: var(--neutral-500); text-transform: uppercase;">Deployed on Ground</div>
                <div style="font-size: 1.15rem; font-weight: 800; color: var(--primary-800);">${emg.volunteersDeployed} Active</div>
              </div>
              <div style="padding: 12px; background: var(--neutral-50); border-radius: var(--radius-sm); border: 1px solid var(--neutral-200);">
                <div style="font-size: 0.72rem; color: var(--neutral-500); text-transform: uppercase;">Control Room</div>
                <div style="font-size: 0.85rem; font-weight: 700; color: var(--neutral-900); margin-top: 4px;">${emg.emergencyContact}</div>
              </div>
            </div>

            <!-- SKILLS TAGS & ACTIONS -->
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--neutral-200); padding-top: 16px;">
              <div style="display: flex; gap: 6px; align-items: center;">
                <span style="font-size: 0.8rem; font-weight: 700; color: var(--neutral-500); margin-right: 6px;">Skills Needed:</span>
                ${emg.requiredSkills.map(s => `<span class="skill-tag" style="background:#fee2e2; color:#991b1b;">${s}</span>`).join('')}
              </div>

              <div style="display: flex; gap: 10px;">
                <button class="btn btn-sm btn-secondary" onclick="window.SahayakApp.showToast('Opening emergency relief dispatch map...', 'primary');">
                  View Geo-Cluster Map
                </button>
                <button class="btn btn-sm btn-danger" onclick="window.SahayakApp.respondToEmergency('${emg.id}');">
                  Mobilize My First Aid Unit →
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function openEmergencyBroadcastModal() {
    openModal(`
      <div class="modal-window">
        <div class="modal-header" style="background-color: var(--danger-600); color: var(--white);">
          <div style="display: flex; align-items: center; gap: 8px;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            <h3 style="font-size: 1.2rem; font-weight: 800;">Emergency Broadcast Confirmation</h3>
          </div>
          <button onclick="window.SahayakApp.closeModal();" style="color: var(--white); font-size: 1.2rem;">✕</button>
        </div>

        <div class="modal-body">
          <div style="padding: 12px; background-color: var(--danger-50); border: 1px solid var(--danger-200); border-radius: var(--radius-md); font-size: 0.85rem; color: #991b1b; margin-bottom: 16px;">
            <strong>Warning:</strong> This will send immediate high-priority push notifications and siren sirens to <strong>342 verified volunteers</strong> within your selected radius.
          </div>

          <div class="form-group">
            <label class="form-label">Emergency Category</label>
            <select class="form-input" id="broadcast-type">
              <option value="Flood Relief Support">Flash Flood / Tidal Backup</option>
              <option value="Medical Emergency Surge">Mass Casualty / Medical Trauma Surge</option>
              <option value="Building Collapse Rescue">Structural Distress / Search &amp; Rescue</option>
              <option value="Fire Evacuation Relief">Fire Relief &amp; Temporary Shelter</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Target Zone &amp; Radius</label>
            <select class="form-input" id="broadcast-radius">
              <option value="5">Within 5 km (Immediate neighborhood - ~180 Volunteers)</option>
              <option value="10" selected>Within 10 km (Suburban Cluster - ~342 Volunteers)</option>
              <option value="25">City-wide (All active Mumbai volunteers - ~1,248)</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Required Volunteer Skills</label>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.85rem;">
              <label class="checkbox-label"><input type="checkbox" checked /> First Aid &amp; CPR</label>
              <label class="checkbox-label"><input type="checkbox" checked /> Crowd Management</label>
              <label class="checkbox-label"><input type="checkbox" checked /> Food &amp; Water Logistics</label>
              <label class="checkbox-label"><input type="checkbox" /> Boat / Water Evacuation</label>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Broadcast Alert Message</label>
            <textarea class="form-input" id="broadcast-message" rows="3">Urgent flood relief dispatch required in Kurla & Sion low-lying sectors. Report with rubber boots, waterproof bags, and first aid kits to BMC Disaster Hub.</textarea>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="window.SahayakApp.closeModal();">Cancel</button>
          <button class="btn btn-danger" onclick="window.SahayakApp.executeEmergencyBroadcast();">
            🚨 Broadcast to 342 Nearby Volunteers
          </button>
        </div>
      </div>
    `);
  }

  function executeEmergencyBroadcast() {
    const title = document.getElementById('broadcast-type').value;
    const msg = document.getElementById('broadcast-message').value;

    const newAlert = {
      id: `emg-${Date.now()}`,
      title: `${title} — Immediate Response Required`,
      location: "Kurla & Sion, Mumbai",
      severity: "CRITICAL",
      issuedAt: "Just now",
      issuedBy: "Helping Hands NGO & BMC Disaster Control",
      requiredSkills: ["First Aid & CPR", "Crowd Management", "Food Distribution"],
      volunteersRequired: 30,
      volunteersAvailableNearby: 22,
      volunteersDeployed: 4,
      emergencyContact: "+91 22 2269 4725",
      status: "ACTIVE",
      description: msg
    };

    state.emergencyAlerts.unshift(newAlert);
    if (window.SahayakDB && window.SahayakDB.isConfigured()) {
      window.SahayakDB.saveEmergencyAlert(newAlert);
    }
    closeModal();
    showToast('EMERGENCY BROADCAST SENT! 342 nearby volunteers alerted via high-priority push & SMS.', 'danger');
    renderApp();
  }

  function respondToEmergency(alertId) {
    showToast('Mobilization Confirmed: You have responded to the emergency alert. Report to BMC Hub in 15 mins.', 'success');
  }

  /* ========================================================
     10. ANALYTICS DASHBOARD
  ======================================================== */
  function renderAnalyticsPage() {
    const a = state.analytics;

    return `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;">
        <div>
          <h1 style="font-size: 1.65rem; font-weight: 800; color: var(--primary-900);">Sahayak Impact &amp; Operations Analytics</h1>
          <p style="color: var(--neutral-500); font-size: 0.9rem;">Real-time metrics on volunteer matching accuracy, deployment fulfillment, and emergency mobilization speed.</p>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-sm btn-secondary">Last 30 Days</button>
          <button class="btn btn-sm btn-primary">Year to Date 2026</button>
        </div>
      </div>

      <!-- 8 ANALYTICS KPI TILES -->
      <div class="analytics-grid">
        <div class="card" style="padding: 18px;">
          <div style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--neutral-500);">Total Volunteers</div>
          <div style="font-size: 1.8rem; font-weight: 800; color: var(--primary-900); margin-top: 4px;">${a.totalVolunteers.toLocaleString()}</div>
          <div style="font-size: 0.75rem; color: var(--success-600); font-weight: 700; margin-top: 4px;">↑ +14.2% this month</div>
        </div>

        <div class="card" style="padding: 18px;">
          <div style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--neutral-500);">Active Volunteers</div>
          <div style="font-size: 1.8rem; font-weight: 800; color: var(--primary-700); margin-top: 4px;">${a.activeVolunteers}</div>
          <div style="font-size: 0.75rem; color: var(--neutral-500); margin-top: 4px;">Logged in past 7 days</div>
        </div>

        <div class="card" style="padding: 18px;">
          <div style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--neutral-500);">Completed Deployments</div>
          <div style="font-size: 1.8rem; font-weight: 800; color: var(--success-600); margin-top: 4px;">${a.completedDeployments.toLocaleString()}</div>
          <div style="font-size: 0.75rem; color: var(--neutral-500); margin-top: 4px;">Across 54 partner NGOs</div>
        </div>

        <div class="card" style="padding: 18px;">
          <div style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--neutral-500);">Volunteer Hours</div>
          <div style="font-size: 1.8rem; font-weight: 800; color: var(--primary-900); margin-top: 4px;">${a.volunteerHours.toLocaleString()}h</div>
          <div style="font-size: 0.75rem; color: var(--success-600); font-weight: 700; margin-top: 4px;">Equiv to ₹4.2M service value</div>
        </div>

        <div class="card" style="padding: 18px;">
          <div style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--neutral-500);">Event Success Rate</div>
          <div style="font-size: 1.8rem; font-weight: 800; color: var(--success-600); margin-top: 4px;">${a.eventSuccessRate}%</div>
          <div style="font-size: 0.75rem; color: var(--neutral-500); margin-top: 4px;">Full staffing achieved</div>
        </div>

        <div class="card" style="padding: 18px;">
          <div style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--neutral-500);">Avg Match Percentage</div>
          <div style="font-size: 1.8rem; font-weight: 800; color: var(--primary-800); margin-top: 4px;">${a.avgMatchPercentage}%</div>
          <div style="font-size: 0.75rem; color: var(--neutral-500); margin-top: 4px;">Neural score average</div>
        </div>

        <div class="card" style="padding: 18px;">
          <div style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--neutral-500);">Volunteer Retention</div>
          <div style="font-size: 1.8rem; font-weight: 800; color: var(--primary-900); margin-top: 4px;">${a.volunteerRetention}%</div>
          <div style="font-size: 0.75rem; color: var(--success-600); font-weight: 700; margin-top: 4px;">Repeat monthly service</div>
        </div>

        <div class="card" style="padding: 18px; border-left: 4px solid var(--danger-500);">
          <div style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--danger-600);">Emergency Response Time</div>
          <div style="font-size: 1.8rem; font-weight: 800; color: var(--danger-600); margin-top: 4px;">${a.emergencyResponseMinutes} min</div>
          <div style="font-size: 0.75rem; color: var(--neutral-500); margin-top: 4px;">From broadcast to arrival</div>
        </div>
      </div>

      <!-- CHARTS SECTION -->
      <div class="chart-card-grid">
        
        <!-- MONTHLY VOLUNTEER HOURS GROWTH (BAR CHART) -->
        <div class="card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Volunteer Hours Contributed (2026)</h3>
              <p style="font-size: 0.8rem; color: var(--neutral-500);">Consistent growth across disaster &amp; healthcare drives.</p>
            </div>
            <span class="badge badge-success">+159% YTD</span>
          </div>

          <div class="mock-chart-container">
            ${a.monthlyGrowth.map(item => {
              const heightPct = Math.round((item.hours / 4000) * 100);
              return `
                <div class="bar-column">
                  <span style="font-size: 0.72rem; font-weight: 700; color: var(--primary-800); margin-bottom: 4px;">${item.hours}h</span>
                  <div class="bar-fill" style="height: ${heightPct}%;"></div>
                  <span class="bar-label">${item.month}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- CATEGORY DISTRIBUTION -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Deployment By Category</h3>
          </div>

          <div style="display: flex; flex-direction: column; gap: 14px; margin-top: 10px;">
            ${a.skillCategories.map(cat => `
              <div>
                <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 600; margin-bottom: 6px;">
                  <span style="color: var(--neutral-800);">${cat.name}</span>
                  <span style="color: var(--primary-800); font-weight: 800;">${cat.percentage}% (${cat.count})</span>
                </div>
                <div style="height: 8px; background: var(--neutral-100); border-radius: var(--radius-full); overflow: hidden;">
                  <div style="height: 100%; width: ${cat.percentage}%; background: linear-gradient(90deg, var(--primary-800), var(--primary-500)); border-radius: var(--radius-full);"></div>
                </div>
              </div>
            `).join('')}
          </div>

          <div style="margin-top: 24px; padding: 12px; background: var(--primary-50); border-radius: var(--radius-md); font-size: 0.82rem; color: var(--primary-900);">
            💡 <strong>Insight:</strong> Healthcare and disaster preparedness represent 65% of all emergency dispatches in Western Maharashtra.
          </div>
        </div>

      </div>
    `;
  }

  /* ========================================================
     11. SETTINGS PAGE
  ======================================================== */
  function renderSettingsPage() {
    const s = state.settings;
    const user = state.currentUser;

    return `
      <div style="max-width: 860px; margin: 0 auto;">
        <h1 style="font-size: 1.65rem; font-weight: 800; color: var(--primary-900); margin-bottom: 6px;">Platform Settings</h1>
        <p style="color: var(--neutral-500); font-size: 0.9rem; margin-bottom: 24px;">Configure notification channels, geo-radius preferences, and profile visibility.</p>

        <div style="display: flex; flex-direction: column; gap: 24px;">
          
          <!-- 1. PROFILE SETTINGS -->
          <div class="card">
            <h3 class="card-title" style="margin-bottom: 16px;">Profile &amp; Contact Details</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div class="form-group">
                <label class="form-label">Full Name</label>
                <input type="text" class="form-input" value="${user.name}" id="settings-name" />
              </div>
              <div class="form-group">
                <label class="form-label">Mobile Number</label>
                <input type="text" class="form-input" value="${user.mobile}" id="settings-phone" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Registered Home Address</label>
              <input type="text" class="form-input" value="${user.location}" id="settings-loc" />
            </div>
          </div>

          <!-- 2. NOTIFICATION PREFERENCES -->
          <div class="card">
            <h3 class="card-title" style="margin-bottom: 16px;">Notification Channels</h3>
            <div style="display: flex; flex-direction: column; gap: 12px;">
              <label class="checkbox-label" style="justify-content: space-between;">
                <div>
                  <div style="font-weight: 700; color: var(--neutral-800);">Push Notifications for Opportunities</div>
                  <div style="font-size: 0.78rem; color: var(--neutral-500);">Receive instant alerts when AI finds a >85% match</div>
                </div>
                <input type="checkbox" checked />
              </label>

              <label class="checkbox-label" style="justify-content: space-between;">
                <div>
                  <div style="font-weight: 700; color: var(--danger-600);">Emergency SOS Siren Alert</div>
                  <div style="font-size: 0.78rem; color: var(--neutral-500);">Audible siren alerts during rapid disaster mobilization (Kurla & Mumbai)</div>
                </div>
                <input type="checkbox" checked />
              </label>

              <label class="checkbox-label" style="justify-content: space-between;">
                <div>
                  <div style="font-weight: 700; color: var(--neutral-800);">WhatsApp &amp; SMS Dispatch Confirmations</div>
                  <div style="font-size: 0.78rem; color: var(--neutral-500);">Receive shift QR tokens and supervisor emergency contact via SMS</div>
                </div>
                <input type="checkbox" checked />
              </label>
            </div>
          </div>

          <!-- 3. LOCATION & MATCH RADIUS -->
          <div class="card">
            <h3 class="card-title" style="margin-bottom: 16px;">Matching Radius &amp; Geofencing</h3>
            <div class="form-group">
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                <label class="form-label">Maximum Travel Distance</label>
                <span style="font-weight: 800; color: var(--primary-800);" id="radius-val-label">${user.maxTravelRadiusKm} km</span>
              </div>
              <input type="range" min="2" max="30" value="${user.maxTravelRadiusKm}" class="form-input" style="padding: 0;"
                oninput="document.getElementById('radius-val-label').textContent = this.value + ' km'; window.SahayakApp.updateRadius(this.value);" />
              <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--neutral-400); margin-top: 4px;">
                <span>2 km (Local Walk)</span>
                <span>15 km (Suburban)</span>
                <span>30 km (Metropolitan)</span>
              </div>
            </div>
          </div>

          <!-- 4. SUPABASE BACKEND CLOUD DATABASE -->
          <div class="card" style="border: 2px solid ${window.SahayakDB && window.SahayakDB.isConfigured() ? 'var(--success-500, #10b981)' : 'var(--primary-200, #bfdbfe)'}; background: ${window.SahayakDB && window.SahayakDB.isConfigured() ? 'rgba(16, 185, 129, 0.03)' : 'var(--white)'};">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
              <div>
                <h3 class="card-title" style="margin-bottom: 4px; display: flex; align-items: center; gap: 8px;">
                  <span>⚡ Supabase Backend Database</span>
                  <span class="badge ${window.SahayakDB && window.SahayakDB.isConfigured() ? 'badge-success' : 'badge-neutral'}">
                    ${window.SahayakDB && window.SahayakDB.isConfigured() ? '● Live Cloud Connected' : '○ Local / Demo Mode'}
                  </span>
                </h3>
                <p style="font-size: 0.82rem; color: var(--neutral-500); margin: 0;">Connect your PostgreSQL database to persist volunteers, field deployments, opportunities, and emergency broadcasts.</p>
              </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 14px; margin-top: 14px;">
              <div class="form-group" style="margin: 0;">
                <label class="form-label" style="display: flex; justify-content: space-between;">
                  <span>Project URL</span>
                  <span style="font-size: 0.72rem; color: var(--neutral-400);">e.g. https://xyzcompany.supabase.co</span>
                </label>
                <input type="text" id="supabase-url" class="form-input" placeholder="https://YOUR_PROJECT_REF.supabase.co" value="${window.SahayakDB ? window.SahayakDB.getConfig().url : ''}" />
              </div>

              <div class="form-group" style="margin: 0;">
                <label class="form-label" style="display: flex; justify-content: space-between;">
                  <span>Anon Public Key (anon / public)</span>
                  <span style="font-size: 0.72rem; color: var(--neutral-400);">From Project Settings &gt; API</span>
                </label>
                <input type="password" id="supabase-key" class="form-input" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." value="${window.SahayakDB ? window.SahayakDB.getConfig().key : ''}" />
              </div>

              <div style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center; justify-content: space-between; padding-top: 8px; border-top: 1px solid var(--neutral-100);">
                <div style="display: flex; gap: 10px;">
                  <button class="btn btn-primary" onclick="window.SahayakApp.saveSupabaseSettings();" style="padding: 8px 16px;">
                    Save &amp; Connect Database
                  </button>
                  ${window.SahayakDB && window.SahayakDB.isConfigured() ? `
                    <button class="btn btn-secondary" onclick="window.SahayakApp.disconnectSupabase();" style="padding: 8px 14px; color: var(--danger-600);">
                      Disconnect
                    </button>
                  ` : ''}
                </div>
                
                ${window.SahayakDB && window.SahayakDB.isConfigured() ? `
                  <button class="btn btn-secondary" onclick="window.SahayakApp.seedSupabaseData();" style="padding: 8px 14px; font-weight: 700; border-color: var(--primary-300); color: var(--primary-700);">
                    🚀 Push Initial Data to Supabase
                  </button>
                ` : `
                  <span style="font-size: 0.75rem; color: var(--neutral-400);">Execute schema.sql in Supabase SQL Editor first.</span>
                `}
              </div>
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 12px;">
            <button class="btn btn-secondary" onclick="window.SahayakApp.navigateTo('dashboard');">Cancel</button>
            <button class="btn btn-primary" onclick="window.SahayakApp.saveSettings();">Save Settings</button>
          </div>

        </div>
      </div>
    `;
  }

  function updateRadius(val) {
    state.currentUser.maxTravelRadiusKm = parseInt(val, 10);
  }

  function saveSettings() {
    const nameInput = document.getElementById('settings-name');
    if (nameInput) state.currentUser.name = nameInput.value;
    const phoneInput = document.getElementById('settings-phone');
    if (phoneInput) state.currentUser.mobile = phoneInput.value;
    const locInput = document.getElementById('settings-loc');
    if (locInput) state.currentUser.location = locInput.value;

    if (window.SahayakDB && window.SahayakDB.isConfigured()) {
      window.SahayakDB.saveVolunteer(state.currentUser);
    }

    showToast('Platform preferences saved successfully!', 'success');
  }

  async function saveSupabaseSettings() {
    const url = document.getElementById('supabase-url').value;
    const key = document.getElementById('supabase-key').value;
    if (!url || !key) {
      showToast('Please provide both Project URL and Anon Key', 'danger');
      return;
    }
    const success = window.SahayakDB.saveConfig(url, key);
    if (success) {
      showToast('Connected to Supabase! Syncing data...', 'success');
      await hydrateFromSupabase();
      renderApp();
    } else {
      showToast('Could not initialize Supabase. Check credentials.', 'danger');
    }
  }

  function disconnectSupabase() {
    window.SahayakDB.disconnect();
    showToast('Disconnected from Supabase. Reverted to local demo mode.', 'neutral');
    renderApp();
  }

  async function seedSupabaseData() {
    showToast('Pushing initial dataset to Supabase...', 'primary');
    try {
      const res = await window.SahayakDB.seedAll(INITIAL_DATA);
      showToast(`Database seeded! (${res.opportunities || 0} opps, ${res.volunteers || 0} volunteers, ${res.alerts || 0} alerts)`, 'success');
      await hydrateFromSupabase();
    } catch (err) {
      showToast('Seeding failed: ' + err.message, 'danger');
    }
  }

  async function hydrateFromSupabase() {
    if (!window.SahayakDB || !window.SahayakDB.isConfigured()) return;
    try {
      const opps = await window.SahayakDB.getOpportunities();
      if (opps && opps.length) state.opportunities = opps;

      const vols = await window.SahayakDB.getVolunteers();
      if (vols && vols.length) state.ngoVolunteers = vols;

      const alerts = await window.SahayakDB.getEmergencyAlerts();
      if (alerts && alerts.length) state.emergencyAlerts = alerts;

      const deps = await window.SahayakDB.getDeployments();
      if (deps && deps.length) {
        const myDep = deps.find(d => d.volunteer_id === state.currentUser.id || d.volunteerId === state.currentUser.id);
        if (myDep) {
          state.activeDeployment = {
            id: myDep.id,
            status: myDep.status || 'MATCHED',
            eventId: myDep.event_id || myDep.eventId,
            eventTitle: myDep.event_title || myDep.eventTitle,
            assignedLocation: myDep.assigned_location || myDep.assignedLocation,
            shiftTime: myDep.shift_time || myDep.shiftTime,
            shiftHours: parseFloat(myDep.shift_hours || myDep.shiftHours || 4),
            checkInTime: myDep.check_in_time || myDep.checkInTime,
            checkOutTime: myDep.check_out_time || myDep.checkOutTime
          };
        }
      }
      renderApp();
    } catch (err) {
      console.warn('Supabase hydration warning:', err);
    }
  }

  /* ========================================================
     MODAL: EDIT PROFILE
  ======================================================== */
  function openEditProfileModal() {
    const user = state.currentUser;

    openModal(`
      <div class="modal-window">
        <div class="modal-header">
          <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--primary-900);">Edit Volunteer Profile</h3>
          <button onclick="window.SahayakApp.closeModal();">✕</button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input type="text" id="edit-profile-name" class="form-input" value="${user.name}" />
          </div>

          <div class="form-group">
            <label class="form-label">Location / Neighborhood</label>
            <input type="text" id="edit-profile-location" class="form-input" value="${user.location}" />
          </div>

          <div class="form-group">
            <label class="form-label">Bio &amp; Service Summary</label>
            <textarea id="edit-profile-bio" class="form-input" rows="3">${user.bio}</textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Availability Schedule</label>
            <input type="text" id="edit-profile-availability" class="form-input" value="${user.availability}" />
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="window.SahayakApp.closeModal();">Cancel</button>
          <button class="btn btn-primary" onclick="window.SahayakApp.saveProfileChanges();">
            Save Changes
          </button>
        </div>
      </div>
    `);
  }

  function saveProfileChanges() {
    const name = document.getElementById('edit-profile-name').value;
    const loc = document.getElementById('edit-profile-location').value;
    const bio = document.getElementById('edit-profile-bio').value;
    const avail = document.getElementById('edit-profile-availability').value;

    state.currentUser.name = name;
    state.currentUser.location = loc;
    state.currentUser.bio = bio;
    state.currentUser.availability = avail;

    if (window.SahayakDB && window.SahayakDB.isConfigured()) {
      window.SahayakDB.saveVolunteer(state.currentUser);
    }

    closeModal();
    showToast('Volunteer Profile updated successfully!', 'success');
    renderApp();
  }

  /* ========================================================
     MODALS: VOLUNTEER & NGO ENROLLMENT FORMS (SUPABASE SYNC)
  ======================================================== */
  function detectLocation(elemId) {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const el = document.getElementById(elemId);
          if (el) {
            el.value = `Mumbai Coastal District (${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)})`;
            showToast('GPS coordinates captured for smart matching!', 'success');
          }
        },
        () => {
          showToast('Location permission denied. You can type your city/area manually.', 'neutral');
        }
      );
    } else {
      showToast('Geolocation is not supported by your browser.', 'neutral');
    }
  }

  function openVolunteerEnrollmentModal() {
    openModal(`
      <div class="modal-window" style="max-width: 580px; max-height: 90vh; display: flex; flex-direction: column;">
        <div class="modal-header" style="background: linear-gradient(135deg, var(--primary-900), var(--primary-700)); color: #fff;">
          <div>
            <div style="font-size: 0.72rem; text-transform: uppercase; font-weight: 700; color: #93c5fd; letter-spacing: 0.05em;">Sahayak Onboarding</div>
            <h3 style="font-size: 1.18rem; font-weight: 800; color: #fff; margin: 2px 0 0 0;">🤝 New Volunteer Enrollment</h3>
          </div>
          <button onclick="window.SahayakApp.closeModal();" style="color: #fff; background: rgba(255,255,255,0.1); border: none; border-radius: 50%; width: 28px; height: 28px; cursor: pointer;">✕</button>
        </div>

        <div class="modal-body" style="overflow-y: auto; padding: 20px; flex: 1;">
          <p style="font-size: 0.85rem; color: var(--neutral-600); margin-bottom: 16px;">
            Join India's rapid community response network. Your verified profile connects you with nearby NGO drives and emergency SOS dispatches.
          </p>

          <form id="form-enroll-volunteer" onsubmit="event.preventDefault(); window.SahayakApp.submitVolunteerEnrollment();">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
              <div class="form-group">
                <label class="form-label" for="enroll-vol-name">Full Name *</label>
                <input type="text" id="enroll-vol-name" class="form-input" placeholder="e.g. Samarth Varma" required />
              </div>
              <div class="form-group">
                <label class="form-label" for="enroll-vol-mobile">Mobile (WhatsApp) *</label>
                <input type="tel" id="enroll-vol-mobile" class="form-input" placeholder="+91 98765 43210" required />
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
              <div class="form-group">
                <label class="form-label" for="enroll-vol-email">Email Address *</label>
                <input type="email" id="enroll-vol-email" class="form-input" placeholder="sam@volunteer.in" required />
              </div>
              <div class="form-group">
                <label class="form-label" for="enroll-vol-password">Create Password *</label>
                <input type="password" id="enroll-vol-password" class="form-input" placeholder="Min 6 characters" required />
              </div>
            </div>

            <div class="form-group">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <label class="form-label" for="enroll-vol-location" style="margin-bottom: 0;">City / Neighborhood *</label>
                <button type="button" class="btn btn-sm" style="padding: 2px 8px; font-size: 0.72rem; color: var(--primary-600);" onclick="window.SahayakApp.detectLocation('enroll-vol-location');">
                  📍 Auto-Detect GPS
                </button>
              </div>
              <input type="text" id="enroll-vol-location" class="form-input" placeholder="e.g. Bandra West, Mumbai" value="Andheri West, Mumbai" required />
            </div>

            <div class="form-group">
              <label class="form-label">Core Skills &amp; Capabilities</label>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 10px; background: var(--neutral-50); border-radius: var(--radius-md); border: 1px solid var(--neutral-200);">
                <label class="checkbox-label" style="font-size: 0.8rem;">
                  <input type="checkbox" name="vol-skills" value="First Aid & CPR" checked />
                  <span>First Aid &amp; CPR</span>
                </label>
                <label class="checkbox-label" style="font-size: 0.8rem;">
                  <input type="checkbox" name="vol-skills" value="Crowd Management" checked />
                  <span>Crowd Management</span>
                </label>
                <label class="checkbox-label" style="font-size: 0.8rem;">
                  <input type="checkbox" name="vol-skills" value="Emergency Triage" />
                  <span>Emergency Triage</span>
                </label>
                <label class="checkbox-label" style="font-size: 0.8rem;">
                  <input type="checkbox" name="vol-skills" value="Disaster Search & Rescue" />
                  <span>Disaster Search &amp; Rescue</span>
                </label>
                <label class="checkbox-label" style="font-size: 0.8rem;">
                  <input type="checkbox" name="vol-skills" value="Food & Relief Distribution" checked />
                  <span>Relief Distribution</span>
                </label>
                <label class="checkbox-label" style="font-size: 0.8rem;">
                  <input type="checkbox" name="vol-skills" value="Logistics & Driving" />
                  <span>Logistics &amp; Driving</span>
                </label>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="enroll-vol-avail">Availability Preference</label>
              <select id="enroll-vol-avail" class="form-input">
                <option value="Weekends & Weekday Evenings (15 hrs/week)">Weekends &amp; Weekday Evenings (15 hrs/week)</option>
                <option value="Full-Time Active (30+ hrs/week)">Full-Time Active (30+ hrs/week)</option>
                <option value="Emergency SOS Standby (24/7 On-Call)">Emergency SOS Standby (24/7 On-Call)</option>
                <option value="Weekends Only (8 hrs/week)">Weekends Only (8 hrs/week)</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="enroll-vol-bio">Volunteer Bio / Motivation</label>
              <textarea id="enroll-vol-bio" class="form-input" rows="2" placeholder="Brief details on past community service, languages spoken, etc.">Passionate community responder ready to support field relief and healthcare camps.</textarea>
            </div>

            <div style="margin-top: 18px; display: flex; gap: 10px; justify-content: flex-end;">
              <button type="button" class="btn btn-secondary" onclick="window.SahayakApp.closeModal();">Cancel</button>
              <button type="submit" id="btn-submit-enroll-vol" class="btn btn-primary" style="padding: 8px 18px;">
                Complete Enrollment &amp; Sign In →
              </button>
            </div>
          </form>
        </div>
      </div>
    `);
  }

  async function submitVolunteerEnrollment() {
    const name = document.getElementById('enroll-vol-name')?.value.trim();
    const mobile = document.getElementById('enroll-vol-mobile')?.value.trim();
    const email = document.getElementById('enroll-vol-email')?.value.trim();
    const password = document.getElementById('enroll-vol-password')?.value.trim();
    const location = document.getElementById('enroll-vol-location')?.value.trim();
    const availability = document.getElementById('enroll-vol-avail')?.value;
    const bio = document.getElementById('enroll-vol-bio')?.value.trim();

    const checkedSkills = Array.from(document.querySelectorAll('input[name="vol-skills"]:checked')).map(cb => ({
      name: cb.value,
      level: 'Advanced',
      verified: true
    }));

    if (!name || !email || !password) {
      showToast('Please fill in your name, email, and password.', 'danger');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters.', 'danger');
      return;
    }

    // Check if email already registered
    const existing = findRegisteredUser(email);
    if (existing) {
      showToast(`An account with ${email} already exists. Please Sign In.`, 'danger');
      return;
    }

    const btn = document.getElementById('btn-submit-enroll-vol');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Creating Volunteer Account...';
    }

    const newVolunteerAccount = {
      id: `vol-${Date.now()}`,
      name: name,
      email: email,
      password: password,
      role: 'volunteer',
      mobile: mobile || '+91 98200 00000',
      location: location || 'Mumbai, Maharashtra',
      bio: bio || 'Passionate community volunteer ready for field relief.',
      skills: checkedSkills.length ? checkedSkills : [{ name: 'First Aid & CPR', level: 'Intermediate', verified: true }],
      availability: availability || 'Weekends & Evenings',
      registeredAt: new Date().toISOString()
    };

    saveRegisteredUser(newVolunteerAccount);

    // Also add to active NGO volunteer management roster
    state.ngoVolunteers.unshift({
      id: newVolunteerAccount.id,
      name: name,
      email: email,
      mobile: mobile || '+91 98200 00000',
      role: 'Registered Volunteer',
      location: location || 'Mumbai',
      skills: checkedSkills.map(s => s.name),
      status: 'Available',
      reliability: 100,
      avatar: name.split(' ').map(n=>n[0]).join('').slice(0, 2).toUpperCase()
    });

    try {
      if (window.SahayakDB && window.SahayakDB.isConfigured()) {
        await window.SahayakDB.enrollVolunteer({
          name,
          email,
          password,
          mobile,
          location,
          bio,
          skills: checkedSkills,
          availability
        });
      }
    } catch (err) {
      console.warn('Supabase sync notice:', err.message);
    }

    applyUserData(name, email, 'volunteer', newVolunteerAccount);
    closeModal();
    showToast(`🎉 Registration successful! Welcome to Sahayak, ${name}.`, 'success');
    handleLogin();
  }

  function openNgoEnrollmentModal() {
    openModal(`
      <div class="modal-window" style="max-width: 580px; max-height: 90vh; display: flex; flex-direction: column;">
        <div class="modal-header" style="background: linear-gradient(135deg, #1e3a8a, #065f46); color: #fff;">
          <div>
            <div style="font-size: 0.72rem; text-transform: uppercase; font-weight: 700; color: #6ee7b7; letter-spacing: 0.05em;">Sahayak Partner Network</div>
            <h3 style="font-size: 1.18rem; font-weight: 800; color: #fff; margin: 2px 0 0 0;">🏢 NGO &amp; Community Org Registration</h3>
          </div>
          <button onclick="window.SahayakApp.closeModal();" style="color: #fff; background: rgba(255,255,255,0.1); border: none; border-radius: 50%; width: 28px; height: 28px; cursor: pointer;">✕</button>
        </div>

        <div class="modal-body" style="overflow-y: auto; padding: 20px; flex: 1;">
          <p style="font-size: 0.85rem; color: var(--neutral-600); margin-bottom: 16px;">
            Register your NGO or relief foundation to coordinate drives, broadcast emergency SOS alerts, and deploy verified volunteers.
          </p>

          <form id="form-enroll-ngo" onsubmit="event.preventDefault(); window.SahayakApp.submitNgoEnrollment();">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
              <div class="form-group">
                <label class="form-label" for="enroll-ngo-name">Organization / NGO Name *</label>
                <input type="text" id="enroll-ngo-name" class="form-input" placeholder="e.g. Seva Bharat Trust" required />
              </div>
              <div class="form-group">
                <label class="form-label" for="enroll-ngo-darpan">Darpan / NGO Reg ID</label>
                <input type="text" id="enroll-ngo-darpan" class="form-input" placeholder="e.g. MH/2023/04819" />
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
              <div class="form-group">
                <label class="form-label" for="enroll-ngo-contact">Lead Coordinator Name *</label>
                <input type="text" id="enroll-ngo-contact" class="form-input" placeholder="e.g. Ananya Sen" required />
              </div>
              <div class="form-group">
                <label class="form-label" for="enroll-ngo-mobile">Official Contact Phone *</label>
                <input type="tel" id="enroll-ngo-mobile" class="form-input" placeholder="+91 22 2673 8900" required />
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
              <div class="form-group">
                <label class="form-label" for="enroll-ngo-email">Official Email *</label>
                <input type="email" id="enroll-ngo-email" class="form-input" placeholder="contact@sevabharat.ngo" required />
              </div>
              <div class="form-group">
                <label class="form-label" for="enroll-ngo-password">Create Password *</label>
                <input type="password" id="enroll-ngo-password" class="form-input" placeholder="Min 6 characters" required />
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
              <div class="form-group">
                <label class="form-label" for="enroll-ngo-sector">Primary Cause / Sector *</label>
                <select id="enroll-ngo-sector" class="form-input" required>
                  <option value="Disaster Relief & Emergency">Disaster Relief &amp; Emergency</option>
                  <option value="Healthcare & Medical Camps">Healthcare &amp; Medical Camps</option>
                  <option value="Food Distribution & Hunger Relief">Food Distribution &amp; Hunger Relief</option>
                  <option value="Child Education & Youth Welfare">Child Education &amp; Youth Welfare</option>
                  <option value="Environmental & Animal Care">Environmental &amp; Animal Care</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" for="enroll-ngo-location">Headquarters / City *</label>
                <input type="text" id="enroll-ngo-location" class="form-input" placeholder="e.g. Fort, Mumbai, MH" value="Mumbai, Maharashtra" required />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="enroll-ngo-website">Website or Portal URL</label>
              <input type="url" id="enroll-ngo-website" class="form-input" placeholder="https://sevabharat.ngo" />
            </div>

            <div style="margin-top: 18px; display: flex; gap: 10px; justify-content: flex-end;">
              <button type="button" class="btn btn-secondary" onclick="window.SahayakApp.closeModal();">Cancel</button>
              <button type="submit" id="btn-submit-enroll-ngo" class="btn btn-primary" style="padding: 8px 18px; background: #059669; border-color: #059669;">
                Register NGO &amp; Open Portal →
              </button>
            </div>
          </form>
        </div>
      </div>
    `);
  }

  async function submitNgoEnrollment() {
    const orgName = document.getElementById('enroll-ngo-name')?.value.trim();
    const darpanId = document.getElementById('enroll-ngo-darpan')?.value.trim();
    const contactPerson = document.getElementById('enroll-ngo-contact')?.value.trim();
    const email = document.getElementById('enroll-ngo-email')?.value.trim();
    const password = document.getElementById('enroll-ngo-password')?.value.trim();
    const mobile = document.getElementById('enroll-ngo-mobile')?.value.trim();
    const sector = document.getElementById('enroll-ngo-sector')?.value;
    const location = document.getElementById('enroll-ngo-location')?.value.trim();
    const website = document.getElementById('enroll-ngo-website')?.value.trim();

    if (!orgName || !email || !password) {
      showToast('Please fill all required fields.', 'danger');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters.', 'danger');
      return;
    }

    // Check if email already registered
    const existing = findRegisteredUser(email);
    if (existing) {
      showToast(`An account with ${email} already exists. Please Sign In.`, 'danger');
      return;
    }

    const btn = document.getElementById('btn-submit-enroll-ngo');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Registering NGO Portal...';
    }

    const newNgoAccount = {
      id: `ngo-${Date.now()}`,
      name: orgName,
      email: email,
      password: password,
      role: 'ngo',
      mobile: mobile || '+91 22 2600 0000',
      location: location || 'Mumbai, Maharashtra',
      sector: sector || 'Community Relief',
      regNumber: darpanId || `MH/${new Date().getFullYear()}/NGO-${Math.floor(1000 + Math.random() * 9000)}`,
      website: website || '',
      registeredAt: new Date().toISOString()
    };

    saveRegisteredUser(newNgoAccount);

    try {
      if (window.SahayakDB && window.SahayakDB.isConfigured()) {
        await window.SahayakDB.enrollNGO({
          orgName,
          darpanId,
          contactPerson,
          email,
          password,
          mobile,
          sector,
          location,
          website
        });
      }
    } catch (err) {
      console.warn('Supabase NGO sync notice:', err.message);
    }

    applyUserData(orgName, email, 'ngo', newNgoAccount);
    closeModal();
    showToast(`🏢 NGO Organization "${orgName}" registered successfully!`, 'success');
    handleLogin();
  }

  /* ========================================================
     ATTACH TO GLOBAL SCOPE & EVENT LISTENERS
  ======================================================== */
  window.SahayakApp = {
    state,
    navigateTo,
    handleLogin,
    handleAuthSubmit,
    handleForgotPassword,
    setAuthMode,
    openVolunteerEnrollmentModal,
    submitVolunteerEnrollment,
    openNgoEnrollmentModal,
    submitNgoEnrollment,
    detectLocation,
    quickLoginAs,
    logout,
    toggleRole,
    showToast,
    openModal,
    closeModal,
    acceptOpportunity,
    startScheduledTask,
    checkInDeployment,
    checkOutDeployment,
    openLivePhotoClockInModal,
    openAttendanceQrPassModal,
    openAttendanceSlipModal,
    setPhotoPreset,
    handlePhotoFileUpload,
    triggerCameraSnapshot,
    confirmPhotoClockIn,
    markAttendanceVerified,
    openConcludeShiftModal,
    setShiftRating,
    confirmConcludeShift,
    openPhotoProofViewer,
    openShiftDebriefViewModal,
    toggleShiftTask,
    openServiceCertificate,
    openTelemetryAuditModal,
    setDeploymentStage,
    switchDeploymentDrive,
    addNewShiftTask,
    openEditProfileModal,
    saveProfileChanges,
    openEmergencyBroadcastModal,
    executeEmergencyBroadcast,
    respondToEmergency,
    openAssignVolunteerModal,
    confirmAssignVolunteer,
    handleVolunteerSearch,
    handleVolunteerStatusFilter,
    updateRadius,
    setSmartMatchCategory,
    setSmartMatchRadius,
    setSmartMatchMinScore,
    setSelectedNgoEvent,
    saveSettings,
    saveSupabaseSettings,
    disconnectSupabase,
    seedSupabaseData,
    hydrateFromSupabase,
    handleDemoStepClick
  };

  // Bind role tabs on Auth screen & restore active session
  async function initSahayak() {
    // Try restoring active Supabase auth session
    if (window.SahayakDB && window.SahayakDB.getSession) {
      try {
        const session = await window.SahayakDB.getSession();
        if (session && session.user) {
          const user = session.user;
          const meta = user.user_metadata || {};
          let resolvedName = meta.name || meta.full_name || (user.email ? user.email.split('@')[0] : 'Volunteer');
          let resolvedRole = meta.role || state.currentRole;

          try {
            const vols = await window.SahayakDB.getVolunteers();
            const matchedVol = vols?.find(v => v.email?.toLowerCase() === user.email?.toLowerCase());
            if (matchedVol && matchedVol.name) {
              resolvedName = matchedVol.name;
              if (matchedVol.role) resolvedRole = matchedVol.role;
            }
          } catch (e) {}

          applyUserData(resolvedName, user.email, resolvedRole);
          state.isLoggedIn = true;

          const authView = document.getElementById('view-auth');
          const shellView = document.getElementById('main-app-shell');
          const tourBar = document.getElementById('demo-tour-bar');
          if (authView) authView.style.display = 'none';
          if (shellView) shellView.style.display = 'flex';
          if (tourBar) tourBar.style.display = 'flex';

          state.activePage = state.currentRole === 'ngo' ? 'ngo-dashboard' : 'dashboard';
          renderApp();
          showToast(`Session restored for ${state.currentUser.name || user.email}`, 'success');
        }
      } catch (sessErr) {
        console.warn('Session check error:', sessErr);
      }
    }

    // Try hydrating initial data from Supabase if configured
    hydrateFromSupabase();

    const authRoleTabs = document.querySelectorAll('#auth-role-tabs .role-tab-btn');
    authRoleTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        authRoleTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        state.currentRole = tab.getAttribute('data-role');

        const errBanner = document.getElementById('auth-error-banner');
        if (errBanner) errBanner.style.display = 'none';

        const emailInput = document.getElementById('auth-email');
        if (emailInput) {
          emailInput.placeholder = state.currentRole === 'ngo' ? 'Enter registered NGO email' : 'Enter registered volunteer email';
        }
      });
    });

    const btnToggleRole = document.getElementById('btn-toggle-role');
    if (btnToggleRole) {
      btnToggleRole.addEventListener('click', toggleRole);
    }

    const btnRestartDemo = document.getElementById('btn-restart-demo');
    if (btnRestartDemo) {
      btnRestartDemo.addEventListener('click', () => {
        handleDemoStepClick(0);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSahayak);
  } else {
    initSahayak();
  }

})();
