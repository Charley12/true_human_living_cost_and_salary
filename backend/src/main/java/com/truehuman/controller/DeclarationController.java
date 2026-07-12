package com.truehuman.controller;

import com.truehuman.domain.Declaration;
import com.truehuman.repository.DeclarationRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/declarations")
public class DeclarationController {

    private final DeclarationRepository declarationRepository;

    public DeclarationController(DeclarationRepository declarationRepository) {
        this.declarationRepository = declarationRepository;
    }

    @PostMapping
    public ResponseEntity<Declaration> createDeclaration(@RequestBody Declaration declaration) {
        declaration.setId(UUID.randomUUID());
        declaration.setCreatedAt(LocalDateTime.now());
        Declaration savedDeclaration = declarationRepository.save(declaration);
        return new ResponseEntity<>(savedDeclaration, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<Declaration>> getDeclarations() {
        Page<Declaration> page = declarationRepository.findAll(
                PageRequest.of(0, 50, Sort.by(Sort.Direction.DESC, "createdAt"))
        );
        return ResponseEntity.ok(page.getContent());
    }
}
