package com.quelorax.backend.service;

import com.quelorax.backend.entity.Settings;
import com.quelorax.backend.repository.SettingsRepository;
import org.springframework.stereotype.Service;

@Service
public class SettingsService {

    private final SettingsRepository repository;

    public SettingsService(SettingsRepository repository) {
        this.repository = repository;
    }

    public Settings get() {
        return repository.findAll().stream().findFirst()
                .orElseGet(() -> repository.save(Settings.builder().theme("light").language("en").build()));
    }

    public Settings update(Settings patch) {
        Settings s = get();
        if (patch.getTheme() != null) s.setTheme(patch.getTheme());
        if (patch.getLanguage() != null) s.setLanguage(patch.getLanguage());
        return repository.save(s);
    }
}
