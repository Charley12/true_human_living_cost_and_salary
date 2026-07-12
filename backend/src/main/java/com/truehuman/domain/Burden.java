package com.truehuman.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Column;
import java.util.UUID;
import java.time.LocalDateTime;

@Entity
@Table(name = "burdens")
public class Burden {

    @Id
    private UUID id;

    @Column(nullable = false, length = 50)
    private String type; // 'wage', 'rent', 'prices'

    @Column(nullable = false)
    private String amount;

    @Column(name = "location_raw", nullable = false)
    private String locationRaw;

    @Column(name = "country_code", nullable = false, length = 2)
    private String countryCode;

    @Column(name = "image_gcs_url", length = 500)
    private String imageGcsUrl;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    // Default constructor for JPA
    public Burden() {}

    public Burden(UUID id, String type, String amount, String locationRaw, String countryCode, String imageGcsUrl, LocalDateTime createdAt) {
        this.id = id;
        this.type = type;
        this.amount = amount;
        this.locationRaw = locationRaw;
        this.countryCode = countryCode;
        this.imageGcsUrl = imageGcsUrl;
        this.createdAt = createdAt;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getAmount() { return amount; }
    public void setAmount(String amount) { this.amount = amount; }

    public String getLocationRaw() { return locationRaw; }
    public void setLocationRaw(String locationRaw) { this.locationRaw = locationRaw; }

    public String getCountryCode() { return countryCode; }
    public void setCountryCode(String countryCode) { this.countryCode = countryCode; }

    public String getImageGcsUrl() { return imageGcsUrl; }
    public void setImageGcsUrl(String imageGcsUrl) { this.imageGcsUrl = imageGcsUrl; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
