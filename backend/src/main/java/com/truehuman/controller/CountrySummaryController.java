package com.truehuman.controller;

import com.truehuman.domain.DailyStats;
import com.truehuman.repository.DailyStatsRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/countrySummary")
public class CountrySummaryController {

    private final DailyStatsRepository dailyStatsRepository;

    public CountrySummaryController(DailyStatsRepository dailyStatsRepository) {
        this.dailyStatsRepository = dailyStatsRepository;
    }

    @GetMapping
    public ResponseEntity<List<DailyStats>> getCountrySummary() {
        List<DailyStats> summary = dailyStatsRepository.findAll();
        return ResponseEntity.ok(summary);
    }
}
