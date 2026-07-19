package com.playspace.api.championship;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

public record ChampionshipRequest(
        @NotBlank @Size(max = 255) String name,
        @NotBlank @Size(max = 1600) String description,
        @NotBlank @Size(max = 40) String modality,
        @NotNull Long courtId,
        @NotBlank @Size(max = 255) String location,
        @NotBlank @Size(max = 120) String city,
        @NotNull LocalDate startDate,
        @NotNull LocalDate endDate,
        @NotNull LocalDate registrationDeadline,
        @Min(2) int maxParticipants,
        @NotBlank @Size(max = 120) String format,
        @NotBlank @Size(max = 255) String prize,
        @NotNull @DecimalMin("0.00") BigDecimal registrationFee,
        @NotBlank @Size(max = 6000) String regulation,
        @Size(max = 500) String imageUrl,
        @Size(max = 6000) String bracket,
        ChampionshipStatus initialStatus
) {}
