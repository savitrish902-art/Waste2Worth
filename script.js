
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const STORAGE_KEY = "waste2worth_demo_v1";
const USERS_KEY = "waste2worth_demo_users_v1";

const wasteItems = {
  plastic: {
    name: "Plastic bottle", emoji: "🧴", points: 20, weight: 0.03,
    actions: [
      ["Recycle", "Empty and rinse the bottle. Check whether your local collection service accepts its plastic type and cap."],
      ["Reuse", "Consider a suitable non-food storage or craft use. Use a proper reusable bottle for drinking water."],
      ["Dispose responsibly", "If it is not accepted for recycling, follow local waste disposal instructions."]
    ]
  },
  paper: {
    name: "Cardboard", emoji: "📦", points: 15, weight: 0.15,
    actions: [
      ["Recycle", "Keep cardboard clean and dry. Remove tape where practical and check local collection rules."],
      ["Reuse", "Use intact boxes for storage, packing, organising, or creative projects."],
      ["Dispose responsibly", "Greasy or food-contaminated cardboard may not be recyclable through ordinary paper collection."]
    ]
  },
  cloth: {
    name: "Old clothes", emoji: "👕", points: 25, weight: 0.2,
    actions: [
      ["Donate", "If clean and wearable, offer clothing to a reputable donation centre or someone who can use it."],
      ["Reuse", "Repair it, repurpose it as a cleaning cloth, or explore a textile reuse project."],
      ["Recycle textiles", "For damaged textiles, look for a textile collection programme that accepts the material."]
    ]
  },
  organic: {
    name: "Food scraps", emoji: "🍌", points: 20, weight: 0.25,
    actions: [
      ["Compost", "Suitable fruit and vegetable scraps can be composted using an appropriate home or community system."],
      ["Prevent food waste", "Plan portions and store food correctly. Edible food should be prioritised for consumption or safe sharing."],
      ["Dispose responsibly", "Keep unsuitable materials out of compost and follow your local organic-waste instructions."]
    ]
  },
  ewaste: {
    name: "Electronic waste", emoji: "🔋", points: 30, weight: 0.1,
    actions: [
      ["Use authorised collection", "Take electronics and batteries to an authorised e-waste or battery collection facility."],
      ["Repair or donate", "If an item is safe and functional, consider repair or responsible reuse."],
      ["Handle safely", "Do not burn, dismantle, or put batteries and electronics into ordinary household recycling."]
    ]
  },
  glass: {
    name: "Glass bottle", emoji: "🍾", points: 20, weight: 0.2,
    actions: [
      ["Recycle", "Check whether your local service accepts this glass type and prepare it according to its instructions."],
      ["Reuse", "Reuse intact containers where suitable, after cleaning them properly."],
      ["Dispose responsibly", "Broken glass needs careful handling and may require a separate disposal route."]
    ]
  }
};

const challenges = [
  { name: "Plastic-Free Sips", emoji: "🥤", days: 7, points: 50, description: "Choose reusable drinkware instead of single-use bottles.", category: "Everyday habits" },
  { name: "Give It a Second Life", emoji: "🧺", days: 5, points: 40, description: "Find a practical reuse or donation option for an unwanted item.", category: "Reuse & donate" },
  { name: "Home Sorting Hero", emoji: "🏡", days: 3, points: 30, description: "Separate suitable recyclables and keep contamination low.", category: "Smarter sorting" }
];

const sampleUsers = [
  { name: "Aarav Green", points: 840, icon: "🌿" },
  { name: "EcoExplorer", points: 710, icon: "🌎" },
  { name: "Mira Nature", points: 560, icon: "🌼" },
  { name: "Sam Green", points: 420, icon: "🍃" }
];

let currentMode = "login";
let selectedItem = "plastic";
let selectedView = "overview";
let uploadedImageUrl = null;
let toastTimeout = null;

function readJSON(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    showToast("Browser storage is unavailable. Your progress may not persist.");
  }
}

function getUsers() {
  const users = readJSON(USERS_KEY, []);
  return Array.isArray(users) ? users : [];
}

function getSession() {
  return readJSON(STORAGE_KEY, null);
}

function saveSession(session) {
  saveJSON(STORAGE_KEY, session);
}

