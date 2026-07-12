package com.playspace.api.community;

import java.time.LocalDate;
import java.time.OffsetDateTime;

public record AchievementResponse(
        Long id,
        String icon,
        String title,
        String description,
        int progress,
        int targetValue,
        double percentComplete,
        LocalDate unlockedAt,
        OffsetDateTime createdAt
) {
    static AchievementResponse from(Achievement achievement) {
        return new AchievementResponse(
                achievement.getId(),
                achievement.getIcon(),
                achievement.getTitle(),
                achievement.getDescription(),
                achievement.getProgress(),
                achievement.getTargetValue(),
                achievement.getPercentComplete(),
                achievement.getUnlockedAt(),
                achievement.getCreatedAt()
        );
    }
}
