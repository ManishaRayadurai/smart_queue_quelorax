package com.quelorax.backend.controller;

import com.quelorax.backend.entity.Document;
import com.quelorax.backend.service.DocumentService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    private final DocumentService service;

    public DocumentController(DocumentService service) {
        this.service = service;
    }

    @GetMapping("/user/{userId}")
    public List<Document> getByUser(@PathVariable Long userId) {
        return service.getByUser(userId);
    }

    @PostMapping
    public Document create(@RequestBody Document doc) {
        return service.create(doc);
    }

    @PutMapping("/{id}")
    public Document update(@PathVariable Long id, @RequestBody Document doc) {
        return service.update(id, doc);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
