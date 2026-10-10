package com.quelorax.backend.controller;

import com.quelorax.backend.entity.Department;
import com.quelorax.backend.service.DepartmentService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/departments")
public class DepartmentController {

    private final DepartmentService service;

    public DepartmentController(DepartmentService service) {
        this.service = service;
    }

    @GetMapping
    public List<Department> getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    public Department getOne(@PathVariable Long id) {
        return service.getOrThrow(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Department create(@RequestBody Department dept) {
        return service.create(dept);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Department update(@PathVariable Long id, @RequestBody Department dept) {
        return service.update(id, dept);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
