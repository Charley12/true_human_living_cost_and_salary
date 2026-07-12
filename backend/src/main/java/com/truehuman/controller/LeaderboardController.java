package com.truehuman.controller;

import com.truehuman.domain.DailyStats;
import com.truehuman.repository.DailyStatsRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/leaderboard")
public class LeaderboardController {

    private final DailyStatsRepository dailyStatsRepository;

    public LeaderboardController(DailyStatsRepository dailyStatsRepository) {
        this.dailyStatsRepository = dailyStatsRepository;
    }

    @GetMapping
    public ResponseEntity<List<DailyStats>> getLeaderboard() {
        List<DailyStats> top10 = dailyStatsRepository.findTop10Countries();
        return ResponseEntity.ok(top10);
    }
}
