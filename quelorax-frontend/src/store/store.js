
const KEYS = {
  org: "qx_org",
  users: "qx_users",
  departments: "qx_departments",
  tokens: "qx_tokens",
  documents: "qx_documents",
  notifications: "qx_notifications",
  otpCodes: "qx_otp",
  resetCodes: "qx_reset",
  session: "qx_session",
  settings: "qx_settings",
  loginLog: "qx_login_log",
};

const read = (k, fallback) => {
  try {
    const raw = localStorage.getItem(k);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export function seedStore() {
  if (!localStorage.getItem(KEYS.org)) {
    write(KEYS.org, {
      id: uid(),
      name: "Quelorax Organization",
      tagline: "Any walk-in organization",
      createdAt: Date.now(),
    });
  }
  if (!localStorage.getItem(KEYS.departments)) {
    write(KEYS.departments, [
      { id: uid(), name: "General Enquiry", code: "GEN", avgServiceTime: 6, counter: 1, active: true },
      { id: uid(), name: "Account Services", code: "ACC", avgServiceTime: 10, counter: 2, active: true },
      { id: uid(), name: "Document Verification", code: "DOC", avgServiceTime: 8, counter: 3, active: true },
    ]);
  }
  if (!localStorage.getItem(KEYS.users)) {
    const depts = read(KEYS.departments, []);
    write(KEYS.users, [
      {
        id: uid(),
        name: "System Admin",
        email: "admin@quelorax.app",
        phone: "+10000000001",
        password: "admin123",
        role: "admin",
        departmentId: null,
        verified: true,
        createdAt: Date.now(),
      },
      {
        id: uid(),
        name: "Reception Desk",
        email: "reception@quelorax.app",
        phone: "+10000000002",
        password: "reception123",
        role: "receptionist",
        departmentId: null,
        verified: true,
        createdAt: Date.now(),
      },
      {
        id: uid(),
        name: "Staff Member",
        email: "staff@quelorax.app",
        phone: "+10000000003",
        password: "staff123",
        role: "staff",
        departmentId: depts[0]?.id ?? null,
        verified: true,
        createdAt: Date.now(),
      },
    ]);
  }
  if (!localStorage.getItem(KEYS.tokens)) write(KEYS.tokens, []);
  if (!localStorage.getItem(KEYS.documents)) write(KEYS.documents, []);
  if (!localStorage.getItem(KEYS.notifications)) write(KEYS.notifications, []);
  if (!localStorage.getItem(KEYS.otpCodes)) write(KEYS.otpCodes, {});
  if (!localStorage.getItem(KEYS.resetCodes)) write(KEYS.resetCodes, {});
  if (!localStorage.getItem(KEYS.settings)) write(KEYS.settings, { theme: "light", language: "en" });
  if (!localStorage.getItem(KEYS.loginLog)) write(KEYS.loginLog, []);
}

// --- Org
export const getOrg = () => read(KEYS.org, null);
export const updateOrg = (patch) => {
  const org = { ...getOrg(), ...patch };
  write(KEYS.org, org);
  return org;
};

// --- Users
export const getUsers = () => read(KEYS.users, []);
export const getUser = (id) => getUsers().find((u) => u.id === id) || null;
export const findUserByEmail = (email) =>
  getUsers().find((u) => u.email.toLowerCase() === (email || "").toLowerCase()) || null;
export const createUser = (data) => {
  const users = getUsers();
  const user = {
    id: uid(),
    role: "visitor",
    verified: false,
    departmentId: null,
    createdAt: Date.now(),
    ...data,
  };
  users.push(user);
  write(KEYS.users, users);
  return user;
};
export const updateUser = (id, patch) => {
  const users = getUsers().map((u) => (u.id === id ? { ...u, ...patch } : u));
  write(KEYS.users, users);
  return users.find((u) => u.id === id);
};
export const deleteUser = (id) => {
  write(KEYS.users, getUsers().filter((u) => u.id !== id));
};

// Finds an existing account for this email, or creates a new visitor
// account for a first-time Google sign-in. Google-created accounts are
// pre-verified (Google already confirmed the email) and have no local
// password, since they authenticate via Google instead.
export const findOrCreateGoogleUser = ({ email, name, googleId, picture }) => {
  const existing = findUserByEmail(email);
  if (existing) {
    // Link the Google account if this email previously signed up normally.
    if (!existing.googleId) {
      return updateUser(existing.id, { googleId, picture: picture || existing.picture, verified: true });
    }
    return existing;
  }
  return createUser({
    name,
    email,
    phone: "",
    password: null,
    role: "visitor",
    verified: true,
    googleId,
    picture,
  });
};

// --- Departments
export const getDepartments = () => read(KEYS.departments, []);
export const getDepartment = (id) => getDepartments().find((d) => d.id === id) || null;
export const createDepartment = (data) => {
  const items = getDepartments();
  const d = { id: uid(), active: true, avgServiceTime: 5, counter: 1, ...data };
  items.push(d);
  write(KEYS.departments, items);
  return d;
};
export const updateDepartment = (id, patch) => {
  write(KEYS.departments, getDepartments().map((d) => (d.id === id ? { ...d, ...patch } : d)));
};
export const deleteDepartment = (id) => {
  write(KEYS.departments, getDepartments().filter((d) => d.id !== id));
};

// --- Tokens
export const getTokens = () => read(KEYS.tokens, []);
export const getTokensByDept = (id) => getTokens().filter((t) => t.departmentId === id);
export const getTokensByUser = (id) => getTokens().filter((t) => t.userId === id);

export const createToken = ({ userId, visitorName, phone = "", departmentId, purpose, walkIn = false, slotTime = null, priority = "normal" }) => {
  const tokens = getTokens();
  const dept = getDepartment(departmentId);
  const todaysDeptTokens = tokens.filter(
    (t) => t.departmentId === departmentId && isSameDay(t.createdAt, Date.now())
  );
  const number = todaysDeptTokens.length + 1;
  const code = `${dept?.code ?? "GEN"}-${String(number).padStart(3, "0")}`;
  // If the visitor (or the receptionist on their behalf) chose a future arrival
  // time, the token starts out "delayed" so it doesn't block the live queue.
  // Reaching that time does NOT automatically drop them into the live queue —
  // that would count someone as present when they might not actually be there.
  // Instead, once the time passes without a check-in, the token flips to
  // "missed" (see flagOverdueDelays below) and waits there until the visitor
  // (or the receptionist on their behalf) actually checks in — via
  // checkInToken — at which point they join the current live queue.
  const isFutureSlot = !!slotTime && slotTime > Date.now();
  const token = {
    id: uid(),
    code,
    number,
    userId,
    visitorName,
    phone,
    departmentId,
    purpose: purpose || "",
    priority, // normal | senior | emergency | vip
    status: isFutureSlot ? "delayed" : "waiting", // waiting | serving | completed | skipped | cancelled | delayed | missed
    walkIn,
    slotTime: slotTime || null, // visitor's chosen preferred/visiting arrival time (ms epoch), or null for ASAP
    order: Date.now(), // controls manual queue position within a priority tier
    createdAt: Date.now(),
    calledAt: null,
    completedAt: null,
    checkedInAt: null,
    delayUntil: isFutureSlot ? slotTime : null,
    delayNote: isFutureSlot
      ? `Chose to arrive around ${new Date(slotTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
      : null,
  };
  tokens.push(token);
  write(KEYS.tokens, tokens);
  return token;
};
export const updateToken = (id, patch) => {
  const list = getTokens().map((t) => (t.id === id ? { ...t, ...patch } : t));
  write(KEYS.tokens, list);
  return list.find((t) => t.id === id);
};

// Visitor- or receptionist-initiated cancellation of a still-pending token
// (waiting, delayed, or missed). Not allowed once a token is already being
// served or has been completed, since a live queue slot is currently held.
export const cancelToken = (id) => {
  const token = getTokens().find((t) => t.id === id);
  if (!token) return null;
  if (token.status === "serving" || token.status === "completed") return token;
  return updateToken(id, { status: "cancelled", cancelledAt: Date.now() });
};

// Any token this visitor currently has "in flight" for a department — used to
// warn against booking a second token in the same department at once.
export const getActiveTokensForDeptByUser = (userId, departmentId) =>
  getTokens().filter(
    (t) =>
      t.userId === userId &&
      t.departmentId === departmentId &&
      ["waiting", "serving", "delayed", "missed"].includes(t.status)
  );

// --- Priority queue management (receptionist / staff)
const PRIORITY_WEIGHT = { emergency: 0, senior: 1, vip: 2, normal: 3 };
export const priorityWeight = (p) => PRIORITY_WEIGHT[p] ?? 3;

export const getWaitingQueue = (deptId) => {
  const tokens = getTokensByDept(deptId).filter((t) => t.status === "waiting");
  return tokens.slice().sort((a, b) => {
    const wa = priorityWeight(a.priority);
    const wb = priorityWeight(b.priority);
    if (wa !== wb) return wa - wb;
    return (a.order ?? a.createdAt) - (b.order ?? b.createdAt);
  });
};

export const setTokenPriority = (id, priority) => updateToken(id, { priority });

export const reorderToken = (id, direction) => {
  const token = getTokens().find((t) => t.id === id);
  if (!token) return;
  const list = getWaitingQueue(token.departmentId);
  const idx = list.findIndex((t) => t.id === id);
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (idx === -1 || swapIdx < 0 || swapIdx >= list.length) return;
  const a = list[idx];
  const b = list[swapIdx];
  // Only reorder within the same priority tier — crossing tiers should be done
  // explicitly via setTokenPriority so priority and position never disagree.
  if (a.priority !== b.priority) return;
  const orderA = a.order ?? a.createdAt;
  const orderB = b.order ?? b.createdAt;
  updateToken(a.id, { order: orderB });
  updateToken(b.id, { order: orderA });
};

// --- "Join later" delay handling + no-show check-in
// A visitor who books a future slot (through the app) or tells the receptionist
// "I'll join in an hour" is moved out of the active waiting line (so they don't
// block others) while they're not around yet.
export const getDelayedQueue = (deptId) =>
  getTokensByDept(deptId)
    .filter((t) => t.status === "delayed")
    .sort((a, b) => (a.delayUntil ?? 0) - (b.delayUntil ?? 0));

// Tokens whose requested time has already passed but the visitor hasn't checked
// in yet — i.e. a potential no-show. They stay here (not in the live queue)
// until someone confirms they've actually arrived via checkInToken.
export const getMissedQueue = (deptId) =>
  getTokensByDept(deptId)
    .filter((t) => t.status === "missed")
    .sort((a, b) => (a.delayUntil ?? 0) - (b.delayUntil ?? 0));

export const delayToken = (id, minutes) => {
  const delayUntil = Date.now() + minutes * 60 * 1000;
  return updateToken(id, {
    status: "delayed",
    delayUntil,
    delayNote: `Told the desk they'd join in about ${minutes >= 60 ? `${Math.round(minutes / 60)} hr` : `${minutes} min`}`,
  });
};

// The visitor (self-service, via the visitor dashboard) or the receptionist
// (on the visitor's behalf) confirms the visitor has physically arrived.
// Works whether the token is still "delayed" (arrived early) or already
// "missed" (arrived late, after their requested time passed) — either way
// they're placed at the back of their priority tier in the live queue.
export const checkInToken = (id) =>
  updateToken(id, {
    status: "waiting",
    order: Date.now(),
    delayUntil: null,
    delayNote: null,
    checkedInAt: Date.now(),
  });

// Scans a department's delayed tokens and flags any whose requested time has
// arrived as "missed" — a likely no-show — WITHOUT adding them to the live
// queue. They only rejoin the queue once checkInToken confirms they've
// actually arrived. Returns the tokens that were just flagged.
export const flagOverdueDelays = (deptId) => {
  const now = Date.now();
  const due = getTokensByDept(deptId).filter((t) => t.status === "delayed" && (t.delayUntil ?? 0) <= now);
  due.forEach((t) =>
    updateToken(t.id, {
      status: "missed",
      delayNote: "Requested time passed without checking in — check in as soon as you arrive.",
    })
  );
  return due;
};

// --- Documents
export const getDocuments = () => read(KEYS.documents, []);
export const getDocumentsByUser = (id) => getDocuments().filter((d) => d.userId === id);
export const createDocument = (data) => {
  const list = getDocuments();
  const doc = { id: uid(), status: "pending", uploadedAt: Date.now(), ...data };
  list.push(doc);
  write(KEYS.documents, list);
  return doc;
};
export const updateDocument = (id, patch) => {
  write(KEYS.documents, getDocuments().map((d) => (d.id === id ? { ...d, ...patch } : d)));
};
export const deleteDocument = (id) => {
  write(KEYS.documents, getDocuments().filter((d) => d.id !== id));
};

// --- Notifications
export const getNotifications = () => read(KEYS.notifications, []);
export const getNotificationsForUser = (userId, role, departmentId) =>
  getNotifications().filter((n) => {
    if (n.userId && n.userId === userId) return true;
    if (n.scope === "org") return true;
    if (n.scope === "department" && n.departmentId === departmentId) return true;
    if (n.scope === "role" && n.role === role) return true;
    return false;
  });
export const createNotification = (data) => {
  const list = getNotifications();
  const n = { id: uid(), createdAt: Date.now(), readBy: [], type: "info", ...data };
  list.unshift(n);
  write(KEYS.notifications, list);
  return n;
};
export const markNotificationRead = (id, userId) => {
  const list = getNotifications().map((n) =>
    n.id === id ? { ...n, readBy: Array.from(new Set([...(n.readBy || []), userId])) } : n
  );
  write(KEYS.notifications, list);
};
export const markAllRead = (userId, role, departmentId) => {
  const list = getNotifications().map((n) => {
    const applies =
      (n.userId && n.userId === userId) ||
      n.scope === "org" ||
      (n.scope === "department" && n.departmentId === departmentId) ||
      (n.scope === "role" && n.role === role);
    if (!applies) return n;
    return { ...n, readBy: Array.from(new Set([...(n.readBy || []), userId])) };
  });
  write(KEYS.notifications, list);
};

// --- OTP / Reset
export const setOtp = (email, code) => {
  const all = read(KEYS.otpCodes, {});
  all[email.toLowerCase()] = { code, expires: Date.now() + 5 * 60 * 1000 };
  write(KEYS.otpCodes, all);
};
export const verifyOtp = (email, code) => {
  const all = read(KEYS.otpCodes, {});
  const entry = all[email.toLowerCase()];
  if (!entry) return false;
  if (entry.expires < Date.now()) return false;
  if (entry.code !== code) return false;
  delete all[email.toLowerCase()];
  write(KEYS.otpCodes, all);
  return true;
};
export const setResetCode = (email, code) => {
  const all = read(KEYS.resetCodes, {});
  all[email.toLowerCase()] = { code, expires: Date.now() + 15 * 60 * 1000 };
  write(KEYS.resetCodes, all);
};
export const verifyResetCode = (email, code) => {
  const all = read(KEYS.resetCodes, {});
  const entry = all[email.toLowerCase()];
  if (!entry || entry.expires < Date.now() || entry.code !== code) return false;
  delete all[email.toLowerCase()];
  write(KEYS.resetCodes, all);
  return true;
};

// --- Session
export const getSession = () => read(KEYS.session, null);
export const setSession = (userId) => write(KEYS.session, { userId, startedAt: Date.now() });
export const clearSession = () => localStorage.removeItem(KEYS.session);

// --- Login tracking (for admin "how many users have logged in" reporting)
export const recordLogin = (userId) => {
  const user = getUser(userId);
  if (!user) return;
  updateUser(userId, {
    lastLoginAt: Date.now(),
    loginCount: (user.loginCount || 0) + 1,
  });
  const log = read(KEYS.loginLog, []);
  log.push({ userId, at: Date.now() });
  // keep the log from growing unbounded
  write(KEYS.loginLog, log.slice(-500));
};

export const getLoginLog = () => read(KEYS.loginLog, []);

// An "active session" here just means logged in within the last 15 minutes —
// this is a client-only demo store, so there is no server-side presence signal.
const ONLINE_WINDOW_MS = 15 * 60 * 1000;

export const getLoginStats = () => {
  const users = getUsers();
  const now = Date.now();
  const usersLoggedIn = users.filter((u) => (u.loginCount || 0) > 0);
  const onlineNow = users.filter((u) => u.lastLoginAt && now - u.lastLoginAt <= ONLINE_WINDOW_MS);
  const totalLogins = users.reduce((sum, u) => sum + (u.loginCount || 0), 0);
  return {
    totalUsers: users.length,
    usersLoggedInCount: usersLoggedIn.length,
    onlineNowCount: onlineNow.length,
    totalLogins,
  };
};

// --- Settings
export const getSettings = () => read(KEYS.settings, { theme: "light", language: "en" });
export const updateSettings = (patch) => {
  const s = { ...getSettings(), ...patch };
  write(KEYS.settings, s);
  return s;
};

// --- Utilities
export function isSameDay(a, b) {
  const da = new Date(a);
  const db = new Date(b);
  return da.toDateString() === db.toDateString();
}
export function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}