function createProfile(name, email) {
  return {
    name,
    email,
    points: 0,
    actions: [],
    joinedChallenges: [],
    completedChallenges: [],
    earnedBadges: [],
    lastActionDate: null,
    streak: 0,
    wasteKg: 0
  };
}

function getProfile() {
  const session = getSession();
  if (!session || !session.email) return null;

  const users = getUsers();
  const user = users.find(
    item => item.email.toLowerCase() === session.email.toLowerCase()
  );

  if (!user) return null;

  if (!user.profile) user.profile = createProfile(user.name, user.email);

  return user.profile;
}

function updateProfile(callback) {
  const session = getSession();
  if (!session) return null;

  const users = getUsers();
  const user = users.find(
    item => item.email.toLowerCase() === session.email.toLowerCase()
  );
  if (!user) return null;

  if (!user.profile) user.profile = createProfile(user.name, user.email);

  callback(user.profile);
  saveJSON(USERS_KEY, users);
  return user.profile;
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.remove("hidden");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.add("hidden"), 3200);
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function openAuth(mode = "login") {
  setAuthMode(mode);
  $("#authModal").classList.remove("hidden");
  document.body.classList.add("modal-open");
  setTimeout(() => {
    const field = mode === "signup" ? $("#authName") : $("#authEmail");
    field.focus();
  }, 80);
}

function closeAuth() {
  $("#authModal").classList.add("hidden");
  document.body.classList.remove("modal-open");
  $("#authError").textContent = "";
  $("#authForm").reset();
  $("#authPassword").type = "password";
  $("#togglePassword").textContent = "Show";
}

function setAuthMode(mode) {
  currentMode = mode;
  const signup = mode === "signup";

  $("#loginTab").classList.toggle("active", !signup);
  $("#signupTab").classList.toggle("active", signup);
  $("#nameField").classList.toggle("hidden", !signup);
  $("#confirmField").classList.toggle("hidden", !signup);

  $("#authName").required = signup;
  $("#authConfirm").required = signup;
  $("#authPassword").autocomplete = signup ? "new-password" : "current-password";

  $("#authTitle").textContent = signup ? "Create your account." : "Welcome back.";
  $("#authDescription").textContent = signup
    ? "Start turning everyday choices into greener habits."
    : "Your greener journey is ready when you are.";
  $("#authSubmit").textContent = signup ? "Create my account ↗" : "Log in ↗";
  $("#authError").textContent = "";
}

$("#loginBtn").addEventListener("click", () => openAuth("login"));
$("#signupBtn").addEventListener("click", () => openAuth("signup"));
$("#heroSignup").addEventListener("click", () => openAuth("signup"));
$("#impactSignup").addEventListener("click", () => openAuth("signup"));
$("#challengeSignup").addEventListener("click", () => openAuth("signup"));
$("#finalSignup").addEventListener("click", () => openAuth("signup"));
$("#footerLogin").addEventListener("click", () => {
  getSession() ? logout() : openAuth("login");
});
$("#closeAuth").addEventListener("click", closeAuth);
$("#loginTab").addEventListener("click", () => setAuthMode("login"));
$("#signupTab").addEventListener("click", () => setAuthMode("signup"));

$("#authModal").addEventListener("click", event => {
  if (event.target === $("#authModal")) closeAuth();
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !$("#authModal").classList.contains("hidden")) {
    closeAuth();
  }
});

$("#togglePassword").addEventListener("click", () => {
  const input = $("#authPassword");
  const visible = input.type === "password";
  input.type = visible ? "text" : "password";
  $("#togglePassword").textContent = visible ? "Hide" : "Show";
});

