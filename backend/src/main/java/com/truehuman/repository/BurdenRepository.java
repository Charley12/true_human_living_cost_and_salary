package com.truehuman.repository;

import com.truehuman.domain.Burden;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface BurdenRepository extends JpaRepository<Burden, UUID> {
}
