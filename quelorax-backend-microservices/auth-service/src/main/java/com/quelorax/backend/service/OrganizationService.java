package com.quelorax.backend.service;

import com.quelorax.backend.entity.Organization;
import com.quelorax.backend.repository.OrganizationRepository;
import org.springframework.stereotype.Service;

@Service
public class OrganizationService {

    private final OrganizationRepository repository;

    public OrganizationService(OrganizationRepository repository) {
        this.repository = repository;
    }

    public Organization get() {
        return repository.findAll().stream().findFirst().orElse(null);
    }

    public Organization update(Organization patch) {
        Organization org = get();
        if (org == null) {
            patch.setCreatedAt(System.currentTimeMillis());
            return repository.save(patch);
        }
        if (patch.getName() != null) org.setName(patch.getName());
        if (patch.getTagline() != null) org.setTagline(patch.getTagline());
        return repository.save(org);
    }
}
