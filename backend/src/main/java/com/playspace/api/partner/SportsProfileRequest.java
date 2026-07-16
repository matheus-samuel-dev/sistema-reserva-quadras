package com.playspace.api.partner;

import com.playspace.api.court.Modality;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;
import java.util.Set;

public record SportsProfileRequest(
        @NotBlank @Size(max = 120) String city,
        @Size(max = 10) Set<@NotBlank @Size(max = 120) String> regions,
        @NotNull Modality primaryModality,
        @NotEmpty @Size(max = 6) List<@Valid ModalityLevelRequest> modalities,
        @Size(max = 21) List<@Valid AvailabilityRequest> availabilities,
        @NotNull PartnerObjective objective,
        @NotBlank @Size(max = 1200) String presentation,
        @Size(max = 120) String position,
        boolean discoverable,
        @Size(max = 500) String avatarUrl
) {
    public record ModalityLevelRequest(@NotNull Modality modality, @NotNull SportsLevel level) {}

    public record AvailabilityRequest(
            @NotNull DayOfWeek dayOfWeek,
            @NotNull LocalTime startTime,
            @NotNull LocalTime endTime
    ) {}
}
