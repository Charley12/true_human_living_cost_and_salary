CREATE TABLE burdens (
    id UUID PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    amount VARCHAR(255) NOT NULL,
    location_raw VARCHAR(255) NOT NULL,
    country_code VARCHAR(2) NOT NULL,
    image_gcs_url VARCHAR(500),
    created_at TIMESTAMP NOT NULL
);

CREATE TABLE declarations (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    country VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL
);

CREATE TABLE daily_stats (
    country_code VARCHAR(2) PRIMARY KEY,
    submission_count BIGINT NOT NULL,
    last_updated TIMESTAMP NOT NULL
);
