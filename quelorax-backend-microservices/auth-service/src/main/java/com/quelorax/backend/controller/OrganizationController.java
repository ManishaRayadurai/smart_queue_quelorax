package com.quelorax.backend.controller;

import com.quelorax.backend.entity.Organization;
import com.quelorax.backend.service.OrganizationService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/org")
public class OrganizationController {

    private final OrganizationService service;

    public OrganizationController(OrganizationService service) {
        this.service = service;
    }

    @GetMapping
    public Organization get() {
        return service.get();
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Organization update(@RequestBody Organization patch) {
        return service.update(patch);
    }
}
