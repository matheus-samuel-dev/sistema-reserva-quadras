package com.playspace.api.settings;

import com.playspace.api.common.AuditService;
import com.playspace.api.common.BusinessException;
import com.playspace.api.court.Modality;
import com.playspace.api.security.CurrentUserService;
import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SettingsService {
    private final PlatformSettingsRepository settings;
    private final CurrentUserService currentUser;
    private final AuditService audit;

    public SettingsService(PlatformSettingsRepository settings, CurrentUserService currentUser, AuditService audit) {
        this.settings = settings;
        this.currentUser = currentUser;
        this.audit = audit;
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
        entity.setEnabledModalities(request.modalities().stream().map(Enum::name).sorted().collect(Collectors.joining(",")));
        var prices = normalizePrices(request.defaultPrices());
        entity.setBeachTennisPrice(prices.get(Modality.BEACH_TENNIS));
        entity.setFutevoleiPrice(prices.get(Modality.FUTEVOLEI));
        entity.setSocietyPrice(prices.get(Modality.SOCIETY));
        entity.setTenisPrice(prices.get(Modality.TENIS));
        entity.setVoleiPrice(prices.get(Modality.VOLEI));
        entity.setBasquetePrice(prices.get(Modality.BASQUETE));
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
        var prices = normalizePrices(request.defaultPrices());
        for (var modality : request.modalities()) {
            if (prices.get(modality) == null) {
                throw new BusinessException("Informe o preco padrao de todas as modalidades ativas.");
            }
        }
    }

    private EnumMap<Modality, BigDecimal> normalizePrices(Map<String, BigDecimal> source) {
        var result = new EnumMap<Modality, BigDecimal>(Modality.class);
        source.forEach((key, value) -> result.put(parseModality(key), value));
        return result;
    }

    private Modality parseModality(String value) {
        var normalized = java.text.Normalizer.normalize(value, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "").toUpperCase(Locale.ROOT).replaceAll("[^A-Z]", "");
        return switch (normalized) {
            case "BEACHTENNIS" -> Modality.BEACH_TENNIS;
            case "FUTEVOLEI" -> Modality.FUTEVOLEI;
            case "SOCIETY" -> Modality.SOCIETY;
            case "TENIS" -> Modality.TENIS;
            case "VOLEI" -> Modality.VOLEI;
            case "BASQUETE" -> Modality.BASQUETE;
            default -> throw new BusinessException("Modalidade de preco invalida: " + value + ".");
        };
    }

    private PlatformSettings required() {
        return settings.findFirstByOrderByIdAsc().orElseThrow(() -> new IllegalStateException("Configuracoes iniciais ausentes."));
    }

    private SettingsResponse response(PlatformSettings entity) {
        var modalities = Arrays.stream(entity.getEnabledModalities().split(","))
                .filter(value -> !value.isBlank()).map(Modality::valueOf)
                .collect(Collectors.toCollection(LinkedHashSet::new));
        var prices = new LinkedHashMap<String, BigDecimal>();
        prices.put(Modality.BEACH_TENNIS.name(), entity.getBeachTennisPrice());
        prices.put(Modality.FUTEVOLEI.name(), entity.getFutevoleiPrice());
        prices.put(Modality.SOCIETY.name(), entity.getSocietyPrice());
        prices.put(Modality.TENIS.name(), entity.getTenisPrice());
        prices.put(Modality.VOLEI.name(), entity.getVoleiPrice());
        prices.put(Modality.BASQUETE.name(), entity.getBasquetePrice());
        var days = Arrays.stream(entity.getOperatingDays().split(","))
                .filter(value -> !value.isBlank()).collect(Collectors.toCollection(LinkedHashSet::new));
        return new SettingsResponse(
                entity.getCompanyName(), entity.getLegalName(), entity.getDocument(), entity.getCompanyEmail(),
                entity.getCompanyPhone(), entity.getAddress(), entity.getTimezone(), entity.getOpeningTime(),
                entity.getClosingTime(), display(entity.getOpeningTime()) + " - " + display(entity.getClosingTime()), days,
                entity.getCancellationRuleHours(), entity.getMinimumReservationMinutes(), entity.getMaximumAdvanceDays(),
                entity.getSlotMinutes(), modalities, prices, entity.isAcceptPix(), entity.isAcceptCard(), entity.isAcceptCash(),
                entity.getPixKey(), entity.isEmailNotifications(), entity.isBrowserNotifications(),
                entity.getReservationReminderHours(), entity.getPrimaryColor(), entity.getLogoUrl(), entity.getDefaultTheme(),
                entity.getMinimumPasswordLength(), entity.getSessionMinutes(), entity.isRequireStrongPassword(),
                entity.isPublicRegistrationEnabled()
        );
    }

    private String display(LocalTime time) { return String.format("%02d:%02d", time.getHour(), time.getMinute()); }
    private String normalize(String value) { return value == null || value.isBlank() ? null : value.trim(); }
}
