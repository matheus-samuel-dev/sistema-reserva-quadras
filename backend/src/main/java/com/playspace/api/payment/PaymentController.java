package com.playspace.api.payment;

import com.playspace.api.security.CurrentUserService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {
    private final PaymentRepository payments;
    private final PaymentService service;
    private final CurrentUserService currentUser;

    public PaymentController(PaymentRepository payments, PaymentService service, CurrentUserService currentUser) {
        this.payments = payments;
        this.service = service;
        this.currentUser = currentUser;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    List<Payment> list() {
        return payments.findAll();
    }

    @GetMapping("/my")
    List<Payment> my() {
        return payments.findByReservationClientIdOrderByCreatedAtDesc(currentUser.user().getId());
    }

    @PostMapping("/demo")
    Payment process(@Valid @RequestBody PaymentRequest request) {
        return service.processDemo(request, currentUser.user());
    }
}
