"""add_reference_id_to_notifications

Revision ID: 48b0c0635503
Revises: d95a6b70c51d
Create Date: 2026-05-19 13:24:50.931481

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '48b0c0635503'
down_revision: Union[str, Sequence[str], None] = 'd95a6b70c51d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('notifications', sa.Column('reference_id', sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column('notifications', 'reference_id')
