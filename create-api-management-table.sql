-- API Keys management table for admin control
CREATE TABLE IF NOT EXISTS api_keys (
  id SERIAL PRIMARY KEY,
  service_name VARCHAR(50) NOT NULL UNIQUE,
  api_key VARCHAR(255) NOT NULL,
  api_url VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  daily_limit INTEGER DEFAULT NULL,
  current_usage INTEGER DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id),
  notes TEXT
);

-- Insert initial API keys for ScrapingDog and RapidAPI
INSERT INTO api_keys (service_name, api_key, api_url, daily_limit, notes, created_by) VALUES
('scrapingdog_linkedin', '6882894b855f5678d36484c8', 'https://api.scrapingdog.com/linkedin', 1000, 'LinkedIn profile scraping via ScrapingDog', 1),
('rapidapi_linkedin', 'your_rapidapi_key_here', 'https://linkedin-api.rapidapi.com', 500, 'LinkedIn API via RapidAPI', 1)
ON CONFLICT (service_name) DO UPDATE SET
  api_key = EXCLUDED.api_key,
  api_url = EXCLUDED.api_url,
  updated_at = CURRENT_TIMESTAMP;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_api_keys_service_active ON api_keys(service_name, is_active);
