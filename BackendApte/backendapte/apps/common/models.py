from django.db import models


class TimeStampedModel(models.Model):
    """Base commune : horodatage création / modification."""

    created_at = models.DateTimeField("créé le", auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField("modifié le", auto_now=True)

    class Meta:
        abstract = True
