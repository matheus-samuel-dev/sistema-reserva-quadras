package com.playspace.api.modality;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record SportModalityResponse(
        Long id,
        String code,
        String name,
        boolean active,
        BigDecimal defaultPrice,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    static SportModalityResponse from(SportModality modality) {
        return new SportModalityResponse(
                modality.getId(),
                modality.getCode(),
                modality.getName(),
                modality.isActive(),
                modality.getDefaultPrice(),
                modality.getCreatedAt(),
                modality.getUpdatedAt()
        );
    }
}
