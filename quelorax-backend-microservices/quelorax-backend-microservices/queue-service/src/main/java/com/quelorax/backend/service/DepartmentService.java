package com.quelorax.backend.service;

import com.quelorax.backend.entity.Department;
import com.quelorax.backend.exception.ApiException;
import com.quelorax.backend.repository.DepartmentRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DepartmentService {

    private final DepartmentRepository repository;

    public DepartmentService(DepartmentRepository repository) {
        this.repository = repository;
    }

    public List<Department> getAll() {
        return repository.findAll();
    }

    public Department getOrThrow(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ApiException("Department not found", HttpStatus.NOT_FOUND));
    }

    public Department create(Department dept) {
        return repository.save(dept);
    }

    public Department update(Long id, Department patch) {
        Department d = getOrThrow(id);
        if (patch.getName() != null) d.setName(patch.getName());
        if (patch.getCode() != null) d.setCode(patch.getCode());
        d.setAvgServiceTime(patch.getAvgServiceTime());
        d.setCounter(patch.getCounter());
        d.setActive(patch.isActive());
        return repository.save(d);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }
}
