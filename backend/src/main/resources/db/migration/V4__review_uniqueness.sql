ALTER TABLE review
    ADD CONSTRAINT uq_review_reservation UNIQUE (reservation_id);
