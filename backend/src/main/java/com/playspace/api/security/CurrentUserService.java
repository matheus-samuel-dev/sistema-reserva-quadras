package com.playspace.api.security;

import com.playspace.api.common.NotFoundException;
import com.playspace.api.user.AppUser;
import com.playspace.api.user.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class CurrentUserService {
    private final UserRepository users;

    public CurrentUserService(UserRepository users) {
        this.users = users;
    }

    public AppUser user() {
        var email = SecurityContextHolder.getContext().getAuthentication().getName();
        return users.findByEmail(email).orElseThrow(() -> new NotFoundException("Usuario autenticado nao encontrado."));
    }
}
