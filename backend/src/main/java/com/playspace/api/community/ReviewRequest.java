package com.playspace.api.community;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ReviewRequest(
        @NotNull Long reservationId,
        @Min(1) @Max(5) int cleaning,
        @Min(1) @Max(5) int lighting,
        @Min(1) @Max(5) int organization,
        @Min(1) @Max(5) int service,
        @Min(1) @Max(5) int courtQuality,
        @NotBlank @Size(max = 1200) String comment
) {
}
