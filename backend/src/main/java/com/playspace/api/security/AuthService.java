package com.playspace.api.security;

import com.playspace.api.common.AuditService;
import com.playspace.api.common.ConflictException;
import com.playspace.api.common.UnauthorizedException;
import com.playspace.api.settings.PlatformSettingsRepository;
import com.playspace.api.user.AppUser;
import com.playspace.api.user.PasswordPolicy;
import com.playspace.api.user.PublicRegistrationRequest;
import com.playspace.api.user.Role;
import com.playspace.api.user.UserResponse;
import com.playspace.api.user.UserRepository;
import java.time.LocalDate;
import java.util.Locale;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuditService audit;
    private final PasswordPolicy passwordPolicy;
    private final PlatformSettingsRepository settings;

    public AuthService(UserRepository users, PasswordEncoder passwordEncoder, JwtService jwtService, AuditService audit,
                       PasswordPolicy passwordPolicy, PlatformSettingsRepository settings) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.audit = audit;
        this.passwordPolicy = passwordPolicy;
        this.settings = settings;
    }

    public AuthResponse login(LoginRequest request) {
        var user = users.findByEmailIgnoreCase(request.email().trim()).orElseThrow(() -> new UnauthorizedException("Credenciais inválidas."));
        if (!user.isActive() || !passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new UnauthorizedException("Credenciais inválidas.");
        }
        audit.record(user, "Login realizado", "AUTENTICAÇÃO");
        return new AuthResponse(jwtService.generate(user), UserResponse.from(user));
    }

    @Transactional
    public AuthResponse register(PublicRegistrationRequest request) {
        ensurePublicRegistrationIsEnabled();
        var email = request.email().trim().toLowerCase(Locale.ROOT);
        if (users.existsByEmailIgnoreCase(email)) {
            throw new ConflictException("Já existe uma conta com este e-mail.");
        }
        passwordPolicy.validateConfirmation(request.password(), request.passwordConfirmation());
        var user = new AppUser();
        user.setName(request.name().trim());
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setPhone(request.phone() == null || request.phone().isBlank() ? null : request.phone().trim());
        user.setRole(Role.CLIENTE);
        user.setActive(true);
        user.setMemberSince(LocalDate.now());
        var saved = users.save(user);
        audit.record(saved, "Criou a própria conta", "AUTENTICAÇÃO");
        return new AuthResponse(jwtService.generate(saved), UserResponse.from(saved));
    }

    private void ensurePublicRegistrationIsEnabled() {
        var platformSettings = settings.findFirstByOrderByIdAsc()
                .orElseThrow(() -> new IllegalStateException("As configurações da plataforma não foram inicializadas."));
        if (!platformSettings.isPublicRegistrationEnabled()) {
            throw new ConflictException("O cadastro público está desativado no momento.");
        }
    }
}
