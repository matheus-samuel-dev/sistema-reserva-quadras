package com.playspace.api.user;

import com.playspace.api.common.AuditService;
import com.playspace.api.common.BusinessException;
import com.playspace.api.modality.SportModality;
import com.playspace.api.modality.SportModalityService;
import com.playspace.api.payment.PaymentRepository;
import com.playspace.api.payment.PaymentStatus;
import com.playspace.api.reservation.ReservationRepository;
import com.playspace.api.reservation.ReservationStatus;
import com.playspace.api.security.CurrentUserService;
import java.math.BigDecimal;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.stream.Collectors;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProfileService {
    private final CurrentUserService currentUser;
    private final UserRepository users;
    private final UserPreferenceRepository preferences;
    private final ReservationRepository reservations;
    private final PaymentRepository payments;
    private final PasswordEncoder passwordEncoder;
    private final PasswordPolicy passwordPolicy;
    private final AuditService audit;
    private final SportModalityService modalities;

    public ProfileService(CurrentUserService currentUser, UserRepository users, UserPreferenceRepository preferences,
                          ReservationRepository reservations, PaymentRepository payments, PasswordEncoder passwordEncoder,
                          PasswordPolicy passwordPolicy, AuditService audit, SportModalityService modalities) {
        this.currentUser = currentUser;
        this.users = users;
        this.preferences = preferences;
        this.reservations = reservations;
        this.payments = payments;
        this.passwordEncoder = passwordEncoder;
        this.passwordPolicy = passwordPolicy;
        this.audit = audit;
        this.modalities = modalities;
    }

    @Transactional(readOnly = true)
    public UserResponse profile() {
        return UserResponse.from(currentUser.user());
    }

    @Transactional
    public UserResponse update(ProfileUpdateRequest request) {
        var user = currentUser.user();
        user.setName(request.name().trim());
        user.setPhone(normalize(request.phone()));
        user.setCity(normalize(request.city()));
        user.setAvatarUrl(normalize(request.avatarUrl()));
        user.setBio(normalize(request.bio()));
        user.setSportsLevel(normalize(request.sportsLevel()));
        user.setFavoriteModality(request.favoriteModality() == null ? null
                : modalities.requireActive(request.favoriteModality()).getCode());
        user.setAvailability(normalize(request.availability()));
        var sports = request.practicedSports() == null ? new LinkedHashSet<String>()
                : modalities.requireAll(request.practicedSports()).stream()
                .map(SportModality::getCode)
                .collect(Collectors.toCollection(LinkedHashSet::new));
        user.setPracticedSports(sports);
        var saved = users.save(user);
        audit.record(user, "Atualizou o próprio perfil", "USUÁRIO");
        return UserResponse.from(saved);
    }

    @Transactional
    public UserResponse removeAvatar() {
        var user = currentUser.user();
        user.setAvatarUrl(null);
        var saved = users.save(user);
        audit.record(user, "Removeu a foto do perfil", "USUÁRIO");
        return UserResponse.from(saved);
    }

    @Transactional
    public void changePassword(ChangePasswordRequest request) {
        var user = currentUser.user();
        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new BusinessException("A senha atual esta incorreta.");
        }
        passwordPolicy.validateConfirmation(request.newPassword(), request.newPasswordConfirmation());
        if (passwordEncoder.matches(request.newPassword(), user.getPassword())) {
            throw new BusinessException("A nova senha deve ser diferente da senha atual.");
        }
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        users.save(user);
        audit.record(user, "Alterou a própria senha", "SEGURANÇA");
    }

    @Transactional(readOnly = true)
    public ProfileSummaryResponse summary() {
        var user = currentUser.user();
        var userReservations = reservations.findByClientIdOrderByDateDescStartTimeDesc(user.getId());
        var userPayments = payments.findByReservationClientIdOrderByCreatedAtDesc(user.getId());
        var totalPaid = userPayments.stream().filter(payment -> payment.getStatus() == PaymentStatus.APROVADO)
                .map(payment -> payment.getAmount()).reduce(BigDecimal.ZERO, BigDecimal::add);
        return new ProfileSummaryResponse(
                userReservations.size(),
                userReservations.stream().filter(reservation -> reservation.getStatus() == ReservationStatus.CONCLUIDA).count(),
                userPayments.size(), totalPaid, user.getAchievements().size(), user.getAttendanceRate()
        );
    }

    @Transactional(readOnly = true)
    public ProfileHistoryResponse history() {
        var user = currentUser.user();
        return new ProfileHistoryResponse(
                reservations.findByClientIdOrderByDateDescStartTimeDesc(user.getId()).stream()
                        .map(ReservationHistoryResponse::from).toList(),
                payments.findByReservationClientIdOrderByCreatedAtDesc(user.getId()).stream()
                        .map(PaymentHistoryResponse::from).toList()
        );
    }

    @Transactional
    public PreferenceResponse preferences() {
        return toResponse(findOrCreatePreference(currentUser.user()));
    }

    @Transactional
    public PreferenceResponse updatePreferences(PreferenceRequest request) {
        var user = currentUser.user();
        var preference = findOrCreatePreference(user);
        preference.setTheme(request.theme().toUpperCase(Locale.ROOT));
        preference.setNotificationsEnabled(request.notificationsEnabled());
        preference.setReservationReminderHours(request.reservationReminderHours());
        preference.setEmailNotifications(request.emailNotifications());
        preference.setBrowserNotifications(request.browserNotifications());
        preference.setDefaultCity(normalize(request.defaultCity()));
        preference.setFavoriteModalities(request.favoriteModalities() == null ? ""
                : modalities.requireAll(request.favoriteModalities()).stream()
                .map(SportModality::getCode).sorted().collect(Collectors.joining(",")));
        preference.setPreferredTimes(normalize(request.preferredTimes()));
        preference.setPrivateProfile(request.privateProfile());
        preference.setDiscoverableByPartners(request.discoverableByPartners());
        preference.setLanguage(request.language());
        var saved = preferences.save(preference);
        audit.record(user, "Atualizou as preferências", "USUÁRIO");
        return toResponse(saved);
    }

    private UserPreference findOrCreatePreference(AppUser user) {
        return preferences.findByUserId(user.getId()).orElseGet(() -> {
            var preference = new UserPreference();
            preference.setUser(user);
            preference.setDefaultCity(user.getCity());
            return preferences.save(preference);
        });
    }

    private PreferenceResponse toResponse(UserPreference preference) {
        var modalities = preference.getFavoriteModalities() == null || preference.getFavoriteModalities().isBlank()
                ? java.util.Set.<String>of()
                : java.util.Arrays.stream(preference.getFavoriteModalities().split(","))
                .filter(value -> !value.isBlank())
                .collect(Collectors.toCollection(LinkedHashSet::new));
        return new PreferenceResponse(
                preference.getTheme(), preference.isNotificationsEnabled(), preference.getReservationReminderHours(),
                preference.isEmailNotifications(), preference.isBrowserNotifications(), preference.getDefaultCity(),
                modalities, preference.getPreferredTimes(), preference.isPrivateProfile(),
                preference.isDiscoverableByPartners(), preference.getLanguage()
        );
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
