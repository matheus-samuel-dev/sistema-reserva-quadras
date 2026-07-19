package com.playspace.api.settings;

import com.playspace.api.common.AuditService;
import com.playspace.api.common.BusinessException;
import com.playspace.api.modality.SportModalityService;
import com.playspace.api.security.CurrentUserService;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SettingsService {
    private final PlatformSettingsRepository settings;
    private final CurrentUserService currentUser;
    private final AuditService audit;
    private final SportModalityService modalities;

    public SettingsService(PlatformSettingsRepository settings, CurrentUserService currentUser, AuditService audit,
                           SportModalityService modalities) {
        this.settings = settings;
        this.currentUser = currentUser;
        this.audit = audit;
        this.modalities = modalities;
    }

    @Transactional(readOnly = true)
    public SettingsResponse get() {
        return response(required());
    }

    @Transactional
    public SettingsResponse update(SettingsRequest request) {
        validate(request);
        var entity = required();
        entity.setCompanyName(request.company().trim());
        entity.setLegalName(normalize(request.legalName()));
        entity.setDocument(normalize(request.document()));
        entity.setCompanyEmail(normalize(request.companyEmail()));
        entity.setCompanyPhone(normalize(request.companyPhone()));
        entity.setAddress(normalize(request.address()));
        entity.setTimezone(request.timezone().trim());
        entity.setOpeningTime(request.openingTime());
        entity.setClosingTime(request.closingTime());
        entity.setOperatingDays(request.operatingDays().stream().sorted().collect(Collectors.joining(",")));
        entity.setCancellationRuleHours(request.cancelationRuleHours());
        entity.setMinimumReservationMinutes(request.minimumReservationMinutes());
        entity.setMaximumAdvanceDays(request.maximumAdvanceDays());
        entity.setSlotMinutes(request.slotMinutes());
        modalities.updateConfiguration(request.modalities(), request.defaultPrices());
        entity.setAcceptPix(request.acceptPix());
        entity.setAcceptCard(request.acceptCard());
        entity.setAcceptCash(request.acceptCash());
        entity.setPixKey(normalize(request.pixKey()));
        entity.setEmailNotifications(request.emailNotifications());
        entity.setBrowserNotifications(request.browserNotifications());
        entity.setReservationReminderHours(request.reservationReminderHours());
        entity.setPrimaryColor(request.primaryColor().toUpperCase(Locale.ROOT));
        entity.setLogoUrl(normalize(request.logoUrl()));
        entity.setDefaultTheme(request.defaultTheme());
        entity.setMinimumPasswordLength(request.minimumPasswordLength());
        entity.setSessionMinutes(request.sessionMinutes());
        entity.setRequireStrongPassword(request.requireStrongPassword());
        entity.setPublicRegistrationEnabled(request.publicRegistrationEnabled());
        var saved = settings.save(entity);
        audit.record(currentUser.user(), "Atualizou as configurações da plataforma", "CONFIGURAÇÃO");
        return response(saved);
    }

    private void validate(SettingsRequest request) {
        if (!request.openingTime().isBefore(request.closingTime())) {
            throw new BusinessException("O horário de abertura deve ser anterior ao horário de fechamento.");
        }
        if (!request.acceptPix() && !request.acceptCard() && !request.acceptCash()) {
            throw new BusinessException("Mantenha ao menos uma forma de pagamento ativa.");
        }
        if (request.acceptPix() && (request.pixKey() == null || request.pixKey().isBlank())) {
            throw new BusinessException("Informe a chave PIX quando o PIX estiver ativo.");
        }
    }

    private PlatformSettings required() {
        return settings.findFirstByOrderByIdAsc().orElseThrow(() -> new IllegalStateException("Configuracoes iniciais ausentes."));
    }

    private SettingsResponse response(PlatformSettings entity) {
        var activeModalities = modalities.activeCodes();
        var prices = modalities.pricesByCode();
        var days = Arrays.stream(entity.getOperatingDays().split(","))
                .filter(value -> !value.isBlank()).collect(Collectors.toCollection(LinkedHashSet::new));
        return new SettingsResponse(
                entity.getCompanyName(), entity.getLegalName(), entity.getDocument(), entity.getCompanyEmail(),
                entity.getCompanyPhone(), entity.getAddress(), entity.getTimezone(), entity.getOpeningTime(),
                entity.getClosingTime(), display(entity.getOpeningTime()) + " - " + display(entity.getClosingTime()), days,
                entity.getCancellationRuleHours(), entity.getMinimumReservationMinutes(), entity.getMaximumAdvanceDays(),
                entity.getSlotMinutes(), activeModalities, prices, entity.isAcceptPix(), entity.isAcceptCard(), entity.isAcceptCash(),
                entity.getPixKey(), entity.isEmailNotifications(), entity.isBrowserNotifications(),
                entity.getReservationReminderHours(), entity.getPrimaryColor(), entity.getLogoUrl(), entity.getDefaultTheme(),
                entity.getMinimumPasswordLength(), entity.getSessionMinutes(), entity.isRequireStrongPassword(),
                entity.isPublicRegistrationEnabled()
        );
    }

    private String display(LocalTime time) { return String.format("%02d:%02d", time.getHour(), time.getMinute()); }
    private String normalize(String value) { return value == null || value.isBlank() ? null : value.trim(); }
}