$("#authForm").addEventListener("submit", event => {
  event.preventDefault();

  const name = $("#authName").value.trim();
  const email = $("#authEmail").value.trim().toLowerCase();
  const password = $("#authPassword").value;
  const confirm = $("#authConfirm").value;
  const users = getUsers();

  if (password.length < 6) {
    $("#authError").textContent = "Use a password with at least 6 characters.";
    return;
  }

  if (currentMode === "signup") {
    if (name.length < 2) {
      $("#authError").textContent = "Please enter your name.";
      return;
    }

    if (password !== confirm) {
      $("#authError").textContent = "Your passwords do not match.";
      return;
    }

    if (users.some(user => user.email.toLowerCase() === email)) {
      $("#authError").textContent = "An account with this email already exists. Please log in.";
      return;
    }

    /*
      DEMO ONLY:
      This prototype stores account credentials in browser storage.
      Never use this method for a production website.
      A real application needs a secure backend and hashed passwords.
    */
    users.push({
      name,
      email,
      demoPassword: password,
      profile: createProfile(name, email)
    });

    saveJSON(USERS_KEY, users);
    saveSession({ email });
    closeAuth();
    enterDashboard();
    showToast("Welcome to Waste2Worth! Your demo account is ready 🌱");
    return;
  }

  const user = users.find(item =>
    item.email.toLowerCase() === email && item.demoPassword === password
  );

  if (!user) {
    $("#authError").textContent =
      "Account not found or password incorrect. Create a demo account if this is your first visit.";
    return;
  }

  saveSession({ email: user.email });
  closeAuth();
  enterDashboard();
  showToast("Welcome back, " + user.name + "! 🌿");
});

function enterDashboard() {
  const profile = getProfile();
  if (!profile) {
    logout();
    return;
  }

  $("#publicPage").classList.add("hidden");
  $(".navbar").classList.add("hidden");
  $(".announcement").classList.add("hidden");
  $(".footer").classList.add("hidden");
  $("#appDashboard").classList.remove("hidden");

  $("#sidebarName").textContent = profile.name;
  $("#sidebarAvatar").textContent = profile.name.charAt(0).toUpperCase();
  $("#topAvatar").textContent = profile.name.charAt(0).toUpperCase();
  $("#profileBtn").classList.remove("hidden");

  renderDashboard();
  showView("overview");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function logout() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}

  $("#appDashboard").classList.add("hidden");
  $("#publicPage").classList.remove("hidden");
  $(".navbar").classList.remove("hidden");
  $(".announcement").classList.remove("hidden");
  $(".footer").classList.remove("hidden");
  $("#profileBtn").classList.add("hidden");
  closeAuth();
  window.scrollTo({ top: 0, behavior: "smooth" });
  showToast("You have logged out of the demo.");
}

$("#logoutBtn").addEventListener("click", logout);
$("#profileBtn").addEventListener("click", () => {
  if (getSession()) showToast("You are signed in to your demo account.");
  else openAuth("login");
});

