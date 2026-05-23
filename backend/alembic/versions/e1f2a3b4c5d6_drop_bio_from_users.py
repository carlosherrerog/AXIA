"""drop_bio_from_users

Revision ID: e1f2a3b4c5d6
Revises: d29fca8b592f
Create Date: 2026-05-22 19:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'e1f2a3b4c5d6'
down_revision: Union[str, Sequence[str], None] = 'd29fca8b592f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column('users', 'bio')


def downgrade() -> None:
    op.add_column('users', sa.Column('bio', sa.String(300), nullable=True))
