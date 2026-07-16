package com.playspace.api.user;

import com.playspace.api.court.Modality;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.Set;

public record PreferenceRequest(
        @NotBlank @Pattern(regexp = "LIGHT|DARK|SYSTEM") String theme,
        boolean notificationsEnabled,
        @Min(0) @Max(168) int reservationReminderHours,
        boolean emailNotifications,
        boolean browserNotifications,
        @Size(max = 120) String defaultCity,
        @Size(max = 6) Set<Modality> favoriteModalities,
        @Size(max = 1000) String preferredTimes,
        boolean privateProfile,
        boolean discoverableByPartners,
        @NotBlank @Pattern(regexp = "pt-BR|en-US|es-ES") String language
) {
}
