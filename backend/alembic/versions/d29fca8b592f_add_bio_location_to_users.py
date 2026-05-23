"""add_bio_location_to_users

Revision ID: d29fca8b592f
Revises: a1b2c3d4e5f6
Create Date: 2026-05-22 18:20:47.048914

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd29fca8b592f'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('bio', sa.String(300), nullable=True))
    op.add_column('users', sa.Column('location', sa.String(100), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'location')
    op.drop_column('users', 'bio')
