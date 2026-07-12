package com.playspace.api;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class SchemaMigrationIntegrationTest {
    @Autowired Flyway flyway;
    @Autowired JdbcTemplate jdbc;

    @Test
    void flywayMigratesTheCompleteSchemaBeforeHibernateValidation() {
        assertThat(flyway.info().current().getVersion().toString()).isEqualTo("1");

        var tables = jdbc.queryForList(
                """
                select table_name
                from information_schema.tables
                where table_schema = 'public'
                """,
                String.class
        );

        assertThat(tables).containsAll(List.of(
                "users",
                "user_sports",
                "user_achievements",
                "court",
                "reservation",
                "payment",
                "notification",
                "activity_log",
                "community_post",
                "partner_ad",
                "championship",
                "achievement",
                "review",
                "flyway_schema_history"
        ));
    }
}
