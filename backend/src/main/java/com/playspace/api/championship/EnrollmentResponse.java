package com.playspace.api.championship;

import java.time.OffsetDateTime;

public record EnrollmentResponse(
        Long id,
        Long championshipId,
        String championshipName,
        Long playerId,
        String playerName,
        String playerAvatarUrl,
        EnrollmentStatus status,
        OffsetDateTime enrolledAt,
        OffsetDateTime cancelledAt
) {}
