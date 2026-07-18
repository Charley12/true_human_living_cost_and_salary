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

        // Calculate a naive True Burden Score based on amount strings.
        Double score = calculateNaiveScore(burden.getAmount(), burden.getType(), burden.getCountryCode());
        burden.setCalculatedScore(score);

        Burden savedBurden = burdenRepository.save(burden);

        // Update daily stats aggregation atomically
        String countryCode = savedBurden.getCountryCode();
        int updated = dailyStatsRepository.incrementSubmissionCountAndScore(countryCode, score);
        if (updated == 0) {
            // It doesn't exist yet, insert a new record
            DailyStats newStats = new DailyStats(countryCode, 1L, LocalDateTime.now(), score);
            dailyStatsRepository.save(newStats);
        }

        return new ResponseEntity<>(savedBurden, HttpStatus.CREATED);
    }

    private Double calculateNaiveScore(String amountString, String type, String countryCode) {
        // Extract first numeric sequence found
        String numStr = amountString.replaceAll("[^\\d.]", "");
        double rawAmount = 0.0;
        try {
            if (!numStr.isEmpty()) {
                rawAmount = Double.parseDouble(numStr);
            }
        } catch (NumberFormatException e) {
            rawAmount = 0.0;
        }

        // Apply a mock PPP modifier (Purchasing Power Parity) based on country code
        double pppModifier = 1.0;
        if ("US".equalsIgnoreCase(countryCode) || "UK".equalsIgnoreCase(countryCode)) {
            pppModifier = 0.8;
        } else if ("IN".equalsIgnoreCase(countryCode) || "BR".equalsIgnoreCase(countryCode)) {
            pppModifier = 1.5;
        }

        // Calculate score (higher is worse)
        // For wage, lower is worse: score = 1000 / wage * ppp
        // For rent/prices, higher is worse: score = amount * ppp
        double finalScore = 0.0;
        if ("wage".equalsIgnoreCase(type)) {
            finalScore = rawAmount > 0 ? (1000.0 / rawAmount) * pppModifier : 100.0;
        } else {
            finalScore = rawAmount * pppModifier;
        }

        return Math.round(finalScore * 100.0) / 100.0;
    }
}
