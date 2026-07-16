package com.playspace.api.settings;

import com.playspace.api.court.Modality;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.Map;
import java.util.Set;

public record SettingsRequest(
        @NotBlank @Size(max = 160) String company,
        @Size(max = 160) String legalName,
        @Size(max = 30) String document,
        @Email @Size(max = 254) String companyEmail,
        @Size(max = 30) String companyPhone,
        @Size(max = 255) String address,
        @NotBlank @Size(max = 60) String timezone,
        @NotNull LocalTime openingTime,
        @NotNull LocalTime closingTime,
        @NotEmpty @Size(max = 7) Set<@Pattern(regexp = "MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY") String> operatingDays,
        @Min(0) @Max(168) int cancelationRuleHours,
        @Min(30) @Max(480) int minimumReservationMinutes,
        @Min(1) @Max(730) int maximumAdvanceDays,
        @Min(15) @Max(240) int slotMinutes,
        @NotEmpty Set<Modality> modalities,
        @NotEmpty Map<String, @NotNull @PositiveOrZero BigDecimal> defaultPrices,
        boolean acceptPix,
        boolean acceptCard,
        boolean acceptCash,
        @Size(max = 254) String pixKey,
        boolean emailNotifications,
        boolean browserNotifications,
        @Min(0) @Max(168) int reservationReminderHours,
        @NotBlank @Pattern(regexp = "#[0-9A-Fa-f]{6}") String primaryColor,
        @Size(max = 255) String logoUrl,
        @NotBlank @Pattern(regexp = "LIGHT|DARK|SYSTEM") String defaultTheme,
        @Min(8) @Max(72) int minimumPasswordLength,
        @Min(15) @Max(10080) int sessionMinutes,
        boolean requireStrongPassword,
        boolean publicRegistrationEnabled
) {
}
