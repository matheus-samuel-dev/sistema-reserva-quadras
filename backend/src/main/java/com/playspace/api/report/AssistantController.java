package com.playspace.api.report;

import com.playspace.api.reservation.ReservationRepository;
import com.playspace.api.security.CurrentUserService;
import java.util.Locale;
import java.util.Map;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
public class AssistantController {
    private final CurrentUserService currentUser;
    private final ReservationRepository reservations;

    public AssistantController(CurrentUserService currentUser, ReservationRepository reservations) {
        this.currentUser = currentUser;
        this.reservations = reservations;
    }

    @PostMapping("/ask")
    Map<String, String> ask(@RequestBody Map<String, String> payload) {
        var user = currentUser.user();
        var question = payload.getOrDefault("question", "").toLowerCase(Locale.ROOT);
        var myReservations = reservations.findByClientIdOrderByDateDescStartTimeDesc(user.getId());
        var answer = "Analisei seus dados PlaySpace: sua modalidade mais forte e " + user.getFavoriteModality()
                + ", com " + user.getHoursOnCourt() + " horas em quadra e " + user.getAttendanceRate() + "% de comparecimento.";
        if (question.contains("gastei") || question.contains("gasto")) {
            answer = "Neste mes, seu gasto demo estimado e R$ 540,00. No ano, voce esta em R$ 4.380,00.";
        } else if (question.contains("ultima")) {
            answer = myReservations.isEmpty()
                    ? "Voce ainda nao possui reservas registradas."
                    : "Sua ultima reserva foi " + myReservations.get(0).getCode() + " na " + myReservations.get(0).getCourt().getName() + ".";
        } else if (question.contains("horario")) {
            answer = "Seu melhor horario historico e 19:00, com maior frequencia e melhor taxa de comparecimento.";
        } else if (question.contains("quadra")) {
            answer = "A quadra que voce mais utiliza e a Quadra Aurora, principalmente para Beach Tennis.";
        }
        return Map.of("assistant", "PlaySpace AI", "answer", answer);
    }
}
