#!/usr/bin/env python3
"""Gera os ícones do site (favicon, ícones de app, imagem de compartilhamento).

A fonte é a marca CN2O em branco com fundo transparente
(src/assets/cn2o-logo-white.png), recortada em quadrado sobre o vinho da
identidade. Nada aqui roda no build: é um utilitário para quando a marca
mudar. Requer Pillow (`pip install pillow`).

Uso: python3 scripts/gerar-icones.py
"""

from pathlib import Path

from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
MARCA = RAIZ / "src/assets/cn2o-logo-white.png"
SAIDA = RAIZ / "public"

# Vinho da identidade (--primary em src/styles.css, igual ao theme-color).
VINHO = (99, 19, 37)

# Quanto da altura do quadrado a marca ocupa. 0.80 deixa respiro suficiente
# para o ícone não encostar na borda; 0.60 no maskable porque o Android
# recorta tudo fora do círculo central (zona segura de 80%).
OCUPACAO = 0.80
OCUPACAO_MASCARAVEL = 0.60


def compor(ocupacao: float) -> Image.Image:
    """Recorta a marca em quadrado sobre o fundo vinho, na maior resolução."""
    marca = Image.open(MARCA).convert("RGBA")
    caixa = marca.getbbox()
    if caixa is None:
        raise SystemExit(f"{MARCA} não tem pixels visíveis")

    esq, topo, dir_, base = caixa
    altura = base - topo
    lado = round(altura / ocupacao)

    centro_x = (esq + dir_) / 2
    centro_y = (topo + base) / 2
    recorte = (
        round(centro_x - lado / 2),
        round(centro_y - lado / 2),
        round(centro_x + lado / 2),
        round(centro_y + lado / 2),
    )

    # crop() preenche com transparente o que passar da borda da imagem, então
    # o quadrado sai correto mesmo se a marca estiver perto de uma extremidade.
    quadrado = marca.crop(recorte)
    fundo = Image.new("RGBA", quadrado.size, (*VINHO, 255))
    fundo.alpha_composite(quadrado)
    return fundo


def reduzir(imagem: Image.Image, lado: int) -> Image.Image:
    return imagem.resize((lado, lado), Image.Resampling.LANCZOS)


def main() -> None:
    SAIDA.mkdir(exist_ok=True)
    base = compor(OCUPACAO)

    # O Google exige um favicon quadrado de no mínimo 48x48 para exibir na
    # busca; o .ico carrega 16/32/48 para o navegador escolher.
    base.convert("RGB").save(
        SAIDA / "favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48)]
    )
    for lado in (192, 512):
        reduzir(base, lado).save(SAIDA / f"icon-{lado}.png", optimize=True)
    # O iOS aplica o próprio arredondamento e não aceita transparência.
    reduzir(base, 180).convert("RGB").save(
        SAIDA / "apple-touch-icon.png", optimize=True
    )
    reduzir(compor(OCUPACAO_MASCARAVEL), 512).save(
        SAIDA / "icon-maskable-512.png", optimize=True
    )

    # Imagem de compartilhamento (og:image e o "image" do JSON-LD).
    og = Image.new("RGB", (1200, 630), VINHO)
    marca = reduzir(base, 630).crop((0, 0, 630, 630))
    og.paste(marca, ((1200 - 630) // 2, 0))
    og.save(SAIDA / "og-default.jpg", quality=88, optimize=True)

    for arquivo in sorted(SAIDA.iterdir()):
        print(f"{arquivo.name:26} {arquivo.stat().st_size:>7} bytes")


if __name__ == "__main__":
    main()
