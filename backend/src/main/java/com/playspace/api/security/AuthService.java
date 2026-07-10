package com.playspace.api.security;

import com.playspace.api.common.BusinessException;
import com.playspace.api.user.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository users, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public AuthResponse login(LoginRequest request) {
        var user = users.findByEmail(request.email()).orElseThrow(() -> new BusinessException("Credenciais invalidas."));
        if (!user.isActive() || !passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new BusinessException("Credenciais invalidas.");
        }
        return new AuthResponse(jwtService.generate(user), user);
    }
}
