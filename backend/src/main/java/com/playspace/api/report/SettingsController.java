package com.playspace.api.report;

import java.util.List;
import java.util.Map;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/settings")
@PreAuthorize("hasRole('ADMIN')")
public class SettingsController {
    @GetMapping
    Map<String, Object> settings() {
        return Map.of(
                "company", "PlaySpace Club",
                "hours", "08:00 - 22:00",
                "cancelationRuleHours", 2,
                "minimumReservationMinutes", 60,
                "modalities", List.of("Beach Tennis", "Futevolei", "Society", "Tenis", "Volei", "Basquete"),
                "defaultPrices", Map.of("Beach Tennis", 120, "Society", 180, "Tenis", 110, "Basquete", 95)
        );
    }
}
