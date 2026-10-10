package com.quelorax.backend.service;

import com.quelorax.backend.entity.Document;
import com.quelorax.backend.exception.ApiException;
import com.quelorax.backend.repository.DocumentRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DocumentService {

    private final DocumentRepository repository;

    public DocumentService(DocumentRepository repository) {
        this.repository = repository;
    }

    public List<Document> getByUser(Long userId) {
        return repository.findByUserId(userId);
    }

    public Document create(Document doc) {
        doc.setUploadedAt(System.currentTimeMillis());
        if (doc.getStatus() == null) doc.setStatus("pending");
        return repository.save(doc);
    }

    public Document update(Long id, Document patch) {
        Document d = repository.findById(id)
                .orElseThrow(() -> new ApiException("Document not found", HttpStatus.NOT_FOUND));
        if (patch.getName() != null) d.setName(patch.getName());
        if (patch.getType() != null) d.setType(patch.getType());
        if (patch.getStatus() != null) d.setStatus(patch.getStatus());
        if (patch.getFileUrl() != null) d.setFileUrl(patch.getFileUrl());
        return repository.save(d);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }
}
