package com.playspace.api.user;

import com.playspace.api.common.AuditService;
import com.playspace.api.common.BusinessException;
import com.playspace.api.common.ConflictException;
import com.playspace.api.common.NotFoundException;
import com.playspace.api.security.CurrentUserService;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@PreAuthorize("hasRole('ADMIN')")
public class UserController {
    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final CurrentUserService currentUser;
    private final AuditService audit;

    public UserController(UserRepository users, PasswordEncoder passwordEncoder, CurrentUserService currentUser, AuditService audit) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.currentUser = currentUser;
        this.audit = audit;
    }

    @GetMapping
    List<AppUser> list() {
        return users.findAll();
    }

    @PostMapping
    @Transactional
    AppUser create(@Valid @RequestBody UserRequest request) {
        if (users.existsByEmailIgnoreCase(request.email())) {
            throw new ConflictException("Ja existe um usuario com este e-mail.");
        }
        validatePassword(request.password(), true);
        var user = new AppUser();
        apply(user, request);
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setMemberSince(LocalDate.now());
        var saved = users.save(user);
        audit.record(currentUser.user(), "Criou o usuario " + saved.getEmail(), "USUARIO");
        return saved;
    }

    @PutMapping("/{id}")
    @Transactional
    AppUser update(@PathVariable Long id, @Valid @RequestBody UserRequest request) {
        var actor = currentUser.user();
        var user = users.findById(id).orElseThrow(() -> new NotFoundException("Usuario nao encontrado."));
        if (users.existsByEmailIgnoreCaseAndIdNot(request.email(), id)) {
            throw new ConflictException("Ja existe um usuario com este e-mail.");
        }
        if (actor.getId().equals(id) && request.role() != user.getRole()) {
            throw new AccessDeniedException("Nao e permitido alterar o proprio perfil de acesso.");
        }
        if (user.getRole() == Role.ADMIN && user.isActive() && (request.role() != Role.ADMIN || !request.active())) {
            ensureAnotherActiveAdmin(id);
        }
        apply(user, request);
        if (request.password() != null && !request.password().isBlank()) {
            validatePassword(request.password(), false);
            user.setPassword(passwordEncoder.encode(request.password()));
        }
        var saved = users.save(user);
        audit.record(actor, "Atualizou o usuario " + saved.getEmail(), "USUARIO");
        return saved;
    }

    @DeleteMapping("/{id}")
    @Transactional
    void deactivate(@PathVariable Long id) {
        var actor = currentUser.user();
        if (actor.getId().equals(id)) {
            throw new AccessDeniedException("Nao e permitido inativar a propria conta por este fluxo.");
        }
        var user = users.findById(id).orElseThrow(() -> new NotFoundException("Usuario nao encontrado."));
        if (!user.isActive()) return;
        if (user.getRole() == Role.ADMIN) ensureAnotherActiveAdmin(id);
        user.setActive(false);
        users.save(user);
        audit.record(actor, "Inativou o usuario " + user.getEmail(), "USUARIO");
    }

    private void ensureAnotherActiveAdmin(Long excludedId) {
        var activeAdmins = users.findActiveByRoleForUpdate(Role.ADMIN);
        if (activeAdmins.stream().noneMatch(admin -> !admin.getId().equals(excludedId))) {
            throw new ConflictException("Nao e possivel inativar ou rebaixar o ultimo administrador ativo.");
        }
    }

    private void validatePassword(String password, boolean required) {
        if (password == null || password.isBlank()) {
            if (required) throw new BusinessException("Informe uma senha provisoria segura.");
            return;
        }
        if (password.length() < 8
                || !password.matches(".*[A-Z].*")
                || !password.matches(".*[a-z].*")
                || !password.matches(".*\\d.*")
                || !password.matches(".*[^A-Za-z0-9].*")) {
            throw new BusinessException("A senha deve ter ao menos 8 caracteres, maiuscula, minuscula, numero e simbolo.");
        }
    }

    private void apply(AppUser user, UserRequest request) {
        user.setName(request.name().trim());
        user.setEmail(request.email().trim().toLowerCase(Locale.ROOT));
        user.setRole(request.role());
        user.setActive(request.active());
        user.setCity(request.city());
        user.setBio(request.bio());
        user.setFavoriteModality(request.favoriteModality());
        user.setSportsLevel(request.sportsLevel());
        user.setAvatarUrl(request.avatarUrl());
    }
}
