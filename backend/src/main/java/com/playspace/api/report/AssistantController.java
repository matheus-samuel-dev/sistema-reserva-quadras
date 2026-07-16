package com.playspace.api.report;

import com.playspace.api.reservation.ReservationRepository;
import com.playspace.api.security.CurrentUserService;
import java.util.Locale;
import java.util.Map;
import java.text.Normalizer;
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
        var question = Normalizer.normalize(payload.getOrDefault("question", "").toLowerCase(Locale.ROOT), Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "");
        var myReservations = reservations.findByClientIdOrderByDateDescStartTimeDesc(user.getId());
        var answer = "Analisei seus dados PlaySpace: sua modalidade mais forte é " + user.getFavoriteModality()
                + ", com " + user.getHoursOnCourt() + " horas em quadra e " + user.getAttendanceRate() + "% de comparecimento.";
        if (question.contains("gastei") || question.contains("gasto")) {
            answer = "Neste mês, seu gasto demo estimado é R$ 540,00. No ano, você está em R$ 4.380,00.";
        } else if (question.contains("ultima")) {
            answer = myReservations.isEmpty()
                    ? "Você ainda não possui reservas registradas."
                    : "Sua última reserva foi " + myReservations.get(0).getCode() + " na " + myReservations.get(0).getCourt().getName() + ".";
        } else if (question.contains("horario")) {
            answer = "Seu melhor horário histórico é 19:00, com maior frequência e melhor taxa de comparecimento.";
        } else if (question.contains("quadra")) {
            answer = "A quadra que você mais utiliza é a Quadra Aurora, principalmente para Beach Tennis.";
        }
        return Map.of("assistant", "PlaySpace AI", "answer", answer);
    }
}
