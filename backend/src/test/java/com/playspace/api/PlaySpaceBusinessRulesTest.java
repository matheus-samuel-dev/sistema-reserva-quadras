package com.playspace.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.playspace.api.common.BusinessException;
import com.playspace.api.common.ConflictException;
import com.playspace.api.court.CourtStatus;
import com.playspace.api.court.CourtRepository;
import com.playspace.api.payment.Payment;
import com.playspace.api.payment.PaymentMethod;
import com.playspace.api.payment.PaymentRepository;
import com.playspace.api.payment.PaymentRequest;
import com.playspace.api.payment.PaymentService;
import com.playspace.api.payment.PaymentStatus;
import com.playspace.api.reservation.ReservationRequest;
import com.playspace.api.reservation.ReservationService;
import com.playspace.api.reservation.ReservationStatus;
import com.playspace.api.security.AuthService;
import com.playspace.api.security.LoginRequest;
import com.playspace.api.user.Role;
import com.playspace.api.user.UserRepository;
import java.time.LocalDate;
import java.time.LocalTime;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class PlaySpaceBusinessRulesTest {
    @Autowired
    AuthService authService;

    @Autowired
    ReservationService reservationService;

    @Autowired
    PaymentService paymentService;

    @Autowired
    PaymentRepository payments;

    @Autowired
    UserRepository users;

    @Autowired
    CourtRepository courts;

    @Test
    void authenticatesAdminWithJwt() {
        var response = authService.login(new LoginRequest("admin@playspace.com", "Admin@123"));

        assertThat(response.token()).isNotBlank();
        assertThat(response.user().getRole()).isEqualTo(Role.ADMIN);
    }

    @Test
    void createsReservationAndApprovesDemoPayment() {
        var client = users.findByEmail("cliente@playspace.com").orElseThrow();
        var court = courts.findByStatus(CourtStatus.DISPONIVEL).get(0);
        var request = new ReservationRequest(
                null,
                court.getId(),
                LocalDate.now().plusDays(40),
                LocalTime.of(9, 0),
                LocalTime.of(10, 0),
                4,
                PaymentMethod.PIX,
                "Teste automatizado"
        );

        var reservation = reservationService.create(request, client);
        var payment = paymentService.processDemo(new PaymentRequest(reservation.getId(), PaymentMethod.PIX, true), client);

        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.APROVADO);
        assertThat(payment.getReservation().getStatus()).isEqualTo(ReservationStatus.CONFIRMADA);
    }

    @Test
    void preventsConflictingReservations() {
        var client = users.findByEmail("cliente@playspace.com").orElseThrow();
        var court = courts.findByStatus(CourtStatus.DISPONIVEL).get(0);
        var date = LocalDate.now().plusDays(41);
        var first = new ReservationRequest(null, court.getId(), date, LocalTime.of(11, 0), LocalTime.of(12, 0), 4, PaymentMethod.PIX, null);
        var conflict = new ReservationRequest(null, court.getId(), date, LocalTime.of(11, 30), LocalTime.of(12, 30), 4, PaymentMethod.PIX, null);

        reservationService.create(first, client);

        assertThatThrownBy(() -> reservationService.create(conflict, client))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Ja existe uma reserva");
    }

    @Test
    void preventsPastAndMaintenanceReservations() {
        var client = users.findByEmail("cliente@playspace.com").orElseThrow();
        var availableCourt = courts.findByStatus(CourtStatus.DISPONIVEL).get(0);
        var maintenanceCourt = courts.findByStatus(CourtStatus.EM_MANUTENCAO).get(0);

        assertThatThrownBy(() -> reservationService.create(
                new ReservationRequest(null, availableCourt.getId(), LocalDate.now().minusDays(1), LocalTime.of(10, 0), LocalTime.of(11, 0), 2, PaymentMethod.PIX, null),
                client
        )).isInstanceOf(BusinessException.class);

        assertThatThrownBy(() -> reservationService.create(
                new ReservationRequest(null, maintenanceCourt.getId(), LocalDate.now().plusDays(42), LocalTime.of(10, 0), LocalTime.of(11, 0), 2, PaymentMethod.PIX, null),
                client
        )).isInstanceOf(BusinessException.class)
                .hasMessageContaining("nao esta disponivel");
    }

    @Test
    void enforcesClientReservationOwnershipAndCancellationRule() {
        var client = users.findByEmail("cliente@playspace.com").orElseThrow();
        var otherClient = users.findByEmail("lucas@playspace.com").orElseThrow();
        var court = courts.findByStatus(CourtStatus.DISPONIVEL).get(0);
        var reservation = reservationService.create(
                new ReservationRequest(null, court.getId(), LocalDate.now().plusDays(43), LocalTime.of(13, 0), LocalTime.of(14, 0), 2, PaymentMethod.PIX, null),
                client
        );

        assertThatThrownBy(() -> reservationService.getVisible(reservation.getId(), otherClient))
                .isInstanceOf(AccessDeniedException.class);

        var canceled = reservationService.cancel(reservation.getId(), client);
        assertThat(canceled.getStatus()).isEqualTo(ReservationStatus.CANCELADA);
    }

    @Test
    void rejectsCapacityOverflowAndInvalidStatusTransition() {
        var client = users.findByEmail("cliente@playspace.com").orElseThrow();
        var court = courts.findByStatus(CourtStatus.DISPONIVEL).get(0);

        assertThatThrownBy(() -> reservationService.create(
                new ReservationRequest(null, court.getId(), LocalDate.now().plusDays(60), LocalTime.of(15, 0), LocalTime.of(16, 0), court.getPlayerCapacity() + 1, PaymentMethod.PIX, null),
                client
        )).isInstanceOf(BusinessException.class)
                .hasMessageContaining("capacidade maxima");

        var reservation = reservationService.create(
                new ReservationRequest(null, court.getId(), LocalDate.now().plusDays(61), LocalTime.of(15, 0), LocalTime.of(16, 0), 2, PaymentMethod.PIX, null),
                client
        );

        assertThatThrownBy(() -> reservationService.updateStatus(reservation.getId(), ReservationStatus.CONCLUIDA, client))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("Transicao de status invalida");
    }

    @Test
    void preventsDuplicateOrCanceledReservationPayment() {
        var client = users.findByEmail("cliente@playspace.com").orElseThrow();
        var court = courts.findByStatus(CourtStatus.DISPONIVEL).get(0);
        var approvedReservation = reservationService.create(
                new ReservationRequest(null, court.getId(), LocalDate.now().plusDays(62), LocalTime.of(15, 0), LocalTime.of(16, 0), 2, PaymentMethod.PIX, null),
                client
        );
        var paymentRequest = new PaymentRequest(approvedReservation.getId(), PaymentMethod.PIX, true);
        paymentService.processDemo(paymentRequest, client);

        assertThatThrownBy(() -> paymentService.processDemo(paymentRequest, client))
                .isInstanceOf(ConflictException.class);

        var canceledReservation = reservationService.create(
                new ReservationRequest(null, court.getId(), LocalDate.now().plusDays(63), LocalTime.of(15, 0), LocalTime.of(16, 0), 2, PaymentMethod.PIX, null),
                client
        );
        reservationService.cancel(canceledReservation.getId(), client);

        assertThatThrownBy(() -> paymentService.processDemo(new PaymentRequest(canceledReservation.getId(), PaymentMethod.PIX, true), client))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("Somente reservas pendentes");
    }

    @Test
    void cancellationAlsoCancelsPendingAndApprovedPayments() {
        var client = users.findByEmail("cliente@playspace.com").orElseThrow();
        var admin = users.findByEmail("admin@playspace.com").orElseThrow();
        var court = courts.findByStatus(CourtStatus.DISPONIVEL).get(0);

        var pendingReservation = reservationService.create(
                new ReservationRequest(null, court.getId(), LocalDate.now().plusDays(70), LocalTime.of(10, 0), LocalTime.of(11, 0), 2, PaymentMethod.PIX, null),
                client
        );
        var pendingPayment = new Payment();
        pendingPayment.setReservation(pendingReservation);
        pendingPayment.setMethod(PaymentMethod.PIX);
        pendingPayment.setStatus(PaymentStatus.PENDENTE);
        pendingPayment.setAmount(pendingReservation.getTotalValue());
        pendingPayment.setTransactionCode("PAY-TEST-PENDING");
        payments.save(pendingPayment);

        reservationService.cancel(pendingReservation.getId(), client);

        assertThat(payments.findByReservationId(pendingReservation.getId()))
                .extracting(Payment::getStatus)
                .containsExactly(PaymentStatus.CANCELADO);

        var approvedReservation = reservationService.create(
                new ReservationRequest(null, court.getId(), LocalDate.now().plusDays(71), LocalTime.of(10, 0), LocalTime.of(11, 0), 2, PaymentMethod.PIX, null),
                client
        );
        paymentService.processDemo(new PaymentRequest(approvedReservation.getId(), PaymentMethod.PIX, true), client);

        reservationService.updateStatus(approvedReservation.getId(), ReservationStatus.CANCELADA, admin);

        assertThat(payments.findByReservationId(approvedReservation.getId()))
                .extracting(Payment::getStatus)
                .containsExactly(PaymentStatus.CANCELADO);
    }
}
