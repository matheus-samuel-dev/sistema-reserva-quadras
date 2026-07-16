package com.playspace.api.settings;

import com.playspace.api.court.Modality;
import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.Map;
import java.util.Set;

public record SettingsResponse(
        String company,
        String legalName,
        String document,
        String companyEmail,
        String companyPhone,
        String address,
        String timezone,
        LocalTime openingTime,
        LocalTime closingTime,
        String hours,
        Set<String> operatingDays,
        int cancelationRuleHours,
        int minimumReservationMinutes,
        int maximumAdvanceDays,
        int slotMinutes,
        Set<Modality> modalities,
        Map<String, BigDecimal> defaultPrices,
        boolean acceptPix,
        boolean acceptCard,
        boolean acceptCash,
        String pixKey,
        boolean emailNotifications,
        boolean browserNotifications,
        int reservationReminderHours,
        String primaryColor,
        String logoUrl,
        String defaultTheme,
        int minimumPasswordLength,
        int sessionMinutes,
        boolean requireStrongPassword,
        boolean publicRegistrationEnabled
) {
}
