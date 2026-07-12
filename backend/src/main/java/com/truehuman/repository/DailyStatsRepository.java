package com.truehuman.repository;

import com.truehuman.domain.DailyStats;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DailyStatsRepository extends JpaRepository<DailyStats, String> {

    @Query(value = "SELECT * FROM daily_stats ORDER BY submission_count DESC LIMIT 10", nativeQuery = true)
    List<DailyStats> findTop10Countries();

    @Modifying
    @Query("UPDATE DailyStats d SET d.submissionCount = d.submissionCount + 1, d.lastUpdated = CURRENT_TIMESTAMP WHERE d.countryCode = :countryCode")
    int incrementSubmissionCount(@Param("countryCode") String countryCode);
}
