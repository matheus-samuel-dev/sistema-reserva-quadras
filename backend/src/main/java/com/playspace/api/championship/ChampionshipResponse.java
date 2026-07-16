package com.playspace.api.championship;

import com.playspace.api.court.Modality;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public record ChampionshipResponse(
        Long id,
        String name,
        String description,
        Modality modality,
        Long courtId,
        String courtName,
        String location,
        String city,
        LocalDate startDate,
        LocalDate endDate,
        LocalDate registrationDeadline,
        int maxParticipants,
        long enrolledParticipants,
        int availableSpots,
        String format,
        String prize,
        BigDecimal registrationFee,
        String regulation,
        ChampionshipStatus status,
        String imageUrl,
        String bracket,
        boolean currentUserEnrolled,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {}
