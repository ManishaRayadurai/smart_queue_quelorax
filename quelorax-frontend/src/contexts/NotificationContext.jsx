import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext.jsx";
import { notificationsApi } from "../api/notifications.js";
import { tokensApi } from "../api/tokens.js";
import { departmentsApi } from "../api/departments.js";
import { predictWaitTime } from "../utils/aiPredictions.js";
import { requestPushToken, onForegroundPush, isPushConfigured } from "../firebase.js";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [tick, setTick] = useState(0);
  const milestones = useRef({});
  const deptCache = useRef({});
  const fcmToken = useRef(null);
  const deletedIds = useRef(new Set());

  useEffect(() => {
    if (!user) { setItems([]); return; }
    let cancelled = false;
    notificationsApi
      .getForUser(user.id, user.role, user.departmentId)
      .then((data) => {
        if (!cancelled) {
          setItems(data.filter((n) => !deletedIds.current.has(n.id)));
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user, tick]);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 4000);
    return () => clearInterval(id);
  }, []);

  // Push notifications (Firebase Cloud Messaging): register this browser
  // as a device the moment someone's logged in, so queue updates (called,
  // delayed, missed, completed) can reach them even if this tab isn't
  // open/focused. Unregisters on logout. No-op entirely if Firebase env
  // vars aren't set — see src/firebase.js.
  useEffect(() => {
    if (!user || !isPushConfigured) return;
    let cancelled = false;

    requestPushToken().then((token) => {
      if (cancelled || !token) return;
      fcmToken.current = token;
      notificationsApi.registerFcmToken(token).catch(() => {});
    });

    const unsubscribePromise = onForegroundPush((payload) => {
      const title = payload.notification?.title || payload.data?.title || "Quelorax";
      const body = payload.notification?.body || payload.data?.body || "";
      if (Notification.permission === "granted") {
        new Notification(title, { body, icon: "/favicon.svg" });
      }
      setTick((t) => t + 1);
    });

    return () => {
      cancelled = true;
      unsubscribePromise.then((unsub) => unsub && unsub());
      if (fcmToken.current) {
        notificationsApi.unregisterFcmToken(fcmToken.current).catch(() => {});
        fcmToken.current = null;
      }
    };
  }, [user]);

  // Live queue-position updates for visitors
  useEffect(() => {
    if (!user || user.role !== "visitor") return;
    let cancelled = false;

    (async () => {
      try {
        const mine = await tokensApi.getByUser(user.id);
        const active = mine.filter((t) => t.status === "waiting");
        for (const token of active) {
          const queue = await tokensApi.getWaiting(token.departmentId);
          if (cancelled) return;
          const position = queue.findIndex((t) => t.id === token.id) + 1;
          if (position <= 0) continue;
          const ahead = position - 1;
          if (!deptCache.current[token.departmentId]) {
            deptCache.current[token.departmentId] = await departmentsApi.getOne(token.departmentId).catch(() => null);
          }
          const dept = deptCache.current[token.departmentId];
          const eta = predictWaitTime(dept?.avgServiceTime, position);
          const seen = milestones.current[token.id] || {};

          const record = async (stage, title, body) => {
            await notificationsApi.create({ userId: user.id, type: "queue", title, body });
            milestones.current[token.id] = { ...seen, [stage]: true };
            setTick((t) => t + 1);
          };

          if (ahead <= 5 && !seen.ahead5) {
            await record("ahead5", "Queue update", `${ahead} people are ahead of you. Estimated waiting time is ${eta} minutes.`);
          } else if (ahead === 0 && !seen.turn) {
            await record("turn", "Your turn is approaching", `You're next in line for ${dept?.name}. Please be ready.`);
          }
        }
      } catch {}
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, tick]);

  const unread = items.filter((n) => !(n.readBy || []).includes(user?.id)).length;

  const push = (data) => {
    notificationsApi.create(data).then(() => setTick((t) => t + 1)).catch(() => {});
  };
  const markRead = (id) => {
    if (!user) return;
    notificationsApi.markRead(id, user.id).then(() => setTick((t) => t + 1)).catch(() => {});
  };
  const readAll = () => {
    if (!user) return;
    notificationsApi.markAllRead(user.id, user.role, user.departmentId).then(() => setTick((t) => t + 1)).catch(() => {});
  };
  const deleteNotification = (id) => {
    if (!user) return;
    deletedIds.current.add(id);
    setItems((prev) => prev.filter((n) => n.id !== id));
    notificationsApi.delete(id).catch(() => {});
  };
  const clearAll = () => {
    if (!user) return;
    items.forEach((n) => deletedIds.current.add(n.id));
    setItems([]);
    notificationsApi.clearAll(user.id, user.role, user.departmentId).catch(() => {});
  };

  return (
    <NotificationContext.Provider value={{ items, unread, push, markRead, readAll, deleteNotification, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
