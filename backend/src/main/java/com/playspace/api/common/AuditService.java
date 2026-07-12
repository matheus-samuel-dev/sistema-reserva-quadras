package com.playspace.api.common;

import com.playspace.api.user.AppUser;
import java.util.Locale;
import org.springframework.stereotype.Service;

@Service
public class AuditService {
    private static final int COLUMN_LIMIT = 255;
    private static final String SYSTEM_ACTOR = "SISTEMA";
    private static final String UNKNOWN_ACTION = "Acao nao informada";
    private static final String GENERAL_CATEGORY = "GERAL";

    private final ActivityLogRepository activities;

    public AuditService(ActivityLogRepository activities) {
        this.activities = activities;
    }

    public ActivityLog record(AppUser actor, String action, String category) {
        return record(actor.getEmail(), action, category);
    }

    public ActivityLog record(String actor, String action, String category) {
        var log = new ActivityLog();
        log.setActor(normalize(actor, SYSTEM_ACTOR, false));
        log.setAction(normalize(action, UNKNOWN_ACTION, false));
        log.setCategory(normalize(category, GENERAL_CATEGORY, true));
        return activities.save(log);
    }

    private String normalize(String value, String fallback, boolean uppercase) {
        var normalized = value == null ? "" : value.strip().replaceAll("\\s+", " ");
        if (normalized.isBlank()) {
            normalized = fallback;
        }
        if (uppercase) {
            normalized = normalized.toUpperCase(Locale.ROOT);
        }
        return truncate(normalized);
    }

    private String truncate(String value) {
        var codePoints = value.codePointCount(0, value.length());
        if (codePoints <= COLUMN_LIMIT) {
            return value;
        }
        var end = value.offsetByCodePoints(0, COLUMN_LIMIT - 1);
        return value.substring(0, end) + "…";
    }
}
