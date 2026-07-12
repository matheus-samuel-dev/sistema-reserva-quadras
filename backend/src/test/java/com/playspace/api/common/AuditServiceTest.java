package com.playspace.api.common;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.junit.jupiter.api.extension.ExtendWith;

@ExtendWith(MockitoExtension.class)
class AuditServiceTest {
    @Mock
    private ActivityLogRepository activities;

    private AuditService audit;

    @BeforeEach
    void setUp() {
        audit = new AuditService(activities);
        when(activities.save(any(ActivityLog.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void normalizesAndTruncatesFieldsToTheDatabaseColumnLimit() {
        var recorded = audit.record(
                "  admin@playspace.com  ",
                "  Atualizou   a quadra   " + "X".repeat(300),
                "  gestao   de quadras  "
        );

        assertThat(recorded.getActor()).isEqualTo("admin@playspace.com");
        assertThat(recorded.getAction()).hasSize(255).endsWith("…");
        assertThat(recorded.getAction()).startsWith("Atualizou a quadra ");
        assertThat(recorded.getCategory()).isEqualTo("GESTAO DE QUADRAS");
    }

    @Test
    void usesStableFallbacksForMissingAuditInformation() {
        var recorded = audit.record((String) null, "   ", null);

        assertThat(recorded.getActor()).isEqualTo("SISTEMA");
        assertThat(recorded.getAction()).isEqualTo("Acao nao informada");
        assertThat(recorded.getCategory()).isEqualTo("GERAL");
    }
}
