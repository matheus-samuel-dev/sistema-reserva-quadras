package com.playspace.api.user;

import com.playspace.api.common.NotFoundException;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
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

    public UserController(UserRepository users, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping
    List<AppUser> list() {
        return users.findAll();
    }

    @PostMapping
    AppUser create(@Valid @RequestBody UserRequest request) {
        var user = new AppUser();
        apply(user, request);
        user.setPassword(passwordEncoder.encode(request.password() == null ? "PlaySpace@123" : request.password()));
        user.setMemberSince(LocalDate.now());
        return users.save(user);
    }

    @PutMapping("/{id}")
    AppUser update(@PathVariable Long id, @Valid @RequestBody UserRequest request) {
        var user = users.findById(id).orElseThrow(() -> new NotFoundException("Usuario nao encontrado."));
        apply(user, request);
        if (request.password() != null && !request.password().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.password()));
        }
        return users.save(user);
    }

    @DeleteMapping("/{id}")
    void deactivate(@PathVariable Long id) {
        var user = users.findById(id).orElseThrow(() -> new NotFoundException("Usuario nao encontrado."));
        user.setActive(false);
        users.save(user);
    }

    private void apply(AppUser user, UserRequest request) {
        user.setName(request.name());
        user.setEmail(request.email());
        user.setRole(request.role());
        user.setActive(request.active());
        user.setCity(request.city());
        user.setBio(request.bio());
        user.setFavoriteModality(request.favoriteModality());
        user.setSportsLevel(request.sportsLevel());
    }
}
