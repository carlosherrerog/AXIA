"""add_auction_bids_table

Revision ID: a1b2c3d4e5f6
Revises: 48b0c0635503
Create Date: 2026-05-21 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '48b0c0635503'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'auction_bids',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('token_id', sa.Integer(), nullable=False),
        sa.Column('bidder_wallet', sa.String(length=42), nullable=False),
        sa.Column('amount_usdc', sa.Float(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['token_id'], ['watches.token_id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_auction_bids_id'), 'auction_bids', ['id'], unique=False)
    op.create_index(op.f('ix_auction_bids_token_id'), 'auction_bids', ['token_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_auction_bids_token_id'), table_name='auction_bids')
    op.drop_index(op.f('ix_auction_bids_id'), table_name='auction_bids')
    op.drop_table('auction_bids')
