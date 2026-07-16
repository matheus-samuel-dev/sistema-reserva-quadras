package com.playspace.api.user;

import com.playspace.api.common.BusinessException;
import org.springframework.stereotype.Component;

@Component
public class PasswordPolicy {
    public void validate(String password) {
        if (password == null || password.length() < 8
                || !password.matches(".*[A-Z].*")
                || !password.matches(".*[a-z].*")
                || !password.matches(".*\\d.*")
                || !password.matches(".*[^A-Za-z0-9].*")) {
            throw new BusinessException("A senha deve ter ao menos 8 caracteres, maiuscula, minuscula, numero e simbolo.");
        }
    }

    public void validateConfirmation(String password, String confirmation) {
        validate(password);
        if (!password.equals(confirmation)) {
            throw new BusinessException("A confirmação da senha não confere.");
        }
    }
}
