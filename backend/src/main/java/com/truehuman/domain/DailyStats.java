package com.truehuman.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Column;
import java.time.LocalDateTime;

@Entity
@Table(name = "daily_stats")
public class DailyStats {

    @Id
    @Column(name = "country_code", length = 2)
    private String countryCode;

    @Column(name = "submission_count", nullable = false)
    private Long submissionCount;

    @Column(name = "last_updated", nullable = false)
    private LocalDateTime lastUpdated;

    public DailyStats() {}

    public DailyStats(String countryCode, Long submissionCount, LocalDateTime lastUpdated) {
        this.countryCode = countryCode;
        this.submissionCount = submissionCount;
        this.lastUpdated = lastUpdated;
    }

    public String getCountryCode() { return countryCode; }
    public void setCountryCode(String countryCode) { this.countryCode = countryCode; }

    public Long getSubmissionCount() { return submissionCount; }
    public void setSubmissionCount(Long submissionCount) { this.submissionCount = submissionCount; }

    public LocalDateTime getLastUpdated() { return lastUpdated; }
    public void setLastUpdated(LocalDateTime lastUpdated) { this.lastUpdated = lastUpdated; }
}
