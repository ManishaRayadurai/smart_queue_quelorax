package com.quelorax.backend.controller;

import com.quelorax.backend.dto.request.*;
import com.quelorax.backend.entity.QueueToken;
import com.quelorax.backend.service.QueueTokenService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tokens")
public class QueueTokenController {

    private final QueueTokenService service;

    public QueueTokenController(QueueTokenService service) {
        this.service = service;
    }

    @GetMapping
    public List<QueueToken> getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    public QueueToken getOne(@PathVariable Long id) {
        return service.getOrThrow(id);
    }

    @GetMapping("/department/{deptId}")
    public List<QueueToken> getByDepartment(@PathVariable Long deptId) {
        return service.getByDepartment(deptId);
    }

    @GetMapping("/user/{userId}")
    public List<QueueToken> getByUser(@PathVariable Long userId) {
        return service.getByUser(userId);
    }

    @GetMapping("/department/{deptId}/waiting")
    public List<QueueToken> waiting(@PathVariable Long deptId) {
        return service.getWaitingQueue(deptId);
    }

    @GetMapping("/department/{deptId}/delayed")
    public List<QueueToken> delayed(@PathVariable Long deptId) {
        return service.getDelayedQueue(deptId);
    }

    @GetMapping("/department/{deptId}/missed")
    public List<QueueToken> missed(@PathVariable Long deptId) {
        return service.getMissedQueue(deptId);
    }

    @GetMapping("/active")
    public List<QueueToken> activeForUserInDept(@RequestParam Long userId, @RequestParam Long departmentId) {
        return service.getActiveTokensForDeptByUser(userId, departmentId);
    }

    @PostMapping
    public QueueToken create(@RequestBody TokenCreateRequest req) {
        return service.createToken(req);
    }

    @PutMapping("/{id}")
    public QueueToken update(@PathVariable Long id, @RequestBody Map<String, Object> patch) {
        return service.updateToken(id, patch);
    }

    @PostMapping("/{id}/cancel")
    public QueueToken cancel(@PathVariable Long id) {
        return service.cancelToken(id);
    }

    @PostMapping("/{id}/checkin")
    public QueueToken checkIn(@PathVariable Long id) {
        return service.checkInToken(id);
    }

    @PostMapping("/{id}/delay")
    public QueueToken delay(@PathVariable Long id, @RequestBody DelayRequest req) {
        return service.delayToken(id, req.getMinutes());
    }

    @PostMapping("/{id}/priority")
    public QueueToken setPriority(@PathVariable Long id, @RequestBody PriorityRequest req) {
        return service.setPriority(id, req.getPriority());
    }

    @PostMapping("/{id}/reorder")
    public void reorder(@PathVariable Long id, @RequestBody ReorderRequest req) {
        service.reorderToken(id, req.getDirection());
    }

    @PostMapping("/department/{deptId}/flag-overdue")
    public List<QueueToken> flagOverdue(@PathVariable Long deptId) {
        return service.flagOverdueDelays(deptId);
    }

    @PostMapping("/{id}/call")
    public QueueToken call(@PathVariable Long id) {
        return service.callNext(id);
    }

    @PostMapping("/{id}/complete")
    public QueueToken complete(@PathVariable Long id) {
        return service.completeToken(id);
    }

    @PostMapping("/{id}/skip")
    public QueueToken skip(@PathVariable Long id) {
        return service.skipToken(id);
    }
}
