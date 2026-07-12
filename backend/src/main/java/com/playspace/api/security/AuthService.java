package com.playspace.api.security;

import com.playspace.api.common.AuditService;
import com.playspace.api.common.UnauthorizedException;
import com.playspace.api.user.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuditService audit;

    public AuthService(UserRepository users, PasswordEncoder passwordEncoder, JwtService jwtService, AuditService audit) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.audit = audit;
    }

    public AuthResponse login(LoginRequest request) {
        var user = users.findByEmailIgnoreCase(request.email().trim()).orElseThrow(() -> new UnauthorizedException("Credenciais invalidas."));
        if (!user.isActive() || !passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new UnauthorizedException("Credenciais invalidas.");
        }
        audit.record(user, "Login realizado", "AUTENTICACAO");
        return new AuthResponse(jwtService.generate(user), user);
    }
}
