#!/usr/bin/env python
"""Utilitaire en ligne de commande Django."""

import os
import sys


def main() -> None:
    # DJANGO_SETTINGS_MODULE défini dans l'environnement a la priorité
    # (backendapte.settings.prod en production, .test pour la suite de tests).
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backendapte.settings.dev")
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:  # pragma: no cover - environnement incomplet
        raise ImportError(
            "Django est introuvable. Vérifiez que l'environnement virtuel est activé "
            "et que les dépendances sont installées (pip install -r requirements.txt)."
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
