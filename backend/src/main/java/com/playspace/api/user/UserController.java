package com.playspace.api.user;

import com.playspace.api.common.AuditService;
import com.playspace.api.common.BusinessException;
import com.playspace.api.common.ConflictException;
import com.playspace.api.common.NotFoundException;
import com.playspace.api.modality.SportModality;
import com.playspace.api.modality.SportModalityService;
import com.playspace.api.security.CurrentUserService;
import com.playspace.api.payment.PaymentRepository;
import com.playspace.api.payment.PaymentStatus;
import com.playspace.api.reservation.ReservationRepository;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@PreAuthorize("hasRole('ADMIN')")
public class UserController {
    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final CurrentUserService currentUser;
    private final AuditService audit;
    private final PasswordPolicy passwordPolicy;
    private final ReservationRepository reservations;
    private final PaymentRepository payments;
    private final SportModalityService modalities;

    public UserController(UserRepository users, PasswordEncoder passwordEncoder, CurrentUserService currentUser,
                          AuditService audit, PasswordPolicy passwordPolicy, ReservationRepository reservations,
                          PaymentRepository payments, SportModalityService modalities) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.currentUser = currentUser;
        this.audit = audit;
        this.passwordPolicy = passwordPolicy;
        this.reservations = reservations;
        this.payments = payments;
        this.modalities = modalities;
    }

    @GetMapping
    @Transactional(readOnly = true)
    List<UserResponse> list() {
        return users.findAll().stream().map(UserResponse::from).toList();
    }

    @GetMapping("/search")
    @Transactional(readOnly = true)
    Page<UserResponse> search(@RequestParam(required = false) String search,
                              @RequestParam(required = false) Role role,
                              @RequestParam(required = false) Boolean active,
                              @PageableDefault(size = 20, sort = "name") Pageable pageable) {
        var normalized = search == null || search.isBlank() ? null : search.trim();
        return users.search(normalized, role, active, pageable).map(UserResponse::from);
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    UserDetailResponse detail(@PathVariable Long id) {
        var user = find(id);
        var userReservations = reservations.findByClientIdOrderByDateDescStartTimeDesc(id);
        var userPayments = payments.findByReservationClientIdOrderByCreatedAtDesc(id);
        var totalPaid = userPayments.stream().filter(payment -> payment.getStatus() == PaymentStatus.APROVADO)
                .map(payment -> payment.getAmount()).reduce(BigDecimal.ZERO, BigDecimal::add);
        return new UserDetailResponse(UserResponse.from(user), userReservations.size(), userPayments.size(), totalPaid, 0);
    }

    @GetMapping("/{id}/reservations")
    @Transactional(readOnly = true)
    List<ReservationHistoryResponse> reservations(@PathVariable Long id) {
        find(id);
        return reservations.findByClientIdOrderByDateDescStartTimeDesc(id).stream()
                .map(ReservationHistoryResponse::from).toList();
    }

    @GetMapping("/{id}/payments")
    @Transactional(readOnly = true)
    List<PaymentHistoryResponse> payments(@PathVariable Long id) {
        find(id);
        return payments.findByReservationClientIdOrderByCreatedAtDesc(id).stream()
                .map(PaymentHistoryResponse::from).toList();
    }

    @PostMapping
    @Transactional
    UserResponse create(@Valid @RequestBody UserRequest request) {
        if (users.existsByEmailIgnoreCase(request.email())) {
            throw new ConflictException("Já existe um usuário com este e-mail.");
        }
        passwordPolicy.validate(request.password());
        var user = new AppUser();
        apply(user, request);
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setMemberSince(LocalDate.now());
        var saved = users.save(user);
        audit.record(currentUser.user(), "Criou o usuário " + saved.getEmail(), "USUÁRIO");
        return UserResponse.from(saved);
    }

    @PutMapping("/{id}")
    @Transactional
    UserResponse update(@PathVariable Long id, @Valid @RequestBody UserRequest request) {
        var actor = currentUser.user();
        var user = users.findById(id).orElseThrow(() -> new NotFoundException("Usuário não encontrado."));
        if (users.existsByEmailIgnoreCaseAndIdNot(request.email(), id)) {
            throw new ConflictException("Já existe um usuário com este e-mail.");
        }
        if (actor.getId().equals(id) && request.role() != user.getRole()) {
            throw new AccessDeniedException("Não é permitido alterar o próprio perfil de acesso.");
        }
        if (user.getRole() == Role.ADMIN && user.isActive() && (request.role() != Role.ADMIN || !request.active())) {
            ensureAnotherActiveAdmin(id);
        }
        apply(user, request);
        if (request.password() != null && !request.password().isBlank()) {
            passwordPolicy.validate(request.password());
            user.setPassword(passwordEncoder.encode(request.password()));
        }
        var saved = users.save(user);
        audit.record(actor, "Atualizou o usuário " + saved.getEmail(), "USUÁRIO");
        return UserResponse.from(saved);
    }

    @PutMapping("/{id}/status")
    @Transactional
    UserResponse status(@PathVariable Long id, @Valid @RequestBody UserStatusRequest request) {
        var actor = currentUser.user();
        var user = find(id);
        if (actor.getId().equals(id) && !request.active()) {
            throw new AccessDeniedException("Não é permitido inativar a própria conta por este fluxo.");
        }
        if (user.getRole() == Role.ADMIN && user.isActive() && !request.active()) ensureAnotherActiveAdmin(id);
        user.setActive(request.active());
        var saved = users.save(user);
        audit.record(actor, (request.active() ? "Ativou" : "Inativou") + " o usuário " + user.getEmail(), "USUÁRIO");
        return UserResponse.from(saved);
    }

    @PutMapping("/{id}/password")
    @Transactional
    void resetPassword(@PathVariable Long id, @Valid @RequestBody ResetPasswordRequest request) {
        var actor = currentUser.user();
        var user = find(id);
        passwordPolicy.validateConfirmation(request.temporaryPassword(), request.temporaryPasswordConfirmation());
        user.setPassword(passwordEncoder.encode(request.temporaryPassword()));
        users.save(user);
        audit.record(actor, "Redefiniu a senha do usuário " + user.getEmail(), "SEGURANÇA");
    }

    @DeleteMapping("/{id}")
    @Transactional
    void deactivate(@PathVariable Long id) {
        var actor = currentUser.user();
        if (actor.getId().equals(id)) {
            throw new AccessDeniedException("Não é permitido inativar a própria conta por este fluxo.");
        }
        var user = users.findById(id).orElseThrow(() -> new NotFoundException("Usuário não encontrado."));
        if (!user.isActive()) return;
        if (user.getRole() == Role.ADMIN) ensureAnotherActiveAdmin(id);
        user.setActive(false);
        users.save(user);
        audit.record(actor, "Inativou o usuário " + user.getEmail(), "USUÁRIO");
    }

    private void ensureAnotherActiveAdmin(Long excludedId) {
        var activeAdmins = users.findActiveByRoleForUpdate(Role.ADMIN);
        if (activeAdmins.stream().noneMatch(admin -> !admin.getId().equals(excludedId))) {
            throw new ConflictException("Não é possível inativar ou rebaixar o último administrador ativo.");
        }
    }

    private void apply(AppUser user, UserRequest request) {
        user.setName(request.name().trim());
        user.setEmail(request.email().trim().toLowerCase(Locale.ROOT));
        user.setRole(request.role());
        user.setActive(request.active());
        user.setCity(request.city());
        user.setBio(request.bio());
        user.setFavoriteModality(request.favoriteModality() == null ? null
                : modalities.requireActive(request.favoriteModality()).getCode());
        user.setSportsLevel(request.sportsLevel());
        user.setAvatarUrl(request.avatarUrl());
        user.setPhone(request.phone());
        user.setAvailability(request.availability());
        user.setPracticedSports(request.practicedSports() == null ? new LinkedHashSet<>()
                : modalities.requireAll(request.practicedSports()).stream()
                .map(SportModality::getCode)
                .collect(java.util.stream.Collectors.toCollection(LinkedHashSet::new)));
    }

    private AppUser find(Long id) {
        return users.findById(id).orElseThrow(() -> new NotFoundException("Usuário não encontrado."));
    }
}