function showView(view) {
  const allowed = [
    "overview", "scanner", "rewards",
    "challenges", "impact", "leaderboard"
  ];

  if (!allowed.includes(view)) return;

  selectedView = view;

  $$(".dashboard-view").forEach(section => {
    section.classList.toggle("hidden", section.id !== "view-" + view);
  });

  $$(".side-link[data-view]").forEach(button => {
    button.classList.toggle("active", button.dataset.view === view);
  });

  renderDashboard();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

$$("[data-view]").forEach(button => {
  button.addEventListener("click", () => showView(button.dataset.view));
});

$$("[data-goto]").forEach(button => {
  button.addEventListener("click", () => showView(button.dataset.goto));
});

$$("[data-action]").forEach(button => {
  button.addEventListener("click", () => {
    const action = button.dataset.action;
    if (getSession()) {
      enterDashboard();
      showView(action);
    } else {
      openAuth("signup");
    }
  });
});

function getLevel(points) {
  if (points >= 1500) return { name: "Earth Guardian", level: 4, base: 1500, next: 2500, icon: "🌍" };
  if (points >= 700) return { name: "Eco Champion", level: 3, base: 700, next: 1500, icon: "🌳" };
  if (points >= 250) return { name: "Green Grower", level: 2, base: 250, next: 700, icon: "🌿" };
  return { name: "Seedling", level: 1, base: 0, next: 250, icon: "🌱" };
}

function renderDashboard() {
  const profile = getProfile();
  if (!profile) return;

  const points = profile.points || 0;
  const actions = profile.actions || [];
  const level = getLevel(points);
  const progress = Math.min(
    100,
    Math.round(((points - level.base) / (level.next - level.base)) * 100)
  );

  $("#dashboardGreeting").textContent = "Welcome back, " + profile.name.split(" ")[0] + "! 🌱";
  $("#metricPoints").textContent = points + " XP";
  $("#metricWaste").textContent = (profile.wasteKg || 0).toFixed(2) + " kg";
  $("#metricActions").textContent = actions.length;
  $("#metricStreak").textContent = (profile.streak || 0) + " days";

  $("#levelName").textContent = level.icon + " " + level.name;
  $("#levelProgressText").textContent = points + " / " + level.next + " XP";
  $("#levelProgress").style.width = progress + "%";
  $("#levelCurrent").textContent = "Level " + level.level;

  $("#rewardsPoints").textContent = points + " XP";
  $("#rewardsLevel").textContent = "Level " + level.level + " · " + level.name;

  $("#impactWaste").textContent = (profile.wasteKg || 0).toFixed(2) + " kg";
  $("#impactActions").textContent = actions.length;
  $("#impactPoints").textContent = points + " XP";
  $("#impactChallenges").textContent = (profile.joinedChallenges || []).length;

  renderActivity(actions);
  renderLeaderboard(profile);
  renderBadges(profile);
  renderChallenges(profile);
  renderImpactHistory(actions);
}

function renderActivity(actions) {
  const recent = [...actions].reverse().slice(0, 5);
  const html = recent.map(action => `
    <div class="activity-item">
      <div class="activity-icon">${escapeHTML(action.emoji)}</div>
      <div class="activity-details">
        <b>${escapeHTML(action.title)}</b>
        <small>${escapeHTML(action.dateLabel)}</small>
      </div>
      <span class="activity-points">+${action.points} XP</span>
    </div>
  `).join("");

  const empty = `
    <div class="empty-state"><span>🌱</span>
      <p>Your journey starts here.</p>
      <small>Explore an item to discover your first eco-action.</small>
    </div>`;

  $("#activityList").innerHTML = html || empty;
}

function renderImpactHistory(actions) {
  const history = [...actions].reverse();
  $("#impactHistory").innerHTML = history.length
    ? history.map(action => `
      <div class="activity-item">
        <div class="activity-icon">${escapeHTML(action.emoji)}</div>
        <div class="activity-details">
          <b>${escapeHTML(action.title)}</b>
          <small>${escapeHTML(action.dateLabel)} · ${action.weight.toFixed(2)} kg estimated</small>
        </div>
        <span class="activity-points">+${action.points} XP</span>
      </div>
    `).join("")
    : `<div class="empty-state"><span>🌍</span><p>No impact entries yet.</p><small>Explore an item and record an action to begin.</small></div>`;
}

function getLeaderboard(profile) {
  const entries = sampleUsers.map(user => ({ ...user, sample: true }));

  entries.push({
    name: profile.name,
    points: profile.points || 0,
    icon: "🌱",
    sample: false
  });

  return entries.sort((a, b) => b.points - a.points);
}

function renderLeaderboard(profile) {
  const entries = getLeaderboard(profile);

  const html = entries.map((user, index) => `
    <div class="ranking-row">
      <span class="rank-number">${index + 1}</span>
      <div class="rank-user">
        <b>${user.icon} ${escapeHTML(user.name)}${user.sample ? "" : " (You)"}</b>
        <small>${user.sample ? "Illustrative sample entry" : "Your local demo score"}</small>
      </div>
      <span class="rank-points">${user.points} XP</span>
    </div>
  `).join("");

  $("#miniLeaderboard").innerHTML = html;
  $("#fullLeaderboard").innerHTML = html;
}

function renderBadges(profile) {
  const actions = profile.actions || [];
  const joined = profile.joinedChallenges || [];

  const badges = [
    { id: "first", emoji: "🌱", name: "First Green Step", description: "Record your first eco-action.", earned: actions.length >= 1 },
    { id: "scanner", emoji: "🔎", name: "Waste Explorer", description: "Explore 3 waste items.", earned: new Set(actions.map(a => a.item)).size >= 3 },
    { id: "points", emoji: "⭐", name: "Point Collector", description: "Earn 100 eco-points.", earned: profile.points >= 100 },
    { id: "actions", emoji: "♻️", name: "Eco Regular", description: "Record 5 eco-actions.", earned: actions.length >= 5 },
    { id: "challenge", emoji: "🤝", name: "Team Player", description: "Join a community challenge.", earned: joined.length >= 1 },
    { id: "level", emoji: "🌳", name: "Growing Strong", description: "Reach level 2.", earned: profile.points >= 250 }
  ];

  updateProfile(current => {
    current.earnedBadges = badges.filter(b => b.earned).map(b => b.id);
  });

  $("#badgeGrid").innerHTML = badges.map(badge => `
    <div class="badge-card ${badge.earned ? "" : "locked"}">
      <span>${badge.emoji}</span>
      <b>${escapeHTML(badge.name)}</b>
      <p>${escapeHTML(badge.description)}</p>
      <p>${badge.earned ? "✓ Unlocked" : "🔒 Not unlocked yet"}</p>
    </div>
  `).join("");
}

function renderChallenges(profile) {
  const joined = profile.joinedChallenges || [];
  const completed = profile.completedChallenges || [];

  const html = challenges.map(challenge => {
    const isJoined = joined.includes(challenge.name);
    const isCompleted = completed.includes(challenge.name);

    return `
      <article class="challenge-card">
        <div class="challenge-top">
          <span class="challenge-emoji">${challenge.emoji}</span>
          <span class="challenge-tag">${challenge.days} DAYS</span>
        </div>
        <h3>${escapeHTML(challenge.name)}</h3>
        <p>${escapeHTML(challenge.description)}</p>
        <div class="challenge-bottom">
          <span>${escapeHTML(challenge.category)}</span>
          <b>+${challenge.points} XP</b>
        </div>
        <button class="btn ${isCompleted ? "btn-light" : "btn-primary"} full-width dashboard-challenge-btn"
          data-challenge="${escapeHTML(challenge.name)}"
          ${isCompleted ? "disabled" : ""}>
          ${isCompleted ? "Challenge completed ✓" : isJoined ? "Mark as completed ✓" : "Join challenge ↗"}
        </button>
      </article>
    `;
  }).join("");

  $("#dashboardChallenges").innerHTML = html;

  $$(".dashboard-challenge-btn").forEach(button => {
    button.addEventListener("click", () => {
      const name = button.dataset.challenge;
      const profileNow = getProfile();
      const alreadyJoined = profileNow.joinedChallenges.includes(name);

      if (!alreadyJoined) {
        updateProfile(current => {
          current.joinedChallenges.push(name);
        });
        renderDashboard();
        showToast("Challenge joined! Come back when you have completed it.");
      } else {
        completeChallenge(name);
      }
    });
  });
}

function completeChallenge(name) {
  const challenge = challenges.find(item => item.name === name);
  const profile = getProfile();

  if (!challenge || !profile) return;

  if (profile.completedChallenges.includes(name)) {
    showToast("You have already completed this challenge.");
    return;
  }

  const confirmed = window.confirm(
    "Have you completed the activities for \"" + name + "\"? " +
    "This demo awards points based on your confirmation."
  );

  if (!confirmed) return;

  updateProfile(current => {
    current.completedChallenges.push(name);
    current.points += challenge.points;
    current.actions.push({
      title: "Challenge: " + name,
      emoji: challenge.emoji,
      points: challenge.points,
      weight: 0,
      item: "challenge",
      dateLabel: new Date().toLocaleString()
    });
  });

  renderDashboard();
  showToast("Challenge completed! +" + challenge.points + " XP 🎉");
}

function recordAction(itemKey) {
  const item = wasteItems[itemKey];
  if (!item) return;

  const profile = getProfile();
  if (!profile) {
    openAuth("signup");
    return;
  }

  const confirmed = window.confirm(
    "Have you actually completed a suitable action for " + item.name + "?\n\n" +
    "Confirming will record this demo action and award " + item.points + " XP."
  );

  if (!confirmed) return;

  updateProfile(current => {
    const today = new Date().toISOString().slice(0, 10);
    const previousDate = current.lastActionDate;

    if (previousDate !== today) {
      if (previousDate) {
        const oldDate = new Date(previousDate + "T12:00:00");
        const todayDate = new Date(today + "T12:00:00");
        const dayDifference = Math.round((todayDate - oldDate) / 86400000);
        current.streak = dayDifference === 1 ? (current.streak || 0) + 1 : 1;
      } else {
        current.streak = 1;
      }
      current.lastActionDate = today;
    }

    current.points += item.points;
    current.wasteKg = (current.wasteKg || 0) + item.weight;
    current.actions.push({
      title: item.name + " · Action recorded",
      emoji: item.emoji,
      points: item.points,
      weight: item.weight,
      item: itemKey,
      dateLabel: new Date().toLocaleString()
    });
  });

  renderDashboard();
  showToast("Eco-action recorded! +" + item.points + " XP 🌱");
}

function showRecommendation(itemKey) {
  const item = wasteItems[itemKey];
  if (!item) return;

  $("#scannerResult").innerHTML = `
    <div class="result-title">
      <span>${item.emoji}</span>
      <div><h3>${escapeHTML(item.name)}</h3><p>Possible pathways · Check local rules</p></div>
    </div>
    ${item.actions.map((action, index) => `
      <div class="guidance-option ${index === 0 ? "recommended" : ""}">
        ${index === 0 ? '<span class="option-tag">SUGGESTED OPTION</span>' : ""}
        <h4>${escapeHTML(action[0])}</h4>
        <p>${escapeHTML(action[1])}</p>
      </div>
    `).join("")}
    <div class="result-footer">
      <p>Guidance is illustrative. Suitability depends on material, item condition, safety, and local facilities. Points and waste estimates are prototype values, not verified environmental measurements.</p>
      <button class="btn btn-primary full-width" id="recordActionBtn">I completed an action · Record +${item.points} XP</button>
    </div>
  `;

  $("#recordActionBtn").addEventListener("click", () => recordAction(itemKey));
}

$$(".waste-option").forEach(button => {
  button.addEventListener("click", () => {
    selectedItem = button.dataset.item;
    $$(".waste-option").forEach(option => {
      option.classList.toggle("selected", option === button);
    });
    showRecommendation(selectedItem);
  });
});

$("#analyzeBtn").addEventListener("click", () => {
  showRecommendation(selectedItem);
  showToast("Sample recommendations ready. This is not AI image recognition.");
});

$("#demoScannerBtn").addEventListener("click", () => {
  if (getSession()) {
    enterDashboard();
    showView("scanner");
  } else {
    openAuth("signup");
  }
});

$("#wasteImage").addEventListener("change", event => {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    showToast("Please choose a JPG, PNG, or WEBP image.");
    event.target.value = "";
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    showToast("Please select an image smaller than 5 MB.");
    event.target.value = "";
    return;
  }

  if (uploadedImageUrl) URL.revokeObjectURL(uploadedImageUrl);
  uploadedImageUrl = URL.createObjectURL(file);

  $("#imagePreview").innerHTML =
    `<img src="${uploadedImageUrl}" alt="Preview of uploaded waste item"><p class="muted">Image preview only — no image analysis was performed.</p>`;
  $("#imagePreview").classList.remove("hidden");

  showToast("Image preview loaded. Choose the closest sample item for guidance.");
});

