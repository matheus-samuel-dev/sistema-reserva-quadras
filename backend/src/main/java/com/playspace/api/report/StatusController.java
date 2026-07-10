package com.playspace.api.report;

import java.time.OffsetDateTime;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/status")
public class StatusController {
    @GetMapping
    Map<String, Object> status() {
        return Map.of(
                "api", "UP",
                "database", "UP",
                "scheduler", "DEMO",
                "realtime", "SIMULATED",
                "checkedAt", OffsetDateTime.now().toString()
        );
    }
}
