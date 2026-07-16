package com.playspace.api.partner;

import com.playspace.api.court.Modality;
import java.time.DayOfWeek;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Set;

public record SportsProfileResponse(
        Long id,
        Long userId,
        String name,
        String avatarUrl,
        String city,
        Set<String> regions,
        Modality primaryModality,
        List<ModalityLevelResponse> modalities,
        List<AvailabilityResponse> availabilities,
        PartnerObjective objective,
        String presentation,
        String position,
        boolean discoverable,
        Long currentInterestId,
        PartnerInterestStatus currentInterestStatus,
        InterestDirection currentInterestDirection,
        OffsetDateTime updatedAt
) {
    public record ModalityLevelResponse(Modality modality, SportsLevel level, boolean primary) {}
    public record AvailabilityResponse(DayOfWeek dayOfWeek, LocalTime startTime, LocalTime endTime) {}
}
