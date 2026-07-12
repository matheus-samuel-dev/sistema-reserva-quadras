package com.playspace.api;

import static org.assertj.core.api.Assertions.assertThat;

import com.playspace.api.common.ConflictException;
import com.playspace.api.court.CourtRepository;
import com.playspace.api.court.CourtStatus;
import com.playspace.api.payment.PaymentMethod;
import com.playspace.api.reservation.ReservationRequest;
import com.playspace.api.reservation.ReservationService;
import com.playspace.api.user.UserRepository;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class ReservationConcurrencyTest {
    @Autowired ReservationService reservations;
    @Autowired UserRepository users;
    @Autowired CourtRepository courts;

    @Test
    void serializesConcurrentReservationsForTheSameCourtAndInterval() throws Exception {
        var client = users.findByEmail("cliente@playspace.com").orElseThrow();
        var court = courts.findByStatus(CourtStatus.DISPONIVEL).get(0);
        var request = new ReservationRequest(null, court.getId(), LocalDate.now().plusDays(90), LocalTime.of(10, 0), LocalTime.of(11, 0), 2, PaymentMethod.PIX, "Concorrencia");
        var start = new CountDownLatch(1);

        Callable<String> attempt = () -> {
            start.await();
            try {
                reservations.create(request, client);
                return "created";
            } catch (ConflictException conflict) {
                return "conflict";
            }
        };

        try (var executor = Executors.newFixedThreadPool(2)) {
            var futures = List.of(executor.submit(attempt), executor.submit(attempt));
            start.countDown();
            var results = List.of(futures.get(0).get(), futures.get(1).get());
            assertThat(results).containsExactlyInAnyOrder("created", "conflict");
        }
    }
}
