package com.quelorax.backend.controller;

import com.quelorax.backend.entity.Settings;
import com.quelorax.backend.service.SettingsService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settings")
public class SettingsController {

    private final SettingsService service;

    public SettingsController(SettingsService service) {
        this.service = service;
    }

    @GetMapping
    public Settings get() {
        return service.get();
    }

    @PutMapping
    public Settings update(@RequestBody Settings patch) {
        return service.update(patch);
    }
}
