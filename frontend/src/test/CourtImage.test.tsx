import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CourtImage, getSafeCourtImageSource } from '../components/CourtImage';

describe('CourtImage', () => {
  it('aceita somente fontes de imagem seguras', () => {
    expect(getSafeCourtImageSource('https://cdn.example.com/court.webp')).toBe('https://cdn.example.com/court.webp');
    expect(getSafeCourtImageSource('data:image/png;base64,AA==')).toBe('data:image/png;base64,AA==');
    expect(getSafeCourtImageSource('javascript:alert(1)')).toBeUndefined();
    expect(getSafeCourtImageSource('linear-gradient(135deg, red, blue)')).toBeUndefined();
    expect(getSafeCourtImageSource('data:image/svg+xml,<svg onload="alert(1)"/>')).toBeUndefined();
  });

  it('usa a imagem cadastrada e retorna para a arte da modalidade se ela falhar', () => {
    render(
      <CourtImage
        courtId="c-aurora"
        courtName="Quadra Aurora"
        modality="Beach Tennis"
        image="https://cdn.example.com/court.webp"
      />
    );

    const customImage = screen.getByRole('img', { name: /Vista da Quadra Aurora/ });
    expect(customImage).toHaveAttribute('src', 'https://cdn.example.com/court.webp');

    fireEvent.error(customImage);

    expect(screen.getByRole('img', { name: /Vista da Quadra Aurora/ })).not.toHaveAttribute('src', 'https://cdn.example.com/court.webp');
  });

  it('mostra um estado acessível quando não há imagem nem arte compatível', () => {
    render(<CourtImage courtId="court-without-art" courtName="Quadra Nova" image="javascript:alert(1)" />);

    expect(screen.getByRole('img', { name: /Imagem indisponível/ })).toBeInTheDocument();
    expect(screen.getByText('Imagem indisponível')).toBeInTheDocument();
  });
});
