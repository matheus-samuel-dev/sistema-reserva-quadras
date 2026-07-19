package com.playspace.api.community;

import java.time.OffsetDateTime;

public record PartnerAdResponse(
        Long id,
        Long playerId,
        String playerName,
        String avatarUrl,
        String modality,
        String level,
        String city,
        String availability,
        String notes,
        OffsetDateTime createdAt
) {
    static PartnerAdResponse from(PartnerAd ad) {
        return new PartnerAdResponse(
                ad.getId(),
                ad.getPlayer().getId(),
                ad.getPlayer().getName(),
                ad.getPlayer().getAvatarUrl(),
                ad.getModality(),
                ad.getLevel(),
                ad.getCity(),
                ad.getAvailability(),
                ad.getNotes(),
                ad.getCreatedAt()
        );
    }
}
