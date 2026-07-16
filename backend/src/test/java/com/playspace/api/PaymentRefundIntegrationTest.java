package com.playspace.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.playspace.api.common.ActivityLogRepository;
import com.playspace.api.court.CourtRepository;
import com.playspace.api.court.CourtStatus;
import com.playspace.api.notification.NotificationRepository;
import com.playspace.api.payment.Payment;
import com.playspace.api.payment.PaymentMethod;
import com.playspace.api.payment.PaymentRepository;
import com.playspace.api.payment.PaymentRequest;
import com.playspace.api.payment.PaymentService;
import com.playspace.api.payment.PaymentStatus;
import com.playspace.api.reservation.ReservationRepository;
import com.playspace.api.reservation.ReservationRequest;
import com.playspace.api.reservation.ReservationService;
import com.playspace.api.reservation.ReservationStatus;
import com.playspace.api.user.UserRepository;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class PaymentRefundIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired PaymentService paymentService;
    @Autowired ReservationService reservationService;
    @Autowired PaymentRepository payments;
    @Autowired ReservationRepository reservations;
    @Autowired NotificationRepository notifications;
    @Autowired ActivityLogRepository activities;
    @Autowired UserRepository users;
    @Autowired CourtRepository courts;

    @Test
    @WithUserDetails("admin@playspace.com")
    void administratorRefundsApprovedPaymentAndCancelsOpenReservationExactlyOnce() throws Exception {
        var payment = approvedPayment();
        var reservation = payment.getReservation();
        var notificationCount = notifications.countByUserIdAndReadFalse(reservation.getClient().getId());
        var activityCount = activities.count();

        mvc.perform(post("/api/payments/{id}/refund", payment.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paymentId").value(payment.getId()))
                .andExpect(jsonPath("$.reservationId").value(reservation.getId()))
                .andExpect(jsonPath("$.reservationCode").value(reservation.getCode()))
                .andExpect(jsonPath("$.reservationStatus").value("CANCELADA"))
                .andExpect(jsonPath("$.status").value("CANCELADO"))
                .andExpect(jsonPath("$.refundedAt").isNotEmpty());

        var refunded = payments.findById(payment.getId()).orElseThrow();
        assertThat(refunded.getStatus()).isEqualTo(PaymentStatus.CANCELADO);
        assertThat(refunded.getRefundedAt()).isNotNull();
        assertThat(reservations.findById(reservation.getId()).orElseThrow().getStatus())
                .isEqualTo(ReservationStatus.CANCELADA);
        assertThat(notifications.countByUserIdAndReadFalse(reservation.getClient().getId()))
                .isEqualTo(notificationCount + 1);
        assertThat(activities.count()).isEqualTo(activityCount + 1);

        var notificationCountAfterRefund = notifications.count();
        var activityCountAfterRefund = activities.count();
        mvc.perform(post("/api/payments/{id}/refund", payment.getId()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.details[0]").value("Somente pagamentos aprovados podem ser estornados."));
        assertThat(notifications.count()).isEqualTo(notificationCountAfterRefund);
        assertThat(activities.count()).isEqualTo(activityCountAfterRefund);
    }

    @Test
    @WithUserDetails("admin@playspace.com")
    void refundKeepsACompletedReservationCompleted() throws Exception {
        var payment = approvedPayment();
        var reservation = payment.getReservation();
        reservation.setStatus(ReservationStatus.CONCLUIDA);
        reservations.saveAndFlush(reservation);

        mvc.perform(post("/api/payments/{id}/refund", payment.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reservationStatus").value("CONCLUIDA"))
                .andExpect(jsonPath("$.status").value("CANCELADO"));

        assertThat(reservations.findById(reservation.getId()).orElseThrow().getStatus())
                .isEqualTo(ReservationStatus.CONCLUIDA);
    }

    @Test
    @WithUserDetails("admin@playspace.com")
    void pendingPaymentCannotBeRefunded() throws Exception {
        var approved = approvedPayment();
        approved.setStatus(PaymentStatus.PENDENTE);
        approved.setPaidAt(null);
        payments.saveAndFlush(approved);

        mvc.perform(post("/api/payments/{id}/refund", approved.getId()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.details[0]").value("Somente pagamentos aprovados podem ser estornados."));

        assertThat(payments.findById(approved.getId()).orElseThrow().getStatus()).isEqualTo(PaymentStatus.PENDENTE);
    }

    @Test
    @WithUserDetails("cliente@playspace.com")
    void clientCannotRefundEvenAnOwnApprovedPayment() throws Exception {
        var payment = approvedPayment();

        mvc.perform(post("/api/payments/{id}/refund", payment.getId()))
                .andExpect(status().isForbidden());

        assertThat(payments.findById(payment.getId()).orElseThrow().getStatus()).isEqualTo(PaymentStatus.APROVADO);
        assertThat(payments.findById(payment.getId()).orElseThrow().getRefundedAt()).isNull();
    }

    private Payment approvedPayment() {
        var client = users.findByEmailIgnoreCase("cliente@playspace.com").orElseThrow();
        var court = courts.findByStatus(CourtStatus.DISPONIVEL).get(0);
        var reservation = reservationService.create(
                new ReservationRequest(
                        null,
                        court.getId(),
                        LocalDate.now().plusDays(80),
                        LocalTime.of(8, 0),
                        LocalTime.of(9, 0),
                        2,
                        PaymentMethod.PIX,
                        "Reserva para teste de estorno " + UUID.randomUUID()
                ),
                client
        );
        return paymentService.processDemo(new PaymentRequest(reservation.getId(), PaymentMethod.PIX, true), client);
    }
}
