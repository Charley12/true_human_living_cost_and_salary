package com.truehuman.controller;

import com.truehuman.domain.Burden;
import com.truehuman.domain.DailyStats;
import com.truehuman.repository.BurdenRepository;
import com.truehuman.repository.DailyStatsRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/burdens")
public class BurdenController {

    private final BurdenRepository burdenRepository;
    private final DailyStatsRepository dailyStatsRepository;

    public BurdenController(BurdenRepository burdenRepository, DailyStatsRepository dailyStatsRepository) {
        this.burdenRepository = burdenRepository;
        this.dailyStatsRepository = dailyStatsRepository;
    }

    @PostMapping
    @Transactional
    public ResponseEntity<Burden> createBurden(@RequestBody Burden burden) {
        burden.setId(UUID.randomUUID());
        burden.setCreatedAt(LocalDateTime.now());
        Burden savedBurden = burdenRepository.save(burden);

        // Update daily stats aggregation atomically
        String countryCode = savedBurden.getCountryCode();
        int updated = dailyStatsRepository.incrementSubmissionCount(countryCode);
        if (updated == 0) {
            // It doesn't exist yet, insert a new record
            DailyStats newStats = new DailyStats(countryCode, 1L, LocalDateTime.now());
            dailyStatsRepository.save(newStats);
        }

        return new ResponseEntity<>(savedBurden, HttpStatus.CREATED);
    }
}
