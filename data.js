// Sahayak - Realistic Mock Dataset
// Comprehensive data for NGOs, Volunteers, Events, Deployments, and Emergency Broadcasts

const INITIAL_DATA = {
  currentUser: {
    id: "vol-rahul-01",
    name: "Rahul Sharma",
    email: "rahul.sharma@volunteer.in",
    mobile: "+91 98204 88321",
    avatar: "RS",
    role: "volunteer", // 'volunteer' | 'ngo' | 'organizer'
    location: "Andheri West, Mumbai",
    coordinates: { lat: 19.1136, lng: 72.8697 },
    bio: "Certified First Aid provider and disaster management enthusiast with 3+ years active field service across Mumbai & Western Maharashtra.",
    skills: [
      { name: "First Aid & CPR", level: "Expert", verified: true },
      { name: "Crowd Management", level: "Advanced", verified: true },
      { name: "Emergency Triage", level: "Advanced", verified: true },
      { name: "Community Teaching", level: "Intermediate", verified: false },
      { name: "Event Coordination", level: "Advanced", verified: true }
    ],
    certifications: [
      { title: "Red Cross Basic Life Support (BLS)", issuer: "Indian Red Cross Society", year: "2024", badge: "BLS-CERT" },
      { title: "Community Disaster Response Badge", issuer: "NDMA India", year: "2023", badge: "NDMA-GOLD" },
      { title: "Advanced Triage Protocols", issuer: "St. John Ambulance", year: "2025", badge: "SJA-TRIAGE" }
    ],
    availability: "Weekends & Weekday Evenings (15 hrs/week)",
    experience: "3.5 Years",
    languages: ["English", "Hindi", "Marathi"],
    reliabilityScore: 98, // Percentage
    completedEvents: 24,
    totalVolunteerHours: 142,
    supervisorRating: 4.9,
    onTimeRate: "99.2%",
    maxTravelRadiusKm: 12,
    attendedEvents: [
      {
        id: "att-01",
        eventId: "opp-med-01",
        title: "Medical Relief Camp",
        organization: "Helping Hands Foundation",
        location: "Community Health Centre, Andheri West, Mumbai",
        date: "Today, Oct 5, 2026",
        hours: 4.0,
        supervisor: "Dr. S. Mehta (Chief Medical Officer)",
        verifiedStatus: "VERIFIED_ON_SITE",
        photoProof: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=500&auto=format&fit=crop&q=60",
        gpsLocation: "19.1197° N, 72.8464° E (14m within perimeter)",
        certificateToken: "SHK-CERT-MED-8492",
        rating: 5.0,
        attendedTimestamp: "2026-10-05T16:02:00Z"
      },
      {
        id: "att-02",
        eventId: "opp-flood-prev",
        title: "Flood Relief & Emergency Supply",
        organization: "Seva Bharat Relief",
        location: "Kurla Relief Base Camp, Mumbai",
        date: "Oct 2, 2026",
        hours: 6.0,
        supervisor: "R. K. Iyer (Disaster Operations Lead)",
        verifiedStatus: "VERIFIED_ON_SITE",
        photoProof: "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=500&auto=format&fit=crop&q=60",
        gpsLocation: "19.0728° N, 72.8797° E",
        certificateToken: "SHK-CERT-FLD-9982",
        rating: 5.0,
        attendedTimestamp: "2026-10-02T09:00:00Z"
      },
      {
        id: "att-03",
        eventId: "opp-blood-prev",
        title: "Mega Health & Blood Donation Drive",
        organization: "Red Cross Mumbai",
        location: "Bandra Civic Ground, Mumbai",
        date: "Sep 28, 2026",
        hours: 5.0,
        supervisor: "Dr. A. Kulkarni (Medical Director)",
        verifiedStatus: "VERIFIED_ON_SITE",
        photoProof: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=500&auto=format&fit=crop&q=60",
        gpsLocation: "19.0596° N, 72.8295° E",
        certificateToken: "SHK-CERT-BLD-7412",
        rating: 5.0,
        attendedTimestamp: "2026-09-28T10:15:00Z"
      }
    ]
  },

  ngoUser: {
    id: "ngo-helping-hands",
    name: "Helping Hands Foundation",
    email: "coordination@helpinghands.ngo",
    mobile: "+91 22 2650 9988",
    avatar: "HH",
    role: "ngo",
    regNumber: "MH/2018/NGO-004821",
    location: "Bandra Kurla Complex, Mumbai",
    rating: 4.9,
    eventsOrganized: 54,
    volunteersDeployed: 1280
  },

  opportunities: [
    {
      id: "opp-med-01",
      title: "Medical Relief Camp",
      organization: "Helping Hands Foundation",
      orgType: "Registered Healthcare NGO",
      category: "Healthcare & Relief",
      location: "Community Health Centre, Andheri West, Mumbai",
      distanceKm: 2.4,
      coordinates: { lat: 19.1197, lng: 72.8464 },
      date: "Today, Oct 5, 2026",
      shiftTime: "4:00 PM – 8:00 PM",
      durationHours: 4,
      volunteersRequired: 20,
      volunteersMatched: 12,
      volunteersDeployed: 0,
      matchScore: 92,
      isAiRecommended: true,
      urgency: "High",
      status: "OPEN", // OPEN, MATCHED, DEPLOYED, COMPLETED
      matchBreakdown: {
        skills: { score: 96, label: "First Aid & Emergency Triage match event needs" },
        availability: { score: 95, label: "Matches your Saturday evening availability" },
        location: { score: 90, label: "2.4 km away (within your 12 km radius)" },
        experience: { score: 88, label: "Matches your 3.5 yrs field experience" }
      },
      matchExplanation: "Recommended because your First Aid skills and availability match the event requirements, and the location is within your preferred distance.",
      description: "A free primary health checkup, diagnostic triage, and medicine distribution camp serving over 450 underserved residents in Andheri slum clusters. Volunteers will assist medical officers with patient intake, vitals recording, queue management, and basic first aid.",
      requiredSkills: ["First Aid & CPR", "Emergency Triage", "Crowd Management", "Registration"],
      safetyInstructions: [
        "N95 masks, nitrile gloves, and hand sanitizer provided at entry.",
        "Hydration and medical rest breaks scheduled every 90 minutes.",
        "Report any medical distress immediately to Chief Medical Officer.",
        "Wear comfortable closed footwear and your Sahayak volunteer badge."
      ],
      emergencyContact: {
        name: "Dr. S. Mehta",
        role: "Chief Medical Officer",
        phone: "+91 98201 44321"
      },
      team: [
        { name: "Ananya Sen", role: "Team Lead & First Aid", status: "Ready", avatar: "AS" },
        { name: "Rohan Patel", role: "Crowd Management", status: "Ready", avatar: "RP" },
        { name: "Priya Verma", role: "Registration & Vitals", status: "Ready", avatar: "PV" },
        { name: "Rahul Sharma", role: "First Aid & Triage", status: "Matched (You)", avatar: "RS" }
      ]
    },
    {
      id: "opp-food-02",
      title: "Food Distribution Drive",
      organization: "Robin Hood Army & Roti Bank",
      orgType: "Food Security NGO",
      category: "Hunger Relief",
      location: "Dharavi Transit Camp Ground, Mumbai",
      distanceKm: 5.1,
      coordinates: { lat: 19.0402, lng: 72.8550 },
      date: "Tomorrow, 10:00 AM – 2:00 PM",
      shiftTime: "10:00 AM – 2:00 PM",
      durationHours: 4,
      volunteersRequired: 25,
      volunteersMatched: 19,
      volunteersDeployed: 0,
      matchScore: 88,
      isAiRecommended: true,
      urgency: "Medium",
      status: "OPEN",
      matchBreakdown: {
        skills: { score: 85, label: "Crowd control and logistics skills aligned" },
        availability: { score: 92, label: "Sunday morning slot aligns with schedule" },
        location: { score: 88, label: "5.1 km away via Western Express" },
        experience: { score: 86, label: "Prior food distribution credit" }
      },
      matchExplanation: "High priority food logistics drive. Your crowd management skills and weekend morning availability make you an excellent candidate.",
      description: "Packaging and distributing 1,200 nutritious hot meal boxes and dry ration kits to daily wage families affected by recent seasonal industrial closures.",
      requiredSkills: ["Crowd Management", "Food Handling", "Packaging", "Hindi Communication"],
      safetyInstructions: ["Sanitary head covers and aprons provided.", "Heavy lifting support available on request."],
      emergencyContact: { name: "Vikram Malhotra", role: "Logistics Lead", phone: "+91 98112 34900" },
      team: [
        { name: "Sameer Joshi", role: "Dispatch Coordinator", status: "Ready", avatar: "SJ" },
        { name: "Tanvi Rao", role: "Kit Packing", status: "Ready", avatar: "TR" }
      ]
    },
    {
      id: "opp-teach-03",
      title: "Community Teaching Program",
      organization: "Aakanksha Educational Trust",
      orgType: "Child Education Non-Profit",
      category: "Education",
      location: "Bandra Municipal School, Mumbai",
      distanceKm: 4.2,
      coordinates: { lat: 19.0596, lng: 72.8295 },
      date: "Sunday, 9:00 AM – 1:00 PM",
      shiftTime: "9:00 AM – 1:00 PM",
      durationHours: 4,
      volunteersRequired: 15,
      volunteersMatched: 11,
      volunteersDeployed: 0,
      matchScore: 84,
      isAiRecommended: true,
      urgency: "Medium",
      status: "OPEN",
      matchBreakdown: {
        skills: { score: 82, label: "Teaching & student mentoring capability" },
        availability: { score: 88, label: "Sunday open slot" },
        location: { score: 85, label: "4.2 km distance" },
        experience: { score: 80, label: "Youth volunteer experience" }
      },
      matchExplanation: "Weekend foundational STEM and conversational English mentorship for 80 underprivileged 6th–8th graders.",
      description: "Engage students in interactive experiential learning activities, basic arithmetic, and storytelling sessions.",
      requiredSkills: ["Community Teaching", "English Communication", "Student Mentoring"],
      safetyInstructions: ["School visitor badge must be worn at all times.", "Follow child protection policy."],
      emergencyContact: { name: "Meera Nair", role: "Academic Coordinator", phone: "+91 98210 11928" },
      team: [
        { name: "Kunal Desai", role: "Math Mentor", status: "Ready", avatar: "KD" }
      ]
    },
    {
      id: "opp-disaster-04",
      title: "Disaster Relief Support (Drainage & Sandbagging)",
      organization: "SEEDS India Emergency Unit",
      orgType: "Disaster Preparedness",
      category: "Emergency & Disaster",
      location: "Kurla West Lowland Sector, Mumbai",
      distanceKm: 6.8,
      coordinates: { lat: 19.0726, lng: 72.8845 },
      date: "Monday, 8:00 AM – 2:00 PM",
      shiftTime: "8:00 AM – 2:00 PM",
      durationHours: 6,
      volunteersRequired: 30,
      volunteersMatched: 18,
      volunteersDeployed: 0,
      matchScore: 79,
      isAiRecommended: false,
      urgency: "Urgent",
      status: "OPEN",
      matchBreakdown: {
        skills: { score: 88, label: "First Aid & Disaster preparedness" },
        availability: { score: 65, label: "Weekday daytime requires special scheduling" },
        location: { score: 80, label: "6.8 km distance" },
        experience: { score: 84, label: "Disaster protocol trained" }
      },
      matchExplanation: "High physical demand community defense initiative ahead of high-tide alert along Mithi River basin.",
      description: "Rapid deployment to erect flood barriers, distribute clean water jerrycans, and coordinate evacuation route briefings.",
      requiredSkills: ["Disaster Response", "First Aid & CPR", "Crowd Management"],
      safetyInstructions: ["Gumboots, high-vis safety vests, and hardhats mandatory (provided on-site)."],
      emergencyContact: { name: "Commander K. Rane", role: "Disaster Field Commander", phone: "+91 98700 88210" },
      team: []
    }
  ],

  // Active Deployment tracker state
  activeDeployment: {
    eventId: "opp-med-01",
    eventTitle: "Medical Relief Camp",
    organization: "Helping Hands Foundation",
    // Lifecycle: 'POSTED' -> 'MATCHED' -> 'DEPLOYED' -> 'COMPLETED'
    status: "MATCHED",
    assignedLocation: "Community Health Centre, Room 3 & Triage Tent, Andheri West",
    shiftTime: "4:00 PM – 8:00 PM",
    shiftHours: 4,
    date: "Today, Oct 5, 2026",
    checkInTime: null, // "04:02 PM" when checked in
    checkOutTime: null, // "08:05 PM" when checked out
    checkInPhoto: null, // Live selfie / on-site photo proof
    checkInTimestamp: null,
    checkOutPhoto: null,
    checkOutSummary: "Assisted Dr. S. Mehta in patient triage, recorded vitals for 38 attendees, and distributed emergency first-aid packs.",
    shiftRating: 5,
    tasks: [
      { id: 't1', text: 'On-site arrival & safety gear equipped', done: true },
      { id: 't2', text: 'Triage briefing with Dr. S. Mehta', done: true },
      { id: 't3', text: 'Patient vitals recording & token intake', done: false },
      { id: 't4', text: 'First aid medicine kit distribution', done: false }
    ],
    emergencyContact: {
      name: "Dr. S. Mehta",
      role: "Lead Medical Officer",
      phone: "+91 98201 44321"
    },
    teamMembers: [
      { name: "Ananya Sen", skill: "First Aid & Team Lead", avatar: "AS", contact: "+91 98203 11223" },
      { name: "Rohan Patel", skill: "Crowd Management", avatar: "RP", contact: "+91 98205 33445" },
      { name: "Priya Verma", skill: "Registration & Vitals", avatar: "PV", contact: "+91 98207 55667" },
      { name: "Rahul Sharma", skill: "First Aid & Triage", avatar: "RS", contact: "+91 98204 88321", isCurrentUser: true }
    ],
    qrCodeToken: "SHK-2026-MED92-ANDHERI",
    notes: "Report to Room 3 for 15-minute briefing prior to 4:00 PM opening."
  },

  // Scheduled / Accepted Volunteer Shifts & Tasks
  scheduledTasks: [
    {
      id: "opp-med-01",
      eventId: "opp-med-01",
      title: "Medical Relief Camp",
      organization: "Helping Hands Foundation",
      location: "Community Health Centre, Andheri West",
      shiftTime: "4:00 PM – 8:00 PM",
      date: "Today, Oct 5, 2026",
      hours: 4,
      status: "MATCHED",
      category: "Healthcare & Relief",
      emergencyContact: { name: "Dr. S. Mehta", phone: "+91 98201 44321" },
      assignedTasks: [
        "On-site arrival & safety briefing",
        "Patient vitals recording & triage assistance",
        "Medicine kit distribution with Dr. S. Mehta"
      ],
      acceptedAt: "2026-10-05T10:00:00Z"
    }
  ],


  // NGO Managed Volunteers pool
  ngoVolunteers: [
    {
      id: "v-01",
      name: "Rahul Sharma",
      avatar: "RS",
      skills: ["First Aid & CPR", "Emergency Triage", "Crowd Management"],
      location: "Andheri West, Mumbai (2.4 km)",
      availability: "Weekends & Evenings",
      matchScore: 92,
      reliabilityScore: 98,
      status: "Matched", // Available, Matched, Deployed, Completed
      assignedEvent: "Medical Relief Camp",
      hoursContributed: 142
    },
    {
      id: "v-02",
      name: "Ananya Sen",
      avatar: "AS",
      skills: ["First Aid", "Team Leadership", "Crisis Counseling"],
      location: "Vile Parle, Mumbai (3.1 km)",
      availability: "Full Weekends",
      matchScore: 95,
      reliabilityScore: 99,
      status: "Matched",
      assignedEvent: "Medical Relief Camp",
      hoursContributed: 198
    },
    {
      id: "v-03",
      name: "Rohan Patel",
      avatar: "RP",
      skills: ["Crowd Management", "Logistics", "Hindi / Gujarati"],
      location: "Juhu, Mumbai (2.8 km)",
      availability: "Saturdays 2PM - 9PM",
      matchScore: 89,
      reliabilityScore: 94,
      status: "Matched",
      assignedEvent: "Medical Relief Camp",
      hoursContributed: 86
    },
    {
      id: "v-04",
      name: "Priya Verma",
      avatar: "PV",
      skills: ["Registration", "Vitals Checking", "Data Entry"],
      location: "Andheri East, Mumbai (3.9 km)",
      availability: "Weekends",
      matchScore: 91,
      reliabilityScore: 96,
      status: "Matched",
      assignedEvent: "Medical Relief Camp",
      hoursContributed: 114
    },
    {
      id: "v-05",
      name: "Kavita Deshmukh",
      avatar: "KD",
      skills: ["First Aid", "Child Care", "Marathi / English"],
      location: "Santacruz West, Mumbai (4.5 km)",
      availability: "Immediate / On-Call",
      matchScore: 87,
      reliabilityScore: 97,
      status: "Available",
      assignedEvent: null,
      hoursContributed: 165
    },
    {
      id: "v-06",
      name: "Aditya Roy",
      avatar: "AR",
      skills: ["Heavy Lifting", "Sandbagging", "Disaster Relief"],
      location: "Kurla West, Mumbai (6.0 km)",
      availability: "Immediate",
      matchScore: 94,
      reliabilityScore: 92,
      status: "Deployed",
      assignedEvent: "Flood Relief Support",
      hoursContributed: 74
    },
    {
      id: "v-07",
      name: "Neha Sundaram",
      avatar: "NS",
      skills: ["Teaching", "Math / Science", "Art Therapy"],
      location: "Bandra West, Mumbai (4.0 km)",
      availability: "Sundays",
      matchScore: 86,
      reliabilityScore: 95,
      status: "Available",
      assignedEvent: null,
      hoursContributed: 92
    },
    {
      id: "v-08",
      name: "Tariq Mansoori",
      avatar: "TM",
      skills: ["Ambulance Assistance", "First Aid", "Night Shifts"],
      location: "Goregaon West, Mumbai (5.8 km)",
      availability: "Nights & Weekends",
      matchScore: 90,
      reliabilityScore: 96,
      status: "Available",
      assignedEvent: null,
      hoursContributed: 210
    }
  ],

  // Emergency Center Alerts
  emergencyAlerts: [
    {
      id: "emg-01",
      title: "Flood Relief Support Required — Mithi River Basin Overflow",
      location: "Kurla & Sion Low-Lying Sectors, Mumbai",
      severity: "CRITICAL",
      issuedAt: "18 minutes ago",
      issuedBy: "BMC Disaster Management & Helping Hands NGO",
      requiredSkills: ["First Aid & CPR", "Crowd Management", "Food Distribution", "Boat / Water Rescue"],
      volunteersRequired: 25,
      volunteersAvailableNearby: 18,
      volunteersDeployed: 12,
      emergencyContact: "+91 22 2269 4725 (Disaster Control Cell)",
      status: "ACTIVE",
      description: "Severe waterlogging due to tidal backup and heavy rainfall. Urgent mobilization needed to distribute drinking water, ready-to-eat packets, and assist elderly transit to high-ground relief shelters."
    }
  ],

  // Organization Events for NGO Dashboard
  ngoEvents: [
    {
      id: "opp-med-01",
      title: "Medical Relief Camp",
      matchedRatio: "18 / 20",
      matchedCount: 18,
      requiredCount: 20,
      deployedCount: 14,
      pendingCount: 4,
      status: "In Progress",
      location: "Andheri West",
      date: "Today, 4:00 PM"
    },
    {
      id: "opp-food-02",
      title: "Food Distribution Drive",
      matchedRatio: "22 / 25",
      matchedCount: 22,
      requiredCount: 25,
      deployedCount: 18,
      pendingCount: 4,
      status: "Staffing",
      location: "Dharavi",
      date: "Tomorrow, 10:00 AM"
    },
    {
      id: "opp-teach-03",
      title: "Community Teaching Program",
      matchedRatio: "14 / 15",
      matchedCount: 14,
      requiredCount: 15,
      deployedCount: 10,
      pendingCount: 4,
      status: "Confirmed",
      location: "Bandra",
      date: "Sunday, 9:00 AM"
    },
    {
      id: "emg-01",
      title: "Flood Relief Emergency Support",
      matchedRatio: "18 / 25",
      matchedCount: 18,
      requiredCount: 25,
      deployedCount: 12,
      pendingCount: 6,
      status: "Emergency Active",
      location: "Kurla & Sion",
      date: "Immediate"
    }
  ],

  // Analytics Metrics
  analytics: {
    totalVolunteers: 1248,
    activeVolunteers: 412,
    completedDeployments: 1890,
    volunteerHours: 14250,
    eventSuccessRate: 96.4,
    avgMatchPercentage: 89.2,
    volunteerRetention: 88.7,
    emergencyResponseMinutes: 14.2,
    monthlyGrowth: [
      { month: "May", hours: 1420, volunteers: 780 },
      { month: "Jun", hours: 1980, volunteers: 890 },
      { month: "Jul", hours: 2450, volunteers: 980 },
      { month: "Aug", hours: 2890, volunteers: 1090 },
      { month: "Sep", hours: 3250, volunteers: 1180 },
      { month: "Oct (Proj)", hours: 3680, volunteers: 1248 }
    ],
    skillCategories: [
      { name: "Healthcare & First Aid", percentage: 38, count: 474 },
      { name: "Disaster & Emergency", percentage: 27, count: 337 },
      { name: "Community Education", percentage: 21, count: 262 },
      { name: "Hunger & Food Relief", percentage: 14, count: 175 }
    ]
  },

  // User Settings
  settings: {
    notifications: {
      emailAlerts: true,
      smsAlerts: true,
      pushNotifications: true,
      emergencySiren: true
    },
    location: {
      preferredRadius: 10,
      autoGps: true,
      preferredNeighborhood: "Andheri West, Bandra, Juhu"
    },
    availability: {
      weekdays: ["evening"],
      weekends: ["morning", "afternoon", "evening"]
    },
    privacy: {
      sharePhoneWithNgo: true,
      publicProfile: true,
      allowAiMatching: true
    }
  }
};
