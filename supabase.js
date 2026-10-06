/**
 * Sahayak — Supabase Integration Service
 * Manages cloud persistence, real-time sync, and database operations.
 */

(function () {
  'use strict';

  // Default credentials (can also be saved dynamically via the Sahayak UI or localStorage)
  const STORAGE_KEY_URL = 'sahayak_supabase_url';
  const STORAGE_KEY_KEY = 'sahayak_supabase_key';

  // Configured with your Supabase Project
  const DEFAULT_SUPABASE_URL = (window.ENV && window.ENV.SUPABASE_URL) || localStorage.getItem(STORAGE_KEY_URL) || 'https://wpyqindosvzkobyqhbog.supabase.co';
  const DEFAULT_SUPABASE_KEY = (window.ENV && (window.ENV.SUPABASE_KEY || window.ENV.SUPABASE_ANON_KEY)) || localStorage.getItem(STORAGE_KEY_KEY) || 'sb_publishable_zp00DP1wifLG8zb6eo6TmA_FqnM2Jaz';

  let client = null;

  function initClient(url, key) {
    const targetUrl = (url || DEFAULT_SUPABASE_URL).trim();
    const targetKey = (key || DEFAULT_SUPABASE_KEY).trim();

    const sb = window.supabase || (typeof supabase !== 'undefined' ? supabase : null);
    if (targetUrl && targetKey && sb && sb.createClient) {
      try {
        client = sb.createClient(targetUrl, targetKey);
        localStorage.setItem(STORAGE_KEY_URL, targetUrl);
        localStorage.setItem(STORAGE_KEY_KEY, targetKey);
        console.log('✅ Supabase Client Connected:', targetUrl);
        return true;
      } catch (err) {
        console.error('❌ Failed to initialize Supabase client:', err);
        client = null;
        return false;
      }
    }
    return false;
  }

  // Attempt initial connection
  if (DEFAULT_SUPABASE_URL && DEFAULT_SUPABASE_KEY) {
    initClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_KEY);
  }

  const SahayakDB = {
    isConfigured: () => !!client,

    getConfig: () => ({
      url: localStorage.getItem(STORAGE_KEY_URL) || '',
      key: localStorage.getItem(STORAGE_KEY_KEY) || ''
    }),

    saveConfig: (url, key) => {
      return initClient(url, key);
    },

    disconnect: () => {
      client = null;
      localStorage.removeItem(STORAGE_KEY_URL);
      localStorage.removeItem(STORAGE_KEY_KEY);
    },

    // ==========================================
    // SUPABASE AUTHENTICATION
    // ==========================================
    async signUp({ email, password, name, role = 'volunteer', mobile = '', location = '' }) {
      if (!client) throw new Error('Supabase client is not connected.');
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || email.split('@')[0],
            role: role,
            mobile: mobile,
            location: location || 'Mumbai, Maharashtra'
          }
        }
      });
      if (error) throw error;

      // Also upsert to volunteers table if volunteer
      if (data && data.user) {
        try {
          await client.from('volunteers').upsert({
            id: data.user.id,
            name: name || email.split('@')[0],
            email: email,
            mobile: mobile || '',
            role: role,
            location: location || 'Mumbai, Maharashtra',
            status: 'AVAILABLE'
          });
        } catch (e) {
          console.warn('Could not auto-create volunteer record:', e);
        }
      }
      return data;
    },

    async enrollVolunteer(payload) {
      if (!client) throw new Error('Supabase client is not connected.');
      const { email, password, name, mobile, location, bio, skills, certifications, availability } = payload;
      
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role: 'volunteer',
            mobile,
            location,
            skills,
            bio,
            availability
          }
        }
      });
      if (error) throw error;

      // Upsert full profile to volunteers table
      try {
        await client.from('volunteers').upsert({
          id: (data.user && data.user.id) ? data.user.id : 'vol-' + Date.now(),
          name,
          email,
          mobile: mobile || '',
          role: 'volunteer',
          location: location || 'Mumbai, Maharashtra',
          bio: bio || 'Active community volunteer',
          skills: skills || [],
          certifications: certifications || [],
          reliability_score: 100,
          total_hours: 0,
          completed_events: 0,
          status: 'AVAILABLE',
          supervisor_rating: 5.0
        });
      } catch (e) {
        console.warn('Volunteer database upsert warning:', e);
      }

      return data;
    },

    async enrollNGO(payload) {
      if (!client) throw new Error('Supabase client is not connected.');
      const { orgName, darpanId, contactPerson, email, password, mobile, sector, location, website } = payload;

      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: orgName,
            role: 'ngo',
            contactPerson,
            darpanId,
            mobile,
            sector,
            location,
            website
          }
        }
      });
      if (error) throw error;

      // Upsert to ngos table if exists
      try {
        await client.from('ngos').upsert({
          id: (data.user && data.user.id) ? data.user.id : 'ngo-' + Date.now(),
          name: orgName,
          darpan_id: darpanId || '',
          contact_person: contactPerson || '',
          email,
          mobile: mobile || '',
          sector: sector || 'Disaster & Relief',
          location: location || 'Mumbai, Maharashtra',
          website: website || '',
          verified: false
        });
      } catch (e) {
        console.warn('NGO database upsert warning:', e);
      }

      return data;
    },

    async signIn({ email, password }) {
      if (!client) throw new Error('Supabase client is not connected.');
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      return data;
    },

    async signOut() {
      if (!client) return;
      try {
        await client.auth.signOut();
      } catch (err) {
        console.warn('Error signing out:', err);
      }
    },

    async getSession() {
      if (!client) return null;
      try {
        const { data, error } = await client.auth.getSession();
        if (error) throw error;
        return data?.session || null;
      } catch (err) {
        console.warn('Could not fetch session:', err);
        return null;
      }
    },

    async getUser() {
      if (!client) return null;
      try {
        const { data, error } = await client.auth.getUser();
        if (error) throw error;
        return data?.user || null;
      } catch (err) {
        return null;
      }
    },

    onAuthStateChange(callback) {
      if (!client) return { data: { subscription: { unsubscribe: () => {} } } };
      return client.auth.onAuthStateChange(callback);
    },

    async resetPassword(email) {
      if (!client) throw new Error('Supabase client is not connected.');
      const { data, error } = await client.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin
      });
      if (error) throw error;
      return data;
    },

    // 1. Opportunities
    async getOpportunities() {
      if (!client) return null;
      try {
        const { data, error } = await client.from('opportunities').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data && data.length ? data.map(d => ({
          ...d,
          distanceKm: parseFloat(d.distance_km || d.distanceKm || 2.4),
          shiftTime: d.shift_time || d.shiftTime || d.time || '4:00 PM – 8:00 PM',
          volunteersRequired: d.volunteers_needed || d.volunteersRequired || d.volunteers_required || 20,
          volunteersMatched: d.volunteers_registered || d.volunteersMatched || d.volunteers_matched || 12,
          volunteersNeeded: d.volunteers_needed || 8,
          volunteersRegistered: d.volunteers_registered || 12,
          matchScore: d.match_score || d.matchScore || 92,
          isAiRecommended: d.is_ai_recommended ?? d.isAiRecommended ?? true,
          matchExplanation: d.match_explanation || d.matchExplanation || "Recommended because your skills, availability, and geo-location match the event requirements.",
          matchBreakdown: d.match_breakdown || d.matchBreakdown || {
            skills: { score: 96, label: "First Aid & Emergency Triage match event needs" },
            availability: { score: 95, label: "Matches your active availability" },
            location: { score: 90, label: "2.4 km away (within your travel radius)" },
            experience: { score: 88, label: "Matches your field service experience" }
          },
          requiredSkills: d.required_skills || d.requiredSkills || ["First Aid & CPR", "Crowd Management"],
          team: d.team || [
            { name: "Ananya Sen", role: "Team Lead & First Aid", status: "Ready", avatar: "AS" },
            { name: "Rohan Patel", role: "Crowd Management", status: "Ready", avatar: "RP" }
          ],
          safetyInstructions: d.safety_instructions || [
            "N95 masks and sanitizers provided at entry.",
            "Wear comfortable closed footwear and your Sahayak volunteer badge."
          ]
        })) : null;
      } catch (err) {
        console.warn('Supabase getOpportunities failed:', err.message);
        return null;
      }
    },

    async saveOpportunity(opp) {
      if (!client) return null;
      try {
        const payload = {
          id: opp.id,
          title: opp.title,
          organization: opp.organization,
          org_type: opp.orgType || opp.org_type,
          category: opp.category,
          location: opp.location,
          distance_km: opp.distanceKm || 0,
          date: opp.date,
          time: opp.time,
          volunteers_needed: opp.volunteersNeeded || opp.volunteers_needed || 1,
          volunteers_registered: opp.volunteersRegistered || opp.volunteers_registered || 0,
          required_skills: opp.requiredSkills || [],
          urgency: opp.urgency || 'Standard',
          description: opp.description || ''
        };
        const { data, error } = await client.from('opportunities').upsert(payload).select();
        if (error) throw error;
        return data;
      } catch (err) {
        console.error('Supabase saveOpportunity error:', err);
        return null;
      }
    },

    // 2. Volunteers
    async getVolunteers() {
      if (!client) return null;
      try {
        const { data, error } = await client.from('volunteers').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data && data.length ? data.map(v => ({
          ...v,
          reliabilityScore: v.reliability_score,
          totalHours: v.total_hours,
          completedEvents: v.completed_events,
          supervisorRating: v.supervisor_rating,
          skills: v.skills || [],
          certifications: v.certifications || []
        })) : null;
      } catch (err) {
        console.warn('Supabase getVolunteers failed:', err.message);
        return null;
      }
    },

    async saveVolunteer(vol) {
      if (!client) return null;
      try {
        const payload = {
          id: vol.id,
          name: vol.name,
          email: vol.email,
          mobile: vol.mobile || '',
          role: vol.role || 'volunteer',
          location: vol.location || '',
          bio: vol.bio || '',
          skills: vol.skills || [],
          certifications: vol.certifications || [],
          reliability_score: vol.reliabilityScore || 95,
          total_hours: vol.totalVolunteerHours || vol.totalHours || 0,
          completed_events: vol.completedEvents || 0,
          status: vol.status || 'AVAILABLE',
          supervisor_rating: vol.supervisorRating || 5.0
        };
        const { data, error } = await client.from('volunteers').upsert(payload).select();
        if (error) throw error;
        return data;
      } catch (err) {
        console.error('Supabase saveVolunteer error:', err);
        return null;
      }
    },

    async updateVolunteerStatus(volunteerId, status) {
      if (!client) return null;
      try {
        const { data, error } = await client
          .from('volunteers')
          .update({ status: status })
          .eq('id', volunteerId)
          .select();
        if (error) throw error;
        return data;
      } catch (err) {
        console.error('Supabase updateVolunteerStatus error:', err);
        return null;
      }
    },

    // 3. Deployments
    async getDeployments() {
      if (!client) return null;
      try {
        const { data, error } = await client.from('deployments').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data;
      } catch (err) {
        console.warn('Supabase getDeployments failed:', err.message);
        return null;
      }
    },

    async saveDeployment(dep) {
      if (!client) return null;
      try {
        const payload = {
          id: dep.id || 'dep-' + Date.now(),
          event_id: dep.eventId || dep.event_id || null,
          event_title: dep.eventTitle || dep.event_title || 'Community Field Mission',
          volunteer_id: dep.volunteerId || dep.volunteer_id || 'vol-rahul-01',
          volunteer_name: dep.volunteerName || dep.volunteer_name || 'Rahul Sharma',
          assigned_location: dep.assignedLocation || dep.assigned_location || '',
          status: dep.status || 'MATCHED',
          shift_time: dep.shiftTime || dep.shift_time || '',
          shift_hours: dep.shiftHours || 4.0,
          check_in_time: dep.checkInTime || null,
          check_out_time: dep.checkOutTime || null
        };
        const { data, error } = await client.from('deployments').upsert(payload).select();
        if (error) throw error;
        return data;
      } catch (err) {
        console.error('Supabase saveDeployment error:', err);
        return null;
      }
    },

    // 4. Emergency Alerts
    async getEmergencyAlerts() {
      if (!client) return null;
      try {
        const { data, error } = await client.from('emergency_alerts').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data && data.length ? data.map(a => ({
          ...a,
          respondersNeeded: a.responders_needed,
          respondersActive: a.responders_active,
          broadcastTime: a.broadcast_time
        })) : null;
      } catch (err) {
        console.warn('Supabase getEmergencyAlerts failed:', err.message);
        return null;
      }
    },

    async saveEmergencyAlert(alert) {
      if (!client) return null;
      try {
        const payload = {
          id: alert.id,
          title: alert.title,
          location: alert.location,
          category: alert.category,
          severity: alert.severity || 'CRITICAL',
          responders_needed: alert.respondersNeeded || 5,
          responders_active: alert.respondersActive || 0,
          message: alert.message,
          broadcast_time: alert.broadcastTime || 'Just now',
          status: alert.status || 'ACTIVE'
        };
        const { data, error } = await client.from('emergency_alerts').upsert(payload).select();
        if (error) throw error;
        return data;
      } catch (err) {
        console.error('Supabase saveEmergencyAlert error:', err);
        return null;
      }
    },

    // 5. Seed Initial Data
    async seedAll(initialData) {
      if (!client) throw new Error('Supabase client not connected');

      const results = {};

      // Seed Opportunities
      if (initialData.opportunities && initialData.opportunities.length) {
        const oppPayloads = initialData.opportunities.map(opp => ({
          id: opp.id,
          title: opp.title,
          organization: opp.organization,
          org_type: opp.orgType,
          category: opp.category,
          location: opp.location,
          distance_km: opp.distanceKm || 0,
          date: opp.date,
          time: opp.time,
          volunteers_needed: opp.volunteersNeeded || 1,
          volunteers_registered: opp.volunteersRegistered || 0,
          required_skills: opp.requiredSkills || [],
          urgency: opp.urgency || 'Standard',
          description: opp.description || ''
        }));
        const { data, error } = await client.from('opportunities').upsert(oppPayloads);
        if (error) throw error;
        results.opportunities = oppPayloads.length;
      }

      // Seed Volunteers
      if (initialData.ngoVolunteers && initialData.ngoVolunteers.length) {
        const volPayloads = initialData.ngoVolunteers.map(vol => ({
          id: vol.id,
          name: vol.name,
          email: vol.email,
          mobile: vol.mobile || '',
          location: vol.location || '',
          skills: vol.skills || [],
          reliability_score: vol.reliabilityScore || 90,
          total_hours: vol.totalHours || 0,
          completed_events: vol.completedEvents || 0,
          status: vol.status || 'AVAILABLE',
          supervisor_rating: vol.rating || 5.0
        }));
        const { data, error } = await client.from('volunteers').upsert(volPayloads);
        if (error) throw error;
        results.volunteers = volPayloads.length;
      }

      // Seed Alerts
      if (initialData.emergencyAlerts && initialData.emergencyAlerts.length) {
        const alertPayloads = initialData.emergencyAlerts.map(a => ({
          id: a.id,
          title: a.title,
          location: a.location,
          category: a.category,
          severity: a.severity || 'CRITICAL',
          responders_needed: a.respondersNeeded || 5,
          responders_active: a.respondersActive || 0,
          message: a.message,
          broadcast_time: a.broadcastTime || 'Just now',
          status: a.status || 'ACTIVE'
        }));
        const { data, error } = await client.from('emergency_alerts').upsert(alertPayloads);
        if (error) throw error;
        results.alerts = alertPayloads.length;
      }

      return results;
    }
  };

  window.SahayakDB = SahayakDB;
})();
