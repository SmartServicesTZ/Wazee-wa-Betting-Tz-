-- Register the selected sports-data provider without enabling it.
-- API credentials and coverage verification remain an owner setup step.
INSERT OR IGNORE INTO sports_providers (
  id, provider_key, display_name, enabled, status
) VALUES (
  'sports-provider-api-football',
  'api-football',
  'API-Football (API-Sports)',
  0,
  'unconfigured'
);
