package com.quelorax.backend.service;

import com.quelorax.backend.dto.request.TokenCreateRequest;
import com.quelorax.backend.entity.Department;
import com.quelorax.backend.entity.QueueToken;
import com.quelorax.backend.exception.ApiException;
import com.quelorax.backend.repository.DepartmentRepository;
import com.quelorax.backend.repository.QueueTokenRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class QueueTokenService {

    private final QueueTokenRepository tokenRepository;
    private final DepartmentRepository departmentRepository;
    private final QueueNotificationClient notificationClient;

    private static final Map<String, Integer> PRIORITY_WEIGHT = Map.of(
            "emergency", 0, "senior", 1, "vip", 2, "normal", 3
    );

    // Grace window (ms) so a slot picked right at the wire isn't rejected
    // purely due to request latency. Keep small — this is not meant to allow
    // booking meaningfully past-due slots.
    private static final long SLOT_GRACE_MS = 60_000L;

    public QueueTokenService(QueueTokenRepository tokenRepository, DepartmentRepository departmentRepository,
                              QueueNotificationClient notificationClient) {
        this.tokenRepository = tokenRepository;
        this.departmentRepository = departmentRepository;
        this.notificationClient = notificationClient;
    }

    private int priorityWeight(QueueToken.Priority p) {
        return PRIORITY_WEIGHT.getOrDefault(p.name(), 3);
    }

    private boolean isSameDay(long a, long b) {
        var da = Instant.ofEpochMilli(a).atZone(ZoneId.systemDefault()).toLocalDate();
        var db = Instant.ofEpochMilli(b).atZone(ZoneId.systemDefault()).toLocalDate();
        return da.equals(db);
    }

    @Transactional
    public QueueToken createToken(TokenCreateRequest req) {
        Department dept = departmentRepository.findById(req.getDepartmentId())
                .orElseThrow(() -> new ApiException("Department not found", HttpStatus.NOT_FOUND));

        long now = System.currentTimeMillis();

        // Time-based booking: once the chosen date/time has passed, it can no
        // longer be booked. A small grace buffer avoids rejecting a slot that
        // was valid the instant the user tapped "confirm" but ticked over by
        // the time the request reached the server.
        if (req.getSlotTime() != null && req.getSlotTime() < now - SLOT_GRACE_MS) {
            throw new ApiException("This date/time has already passed. Please choose a future date and time.", HttpStatus.BAD_REQUEST);
        }

        List<QueueToken> todaysDeptTokens = tokenRepository.findByDepartmentId(dept.getId()).stream()
                .filter(t -> isSameDay(t.getCreatedAt(), now))
                .toList();
        int number = todaysDeptTokens.size() + 1;
        String code = dept.getCode() + "-" + String.format("%03d", number);

        boolean isFutureSlot = req.getSlotTime() != null && req.getSlotTime() > now;
        QueueToken.Priority priority = QueueToken.Priority.normal;
        if (req.getPriority() != null && !req.getPriority().isBlank()) {
            priority = QueueToken.Priority.valueOf(req.getPriority());
        }

        QueueToken token = QueueToken.builder()
                .code(code)
                .number(number)
                .userId(req.getUserId())
                .visitorName(req.getVisitorName())
                .phone(req.getPhone())
                .departmentId(dept.getId())
                .purpose(req.getPurpose())
                .priority(priority)
                .status(isFutureSlot ? QueueToken.Status.delayed : QueueToken.Status.waiting)
                .walkIn(req.isWalkIn())
                .slotTime(req.getSlotTime())
                .orderKey(now)
                .createdAt(now)
                .delayUntil(isFutureSlot ? req.getSlotTime() : null)
                .delayNote(isFutureSlot ? "Chose to arrive around a scheduled time" : null)
                .build();

        return tokenRepository.save(token);
    }

    public List<QueueToken> getAll() {
        return tokenRepository.findAll();
    }

    public List<QueueToken> getByDepartment(Long deptId) {
        return tokenRepository.findByDepartmentId(deptId);
    }

    public List<QueueToken> getByUser(Long userId) {
        return tokenRepository.findByUserId(userId);
    }

    public QueueToken getOrThrow(Long id) {
        return tokenRepository.findById(id)
                .orElseThrow(() -> new ApiException("Token not found", HttpStatus.NOT_FOUND));
    }

    @Transactional
    public QueueToken updateToken(Long id, Map<String, Object> patch) {
        QueueToken t = getOrThrow(id);
        if (patch.containsKey("status")) t.setStatus(QueueToken.Status.valueOf((String) patch.get("status")));
        if (patch.containsKey("priority")) t.setPriority(QueueToken.Priority.valueOf((String) patch.get("priority")));
        if (patch.containsKey("purpose")) t.setPurpose((String) patch.get("purpose"));
        if (patch.containsKey("visitorName")) t.setVisitorName((String) patch.get("visitorName"));
        if (patch.containsKey("phone")) t.setPhone((String) patch.get("phone"));
        if (patch.containsKey("slotTime")) {
            Object raw = patch.get("slotTime");
            Long newSlotTime = raw == null ? null : Long.valueOf(String.valueOf(raw));
            if (newSlotTime != null && newSlotTime < System.currentTimeMillis() - SLOT_GRACE_MS) {
                throw new ApiException("This date/time has already passed. Please choose a future date and time.", HttpStatus.BAD_REQUEST);
            }
            t.setSlotTime(newSlotTime);
        }
        return tokenRepository.save(t);
    }

    // Visitor/receptionist cancellation - not allowed once serving/completed
    @Transactional
    public QueueToken cancelToken(Long id) {
        QueueToken t = getOrThrow(id);
        if (t.getStatus() == QueueToken.Status.serving || t.getStatus() == QueueToken.Status.completed) {
            return t;
        }
        t.setStatus(QueueToken.Status.cancelled);
        t.setCancelledAt(System.currentTimeMillis());
        return tokenRepository.save(t);
    }

    public List<QueueToken> getActiveTokensForDeptByUser(Long userId, Long departmentId) {
        return tokenRepository.findByDepartmentId(departmentId).stream()
                .filter(t -> t.getUserId() != null && t.getUserId().equals(userId))
                .filter(t -> List.of(QueueToken.Status.waiting, QueueToken.Status.serving,
                        QueueToken.Status.delayed, QueueToken.Status.missed).contains(t.getStatus()))
                .toList();
    }

    public List<QueueToken> getWaitingQueue(Long deptId) {
        return tokenRepository.findByDepartmentIdAndStatus(deptId, QueueToken.Status.waiting).stream()
                .sorted(Comparator
                        .comparingInt((QueueToken t) -> priorityWeight(t.getPriority()))
                        .thenComparing(t -> t.getOrderKey() != null ? t.getOrderKey() : t.getCreatedAt()))
                .collect(Collectors.toList());
    }

    @Transactional
    public QueueToken setPriority(Long id, String priority) {
        QueueToken t = getOrThrow(id);
        t.setPriority(QueueToken.Priority.valueOf(priority));
        return tokenRepository.save(t);
    }

    @Transactional
    public void reorderToken(Long id, String direction) {
        QueueToken token = getOrThrow(id);
        List<QueueToken> list = getWaitingQueue(token.getDepartmentId());
        int idx = -1;
        for (int i = 0; i < list.size(); i++) if (list.get(i).getId().equals(id)) idx = i;
        int swapIdx = "up".equals(direction) ? idx - 1 : idx + 1;
        if (idx == -1 || swapIdx < 0 || swapIdx >= list.size()) return;

        QueueToken a = list.get(idx);
        QueueToken b = list.get(swapIdx);
        // Only reorder within same priority tier
        if (a.getPriority() != b.getPriority()) return;

        long orderA = a.getOrderKey() != null ? a.getOrderKey() : a.getCreatedAt();
        long orderB = b.getOrderKey() != null ? b.getOrderKey() : b.getCreatedAt();
        a.setOrderKey(orderB);
        b.setOrderKey(orderA);
        tokenRepository.save(a);
        tokenRepository.save(b);
    }

    public List<QueueToken> getDelayedQueue(Long deptId) {
        return tokenRepository.findByDepartmentIdAndStatus(deptId, QueueToken.Status.delayed).stream()
                .sorted(Comparator.comparing(t -> t.getDelayUntil() != null ? t.getDelayUntil() : 0L))
                .toList();
    }

    public List<QueueToken> getMissedQueue(Long deptId) {
        return tokenRepository.findByDepartmentIdAndStatus(deptId, QueueToken.Status.missed).stream()
                .sorted(Comparator.comparing(t -> t.getDelayUntil() != null ? t.getDelayUntil() : 0L))
                .toList();
    }

    @Transactional
    public QueueToken delayToken(Long id, int minutes) {
        QueueToken t = getOrThrow(id);
        long delayUntil = System.currentTimeMillis() + minutes * 60_000L;
        t.setStatus(QueueToken.Status.delayed);
        t.setDelayUntil(delayUntil);
        t.setDelayNote("Told the desk they'd join in about " +
                (minutes >= 60 ? Math.round(minutes / 60.0) + " hr" : minutes + " min"));
        QueueToken saved = tokenRepository.save(t);
        notificationClient.notifyUser(saved.getUserId(), "warning",
                "Your visit has been delayed",
                "Token " + saved.getCode() + " has been delayed by about " +
                        (minutes >= 60 ? Math.round(minutes / 60.0) + " hr" : minutes + " min") + ".");
        return saved;
    }

    // Visitor (self-service) or receptionist confirms the visitor has physically arrived
    @Transactional
    public QueueToken checkInToken(Long id) {
        QueueToken t = getOrThrow(id);
        t.setStatus(QueueToken.Status.waiting);
        t.setOrderKey(System.currentTimeMillis());
        t.setDelayUntil(null);
        t.setDelayNote(null);
        t.setCheckedInAt(System.currentTimeMillis());
        return tokenRepository.save(t);
    }

    // Flags delayed tokens whose requested time has passed as "missed" (potential no-show)
    @Transactional
    public List<QueueToken> flagOverdueDelays(Long deptId) {
        long now = System.currentTimeMillis();
        List<QueueToken> due = tokenRepository.findByDepartmentIdAndStatus(deptId, QueueToken.Status.delayed).stream()
                .filter(t -> t.getDelayUntil() != null && t.getDelayUntil() <= now)
                .toList();
        due.forEach(t -> {
            t.setStatus(QueueToken.Status.missed);
            t.setDelayNote("Requested time passed without checking in — check in as soon as you arrive.");
        });
        tokenRepository.saveAll(due);
        due.forEach(t -> notificationClient.notifyUser(t.getUserId(), "warning",
                "You missed your scheduled time",
                "Your requested time for token " + t.getCode() + " has passed. Check in as soon as you arrive and you'll still be seen."));
        return due;
    }

    // Staff calls the next waiting visitor in for service
    @Transactional
    public QueueToken callNext(Long id) {
        QueueToken t = getOrThrow(id);
        t.setStatus(QueueToken.Status.serving);
        t.setCalledAt(System.currentTimeMillis());
        QueueToken saved = tokenRepository.save(t);
        notificationClient.notifyUser(saved.getUserId(), "success",
                "It's your turn!",
                "Token " + saved.getCode() + " is now being served. Please head to the counter.");
        return saved;
    }

    @Transactional
    public QueueToken completeToken(Long id) {
        QueueToken t = getOrThrow(id);
        t.setStatus(QueueToken.Status.completed);
        t.setCompletedAt(System.currentTimeMillis());
        QueueToken saved = tokenRepository.save(t);
        notificationClient.notifyUser(saved.getUserId(), "info",
                "Visit complete",
                "Token " + saved.getCode() + " has been marked as completed. Thanks for visiting!");
        return saved;
    }

    @Transactional
    public QueueToken skipToken(Long id) {
        QueueToken t = getOrThrow(id);
        t.setStatus(QueueToken.Status.skipped);
        QueueToken saved = tokenRepository.save(t);
        notificationClient.notifyUser(saved.getUserId(), "warning",
                "You were skipped",
                "Token " + saved.getCode() + " was skipped since you weren't available when called. Speak to the desk to rejoin the queue.");
        return saved;
    }
}
