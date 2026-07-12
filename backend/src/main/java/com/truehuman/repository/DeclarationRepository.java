package com.truehuman.repository;

import com.truehuman.domain.Declaration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface DeclarationRepository extends JpaRepository<Declaration, UUID> {
}
