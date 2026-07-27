-- High Wind Warning/Watch gets its own category instead of being folded
-- into severe_thunderstorm - wind damage to barns/power/ventilation is a
-- distinct production risk worth its own label.
ALTER TABLE weather_risk_alerts DROP CONSTRAINT weather_risk_alerts_category_check;
ALTER TABLE weather_risk_alerts ADD CONSTRAINT weather_risk_alerts_category_check CHECK (category IN (
    'extreme_heat', 'extreme_cold', 'winter_storm', 'flooding',
    'hurricane', 'severe_thunderstorm', 'high_wind', 'tornado'
));