$$(".challenge-join").forEach(button => {
  button.addEventListener("click", () => {
    if (!getSession()) {
      openAuth("signup");
      return;
    }

    const name = button.dataset.challenge;
    const profile = getProfile();

    if (profile.joinedChallenges.includes(name)) {
      showToast("You have already joined this challenge.");
      return;
    }

    updateProfile(current => {
      current.joinedChallenges.push(name);
    });

    renderDashboard();
    showToast("Challenge joined! Open your dashboard to track it.");
  });
});

$("#exportBtn").addEventListener("click", () => {
  const profile = getProfile();
  if (!profile) return;

  const exportData = {
    name: profile.name,
    points: profile.points,
    actions: profile.actions,
    joinedChallenges: profile.joinedChallenges,
    completedChallenges: profile.completedChallenges,
    estimatedWasteKg: profile.wasteKg,
    note: "Demo data only. Environmental estimates are illustrative."
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "waste2worth-demo-impact.json";
  link.click();
  URL.revokeObjectURL(url);

  showToast("Your demo activity data has been exported.");
});

$("#announcementClose").addEventListener("click", () => {
  $(".announcement").classList.add("hidden");
});

$("#menuToggle").addEventListener("click", () => {
  $("#navLinks").classList.toggle("open");
});

$$(".nav-links a").forEach(link => {
  link.addEventListener("click", () => $("#navLinks").classList.remove("open"));
});

function initialize() {
  showRecommendation(selectedItem);

  if (getSession() && getProfile()) {
    enterDashboard();
  }
}

initialize();
