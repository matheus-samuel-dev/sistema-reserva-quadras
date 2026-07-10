package com.playspace.api.court;

public enum Modality {
    BEACH_TENNIS("Beach Tennis"),
    FUTEVOLEI("Futevolei"),
    SOCIETY("Society"),
    TENIS("Tenis"),
    VOLEI("Volei"),
    BASQUETE("Basquete");

    private final String label;

    Modality(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
